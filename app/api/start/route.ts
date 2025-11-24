import { start } from "workflow/api";
import { termListWorkflow } from "@/workflows/term-list";

export async function POST(request: Request) {
  const { token } = await request.json();

  const run = await start(termListWorkflow, [token]);

  return Response.json({
    message: "Workflow started",
    runId: run.runId,
  });
}
