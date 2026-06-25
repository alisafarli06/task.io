"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskColumn } from "@/components/TaskColumn";
import { TaskFormModal, taskToFormValues } from "@/components/TaskFormModal";
import { TeamBar } from "@/components/TeamBar";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
  type TaskWithAssignee,
  type TeamMember,
} from "@/lib/types";

function mapTasksWithAssignees(
  tasks: Task[],
  members: TeamMember[],
): TaskWithAssignee[] {
  const membersById = new Map(members.map((member) => [member.id, member]));

  return tasks.map((task) => ({
    ...task,
    assignee: task.assignee_id
      ? (membersById.get(task.assignee_id) ?? null)
      : null,
  }));
}

export function TaskBoard() {
  const supabase = createSupabaseClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("to_do");

  const loadData = useCallback(async () => {
    setError(null);

    const [membersResult, tasksResult] = await Promise.all([
      supabase.from("team_members").select("*").order("created_at"),
      supabase.from("tasks").select("*").order("position").order("created_at"),
    ]);

    if (membersResult.error) throw membersResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const nextMembers = (membersResult.data ?? []) as TeamMember[];
    const nextTasks = mapTasksWithAssignees(
      (tasksResult.data ?? []) as Task[],
      nextMembers,
    );

    setMembers(nextMembers);
    setTasks(nextTasks);
  }, [supabase]);

  useEffect(() => {
    loadData()
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load board data.",
        );
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  const handleAddMember = async ({
    fullName,
    email,
  }: {
    fullName: string;
    email: string;
  }) => {
    const { error: insertError } = await supabase.from("team_members").insert({
      full_name: fullName,
      email: email || null,
    });

    if (insertError) throw insertError;
    await loadData();
  };

  const handleCreateTask = async (values: {
    title: string;
    summary: string;
    description: string;
    assigneeId: string | null;
    dueAt: string;
    priority: Task["priority"];
    status: TaskStatus;
  }) => {
    const tasksInColumn = tasks.filter((task) => task.status === values.status);
    const position =
      tasksInColumn.length > 0
        ? Math.max(...tasksInColumn.map((task) => task.position)) + 1
        : 0;

    const { error: insertError } = await supabase.from("tasks").insert({
      title: values.title,
      summary: values.summary,
      description: values.description || null,
      assignee_id: values.assigneeId,
      due_at: new Date(values.dueAt).toISOString(),
      priority: values.priority,
      status: values.status,
      position,
    });

    if (insertError) throw insertError;
    await loadData();
  };

  const handleUpdateTask = async (values: {
    title: string;
    summary: string;
    description: string;
    assigneeId: string | null;
    dueAt: string;
    priority: Task["priority"];
    status: TaskStatus;
  }) => {
    if (!editingTask) return;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        title: values.title,
        summary: values.summary,
        description: values.description || null,
        assignee_id: values.assigneeId,
        due_at: new Date(values.dueAt).toISOString(),
        priority: values.priority,
        status: values.status,
      })
      .eq("id", editingTask.id);

    if (updateError) throw updateError;
    await loadData();
  };

  const openCreateTask = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const openEditTask = (task: TaskWithAssignee) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setTaskModalOpen(true);
  };

  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce(
      (groups, status) => {
        groups[status.value] = tasks.filter(
          (task) => task.status === status.value,
        );
        return groups;
      },
      {} as Record<TaskStatus, TaskWithAssignee[]>,
    );
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Loading board…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <TeamBar members={members} onAddMember={handleAddMember} />
        <button
          type="button"
          onClick={() => openCreateTask("to_do")}
          className="rounded-xl border border-sky-200 bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md"
        >
          Create Task
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {TASK_STATUSES.map((status, index) => (
            <TaskColumn
              key={status.value}
              title={status.label}
              status={status.value}
              tasks={tasksByStatus[status.value]}
              onAddTask={openCreateTask}
              onEditTask={openEditTask}
              showDivider={index > 0}
            />
          ))}
        </div>
      </div>

      <TaskFormModal
        open={taskModalOpen}
        title={editingTask ? "Edit Task" : "Create Task"}
        members={members}
        initialValues={
          editingTask
            ? taskToFormValues(editingTask)
            : { status: defaultStatus }
        }
        submitLabel={editingTask ? "Save Changes" : "Create Task"}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />
    </>
  );
}
