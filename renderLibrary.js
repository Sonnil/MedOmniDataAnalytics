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
}
