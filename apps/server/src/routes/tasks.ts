import { createTaskSchema, updateTaskSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { projects, tasks } from "../db/schema";

const defaultProjectId = "default";

async function ensureDefaultProject() {
  const existing = await db.select().from(projects).where(eq(projects.id, defaultProjectId)).get();
  if (!existing) {
    await db.insert(projects).values({ id: defaultProjectId, name: "Personal", createdAt: Date.now() });
  }
  return defaultProjectId;
}

export const taskRoutes = new Hono()
  .get("/", async (c) => c.json(await db.select().from(tasks).orderBy(tasks.createdAt)))
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const input = c.req.valid("json");
    const projectId = input.projectId ?? await ensureDefaultProject();
    const task = {
      id: crypto.randomUUID(),
      projectId,
      title: input.title,
      completed: false,
      createdAt: Date.now(),
    };
    await db.insert(tasks).values(task);
    return c.json(task, 201);
  })
  .patch("/:id", zValidator("json", updateTaskSchema), async (c) => {
    const [task] = await db.update(tasks).set(c.req.valid("json")).where(eq(tasks.id, c.req.param("id"))).returning();
    if (!task) return c.json({ error: "Task not found" }, 404);
    return c.json(task);
  });
