"use client";

import { useMemo, useState } from "react";
import { CLASSES, FTOS, FTO_BY, PO_BY, busy, conflicts, extDays, fmt, fmtS, fmtW, iso, isRepeat, isSun, key, ranges, rosterOf, runAutoAssign, setPortal, signed, today, usePortal, D, addDays, type PortalState } from "@/lib/portal/store";
import { DEFAULT_WEEKS, MAX_PHASES, MIN_PHASES, PHASE_COLORS } from "@/lib/portal/sample";
import { PageHeader } from "@/components/portal/page-header";
import { AdminPage, Card, Modal, PoChecklist, Tag, toast } from "./ui";
import { caseSafe } from "@/lib/case-safe";

const shuffle = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

function readyPhase(s: PortalState, c: string) {
  const n = (s.phs[c] || []).findIndex((x) => x !== "Active");
  return n >= 0 && rosterOf(c).every((p) => s.asg[key(p.badge, n)]) ? n : -1;
}

export function PhaseSetup({ initialClass, section = "Coordinator" }: { initialClass?: string; section?: string }) {
  const s = usePortal();
  const [pick, setPick] = useState(initialClass || "");
  const [cls, setCls] = useState<string | null>(initialClass && s.setups[initialClass] ? initialClass : null);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rq, setRq] = useState("");
  const [q, setQ] = useState("");
  const [show, setShow] = useState("all");
  const [auto, setAuto] = useState<{ scope: number[]; one: boolean } | null>(null);
  const [aMode, setAMode] = useState<"empty" | "all">("empty");
  const [aPo, setAPo] = useState<"random" | "pick">("random");
  const [aPicked, setAPicked] = useState<string[]>([]);
  const [actOpen, setActOpen] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [ex, setEx] = useState({ cls: "", phase: 0, days: "", reason: "", picked: [] as string[] });

  const st = cls ? s.setups[cls] : null;
  const roster = useMemo(() => (cls ? rosterOf(cls) : []), [cls]);
  const phases = st ? st.phases : DEFAULT_WEEKS;
  const phs = cls ? s.phs[cls] || [] : [];
  const has = !!cls && !!st;

  const pd = useMemo(() => {
    if (!st || !isSun(st.start)) return [] as ({ s: Date; e: Date } | null)[];
    let cur = D(st.start);
    return st.phases.map((w) => {
      if (!(w > 0)) return null;
      const r = { s: new Date(cur), e: addDays(cur, w * 7 - 1) };
      cur = addDays(cur, w * 7);
      return r;
    });
  }, [st]);
  const tot = phases.reduce((a, w) => a + (+w || 0), 0);
  const last = [...pd].reverse().find(Boolean);
  const wkOK = !!st && phases.every((w) => +w > 0) && isSun(st.start);

  const editSetup = (fn: (x: { start: string; phases: number[] }) => { start: string; phases: number[] }) =>
    cls && setPortal((p) => ({ ...p, setups: { ...p.setups, [cls]: fn(p.setups[cls]) } }));

  function importClass() {
    if (!pick) return;
    setPortal((p) =>
      p.setups[pick]
        ? p
        : { ...p, setups: { ...p.setups, [pick]: { start: "", phases: [...DEFAULT_WEEKS] } }, phs: { ...p.phs, [pick]: DEFAULT_WEEKS.map(() => "Draft" as const) } },
    );
    setCls(pick);
    toast(`${rosterOf(pick).length} Probationary Officers Imported`);
  }

  function removePhase(i: number) {
    if (!cls || phs[i] === "Active") return;
    setPortal((p) => {
      const asg = { ...p.asg };
      rosterOf(cls).forEach((po) => {
        for (let j = i; j < MAX_PHASES; j++) {
          const nx = asg[key(po.badge, j + 1)];
          if (nx) asg[key(po.badge, j)] = nx;
          else delete asg[key(po.badge, j)];
        }
      });
      const ext = p.ext
        .filter((e) => !(PO_BY[e.po].cls === cls && e.phase === i))
        .map((e) => (PO_BY[e.po].cls === cls && e.phase > i ? { ...e, phase: e.phase - 1 } : e));
      return {
        ...p,
        asg,
        ext,
        setups: { ...p.setups, [cls]: { ...p.setups[cls], phases: p.setups[cls].phases.filter((_, j) => j !== i) } },
        phs: { ...p.phs, [cls]: p.phs[cls].filter((_, j) => j !== i) },
      };
    });
  }

  // grid
  let filled = 0;
  let clash = 0;
  let wdn = 0;
  const need = roster.length * phases.length;
  if (has)
    roster.forEach((p) =>
      phases.forEach((_, i) => {
        const k = key(p.badge, i);
        const v = s.asg[k];
        if (v) {
          filled++;
          if (busy(s, p.badge, i, v)) clash++;
          if (s.wd.includes(k)) wdn++;
        }
      }),
    );
  const t = q.toLowerCase();
  const rows = roster.filter((p) => {
    if (t && !(p.name.toLowerCase().includes(t) || p.badge.includes(t))) return false;
    if (show === "open") return phases.some((_, i) => !s.asg[key(p.badge, i)]);
    if (show === "flag")
      return phases.some((_, i) => {
        const k = key(p.badge, i);
        const v = s.asg[k];
        return v && (busy(s, p.badge, i, v) || s.wd.includes(k) || isRepeat(s, p.badge, i));
      });
    return true;
  });
  const done3 = has && wkOK && filled === need;
  const anyActive = phs.includes("Active");
  const cur = !has ? 1 : !wkOK ? 2 : 3;
  const ready = cls ? readyPhase(s, cls) : -1;
  const cf = conflicts(s);

  function setCell(po: string, i: number, v: string) {
    const k = key(po, i);
    setPortal((p) => {
      const asg = { ...p.asg };
      if (v) asg[k] = v;
      else delete asg[k];
      return { ...p, asg, wd: p.wd.filter((x) => x !== k) };
    });
  }

  function runAuto() {
    if (!cls || !auto) return;
    if (aPo === "pick" && !aPicked.length) {
      toast("Select Probationary Officers");
      return;
    }
    const order = aPo === "pick" ? aPicked : shuffle(roster.map((p) => p.badge));
    let res = { placed: 0, left: 0 };
    setPortal((p) => {
      const r = runAutoAssign(p, cls, auto.scope, aMode, order);
      res = r;
      return r.next;
    });
    setAuto(null);
    toast(res.left ? `${res.placed} Assigned · ${res.left} Open` : `${res.placed} Assigned`);
  }

  const activeClasses = CLASSES.filter((c) => s.setups[c.id]?.start);
  const exCls = ex.cls || activeClasses[0]?.id || "";

  return (
    <AdminPage>
      <PageHeader
        section={section}
        title="Phase Setup"
        photo="recruit-run"
        actions={
          <div className="step-wrap">
            {["Import Class", "Phase Weeks", "Assign FTO’s"].map((l, k) => {
              const n = k + 1;
              return (
                <span key={l} className={`step-pill ${n < cur || (n === 3 && done3) ? "done" : n === cur ? "cur" : ""}`}>
                  {n} · {caseSafe(l)}
                </span>
              );
            })}
          </div>
        }
      />

      <section className="card">
        <div className="card-h">
          <h2>
            <span className="num">1</span>Import Academy Class
          </h2>
          {has ? <Tag k="ok">{roster.length} Imported</Tag> : null}
        </div>
        <div className="card-b">
          <div className="row">
            <label className="f" style={{ flex: 1, minWidth: 220 }}>
              Academy Class
              <select value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Select class</option>
                {CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn" disabled={!pick} onClick={importClass}>
              Import Class
            </button>
          </div>
          {has ? (
            <div className="meta" style={{ marginTop: 16 }}>
              <div>
                Class<b>{cls}</b>
              </div>
              <div>
                Academy Graduation<b>{fmt(D(CLASSES.find((c) => c.id === cls)!.grad))}</b>
              </div>
              <div>
                Probationary Officers<b>{roster.length}</b>
              </div>
            </div>
          ) : null}
        </div>
        {has ? (
          <div className="toolbar" style={{ padding: "0 18px 12px" }}>
            <button className="btn ghost sm" onClick={() => setRosterOpen(!rosterOpen)}>
              {rosterOpen ? "Hide Roster" : "View Roster"}
            </button>
            {rosterOpen ? <input type="search" className="srch" placeholder="Search name or badge" aria-label="Search roster" value={rq} onChange={(e) => setRq(e.target.value)} /> : null}
          </div>
        ) : null}
        {has && rosterOpen ? (
          <div style={{ padding: "0 18px 18px" }}>
            <div className="tbl-wrap scrollbox" style={{ maxHeight: 380 }}>
              <table>
                <thead>
                  <tr>
                    <th>Probationary Officer</th>
                    <th>Badge</th>
                    <th>Work Email</th>
                    <th>Work Phone</th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {roster
                    .filter((p) => !rq || (p.name + " " + p.badge).toLowerCase().includes(rq.toLowerCase()))
                    .map((p) => (
                      <tr key={p.badge}>
                        <td className="data">
                          <b>{p.name}</b>
                        </td>
                        <td className="data mono">{p.badge}</td>
                        <td className="data">{p.email}</td>
                        <td className="data mono">{p.phone}</td>
                        <td className="data mono">{p.cls}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className={`card ${has ? "" : "lock"}`}>
        <div className="card-h">
          <h2>
            <span className="num">2</span>Phase Schedule
          </h2>
          {has ? wkOK ? <Tag k="ok">{`${phases.length} Phases · ${tot} Weeks`}</Tag> : <Tag k="w">Incomplete</Tag> : null}
        </div>
        <div className="card-b">
          <div className="row" style={{ marginBottom: 16 }}>
            <label className="f">
              Field Training Start Date
              <input
                type="date"
                className={st && st.start && !isSun(st.start) ? "bad" : ""}
                value={st?.start || ""}
                disabled={anyActive}
                onChange={(e) => editSetup((x) => ({ ...x, start: e.target.value }))}
              />
            </label>
            <div className="meta">
              <div>
                Total Weeks<b>{tot}</b>
              </div>
              <div>
                Projected Completion<b>{last ? fmt(last.e) : "—"}</b>
              </div>
            </div>
          </div>
          <div className="phase-grid">
            {phases.map((w, i) => (
              <div className="ph" key={i}>
                <div className="t">
                  Phase {i + 1}
                  {phases.length > MIN_PHASES && phs[i] !== "Active" ? (
                    <button className="x" aria-label={`Remove phase ${i + 1}`} onClick={() => removePhase(i)}>
                      ×
                    </button>
                  ) : null}
                </div>
                <div className="wkr">
                  <input
                    type="number"
                    min={1}
                    value={w || ""}
                    disabled={phs[i] === "Active"}
                    aria-label={`Phase ${i + 1} weeks`}
                    onChange={(e) => editSetup((x) => ({ ...x, phases: x.phases.map((v, j) => (j === i ? Math.max(0, parseInt(e.target.value) || 0) : v)) }))}
                  />
                  <span>Weeks</span>
                </div>
                <div className="dates">
                  <small>Dates</small>
                  {pd[i] ? `${fmtW(pd[i]!.s)} – ${fmtW(pd[i]!.e)}` : "—"}
                </div>
              </div>
            ))}
            {phases.length < MAX_PHASES ? (
              <button
                type="button"
                className="ph add"
                onClick={() => {
                  editSetup((x) => ({ ...x, phases: [...x.phases, 0] }));
                  if (cls) setPortal((p) => ({ ...p, phs: { ...p.phs, [cls]: [...p.phs[cls], "Draft"] } }));
                }}
              >
                + Add Phase
              </button>
            ) : null}
          </div>
          <div className="bar">{tot ? phases.map((w, i) => <i key={i} style={{ width: `${((+w || 0) / tot) * 100}%`, background: PHASE_COLORS[i] }} />) : null}</div>
        </div>
      </section>

      <section className={`card ${has && wkOK ? "" : "lock"}`}>
        <div className="card-h">
          <h2>
            <span className="num">3</span>FTO Assignments
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {has && wkOK ? (
              <>
                {filled === need ? <Tag k="ok">All Assigned</Tag> : <Tag k="w">{`${filled} / ${need} Assigned`}</Tag>}
                {clash ? <Tag k="e">{`${clash} Conflict${clash > 1 ? "s" : ""}`}</Tag> : null}
                {wdn ? <Tag k="e">{`${wdn} Withdrawn`}</Tag> : null}
              </>
            ) : null}
            <button className="btn sm" onClick={() => { setAMode("empty"); setAPo("random"); setAPicked([]); setAuto({ scope: [Math.max(0, phs.findIndex((x) => x !== "Active"))], one: true }); }}>
              Auto Assign Phase
            </button>
            <button className="btn ghost sm" onClick={() => { setAMode("empty"); setAPo("random"); setAPicked([]); setAuto({ scope: phases.map((_, i) => i).filter((i) => phs[i] !== "Active"), one: false }); }}>
              Auto Assign All Phases
            </button>
          </div>
        </div>
        <div className="toolbar" style={{ padding: "14px 18px 0" }}>
          <input type="search" className="srch" placeholder="Search name or badge" aria-label="Search probationary officers" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="f inl">
            Show
            <select value={show} onChange={(e) => setShow(e.target.value)}>
              <option value="all">All PO’s</option>
              <option value="open">Unassigned</option>
              <option value="flag">Conflicts · Withdrawn · Repeat FTO</option>
            </select>
          </label>
          <span className="cnt">{has ? `${rows.length} of ${roster.length}` : ""}</span>
        </div>
        <div style={{ padding: "12px 18px 18px" }}>
          {has ? (
            <div className="tbl-wrap scrollbox sticky1">
              <table>
                <thead>
                  <tr>
                    <th>Probationary Officer</th>
                    {phases.map((_, i) => (
                      <th key={i}>
                        <span>
                          Phase {i + 1} <span className={`tag ${phs[i] === "Active" ? "ok" : "n"}`} style={{ marginLeft: 4 }}>{phs[i]}</span>
                          <div style={{ fontSize: 10, marginTop: 3 }}>{signed(s, cls!, i).length} Signed Up</div>
                        </span>
                      </th>
                    ))}
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? null : (
                    <tr>
                      <td colSpan={phases.length + 2}>
                        <div className="empty">No matching probationary officers</div>
                      </td>
                    </tr>
                  )}
                  {rows.map((p) => {
                    const r = ranges(s, p.badge) || [];
                    const lastR = [...r].reverse().find(Boolean);
                    return (
                      <tr key={p.badge}>
                        <td className="data">
                          <b>{p.name}</b>
                          <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                            #{p.badge}
                          </div>
                        </td>
                        {phases.map((_, i) => (
                          <GridCell key={i} s={s} po={p.badge} name={p.name} cls={cls!} i={i} range={r[i] ?? null} onPick={setCell} />
                        ))}
                        <td className="mono">{lastR ? fmt(lastR.e) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No class imported</div>
          )}
        </div>
      </section>

      <Card title="Phase Extensions" right={<button className="btn sm" onClick={() => { if (!activeClasses.length) { toast("No Active Schedules"); return; } setEx({ cls: cls && s.setups[cls]?.start ? cls : activeClasses[0].id, phase: 0, days: "", reason: "", picked: [] }); setExtOpen(true); }}>Add Extension</button>}>
        {s.ext.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Probationary Officer</th>
                  <th>Class</th>
                  <th>Phase</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.ext.map((e, k) => {
                  const p = PO_BY[e.po];
                  return (
                    <tr key={k}>
                      <td className="data">
                        <b>{p.name}</b> <span className="mono" style={{ color: "var(--muted)" }}>#{p.badge}</span>
                      </td>
                      <td className="mono">{p.cls}</td>
                      <td>Phase {e.phase + 1}</td>
                      <td className="mono">+{e.days}</td>
                      <td className="data">{e.reason || "—"}</td>
                      <td className="mono">{fmt(D(e.added))}</td>
                      <td>
                        <button className="lnk" onClick={() => { setPortal((x) => ({ ...x, ext: x.ext.filter((_, j) => j !== k) })); toast("Extension Removed"); }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No extensions</div>
        )}
        {cf.length ? (
          <div style={{ marginTop: 16 }}>
            <div className="card-h" style={{ padding: "0 0 10px", border: 0 }}>
              <h2>Assignment Conflicts</h2>
              <Tag k="e">{cf.length}</Tag>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Probationary Officer</th>
                    <th>Class</th>
                    <th>Phase</th>
                    <th>FTO</th>
                    <th>Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {cf.map((a) => {
                    const p = PO_BY[a.po];
                    const f = FTO_BY[a.fto];
                    return (
                      <tr key={a.po + a.i}>
                        <td className="data">
                          <b>{p.name}</b>
                        </td>
                        <td className="mono">{p.cls}</td>
                        <td>Phase {a.i + 1}</td>
                        <td className="data">
                          {f.name} · #{f.badge}
                        </td>
                        <td className="mono">{a.r ? `${fmtS(a.r.s)} – ${fmtS(a.r.e)}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="actions">
        <div className="st">
          Status: <b>{has ? phs.map((x, i) => `Phase ${i + 1} ${x}`).join(" · ") : "Not Started"}</b>
        </div>
        <div>
          <button className="btn ghost" disabled={!has} onClick={() => toast(anyActive ? "Changes Saved" : "Draft Saved")}>
            {anyActive ? "Save Changes" : "Save Draft"}
          </button>
          <button className="btn" disabled={!(has && wkOK && ready >= 0)} onClick={() => setActOpen(true)}>
            Activate Phase
          </button>
        </div>
      </div>

      <Modal
        open={!!auto}
        title={auto && !auto.one ? "Auto Assign · All Phases" : `Auto Assign · Phase ${(auto?.scope[0] ?? 0) + 1}`}
        onClose={() => setAuto(null)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setAuto(null)}>
              Cancel
            </button>
            <button className="btn" onClick={runAuto}>
              Assign
            </button>
          </>
        }
      >
        {auto?.one ? (
          <label className="f">
            Phase
            <select value={auto.scope[0]} onChange={(e) => setAuto({ scope: [+e.target.value], one: true })}>
              {phases.map((_, i) => (
                <option key={i} value={i} disabled={phs[i] === "Active"}>
                  Phase {i + 1}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="polist">
          {(["empty", "all"] as const).map((m) => (
            <label key={m}>
              <input type="radio" name="aMode" checked={aMode === m} onChange={() => setAMode(m)} /> <span className="f" style={{ fontSize: 12, color: "var(--ink)" }}>{m === "empty" ? "Fill Empty Only" : "Replace All"}</span>
            </label>
          ))}
        </div>
        <div className="f">Probationary Officers</div>
        <div className="polist">
          {(["random", "pick"] as const).map((m) => (
            <label key={m}>
              <input type="radio" name="aPo" checked={aPo === m} onChange={() => setAPo(m)} /> <span className="f" style={{ fontSize: 12, color: "var(--ink)" }}>{m === "random" ? "Random" : "Selected PO’s"}</span>
            </label>
          ))}
        </div>
        {aPo === "pick" ? <PoChecklist items={roster} picked={aPicked} setPicked={setAPicked} /> : null}
      </Modal>

      <Modal
        open={actOpen}
        title="Activate Phase"
        onClose={() => setActOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setActOpen(false)}>
              Cancel
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!cls || ready < 0) return;
                setPortal((p) => ({ ...p, phs: { ...p.phs, [cls]: p.phs[cls].map((x, j) => (j === ready ? "Active" : x)) } }));
                setActOpen(false);
                toast(`Phase ${ready + 1} Activated`);
              }}
            >
              Activate
            </button>
          </>
        }
      >
        <label className="f">
          Phase
          <select value={ready} disabled>
            <option value={ready}>Phase {ready + 1}</option>
          </select>
        </label>
      </Modal>

      <Modal
        open={extOpen}
        title="Add Extension"
        onClose={() => setExtOpen(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setExtOpen(false)}>
              Cancel
            </button>
            <button
              className="btn"
              disabled={!ex.picked.length || !(+ex.days > 0)}
              onClick={() => {
                const days = parseInt(ex.days);
                setPortal((p) => ({ ...p, ext: [...p.ext, ...ex.picked.map((po) => ({ po, phase: ex.phase, days, reason: ex.reason.trim(), added: iso(today) }))] }));
                setExtOpen(false);
                toast(`Extension Applied · ${ex.picked.length} PO${ex.picked.length > 1 ? "s" : ""}`);
              }}
            >
              Apply Extension
            </button>
          </>
        }
      >
        <div className="row">
          <label className="f">
            Class
            <select value={exCls} onChange={(e) => setEx({ ...ex, cls: e.target.value, phase: 0, picked: [] })}>
              {activeClasses.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
          </label>
          <label className="f">
            Phase
            <select value={ex.phase} onChange={(e) => setEx({ ...ex, phase: +e.target.value })}>
              {(s.setups[exCls]?.phases || []).map((_, i) => (
                <option key={i} value={i}>
                  Phase {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Days
            <input type="number" min={1} style={{ width: 90 }} value={ex.days} onChange={(e) => setEx({ ...ex, days: e.target.value })} />
          </label>
        </div>
        <div className="f">Probationary Officers</div>
        {exCls ? <PoChecklist items={rosterOf(exCls)} picked={ex.picked} setPicked={(v) => setEx({ ...ex, picked: v })} /> : null}
        <label className="f">
          Reason
          <input type="text" maxLength={200} value={ex.reason} onChange={(e) => setEx({ ...ex, reason: e.target.value })} />
        </label>
      </Modal>
    </AdminPage>
  );
}

function GridCell({ s, po, name, cls, i, range, onPick }: { s: PortalState; po: string; name: string; cls: string; i: number; range: { s: Date; e: Date } | null; onPick: (po: string, i: number, v: string) => void }) {
  const k = key(po, i);
  const v = s.asg[k] || "";
  const c = !!v && busy(s, po, i, v);
  const w = !!v && s.wd.includes(k);
  const rep = isRepeat(s, po, i);
  const x = extDays(s, po, i);
  const su = signed(s, cls, i);
  const opt = (f: (typeof FTOS)[number]) => (
    <option key={f.badge} value={f.badge} disabled={v !== f.badge && busy(s, po, i, f.badge)}>
      {f.name} · #{f.badge} · {f.pct} · {f.watch}
    </option>
  );
  return (
    <td>
      <select value={v} className={v ? (c || w ? "clash" : "") : "unset"} aria-label={`${name} Phase ${i + 1} FTO`} onChange={(e) => onPick(po, i, e.target.value)}>
        <option value="">Select FTO</option>
        <optgroup label={`SIGNED UP · PHASE ${i + 1}`}>{FTOS.filter((f) => su.includes(f.badge)).map(opt)}</optgroup>
        <optgroup label="ALL FTOS">{FTOS.filter((f) => !su.includes(f.badge)).map(opt)}</optgroup>
      </select>
      {range ? (
        <div className={`cell-d ${x ? "ext" : ""}`}>
          {fmtS(range.s)} – {fmtS(range.e)}
          {x ? ` · +${x} Days` : ""}
        </div>
      ) : null}
      {w ? <span className="tag e wd-pill">Withdrawn</span> : null}
      {rep ? <span className="tag rp wd-pill">Repeat FTO</span> : null}
    </td>
  );
}
