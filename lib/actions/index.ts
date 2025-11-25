"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { resumeWebhook } from "workflow/api";

/**
 * Triggers the term list webhook directly with `resumeWebhook`, sending the term to the workflow.
 *
 * Local dev bug:
 * This request is stuck pending and never completes on the client side.
 */
export async function triggerWebhookWithResume(term: string) {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  const request = new Request("http://localhost/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term }),
  });

  try {
    const { terms } = await resumeWebhook(
      `termlist-workflow:${token}`,
      request,
    ).then((r) => r.json());
    return terms;
  } catch (_) {
    throw new Error("Webhook not found");
  }
}

/**
 * Triggers the term list webhook via route handler. Works locally and deployed.
 */
export async function triggerWebhookWithApiRoute(term: string) {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  try {
    const { terms } = await fetch(getWebhookUrl(token), {
      method: "POST",
      body: JSON.stringify({ term }),
    }).then((r) => r.json());

    return terms;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to trigger webhook via API route");
  }
}

/**
 * Triggers the term list webhook to stop the workflow.
 */
export async function stopWorkflow() {
  const token = (await cookies()).get("workflow_token")?.value;
  if (!token) {
    throw new Error("Token not found");
  }

  const request = new Request("http://localhost/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: "stop" }),
  });

  try {
    await resumeWebhook(`termlist-workflow:${token}`, request);

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateTag("workflow-status");
  } catch (_) {
    throw new Error("Webhook not found");
  }
}

function getWebhookUrl(token: string) {
  const host = process.env.VERCEL_URL || "localhost:3000";
  const protocol = process.env.VERCEL_URL ? "https" : "http";
  console.log(host);
  console.log(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  console.log(process.env.VERCEL_ENV);
  return `${protocol}://${host}/.well-known/workflow/v1/webhook/termlist-workflow%3A${token}`;
}
