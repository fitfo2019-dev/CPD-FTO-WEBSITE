"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/portal/page-header";
import { CLASSES, FTOS, FTO_BY, PO_BY, POS, conflicts, curFto, fmt, fmtS, fmtW, iso, key, myPoOn, pageTag, phaseOn, phaseRange, rosterOf, setPortal, today, usePortal, D, isSun, type Packet } from "@/lib/portal/store";
import { WATCH } from "@/lib/portal/sample";
import { PROGRESS, inSampleGroup } from "@/lib/po-progress/data";
import { AdminPage, Card, Modal, PersonCell, Tag, toast } from "./ui";
import { caseSafe } from "@/lib/case-safe";

const setupHref = (c: string) => `/coordinator/phase-setup?class=${encodeURIComponent(c)}`;

/* ---------- Dashboard ---------- */
export function CoordinatorDashboard() {
  const s = usePortal();
  const router = useRouter();
  const awaiting = s.packets.filter((x) => x.status === "submitted_complete" && !x.reviewedAt && !x.returned).length;
  const inFT = POS.filter((p) => phaseOn(s, p.badge, today) >= 0).length;
  const cf = conflicts(s);
  const wd = s.wd.length;
  const review = PROGRESS.pos.filter((p) => inSampleGroup(p) && p.status === "BELOW STANDARD").length;
  const flags: { po: string; i: number; fto: string; flag: "Conflict" | "Withdrawn" }[] = [
    ...cf.slice(0, 8).map((a) => ({ po: a.po, i: a.i, fto: a.fto, flag: "Conflict" as const })),
    ...s.wd.slice(0, 8).flatMap((k) => {
      const [po, i] = k.split("|");
      return s.asg[k] ? [{ po, i: +i, fto: s.asg[k], flag: "Withdrawn" as const }] : [];
    }),
  ];
  return (
    <AdminPage>
      <PageHeader section="Coordinator" title="Coordinator Dashboard" actions={<span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{fmt(today)}</span>} />
      <div className="stats s5">
        <Link href="/coordinator/po-progress?show=below-standard" className={`stat click ${review ? "e" : ""}`} data-testid="stat-po-review">
          <small>{caseSafe("PO’s Below Standard")}</small>
          <b>{review}</b>
        </Link>
        <div className="stat">
          <small>{caseSafe("PO’s in Field Training")}</small>
          <b>{inFT}</b>
        </div>
        <div className="stat">
          <small>Packets Awaiting Review</small>
          <b>{awaiting}</b>
        </div>
        <div className={`stat ${wd ? "e" : ""}`}>
          <small>Withdrawn</small>
          <b>{wd}</b>
        </div>
        <div className={`stat ${cf.length ? "e" : ""}`}>
          <small>Conflicts</small>
          <b>{cf.length}</b>
        </div>
      </div>
      <Card title="Classes" pad>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>{caseSafe("PO’s")}</th>
                <th>Start</th>
                <th>Current Phase</th>
                <th>Projected Completion</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => {
                const st = s.setups[c.id];
                const ok = !!st && isSun(st.start);
                let cp: { i: number; r: { s: Date; e: Date } } | null = null;
                if (ok)
                  st.phases.forEach((_, i) => {
                    const r = phaseRange(s, c.id, i);
                    if (r && r.s <= today && today <= r.e) cp = { i, r };
                  });
                const cur = cp as { i: number; r: { s: Date; e: Date } } | null;
                const last = ok ? phaseRange(s, c.id, st.phases.length - 1) : null;
                const anyA = (s.phs[c.id] || []).includes("Active");
                return (
                  <tr key={c.id} className="click" onClick={() => router.push(setupHref(c.id))}>
                    <td className="data">
                      <b>{c.id}</b>
                    </td>
                    <td className="mono">{rosterOf(c.id).length}</td>
                    <td className="mono">{st?.start ? fmt(D(st.start)) : "—"}</td>
                    <td>{cur ? `Phase ${cur.i + 1} · ${fmtS(cur.r.s)} – ${fmtS(cur.r.e)}` : "—"}</td>
                    <td className="mono">{last ? fmt(last.e) : "—"}</td>
                    <td>{!st ? <Tag>Not Imported</Tag> : cur ? <Tag k="ok">{`Phase ${cur.i + 1} Active`}</Tag> : anyA ? <Tag k="ok">Active</Tag> : <Tag>Draft</Tag>}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link className="btn ghost sm" href={setupHref(c.id)} onClick={(e) => e.stopPropagation()}>
                        Phase Setup
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Needs Attention" right={flags.length ? <Tag k="e">{flags.length}</Tag> : null}>
        {flags.length ? (
          <div className="tbl-wrap scrollbox" style={{ maxHeight: 320 }}>
            <table>
              <thead>
                <tr>
                  <th>Probationary Officer</th>
                  <th>Class</th>
                  <th>Phase</th>
                  <th>FTO</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((a) => {
                  const p = PO_BY[a.po];
                  return (
                    <tr key={a.flag + a.po + a.i}>
                      <PersonCell name={p.name} badge={p.badge} />
                      <td className="mono">{p.cls}</td>
                      <td>Phase {a.i + 1}</td>
                      <td className="data">{FTO_BY[a.fto]?.name}</td>
                      <td>
                        <Tag k="e">{a.flag}</Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No open items</div>
        )}
      </Card>
    </AdminPage>
  );
}

/* ---------- Review Desk ---------- */
type Tab = "open" | "returned" | "done";
const tabOf = (x: Packet): Tab => (x.reviewedAt ? "done" : x.returned ? "returned" : "open");

export function ReviewDeskPackets() {
  const s = usePortal();
  const [tab, setTab] = useState<Tab>("open");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "return">("view");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const sub = s.packets.filter((x) => x.status === "submitted_complete");
  const counts = { open: 0, returned: 0, done: 0 };
  sub.forEach((x) => counts[tabOf(x)]++);
  const t = q.toLowerCase();
  const list = sub
    .filter((x) => tabOf(x) === tab)
    .filter((x) => {
      const p = PO_BY[x.po];
      const f = FTO_BY[x.fto];
      return (!cls || p.cls === cls) && (!t || `${p.name} ${p.badge} ${f.name} ${f.badge}`.toLowerCase().includes(t));
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const pk = openId ? s.packets.find((x) => x.id === openId) || null : null;
  const close = () => {
    setOpenId(null);
    setMode("view");
    setTags([]);
    setNote("");
  };
  const update = (fn: (x: Packet) => Packet) => setPortal((st) => ({ ...st, packets: st.packets.map((x) => (x.id === openId ? fn(x) : x)) }));
  const tabs: [Tab, string][] = [
    ["open", "Awaiting Review"],
    ["returned", "Returned"],
    ["done", "Reviewed"],
  ];

  return (
    <div className="ap">
      <Card
        title={
          <div className="tabs" role="tablist">
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {l} · {counts[k]}
              </button>
            ))}
          </div>
        }
        right={<Tag k={counts.open ? "w" : "ok"}>{`${counts.open} Awaiting`}</Tag>}
        pad={false}
      >
        <div className="toolbar" style={{ padding: "14px 18px 0" }}>
          <input type="search" className="srch" placeholder="Search PO or FTO" aria-label="Search packets" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="f inl">
            Class
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">All Classes</option>
              {CLASSES.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
          </label>
          <span className="cnt">{list.length} Packets</span>
        </div>
        <div style={{ padding: "12px 18px 18px" }}>
          {list.length ? (
            <div className="tbl-wrap scrollbox">
              <table>
                <thead>
                  <tr>
                    <th>Packet Date</th>
                    <th>Probationary Officer</th>
                    <th>FTO</th>
                    <th>Class</th>
                    <th>Phase</th>
                    <th>Pages</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((x) => {
                    const p = PO_BY[x.po];
                    const f = FTO_BY[x.fto];
                    return (
                      <tr key={x.id}>
                        <td className="mono">{fmtW(D(x.date))}</td>
                        <PersonCell name={p.name} badge={p.badge} />
                        <PersonCell name={f.name} badge={f.badge} />
                        <td className="mono">{p.cls}</td>
                        <td>Phase {x.phase + 1}</td>
                        <td className="mono">{x.forms.length}</td>
                        <td>{x.reviewedAt ? <Tag k="ok">Reviewed</Tag> : x.returned ? <Tag k="e">{`Returned · ${x.returned.tags.length} Page${x.returned.tags.length > 1 ? "s" : ""}`}</Tag> : <Tag k="w">Submitted</Tag>}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn ghost sm" onClick={() => setOpenId(x.id)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No packets</div>
          )}
        </div>
      </Card>

      <Modal
        open={!!pk}
        wide
        title={pk ? `Daily Packet · ${fmt(D(pk.date))}` : ""}
        onClose={close}
        footer={
          pk && !pk.reviewedAt && !pk.returned ? (
            mode === "view" ? (
              <>
                <button className="btn ghost" onClick={() => setMode("return")}>
                  Return for Correction
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    update((x) => ({ ...x, reviewedAt: iso(today) }));
                    close();
                    toast("Packet Reviewed");
                  }}
                >
                  Mark Reviewed
                </button>
              </>
            ) : (
              <>
                <button className="btn ghost" onClick={() => { setMode("view"); setTags([]); setNote(""); }}>
                  Back
                </button>
                <button
                  className="btn"
                  disabled={!tags.length || note.trim().length < 10}
                  onClick={() => {
                    update((x) => ({ ...x, returned: { tags, note: note.trim(), at: iso(today) } }));
                    close();
                    toast(`Returned to FTO · ${tags.length} Page${tags.length > 1 ? "s" : ""} Unlocked`);
                  }}
                >
                  Return to FTO
                </button>
              </>
            )
          ) : (
            <button className="btn ghost" onClick={close}>
              Close
            </button>
          )
        }
      >
        {pk ? (
          <>
            <div className="meta">
              <div>
                Probationary Officer<b className="data">{PO_BY[pk.po].name}</b>
              </div>
              <div>
                FTO<b className="data">{FTO_BY[pk.fto].name}</b>
              </div>
              <div>
                Phase<b>{pk.phase + 1}</b>
              </div>
              {pk.reviewedAt ? (
                <div>
                  Reviewed<b>{fmt(D(pk.reviewedAt))}</b>
                </div>
              ) : null}
            </div>
            {pk.returned ? (
              <div className="tbl-wrap" style={{ padding: "10px 12px" }}>
                <div className="opt-t">Coordinator Note · {fmt(D(pk.returned.at))}</div>
                <div className="data" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                  {pk.returned.note}
                </div>
              </div>
            ) : null}
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    {mode === "return" ? <th style={{ width: 40 }} /> : null}
                    <th>Page</th>
                    <th>Form</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pk.forms.map((n, i) => {
                    const tg = pageTag(s, pk, i);
                    const flagged = pk.returned?.tags.includes(tg);
                    return (
                      <tr key={tg}>
                        {mode === "return" ? (
                          <td>
                            <input type="checkbox" aria-label={`Flag ${tg}`} checked={tags.includes(tg)} onChange={(e) => setTags(e.target.checked ? [...tags, tg] : tags.filter((x) => x !== tg))} />
                          </td>
                        ) : null}
                        <td className="mono">{tg}</td>
                        <td>{n}</td>
                        <td>{flagged ? <Tag k="e">Unlocked for Correction</Tag> : <Tag k="ok">Submitted</Tag>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {mode === "return" ? (
              <label className="f">
                Correction Note
                <textarea value={note} onChange={(e) => setNote(e.target.value)} aria-label="Correction note" />
              </label>
            ) : null}
          </>
        ) : null}
      </Modal>
    </div>
  );
}

/* ---------- Probationary Officers ---------- */
export function ProbationaryOfficers() {
  const s = usePortal();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("q");
    if (v) setQ(v);
  }, []);
  const t = q.toLowerCase();
  const list = POS.filter((p) => (!cls || p.cls === cls) && (!t || p.name.toLowerCase().includes(t) || p.badge.includes(t)));
  return (
    <AdminPage>
      <PageHeader section="Coordinator" title="Probationary Officers" />
      <section className="card">
        <div className="toolbar" style={{ padding: "14px 18px 0" }}>
          <input type="search" className="srch" placeholder="Search name or badge" aria-label="Search probationary officers" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="f inl">
            Class
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">All Classes</option>
              {CLASSES.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
          </label>
          <span className="cnt">{`${list.length} of ${POS.length}`}</span>
        </div>
        <div style={{ padding: "12px 18px 18px" }}>
          <div className="tbl-wrap scrollbox sticky1">
            <table>
              <thead>
                <tr>
                  <th>Probationary Officer</th>
                  <th>Badge</th>
                  <th>Class</th>
                  <th>Current Phase</th>
                  <th>Current FTO</th>
                  <th>Work Email</th>
                  <th>Work Phone</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((p) => {
                    const c = curFto(s, p.badge, today);
                    const f = c?.fto ? FTO_BY[c.fto] : null;
                    const w = c && s.wd.includes(key(p.badge, c.i));
                    return (
                      <tr key={p.badge}>
                        <td className="data">
                          <b>{p.name}</b>
                        </td>
                        <td className="mono">{p.badge}</td>
                        <td className="mono">{p.cls}</td>
                        <td>{c ? `Phase ${c.i + 1}` : "—"}</td>
                        <td className="data">
                          {f ? f.name : "—"}
                          {w ? (
                            <>
                              {" "}
                              <Tag k="e">Withdrawn</Tag>
                            </>
                          ) : null}
                        </td>
                        <td className="data">{p.email}</td>
                        <td className="mono">{p.phone}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">No matching probationary officers</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminPage>
  );
}

/* ---------- FTO Directory ---------- */
export function FtoDirectory() {
  const s = usePortal();
  const [q, setQ] = useState("");
  const [watch, setWatch] = useState("");
  const t = q.toLowerCase();
  const list = FTOS.filter((f) => (!watch || f.watch === watch) && (!t || `${f.name} ${f.badge} ${f.pct}`.toLowerCase().includes(t)));
  return (
    <AdminPage>
      <PageHeader section="Coordinator" title="FTO Directory" />
      <section className="card">
        <div className="toolbar" style={{ padding: "14px 18px 0" }}>
          <input type="search" className="srch" placeholder="Search name, badge or precinct" aria-label="Search FTO’s" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="f inl">
            Watch
            <select value={watch} onChange={(e) => setWatch(e.target.value)}>
              <option value="">All Watches</option>
              {WATCH.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>
          <span className="cnt">{`${list.length} of ${FTOS.length}`}</span>
        </div>
        <div style={{ padding: "12px 18px 18px" }}>
          <div className="tbl-wrap scrollbox sticky1">
            <table>
              <thead>
                <tr>
                  <th>FTO</th>
                  <th>Badge</th>
                  <th>Precinct</th>
                  <th>Watch</th>
                  <th>Current PO</th>
                  <th>Phase Sign-Ups</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((f) => {
                    const po = myPoOn(s, f.badge, today);
                    const su = Object.entries(s.signups)
                      .filter(([k, v]) => {
                        if (!v.includes(f.badge)) return false;
                        const [c, i] = k.split("|");
                        const r = phaseRange(s, c, +i);
                        return !r || r.e >= today;
                      })
                      .map(([k]) => {
                        const [c, i] = k.split("|");
                        return `${c.replace("Class ", "")} · P${+i + 1}`;
                      });
                    return (
                      <tr key={f.badge}>
                        <td className="data">
                          <b>{f.name}</b>
                        </td>
                        <td className="mono">{f.badge}</td>
                        <td>{f.pct}</td>
                        <td>{f.watch}</td>
                        {po ? <PersonCell name={po.name} badge={po.badge} /> : <td>—</td>}
                        <td className="mono" style={{ whiteSpace: "normal" }}>
                          {su.length ? su.join(", ") : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">{caseSafe("No matching FTO’s")}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminPage>
  );
}

/* ---------- Monthly Reports ---------- */
const PERIODS = ["Daily", "Weekly", "Monthly", "All Phases"] as const;
export function MonthlyReports() {
  const s = usePortal();
  const withSetup = CLASSES.filter((c) => s.setups[c.id] && isSun(s.setups[c.id].start));
  const [scope, setScope] = useState<"po" | "class">("po");
  const [cls, setCls] = useState(withSetup.find((c) => c.id === "Class 135")?.id || withSetup[0]?.id || "");
  const [phase, setPhase] = useState(() => {
    const first = rosterOf(cls)[0];
    return first ? Math.max(0, phaseOn(s, first.badge, today)) : 0;
  });
  const [po, setPo] = useState("");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Monthly");
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState("");
  const st = s.setups[cls];
  const r = cls ? phaseRange(s, cls, phase) : null;
  const weeks = st ? st.phases[phase] || 0 : 0;
  const roster = cls ? rosterOf(cls) : [];
  const days = r ? Array.from({ length: Math.round((r.e.getTime() - r.s.getTime()) / 864e5) + 1 }, (_, k) => iso(new Date(r.s.getTime() + k * 864e5))).filter((d) => D(d) <= today) : [];
  const ready = !!cls && (scope === "class" || !!po) && (period !== "Daily" || !!day);
  const packets = s.packets.filter((x) => x.status === "submitted_complete" && PO_BY[x.po].cls === cls && x.phase === phase);
  return (
    <AdminPage>
      <PageHeader section="Coordinator" title="Monthly Reports" />
      <Card
        title="Export"
        right={
          <div className="tabs" role="tablist">
            {(
              [
                ["po", "Export PO"],
                ["class", "Export Class"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={scope === k} className={scope === k ? "on" : ""} onClick={() => setScope(k)}>
                {l}
              </button>
            ))}
          </div>
        }
      >
        <div className="row">
          <label className="f">
            Class
            <select value={cls} onChange={(e) => { setCls(e.target.value); setPhase(0); setPo(""); setDay(""); }}>
              {withSetup.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
          </label>
          <label className="f">
            Phase
            <select value={phase} onChange={(e) => { setPhase(+e.target.value); setDay(""); setWeek(1); }}>
              {(st?.phases || []).map((_, i) => (
                <option key={i} value={i}>
                  Phase {i + 1}
                </option>
              ))}
            </select>
          </label>
          {scope === "po" ? (
            <label className="f" style={{ minWidth: 240 }}>
              Probationary Officer
              <select value={po} onChange={(e) => setPo(e.target.value)}>
                <option value="">Select PO</option>
                {roster.map((p) => (
                  <option key={p.badge} value={p.badge}>
                    {p.name} · #{p.badge}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="f">
            Period
            <select value={period} onChange={(e) => setPeriod(e.target.value as (typeof PERIODS)[number])}>
              {PERIODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {period === "Weekly" ? (
            <label className="f">
              Week
              <select value={week} onChange={(e) => setWeek(+e.target.value)}>
                {Array.from({ length: weeks }, (_, k) => (
                  <option key={k} value={k + 1}>
                    Week {k + 1}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {period === "Daily" ? (
            <label className="f">
              Day
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                <option value="">Select day</option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {fmtW(D(d))}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="btn" disabled={!ready}>
            Export Excel
          </button>
        </div>
        {r ? (
          <div className="meta" style={{ marginTop: 16 }}>
            <div>
              Phase Dates<b>{`${fmtS(r.s)} – ${fmtS(r.e)}`}</b>
            </div>
            <div>
              Weeks<b>{weeks}</b>
            </div>
            <div>
              {scope === "class" ? "Rows" : "Workbook"}
              <b>{scope === "class" ? `${roster.length} PO’s` : po ? PO_BY[po].name : "—"}</b>
            </div>
          </div>
        ) : null}
      </Card>
      <Card title="Packets Submitted" right={<span className="cnt">{caseSafe(`${roster.length} PO’s`)}</span>}>
        {roster.length ? (
          <div className="tbl-wrap scrollbox">
            <table>
              <thead>
                <tr>
                  <th>Probationary Officer</th>
                  <th>Badge</th>
                  <th>Packets Submitted</th>
                  <th>Reviewed</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => {
                  const k = packets.filter((x) => x.po === p.badge);
                  return (
                    <tr key={p.badge}>
                      <td className="data">
                        <b>{p.name}</b>
                      </td>
                      <td className="mono">{p.badge}</td>
                      <td className="mono">{k.length}</td>
                      <td className="mono">{k.filter((x) => x.reviewedAt).length}</td>
                      <td className="mono">{k.filter((x) => x.returned && !x.reviewedAt).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No probationary officers</div>
        )}
      </Card>
    </AdminPage>
  );
}
