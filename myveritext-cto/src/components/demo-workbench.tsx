"use client";

import { useEffect, useMemo, useState } from "react";

type Matter = {
  id: string;
  referenceNumber: string;
  title: string;
  venue?: string | null;
  caseType?: string | null;
  openedAt?: string;
};

type Job = {
  id: string;
  status: string;
  scheduledStart: string;
  location?: string | null;
  notes?: string | null;
  matterId: string;
};

type RecordItem = {
  id: string;
  matterId: string;
  type: "TRANSCRIPT" | "EXHIBIT";
  title: string;
  originalFileName: string;
  uploadedAt: string;
  status: string;
};

type Activity = { id: string; text: string; at: string };

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function statusChip(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: "bg-sky-500/20 text-sky-700 border-sky-400/30",
    IN_PROGRESS: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    COMPLETED: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    CANCELED: "bg-rose-500/20 text-rose-200 border-rose-400/30",
    READY: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    PROCESSING: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-700 border-slate-400/30";
}

export function DemoWorkbench({ defaultUserId, defaultMatterId }: { defaultUserId: string; defaultMatterId: string }) {
  const [userId, setUserId] = useState(defaultUserId);
  const [idToken, setIdToken] = useState("");

  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterId, setMatterId] = useState(defaultMatterId);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);

  const [searchQ, setSearchQ] = useState("deposition");
  const [searchResult, setSearchResult] = useState<Array<{ kind: string; title: string; subtitle: string }>>([]);
  const [summary, setSummary] = useState("");
  const [graphqlInsight, setGraphqlInsight] = useState("");

  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);

  const headers = useMemo(() => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": userId,
    };
    if (idToken.trim()) h.Authorization = `Bearer ${idToken.trim()}`;
    return h;
  }, [userId, idToken]);

  const selectedMatter = matters.find((m) => m.id === matterId);
  const matterJobs = jobs.filter((j) => j.matterId === matterId).sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));

  function pushActivity(text: string) {
    setActivity((prev) => [{ id: crypto.randomUUID(), text, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
  }

  async function refresh() {
    setErrorText("");
    setBusy("refresh");

    const [mattersResp, jobsResp, recordsResp] = await Promise.all([
      fetch("/api/matters", { headers, cache: "no-store" }),
      fetch("/api/jobs", { headers, cache: "no-store" }),
      fetch("/api/records", { headers, cache: "no-store" }),
    ]);

    const mattersJson = await safeJson(mattersResp);
    const jobsJson = await safeJson(jobsResp);
    const recordsJson = await safeJson(recordsResp);

    if (!mattersResp.ok) {
      setErrorText(`GET /api/matters failed (${mattersResp.status}): ${JSON.stringify(mattersJson).slice(0, 400)}`);
      setBusy("");
      return;
    }
    if (!jobsResp.ok) {
      setErrorText(`GET /api/jobs failed (${jobsResp.status}): ${JSON.stringify(jobsJson).slice(0, 400)}`);
      setBusy("");
      return;
    }
    if (!recordsResp.ok) {
      setErrorText(`GET /api/records failed (${recordsResp.status}): ${JSON.stringify(recordsJson).slice(0, 400)}`);
      setBusy("");
      return;
    }

    const nextMatters = mattersJson.data ?? [];
    setMatters(nextMatters);
    if ((!matterId || !nextMatters.find((m: Matter) => m.id === matterId)) && nextMatters[0]?.id) {
      setMatterId(nextMatters[0].id);
    }

    setJobs(jobsJson.data ?? []);
    setRecords(recordsJson.data ?? []);
    setBusy("");
    pushActivity("Data refreshed from live APIs");
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createJob() {
    if (!matterId) return;
    setBusy("create-job");
    const resp = await fetch("/api/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        matterId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: "Remote",
        notes: "Scheduled from UX rebuild demo",
      }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`POST /api/jobs failed (${resp.status}): ${JSON.stringify(json).slice(0, 400)}`);
      setBusy("");
      return;
    }
    await refresh();
    setBusy("");
    pushActivity("Created a new proceeding from UI");
  }

  async function markInProgress() {
    const target = matterJobs[0];
    if (!target) return;
    setBusy("status");
    const resp = await fetch(`/api/jobs/${target.id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`PATCH /api/jobs/:id/status failed (${resp.status}): ${JSON.stringify(json).slice(0, 400)}`);
      setBusy("");
      return;
    }
    await refresh();
    setBusy("");
    pushActivity("Moved proceeding to IN_PROGRESS");
  }

  async function runSearch() {
    if (!matterId) return;
    setBusy("search");
    const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}&matterId=${encodeURIComponent(matterId)}`, {
      headers,
      cache: "no-store",
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`GET /api/search failed (${resp.status}): ${JSON.stringify(json).slice(0, 400)}`);
      setBusy("");
      return;
    }

    const cards = [
      ...(json.data?.matters ?? []).map((m: Matter) => ({ kind: "Matter", title: m.title, subtitle: m.referenceNumber })),
      ...(json.data?.records ?? []).map((r: RecordItem) => ({ kind: r.type, title: r.title, subtitle: r.originalFileName })),
    ].slice(0, 6);

    setSearchResult(cards);
    setBusy("");
    pushActivity(`Executed search for “${searchQ}”`);
  }

  async function runSummary() {
    if (!matterId) return;
    setBusy("summary");
    const resp = await fetch("/api/ai/summary", {
      method: "POST",
      headers,
      body: JSON.stringify({ matterId, prompt: "Summarize key testimony and next actions" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`POST /api/ai/summary failed (${resp.status}): ${JSON.stringify(json).slice(0, 400)}`);
      setBusy("");
      return;
    }

    setSummary(json?.data?.summary ?? "No summary returned");
    setBusy("");
    pushActivity("Generated AI summary with citations");
  }

  async function runGraphql() {
    setBusy("graphql");
    const resp = await fetch("/api/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: "query { matters { id referenceNumber title jobs { id status } } }" }),
    });
    const json = await safeJson(resp);
    if (!resp.ok || json.errors) {
      setErrorText(`POST /api/graphql failed (${resp.status}): ${JSON.stringify(json).slice(0, 400)}`);
      setBusy("");
      return;
    }

    const m = json?.data?.matters?.[0];
    if (m) {
      setGraphqlInsight(`${m.referenceNumber}: ${m.jobs.length} proceedings loaded in a single query.`);
    }
    setBusy("");
    pushActivity("Ran GraphQL cross-entity query");
  }

  const matterRecords = records.filter((r) => r.matterId === matterId).slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-sky-700">Session Access</h2>
        <p className="mt-1 text-sm text-slate-600">Set the same headers your secured Cloud Run API expects.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">x-user-id</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Bearer ID Token</label>
            <input value={idToken} onChange={(e) => setIdToken(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-50 px-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={refresh} className="mt-3 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-100" disabled={busy !== ""}>
          {busy === "refresh" ? "Refreshing..." : "Reload Workspace"}
        </button>
        {errorText ? <pre className="mt-3 overflow-auto rounded-lg bg-rose-950/50 p-3 text-xs text-rose-100">{errorText}</pre> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-sky-300">Matter Workspace</p>
              <h3 className="mt-1 text-2xl font-semibold">{selectedMatter?.title ?? "No matter selected"}</h3>
              <p className="text-sm text-slate-500">{selectedMatter?.referenceNumber} · {selectedMatter?.venue ?? "Venue TBD"} · {selectedMatter?.caseType ?? "Case type"}</p>
            </div>
            <select
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-50 px-3 py-2 text-sm"
            >
              {matters.length === 0 ? <option value="">No matters available</option> : null}
              {matters.map((m) => (
                <option key={m.id} value={m.id}>{m.referenceNumber} — {m.title}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={createJob} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500" disabled={busy !== "" || !matterId}>
              {busy === "create-job" ? "Creating..." : "Schedule Proceeding"}
            </button>
            <button onClick={markInProgress} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500" disabled={busy !== "" || matterJobs.length === 0}>
              {busy === "status" ? "Updating..." : "Mark In Progress"}
            </button>
            <button onClick={runGraphql} className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-100" disabled={busy !== ""}>
              Run GraphQL Insight
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming Proceedings</p>
              <div className="mt-3 space-y-2">
                {matterJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{new Date(job.scheduledStart).toLocaleString()}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusChip(job.status)}`}>{job.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{job.location ?? "Location TBD"}</p>
                  </div>
                ))}
                {matterJobs.length === 0 ? <p className="text-xs text-slate-500">No proceedings yet.</p> : null}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Records (Transcripts + Exhibits)</p>
              <div className="mt-3 space-y-2">
                {matterRecords.slice(0, 4).map((record) => (
                  <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{record.title}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusChip(record.status)}`}>{record.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{record.originalFileName}</p>
                  </div>
                ))}
                {matterRecords.length === 0 ? <p className="text-xs text-slate-500">No records loaded.</p> : null}
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-300">AI + Search Assistant</p>
          <div className="mt-3 flex gap-2">
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-50 px-3 py-2 text-sm" />
            <button onClick={runSearch} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500" disabled={busy !== "" || !matterId}>Search</button>
          </div>
          <button onClick={runSummary} className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-sm hover:bg-violet-500" disabled={busy !== "" || !matterId}>Generate AI Summary</button>

          <div className="mt-4 space-y-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
              <p className="mt-2 text-sm text-slate-700">{summary || "Run AI Summary to populate this panel."}</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Search Results</p>
              <div className="mt-2 space-y-2">
                {searchResult.length === 0 ? <p className="text-xs text-slate-500">No search run yet.</p> : null}
                {searchResult.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="text-xs text-sky-700">{item.kind}</p>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">GraphQL Insight</p>
              <p className="mt-2 text-sm text-slate-700">{graphqlInsight || "Run GraphQL Insight to show cross-entity retrieval."}</p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Activity</p>
              <div className="mt-2 space-y-1">
                {activity.length === 0 ? <p className="text-xs text-slate-500">No actions yet.</p> : null}
                {activity.map((a) => (
                  <p key={a.id} className="text-xs text-slate-600">[{a.at}] {a.text}</p>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
