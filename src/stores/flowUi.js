import { defineStore } from "pinia";

let retrySave;

export const useFlowUiStore = defineStore("flow-ui", {
  state: () => ({
    selectedNodeId: null,
    isCreateDialogOpen: false,
    syncStatus: "saved",
    positionsByNodeId: {},
  }),

  actions: {
    setSyncStatus(status, retry) {
      this.syncStatus = status;
      retrySave = retry;
    },

    retry() {
      retrySave?.();
    },

    setNodePosition(id, position, layoutDirection) {
      this.positionsByNodeId[String(id)] = { position, layoutDirection };
    },

    keepNodePositions(nodeIds) {
      const activeIds = new Set(nodeIds.map(String));

      Object.keys(this.positionsByNodeId).forEach((id) => {
        if (!activeIds.has(id)) {
          delete this.positionsByNodeId[id];
        }
      });
    },

    replaceNodePositions(positions) {
      this.positionsByNodeId = positions;
    },
  },
});
