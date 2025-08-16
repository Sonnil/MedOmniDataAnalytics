/* shared.js — Common data, helpers, filters, and chart loaders used by all pages */

/* =========================
   Demo Data (mock)
========================= */
const TAs = ["Oncology","Immunology","Cardio","Neuro"]; 
const BusinessUnits = ["Specialty Care","GenMed","Vaccines"];
const Products = ["Alpha-01","Beta-Plus","Cardex","NeuroQ"];
const Countries = ["US","DE","FR","UK","ES","IT","BR","JP","CN","CA"];
const Segments = ["KOL","Specialist","GP","Nurse"];

function randBetween(min,max){return Math.round(min + Math.random()*(max-min))}
function pct(){return +(Math.random()*100).toFixed(1)}

const clock = (()=> {
  const now = new Date();
  const qs = [];
  let year = now.getFullYear() - 3, q = 1;
  for(let i=0;i<12;i++){
    qs.push({label:`Q${q} ${year}`, date: new Date(year, (q-1)*3, 1)});
    q++; if(q===5){q=1; year++;}
  }
  return {quarters: qs};
})();

function buFromTA(ta){
  // Simple mapping: Cardio => GenMed; Oncology/Immunology/Neuro => Specialty Care; small chance to be Vaccines
  const base = (ta === 'Cardio') ? 'GenMed' : 'Specialty Care';
  // introduce some Vaccines data presence randomly
  return (Math.random() < 0.12) ? 'Vaccines' : base;
}

