"use client";

import { TaskCard } from "@/components/TaskCard";
import type { TaskStatus, TaskWithAssignee } from "@/lib/types";

type TaskColumnProps = {
  title: string;
  status: TaskStatus;
  tasks: TaskWithAssignee[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: TaskWithAssignee) => void;
  showDivider?: boolean;
};

export function TaskColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  showDivider = false,
}: TaskColumnProps) {
  return (
    <section
      className={`flex min-h-[28rem] min-w-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ${showDivider ? "lg:border-l lg:pl-6" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
            {title}
          </h2>
          <p className="text-xs text-zinc-400">{tasks.length} tasks</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-10 text-center text-sm text-zinc-500">
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
          ))
        )}
      </div>
    </section>
  );
}
