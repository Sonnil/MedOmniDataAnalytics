/*** Supply Chain & Manufacturing (SC&M) analytics page module ***/
(function(){
  // expose as window.externalRenderSCM
  window.externalRenderSCM = async function(){
    const $ = (sel, root=document) => root.querySelector(sel);
    const el = (t,c,h)=>{ const e=document.createElement(t); if(c) e.className=c; if(h!==undefined) e.innerHTML=h; return e; };
    const fmt = n=> Number(n).toLocaleString();
    const view = $('#view'); if(!view) return;
    view.innerHTML='';

    // mock enrichment (reuse DATA if available)
    const YEARS = [2022,2023,2024,2025];
    const MONTHS = Array.from({length:12},(_,i)=>i+1);
    const FACILITIES = ['Plant A','Plant B','Distribution Hub 1','Distribution Hub 2'];
    const LINES = ['Biologics','Small Molecule','Injectables','Ophthalmology'];

    const base = (typeof DATA !== 'undefined' && DATA.foundational)? DATA.foundational.slice(0,8) : [];
    const records = base.map((b,i)=>{
      const year = YEARS[Math.floor(Math.random()*YEARS.length)];
      const month = MONTHS[Math.floor(Math.random()*MONTHS.length)];
      const facility = FACILITIES[Math.floor(Math.random()*FACILITIES.length)];
      const line = LINES[Math.floor(Math.random()*LINES.length)];
      const throughput = Math.round(5000 + Math.random()*50000);
      const yieldPct = Math.round(70 + Math.random()*28);
      const downtimeMin = Math.round(Math.random()*600);
      const qualityEvents = Math.round(Math.random()*12);
      const deliveriesOnTimePct = Math.round(70 + Math.random()*28);
      const clicks = Math.round(Math.random()*400);
      const other = Math.round(Math.random()*200);
      const country = (['US','DE','FR','UK','CN','JP','BR'])[Math.floor(Math.random()*7)];
      return { id:i, title: b && b.category? b.category : ('Record '+i), year, month, facility, line, throughput, yieldPct, downtimeMin, qualityEvents, deliveriesOnTimePct, clicks, other, country };
    });

    // Filters
    const fCard = el('div','card col-12'); fCard.append(el('h3','', 'Filters'));
    const fwrap = el('div','');
    const ysel = document.createElement('select'); ysel.innerHTML = '<option value="all">All years</option>'+YEARS.map(y=>`<option>${y}</option>`).join('');
    const msel = document.createElement('select'); msel.innerHTML = '<option value="all">All months</option>'+MONTHS.map(m=>`<option>${m}</option>`).join('');
    const facWrap = el('div',''); FACILITIES.forEach(f=>{ facWrap.append(el('label','','<input type="checkbox" value="'+f+'"> '+f)); });
    const lineSel = el('div',''); LINES.forEach(l=> lineSel.append(el('label','','<input type="checkbox" value="'+l+'"> '+l)));
    const apply = el('button','btn','Apply'); const clear = el('button','btn secondary','Clear all'); const exportBtn = el('button','btn secondary','Export CSV');
    fwrap.append(el('label','','Year: '), ysel, el('label','',' Month: '), msel, el('span','',' Facility: '), facWrap, el('span','',' Line: '), lineSel, apply, clear, exportBtn);
    fCard.append(fwrap); view.append(fCard);

    // KPI containers
    const kpiRow = el('div','kpis col-12'); view.append(kpiRow);
    const kpiRow2 = el('div','kpis col-12'); view.append(kpiRow2);

    function kpiEl(title, val){ return el('div','kpi', `<div class="small">${title}</div><div class="val">${val}</div>`); }

    // charts
    const c1 = card('Throughput by Facility','col-6'); const c1cv = (()=>{const c=document.createElement('canvas');c.height=140;return c;})(); c1.append(c1cv); view.append(c1);
    const c2 = card('Yield % by Line','col-6'); const c2cv = (()=>{const c=document.createElement('canvas');c.height=140;return c;})(); c2.append(c2cv); view.append(c2);
    const c3 = card('Quality events by Facility','col-12'); const c3cv = (()=>{const c=document.createElement('canvas');c.height=140;return c;})(); c3.append(c3cv); view.append(c3);

    const mapCard = card('Incidents by country','col-12'); const mapCv = (()=>{const c=document.createElement('canvas');c.height=220;return c;})(); mapCard.append(mapCv); view.append(mapCard);

    const tableCard = card('Detail','col-12'); const table = el('table','table'); tableCard.append(table); view.append(tableCard);

  async function render(){
      const sy = ysel.value; const sm = msel.value;
      const selectedFac = Array.from(facWrap.querySelectorAll('input:checked')).map(i=>i.value);
      const selectedLines = Array.from(lineSel.querySelectorAll('input:checked')).map(i=>i.value);
      const filtered = records.filter(r=> (sy==='all' || String(r.year)===String(sy)) && (sm==='all' || String(r.month)===String(sm)) && (selectedFac.length? selectedFac.includes(r.facility):true) && (selectedLines.length? selectedLines.includes(r.line):true) );
      // KPIs
      const totalThroughput = filtered.reduce((a,b)=>a+b.throughput,0);
      const avgYield = Math.round(filtered.reduce((a,b)=>a+b.yieldPct,0)/Math.max(1,filtered.length));
      const avgDowntime = Math.round(filtered.reduce((a,b)=>a+b.downtimeMin,0)/Math.max(1,filtered.length));
      const qEvents = filtered.reduce((a,b)=>a+b.qualityEvents,0);
      kpiRow.innerHTML=''; kpiRow.append(kpiEl('Throughput (sum)', fmt(totalThroughput)), kpiEl('Avg yield %', avgYield+'%'), kpiEl('Avg downtime (min)', avgDowntime), kpiEl('Quality events', qEvents));
      kpiRow2.innerHTML=''; kpiRow2.append(kpiEl('On-time deliveries %', Math.round(filtered.reduce((a,b)=>a+b.deliveriesOnTimePct,0)/Math.max(1,filtered.length))+'%'), kpiEl('Clicks', fmt(filtered.reduce((a,b)=>a+b.clicks,0))), kpiEl('Other engagements', fmt(filtered.reduce((a,b)=>a+b.other,0))));

      // charts
      const byFac = {}; filtered.forEach(r=> byFac[r.facility]=(byFac[r.facility]||0)+r.throughput );
      makeChart(c1cv.getContext('2d'), { type:'bar', data:{ labels:Object.keys(byFac), datasets:[{ label:'Throughput', data:Object.values(byFac) }]}, options:{ scales:{ y:{ beginAtZero:true } } } });
      const byLine = {}; filtered.forEach(r=> byLine[r.line]=(byLine[r.line]||0)+r.yieldPct );
      makeChart(c2cv.getContext('2d'), { type:'bar', data:{ labels:Object.keys(byLine), datasets:[{ label:'Yield %', data:Object.values(byLine) }]}, options:{ scales:{ y:{ beginAtZero:true } } } });
      const qualityByFac = {}; filtered.forEach(r=> qualityByFac[r.facility]=(qualityByFac[r.facility]||0)+r.qualityEvents );
      makeChart(c3cv.getContext('2d'), { type:'bar', data:{ labels:Object.keys(qualityByFac), datasets:[{ label:'Quality events', data:Object.values(qualityByFac) }]}, options:{ scales:{ y:{ beginAtZero:true } } } });

      // map
      try{
        const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json());
        const features = ChartGeo.topojson.feature(topo, topo.objects.countries).features;
        const byCountry = {};
        filtered.forEach(r=> byCountry[r.country] = (byCountry[r.country]||0)+1);
        const values = features.map(f=> ({ feature:f, value: byCountry[f.properties.iso_a2]||0 }));
        makeChart(mapCv.getContext('2d'), { type:'choropleth', data:{ labels: values.map(v=>v.feature.properties.name), datasets:[{ label:'Incidents', outline: ChartGeo.topojson.mesh(topo, topo.objects.countries, (a,b)=>a!==b), data: values }]}, options:{ showOutline:true, showGraticule:true, scales:{ projection:{ axis:'x', projection:'equalEarth' }, color:{ axis:'x', quantize:5, legend:{position:'bottom'} } } } });
      }catch(e){ mapCard.append(el('div','small','(Map unavailable)')); }

      // table
      table.innerHTML = `<thead><tr><th>Title</th><th>Facility</th><th>Line</th><th>Throughput</th><th>Yield %</th><th>Downtime (min)</th><th>Quality events</th></tr></thead><tbody>${filtered.map(r=>`<tr><td>${r.title}</td><td>${r.facility}</td><td>${r.line}</td><td>${fmt(r.throughput)}</td><td>${r.yieldPct}%</td><td>${r.downtimeMin}</td><td>${r.qualityEvents}</td></tr>`).join('')}</tbody>`;
    }

    apply.addEventListener('click', ()=>{ render(); showToast && showToast('Filters applied'); });
    clear.addEventListener('click', ()=>{ ysel.value='all'; msel.value='all'; facWrap.querySelectorAll('input').forEach(i=>i.checked=false); lineSel.querySelectorAll('input').forEach(i=>i.checked=false); render(); showToast && showToast('Filters cleared'); });
    exportBtn.addEventListener('click', ()=>{
      const rows = records; if(!rows.length){ showToast && showToast('No rows to export'); return; }
      const hdr = ['Title','Facility','Line','Throughput','YieldPct','DowntimeMin','QualityEvents'];
      const csv = [hdr.join(',')].concat(rows.map(r=> [ `"${(r.title||'').toString().replace(/"/g,'""')}"`, r.facility, r.line, r.throughput, r.yieldPct, r.downtimeMin, r.qualityEvents ].join(',')));
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='scm_export.csv'; a.click(); showToast && showToast('CSV exported');
    });

    // initial render
    render();
  };

  // auto-register route if ROUTES exists
  if(window.ROUTES && Array.isArray(window.ROUTES)){
    window.ROUTES.push({ id: 'scm', title: 'SC&M — Supply Chain & Manufacturing', subtitle: 'Operational metrics', render: window.externalRenderSCM });
  }
})();
// SC&M module removed per undo request.
// Original contents deleted to revert the Supply Chain & Manufacturing addition.
