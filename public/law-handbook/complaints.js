const esc = s => String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const formatKey = key => key.replace(":"," ");
const source = (page,label) => `<span class="manual-ref">${esc(label)}${page ? ` (manual page ${page})` : ""}</span>`;
let loaded, reader, activeReader, priorFocus;

export function complaintData() {
  return loaded ||= fetch("./data/complaints.json").then(r=>{
    if (!r.ok) throw Error(`Complaint manual: ${r.status}`);
    return r.json();
  }).catch(e=>{loaded=null;throw e;});
}

export async function complaintPanel(key, archived=false, requested="") {
  const data=await complaintData(), entries=data.codes[key] || [], affiliates=Object.keys(data.related[key] || {});
  const initial=Math.max(0,entries.findIndex(e=>e.citations.some(c=>c.toLowerCase().replace(/\s+/g,"")===key.split(":")[0].toLowerCase()+requested)));
  const options=entries.map((e,i)=>`<option value="${i}" ${i===initial?"selected":""}>${esc(`${e.citations[0]}${e.variant ? ` · ${e.variant}` : ` · ${e.heading}`} (manual p. ${e.page})`)}</option>`).join("");
  return `<section data-complaint-panel data-key="${esc(key)}" data-archived="${archived}">
    <div class="complaint-intro"><div><h3>Criminal complaint language</h3><p>Columbus Division of Police manual, revised through June 2026.</p></div></div>
    <div class="review-note">${archived ? "This code entry is listed as reserved or repealed. Historical wording is shown for reference only; quick copy is disabled." : "Use the version of the law that applies to the incident. Verify the subsection and any required facts, replace blanks, and select only the alternatives supported by the facts before filing."}</div>
    ${entries.length ? `<label class="complaint-label" for="complaint-variant">Complaint variant <span>(${entries.length})</span></label><select id="complaint-variant">${options}</select><div data-complaint-result>${entryHtml(entries[initial],archived)}</div>` : "<p>No complaint wording for this exact code was indexed from the manual. A related code’s wording is not a substitute.</p>"}
    ${affiliates.length ? `<div class="complaint-related"><h4>Related code cited in the manual</h4><p>The manual mentions this section alongside other charges. Review those entries under their own code and do not paste wording under a different citation.</p><div class="link-bar">${affiliates.map(k=>`<button type="button" class="secondary" data-manual-open="${esc(k)}">${esc(formatKey(k))}</button>`).join("")}</div></div>` : ""}
  </section>`;
}

const copyBlocked=(e,archived)=>archived || e.conflict || e.example || e.ambiguous;
function entryHtml(e,archived) {
  const blocked=copyBlocked(e,archived);
  return `<article class="complaint-card">
     <p class="eyebrow">${esc(e.citations[0])} · manual ${e.page===e.end ? `page ${e.page}` : `pages ${e.page}–${e.end}`}</p>
     <h4>${esc(e.variant || e.heading)}</h4>
     ${e.conflict ? '<div class="review-note">The citation in the heading and the wording differ in the manual. Check the original; quick copy is disabled for this entry.</div>' : ""}
     ${e.ambiguous ? '<div class="review-note">The heading lists both codes, but the wording does not clearly identify which one it charges. Check the original; quick copy is disabled.</div>' : ""}
     ${e.example ? '<div class="review-note">Illustrative example from the manual, not a blank complaint template.</div>' : ""}
     <div class="complaint-actions"><button class="primary" type="button" data-complaint-copy ${blocked ? "disabled" : ""}>Copy wording</button><button class="secondary" type="button" data-complaint-large>Large print</button>${source(e.page,"Source page")}</div>
     <p class="complaint-wording" data-complaint-text>${esc(e.text)}</p><div data-copy-status role="status" class="copy-status"></div>
     ${e.notes ? `<details class="case-group"><summary>Manual notes and charging options (not copied)</summary><p>${esc(e.notes)}</p></details>` : ""}
  </article>`;
}

async function selected(panel) {
  const data=await complaintData();
  return data.codes[panel.dataset.key]?.[Number(panel.querySelector("select")?.value || 0)];
}

function oldCopy(text,scope) {
  const box=document.createElement("textarea");
  box.value=text; box.readOnly=true; box.className="clipboard-helper";
  scope.append(box); box.select(); box.setSelectionRange(0,box.value.length);
  let ok=false;
  try { ok=document.execCommand("copy"); } catch { /* a sandbox can block copying */ }
  box.remove();
  return ok;
}

async function copy(scope,button) {
  const text=scope.querySelector("[data-complaint-text]")?.textContent || "";
  if(!text) return;
  const status=scope.querySelector("[data-copy-status]");
  let ok=false;
  if(navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); ok=true; } catch { /* try selection-based copy */ }
  }
  if (!ok) ok=oldCopy(text,scope);
  button.focus({preventScroll:true});
  if (ok) status.textContent="Complaint wording copied.";
  else {
    const range=document.createRange();
    range.selectNodeContents(scope.querySelector("[data-complaint-text]"));
    const selection=window.getSelection();
    selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent="Automatic copying is blocked. The wording is selected; use your device’s Copy command.";
  }
}

function largePrint(entry,archived,trigger) {
  reader ||= document.getElementById("complaint-reader");
  priorFocus=trigger;
  activeReader=entry;
  reader.querySelector("[data-reader-title]").textContent=entry.variant || entry.heading;
  reader.querySelector("[data-reader-citation]").textContent=`${entry.citations[0]} · June 2026 manual · page ${entry.page}`;
  reader.querySelector("[data-complaint-text]").textContent=entry.text;
  reader.querySelector("[data-copy-status]").textContent="";
  reader.querySelector("[data-reader-source]").innerHTML=source(entry.page,"Open source page");
  reader.querySelector("[data-complaint-copy]").disabled=copyBlocked(entry,archived);
  reader.querySelector("[data-reader-warning]").hidden=!copyBlocked(entry,archived);
  reader.dataset.typeSize="0";
  reader.showModal();
  reader.querySelector(".reader-scroll").scrollTop=0;
  reader.querySelector("[data-reader-title]").focus();
}

export function wireComplaints(openKey) {
  reader=document.getElementById("complaint-reader");
  reader.addEventListener("close",()=>{activeReader=null;priorFocus?.focus({preventScroll:true});});
  document.addEventListener("change",async e=>{
    if(e.target.id!=="complaint-variant") return;
    const panel=e.target.closest("[data-complaint-panel]");
    const entry=await selected(panel);
    if(entry) panel.querySelector("[data-complaint-result]").innerHTML=entryHtml(entry,panel.dataset.archived==="true");
  });
  document.addEventListener("click",async e=>{
    const btn=e.target.closest("button");
    if(!btn) return;
    if(btn.dataset.manualOpen) openKey(btn.dataset.manualOpen);
    if(btn.hasAttribute("data-reader-close")) reader.close();
    if(btn.dataset.readerSize) reader.dataset.typeSize=String(Math.max(-1,Math.min(2,Number(reader.dataset.typeSize)+Number(btn.dataset.readerSize))));
    if(btn.hasAttribute("data-complaint-copy") && !btn.disabled) {
      const scope=btn.closest(".complaint-card") || reader;
      if(scope!==reader || activeReader) await copy(scope,btn);
    }
    if(btn.hasAttribute("data-complaint-large")) {
      const panel=btn.closest("[data-complaint-panel]"), entry=await selected(panel);
      if(entry && panel.isConnected) largePrint(entry,panel.dataset.archived==="true",btn);
    }
  });
}
