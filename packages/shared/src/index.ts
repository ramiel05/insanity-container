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

export const blueshiftStarSchema = z.object({
  id: z.string(),
  blueshiftId: z.string(),
  title: z.string(),
  completedAt: z.number().nullable(),
  northStar: z.boolean(),
  createdAt: z.number(),
});

export const createBlueshiftStarSchema = z.object({ title: z.string().trim().min(1, "Title is required") });
export const updateBlueshiftStarSchema = z.object({ completed: z.boolean().optional(), northStar: z.boolean().optional() }).refine((value) => value.completed !== undefined || value.northStar !== undefined);

export type Blueshift = z.infer<typeof blueshiftSchema>;
export type CreateBlueshift = z.infer<typeof createBlueshiftSchema>;
export type BlueshiftStar = z.infer<typeof blueshiftStarSchema>;
export type CreateBlueshiftStar = z.infer<typeof createBlueshiftStarSchema>;
export type UpdateBlueshiftStar = z.infer<typeof updateBlueshiftStarSchema>;
