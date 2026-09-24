import { computed, ref } from "vue";
import { workflowQueryKey } from "../api/flowQueries.js";

export const MAX_WORKFLOW_HISTORY_SNAPSHOTS = 50;

function cloneSnapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

function isSameSnapshot(first, second) {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function createWorkflowHistory({
  flowUi,
  queryClient,
  scheduleWorkflowSave,
}) {
  const snapshots = ref([]);
  const currentIndex = ref(-1);
  const canUndo = computed(() => currentIndex.value > 0);
  const canRedo = computed(
    () => currentIndex.value < snapshots.value.length - 1,
  );

  function takeSnapshot() {
    return {
      workflow: cloneSnapshot(queryClient.getQueryData(workflowQueryKey) ?? []),
      positions: cloneSnapshot(flowUi.positionsByNodeId),
    };
  }

  function applySnapshot(snapshot) {
    const currentWorkflow = queryClient.getQueryData(workflowQueryKey) ?? [];
    const workflowChanged =
      JSON.stringify(currentWorkflow) !== JSON.stringify(snapshot.workflow);

    queryClient.setQueryData(
      workflowQueryKey,
      cloneSnapshot(snapshot.workflow),
    );
    flowUi.replaceNodePositions(cloneSnapshot(snapshot.positions));

    if (workflowChanged) {
      scheduleWorkflowSave();
    }
  }

  function recordChange(change) {
    const before = takeSnapshot();
    const result = change();
    const after = takeSnapshot();

    if (isSameSnapshot(before, after)) {
      return result;
    }

    if (currentIndex.value < 0) {
      snapshots.value.push(before);
      currentIndex.value = 0;
    }

    snapshots.value.splice(currentIndex.value + 1);
    snapshots.value.push(after);
    currentIndex.value = snapshots.value.length - 1;

    const overflow = snapshots.value.length - MAX_WORKFLOW_HISTORY_SNAPSHOTS;
    if (overflow > 0) {
      snapshots.value.splice(0, overflow);
      currentIndex.value -= overflow;
    }

    return result;
  }

  function undo() {
    if (!canUndo.value) return;

    currentIndex.value -= 1;
    applySnapshot(snapshots.value[currentIndex.value]);
  }

  function redo() {
    if (!canRedo.value) return;

    currentIndex.value += 1;
    applySnapshot(snapshots.value[currentIndex.value]);
  }

  return { canRedo, canUndo, recordChange, redo, undo };
}
