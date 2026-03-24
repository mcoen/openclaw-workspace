const pillars = [
  {
    title: "UX",
    summary: "Matter-centric workflow with 2-click high-frequency actions.",
  },
  {
    title: "Reliability",
    summary: "Idempotent APIs, queue retries, observability and SLO tracking.",
  },
  {
    title: "AI",
    summary: "Semantic search + proceeding summaries with source citations.",
  },
  {
    title: "Compliance",
    summary: "RBAC, immutable audit trails, retention controls, legal hold hooks.",
  },
  {
    title: "Architecture",
    summary: "Modular domains with Cloud Run deploy and event-driven processing.",
  },
];

const fridayScope = [
  "Scheduling: create / edit / cancel jobs",
  "Transcript + exhibit workspace with versioned uploads",
  "Search across records (keyword + semantic)",
  "AI summary panel with cited lines",
  "RBAC + audit logs",
  "GCP deployment with health checks",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.16em] text-sky-300">MyVeritext 2.0</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">CTO Demo Control Panel</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Greenfield prototype for a Friday interview demo, optimized for measurable
            product impact and production-ready engineering practices on GCP.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-sky-200">{pillar.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{pillar.summary}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Friday MVP Scope</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {fridayScope.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[2px] text-emerald-300">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-sky-800/60 bg-sky-950/40 p-6 text-sm text-sky-100">
          <p className="font-semibold">Current status</p>
          <p className="mt-2">
            Data model and API scaffolding are now in place. See <code>docs/DB-SCHEMA.md</code>
            and <code>docs/OBJECT-MODEL.md</code> for visuals used in the CTO narrative.
          </p>
        </section>
      </div>
    </main>
  );
}
