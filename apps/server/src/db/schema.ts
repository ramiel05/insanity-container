import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const blueshifts = sqliteTable("blueshifts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const blueshiftStars = sqliteTable("blueshift_stars", {
  id: text("id").primaryKey(),
  blueshiftId: text("blueshift_id").notNull().references(() => blueshifts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completedAt: integer("completed_at", { mode: "number" }),
  northStar: integer("north_star", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const redshifts = sqliteTable("redshifts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const redshiftStars = sqliteTable("redshift_stars", {
  id: text("id").primaryKey(),
  redshiftId: text("redshift_id").notNull().references(() => redshifts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completedAt: integer("completed_at", { mode: "number" }),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});
