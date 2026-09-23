import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CreateNodeDialog from "./CreateNodeDialog.vue";

describe("CreateNodeDialog", () => {
  it("only offers the three supported node types", async () => {
    const wrapper = mount(CreateNodeDialog);

    expect(wrapper.get("dialog").attributes("aria-labelledby")).toBe(
      "create-node-title",
    );
    expect(
      wrapper.findAll("option").map((option) => option.element.value),
    ).toEqual(["sendMessage", "addComment", "businessHours"]);
    expect(wrapper.findAll("textarea")[1].attributes("placeholder")).toBe(
      "Enter message",
    );

    await wrapper.get("select").setValue("addComment");

    expect(wrapper.findAll("textarea")[1].attributes("placeholder")).toBe(
      "Enter comment",
    );
  });

  it("creates a business-hours node with its supported type", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("select").setValue("businessHours");
    await wrapper.get("input").setValue("Office hours");
    await wrapper.get("textarea").setValue("When the team is available");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")[0][0]).toMatchObject({
      type: "businessHours",
      data: { action: "businessHours", timezone: "UTC" },
    });
  });

  it("validates required fields before creating a node", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")).toBeUndefined();
    expect(wrapper.findAll("small").map((error) => error.text())).toEqual([
      "Title is required.",
      "Description is required.",
      "Message is required.",
    ]);
  });

  it("clears form state when cancelled", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("select").setValue("addComment");
    await wrapper.get("input").setValue("Internal note");
    await wrapper.findAll("textarea")[0].setValue("A description");
    await wrapper.findAll("textarea")[1].setValue("A comment");
    await wrapper.get(".secondary").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.get("select").element.value).toBe("sendMessage");
    expect(wrapper.get("input").element.value).toBe("");
    expect(
      wrapper.findAll("textarea").map((field) => field.element.value),
    ).toEqual(["", ""]);
  });

  it("clears form state after creating a node", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("input").setValue("Welcome");
    await wrapper.findAll("textarea")[0].setValue("Welcome message");
    await wrapper.findAll("textarea")[1].setValue("Hello");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")).toHaveLength(1);
    expect(wrapper.get("input").element.value).toBe("");
    expect(
      wrapper.findAll("textarea").map((field) => field.element.value),
    ).toEqual(["", ""]);
  });
});
