import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { getWorkflow, postWorkflowMutation } from "./flowService.js";

export const workflowQueryKey = ["workflow"];
export const WORKFLOW_AUTOSAVE_DELAY = 10_000;
const businessDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function toWorkflowUi(workflow) {
  return workflow.map(({ data = {}, name, description, ...node }) => {
    const payload = data.payload ?? [];

    return {
      ...node,
      title: name,
      description: description ?? "",
      message: payload.find((part) => part.type === "text")?.text ?? "",
      attachments: payload
        .filter((part) => part.type === "attachment")
        .map((part) => part.attachment),
      comment: data.comment ?? "",
      timezone: data.timezone ?? "UTC",
      times: businessDays.map((day) => {
        const time = data.times?.find((item) => item.day === day);

        return {
          day,
          startTime: time?.startTime ?? "",
          endTime: time?.endTime ?? "",
        };
      }),
      connectorType: data.connectorType,
    };
  });
}

function createWorkflowNode(workflow, input) {
  return [
    ...workflow,
    {
      id: `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      parentId: input.parentId ?? -1,
      name: input.name,
      description: input.description ?? "",
      type: input.type,
      data: input.data ?? {},
    },
  ];
}

function updateWorkflowNode(workflow, draft) {
  return workflow.map((node) => {
    if (String(node.id) !== String(draft.id)) {
      return node;
    }

    const data = { ...node.data };

    if (node.type === "sendMessage") {
      data.payload = [
        ...(draft.message ? [{ type: "text", text: draft.message }] : []),
        ...draft.attachments.map((attachment) => ({
          type: "attachment",
          attachment,
        })),
      ];
    }

    if (node.type === "addComment") {
      data.comment = draft.comment;
    }

    if (["dateTime", "businessHours"].includes(node.type)) {
      data.timezone = draft.timezone;
      data.times = draft.times.map(({ day, startTime, endTime }) => ({
        day,
        startTime,
        endTime,
      }));
    }

    return {
      ...node,
      name: draft.title,
      description: draft.description,
      data,
    };
  });
}

function deleteWorkflowNode(workflow, id) {
  const idsToDelete = new Set([String(id)]);
  let foundChild = true;

  while (foundChild) {
    foundChild = false;
    workflow.forEach((node) => {
      if (
        idsToDelete.has(String(node.parentId)) &&
        !idsToDelete.has(String(node.id))
      ) {
        idsToDelete.add(String(node.id));
        foundChild = true;
      }
    });
  }

  return workflow.filter((node) => !idsToDelete.has(String(node.id)));
}

function useWorkflowAutosave() {
  const queryClient = useQueryClient();
  let timer;
  let isPosting = false;
  let postAfterCurrent = false;
  const isScheduled = ref(false);
  const {
    isError,
    isPending,
    mutate: postWorkflow,
    reset,
  } = useMutation({
    mutationFn: (workflow) => postWorkflowMutation(workflow),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workflowQueryKey,
        refetchType: "none",
      }); // refetchType: 'none' to avoid refetching the workflow from the server, since we already have the updated workflow from the mutation response
    },
  });

  function saveWorkflow() {
    timer = undefined;
    isScheduled.value = false;

    if (isPosting) {
      postAfterCurrent = true;
      return;
    }

    isPosting = true;
    postWorkflow(
      structuredClone(queryClient.getQueryData(workflowQueryKey) ?? []),
      {
        onSettled: () => {
          isPosting = false;

          if (postAfterCurrent) {
            postAfterCurrent = false;
            saveWorkflow();
          }
        },
      },
    );
  }

  function scheduleWorkflowSave() {
    clearTimeout(timer);
    reset();
    isScheduled.value = true;
    timer = setTimeout(saveWorkflow, WORKFLOW_AUTOSAVE_DELAY);
  }

  function retryWorkflowSave() {
    reset();
    saveWorkflow();
  }

  return {
    isError,
    isPending,
    isScheduled,
    retryWorkflowSave,
    scheduleWorkflowSave,
  };
}

export function useWorkflowQuery() {
  const query = useQuery({
    queryKey: workflowQueryKey,
    queryFn: getWorkflow,
    select: toWorkflowUi,
  });
  const autosave = useWorkflowAutosave();

  function useWorkflowMutation(applyChange) {
    const queryClient = useQueryClient();

    return (input) => {
      const workflow = queryClient.getQueryData(workflowQueryKey);

      if (!workflow) {
        return;
      }

      const updatedWorkflow = applyChange(workflow, input);
      queryClient.setQueryData(workflowQueryKey, updatedWorkflow);
      autosave.scheduleWorkflowSave();
      return updatedWorkflow;
    };
  }

  return {
    ...query,
    isMutationError: autosave.isError,
    isMutationPending: autosave.isPending,
    isScheduled: autosave.isScheduled,
    retryWorkflowSave: autosave.retryWorkflowSave,
    scheduleWorkflowSave: autosave.scheduleWorkflowSave,
    createWorkflowNodeMutation: useWorkflowMutation(createWorkflowNode),
    updateWorkflowNodeMutation: useWorkflowMutation(updateWorkflowNode),
    deleteWorkflowNodeMutation: useWorkflowMutation(deleteWorkflowNode),
  };
}
