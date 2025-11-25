import { cookies } from "next/headers";
import { start } from "workflow/api";
import { termListWorkflow } from "@/workflows/term-list";

/**
 * Starts the term list workflow and updates the cache with the workflow status.
 *
 * Local dev bug:
 * When starting the dev server from a clean state (no `.next` or `app/.well-known` directory),
 * the first time this is called the workflow starts in a pending state and never changes to running.
 * We also see this error in the dev server logs:
 *
 *    [embedded world] Queue operation failed: TypeError: fetch failed
 *        at ignore-listed frames {
 *      [cause]: AggregateError:
 *          at ignore-listed frames {
 *        code: 'ECONNREFUSED'
 *      }
 *    }
 */
export async function POST() {
  const token = crypto.randomUUID();

  console.log("apiroute", process.env.VERCEL_URL);

  try {
    const run = await start(termListWorkflow, [token]);

    const cookieStore = await cookies();
    cookieStore.set("workflow_token", token);
    cookieStore.set("workflow_run_id", run.runId);

    // Give it a second to start before updating the cache
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return Response.json({ runId: run.runId });
  } catch (_) {
    return Response.json(
      { error: "Failed to start workflow" },
      { status: 500 },
    );
  }
}
