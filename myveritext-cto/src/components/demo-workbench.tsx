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

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

export function DemoWorkbench({ defaultUserId, defaultMatterId }: { defaultUserId: string; defaultMatterId: string }) {
  const [userId, setUserId] = useState(defaultUserId);
  const [idToken, setIdToken] = useState("");
  const [matterId, setMatterId] = useState(defaultMatterId);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQ, setSearchQ] = useState("deposition");
  const [searchResult, setSearchResult] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [graphqlResult, setGraphqlResult] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [busy, setBusy] = useState<string>("");

  const headers = useMemo(() => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": userId,
    };
    if (idToken.trim()) h.Authorization = `Bearer ${idToken.trim()}`;
    return h;
  }, [userId, idToken]);

  async function refresh() {
    setErrorText("");
    const mattersResp = await fetch("/api/matters", { headers, cache: "no-store" });
    const mattersJson = await safeJson(mattersResp);

    if (!mattersResp.ok) {
      setErrorText(`GET /api/matters failed (${mattersResp.status}): ${JSON.stringify(mattersJson).slice(0, 600)}`);
      setMatters([]);
      return;
    }

    const nextMatters = mattersJson.data ?? [];
    setMatters(nextMatters);
    if ((!matterId || !nextMatters.find((m: Matter) => m.id === matterId)) && nextMatters[0]?.id) {
      setMatterId(nextMatters[0].id);
    }

    const jobsResp = await fetch("/api/jobs", { headers, cache: "no-store" });
    const jobsJson = await safeJson(jobsResp);
    if (!jobsResp.ok) {
      setErrorText(`GET /api/jobs failed (${jobsResp.status}): ${JSON.stringify(jobsJson).slice(0, 600)}`);
      setJobs([]);
      return;
    }

    setJobs(jobsJson.data ?? []);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createJob() {
    setBusy("create-job");
    setErrorText("");
    const resp = await fetch("/api/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        matterId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: "Remote",
        notes: "UI demo proceeding",
      }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`POST /api/jobs failed (${resp.status}): ${JSON.stringify(json).slice(0, 600)}`);
      setBusy("");
      return;
    }
    await refresh();
    setBusy("");
  }

  async function markInProgress() {
    if (!jobs[0]) return;
    setBusy("update-job");
    setErrorText("");
    const resp = await fetch(`/api/jobs/${jobs[0].id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`PATCH /api/jobs/:id/status failed (${resp.status}): ${JSON.stringify(json).slice(0, 600)}`);
      setBusy("");
      return;
    }
    await refresh();
    setBusy("");
  }

  async function runSearch() {
    setBusy("search");
    setErrorText("");
    const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}&matterId=${encodeURIComponent(matterId)}`, {
      headers,
      cache: "no-store",
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`GET /api/search failed (${resp.status}): ${JSON.stringify(json).slice(0, 600)}`);
      setBusy("");
      return;
    }
    setSearchResult(JSON.stringify(json.data, null, 2));
    setBusy("");
  }

  async function runSummary() {
    setBusy("summary");
    setErrorText("");
    const resp = await fetch("/api/ai/summary", {
      method: "POST",
      headers,
      body: JSON.stringify({ matterId, prompt: "Summarize key testimony and next actions" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`POST /api/ai/summary failed (${resp.status}): ${JSON.stringify(json).slice(0, 600)}`);
      setBusy("");
      return;
    }
    setSummary(json?.data?.summary ?? "No summary returned");
    setBusy("");
  }

  async function runGraphql() {
    setBusy("graphql");
    setErrorText("");
    const resp = await fetch("/api/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "query { matters { id referenceNumber title jobs { id status } } }" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok || json.errors) {
      setErrorText(`POST /api/graphql failed (${resp.status}): ${JSON.stringify(json).slice(0, 600)}`);
      setBusy("");
      return;
    }
    setGraphqlResult(JSON.stringify(json.data, null, 2));
    setBusy("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold text-sky-200">Demo Credentials / Access</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">x-user-id</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Bearer ID Token (optional but needed for auth-required Cloud Run)</label>
            <input value={idToken} onChange={(e) => setIdToken(e.target.value)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={refresh} className="mt-3 rounded border border-slate-600 px-3 py-2 text-sm" disabled={busy !== ""}>
          Reload Data
        </button>
        {errorText ? <pre className="mt-3 overflow-auto rounded bg-rose-950/60 p-3 text-xs text-rose-100">{errorText}</pre> : null}
      </section>

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
            {matters.length === 0 ? <option value="">No matters loaded</option> : null}
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.referenceNumber} — {m.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={createJob} className="rounded bg-sky-600 px-3 py-2 text-sm font-medium" disabled={busy !== "" || !matterId}>
            {busy === "create-job" ? "Creating..." : "Create Job"}
          </button>
          <button onClick={markInProgress} className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium" disabled={busy !== "" || jobs.length === 0}>
            {busy === "update-job" ? "Updating..." : "Mark Latest In Progress"}
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
          <button onClick={runSearch} className="rounded bg-emerald-600 px-3 py-2 text-sm" disabled={busy !== "" || !matterId}>
            Search
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={runSummary} className="rounded bg-violet-600 px-3 py-2 text-sm" disabled={busy !== "" || !matterId}>
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
