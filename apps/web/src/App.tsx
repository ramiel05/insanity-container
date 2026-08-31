import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "./lib/api";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";

async function getTasks() {
  const response = await api.api.tasks.$get();
  if (!response.ok) throw new Error("Could not load tasks");
  return response.json();
}

export default function App() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: getTasks });
  const createTask = useMutation({
    mutationFn: async (taskTitle: string) => {
      const response = await api.api.tasks.$post({ json: { title: taskTitle } });
      if (!response.ok) throw new Error("Could not create task");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await api.api.tasks[":id"].$patch({ param: { id }, json: { completed } });
      if (!response.ok) throw new Error("Could not update task");
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || createTask.isPending) return;
    createTask.mutate(title.trim(), { onSuccess: () => setTitle("") });
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-accent">Personal command center</p>
            <h1 className="font-display text-5xl leading-none tracking-tight sm:text-7xl">Contain the chaos.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-muted">A quiet place for the next useful thing. Keep momentum without losing the plot.</p>
          </div>
          <ConfirmDialog title="About">
            <h2 className="font-display text-2xl">Built for focus.</h2>
            <p className="mt-2 text-sm leading-6 text-muted">This local-first workspace keeps your tasks on your machine.</p>
          </ConfirmDialog>
        </header>

        <form onSubmit={submit} className="mb-10 flex gap-2 rounded-2xl border border-line bg-paper p-2 shadow-sm">
          <input aria-label="New task" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted/60" />
          <button className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent/90 disabled:opacity-50" disabled={!title.trim() || createTask.isPending}>Add task</button>
        </form>

        <section aria-labelledby="tasks-heading">
          <div className="mb-4 flex items-center justify-between"><h2 id="tasks-heading" className="text-sm font-bold uppercase tracking-[0.16em] text-muted">Open loops</h2><span className="text-sm text-muted">{tasks.data?.length ?? 0} total</span></div>
          <div className="space-y-2">
            {tasks.isLoading && <p className="py-8 text-center text-muted">Loading your loops...</p>}
            {tasks.isError && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">The server is unavailable. Start it with <code>bun run dev</code>.</p>}
            {tasks.data?.map((task) => <label key={task.id} className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-paper p-4 transition hover:border-accent/50"><input type="checkbox" checked={task.completed} onChange={(event) => toggleTask.mutate({ id: task.id, completed: event.target.checked })} className="size-5 accent-accent" /><span className={task.completed ? "text-muted line-through" : "text-ink"}>{task.title}</span></label>)}
            {tasks.data?.length === 0 && !tasks.isLoading && <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">Nothing competing for your attention yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