function buFromEvent(name){
  try{
    const s = String(name||'');
    // simple stable hash to bucket to 3 BUs
    let h = 0; for (let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
    const idx = Math.abs(h) % BusinessUnits.length;
    return BusinessUnits[idx];
  }catch{ return 'Specialty Care'; }
}

function makeInteractions(){
  const channels = ["F2F","Remote","CLM/IVA","Email","Web","Events"];
  const rows = [];
  Countries.forEach(c=>{
    channels.forEach(ch=>{
      rows.push({
        country:c, channel:ch, ta:TAs[randBetween(0,TAs.length-1)],
        product:Products[randBetween(0,Products.length-1)],
        segment:Segments[randBetween(0,Segments.length-1)],
    business: null, // set below after TA selection
        interactions: randBetween(50, 1200),
        avgCallMin: randBetween(6,25),
        freqPerHCP: +(Math.random()*4).toFixed(1)
      });
    });
  });
  rows.forEach(r=>{ r.business = buFromTA(r.ta); });
  return {channels, rows};
}

function makeNPS(){
  const rows = [];
  Countries.forEach(c=>{
    TAs.forEach(ta=>{
      Segments.forEach(seg=>{
  rows.push({ country:c, ta, segment:seg, business: buFromTA(ta), nps: randBetween(-20, 70), K: randBetween(50,95), A: randBetween(40,90), B: randBetween(30,85) });
      })
    })
  })
  return rows;
}

function makeEvents(){
  const events = ["ASCO","ESMO","AHA","EAN","EULAR","ASH","ERS","ESICM","WCN"];
  const rows = events.map(name=>({
    name,
    business: buFromEvent(name),
    attendees: randBetween(500, 12000),
    boothTimeMin: randBetween(2000, 20000),
    surveyRelevance: randBetween(60,95),
    insights: randBetween(10,120),
    followupsDonePct: randBetween(40,95)
  }));
  return rows;
}

function makeLearning(){
  const rows = [];
  Countries.forEach(c=>{
    TAs.forEach(ta=>{
  rows.push({ country:c, ta, business: buFromTA(ta), completion: randBetween(55,99), timeToComplete: randBetween(1,21), knowledge: randBetween(50,95), skill: randBetween(45,90) })
    })
  });
  return rows;
}

function makeDigital(){
  const assets = ["MOA Video","eDetail: Alpha","Email Seq A","HCP Portal","Webinar-Series","Blog: Cardio","Whitepaper Neuro"];
  const rows = assets.map(a=>({
    asset:a, segment:Segments[randBetween(0,Segments.length-1)],
  business: BusinessUnits[randBetween(0,BusinessUnits.length-1)],
    visits: randBetween(200,20000),
    unique: randBetween(100,15000),
    views: randBetween(200,18000),
    clicks: randBetween(50,6000),
    shares: randBetween(10,1200),
    emailOpen: pct(), emailCTR: +(Math.random()*9).toFixed(1),
    impressions: randBetween(10000, 500000),
    videoCompletion: randBetween(20,95)
  }));
  return rows;
}

function makeFoundational(){
  const categories = ["CRM","Medical Info","Events","HCP Master","Veeva CLM","Web Analytics","Email","Survey","RWD Claims","RWE Studies"];
  const rows = categories.map(cat=>({
    category:cat,
    internalSources: randBetween(1,8),
    externalDatasets: randBetween(0,5),
    externalUseRate: pct(),
    quality: randBetween(70,99),
    automatedPct: randBetween(30,90),
    aiPreprocess: randBetween(10,80)
  }))
  return rows;
}

const DATA = {
  interactions: makeInteractions(),
  nps: makeNPS(),
  events: makeEvents(),
  learning: makeLearning(),
  digital: makeDigital(),
  foundational: makeFoundational(),
  progressByQuarter: clock.quarters.map(q=>({date:q.date, label:q.label, planned: randBetween(5000,12000), actual: randBetween(4200,11500)}))
};

/* =========================
   Helpers / UI
========================= */
const $ = (sel, root=document)=>root.querySelector(sel);
function el(tag, cls, html){ const n=document.createElement(tag); if(cls) n.className=cls; if(html!==undefined) n.innerHTML=html; return n; }
function fmt(n){ return Number(n).toLocaleString() }
function pctColor(v){ if(v>=85) return 'var(--good)'; if(v>=60) return 'var(--warn)'; return 'var(--bad)'; }
function npsColor(v){ if(v>=50) return 'var(--good)'; if(v>=0) return 'var(--warn)'; return 'var(--bad)'; }
function heatColor(val, min=0, max=100){ const t=(val-min)/(max-min); const a=125+(167-125)*t; const b=211+(83-211)*t; const c=252+(131-252)*t; return `rgba(${a|0},${b|0},${c|0},0.45)`}

// Shared color palette for charts
const ChartPalette = ['#7dd3fc','#a78bfa','#fda4af','#fbbf24','#34d399','#60a5fa','#f472b6','#f59e0b','#22d3ee','#4ade80'];

// Map country code → world-atlas name
const CountryNameMap = {US:'United States of America', UK:'United Kingdom', DE:'Germany', FR:'France', ES:'Spain', IT:'Italy', BR:'Brazil', JP:'Japan', CN:'China', CA:'Canada'};

// Time formatting helper (seconds → mm:ss)
function mmss(totalSec){ try{ const s = Number(totalSec)||0; const m=Math.floor(s/60), sec=s%60; return `${m}:${String(sec).padStart(2,'0')}` }catch{ return '0:00' } }

// Simple debounce for input handlers
function debounce(fn, delay=120){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=> fn(...args), delay); }; }

// Lazy loader for external scripts (cached promises)
function loadScriptOnce(url, key){
  if (!window.__scriptPromises) window.__scriptPromises = {};
  const k = key || url;
  if (!window.__scriptPromises[k]){
    window.__scriptPromises[k] = new Promise((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = ()=> resolve();
      s.onerror = (e)=> reject(e);
      document.head.appendChild(s);
    });
  }
  return window.__scriptPromises[k];
}

// Ensure Chart.js + date adapter are loaded
function ensureChart(){
  if (window.Chart) return Promise.resolve();
  return Promise.all([
    loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js', 'chartjs'),
    loadScriptOnce('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3', 'date-adapter')
  ]);
}

// Ensure Geo plugins (ChartGeo + topojson)
function ensureGeoLibs(){
  if (window.ChartGeo) return Promise.resolve();
  return ensureChart().then(()=> Promise.all([
    loadScriptOnce('https://cdn.jsdelivr.net/npm/topojson-client@3', 'topojson'),
    loadScriptOnce('https://cdn.jsdelivr.net/npm/chartjs-chart-geo@4.3.0/build/index.umd.min.js', 'chartjs-geo')
  ]));
}

