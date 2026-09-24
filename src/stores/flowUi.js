import { defineStore } from "pinia";

export const useFlowUiStore = defineStore("flow-ui", {
  state: () => ({
    selectedNodeId: null,
    isCreateDialogOpen: false,
    positionsByNodeId: {},
    detailsForm: null,
  }),

  actions: {
    setDetailsForm(node) {
      if (this.detailsForm?.nodeId === String(node.id)) {
        return;
      }

      this.detailsForm = {
        id: String(node.id),
        type: node.type,
        title: node.title,
        description: node.description ?? "",
        message: node.message,
        comment: node.comment,
        attachments: [...node.attachments],
        timezone: node.timezone,
        times: node.times.map((time) => ({ ...time })),
      };
    },

    clearDetailsForm() {
      this.detailsForm = null;
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
