"use client";

import { useState } from "react";
import { PageHeader } from "@/components/portal/page-header";
import { CLASSES, FTO_BY, ME, PO_BY, fmt, fmtS, fmtW, ftoStatus, iso, key, myPoOn, phaseOn, phaseRange, ranges, rosterOf, setPortal, signed, skey, today, usePortal, D, POS, type Profile } from "@/lib/portal/store";
import { DEFAULT_WEEKS, WATCH } from "@/lib/portal/sample";
import { AdminPage, Card, PersonCell, Tag, toast } from "./ui";

export function PhaseSignUp() {
  const s = usePortal();
  const rows: { c: string; i: number; w: number; r: ReturnType<typeof phaseRange> }[] = [];
  CLASSES.forEach((c) => {
    const st = s.setups[c.id] || { phases: DEFAULT_WEEKS };
    st.phases.forEach((w, i) => {
      const r = phaseRange(s, c.id, i);
      if (r && r.e < today) return;
      rows.push({ c: c.id, i, w, r });
    });
  });
  const mine = rows.filter((x) => signed(s, x.c, x.i).includes(ME)).length;
  return (
    <AdminPage>
      <PageHeader section="FTO" title="Phase Sign-Up" />
      <Card title="Open Phases" right={<Tag k={mine ? "ok" : undefined}>{`${mine} Signed Up`}</Tag>}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Phase</th>
                <th>Dates</th>
                <th>Weeks</th>
                <th>Probationary Officers</th>
                <th>Signed Up</th>
                <th>Assignment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                const su = signed(s, x.c, x.i);
                const on = su.includes(ME);
                const act = (s.phs[x.c] || [])[x.i] === "Active";
                const stt = ftoStatus(s, x.c, x.i, ME);
                const po = stt.kind === "confirmed" ? PO_BY[stt.po] : null;
                const k = skey(x.c, x.i);
                return (
                  <tr key={k}>
                    <td className="mono">{x.c}</td>
                    <td>
                      Phase {x.i + 1}
                      {act ? (
                        <span className="tag ok" style={{ marginLeft: 6 }}>
                          Active
                        </span>
                      ) : null}
                    </td>
                    <td className="mono">{x.r ? `${fmt(x.r.s)} – ${fmt(x.r.e)}` : "—"}</td>
                    <td className="mono">{x.w || "—"}</td>
                    <td className="mono">{rosterOf(x.c).length}</td>
                    <td className="mono">{su.length}</td>
                    <td className="data">
                      {po ? (
                        <>
                          <Tag k="ok">Confirmed</Tag> <b>{po.name}</b> <span className="mono" style={{ color: "var(--muted)" }}>#{po.badge}</span>
                          {s.wd.includes(key(po.badge, x.i)) ? (
                            <span className="tag e" style={{ marginLeft: 6 }}>
                              Withdrawn
                            </span>
                          ) : null}
                        </>
                      ) : on && stt.kind === "waitlisted" ? (
                        <Tag k="w">{`Waitlisted #${stt.n}`}</Tag>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {on ? (
                        <button
                          className="btn ghost sm"
                          onClick={() => {
                            setPortal((p) => ({
                              ...p,
                              signups: { ...p.signups, [k]: (p.signups[k] || []).filter((b) => b !== ME) },
                              wd: [...p.wd, ...rosterOf(x.c).filter((q) => p.asg[key(q.badge, x.i)] === ME).map((q) => key(q.badge, x.i))],
                            }));
                            toast("Sign-Up Withdrawn · Coordinator Notified");
                          }}
                        >
                          Withdraw
                        </button>
                      ) : (
                        <button
                          className="btn sm"
                          onClick={() => {
                            setPortal((p) => ({ ...p, signups: { ...p.signups, [k]: [...(p.signups[k] || []), ME] } }));
                            toast("Signed Up");
                          }}
                        >
                          Sign Up
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminPage>
  );
}

export function MyProbationaryOfficer() {
  const s = usePortal();
  const mine = POS.flatMap((p) => (s.setups[p.cls]?.phases || []).map((_, i) => (s.asg[key(p.badge, i)] === ME ? { p, i, r: (ranges(s, p.badge) || [])[i] ?? null } : null)))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => (b.r ? b.r.s.getTime() : 0) - (a.r ? a.r.s.getTime() : 0));
  const cur = mine.find((x) => x.r && x.r.s <= today && today <= x.r.e);
  return (
    <AdminPage>
      <PageHeader section="FTO" title="My Probationary Officer" />
      <Card title="Current Assignment" right={cur ? <Tag k="ok">{`Phase ${cur.i + 1} Active`}</Tag> : null}>
        {cur && cur.r ? (
          <div className="meta">
            <div>
              Probationary Officer<b className="data">{cur.p.name}</b>
            </div>
            <div>
              Badge<b className="mono">{cur.p.badge}</b>
            </div>
            <div>
              Class<b>{cur.p.cls}</b>
            </div>
            <div>
              Phase<b>{cur.i + 1}</b>
            </div>
            <div>
              Dates<b>{`${fmtS(cur.r.s)} – ${fmtS(cur.r.e)}`}</b>
            </div>
            <div>
              Work Email<b className="data" style={{ fontSize: 14 }}>{cur.p.email}</b>
            </div>
            <div>
              Work Phone<b className="mono" style={{ fontSize: 14 }}>{cur.p.phone}</b>
            </div>
          </div>
        ) : (
          <div className="empty">No current assignment</div>
        )}
      </Card>
      <Card title="Assignment History">
        {mine.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Probationary Officer</th>
                  <th>Class</th>
                  <th>Phase</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((x) => (
                  <tr key={x.p.badge + x.i}>
                    <PersonCell name={x.p.name} badge={x.p.badge} />
                    <td className="mono">{x.p.cls}</td>
                    <td>Phase {x.i + 1}</td>
                    <td className="mono">{x.r ? `${fmt(x.r.s)} – ${fmt(x.r.e)}` : "—"}</td>
                    <td>
                      {s.wd.includes(key(x.p.badge, x.i)) ? <Tag k="e">Withdrawn</Tag> : x === cur ? <Tag k="ok">Current</Tag> : x.r && x.r.e < today ? <Tag>Complete</Tag> : <Tag k="w">Upcoming</Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No assignments</div>
        )}
      </Card>
    </AdminPage>
  );
}

export function DayOffCoverage() {
  const s = usePortal();
  const [day, setDay] = useState("");
  const myPo = myPoOn(s, ME, today);
  const reqs = s.cov.filter((x) => D(x.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  const mineReq = reqs.filter((x) => x.req === ME);
  const open = reqs.filter((x) => x.req !== ME);
  const maxD = myPo ? (ranges(s, myPo.badge) || [])[phaseOn(s, myPo.badge, today)]?.e : undefined;
  const max = maxD ? iso(maxD) : undefined;
  const canReq = !!day && D(day) >= today && (!max || day <= max) && !s.cov.some((x) => x.req === ME && x.date === day);
  return (
    <AdminPage>
      <PageHeader section="FTO" title="Day-Off Coverage" />
      <Card title="Request Coverage">
        {myPo ? (
          <>
            <div className="row">
              <label className="f">
                Day Off
                <input type="date" min={iso(today)} max={max} value={day} onChange={(e) => setDay(e.target.value)} />
              </label>
              <div className="f">
                Probationary Officer
                <div className="data" style={{ fontSize: 14, color: "var(--ink)", textTransform: "none", letterSpacing: 0, height: 36, display: "flex", alignItems: "center", fontWeight: 600 }}>
                  {myPo.name} · #{myPo.badge}
                </div>
              </div>
              <button
                className="btn"
                disabled={!canReq}
                onClick={() => {
                  setPortal((p) => ({ ...p, cov: [...p.cov, { id: "C" + Date.now(), po: myPo.badge, req: ME, date: day, by: "" }] }));
                  setDay("");
                  toast("Coverage Requested");
                }}
              >
                Request Coverage
              </button>
            </div>
            {mineReq.length ? (
              <div className="tbl-wrap" style={{ marginTop: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Day Off</th>
                      <th>Probationary Officer</th>
                      <th>Covering FTO</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {mineReq.map((x) => {
                      const b = x.by ? FTO_BY[x.by] : null;
                      return (
                        <tr key={x.id}>
                          <td className="mono">{fmtW(D(x.date))}</td>
                          <td className="data">{PO_BY[x.po].name}</td>
                          <td className="data">{b ? b.name : <Tag k="w">Open</Tag>}</td>
                          <td style={{ textAlign: "right" }}>
                            {b ? null : (
                              <button className="lnk" onClick={() => { setPortal((p) => ({ ...p, cov: p.cov.filter((c) => c.id !== x.id) })); toast("Request Canceled"); }}>
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty">No current assignment</div>
        )}
      </Card>
      <Card title="Open Coverage" right={<Tag k={open.some((x) => !x.by) ? "w" : "ok"}>{`${open.filter((x) => !x.by).length} Open`}</Tag>}>
        {open.length ? (
          <div className="tbl-wrap scrollbox" style={{ maxHeight: 420 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Probationary Officer</th>
                  <th>Class</th>
                  <th>Assigned FTO</th>
                  <th>Covering FTO</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {open.map((x) => {
                  const p = PO_BY[x.po];
                  const b = x.by ? FTO_BY[x.by] : null;
                  const busyMe = !!myPoOn(s, ME, D(x.date));
                  const set = (by: string, m: string) => {
                    setPortal((st) => ({ ...st, cov: st.cov.map((c) => (c.id === x.id ? { ...c, by } : c)) }));
                    toast(m);
                  };
                  return (
                    <tr key={x.id}>
                      <td className="mono">{fmtW(D(x.date))}</td>
                      <PersonCell name={p.name} badge={p.badge} />
                      <td className="mono">{p.cls}</td>
                      <td className="data">{FTO_BY[x.req].name}</td>
                      <td className="data">{b ? x.by === ME ? <Tag k="ok">You</Tag> : b.name : <Tag k="w">Open</Tag>}</td>
                      <td style={{ textAlign: "right" }}>
                        {x.by === ME ? (
                          <button className="btn ghost sm" onClick={() => set("", "Coverage Withdrawn")}>
                            Withdraw
                          </button>
                        ) : b ? null : (
                          <button className="btn sm" disabled={busyMe} onClick={() => set(ME, "Signed Up for Coverage")}>
                            Sign Up
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No open coverage</div>
        )}
      </Card>
    </AdminPage>
  );
}

export function ProfileForm({ who, children }: { who: "coord" | "me"; children?: React.ReactNode }) {
  const s = usePortal();
  return (
    <ProfileInner key={JSON.stringify(s[who])} who={who} initial={s[who]}>
      {children}
    </ProfileInner>
  );
}

function ProfileInner({ who, initial, children }: { who: "coord" | "me"; initial: Profile; children?: React.ReactNode }) {
  const [f, setF] = useState(initial);
  const isF = who === "me";
  const field = (k: "name" | "badge" | "email" | "phone", label: string, type = "text") => (
    <label className="f">
      {label}
      <input type={type} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </label>
  );
  return (
    <AdminPage>
      <PageHeader section={isF ? "FTO" : "Coordinator"} title="Account Settings" />
      <Card
        title="Profile"
        right={
          <button
            className="btn sm"
            onClick={() => {
              setPortal((p) => ({ ...p, [who]: f }));
              toast("Profile Saved");
            }}
          >
            Save
          </button>
        }
      >
        <div className="grid2">
          {field("name", "Name")}
          {field("badge", "Badge")}
          {field("email", "Work Email", "email")}
          {field("phone", "Work Phone", "tel")}
          {isF ? (
            <>
              <label className="f">
                Precinct
                <select value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })}>
                  {Array.from({ length: 20 }, (_, i) => `Precinct ${i + 1}`).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="f">
                Watch
                <select value={f.watch} onChange={(e) => setF({ ...f, watch: e.target.value })}>
                  {WATCH.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>
      </Card>
      {children}
    </AdminPage>
  );
}

