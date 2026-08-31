import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.number(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  projectId: z.string().optional(),
});

export const updateTaskSchema = z.object({ completed: z.boolean() });

export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
