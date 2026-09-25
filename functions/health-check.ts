import { inngest } from "@/lib/inngest";

export const healthCheck = inngest.createFunction(
  {
    id: "health-check",
    triggers: {
      event: "app/health.check",
    },
  },
  async ({ event, step }) => {
    const result = await step.run("health-check", async () => {
      return {
        process: true,
        id: event.data.id,
      };
    });
    return {
      message: `Task ${event.data.id} complete`,
      result,
    };
  },
);
