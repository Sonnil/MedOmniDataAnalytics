/*** 3a) LIBRARY OF CONGRESSES (EVENT WEB ANALYTICS) ***/
function renderLibrary(){
  const view = clearView();
  if (typeof buildMultiFilters === 'function') buildMultiFilters();
  const routeMeta = findRouteById("library", window.ROUTES) || {title:"Library of Congresses", subtitle:"Event web analytics"};
  $("#pageTitle").textContent = routeMeta.title;
  $("#pageSubtitle").textContent = routeMeta.subtitle;
  // use shared mmss helper

  const base = DATA.events;
  // Respect header Business Unit filter if set
  const baseFiltered = base.filter(e => (e.business === undefined || (window.FILTER && FILTER.business && FILTER.business.size ? FILTER.business.has(e.business) : true)) );
  const rows = baseFiltered.map(e=>{
    const uniqueUsers = Math.max(Math.round(e.attendees*(0.25+Math.random()*0.35)),100);
    const engagedSessions = Math.max(Math.round(uniqueUsers*(0.55+Math.random()*0.3)),50);
    const pageViews = Math.max(engagedSessions + Math.round(engagedSessions*(0.8+Math.random()*1.6)), engagedSessions);
    const firstVisits = Math.min(uniqueUsers, Math.round(uniqueUsers*(0.35+Math.random()*0.35)));
    const fileDownloads = Math.round(engagedSessions*(0.08+Math.random()*0.22));
    const avgEngTimeSec = Math.round(90+Math.random()*360);
    return {name:e.name, business: e.business || '-', uniqueUsers, engagedSessions, pageViews, firstVisits, fileDownloads, avgEngTimeSec};
  });

  const kpiWrap = el("div","kpis col-12");
  const sum = (k)=> rows.reduce((a,b)=>a+b[k],0);
  const kUnique = sum("uniqueUsers");
  const kEngaged = sum("engagedSessions");
  const kViews = sum("pageViews");
  const kFirst = sum("firstVisits");
  const kFiles = sum("fileDownloads");
  const avgTime = Math.round(rows.reduce((a,b)=>a+b.avgEngTimeSec,0)/rows.length);

  kpiWrap.append(
    kpi("Unique Users (sum)", fmt(kUnique), Math.round((Math.random()*10)-3)),
    kpi("Avg Engagement Time", mmss(avgTime), Math.round((Math.random()*6)-3)),
    kpi("Engaged Sessions (sum)", fmt(kEngaged), Math.round((Math.random()*10)-4)),
    kpi("Page Views (sum)", fmt(kViews), Math.round((Math.random()*12)-5)),
  );
  view.append(kpiWrap);

  const kpiWrap2 = el("div","kpis col-12");
  kpiWrap2.append(
    kpi("First Visits (sum)", fmt(kFirst), Math.round((Math.random()*8)-4)),
    kpi("File Downloads (sum)", fmt(kFiles), Math.round((Math.random()*8)-3)),
    kpi("Engagement Rate (Engaged/Users)", `${Math.round((kEngaged/Math.max(1,kUnique))*100)}%`, 0),
    kpi("Downloads / Engaged Session", `${(kFiles/Math.max(1,kEngaged)).toFixed(2)}`, 0)
  );
  view.append(kpiWrap2);

  const funnel = card("Engagement funnel","col-6");
  const fCanvas = canvas(); funnel.append(fCanvas); view.append(funnel);
  makeChart(fCanvas.getContext('2d'), {
    type: 'bar',
    data: { labels: ["Unique Users","Engaged Sessions","Page Views","File Downloads"],
      datasets: [{ label: "Volume", data: [kUnique, kEngaged, kViews, kFiles] }] },
    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
  });

  const grp = card("Users vs Engaged Sessions (by event)","col-6");
  const gCanvas = canvas(); grp.append(gCanvas); view.append(grp);
  makeChart(gCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: rows.map(r=>`[${r.business}] ${r.name}`),
      datasets: [
        { label: "Unique Users", data: rows.map(r=>r.uniqueUsers) },
        { label: "Engaged Sessions", data: rows.map(r=>r.engagedSessions) }
      ]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  const timeCard = card("Avg engagement time per session (mm:ss)","col-6");
  const tCanvas = canvas(); timeCard.append(tCanvas); view.append(timeCard);
  makeChart(tCanvas.getContext('2d'), {
    type:'bar',
    data: { labels: rows.map(r=>`[${r.business}] ${r.name}`), datasets:[{ label: "Avg Time (sec)", data: rows.map(r=>r.avgEngTimeSec) }] },
    options: {
      scales: { y: { beginAtZero:true } },
      plugins: { tooltip: { callbacks: { label:(ctx)=> `${ctx.dataset.label}: ${mmss(ctx.parsed.y)}` } } }
    }
  });

  const bub = card("Page Views vs Unique Users (bubble = File Downloads)","col-6");
  const bCanvas = canvas(); bub.append(bCanvas); view.append(bub);
  makeChart(bCanvas.getContext('2d'), {
    type:'bubble',
    data: { datasets: [{
      label: "Event",
      data: rows.map(r=>({ x: r.uniqueUsers, y: r.pageViews, r: Math.max(6, Math.min(24, Math.round(r.fileDownloads/50))), name: r.name, bu: r.business, dl: r.fileDownloads }))
    }]},
    options:{
      plugins:{ tooltip:{ callbacks:{ label:(ctx)=> `${ctx.raw.bu} • ${ctx.raw.name} • Users ${fmt(ctx.raw.x)} • Views ${fmt(ctx.raw.y)} • Downloads ${fmt(ctx.raw.dl)}` } } },
      scales:{ x:{ title:{display:true,text:"Unique Users"} }, y:{ title:{display:true,text:"Page Views"} } }
    }
  });

  const tableCard = card("Detail — per event","col-12");
  const tbl = el('table','table');
  tbl.innerHTML = `<thead><tr>
    <th>Event</th><th>Business Unit</th><th>Unique Users</th><th>Engaged Sessions</th><th>Page Views</th><th>First Visits</th><th>File Downloads</th><th>Avg Time</th>
  </tr></thead>
  <tbody>${
    rows.map(r=>`<tr>
      <td><span class="badge">${r.name}</span></td>
      <td>${r.business}</td>
      <td>${fmt(r.uniqueUsers)}</td>
      <td>${fmt(r.engagedSessions)}</td>
      <td>${fmt(r.pageViews)}</td>
      <td>${fmt(r.firstVisits)}</td>
      <td>${fmt(r.fileDownloads)}</td>
      <td>${mmss(r.avgEngTimeSec)}</td>
    </tr>`).join("")
  }</tbody>`;
  tableCard.append(tbl); view.append(tableCard);

  // ——— Library of Congress API (public) — search demo with filters & paging ———
  const locCard = card("Library of Congress API — Search demo","col-12");
  const wrap = document.createElement('div');
  Object.assign(wrap.style, { display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' });
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search LoC (e.g., oncology)';
  Object.assign(input.style, { flex:'1 1 340px', minWidth:'240px', padding:'8px 10px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  const coll = document.createElement('select');
  Object.assign(coll.style, { padding:'8px 10px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  ;[
    {label:'All collections', value:''},
    {label:'Photos', value:'photos'},
    {label:'Manuscripts', value:'manuscripts'},
    {label:'Maps', value:'maps'},
    {label:'Newspapers', value:'newspapers'},
    {label:'Books', value:'books'}
  ].forEach(o=>{ const op=document.createElement('option'); op.value=o.value; op.textContent=o.label; coll.appendChild(op); });
  const btn = document.createElement('button');
  btn.className = 'btn'; btn.type='button'; btn.textContent = 'Search';
  const note = document.createElement('div');
  note.className = 'small'; note.textContent = 'Powered by loc.gov (JSON API)';
  Object.assign(note.style, { color:'#94a3b8' });
  wrap.append(input, coll, btn, note);
  const results = document.createElement('div');
  results.style.marginTop = '10px';
  // Paging controls
  const pager = document.createElement('div');
  pager.style.marginTop = '8px';
  const loadMore = document.createElement('button');
  loadMore.className = 'btn secondary'; loadMore.type = 'button'; loadMore.textContent = 'Load more';
  pager.appendChild(loadMore);
  // Visualization area (KPIs and charts updated from results)
  const viz = document.createElement('div');
  viz.style.marginTop = '12px';
  viz.innerHTML = '';
  // KPIs container
  const kpiRow = document.createElement('div');
  kpiRow.className = 'kpis';
  viz.appendChild(kpiRow);
  // Charts containers
  const chWrap = document.createElement('div');
  chWrap.style.display = 'grid';
  chWrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  chWrap.style.gap = '10px';
  function mkChartCard(title){ const d = document.createElement('div'); d.className = 'card'; d.appendChild(el('h3','',title)); const cv = canvas(220); d.appendChild(cv); return {wrap:d, canvas:cv}; }
  const yearCard = mkChartCard('Items by Year');
  const fmtCard  = mkChartCard('Top Formats');
  const subjCard = mkChartCard('Top Subjects');
  chWrap.append(yearCard.wrap, fmtCard.wrap, subjCard.wrap);
  viz.appendChild(chWrap);
  locCard.append(wrap, results, pager, viz);
  view.append(locCard);

  // Helpers for visuals
  function yearFrom(any){ try{ const s=String(any||''); const m=s.match(/(1[6-9]\d{2}|20\d{2})/); return m?Number(m[1]):null; }catch{ return null; } }
  function tally(arr){ const map=new Map(); arr.forEach(v=>{ if(!v) return; const k=String(v); map.set(k,(map.get(k)||0)+1); }); return map; }
  function topEntries(map, n=8){ return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n); }
  function updateLoCVisuals(items){
    // KPIs
    kpiRow.innerHTML = '';
    const total = items ? items.length : 0;
    const withImg = (items||[]).filter(it => { try{ return (it.image_url && it.image_url.length) || it.thumbnail; }catch{ return false; } }).length;
    const formatsSet = new Set();
    (items||[]).forEach(it => { const fmts = (Array.isArray(it.format) ? it.format : (it.format ? [it.format] : [])); fmts.forEach(f => formatsSet.add(String(f))); });
    kpiRow.append( kpi('Items', fmt(total), 0), kpi('With image', fmt(withImg), 0), kpi('Distinct formats', fmt(formatsSet.size), 0) );
    // Years
    const years = (items||[]).map(it => yearFrom(it.date || it.created_published_date)).filter(Boolean);
    const yearTop = topEntries(tally(years), 10);
    makeChart(yearCard.canvas.getContext('2d'), { type:'bar', data:{ labels:yearTop.map(([y])=>y), datasets:[{ label:'Items', data:yearTop.map(([,c])=>c) }] }, options:{ scales:{ y:{ beginAtZero:true } } } });
    // Formats
    const fmts=[]; (items||[]).forEach(it=>{ const arr = Array.isArray(it.format) ? it.format : (it.format ? [it.format] : (Array.isArray(it.original_format) ? it.original_format : (it.original_format ? [it.original_format] : []))); arr.forEach(v=>fmts.push(v)); });
    const fmtTop = topEntries(tally(fmts), 8);
    makeChart(fmtCard.canvas.getContext('2d'), { type:'bar', data:{ labels: fmtTop.map(([k])=>k), datasets:[{ label:'Count', data: fmtTop.map(([,c])=>c) }] }, options:{ indexAxis:'y', scales:{ x:{ beginAtZero:true } } } });
    // Subjects
    const subs=[]; (items||[]).forEach(it=>{ const arr = Array.isArray(it.subject) ? it.subject : (it.subject ? [it.subject] : []); arr.forEach(v=>subs.push(v)); });
    const subjTop = topEntries(tally(subs), 8);
    makeChart(subjCard.canvas.getContext('2d'), { type:'bar', data:{ labels: subjTop.map(([k])=>k), datasets:[{ label:'Count', data: subjTop.map(([,c])=>c) }] }, options:{ indexAxis:'y', scales:{ x:{ beginAtZero:true } } } });
  }

  // Results rendering
  function renderResults(items, append=false){
    if (!append) results.innerHTML = '';
    if (!items || !items.length){ if (!append) results.innerHTML = '<div class="small" style="color:#94a3b8;">No results</div>'; return; }
    const list = document.createElement('div');
    list.style.display = 'grid'; list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))'; list.style.gap = '10px';
    items.forEach(it => {
      const card = document.createElement('div'); card.className = 'card';
      const title = it.title || it.collection || it.original_format || 'Untitled';
      const date = it.date || it.created_published_date || '';
      const url = it.url || it.website || it.id || '#';
      let img = '';
      try{ const im = (it.image_url && it.image_url[0]) || it.image || it.thumbnail || ''; if (im) img = `<img src="${im}" alt="thumbnail" style="width:100%;max-height:140px;object-fit:cover;border-radius:8px;">`; }catch{}
      card.innerHTML = `${img}
        <div class="small" style="margin-top:6px;color:#94a3b8;">${date ? String(date) : ''}</div>
        <div style="font-weight:600;margin:2px 0 6px;">${title}</div>
        <a class="btn secondary" href="${url}" target="_blank" rel="noopener">Open</a>`;
      list.append(card);
    });
    results.append(list);
  }

  // State + fetch
  const locState = { q:'', collection:'', page:1, pageSize:20, allItems:[], hasMore:true };
  function buildLocUrl(){
    const base = locState.collection ? `https://www.loc.gov/${locState.collection}/` : 'https://www.loc.gov/search/';
    const params = new URLSearchParams(); params.set('q', locState.q); params.set('fo','json'); params.set('c', String(locState.pageSize)); params.set('sp', String(locState.page));
    return `${base}?${params.toString()}`;
  }
  function doSearch(reset=true){
    if (!locState.q){ results.innerHTML = '<div class="small" style="color:#94a3b8;">Enter a term to search the Library of Congress</div>'; kpiRow.innerHTML=''; return; }
    if (reset){ locState.page=1; locState.allItems=[]; locState.hasMore=true; results.innerHTML = '<div class="small" style="color:#94a3b8;">Loading…</div>'; }
    else { loadMore.disabled = true; loadMore.textContent = 'Loading…'; }
    const url = buildLocUrl();
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        const items = (data && Array.isArray(data.results)) ? data.results : [];
        if (items.length === 0) locState.hasMore = false;
        locState.allItems = reset ? items.slice() : locState.allItems.concat(items);
        renderResults(items, !reset);
        updateLoCVisuals(locState.allItems);
      })
      .catch(err => { results.innerHTML = `<div class=\"small\" style=\"color:#ef4444;\">Error: ${err && err.message ? err.message : 'Request failed'}</div>`; kpiRow.innerHTML = ''; })
      .finally(()=>{ loadMore.disabled = !locState.hasMore; loadMore.textContent = locState.hasMore ? 'Load more' : 'No more results'; });
  }

  // Events
  btn.addEventListener('click', () => { locState.q = input.value.trim(); doSearch(true); });
  input.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') { locState.q = input.value.trim(); doSearch(true); } });
  try{ input.addEventListener('input', debounce(()=>{ locState.q = input.value.trim(); if (locState.q.length >= 3) doSearch(true); }, 500)); }catch{}
  coll.addEventListener('change', ()=>{ locState.collection = coll.value; if (locState.q) doSearch(true); });
  loadMore.addEventListener('click', ()=>{ if (!locState.hasMore) return; locState.page += 1; doSearch(false); });
  // Seed a quick demo search
  input.value = 'oncology'; locState.q = input.value.trim(); doSearch(true);

  // ——— Congress.gov API — GTMC-related insights ———
  const cgCard = card("Congress.gov — Policy & Market Insights","col-12");
  const cgWrap = document.createElement('div');
  Object.assign(cgWrap.style, { display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' });
  const keyInput = document.createElement('input');
  keyInput.type = 'password';
  keyInput.placeholder = 'Congress.gov API key (not stored)';
  Object.assign(keyInput.style, { width:'260px', padding:'8px 10px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  const kwInput = document.createElement('input');
  kwInput.type = 'text'; kwInput.placeholder = 'Keywords (e.g., health, drug, reimbursement)';
  Object.assign(kwInput.style, { flex:'1 1 360px', minWidth:'260px', padding:'8px 10px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  const congSel = document.createElement('select');
  Object.assign(congSel.style, { padding:'8px 10px', borderRadius:'8px', border:'1px solid #223055', background:'#0b142d', color:'#e2e8f0' });
  ;[119,118,117,116,115].forEach(n=>{ const op=document.createElement('option'); op.value=String(n); op.textContent=`${n}th`; congSel.appendChild(op); });
  const cgBtn = document.createElement('button');
  cgBtn.className = 'btn'; cgBtn.type = 'button'; cgBtn.textContent = 'Fetch bills';
  const cgMore = document.createElement('button');
  cgMore.className = 'btn secondary'; cgMore.type = 'button'; cgMore.textContent = 'Load more';
  cgMore.disabled = true;
  const cgNote = document.createElement('div');
  cgNote.className = 'small'; cgNote.textContent = 'Client-side fetch; enter your API key above.';
  Object.assign(cgNote.style, { color:'#94a3b8' });
  cgWrap.append(keyInput, congSel, kwInput, cgBtn, cgMore, cgNote);
  const cgResults = document.createElement('div');
  cgResults.style.marginTop = '10px';
  const cgViz = document.createElement('div');
  cgViz.style.marginTop = '12px';
  const cgKpis = document.createElement('div'); cgKpis.className = 'kpis';
  const cgCharts = document.createElement('div');
  cgCharts.style.display = 'grid'; cgCharts.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))'; cgCharts.style.gap = '10px';
  function mkCgCard(title){ const d=document.createElement('div'); d.className='card'; d.appendChild(el('h3','',title)); const cv=canvas(220); d.appendChild(cv); return {wrap:d, canvas:cv}; }
  const cgChamber = mkCgCard('Bills by Chamber');
  const cgPolicy = mkCgCard('Top Policy Areas');
  const cgTimeline = mkCgCard('Introduced/Updated by Month');
  cgCharts.append(cgChamber.wrap, cgPolicy.wrap, cgTimeline.wrap);
  cgViz.append(cgKpis, cgCharts);
  cgCard.append(cgWrap, cgResults, cgViz);
  view.append(cgCard);

  const CG = { apiKey:'', congress:119, page:0, pageSize:50, all:[], hasMore:true };
  function buildCgUrl(){
    const base = 'https://api.congress.gov/v3/bill';
    const params = new URLSearchParams();
    params.set('api_key', CG.apiKey);
    params.set('format','json');
    params.set('congress', String(CG.congress));
    params.set('limit', String(CG.pageSize));
    if (CG.page>0) params.set('offset', String(CG.page*CG.pageSize));
    return `${base}?${params.toString()}`;
  }
  function safeArr(v){ return Array.isArray(v) ? v : (v ? [v] : []); }
  function monthKey(s){ try{ const d = new Date(s); if (!isFinite(d)) return null; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }catch{ return null; } }
  function updateCgVisuals(items, kw){
    const q = (kw||'').toLowerCase().trim();
    const filtered = !q ? items : items.filter(it=>{
      try{
        const hay = [it.title, it.policyArea?.name, ...(safeArr(it.subjects?.name))].join(' ').toLowerCase();
        return hay.includes(q);
      }catch{ return false; }
    });
    // KPIs
    cgKpis.innerHTML = '';
    const total = items.length; const hits = filtered.length;
    const healthHits = filtered.filter(it=>{
      try{ const s = [it.policyArea?.name, ...(safeArr(it.subjects?.name))].join(' ').toLowerCase(); return /health|drug|pharma|medic/i.test(s); }catch{ return false; }
    }).length;
    cgKpis.append( kpi('Bills (fetched)', fmt(total), 0), kpi('Matches (keywords)', fmt(hits), 0), kpi('Health-related (est.)', fmt(healthHits), 0) );
    // Chamber breakdown
    const byCh = {};
    filtered.forEach(it=>{ const c = it.originChamber || it.chamber || 'Unknown'; byCh[c] = (byCh[c]||0)+1; });
    makeChart(cgChamber.canvas.getContext('2d'), { type:'bar', data:{ labels:Object.keys(byCh), datasets:[{ label:'Bills', data:Object.values(byCh) }] }, options:{ scales:{ y:{ beginAtZero:true } } } });
    // Policy areas
    const byPa = {};
    filtered.forEach(it=>{ const p = (it.policyArea && it.policyArea.name) ? it.policyArea.name : 'Unspecified'; byPa[p] = (byPa[p]||0)+1; });
    const paTop = Object.entries(byPa).sort((a,b)=>b[1]-a[1]).slice(0,8);
    makeChart(cgPolicy.canvas.getContext('2d'), { type:'bar', data:{ labels: paTop.map(([k])=>k), datasets:[{ label:'Bills', data: paTop.map(([,v])=>v) }] }, options:{ indexAxis:'y', scales:{ x:{ beginAtZero:true } } } });
    // Timeline by month (introduced or latestAction)
    const byM = {};
    filtered.forEach(it=>{
      const m = monthKey(it.updateDate || it.introducedDate || (it.latestAction && it.latestAction.actionDate));
      if(!m) return; byM[m] = (byM[m]||0)+1;
    });
    const months = Object.keys(byM).sort();
    makeChart(cgTimeline.canvas.getContext('2d'), { type:'line', data:{ labels: months, datasets:[{ label:'Bills', data: months.map(k=>byM[k]) }] }, options:{ scales:{ y:{ beginAtZero:true } } } });

    // Results list (compact)
    cgResults.innerHTML = '';
    const list = document.createElement('div'); list.style.display='grid'; list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))'; list.style.gap='10px';
    filtered.slice(0,24).forEach(it=>{
      const d = document.createElement('div'); d.className='card';
      const title = it.title || `${it.billType || ''} ${it.number || ''}`;
      const pa = (it.policyArea && it.policyArea.name) || 'Unspecified';
      const ch = it.originChamber || it.chamber || '';
      const dt = it.updateDate || (it.latestAction && it.latestAction.actionDate) || '';
      const link = it.url || it.congressDotGovUrl || '';
      d.innerHTML = `<div class="small" style="color:#94a3b8;">${dt} ${ch?`• ${ch}`:''} • ${pa}</div>
                     <div style="font-weight:600;margin:2px 0 6px;">${title}</div>
                     ${link?`<a class='btn secondary' href='${link}' target='_blank' rel='noopener'>Open</a>`:''}`;
      list.appendChild(d);
    });
    cgResults.appendChild(list);
  }

  function fetchCg(reset=true){
    if (!CG.apiKey){ cgResults.innerHTML = '<div class="small" style="color:#94a3b8;">Enter your Congress.gov API key</div>'; return; }
    if (reset){ CG.page=0; CG.all=[]; CG.hasMore=true; }
    const url = buildCgUrl();
    if (reset) cgResults.innerHTML = '<div class="small" style="color:#94a3b8;">Loading…</div>';
    cgMore.disabled = true; cgMore.textContent = 'Loading…';
    fetch(url)
      .then(r=> r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        const items = (data && (data.bills || data.bill || data.results)) ? (data.bills || data.bill || data.results) : [];
        if (!Array.isArray(items) || items.length===0) CG.hasMore = false;
        CG.all = reset ? items.slice() : CG.all.concat(items);
        updateCgVisuals(CG.all, kwInput.value);
      })
      .catch(err => { cgResults.innerHTML = `<div class=\"small\" style=\"color:#ef4444;\">Error: ${err.message || 'Request failed'} (CORS may block in browser)</div>`; })
      .finally(()=>{ cgMore.disabled = !CG.hasMore; cgMore.textContent = CG.hasMore ? 'Load more' : 'No more results'; });
  }

  cgBtn.addEventListener('click', ()=>{ CG.apiKey = keyInput.value.trim(); CG.congress = Number(congSel.value)||CG.congress; fetchCg(true); });
  cgMore.addEventListener('click', ()=>{ if (!CG.hasMore) return; CG.page += 1; fetchCg(false); });
  try{ kwInput.addEventListener('input', debounce(()=> updateCgVisuals(CG.all, kwInput.value), 300)); }catch{}
}
