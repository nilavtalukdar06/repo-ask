import z from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "name is too short"),
  githubUrl: z.url("url is not valid"),
  apiKeyPrefix: z.string().optional(),
});

export const profileUpdateSchema = profileSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });
