export async function uploadAttachment(file) {
  if (!file?.name) {
    throw new Error("Choose a file to upload.");
  }

  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Replace this placeholder response with the real upload API response later.
  return `https://picsum.photos/seed/${seed}/240/160`;
}
