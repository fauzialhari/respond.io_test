import { defineStore } from "pinia";
import { toRaw } from "vue";

const businessDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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

      const data = structuredClone(toRaw(node.data ?? {}));
      const payload = data.payload ?? [];

      this.detailsForm = {
        nodeId: String(node.id),
        type: node.type,
        name: node.name ?? "Conversation opened",
        description: node.description ?? "",
        message: payload.find((part) => part.type === "text")?.text ?? "",
        comment: data.comment ?? "",
        attachments: payload
          .filter((part) => part.type === "attachment")
          .map((part) => part.attachment),
        timezone: data.timezone ?? "UTC",
        times: businessDays.map((day) => {
          const time = data.times?.find((item) => item.day === day);

          return {
            day,
            startTime: time?.startTime ?? "",
            endTime: time?.endTime ?? "",
          };
        }),
        data,
      };
    },

    clearDetailsForm() {
      this.detailsForm = null;
    },

    getDetailsFormChanges() {
      const form = this.detailsForm;
      const data = structuredClone(toRaw(form.data));

      if (form.type === "sendMessage") {
        data.payload = [
          { type: "text", text: form.message },
          ...form.attachments.map((attachment) => ({
            type: "attachment",
            attachment,
          })),
        ];
      }

      if (form.type === "addComment") {
        data.comment = form.comment;
      }

      if (["dateTime", "businessHours"].includes(form.type)) {
        data.timezone = form.timezone;
        data.times = form.times.map(({ day, startTime, endTime }) => ({
          day,
          startTime,
          endTime,
        }));
      }

      return {
        id: form.nodeId,
        changes: {
          name: form.name,
          description: form.description,
          data,
        },
      };
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
