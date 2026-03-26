"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Matter = { id: string; referenceNumber: string; title: string };
type Job = { id: string; matterId: string; scheduledStart: string; status: string; location?: string | null; notes?: string | null };
type RecordItem = { id: string; matterId: string; title: string; originalFileName: string; status: string; type: "TRANSCRIPT" | "EXHIBIT" };

type View = "home" | "schedule" | "proceeding" | "downloads" | "exhibit-share";

async function safeJson(resp: Response) {
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

export function DemoWorkbench({ defaultUserId, defaultMatterId }: { defaultUserId: string; defaultMatterId: string }) {
  const [view, setView] = useState<View>("home");
  const [userId, setUserId] = useState(defaultUserId);
  const [idToken, setIdToken] = useState("");
  const [matters, setMatters] = useState<Matter[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [matterId, setMatterId] = useState(defaultMatterId);

  const [scheduleMode, setScheduleMode] = useState<"list" | "calendar">("list");
  const [calendarSpan, setCalendarSpan] = useState<"month" | "week" | "day">("month");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [proceedingType, setProceedingType] = useState("Deposition");
  const [newLocation, setNewLocation] = useState("Remote");

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [errorText, setErrorText] = useState("");

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json", "x-user-id": userId };
    if (idToken.trim()) h.Authorization = `Bearer ${idToken.trim()}`;
    return h;
  }, [idToken, userId]);

  const matterJobs = jobs.filter((j) => j.matterId === matterId);
  const matterRecords = records.filter((r) => r.matterId === matterId);

  const refresh = useCallback(async () => {
    setErrorText("");
    const [mResp, jResp, rResp] = await Promise.all([
      fetch("/api/matters", { headers, cache: "no-store" }),
      fetch("/api/jobs", { headers, cache: "no-store" }),
      fetch("/api/records", { headers, cache: "no-store" }),
    ]);
    const [mJson, jJson, rJson] = await Promise.all([safeJson(mResp), safeJson(jResp), safeJson(rResp)]);
    if (!mResp.ok || !jResp.ok || !rResp.ok) {
      setErrorText(`API error: matters=${mResp.status}, jobs=${jResp.status}, records=${rResp.status}`);
      return;
    }
    setMatters(mJson.data ?? []);
    setJobs(jJson.data ?? []);
    setRecords(rJson.data ?? []);
  }, [headers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function createProceeding() {
    await fetch("/api/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        matterId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: newLocation,
        notes: `${proceedingType} scheduled from wizard`,
      }),
    });
    setShowWizard(false);
    setWizardStep(1);
    await refresh();
  }

  function toggleFile(id: string) {
    setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={userId} onChange={(e) => setUserId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="x-user-id" />
          <input value={idToken} onChange={(e) => setIdToken(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Bearer token" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["home", "Home Queue"],
            ["schedule", "Schedule"],
            ["proceeding", "Proceeding"],
            ["downloads", "Downloads"],
            ["exhibit-share", "Exhibit Share"],
          ] as Array<[View, string]>).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-2 text-sm ${view === v ? "bg-sky-600 text-white" : "border border-slate-300 bg-white"}`}>{label}</button>
          ))}
          <button onClick={refresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Reload</button>
        </div>
        {errorText ? <p className="mt-2 text-sm text-rose-600">{errorText}</p> : null}
      </section>

      {view === "home" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold">Today’s Queue</h3>
          <p className="mt-1 text-sm text-slate-600">Focused operational actions replacing fragmented entry points.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Upcoming proceedings</p><p className="text-2xl font-semibold">{matterJobs.length}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Files ready</p><p className="text-2xl font-semibold">{matterRecords.filter(r=>r.status==="READY").length}</p></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">Matters</p><p className="text-2xl font-semibold">{matters.length}</p></div>
          </div>
        </section>
      ) : null}

      {view === "schedule" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Scheduling, Modifying, and Canceling Jobs</h3>
            <button onClick={() => setShowWizard(true)} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">SCHEDULE</button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <button onClick={() => setScheduleMode("list")} className={`rounded px-2 py-1 ${scheduleMode === "list" ? "bg-sky-600 text-white" : "border border-slate-300"}`}>List</button>
            <button onClick={() => setScheduleMode("calendar")} className={`rounded px-2 py-1 ${scheduleMode === "calendar" ? "bg-sky-600 text-white" : "border border-slate-300"}`}>Calendar</button>
            {scheduleMode === "calendar" ? (
              <>
                <span className="mx-2 text-slate-400">|</span>
                {(["month", "week", "day"] as const).map((s) => (
                  <button key={s} onClick={() => setCalendarSpan(s)} className={`rounded px-2 py-1 ${calendarSpan === s ? "bg-slate-900 text-white" : "border border-slate-300"}`}>{s[0].toUpperCase() + s.slice(1)}</button>
                ))}
              </>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {matterJobs.map((j) => (
              <div key={j.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium">{new Date(j.scheduledStart).toLocaleString()} · {j.location ?? "Location TBD"}</p>
                <p className="text-xs text-slate-500">{j.status}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {view === "proceeding" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold">Accessing Veritext Virtual</h3>
          <p className="mt-1 text-sm text-slate-600">Preflight and join actions in one place.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">TAKE SPEED TEST</button>
            <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">JOIN VIRTUAL</button>
          </div>
        </section>
      ) : null}

      {view === "downloads" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold">Files Ready & Downloads</h3>
          <p className="mt-1 text-sm text-slate-600">Single download and bulk zip flow.</p>
          <div className="mt-4 space-y-2">
            {matterRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedFiles.includes(r.id)} onChange={() => toggleFile(r.id)} />
                  <span>{r.title}</span>
                </label>
                <button className="rounded border border-slate-300 px-2 py-1 text-xs">Download</button>
              </div>
            ))}
          </div>
          <button className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" disabled={selectedFiles.length === 0}>DOWNLOAD SELECTED (.zip)</button>
        </section>
      ) : null}

      {view === "exhibit-share" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold">Exhibit Share</h3>
          <p className="mt-1 text-sm text-slate-600">Link account once, launch quickly from proceeding context.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Exhibit Share username" />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Exhibit Share password" type="password" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Link Account</button>
            <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">Go to Exhibit Share</button>
          </div>
        </section>
      ) : null}

      {showWizard ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-lg font-semibold">Schedule Proceeding</h4>
            {wizardStep === 1 ? (
              <div className="mt-3 space-y-3">
                <select value={proceedingType} onChange={(e) => setProceedingType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option>Deposition</option><option>Hearing</option><option>Arbitration</option>
                </select>
                <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white" onClick={() => setWizardStep(2)}>Next</button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Location" />
                <div className="flex gap-2">
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => setWizardStep(1)}>Back</button>
                  <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white" onClick={createProceeding}>Schedule</button>
                </div>
              </div>
            )}
            <button className="mt-3 text-xs text-slate-500 underline" onClick={() => setShowWizard(false)}>Close</button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs text-slate-500">Matter</label>
        <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {matters.map((m) => <option key={m.id} value={m.id}>{m.referenceNumber} — {m.title}</option>)}
        </select>
      </section>
    </div>
  );
}
