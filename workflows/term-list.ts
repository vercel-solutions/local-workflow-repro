import { createWebhook, type RequestWithResponse } from "workflow";

/**
 * This workflow iterates over a webhook. Calling the webhook adds a
 * term to the list and responds with the updated list.
 *
 * Local dev issues:
 * - When the dev server is started for the first time, before the `.well-known` directory is created,
 *   the workflow starts but stays in a pending state indefinitely, and a fetch error is thrown in the logs.
 * - When attempting to resume the workflow from a server action with `resumeWorkflow`, the workflow appears
 *   to respond according to the logs, but the client never receives a response (request stuck as pending).
 * - When making a change to the workflow while the dev server is running, it stop responding to requests,
 *   similarly leaving the client hanging until it times out at 5 minutes (also seen with streams).
 */
export async function termListWorkflow(token: string) {
  "use workflow";

  const webhook = createWebhook({
    token: `termlist-workflow:${token}`,
    respondWith: "manual",
  });

  const terms = [];

  for await (const request of webhook) {
    const data = await request.json();
    const { term, command } = data;

    if (command === "stop") {
      break;
    }

    if (term) {
      terms.push(term);
    }

    await respondWithTerms(request, terms);
  }

  return terms;
}

async function respondWithTerms(request: RequestWithResponse, terms: string[]) {
  "use step";

  await request.respondWith(
    new Response(JSON.stringify({ terms }), {
      headers: { "Content-Type": "application/json" },
    }),
  );

  console.log("[Workflow] Responded with terms", terms);
}
