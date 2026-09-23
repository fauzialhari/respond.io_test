import { describe, expect, it } from "vitest";
import { uploadAttachment } from "./attachmentService.js";

describe("uploadAttachment", () => {
  it("returns a placeholder image URL for an uploaded file", async () => {
    await expect(uploadAttachment({ name: "welcome.png" })).resolves.toMatch(
      /^https:\/\/picsum\.photos\/seed\/.+\/240\/160$/,
    );
  });

  it("rejects an upload without a file name", async () => {
    await expect(uploadAttachment({})).rejects.toThrow(
      "Choose a file to upload.",
    );
  });
});
