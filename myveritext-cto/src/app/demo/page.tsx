"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoWorkbench } from "@/components/demo-workbench";

const navItems = [
  "Home",
  "Schedule",
  "Virtual",
  "Exhibit Share",
  "Downloads",
] as const;

type Nav = (typeof navItems)[number];

export default function DemoPage() {
  const [active, setActive] = useState<Nav>("Schedule");

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <img src="https://www.veritext.com/favicon.ico" alt="Veritext" className="h-8 w-8 rounded" />
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-sky-700">VERITEXT</p>
              <h1 className="text-lg font-semibold">MyVeritext</h1>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  active === item ? "bg-sky-700 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <Link href="/" className="mt-8 inline-block text-xs text-slate-500 underline underline-offset-2">
            Back
          </Link>
        </aside>

        <section className="p-6 sm:p-8">
          <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Schedule, Virtual, Exhibits, and Files</h2>
            <p className="mt-1 text-sm text-slate-600">
              Workflow-focused interface for court reporting operations.
            </p>
          </header>

          <DemoWorkbench defaultUserId="user_demo_admin" defaultMatterId="matter_demo_001" initialTab={active.toLowerCase().replace(" ", "-") as never} />
        </section>
      </div>
    </main>
  );
}
