import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { healthCheck } from "@/functions/health-check";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [healthCheck],
});
