import { TaskBoard } from "@/components/TaskBoard";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-700 bg-clip-text text-transparent">
                Welcome to Task.io
              </span>
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {isSupabaseConfigured() ? (
          <TaskBoard />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase is not configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project URL and anon key.
          </div>
        )}
      </main>
    </div>
  );
}
