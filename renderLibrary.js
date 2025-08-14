/** Full Library of Congresses renderer (async external module) **/
window.externalRenderLibrary = async function(){
  const $ = (s,r=document)=> r.querySelector(s);
  const el = (t,c,h)=>{ const n=document.createElement(t); if(c) n.className=c; if(h!==undefined) n.innerHTML=h; return n };
  const fmt = n=> Number(n).toLocaleString();
  const view = $('#view'); if(!view) return;
  view.innerHTML = '';

  // Mock data derived from DATA if present
  const EVENTS = (typeof DATA!=='undefined' && DATA.events)? DATA.events : [ {name:'ASCO', attendees:1200, insights:34}, {name:'ESMO', attendees:800, insights:22} ];

  // Filters card
  const fCard = el('div','card col-12'); fCard.append(el('h3','', 'Filters'));
  const taSel = document.createElement('select'); taSel.innerHTML = '<option>All</option>' + (window.TAs||[]).map(t=>`<option>${t}</option>`).join('');
  const countrySel = document.createElement('select'); countrySel.innerHTML = '<option>All</option>' + (window.Countries||[]).map(c=>`<option>${c}</option>`).join('');
  const apply = el('button','btn','Apply'); const clear = el('button','btn secondary','Clear');
  fCard.append(el('div','','Year: '), taSel, el('div','',' Country: '), countrySel, apply, clear);
  view.append(fCard);

  // KPI row
  const kRow = el('div','kpis col-12'); view.append(kRow);
  function kpi(title,val){ return el('div','kpi', `<div class="small">${title}</div><div class="val">${val}</div>`); }

  // Charts row
  const c1 = el('div','card col-6'); c1.append(el('h3','','Library visits by event')); const c1cv = document.createElement('canvas'); c1cv.height=160; c1.append(c1cv); view.append(c1);
  const c2 = el('div','card col-6'); c2.append(el('h3','','Engagement trend')); const c2cv = document.createElement('canvas'); c2cv.height=160; c2.append(c2cv); view.append(c2);

  // Table
  const tableCard = el('div','card col-12'); tableCard.append(el('h3','','Detail')); const table = el('table','table'); tableCard.append(table); view.append(tableCard);

  function render(){
    const rows = EVENTS.map(e=>({ title:e.name, attendees:e.attendees, insights:e.insights }));
    kRow.innerHTML=''; kRow.append(kpi('Total events', rows.length), kpi('Total attendees', fmt(rows.reduce((a,b)=>a+b.attendees,0))), kpi('Total insights', fmt(rows.reduce((a,b)=>a+b.insights,0))));
    table.innerHTML = `<thead><tr><th>Event</th><th>Attendees</th><th>Insights</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.title}</td><td>${fmt(r.attendees)}</td><td>${r.insights}</td></tr>`).join('')}</tbody>`;
    makeChart(c1cv.getContext('2d'), { type:'bar', data:{ labels: rows.map(r=>r.title), datasets:[{ label:'Attendees', data: rows.map(r=>r.attendees) }]}, options:{ scales:{ y:{ beginAtZero:true } } } });
    makeChart(c2cv.getContext('2d'), { type:'line', data:{ labels: ['Q1','Q2','Q3','Q4'], datasets:[{ label:'Engagement', data:[randBetween(100,800), randBetween(200,900), randBetween(300,1000), randBetween(150,700)] }] } });
  }

  apply.addEventListener('click', ()=>{ render(); });
  clear.addEventListener('click', ()=>{ taSel.value='All'; countrySel.value='All'; render(); });

  render();
};

if(typeof window.ROUTES !== 'undefined'){
  const r = window.ROUTES.find(x=>x.id==='library'); if(r) r.render = window.externalRenderLibrary;
}