// Ensure ECharts + echarts-gl (for interactive 3D globe)
function ensureEChartsGl(){
  if (window.echarts && (window.echarts.gl || (window.echarts._disposed === false))) return Promise.resolve();
  return Promise.all([
    loadScriptOnce('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js', 'echarts'),
    loadScriptOnce('https://cdn.jsdelivr.net/npm/echarts-gl@2/dist/echarts-gl.min.js', 'echarts-gl')
  ]);
}

// Load world GeoJSON to color countries on the globe
function loadWorldGeo(){
  if (window.__worldGeo) return Promise.resolve(window.__worldGeo);
  const url = 'https://fastly.jsdelivr.net/npm/echarts-countries-js@1/dist/countries/world.json';
  return fetch(url).then(r=>r.json()).then(g=>{ window.__worldGeo = g; return g; }).catch(()=>null);
}

// Google Maps JS API loader (expects window.GMAPS_API_KEY to be set by host)
function ensureGoogleMaps(){
  if (window.google && window.google.maps) return Promise.resolve();
  const key = window.GMAPS_API_KEY || (window.__GMAPS_KEY);
  if (!key) return Promise.reject(new Error('no-gmaps-key'));
  if (window.__googleMapsPromise) return window.__googleMapsPromise;
  window.__GMAPS_KEY = key;
  window.__googleMapsPromise = new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=quarterly&libraries=visualization`;
    s.async = true; s.defer = true;
    s.onload = ()=> resolve();
    s.onerror = (e)=> reject(e);
    document.head.appendChild(s);
  });
  return window.__googleMapsPromise;
}

function kpi(title, value, delta=0, valColor){
  const d = el('div','kpi');
  d.innerHTML = `<div class="small">${title}</div>
                 <div class="val" ${valColor?`style="color:${valColor}"`:''}>${value}</div>
                 <div class="delta ${delta>0?'up':(delta<0?'down':'flat')}">${delta>0?'▲':(delta<0?'▼':'•')} ${Math.abs(delta)}%</div>`;
  return d;
}
function card(title, cls){ const c = el('div',`card ${cls||''}`); c.append(el('h3','',title)); return c; }
function canvas(h=220){ const cv=document.createElement('canvas'); cv.height=h; return cv; }

function leaderboardTable(subset){
  const agg = {};
  subset.forEach(r=>{ agg[r.country]=(agg[r.country]||0)+r.interactions; });
  const rows = Object.entries(agg).map(([country,val])=>({country, msl:"MSL "+country, interactions:val}))
    .sort((a,b)=>b.interactions-a.interactions).slice(0,8);
  const tbl = el('table','table');
  tbl.innerHTML = `<thead><tr><th>Market</th><th>MSL</th><th>Interactions</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td>${r.country}</td><td>${r.msl}</td><td>${fmt(r.interactions)}</td></tr>`).join("")}</tbody>`;
  return tbl;
}
function listBlock(title, items){
  const d = el('div','card'); d.append(el('h3','',title));
  const ul = el('ul',''); ul.style.margin="0"; ul.style.paddingLeft="18px";
  items.forEach(i=> ul.append(el('li','',i)) ); d.append(ul); return d;
}

/* =========================
   Multi-select Filters (checkboxes)
========================= */
const FILTER = { ta:new Set(), product:new Set(), country:new Set(), segment:new Set(), business:new Set() }; // empty = ALL
function matchesMulti(set,val){ return set.size===0 || set.has(val); }
function passFilters(row){
  return matchesMulti(FILTER.ta,row.ta) &&
         matchesMulti(FILTER.product,row.product) &&
         matchesMulti(FILTER.country,row.country) &&
         matchesMulti(FILTER.segment,row.segment) &&
         (row.business === undefined || matchesMulti(FILTER.business, row.business));
}

