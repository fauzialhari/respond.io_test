import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NodeDetailsPanel from "./NodeDetailsPanel.vue";

const uploadAttachmentMock = vi.hoisted(() => vi.fn());
const originalShowModal = HTMLDialogElement.prototype.showModal;
let showModal;

vi.mock("../api/attachmentService.js", () => ({
  uploadAttachment: uploadAttachmentMock,
}));

const messageNode = {
  data: {
    id: "welcome",
    name: "Welcome Message",
    type: "sendMessage",
    data: {
      payload: [
        { type: "text", text: "Hello there" },
        { type: "attachment", attachment: "image.jpg" },
      ],
    },
  },
};

const businessHoursNode = {
  data: {
    id: "hours",
    name: "Business Hours",
    type: "dateTime",
    data: {
      timezone: "UTC",
      times: [
        { day: "mon", startTime: "09:00", endTime: "17:00" },
        { day: "tue", startTime: "10:00", endTime: "18:00" },
      ],
    },
  },
};

describe("NodeDetailsPanel", () => {
  function mountPanel(node) {
    return mount(NodeDetailsPanel, {
      props: { node },
      global: { plugins: [createPinia()] },
    });
  }

  beforeEach(() => {
    showModal = vi.fn(function openModal() {
      this.open = true;
    });
    HTMLDialogElement.prototype.showModal = showModal;
  });

  afterEach(() => {
    if (originalShowModal) {
      HTMLDialogElement.prototype.showModal = originalShowModal;
    } else {
      delete HTMLDialogElement.prototype.showModal;
    }
  });

  it("opens as a native modal dialog and closes on Escape", async () => {
    const wrapper = mountPanel(messageNode);
    const dialog = wrapper.get("dialog");

    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.element.open).toBe(true);

    await dialog.trigger("cancel");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("renders node-specific message and attachment details", () => {
    const wrapper = mountPanel(messageNode);

    expect(wrapper.get("h2").text()).toBe("Welcome Message");
    expect(wrapper.get("label").text()).toContain("Title");
    expect(wrapper.findAll("textarea")[0].element.value).toBe("");
    expect(wrapper.findAll("textarea")[1].element.value).toBe("Hello there");
    expect(wrapper.findAll(".attachment-tile")).toHaveLength(1);
    expect(wrapper.get("img").attributes("src")).toBe("image.jpg");
  });

  it("emits close from the close control", async () => {
    const wrapper = mountPanel(messageNode);

    await wrapper.get('[aria-label="Close details"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits a Vue Query-compatible update payload from save", async () => {
    const wrapper = mountPanel(messageNode);

    await wrapper.get("input").setValue("Updated title");
    await wrapper.findAll("textarea")[0].setValue("Updated description");
    await wrapper.findAll("textarea")[1].setValue("Updated message");
    await wrapper.get(".save-button").trigger("click");

    const payload = wrapper.emitted("save")[0][0];

    expect(payload.id).toBe("welcome");
    expect(payload.changes.name).toBe("Updated title");
    expect(payload.changes.description).toBe("Updated description");
    expect(payload.changes.data.payload[0]).toEqual({
      type: "text",
      text: "Updated message",
    });
  });

  it("uploads a new attachment preview and includes it in the saved payload", async () => {
    uploadAttachmentMock.mockResolvedValueOnce(
      "https://picsum.photos/seed/new-file/240/160",
    );
    const wrapper = mountPanel(messageNode);
    const input = wrapper.get('input[type="file"]');

    Object.defineProperty(input.element, "files", {
      configurable: true,
      value: [{ name: "new-file.png" }],
    });
    await input.trigger("change");
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(uploadAttachmentMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "new-file.png" }),
    );
    expect(wrapper.findAll(".attachment-tile")).toHaveLength(2);

    await wrapper.get(".save-button").trigger("click");

    expect(wrapper.emitted("save")[0][0].changes.data.payload).toContainEqual({
      type: "attachment",
      attachment: "https://picsum.photos/seed/new-file/240/160",
    });
  });

  it("confirms before emitting the selected node ID for deletion", async () => {
    const wrapper = mountPanel(messageNode);

    await wrapper.get(".delete-button").trigger("click");

    expect(wrapper.get(".delete-confirmation").element.open).toBe(true);
    expect(wrapper.emitted("delete")).toBeUndefined();

    await wrapper.get(".confirm-delete-button").trigger("click");

    expect(wrapper.emitted("delete")[0]).toEqual(["welcome"]);
  });

  it("does not delete when the confirmation is cancelled", async () => {
    const wrapper = mountPanel(messageNode);

    await wrapper.get(".delete-button").trigger("click");
    await wrapper.get(".confirmation-actions button").trigger("click");

    expect(wrapper.emitted("delete")).toBeUndefined();
  });

  it("renders seven editable business-hour rows and saves their time values", async () => {
    const wrapper = mountPanel(businessHoursNode);
    const timeInputs = wrapper.findAll('input[type="time"]');

    expect(timeInputs).toHaveLength(14);
    expect(timeInputs[0].element.value).toBe("09:00");
    expect(timeInputs[2].element.value).toBe("10:00");

    await timeInputs[0].setValue("08:30");
    await wrapper.get(".save-button").trigger("click");

    expect(wrapper.emitted("save")[0][0].changes.data.times[0]).toEqual({
      day: "mon",
      startTime: "08:30",
      endTime: "17:00",
    });
  });
});
