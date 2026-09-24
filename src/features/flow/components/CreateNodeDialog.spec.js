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
    expect(wrapper.findAll("textarea")).toHaveLength(1);

    await wrapper.get("select").setValue("addComment");

    expect(wrapper.findAll("textarea")).toHaveLength(1);
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

    const title = wrapper.get("input");

    expect(title.attributes("required")).toBeDefined();
    expect(title.element.validity.valid).toBe(false);
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")).toBeUndefined();
    expect(wrapper.get(".field-error").text()).toBe(
      "Enter a title to continue.",
    );
  });

  it("allows an empty description", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("input").setValue("Welcome");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")[0][0]).toMatchObject({
      name: "Welcome",
      description: "",
    });
  });

  it("clears form state when cancelled", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("select").setValue("addComment");
    await wrapper.get("input").setValue("Internal note");
    await wrapper.get("textarea").setValue("A description");
    await wrapper.get(".secondary").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.get("select").element.value).toBe("sendMessage");
    expect(wrapper.get("input").element.value).toBe("");
    expect(wrapper.get("textarea").element.value).toBe("");
  });

  it("clears form state after creating a node", async () => {
    const wrapper = mount(CreateNodeDialog);

    await wrapper.get("input").setValue("Welcome");
    await wrapper.get("textarea").setValue("Welcome message");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("create")).toHaveLength(1);
    expect(wrapper.get("input").element.value).toBe("");
    expect(wrapper.get("textarea").element.value).toBe("");
  });
});