function buildMultiFilters(){
  const host = $("#filters"); if (!host) return; const row = $("#filtersRow"); if (!row) return;
  row.innerHTML="";
  row.append(
  checklistFilter("Business Unit", "business", BusinessUnits),
    checklistFilter("TA", "ta", TAs),
    checklistFilter("Product", "product", Products),
    checklistFilter("Country", "country", Countries),
    checklistFilter("HCP Segment", "segment", Segments),
  );

  // Auto-close other filters when one opens; compute alignment to keep in frame
  row.querySelectorAll('.filter details').forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        row.querySelectorAll('.filter details').forEach(o => { if (o !== d) o.removeAttribute('open'); });
      }
      // Adjust drop direction to keep in frame
      requestAnimationFrame(() => {
        const rect = d.getBoundingClientRect();
        const pop = d.querySelector('.pop');
        if (pop) {
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          if (d.open && spaceBelow < 260 && spaceAbove > spaceBelow) {
            d.parentElement.classList.add('drop-up');
          } else {
            d.parentElement.classList.remove('drop-up');
          }
          // Horizontal overflow handling: align pop to right if it would overflow viewport
          const popW = Math.max(pop.offsetWidth || 0, 260);
          const wouldOverflowRight = (rect.left + popW) > (window.innerWidth - 8);
          if (d.open && wouldOverflowRight) {
            d.parentElement.classList.add('align-right');
          } else {
            d.parentElement.classList.remove('align-right');
          }
        }
      });
    });
  });

  // Initial chips render
  renderActiveChips();
  // Update header toggle count badge
  try{ setGlobalFiltersCount(); }catch{}
}
function checklistFilter(label, key, values){
  const wrap = el("div","filter");
  const details = document.createElement("details");
  const sum = document.createElement("summary");
  const countSpan = el("span","small", "All");
  sum.textContent = label + ": "; sum.append(countSpan);
  // Per-filter clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-btn';
  clearBtn.type = 'button';
  clearBtn.textContent = 'x';
  clearBtn.title = `Clear ${label}`;
  clearBtn.setAttribute('aria-label', `Clear ${label}`);
  clearBtn.addEventListener('click', (e)=>{
    e.preventDefault(); e.stopPropagation();
    FILTER[key].clear();
    // uncheck all boxes in this list
    details.querySelectorAll('input[type="checkbox"]').forEach(c=> c.checked=false);
    updateFilterSummary(label, countSpan, sum, FILTER[key]);
    renderActiveChips();
    if (typeof route === 'function') route();
  });
  sum.append(clearBtn);
  details.append(sum);
  const pop = el("div","pop"); details.append(pop);
  // Search box for large option sets
  const searchWrap = el('div','');
  searchWrap.style.padding = '6px 6px 4px';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search...';
  searchInput.setAttribute('aria-label', `Search ${label}`);
  Object.assign(searchInput.style, { width:'100%', padding:'6px 8px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  searchWrap.append(searchInput);

  const applyRow = el("div","applyRow");
  const btnAll = el("button","btn secondary","Select all");
  const btnNone = el("button","btn secondary","x");
  btnNone.setAttribute('title', `Clear ${label}`);
  btnNone.setAttribute('aria-label', `Clear ${label}`);
  const btnApply = el("button","btn","Apply");
  applyRow.append(btnAll, btnNone, btnApply);

  const list = el("div","chklist");
  values.forEach(v=>{
    const id = `${key}-${v}`;
    const lab = document.createElement("label");
    lab.innerHTML = `<input type="checkbox" id="${id}"> <span>${v}</span>`;
    const input = lab.querySelector('input');
    // Pre-check based on existing FILTER state
    try{ if (FILTER[key] && FILTER[key].size && FILTER[key].has(v)) input.checked = true; }catch{}
    list.append(lab);
  });
  // Initialize summary to reflect current selections (if any)
  try{ updateFilterSummary(label, countSpan, sum, FILTER[key]); }catch{}
  const noRes = el('div','small','No results');
  noRes.style.padding = '4px 8px';
  noRes.style.display = 'none';
  noRes.style.color = '#94a3b8';
  pop.append(searchWrap, list, noRes, applyRow);

  function filterList(){
    const q = (searchInput.value||'').toLowerCase().trim();
    let shown = 0;
    list.querySelectorAll('label').forEach(l=>{
      const txt = (l.textContent||'').toLowerCase();
      const hit = !q || txt.includes(q);
      l.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    noRes.style.display = shown ? 'none' : '';
  }
  // Debounced to reduce reflows while typing
  try{ searchInput.addEventListener('input', debounce(filterList, 120)); }catch{ searchInput.addEventListener('input', filterList); }

  btnAll.onclick = (e)=>{ e.preventDefault(); list.querySelectorAll('input[type="checkbox"]').forEach(c=>c.checked=true); };
  btnNone.onclick = (e)=>{ e.preventDefault(); list.querySelectorAll('input[type="checkbox"]').forEach(c=>c.checked=false); };
  btnApply.onclick = (e)=>{ 
    e.preventDefault();
    FILTER[key].clear();
    list.querySelectorAll('input[type="checkbox"]').forEach(c=>{ if(c.checked) FILTER[key].add(c.nextElementSibling.textContent); });
    updateFilterSummary(label, countSpan, sum, FILTER[key]);
  // Close the current dropdown on Apply
  details.removeAttribute("open");
  renderActiveChips();
  try{ setGlobalFiltersCount(); }catch{}
    if (typeof route === 'function') route();
  };

  wrap.append(details);
  return wrap;
}

function updateFilterSummary(label, countSpan, sum, set){
  if (set.size===0) {
    countSpan.textContent = "All";
    sum.title = `${label}: All`;
  } else {
    const vals = [...set];
    countSpan.textContent = `${set.size} selected`;
    sum.title = `${label}: ${vals.join(', ')}`; // full list in tooltip for accessibility
  }
}

function renderActiveChips(){
  const host = $("#activeFilters"); if (!host) return; // optional area
  host.innerHTML = '';
  const entries = [
  {label:'Business Unit', key:'business'},
    {label:'TA', key:'ta'},
    {label:'Product', key:'product'},
    {label:'Country', key:'country'},
    {label:'HCP Segment', key:'segment'}
  ];
  const chips = [];
  entries.forEach(({label,key})=>{
    const set = FILTER[key];
    if (set.size>0){
      const vals = [...set];
      const preview = vals.slice(0,3).join(', ');
      const more = vals.length>3 ? ` +${vals.length-3}` : '';
      const chip = document.createElement('span');
      chip.className = 'chip';
  chip.innerHTML = `${label}: ${preview}${more} <button class="x" aria-label="Clear ${label}">x</button>`;
      chip.querySelector('.x').addEventListener('click', ()=>{
        // Clear this filter entirely
        set.clear();
        // sync summary text and uncheck checkboxes in corresponding filter
        const details = Array.from(document.querySelectorAll('.filter summary')).find(s=> s.textContent.trim().startsWith(label+':'))?.parentElement;
        if (details){
          const span = details.querySelector('summary .small');
          updateFilterSummary(label, span, details.querySelector('summary'), set);
          details.querySelectorAll('.chklist input[type="checkbox"]').forEach(c=> c.checked = false);
        }
        renderActiveChips();
        try{ setGlobalFiltersCount(); }catch{}
        if (typeof route === 'function') route();
      });
      chips.push(chip);
    }
  });
  if (chips.length){
    chips.forEach(c=> host.appendChild(c));
    const btn = document.createElement('button');
    btn.className = 'clear-all'; btn.type='button'; btn.textContent = 'Clear all';
    btn.addEventListener('click', ()=>{
      Object.values(FILTER).forEach(set=> set.clear());
      // uncheck all checkboxes
      document.querySelectorAll('.chklist input[type="checkbox"]').forEach(c=> c.checked=false);
      // refresh summaries
      const pairs = [ ['Business Unit','business'], ['TA','ta'], ['Product','product'], ['Country','country'], ['HCP Segment','segment'] ];
      pairs.forEach(([label,key])=>{
        const details = Array.from(document.querySelectorAll('.filter summary')).find(s=> s.textContent.trim().startsWith(label+':'))?.parentElement;
        if (details){
          const span = details.querySelector('summary .small');
          updateFilterSummary(label, span, details.querySelector('summary'), FILTER[key]);
        }
      });
      renderActiveChips();
      try{ setGlobalFiltersCount(); }catch{}
      if (typeof route === 'function') route();
    });
    host.appendChild(btn);
  }
}

/* =========================
   Header Filters: total selected count on toggle
========================= */
function setGlobalFiltersCount(){
  try{
    const total = Object.values(FILTER).reduce((acc, set)=> acc + (set instanceof Set ? set.size : 0), 0);
    const btn = document.querySelector('.header-right .filters .filters-toggle');
    if (!btn) return;
    let badge = btn.querySelector('.sel-count');
    if (!badge){
      badge = document.createElement('span');
      badge.className = 'badge sel-count';
      const pm = btn.querySelector('.pm');
      btn.insertBefore(badge, pm || null);
    }
    if (total > 0){
      badge.textContent = String(total);
      badge.style.display = 'inline-flex';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }catch{}
}

/* =========================
   Utilities used by pages
========================= */
// Close open filter dropdowns when clicking outside
if (!window.__filtersOutsideClickBound){
  window.__filtersOutsideClickBound = true;
  window.__closeFiltersOnOutsideClick = true;
  document.addEventListener('click', (e)=>{
    try{
      document.querySelectorAll('.filter details[open]').forEach(d=>{
        if (!d.contains(e.target)) d.removeAttribute('open');
      });
    }catch{}
  }, true);
}

function clearView(){ const v=$("#view"); if (v) v.innerHTML=""; return v; }
function makeChart(ctx,cfg){
  if (!ctx) return null;
  if(ctx._chart){ try{ ctx._chart.destroy(); }catch{} }
  const create = ()=>{ try{ const c=new Chart(ctx,cfg); ctx._chart=c; return c; }catch{ return null; } };
  if (window.Chart) return create();
  ensureChart().then(create).catch(()=>{});
  return null;
}

function findRouteById(id, routes){
  if(!routes || !id) return null;
  for(const r of routes){
    if(r.id === id) return r;
    if(r.children){
      const found = findRouteById(id, r.children);
      if(found) return found;
    }
  }
  return null;
}

/* =========================
   KPI auto-fit (single-row scaling)
========================= */
function __applyKpiScale(row){
  try{
    const cards = Array.from(row.querySelectorAll(':scope > .kpi'));
    const n = cards.length || 1;
    const cw = row.clientWidth || 1;
    const gap = 12; // matches CSS gap
    const baselineCard = 220; // px per KPI for comfortable layout
    const needed = (n * baselineCard) + ((n - 1) * gap);
    let scale = cw / needed;
    // clamp scale for readability
    scale = Math.max(0.6, Math.min(1.0, scale));
    row.style.setProperty('--kpi-scale', String(scale));
  }catch{}
}

function initKpiAutoFit(){
  if (window.__kpiAutoFitInit) return; window.__kpiAutoFitInit = true;
  const ro = new ResizeObserver(entries => {
    entries.forEach(e => {
      if (e.target && e.target.classList && e.target.classList.contains('kpis')){
        __applyKpiScale(e.target);
      }
    });
  });
  // Observe existing rows
  document.querySelectorAll('.kpis').forEach(k => ro.observe(k));
  // Watch for new KPI rows being added
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && Array.from(m.addedNodes).forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.classList && node.classList.contains('kpis')){
          ro.observe(node); __applyKpiScale(node);
        } else {
          node.querySelectorAll && node.querySelectorAll('.kpis').forEach(k => { ro.observe(k); __applyKpiScale(k); });
        }
      });
    });
  });
  try{ mo.observe(document.body, { childList:true, subtree:true }); }catch{}
  // Initial pass
  document.querySelectorAll('.kpis').forEach(k => __applyKpiScale(k));
}

// Initialize after DOM is ready
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initKpiAutoFit);
} else {
  initKpiAutoFit();
}
