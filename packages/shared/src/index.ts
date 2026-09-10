import { z } from "zod";

export const magnitudeSchema = z.number().int().min(1).max(4);

export type Magnitude = z.infer<typeof magnitudeSchema>;

export const blueshiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  magnitude: magnitudeSchema,
  createdAt: z.number(),
});

export const createBlueshiftSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  goal: z.string().trim().optional(),
});

export const updateBlueshiftSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").optional(),
    goal: z.string().trim().nullable().optional(),
    magnitude: magnitudeSchema.optional(),
  })
  .refine((value) => "name" in value || "goal" in value || "magnitude" in value);

export const blueshiftStarSchema = z.object({
  id: z.string(),
  blueshiftId: z.string(),
  title: z.string(),
  completedAt: z.number().nullable(),
  northStar: z.boolean(),
  createdAt: z.number(),
});

export const createBlueshiftStarSchema = z.object({ title: z.string().trim().min(1, "Title is required") });
export const updateBlueshiftStarSchema = z
  .object({ completed: z.boolean().optional(), northStar: z.boolean().optional() })
  .refine((value) => "completed" in value || "northStar" in value);

export const redshiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  magnitude: magnitudeSchema,
  createdAt: z.number(),
});

export const createRedshiftSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  goal: z.string().trim().optional(),
});

export const updateRedshiftSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").optional(),
    goal: z.string().trim().nullable().optional(),
    magnitude: magnitudeSchema.optional(),
  })
  .refine((value) => "name" in value || "goal" in value || "magnitude" in value);

export const redshiftStarSchema = z.object({
  id: z.string(),
  redshiftId: z.string(),
  title: z.string(),
  completedAt: z.number().nullable(),
  createdAt: z.number(),
});

export const createRedshiftStarSchema = z.object({ title: z.string().trim().min(1, "Title is required") });
export const updateRedshiftStarSchema = z.object({ completed: z.boolean() });

export type Blueshift = Readonly<z.infer<typeof blueshiftSchema>>;
export type CreateBlueshift = z.infer<typeof createBlueshiftSchema>;
export type UpdateBlueshift = z.infer<typeof updateBlueshiftSchema>;
export type BlueshiftStar = Readonly<z.infer<typeof blueshiftStarSchema>>;
export type CreateBlueshiftStar = z.infer<typeof createBlueshiftStarSchema>;
export type UpdateBlueshiftStar = z.infer<typeof updateBlueshiftStarSchema>;

export type Redshift = Readonly<z.infer<typeof redshiftSchema>>;
export type CreateRedshift = z.infer<typeof createRedshiftSchema>;
export type UpdateRedshift = z.infer<typeof updateRedshiftSchema>;
export type RedshiftStar = Readonly<z.infer<typeof redshiftStarSchema>>;
export type CreateRedshiftStar = z.infer<typeof createRedshiftStarSchema>;
export type UpdateRedshiftStar = z.infer<typeof updateRedshiftStarSchema>;

export const settingsSchema = z.object({
  id: z.number(),
  timezone: z.string().nullable(),
});

export const updateSettingsSchema = z.object({
  timezone: z.string().nullable(),
});

export type Settings = Readonly<z.infer<typeof settingsSchema>>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
