import {complaintData,complaintPanel,wireComplaints} from "./complaints.js";
const $ = id => document.getElementById(id);
const OPD = "https://opd.ohio.gov/law-library/criminal-law-casebook";
const COURT = "https://www.supremecourt.ohio.gov/rod/docs/";
const LAW = "https://codes.ohio.gov/ohio-revised-code/";
const CITY = "https://library.municode.com/oh/columbus/codes/code_of_ordinances";
const cityView = new URLSearchParams(location.search).get("workbook")==="columbus";
const LABELS = {29:"Crimes & Procedure",31:"Domestic Relations",45:"Motor Vehicles"};
const CITY_LABELS = {21:"Traffic Code",23:"General Offenses"};
const BASE_TITLES = ["29","31","45"], PAGE = 18;
const fmt = n => n.toLocaleString("en-US");
const escape = s => String(s ?? "").replace(/[&<>"']/g, x => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const lower = s => (s ?? "").toLowerCase();
const citeKey = s => lower(s).replace(/[^a-z0-9]/g, "");
const codeQuery = q => lower(q).trim().replace(/^(?:(?:o\.?\s*r\.?\s*c\.?|r\.?\s*c\.?|c\.?\s*c\.?\s*c\.?|section)(?=\s|\d)\s*|§+\s*)/, "").trim();
const sourceSearch = (domain, query) => `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${query}`)}`;
const link = (url,label) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
const official = row => LAW + row[3];
const broadTopics = {
  "2903.01":"homicide-offenses","2903.02":"homicide-offenses","2903.03":"homicide-offenses",
  "2903.04":"homicide-offenses","2903.06":"homicide-offenses","2903.07":"homicide-offenses",
  "2919.25":"domestic-violence","2913.02":"theft-offenses","2913.03":"theft-offenses",
  "2941.25":"allied-offenses-of-similar-import","2929.14":"sentencing","4511.19":"traffic-offenses",
  "4511.191":"traffic-offenses","4511.21":"traffic-offenses","4511.33":"traffic-offenses"
};
const load = new Map();
function json(path) {
  if (!load.has(path)) load.set(path, fetch(`./data/${path}.json`).then(r => {
    if (!r.ok) throw Error(`HTTP ${r.status}`);
    return r.json();
  }).catch(e => { load.delete(path); throw e; }));
  return load.get(path);
}
const state = {mode:cityView ? "city" : "statutes",title:"",chapter:"",query:"",page:0, rows:[], seq:0};
const dialog = $("review");
const html = $("review-main"), tools = $("review-tools"), search = $("search");
let catalog, sections, chapters, city, citySections, cityChapters, book, mergedCases, topicMap, direct, nearby, dialogData, openSeq=0, pendingSearch;
let worker, originalFocus, backStack = [];
const checkState = new Map();
const saved = new Set();
function store() {
  $("total-saved").textContent = fmt([...saved].filter(x=>x.startsWith("ccc:")===cityView).length);
}
async function initCity() {
  if(city) return city;
  const data=await json("columbus");
  citySections=new Map(data.rows.map(x=>[x[0],x]));
  cityChapters=new Map(data.chapters.map(x=>[x[0],x]));
  city=data;
  $("total-city").textContent=fmt(citySections.size);
  return data;
}
function initBook() {
  return book ||= Promise.all([json("casebook"),json("selected")]).then(([data, selected]) => {
    mergedCases = new Map(Object.entries(data.cases));
    topicMap = new Map(data.topics.map(x => [x.id,x]));
    direct = new Map(); nearby = new Map();
    for (const row of selected) {
      let key = citeKey(row.cite);
      let existing = mergedCases.get(key);
      if (!existing) {
        const alternative = [...mergedCases].find(([,x]) => citeKey(x.cite) === key);
        if (alternative) { key = alternative[0]; existing = alternative[1]; }
      }
      mergedCases.set(key, {...existing,...row, topics:existing?.topics || [], authored:true, selectedRefs:row.refs, refs:[...new Set([...(existing?.refs || []),...row.refs])]});
    }
    for (const [key,row] of mergedCases) for (const n of row.refs) {
      if (!direct.has(n)) direct.set(n, []);
      direct.get(n).push(key);
    }
    for (const topic of data.topics) for (const [anchor,label,refs,keys] of topic.groups) {
      for (const n of refs) {
        if (!nearby.has(n)) nearby.set(n, []);
        nearby.get(n).push({topic,anchor,label,keys});
      }
    }
    $("total-cases").textContent = fmt(mergedCases.size);
    $("total-topics").textContent = fmt(topicMap.size);
  }).catch(e => { book=null; throw e; });
}
function syncControls() {
  for (const b of document.querySelectorAll("[data-scope]")) {
    const selected = state.mode === b.dataset.scope;
    b.classList.toggle("active",selected);
    b.setAttribute("aria-pressed",String(selected));
  }
  for (const b of document.querySelectorAll("[data-title]")) {
    const selected = ["statutes","city"].includes(state.mode) && state.title === b.dataset.title;
    b.classList.toggle("active",selected);
    b.setAttribute("aria-pressed",String(selected));
  }
  $("filters").hidden = !["statutes","city"].includes(state.mode);
  const chapter = $("chapter");
  const list = [...(cityView ? cityChapters : chapters)].filter(([id])=>!state.title || id.startsWith(state.title));
  chapter.replaceChildren(new Option("All chapters",""), ...list.map(([id,[,name]])=>new Option(`${id} | ${name}`,id)));
  chapter.value = state.chapter;
  const options = {
    statutes:["Enter an ORC number, title, or phrase…",[["2903.01"],["4511.19"],["3109.04"],["prior calculation and design","Prior calculation and design"]]],
    cases:["Enter a case name, citation, ORC number, or issue…",[["State v. Walker"],["2014-Ohio-4258"],["merger","Merger"],["2941.25"]]],
    topics:["Enter a topic, subtopic, or ORC number…",[["homicide"],["domestic violence"],["traffic"],["sentencing"]]],
    saved:[cityView ? "Filter your saved ordinances…" : "Filter your saved statutes…",[]],
    city:["Enter a CCC or ORC number, name, or phrase…",[["2133.01"],["2313.02"],["4511.19","ORC 4511.19"],["criminal trespass","Criminal trespass"]]],
    complaints:["Enter an ORC or CCC number, offense, or wording…",[["2903.01"],["CCC 2317.14"],["2913.02"],["domestic violence"]]]
  }[state.mode];
  search.placeholder=options[0];
  $("shortcuts").innerHTML = options[1].length ? `<span>Try</span>${options[1].map(([q,l])=>`<button type="button" data-query="${escape(q)}">${escape(l||q)}</button>`).join("")}` : "";
  $("shortcuts").hidden=!options[1].length;
}
function switchMode(mode, title="") {
  if (!catalog) return;
  clearTimeout(pendingSearch);
  state.mode=mode; state.title=title; state.chapter=""; state.page=0;
  state.query=search.value="";
  syncControls(); run();
}
function fullSearch(titles, chapter, query) {
  if (!worker) worker = new Worker(new URL("./search-worker.js", import.meta.url));
  return new Promise((resolve,reject) => {
    const id = state.seq;
    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };
    const onMessage = ({data}) => {
      if (data.id !== id) return;
      cleanup();
      if (data.error) reject(Error("Full-text index was unavailable.")); else resolve(data.results);
    };
    const onError = () => { cleanup(); reject(Error("Full-text search did not start.")); };
    worker.addEventListener("message",onMessage); worker.addEventListener("error",onError);
    worker.postMessage({id,titles,chapter,query});
  });
}
function tokens(q) { return (q.match(/"[^"]+"|[^\s"]+/g) || []).map(x=>x.replace(/^"|"$/g,"")); }
function wordMatch(q, corpus) { const t=lower(corpus); return tokens(q).every(w=>t.includes(w)); }
function heading(q) {
  const labels={statutes:["Statute index",state.chapter ? `Chapter ${state.chapter}` : state.title ? `Title ${state.title}: ${LABELS[state.title]}` : "All statutes"], cases:["Ohio opinions and references","Case law"], topics:["Ohio Public Defender","Casebook topics"],saved:["Study queue","Saved for review"],city:["Columbus City Code index",state.chapter ? `Chapter ${state.chapter}` : state.title ? `Title ${state.title}: ${CITY_LABELS[state.title]}` : "All city sections"],complaints:["Columbus Division of Police · June 2026","Complaint manual"]};
  const [kicker, title]=labels[state.mode];
  $("result-kicker").textContent=kicker;
  $("results-heading").textContent=q ? `Search results` : title;
}
async function run() {
  if (!catalog) return;
  const seq = ++state.seq, mode=state.mode, q=codeQuery(state.query);
  state.page=0; heading(q);
  $("pagination").hidden=true;
  $("result-status").textContent=q ? "Searching…" : "Loading…";
  const origin = seq;
  try {
    if(mode==="complaints"){
      const data=await complaintData();
      if(seq!==state.seq) return;
      const kindFilter=state.query.trim().match(/^(o\.?r\.?c\.?|c\.?c\.?c\.?)(?=\s|\d)/i)?.[1]?.replaceAll(".","").toUpperCase();
      const numeric=/^\d{2,4}(?:\.\d{0,4})?(?:\s*\([\w-]+\))*$/.test(q);
      const norm=q.replace(/\s+/g,"");
      state.rows=[...new Set([...Object.keys(data.codes),...Object.keys(data.related)])].flatMap(key=>{
        const [kind,id]=key.split(":");
        if(kindFilter && kindFilter!==kind) return [];
        const entries=data.codes[key] || [];
        const related=Object.keys(data.related[key]||{}).flatMap(k=>data.codes[k] || []);
        const first=(entries.length ? entries : related)[0];
        const name=kind==="ORC" ? sections.get(id)?.[1] || first.heading : citySections?.get(id)?.[1] || first.heading;
        const score=!q?0:numeric ? (id===norm ? 100 : id.startsWith(norm) || entries.some(e=>e.citations.some(c=>c.toLowerCase().replace(/\s+/g,"")===kind.toLowerCase()+norm)) ? 40 : -1)
          : wordMatch(q,name) ? 40 : [...entries,...related].some(e=>wordMatch(q,`${e.heading} ${e.variant} ${e.text}`)) ? 10 : -1;
        return score<0?[]:[{kind:"complaint",id:key,name,tag:`${kind} ${id}`,count:entries.length,score}];
      }).sort((a,b)=>b.score-a.score || a.tag.localeCompare(b.tag,undefined,{numeric:true}));
      showResults();
      return;
    }
    if (mode==="city" || (mode==="saved" && cityView)) {
      await initCity();
      if(seq!==state.seq) return;
      const numeric=/^\d{2,4}(?:\.\d*)?$/.test(q);
      const matchIds=new Set((city.byOrc[q] || []).map(r=>r.city));
      state.rows=[...citySections.values()].flatMap(([id,name,,text,outside])=>{
        if ((state.title && !id.startsWith(state.title)) || (state.chapter && id.split(".")[0]!==state.chapter) || (mode==="saved" && !saved.has(`ccc:${id}`))) return [];
        const alias=/\bunder the influence\b/i.test(name) ? " OVI DUI" : /\bphysical control\b/i.test(name) ? " OVI physical control" : "";
        const score=!q ? 0 : id===q ? 100 : numeric ? (matchIds.has(id) || outside.includes(q) ? 60 : id.startsWith(q) ? 30 : -1) :
          lower(name+alias).includes(q.replace(/"/g,"")) ? 30 : wordMatch(q,name+alias) ? 20 : wordMatch(q,text) ? 10 : -1;
        return score<0 ? [] : [{kind:"city",id,name,score}];
      }).sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
      showResults(city.pending.length ? `Index coverage: ${city.chapters.length} of ${city.chapters.length+city.pending.length} chapters in Titles 21 and 23.` : "");
      return;
    }
    if (mode==="statutes" || mode==="saved") {
      const scope=[...sections.values()].filter(r=>(!state.title || r[0].startsWith(state.title)) && (!state.chapter || r[0].split(".")[0]===state.chapter) && (mode!=="saved" || saved.has(r[0])));
      const map=new Map();
      const numeric=/^\d{2,4}(?:\.\d*)?$/.test(q);
      for (const row of scope) {
        const [n,name]=row;
        let score = !q ? 0 : n===q ? 100 : numeric && n.startsWith(q) ? 30 : !numeric && lower(name).includes(q.replace(/"/g,"")) ? 20 : !numeric && wordMatch(q,name) ? 10 : -1;
        if (score>=0) map.set(n,{kind:"statute",id:n,name,score});
      }
      let incomplete=false;
      const exact=scope.some(([n])=>n===q);
      if (q && !numeric && !exact && scope.length) {
        try {
          const shards=state.title ? [state.title] : state.chapter ? [state.chapter.slice(0,2)] : BASE_TITLES;
          const full=await fullSearch(shards,state.chapter,q);
          const byId=new Map(scope.map(r=>[r[0],r]));
          for (const [id, score, snippet] of full) if (byId.has(id)) {
            const row=map.get(id) || {kind:"statute",id,name:byId.get(id)[1],score};
            row.snippet=snippet; map.set(id,row);
          }
        } catch { incomplete=true; }
      }
      if (seq!==state.seq) return;
      state.rows=[...map.values()].sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
      showResults(incomplete ? "Full-text search is temporarily unavailable. Showing number and name matches." : "");
      return;
    }
    $("results").replaceChildren();
    await initBook();
    if (seq!==state.seq) return;
    const numeric=/^\d{4}\.\d+$/.test(q);
    if (mode==="cases") {
      state.rows=[...mergedCases].flatMap(([key,c])=>{
        const rank = !q ? (c.authored ? 40 : 0) :
          citeKey(c.cite)===citeKey(q) ? 100 : numeric ? (c.selectedRefs?.includes(q) ? 60 : c.refs.includes(q) ? 30 : -1) :
          lower(c.name)===q ? 60 : wordMatch(q,`${c.name} ${c.cite} ${c.reporter||""} ${c.issue||""} ${c.note||""} ${c.topics.map(([t,,g])=>`${topicMap.get(t)?.title||""} ${g}`).join(" ")}`) ? (wordMatch(q,c.name) ? 45 : c.authored ? 22 : 10) : -1;
        return rank<0 ? [] : [{kind:"case",id:key,name:c.name,tag:c.cite,score:rank,authored:c.authored}];
      }).sort((a,b)=>b.score-a.score || b.tag.localeCompare(a.tag,undefined,{numeric:true}));
    } else {
      state.rows=[...topicMap].filter(([,t])=>!q || (numeric ? broadTopics[q]===t.id || t.groups.some(g=>g[2].includes(q)) : wordMatch(q,`${t.title} ${t.groups.map(g=>g[1]).join(" ")}`)))
        .map(([id,t])=>({kind:"topic",id,name:t.title,tag:"Casebook",score:q && lower(t.title).includes(q) ? 3 : 0,count:new Set(t.groups.flatMap(g=>g[3])).size})).sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
    }
    showResults();
  } catch {
    if (origin!==state.seq) return;
    $("result-status").textContent="The collection could not be loaded.";
    $("results").innerHTML=`<div class="empty"><strong>Try loading again.</strong><button class="secondary notice-action" data-retry="results" type="button">Retry</button></div>`;
  }
}
function showResults(notice="") {
  const count=state.rows.length, start=state.page*PAGE, page=state.rows.slice(start,start+PAGE);
  const label={statutes:"statute",saved:cityView ? "saved ordinance" : "saved statute",cases:"case",topics:"topic",city:"city section",complaints:"manual entry"}[state.mode];
  const plural=label==="case" ? "cases" : label==="manual entry" ? "manual entries" : `${label}s`;
  $("result-status").textContent=`${fmt(count)} ${count===1 ? label : plural}${state.query ? ` matching “${state.query}”` : ""}${notice ? ` · ${notice}` : ""}`;
  if (!page.length) {
    const emptyChapter=state.mode==="city" && !state.query && state.chapter && cityChapters.get(state.chapter)?.[2]===0;
    $("results").innerHTML=emptyChapter ? `<div class="empty"><strong>No codified sections in this chapter</strong>${link(cityChapters.get(state.chapter)[3],"Read the chapter on Municode")}</div>` : `<div class="empty"><strong>${state.mode==="saved" && !state.query ? "Nothing saved yet" : "No matches found"}</strong>${state.mode==="saved" && !state.query ? "Open any section and select Save to add it to this page session’s review queue." : "Try a section number, fewer words, or a broader filter."}</div>`;
  } else {
    const arrow=$("arrow").innerHTML;
    $("results").innerHTML=page.map(row=>{
      const tag=row.kind==="statute" ? `ORC ${row.id}` : row.kind==="city" ? `CCC ${row.id}` : row.tag;
      const type=["statute","city"].includes(row.kind) ? `Title ${row.id.slice(0,2)}` : row.kind==="case" ? (row.authored ? "Study note" : "Case reference") : row.kind==="complaint" ? (row.count ? `${fmt(row.count)} variant${row.count===1?"":"s"}` : "Related code") : row.count ? `${fmt(row.count)} citations` : "Topic link";
      return `<button type="button" class="result-row" data-open="${row.kind}" data-id="${escape(row.id)}"><span class="result-tag">${escape(tag)}</span><span class="result-name">${escape(row.name)}${row.snippet ? `<span class="snippet">${escape(row.snippet)}</span>` : ""}</span><span class="result-type">${escape(type)}</span>${arrow}</button>`;
    }).join("");
  }
  $("pagination").hidden=count<=PAGE;
  $("previous").disabled=state.page===0;
  $("next").disabled=start+PAGE>=count;
  $("page-range").textContent=`${fmt(start+1)}–${fmt(Math.min(start+PAGE,count))} of ${fmt(count)}`;
}
function setQuery(value) {
  clearTimeout(pendingSearch);
  state.query=value.trim(); run();
}
function page(delta) {
  state.page += delta; showResults();
  $("results").querySelector("button")?.focus({preventScroll:true});
  $("results-heading").scrollIntoView({block:"start"});
}
function hashFor(kind,id,tab) {
  return `#${kind==="statute" ? "orc" : kind==="city" ? "ccc" : kind}=${encodeURIComponent(id)}${["statute","city"].includes(kind) && tab!=="law" ? `&view=${tab}` : ""}`;
}
function setHash(hash) { try { history.replaceState(null,"",hash || location.pathname+location.search); } catch { /* allow sandbox preview */ } }
function header(kicker,title,meta="") {
  $("review-kicker").textContent=kicker;
  $("review-title").textContent=title;
  $("review-meta").textContent=meta;
}
function open(kind,id,tab="law",nested=false) {
  if (kind==="statute" && !sections.has(id)) return;
  if (!dialog.open) {
    originalFocus=document.activeElement;
    backStack=[];
    dialog.showModal();
    document.body.classList.add("dialog-open");
  } else if (nested && dialogData && (dialogData.id!==id || dialogData.kind!==kind)){
    backStack.push({...dialogData});
  }
  dialogData={kind,id,tab};
  setHash(hashFor(kind,id,tab));
  renderDialog(true);
}
function backButton() {return backStack.length ? `<button type="button" class="secondary" data-back="true">Back</button>` : "";}
function statuteTools(id,tab,municipal=false) {
  const tabs=municipal ? [["law","Ordinance"],["complaint","Complaint language"],["crosswalk","Related ORC"],["study","Study & penalties"]] : [["law","Statute"],["complaint","Complaint language"],["cases","Related cases"],["study","Study & sentencing"],["crosswalk","Columbus code"]];
  const key=municipal ? `ccc:${id}` : id;
  tools.innerHTML=`${backButton()}<div role="tablist" aria-label="Review sections">${tabs.map(([k,l])=>`<button class="tab" id="tab-${k}" role="tab" type="button" data-tab="${k}" aria-controls="review-main" aria-selected="${k===tab}" tabindex="${k===tab ? 0 : -1}">${l}</button>`).join("")}</div><button type="button" class="secondary save" data-save="${key}" aria-pressed="${saved.has(key)}">${saved.has(key) ? "Saved" : "Save"}</button>`;
  html.setAttribute("role","tabpanel"); html.setAttribute("aria-labelledby",`tab-${tab}`);
}
function crosswalkPanel(id, municipal) {
  const comparisons=municipal ? city.byCity[id] || [] : city.byOrc[id] || [];
  const heading=municipal ? "Related Ohio Revised Code sections" : "Related Columbus City Code sections";
  const outside=municipal ? citySections.get(id)?.[4] || [] : [];
  return `<h3>${heading}</h3><div class="review-note">State law and city ordinances are separate authorities. A parallel provision covers similar conduct, but elements, exceptions, offense grades and penalties can differ. Same-subject links are starting points for comparison; source-history and text citations are references, not equivalents.</div>
    ${comparisons.length ? `<div class="comparison-list">${comparisons.map(c=>{
      const other=municipal ? c.orc : c.city;
      const name=municipal ? sections.get(other)?.[1] : c.name;
      return `<div class="comparison-item"><p class="eyebrow">${escape(c.kind)}</p><button type="button" class="secondary" data-open="${municipal ? "statute" : "city"}" data-id="${escape(other)}">${municipal ? "ORC" : "CCC"} ${escape(other)} · ${escape(name)}</button><p>${escape(c.note)}</p><details class="compare" data-compare data-orc="${escape(c.orc)}" data-ccc="${escape(municipal ? id : c.city)}"><summary>Compare ordinance and statute text</summary><div class="compare-body"></div></details></div>`;
    }).join("")}</div>` : `<p>No paired section is indexed. This does not mean a counterpart does not exist.</p>`}
    ${outside.length ? `<h3>Other state citations</h3><p>These Ohio Revised Code sections are outside this workbook’s state titles.</p><div class="link-bar">${outside.map(n=>link(`${LAW}section-${n}`,`ORC ${n}`)).join("")}</div>` : ""}
    ${city.pending.length ? `<p class="footnote">${fmt(city.chapters.length)} of ${fmt(city.chapters.length+city.pending.length)} chapters indexed in Columbus Titles 21 and 23.</p>` : ""}
    <div class="link-bar">${municipal ? link(LAW,"Browse Ohio Laws") : `<a href="./index.html?workbook=columbus">Open the Columbus workbook</a>`}</div>`;
}
function cityPanel(row,data,tab) {
  const [id,,node]=row;
  const links=`<div class="link-bar">${link(`${CITY}?nodeId=${encodeURIComponent(node)}`,"Open the ordinance on Municode")}${link(cityChapters.get(id.split(".")[0])[3],"Open the city chapter")}${link(CITY,"Check adopted and uncodified ordinances")}</div>`;
  if(tab==="law") return `${links}<h3>Codified ordinance text</h3>${data.reserved ? "<p>This section is listed as reserved.</p>" : `<div class="legal-html city-legal">${data.html}</div>`}${data.history.length ? `<p class="footnote">${data.history.map(escape).join(" ")}</p>` : ""}`;
  const checked=checkState.get(`ccc:${id}`) || new Set();
  return `<h3>Penalty language in this ordinance</h3><div class="review-note">These are extracted clauses, not a sentencing calculation. Apply the city ordinance, applicable city general penalties, and any state provision that the city code expressly invokes. Do not substitute the corresponding state offense’s penalties.</div>
    ${data.penalties.length ? `<ul>${data.penalties.map(i=>`<li>${escape(data.clauses[i])}</li>`).join("")}</ul>` : `<p>No penalty clause was automatically identified here. Check the text, linked provisions, and city penalty rules.</p>`}
    <h3>Clause review checklist</h3><p>Check each clause as you study. This is not a jury instruction or a statement that every clause is an element. Checkmarks remain during this page session.</p>
    <p id="check-status" aria-live="polite">${fmt(checked.size)} of ${fmt(data.clauses.length)} reviewed</p>
    <div class="checklist">${data.clauses.map((p,i)=>`<label class="checkline"><input type="checkbox" data-check="${i}" ${checked.has(i) ? "checked" : ""}><span>${escape(p)}</span></label>`).join("")}</div>${links}`;
}
html.addEventListener("toggle",async e=>{
  const el=e.target;
  if(!el.matches("[data-compare]") || !el.open || el.dataset.loaded) return;
  const out=el.querySelector(".compare-body");
  const {ccc,orc}=el.dataset;
  out.textContent="Loading ordinance and statute…";
  try {
    const [localRows,stateRows]=await Promise.all([json(`city/${ccc.split(".")[0]}`),json(`statutes/${orc.split(".")[0]}`)]);
    const local=citySections.get(ccc), statute=sections.get(orc);
    out.innerHTML=`<div class="compare-grid">
      <section><h4>CCC ${escape(ccc)} · ${escape(local[1])}</h4><div class="link-bar">${link(`${CITY}?nodeId=${encodeURIComponent(local[2])}`,"Municode ordinance")}</div><div class="legal-html city-legal">${localRows[ccc].reserved ? "Reserved." : localRows[ccc].html}</div></section>
      <section><h4>ORC ${escape(orc)} · ${escape(statute[1])}</h4><div class="link-bar">${link(official(statute),"Ohio Laws statute")}</div><div class="legal-html">${stateRows[orc].html}</div></section></div>`;
    el.dataset.loaded="true";
  } catch {out.textContent="The comparison could not be loaded. Close and expand it to retry.";}
},true);
function caseButton(key) {
  const c=mergedCases.get(key);
  if (!c) return "";
  return `<button type="button" class="case-card" data-open="case" data-id="${escape(key)}"><span class="case-citation">${escape(c.cite)}${c.reporter ? ` · ${escape(c.reporter)}` : ""}</span><strong>${escape(c.name)}</strong>${c.issue ? `<span>${escape(c.issue)}</span>` : ""}</button>`;
}
function resourceLinks(query, caseInfo=null) {
  const items=[];
  const quote=`"${query}"`;
  if (!caseInfo?.url) items.push(link(COURT,"Ohio court opinion search"));
  if (!caseInfo?.mirrors?.Justia) items.push(link(sourceSearch("law.justia.com/cases/ohio",quote),"Search Justia (Ohio)"));
  if (!caseInfo?.mirrors?.FindLaw) items.push(link(sourceSearch("caselaw.findlaw.com",`Ohio ${quote}`),"Search FindLaw (Ohio)"));
  if (!caseInfo) items.push(link(sourceSearch("opd.ohio.gov/law-library/criminal-law-casebook",quote),"Search OPD Casebook"));
  return `<div class="link-bar">${items.join("")}</div>`;
}
function casePanel(n) {
  const keys=direct.get(n) || [];
  const authored=keys.filter(k=>mergedCases.get(k).selectedRefs?.includes(n));
  const cited=keys.filter(k=>!authored.includes(k));
  const context=nearby.get(n) || [];
  const banned=new Set(keys);
  const groups=context.map(g=>({...g,keys:g.keys.filter(k=>!banned.has(k))})).filter(g=>g.keys.length || g.label);
  const broad=topicMap.get(broadTopics[n]);
  return `<div class="cases-panel">
    <div class="review-note">Study notes summarize selected opinions. Casebook references identify cases cited near this section in OPD material; they do not establish a holding or confirm that a decision is still good law.</div>
    ${authored.length ? `<h3>Selected opinion reviews</h3><div class="case-stack">${authored.map(caseButton).join("")}</div>` : ""}
    ${cited.length ? `<h3>Casebook references with this section number</h3><div class="case-stack">${cited.map(caseButton).join("")}</div>` : ""}
    ${groups.length ? `<h3>Cases in related casebook entries</h3><p>These decisions share a casebook entry with a reference to this section. They may address a different issue.</p>${groups.map(g=>`<details class="case-group"><summary>${escape(g.topic.title)}${g.label ? `: ${escape(g.label)}` : ""} (${fmt(g.keys.length)})</summary><div class="link-bar">${link(`${g.topic.url}${g.anchor ? `#${encodeURIComponent(g.anchor)}` : ""}`,"Read the OPD entry")}</div><div class="case-stack">${g.keys.map(caseButton).join("")}</div></details>`).join("")}` : ""}
    ${broad ? `<div class="link-bar"><button class="secondary" type="button" data-open="topic" data-id="${escape(broad.id)}">Browse ${escape(broad.title)}</button></div>` : ""}
    ${!keys.length && !groups.length ? "<p>No case has been matched to this section in the local index. That does not mean there are no relevant opinions.</p>" : ""}
    <h3>Look for more decisions</h3><p>Use the section number in the official opinion search. The other searches are scoped to the named sites and may return unrelated results.</p>
    ${resourceLinks(n)}
  </div>`;
}
function statutePanel(row,data,tab) {
  const [n,,,key]=row;
  const officialLinks=`<div class="link-bar">${link(LAW+key,"Open official statute")}${link(LAW+`chapter-${n.split(".")[0]}`,"Open official chapter")}</div>`;
  if (tab==="law") return `<div class="statute-panel">${officialLinks}${data.latest ? `<p class="footnote">Latest legislation in snapshot: ${escape(data.latest)}</p>` : ""}<h3>Full statutory text</h3><div class="legal-html">${data.html}</div></div>`;
  const temp=document.createElement("template");
  temp.innerHTML=data.html;
  let paragraphs=[...temp.content.querySelectorAll(".clause")];
  if (!paragraphs.length) paragraphs=[...temp.content.querySelectorAll("p,li")].filter(p=>!p.parentElement?.closest("p,li,table"));
  const checked=checkState.get(n) || new Set();
  const penalty=document.createElement("template");
  penalty.innerHTML=data.penalty; penalty.content.querySelector("h4")?.remove();
  const refs=data.refs.filter(id=>sections.has(id) && id!==n);
  return `<div class="study-panel">
    <h3>Offense level &amp; punishment</h3>
    ${data.penalty ? `<div class="review-note">Start with the penalty in the statute or its cross-referenced provision. General ranges apply only after determining the degree and any exception, enhancement, mandatory term, or other special rule.</div><div class="rules-grid">${penalty.innerHTML}</div>` : `<p>No offense-grade or punishment card is indexed for this section. Read the full statutory text and any applicable cross-references.</p>`}
    ${refs.length ? `<h3>Sections cited in the statute</h3><div class="link-bar">${refs.map(id=>`<button class="secondary" type="button" data-open="statute" data-id="${escape(id)}">ORC ${escape(id)}</button>`).join("")}</div>` : ""}
    <h3>Clause review checklist</h3>
    <p>Mark clauses as you review them. This checklist follows the statute’s text, not a jury instruction. Some clauses are alternatives, definitions, exceptions, or sentencing factors. Checkmarks are held for this page session.</p>
    <p id="check-status" aria-live="polite">${fmt(checked.size)} of ${fmt(paragraphs.length)} reviewed</p>
    <div class="checklist">${paragraphs.map((p,i)=>`<label class="checkline"><input type="checkbox" data-check="${i}" ${checked.has(i) ? "checked" : ""}><span>${escape(p.textContent.trim())}</span></label>`).join("")}</div>
    ${officialLinks}</div>`;
}
async function renderDialog(focus) {
  const seq=++openSeq, {kind,id,tab}=dialogData;
  const requested=codeQuery(state.query).replace(/\s+/g,"");
  html.innerHTML='<p role="status">Loading review…</p>';
  html.scrollTop=0;
  if (kind==="statute") {
    const row=sections.get(id);
    header(`Ohio Revised Code / Title ${id.slice(0,2)} / ORC ${id}`,row[1],row[2] ? `Effective ${row[2]}` : "");
    statuteTools(id,tab);
    if (focus) $("review-title").focus();
    try {
      const output=tab==="complaint" ? await complaintPanel(`ORC:${id}`,/\breserved\b|\brepealed\b/i.test(row[1]),requested) : tab==="cases" ? (await initBook(), casePanel(id)) : tab==="crosswalk" ? (await initCity(),crosswalkPanel(id,false)) : statutePanel(row,(await json(`statutes/${id.split(".")[0]}`))[id],tab);
      if (seq===openSeq && dialog.open) html.innerHTML=output;
    } catch {
      if (seq===openSeq) html.innerHTML=`<p>That review could not be loaded.</p><div class="link-bar">${link(official(row),"Open the official statute")}</div><button class="secondary" data-retry="review" type="button">Retry</button>`;
    }
    return;
  }
  if(kind==="city") {
    header(`Columbus City Code / CCC ${id}`,"Loading ordinance");
    tools.innerHTML=backButton();
    try {
      await initCity();
      const row=citySections.get(id);
      if(!row) throw Error("Ordinance is not indexed");
      if(seq!==openSeq || !dialog.open) return;
      header(`Columbus City Code / Title ${id.slice(0,2)} / CCC ${id}`,row[1],`Supplement ${city.supplement} · Codified through ${city.codified}`);
      statuteTools(id,tab,true);
      if(focus) $("review-title").focus(); else $(`tab-${tab}`)?.focus();
      const output=tab==="complaint" ? await complaintPanel(`CCC:${id}`,/\breserved\b|\brepealed\b/i.test(row[1]),requested) : tab==="crosswalk" ? crosswalkPanel(id,true) : cityPanel(row,(await json(`city/${id.split(".")[0]}`))[id],tab);
      if(seq===openSeq && dialog.open) html.innerHTML=output;
    } catch {
      if(seq!==openSeq) return;
      header(`Columbus City Code / CCC ${id}`,"Ordinance unavailable");
      html.innerHTML=`<p>This ordinance is unavailable in the local workbook.</p><div class="link-bar">${link(CITY,"Open Columbus City Code on Municode")}</div><button class="secondary" data-retry="review" type="button">Retry</button>`;
    }
    return;
  }
  tools.innerHTML=backButton(); html.removeAttribute("role"); html.removeAttribute("aria-labelledby");
  if(kind==="complaint"){
    header("Columbus Division of Police / Complaint manual",id.replace(":"," "),"Not indexed in the statute or city workbook");
    try {
      const output=await complaintPanel(id,false,requested);
      if(seq===openSeq && dialog.open) html.innerHTML=output;
      if(focus && seq===openSeq && dialog.open) $("review-title").focus();
    } catch {
      if(seq===openSeq) html.innerHTML='<p>The complaint manual could not be loaded.</p><button class="secondary" data-retry="review" type="button">Retry</button>';
    }
    return;
  }
  header(kind==="case" ? "Ohio case law" : "Ohio Public Defender casebook","Loading review");
  try {
    await initBook();
    if (seq!==openSeq || !dialog.open) return;
    if (kind==="topic") {
      const t=topicMap.get(id);
      if (!t) throw Error("Missing topic");
      header("Ohio Public Defender / Casebook topic",t.title);
      html.innerHTML=`<div class="link-bar">${link(t.url,"Read the original OPD topic")}</div><div class="review-note">This index lists case citations and topic headings. For commentary and context, read the original casebook.</div>${t.groups.length ? t.groups.map(([anchor,label,refs,keys])=>`<details class="case-group"${t.groups.length===1 ? " open" : ""}><summary>${escape(label||t.title)} (${fmt(keys.length)})</summary>${anchor ? `<div class="link-bar">${link(`${t.url}#${encodeURIComponent(anchor)}`,"Open original subsection")}</div>` : ""}${refs.length ? `<div class="link-bar">${refs.map(n=>`<button class="secondary" type="button" data-open="statute" data-id="${escape(n)}">ORC ${escape(n)}</button>`).join("")}</div>` : ""}<div class="case-stack">${keys.map(caseButton).join("")}</div></details>`).join("") : "<p>This is a casebook navigation page. Use the original topic link to browse its subtopics.</p>"}`;
    } else {
      const c=mergedCases.get(id);
      if (!c) throw Error("Missing case");
      header("Ohio case law",c.name,[c.cite,c.reporter,c.court].filter(Boolean).join(" · "));
      const topicLinks=c.topics.map(([t,a,g])=>topicMap.has(t) ? link(`${topicMap.get(t).url}${a ? `#${encodeURIComponent(a)}` : ""}`,`${topicMap.get(t).title}${g ? `: ${g}` : ""}`) : "");
      if (c.topic && topicMap.has(c.topic) && !c.topics.some(([t])=>t===c.topic)) topicLinks.push(link(topicMap.get(c.topic).url,`Topic: ${topicMap.get(c.topic).title}`));
      const mirrors=Object.entries(c.mirrors || {});
      const lookup=/\d{4}-Ohio-\d+/i.test(c.cite) ? c.cite : `${c.name} ${c.cite}`;
      html.innerHTML=`<div class="link-bar">${c.url ? link(c.url,c.authored ? "Official opinion (PDF)" : "Opinion link from the casebook") : ""}${mirrors.map(([k,u])=>link(u,k)).join("")}</div>
        ${c.note ? `<h3>${escape(c.issue)}</h3><p>${escape(c.note)}</p><p class="footnote">Read: ${escape(c.para)}. This is a study note, not the full holding or a check of later treatment.</p>` : `<div class="review-note">Indexed citation from the Ohio Public Defender’s casebook. Read the opinion and the original casebook entry to verify the issue, holding, and later history.</div>`}
        ${c.refs.length ? `<h3>Referenced ORC sections</h3><div class="link-bar">${c.refs.map(n=>`<button class="secondary" type="button" data-open="statute" data-id="${escape(n)}">ORC ${escape(n)}</button>`).join("")}</div>` : ""}
        ${topicLinks.length ? `<h3>Ohio Public Defender casebook</h3><div class="link-bar">${topicLinks.join("")}</div>` : ""}
        <h3>Find the opinion online</h3>${resourceLinks(lookup,c)}
        ${c.text ? `<details class="case-group" id="opinion-details"><summary>Read opinion text here</summary><div id="opinion-text"></div></details>` : ""}`;
      if (c.text) $("opinion-details").addEventListener("toggle",async e=>{
        if (!e.target.open || e.target.dataset.loaded) return;
        const out=$("opinion-text");
        out.textContent="Loading opinion text…";
        try {
          const pages=await json(`opinions/${c.text.replace(/\.json$/,"")}`);
          out.innerHTML=`<p class="footnote">Text extracted from the ${link(c.url,"official opinion PDF")}. Use the original for formatting, figures, and official pagination.</p>${pages.map((text,i)=>`<div class="opinion-page"><span>PDF page ${i+1}</span>${escape(text)}</div>`).join("")}`;
          e.target.dataset.loaded="true";
        } catch {out.innerHTML=`<p>The text reader is unavailable. ${link(c.url,"Open the opinion PDF")}.</p>`;}
      });
    }
    if(focus) $("review-title").focus();
  } catch {
    if (seq!==openSeq) return;
    header("Research library","Review unavailable");
    html.innerHTML='<p>The review could not be loaded. Try again or use one of the original research sources.</p><button class="secondary" data-retry="review" type="button">Retry</button>';
  }
}
async function openManual(key,nested=true) {
  const [kind,id]=key.split(":");
  if(kind==="ORC" && sections.has(id)) open("statute",id,"complaint",nested);
  else if(kind==="CCC"){
    await initCity().catch(()=>null);
    if(citySections?.has(id)) open("city",id,"complaint",nested);
    else open("complaint",key,"law",nested);
  } else if(kind==="ORC") open("complaint",key,"law",nested);
}
wireComplaints(openManual);
function readHash() {
  const p=new URLSearchParams(location.hash.slice(1));
  if(p.has("orc")) open("statute",p.get("orc"),["law","study","cases","crosswalk","complaint"].includes(p.get("view")) ? p.get("view") : "law");
  else if (p.has("ccc")) open("city",p.get("ccc"),["law","study","crosswalk","complaint"].includes(p.get("view")) ? p.get("view") : "law");
  else if (p.has("complaint")) openManual(p.get("complaint"),false);
  else if (p.has("case")) open("case",p.get("case"));
  else if (p.has("topic")) open("topic",p.get("topic"));
}
$("search-form").addEventListener("submit",e=>{e.preventDefault();setQuery(search.value);});
search.addEventListener("input",()=>{clearTimeout(pendingSearch);pendingSearch=setTimeout(()=>setQuery(search.value),220);});
$("chapter").addEventListener("change",e=>{state.chapter=e.target.value;run();});
$("previous").addEventListener("click",()=>page(-1));
$("next").addEventListener("click",()=>page(1));
$("close-review").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog) dialog.close();});
dialog.addEventListener("close",()=>{
  openSeq++; document.body.classList.remove("dialog-open"); backStack=[];
  if (/^#(?:orc|ccc|case|topic|complaint)=/.test(location.hash)) setHash("");
  originalFocus?.focus({preventScroll:true}); dialogData=null;
});
tools.addEventListener("keydown",e=>{
  if(!e.target.matches("[data-tab]") || !["ArrowLeft","ArrowRight","Home","End"].includes(e.key)) return;
  e.preventDefault();
  const tabs=[...tools.querySelectorAll("[data-tab]")], i=tabs.indexOf(e.target);
  const n=e.key==="Home" ? 0 : e.key==="End" ? tabs.length-1 : (i+(e.key==="ArrowLeft" ? -1 : 1)+tabs.length)%tabs.length;
  const tab=tabs[n].dataset.tab;
  open(dialogData.kind,dialogData.id,tab); $(`tab-${tab}`)?.focus();
});
html.addEventListener("change",e=>{
  if (!e.target.matches("[data-check]")) return;
  const n=dialogData.kind==="city" ? `ccc:${dialogData.id}` : dialogData.id, set=checkState.get(n) || new Set(), i=Number(e.target.dataset.check);
  e.target.checked ? set.add(i) : set.delete(i);
  checkState.set(n,set);
  $("check-status").textContent=`${fmt(set.size)} of ${fmt(html.querySelectorAll("[data-check]").length)} reviewed`;
});
document.addEventListener("click",e=>{
  const btn=e.target.closest("button");
  if (!btn) return;
  const d=btn.dataset;
  if(d.scope) switchMode(d.scope);
  if(d.title) switchMode(cityView ? "city" : "statutes",state.title===d.title ? "" : d.title);
  if(d.query){search.value=d.query;setQuery(d.query);}
  if(d.open && catalog) d.open==="complaint" ? openManual(d.id) : open(d.open,d.id,"law",true);
  if(d.tab && dialogData){open(dialogData.kind,dialogData.id,d.tab);$(`tab-${d.tab}`)?.focus();}
  if(d.back && backStack.length){const b=backStack.pop();open(b.kind,b.id,b.tab);}
  if(d.retry==="results") run();
  if(d.retry==="review" && dialogData) renderDialog(true);
  if(d.save){
    if(saved.has(d.save)) saved.delete(d.save); else saved.add(d.save);
    store(); btn.textContent=saved.has(d.save) ? "Saved" : "Save";btn.setAttribute("aria-pressed",String(saved.has(d.save)));
    if(state.mode==="saved") run();
  }
});
window.addEventListener("hashchange",()=>{if(catalog) readHash();});
async function init() {
  try {
    catalog=await json("catalog");
    sections=new Map(catalog.sections.map(x=>[x[0],x]));
    chapters=new Map(catalog.titles.flatMap(t=>t[2]).map(x=>[x[0],x]));
    if(cityView) {
      await initCity();
      document.title="Columbus City Code Workbook | Ohio Law Desk";
      $("nav-orc").removeAttribute("aria-current"); $("nav-ccc").setAttribute("aria-current","page");
      $("breadcrumb-current").textContent="Columbus workbook";
      $("hero-title").textContent="Columbus City Code Workbook";
      $("hero-description").textContent="Search the Traffic Code and General Offenses Code, study ordinance clauses, and compare related Ohio statutes.";
      $("edition-label").textContent="Columbus City Code";
      $("edition-date").textContent=`Municode Supplement ${city.supplement}`;
      $("title-scope").textContent="Columbus City Code";
      $("scope-note-title").textContent="Columbus workbook scope";
      $("scope-note-text").textContent="Titles 21 and 23 only. Check Municode for uncodified ordinances and other city titles.";
      for(const b of document.querySelectorAll("[data-scope]")) b.hidden=!["city","saved","complaints"].includes(b.dataset.scope);
    }
    $("titles").innerHTML=`<div class="title-list">${Object.entries(cityView ? CITY_LABELS : LABELS).map(([id,label])=>`<button class="title-button" type="button" data-title="${id}" aria-pressed="false"><span class="title-num">${id}</span><span>${label}</span></button>`).join("")}</div>`;
    $("total-statutes").textContent=fmt(sections.size);
    const date=new Date(`${catalog.date}T12:00:00`);
    if(!cityView && !Number.isNaN(+date)) $("edition-date").textContent=date.toLocaleDateString("en-US",{dateStyle:"long"});
    syncControls(); store();
    document.querySelector('[data-scope="complaints"]').disabled=false;
    await run(); readHash();
    if (!cityView) {
      if ("requestIdleCallback" in window) requestIdleCallback(()=>initBook().catch(()=>{}),{timeout:1600});
      else setTimeout(()=>initBook().catch(()=>{}),500);
    }
  } catch {
    $("result-status").textContent=cityView ? "The Columbus index could not be loaded." : "The statute index could not be loaded.";
    const reload=document.createElement("button");reload.className="secondary";reload.textContent="Retry";reload.addEventListener("click",init,{once:true});$("results").replaceChildren(reload);
  }
}
init();
