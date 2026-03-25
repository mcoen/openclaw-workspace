import Link from "next/link";
import { DemoWorkbench } from "@/components/demo-workbench";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-sky-300">Live Product Demo</p>
            <h1 className="mt-1 text-3xl font-bold">MyVeritext 2.0 Workflow Experience</h1>
            <p className="mt-2 text-sm text-slate-300">
              Click-through interface for scheduling, search, AI summarization, and GraphQL-backed
              retrieval.
            </p>
          </div>
          <Link href="/" className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900">
            Back to Control Panel
          </Link>
        </div>

        <DemoWorkbench defaultUserId="user_demo_admin" defaultMatterId="matter_demo_001" />
      </div>
    </main>
  );
}
