export async function getWorkflow() {
  const response = await fetch("/payload.json");

  if (!response.ok) {
    throw new Error(`Unable to load workflow (${response.status})`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("The workflow payload must be an array of nodes");
  }

  return payload;
}

export async function postWorkflowMutation(workflow) {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });

  if (!response.ok) {
    throw new Error("Unable to sync workflow changes");
  }

  // Return the payload instead of the response since this is just a mock API and we want to keep the workflow in sync with the local state
  // Normally the server would return the updated workflow, but since this is a mock API, we just return the payload we sent
  return workflow;
}
