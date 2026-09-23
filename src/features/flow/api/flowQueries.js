import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { getWorkflow, postWorkflowMutation } from "./flowService.js";

export const workflowQueryKey = ["workflow"];
export const WORKFLOW_AUTOSAVE_DELAY = 10_000;

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

function updateWorkflowNode(workflow, { id, changes }) {
  return workflow.map((node) =>
    String(node.id) !== String(id)
      ? node
      : {
          ...node,
          ...changes,
          data: changes.data ? { ...node.data, ...changes.data } : node.data,
        },
  );
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
  });
  const autosave = useWorkflowAutosave();

  function useWorkflowMutation(applyChange) {
    const queryClient = useQueryClient();

    return (input, options) => {
      const workflow = queryClient.getQueryData(workflowQueryKey);

      if (!workflow) {
        return;
      }

      const updatedWorkflow = applyChange(workflow, input);
      queryClient.setQueryData(workflowQueryKey, updatedWorkflow);
      options?.onSuccess?.(updatedWorkflow);
      autosave.scheduleWorkflowSave();
    };
  }

  return {
    ...query,
    isMutationError: autosave.isError,
    isMutationPending: autosave.isPending,
    isScheduled: autosave.isScheduled,
    retryWorkflowSave: autosave.retryWorkflowSave,
    createWorkflowNodeMutation: useWorkflowMutation(createWorkflowNode),
    updateWorkflowNodeMutation: useWorkflowMutation(updateWorkflowNode),
    deleteWorkflowNodeMutation: useWorkflowMutation(deleteWorkflowNode),
  };
}
