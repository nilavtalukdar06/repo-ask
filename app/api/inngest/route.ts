import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { healthCheck } from "@/functions/health-check";
import { indexRepository } from "@/functions/index-repository";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [healthCheck, indexRepository],
});
