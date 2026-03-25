"use client";

import { useEffect, useMemo, useState } from "react";

type Matter = {
  id: string;
  referenceNumber: string;
  title: string;
};

type Job = {
  id: string;
  status: string;
  scheduledStart: string;
  matterId: string;
};

export function DemoWorkbench({ defaultUserId, defaultMatterId }: { defaultUserId: string; defaultMatterId: string }) {
  const [matterId, setMatterId] = useState(defaultMatterId);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQ, setSearchQ] = useState("deposition");
  const [searchResult, setSearchResult] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [graphqlResult, setGraphqlResult] = useState<string>("");
  const [busy, setBusy] = useState<string>("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-user-id": defaultUserId,
    }),
    [defaultUserId],
  );

  async function refresh() {
    const mattersResp = await fetch("/api/matters", { headers, cache: "no-store" });
    const mattersJson = await mattersResp.json();
    const nextMatters = mattersJson.data ?? [];
    setMatters(nextMatters);

    if (!matterId && nextMatters[0]?.id) setMatterId(nextMatters[0].id);

    const jobsResp = await fetch("/api/jobs", { headers, cache: "no-store" });
    const jobsJson = await jobsResp.json();
    setJobs(jobsJson.data ?? []);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createJob() {
    setBusy("create-job");
    await fetch("/api/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        matterId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: "Remote",
        notes: "UI demo proceeding",
      }),
    });
    await refresh();
    setBusy("");
  }

  async function markInProgress() {
    if (!jobs[0]) return;
    setBusy("update-job");
    await fetch(`/api/jobs/${jobs[0].id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    await refresh();
    setBusy("");
  }

  async function runSearch() {
    setBusy("search");
    const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}&matterId=${encodeURIComponent(matterId)}`, {
      headers,
      cache: "no-store",
    });
    const json = await resp.json();
    setSearchResult(JSON.stringify(json.data, null, 2));
    setBusy("");
  }

  async function runSummary() {
    setBusy("summary");
    const resp = await fetch("/api/ai/summary", {
      method: "POST",
      headers,
      body: JSON.stringify({ matterId, prompt: "Summarize key testimony and next actions" }),
    });
    const json = await resp.json();
    setSummary(json?.data?.summary ?? "No summary returned");
    setBusy("");
  }

  async function runGraphql() {
    setBusy("graphql");
    const resp = await fetch("/api/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "query { matters { id referenceNumber title jobs { id status } } }" }),
    });
    const json = await resp.json();
    setGraphqlResult(JSON.stringify(json.data, null, 2));
    setBusy("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-sky-200">Matters & Scheduling</h2>
        <p className="mt-1 text-sm text-slate-300">Live operations against deployed APIs.</p>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Matter</label>
          <select
            value={matterId}
            onChange={(e) => setMatterId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.referenceNumber} — {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={createJob} className="rounded bg-sky-600 px-3 py-2 text-sm font-medium" disabled={busy !== ""}>
            {busy === "create-job" ? "Creating..." : "Create Job"}
          </button>
          <button onClick={markInProgress} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium" disabled={busy !== "" || jobs.length === 0}>
            {busy === "update-job" ? "Updating..." : "Mark Latest In Progress"}
          </button>
          <button onClick={refresh} className="rounded border border-slate-600 px-3 py-2 text-sm" disabled={busy !== ""}>
            Refresh
          </button>
        </div>

        <pre className="mt-4 max-h-56 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(jobs.slice(0, 5), null, 2)}</pre>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-sky-200">Search, AI, GraphQL</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Search query"
          />
          <button onClick={runSearch} className="rounded bg-emerald-600 px-3 py-2 text-sm" disabled={busy !== ""}>
            Search
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={runSummary} className="rounded bg-violet-600 px-3 py-2 text-sm" disabled={busy !== ""}>
            Run AI Summary
          </button>
          <button onClick={runGraphql} className="rounded bg-amber-600 px-3 py-2 text-sm" disabled={busy !== ""}>
            Run GraphQL Query
          </button>
        </div>

        <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Search result</p>
        <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{searchResult || "(run search)"}</pre>

        <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">AI summary</p>
        <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{summary || "(run AI summary)"}</pre>

        <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">GraphQL</p>
        <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">{graphqlResult || "(run GraphQL query)"}</pre>
      </section>
    </div>
  );
}
