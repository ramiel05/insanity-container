import { z } from "zod";

export const blueshiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  createdAt: z.number(),
});

export const createBlueshiftSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  goal: z.string().trim().optional(),
});

export const starSchema = z.object({
  id: z.string(),
  blueshiftId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  northStar: z.boolean(),
  createdAt: z.number(),
});

export const createStarSchema = z.object({ title: z.string().trim().min(1, "Title is required") });
export const updateStarSchema = z.object({ completed: z.boolean().optional(), northStar: z.boolean().optional() }).refine((value) => value.completed !== undefined || value.northStar !== undefined);

export type Blueshift = z.infer<typeof blueshiftSchema>;
export type CreateBlueshift = z.infer<typeof createBlueshiftSchema>;
export type Star = z.infer<typeof starSchema>;
export type CreateStar = z.infer<typeof createStarSchema>;
export type UpdateStar = z.infer<typeof updateStarSchema>;
