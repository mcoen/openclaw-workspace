"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Matter = { id: string; referenceNumber: string; title: string; venue?: string | null; caseType?: string | null };
type Job = { id: string; matterId: string; scheduledStart: string; status: string; location?: string | null; notes?: string | null };
type RecordItem = { id: string; matterId: string; title: string; originalFileName: string; status: string; type: "TRANSCRIPT" | "EXHIBIT" };

type Tab = "schedule" | "virtual" | "exhibit" | "downloads";

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

export function DemoWorkbench({ defaultUserId, defaultMatterId, initialTab = "schedule" }: { defaultUserId: string; defaultMatterId: string; initialTab?: Tab | string }) {
  const normalizeTab = (value: string): Tab => {
    if (value === "home") return "schedule";
    if (value === "schedule") return "schedule";
    if (value === "virtual") return "virtual";
    if (value === "exhibit-share") return "exhibit";
    if (value === "downloads") return "downloads";
    return "schedule";
  };

  const [tab, setTab] = useState<Tab>(normalizeTab(initialTab));
  const [userId, setUserId] = useState(defaultUserId);
  const [idToken, setIdToken] = useState("");

  const [matters, setMatters] = useState<Matter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [matterId, setMatterId] = useState(defaultMatterId);

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarRange, setCalendarRange] = useState<"month" | "week" | "day">("month");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [proceedingType, setProceedingType] = useState("Deposition");
  const [proceedingVenue, setProceedingVenue] = useState("Remote");

  const [matterTitle, setMatterTitle] = useState("Acme Holdings v. Northstar Logistics");
  const [matterRef, setMatterRef] = useState("VTX-2026-002");

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [linkedExhibitShare, setLinkedExhibitShare] = useState(false);

  const [status, setStatus] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json", "x-user-id": userId };
    if (idToken.trim()) h.Authorization = `Bearer ${idToken.trim()}`;
    return h;
  }, [idToken, userId]);

  const matterJobs = jobs.filter((j) => j.matterId === matterId).sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  const matterRecords = records.filter((r) => r.matterId === matterId);

  const refresh = useCallback(async () => {
    setErrorText("");
    setStatus("Loading workspace...");
    const [mResp, jResp, rResp] = await Promise.all([
      fetch("/api/matters", { headers, cache: "no-store" }),
      fetch("/api/jobs", { headers, cache: "no-store" }),
      fetch("/api/records", { headers, cache: "no-store" }),
    ]);
    const [mJson, jJson, rJson] = await Promise.all([safeJson(mResp), safeJson(jResp), safeJson(rResp)]);

    if (!mResp.ok || !jResp.ok || !rResp.ok) {
      setErrorText(`Failed to load data: matters=${mResp.status}, jobs=${jResp.status}, records=${rResp.status}`);
      setStatus("");
      return;
    }

    const m = mJson.data ?? [];
    setMatters(m);
    setJobs(jJson.data ?? []);
    setRecords(rJson.data ?? []);

    if ((!matterId || !m.find((x: Matter) => x.id === matterId)) && m[0]?.id) {
      setMatterId(m[0].id);
    }
    setStatus("Workspace updated.");
  }, [headers, matterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function createMatter() {
    setErrorText("");
    setStatus("Creating matter...");
    const resp = await fetch("/api/matters", {
      method: "POST",
      headers,
      body: JSON.stringify({
        organizationId: "org_demo_veritext",
        referenceNumber: matterRef,
        title: matterTitle,
        venue: "NY Supreme Court",
        caseType: "Commercial Litigation",
      }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`Create matter failed (${resp.status}): ${JSON.stringify(json).slice(0, 250)}`);
      setStatus("");
      return;
    }
    await refresh();
    setStatus("Matter created.");
  }

  async function scheduleProceeding() {
    setErrorText("");
    setStatus("Scheduling proceeding...");
    const resp = await fetch("/api/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        matterId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: proceedingVenue,
        notes: `${proceedingType} scheduled from wizard`,
      }),
    });
    const json = await safeJson(resp);
    if (!resp.ok) {
      setErrorText(`Schedule failed (${resp.status}): ${JSON.stringify(json).slice(0, 250)}`);
      setStatus("");
      return;
    }
    setWizardOpen(false);
    setWizardStep(1);
    await refresh();
    setStatus("Proceeding scheduled.");
  }

  function toggleFile(id: string) {
    setSelectedFileIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Session / Access</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="x-user-id" />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={idToken} onChange={(e) => setIdToken(e.target.value)} placeholder="Bearer token (for auth-required Cloud Run)" />
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={refresh} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Reload</button>
          <p className="self-center text-xs text-slate-500">{status}</p>
        </div>
        {errorText ? <p className="mt-2 text-sm text-rose-600">{errorText}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Create Data (in-app)</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_180px_auto]">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={matterTitle} onChange={(e) => setMatterTitle(e.target.value)} placeholder="Matter title" />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={matterRef} onChange={(e) => setMatterRef(e.target.value)} placeholder="Reference #" />
          <button onClick={createMatter} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">Create Matter</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {([
            ["schedule", "Scheduling, Modifying, & Canceling"],
            ["virtual", "Accessing Veritext Virtual"],
            ["exhibit", "Exhibit Share"],
            ["downloads", "Downloading Files"],
          ] as Array<[Tab, string]>).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-2 text-sm ${tab === t ? "bg-sky-600 text-white" : "border border-slate-300 bg-white"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-500">Active matter</label>
          <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>{m.referenceNumber} — {m.title}</option>
            ))}
          </select>
        </div>
      </section>

      {tab === "schedule" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Schedule</h3>
            <button onClick={() => setWizardOpen(true)} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">SCHEDULE</button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <button onClick={() => setViewMode("list")} className={`rounded px-2 py-1 ${viewMode === "list" ? "bg-sky-600 text-white" : "border border-slate-300"}`}>List</button>
            <button onClick={() => setViewMode("calendar")} className={`rounded px-2 py-1 ${viewMode === "calendar" ? "bg-sky-600 text-white" : "border border-slate-300"}`}>Calendar</button>
            {viewMode === "calendar" ? (
              <>
                <span className="mx-1 text-slate-400">|</span>
                {(["month", "week", "day"] as const).map((v) => (
                  <button key={v} onClick={() => setCalendarRange(v)} className={`rounded px-2 py-1 ${calendarRange === v ? "bg-slate-900 text-white" : "border border-slate-300"}`}>{v[0].toUpperCase() + v.slice(1)}</button>
                ))}
              </>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {matterJobs.length === 0 ? <p className="text-sm text-slate-500">No proceedings yet. Use SCHEDULE.</p> : null}
            {matterJobs.map((j) => (
              <div key={j.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium">{new Date(j.scheduledStart).toLocaleString()}</p>
                <p className="text-xs text-slate-500">{j.status} · {j.location ?? "Location TBD"}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "virtual" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Accessing Veritext Virtual</h3>
          <p className="mt-1 text-sm text-slate-600">Recommended: run speed test before joining.</p>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">TAKE SPEED TEST</button>
            <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">JOIN VIRTUAL</button>
          </div>
        </section>
      ) : null}

      {tab === "exhibit" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Accessing Exhibit Share</h3>
          <p className="mt-1 text-sm text-slate-600">Link credentials once, then launch directly from proceeding context.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setLinkedExhibitShare(true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Link Exhibit Share Account</button>
            <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">Go to Exhibit Share</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Status: {linkedExhibitShare ? "Linked" : "Not linked"}</p>
        </section>
      ) : null}

      {tab === "downloads" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Downloading Files through MyVeritext</h3>
          <p className="mt-1 text-sm text-slate-600">Open Files Ready job, pick single files or bulk download zip.</p>
          <div className="mt-4 space-y-2">
            {matterRecords.length === 0 ? <p className="text-sm text-slate-500">No files for this matter yet.</p> : null}
            {matterRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedFileIds.includes(r.id)} onChange={() => toggleFile(r.id)} />
                  <span>{r.title}</span>
                </label>
                <button className="rounded border border-slate-300 px-2 py-1 text-xs">Download</button>
              </div>
            ))}
          </div>
          <button className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" disabled={selectedFileIds.length === 0}>DOWNLOAD ({selectedFileIds.length}) AS ZIP</button>
        </section>
      ) : null}

      {wizardOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-lg font-semibold">Schedule Proceeding</h4>
            {wizardStep === 1 ? (
              <div className="mt-3 space-y-3">
                <label className="text-xs text-slate-500">Proceeding Type</label>
                <select value={proceedingType} onChange={(e) => setProceedingType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option>Deposition</option><option>Hearing</option><option>Arbitration</option>
                </select>
                <button onClick={() => setWizardStep(2)} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">Next</button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <label className="text-xs text-slate-500">Location</label>
                <input value={proceedingVenue} onChange={(e) => setProceedingVenue(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Back</button>
                  <button onClick={scheduleProceeding} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">Schedule</button>
                </div>
              </div>
            )}
            <button onClick={() => setWizardOpen(false)} className="mt-3 text-xs text-slate-500 underline">Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
