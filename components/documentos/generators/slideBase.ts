export const CSS = `
:root {
  --bg:#F8F8F6;--white:#FFFFFF;--black:#121316;--black2:#0B0B0B;
  --gray:#666666;--gray2:#AAAAAA;--gray3:#E3E4DE;
  --yellow:#beff01;--yd:rgba(190,255,1,0.12);--yb:rgba(190,255,1,0.4);
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--black);font-family:'Manrope',sans-serif;height:100vh;overflow:hidden;user-select:none}
.deck{width:100vw;height:100vh;position:relative}
.slide{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px);opacity:0;pointer-events:none;transition:opacity .45s ease;background:var(--bg);overflow:hidden}
.slide.active{opacity:1;pointer-events:all}
.sw{background:var(--white)}
.sh{position:absolute;top:clamp(28px,3.3vh,36px);left:clamp(48px,6.7vw,96px);right:clamp(48px,6.7vw,96px);display:flex;align-items:center;justify-content:space-between}
.st{font-size:clamp(9px,0.83vw,12px);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gray2)}
.sn{font-size:clamp(9px,0.83vw,12px);color:var(--gray2);letter-spacing:.08em}
.sf{position:absolute;bottom:clamp(16px,3vh,32px);left:clamp(48px,6.7vw,96px);right:clamp(48px,6.7vw,96px);display:flex;align-items:center;justify-content:space-between}
.pt{width:160px;height:2px;background:var(--gray3);border-radius:2px;overflow:hidden}
.pf{height:100%;background:var(--yellow);border-radius:2px;transition:width .45s ease}
.display{font-size:clamp(36px,6.7vw,96px);font-weight:800;line-height:1;letter-spacing:-.025em;color:var(--black)}
.display .acc{color:var(--yellow)}
.title{font-size:clamp(22px,3.9vw,56px);font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--black)}
.title .acc{color:var(--yellow)}
.body-text{font-size:clamp(10px,1.18vw,17px);font-weight:400;line-height:1.75;color:var(--gray);max-width:clamp(280px,40vw,580px)}
.eyebrow{font-size:clamp(8px,0.83vw,12px);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--yellow);margin-bottom:clamp(7px,0.97vw,14px)}
.rule{width:clamp(28px,3.3vw,48px);height:2px;background:var(--yellow);margin:clamp(10px,2vh,22px) 0;border-radius:1px}
.fname{font-size:clamp(9px,1.04vw,15px);font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:var(--yd);color:#2a4a00;border:1px solid var(--yb);border-radius:100px;padding:clamp(3px,0.42vw,6px) clamp(9px,1.11vw,16px);display:inline-block;margin-bottom:clamp(10px,1.39vw,20px)}
.card{background:var(--white);border:1px solid var(--gray3);border-radius:clamp(10px,1.1vw,16px);padding:clamp(14px,1.67vw,24px);transition:border-color .2s,transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s}
.card:hover{border-color:var(--yellow);transform:translateY(-7px) scale(1.02);box-shadow:0 18px 40px rgba(0,0,0,0.10)}
.ct{border-top:2px solid var(--yellow)}
.card-title{font-size:clamp(12px,1.32vw,19px);font-weight:700;color:var(--black);margin-bottom:clamp(5px,0.56vw,8px)}
.card-body{font-size:clamp(9px,0.97vw,14px);color:var(--gray);line-height:1.65}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(7px,0.83vw,12px)}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(9px,1.11vw,16px)}
.g2{display:grid;grid-template-columns:1fr 1.3fr;gap:clamp(32px,5vw,72px);align-items:start}
.krl{list-style:none;display:flex;flex-direction:column;gap:clamp(5px,0.56vw,8px)}
.krl li{display:flex;gap:clamp(6px,0.69vw,10px);align-items:flex-start;font-size:clamp(9px,1.04vw,15px);color:var(--gray);line-height:1.55;padding:clamp(6px,0.69vw,10px) clamp(9px,0.97vw,14px);background:var(--white);border:1px solid var(--gray3);border-radius:clamp(5px,0.56vw,8px);transition:transform .22s cubic-bezier(.34,1.56,.64,1),border-color .18s,box-shadow .22s;cursor:default}
.krl li:hover{transform:translateX(10px);border-color:var(--yellow);box-shadow:0 4px 14px rgba(0,0,0,0.07)}
.krl li::before{content:'';width:clamp(3px,0.35vw,5px);height:clamp(3px,0.35vw,5px);border-radius:50%;background:var(--yellow);margin-top:clamp(4px,0.49vw,7px);flex-shrink:0}
.tc{background:var(--white);border:1px solid var(--gray3);border-radius:clamp(9px,0.97vw,14px);padding:clamp(14px,1.67vw,24px);position:relative}
.tc::after{content:'';position:absolute;bottom:0;left:clamp(14px,1.67vw,24px);right:clamp(14px,1.67vw,24px);height:2px;background:var(--yellow);border-radius:0 0 2px 2px;opacity:.5}
.tl{font-size:clamp(7px,0.76vw,11px);font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);margin-bottom:clamp(5px,0.56vw,8px)}
.tt{font-size:clamp(10px,1.18vw,17px);font-weight:700;color:var(--black);margin-bottom:clamp(5px,0.56vw,8px)}
.tb{font-size:clamp(8px,0.9vw,13px);color:var(--gray);line-height:1.7}
.mr{display:flex;gap:clamp(7px,0.83vw,12px);align-items:center;padding:clamp(7px,0.76vw,11px) 0;border-bottom:1px solid var(--gray3)}
.mr:last-child{border-bottom:none}
.md{font-size:clamp(8px,0.9vw,13px);font-weight:800;color:var(--yellow);min-width:clamp(42px,5vw,72px)}
.mt{font-size:clamp(9px,0.97vw,14px);color:var(--gray)}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.tw{position:absolute;bottom:clamp(36px,6.7vh,72px);left:0;right:0;overflow:hidden;white-space:nowrap;pointer-events:none}
.ti{display:inline-block;animation:ticker 18s linear infinite;font-size:clamp(7px,0.76vw,11px);font-weight:700;letter-spacing:.18em;text-transform:uppercase}
@keyframes spin-cw{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes spin-ccw{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes rise{0%{opacity:0;transform:translateY(0) scale(1)}40%{opacity:1}100%{opacity:0;transform:translateY(-80px) scale(0.6)}}
@keyframes scanv{0%,100%{opacity:0;transform:translateX(-100%)}20%,80%{opacity:1}50%{transform:translateX(100vw)}}
.slide.active .a{animation:up .5s ease forwards;opacity:0}
.slide.active .a:nth-child(1){animation-delay:.05s}
.slide.active .a:nth-child(2){animation-delay:.12s}
.slide.active .a:nth-child(3){animation-delay:.19s}
.slide.active .a:nth-child(4){animation-delay:.26s}
.slide.active .a:nth-child(5){animation-delay:.33s}
.slide.active .a:nth-child(6){animation-delay:.40s}
.hint{position:fixed;bottom:clamp(14px,2.6vh,28px);left:50%;transform:translateX(-50%);font-size:clamp(8px,0.83vw,12px);color:var(--gray2);background:var(--white);padding:clamp(4px,0.49vw,7px) clamp(10px,1.11vw,16px);border-radius:100px;border:1px solid var(--gray3);transition:opacity .5s;pointer-events:none}
.hint.hidden{opacity:0}
@keyframes floatpill{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.pill-cloud{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;align-content:center;margin-top:6px}
.pill{display:inline-block;padding:10px 22px;border-radius:100px;font-size:15px;font-weight:700;line-height:1;letter-spacing:.01em;animation:floatpill 3s ease-in-out infinite;position:relative;cursor:default;transition:box-shadow .25s,filter .25s}
.pill-dark{background:var(--black2);color:#fff}
.pill-accent{background:var(--yellow);color:var(--black2)}
.inv-table{width:100%;border-collapse:collapse;margin-top:clamp(9px,1.11vw,16px)}
.inv-table tr{border-bottom:1px solid var(--gray3)}
.inv-table tr:last-child{border-bottom:none}
.inv-table td{padding:clamp(6px,0.69vw,10px) clamp(9px,0.97vw,14px);font-size:clamp(9px,0.97vw,14px);color:var(--gray);background:var(--white)}
.inv-table td:last-child{font-weight:700;color:var(--black);text-align:right}
.inv-total{background:var(--black2)!important;color:rgba(255,255,255,0.4)!important}
.inv-total td:last-child{color:var(--yellow)!important;font-size:clamp(13px,1.39vw,20px)}
.sol-icon{display:inline-flex;align-items:center;justify-content:center;width:clamp(26px,3.06vw,44px);height:clamp(26px,3.06vw,44px);border-radius:clamp(7px,0.83vw,12px);background:var(--yellow);font-size:clamp(14px,1.53vw,22px);margin-bottom:clamp(8px,0.97vw,14px);flex-shrink:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1)}
.card:hover .sol-icon{transform:scale(1.18) rotate(-8deg)}
.gantt-wrap{display:flex;flex-direction:column;gap:0;margin-top:14px;width:100%}
.gantt-header{display:flex;margin-bottom:4px}
.gantt-name-col{width:220px;flex-shrink:0}
.gantt-weeks{flex:1;position:relative;height:18px}
.gantt-week-mark{position:absolute;font-size:10px;font-weight:700;color:var(--gray2);letter-spacing:.06em;transform:translateX(-50%);white-space:nowrap}
.gantt-gridline{position:absolute;top:0;bottom:0;width:1px;background:var(--gray3);pointer-events:none}
.gantt-row{display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--gray3);position:relative;cursor:default}
.gantt-row:last-child{border-bottom:none}
.gantt-name{width:220px;flex-shrink:0;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:var(--black);padding-right:16px}
.gantt-num{width:22px;height:22px;border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--black);flex-shrink:0}
.gantt-track{flex:1;height:30px;background:rgba(0,0,0,0.04);border-radius:6px;position:relative;overflow:hidden}
.gantt-bar{position:absolute;top:0;height:100%;border-radius:6px;background:var(--yellow);transform-origin:left center;animation:ganttbar .65s cubic-bezier(.34,1.56,.64,1) forwards;opacity:0;display:flex;align-items:center;justify-content:flex-end;padding-right:10px}
.gantt-bar-label{font-size:10px;font-weight:800;color:rgba(0,0,0,0.6);white-space:nowrap}
@keyframes ganttbar{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
.gantt-total{margin-top:10px;font-size:11px;font-weight:700;color:var(--gray2);letter-spacing:.1em;text-transform:uppercase}
.gtip{position:fixed;background:var(--black);color:#fff;font-size:12px;font-weight:600;padding:8px 14px;border-radius:8px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:200;white-space:nowrap;border:1px solid rgba(190,255,1,0.25);line-height:1.5}
.gtip.show{opacity:1}
`;

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDate(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function slideHeader(label: string, num: string, dark = false): string {
  const c = dark ? 'color:rgba(255,255,255,0.25)' : '';
  const cn = dark ? 'color:var(--yellow)' : '';
  return `<div class="sh"><div class="st" ${c ? `style="${c}"` : ''}>${esc(label)}</div><div class="sn" ${cn ? `style="${cn}"` : ''}>${esc(num)}</div></div>`;
}

export function slideFooter(progress: number): string {
  const w = Math.round(progress * 100);
  return `<div class="sf"><div class="pt"><div class="pf" style="width:${w}%"></div></div></div>`;
}

export function ticker(text: string, dark = false): string {
  const color = dark ? 'rgba(255,255,255,0.04)' : 'rgba(190,255,1,0.06)';
  const doubled = `${text} · ${text} · &nbsp;`;
  return `<div class="tw"><div class="ti" style="color:${color}">${doubled}</div></div>`;
}

export function buildGantt(
  fases: Array<{ nome: string; mes: number; semanas: number; subfases?: Array<{ nome: string }> }>,
  dark = false
): string {
  if (!fases.length) return '';
  const toAbsWeek = (f: { mes: number }) => Math.max(1, (f.mes - 1) * 4 + 1);
  const maxWeek = Math.max(...fases.map(f => toAbsWeek(f) + (f.semanas || 1) - 1));
  const totalWeeks = Math.ceil(maxWeek / 4) * 4;
  const numMonths = totalWeeks / 4;
  const col = `clamp(150px,18vw,210px) repeat(${totalWeeks},1fr)`;

  const bc = dark ? 'rgba(255,255,255,0.08)' : 'var(--gray3)';
  const textCol = dark ? 'rgba(255,255,255,0.45)' : 'var(--gray2)';
  const tc = dark ? 'rgba(255,255,255,0.7)' : 'var(--gray2)';
  const labelCol = dark ? 'rgba(255,255,255,0.85)' : 'var(--black)';
  const detailBg = dark ? 'rgba(190,255,1,0.06)' : 'rgba(190,255,1,0.07)';
  const monthBg = (m: number) =>
    m % 2 === 0 ? 'rgba(190,255,1,0.06)' : 'transparent';

  // Month header row
  const monthCells = Array.from({ length: numMonths }, (_, m) =>
    `<div style="grid-column:span 4;text-align:center;font-size:clamp(7px,0.65vw,9px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${textCol};padding:4px 0;border-left:1px solid ${bc};background:${monthBg(m)}">Mês ${m + 1}</div>`
  ).join('');

  // Week sub-header row (hidden for long timelines)
  const showWeeks = totalWeeks <= 16;
  const weekCells = showWeeks
    ? Array.from({ length: totalWeeks }, (_, w) =>
        `<div style="text-align:center;font-size:clamp(6px,0.55vw,8px);font-weight:600;color:${textCol};opacity:.6;padding:2px 0;${w % 4 === 0 ? `border-left:1px solid ${bc}` : ''}">S${(w % 4) + 1}</div>`
      ).join('')
    : '';

  // Background stripe cells for each phase row (reused per row)
  const bgCells = Array.from({ length: numMonths }, (_, m) =>
    `<div style="grid-row:1;grid-column:${m * 4 + 2}/span 4;background:${monthBg(m)};height:100%;border-left:1px solid ${bc}"></div>`
  ).join('');

  const rowH = 'clamp(30px,3.8vh,48px)';
  const badgeSize = 'clamp(16px,1.8vw,24px)';
  const badgeFontSize = 'clamp(7px,0.8vw,10px)';
  const nameFontSize = 'clamp(8px,0.85vw,12px)';
  const barRadius = 'clamp(4px,0.4vw,6px)';

  let hasAnySubfases = false;

  const rows = fases.map((f, i) => {
    const inicio  = toAbsWeek(f);
    const semanas = Math.max(1, f.semanas || 1);
    const delay   = (0.25 + i * 0.09).toFixed(2);
    const tip = `${esc(f.nome)} · ${semanas} ${semanas === 1 ? 'semana' : 'semanas'} · Mês ${f.mes}`;
    const subs = (f.subfases || []).filter(s => s.nome.trim());
    const hasSubs = subs.length > 0;
    if (hasSubs) hasAnySubfases = true;

    // Chevron icon (only for phases with subfases)
    const chevron = hasSubs
      ? `<svg id="pc-${i}" width="10" height="14" viewBox="0 0 10 14" fill="none" style="margin-left:auto;flex-shrink:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1);opacity:.75">
           <path d="M3 4.5L7 7L3 9.5" stroke="rgba(190,255,1,0.95)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : '';

    const rowStyle = [
      `display:grid`,
      `grid-template-columns:${col}`,
      `grid-template-rows:${rowH}`,
      `align-items:center`,
      `margin-bottom:clamp(4px,0.5vh,7px)`,
      `position:relative`,
      `border-radius:clamp(4px,0.4vw,6px)`,
      `transition:background .22s ease`,
      hasSubs ? 'cursor:pointer' : '',
    ].filter(Boolean).join(';');

    const onclickAttr = hasSubs
      ? `onclick="tP(${i});event.stopPropagation()" `
      : '';

    // Detail panel (expanded on click)
    const detailPanel = hasSubs ? `
    <div id="pd-${i}" data-open="0" style="max-height:0;overflow:hidden;opacity:0;transition:max-height .38s ease,opacity .28s ease;margin-bottom:0">
      <div style="border-left:3px solid var(--yellow);background:${detailBg};border-radius:0 clamp(6px,0.7vw,10px) clamp(6px,0.7vw,10px) 0;padding:clamp(8px,1vh,14px) clamp(12px,1.4vw,18px);margin-bottom:clamp(4px,0.5vh,7px)">
        <div style="font-size:clamp(6px,0.6vw,9px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${textCol};margin-bottom:clamp(6px,0.7vh,10px)">${esc(f.nome)} — detalhamento</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:clamp(4px,0.5vh,6px) clamp(10px,1.2vw,16px)">
          ${subs.map((s, si) => `
          <div style="display:flex;align-items:center;gap:clamp(6px,0.7vw,9px)">
            <div style="width:clamp(14px,1.5vw,19px);height:clamp(14px,1.5vw,19px);border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:clamp(6px,0.6vw,8px);font-weight:800;color:#000;flex-shrink:0">${String(si + 1).padStart(2, '0')}</div>
            <span style="font-size:clamp(8px,0.82vw,12px);font-weight:600;color:${labelCol};line-height:1.4">${esc(s.nome)}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>` : '';

    return `
    <div id="pr-${i}" class="gantt-row" data-tip="${tip}" ${onclickAttr}style="${rowStyle}">
      <div style="grid-row:1;grid-column:1;font-size:${nameFontSize};font-weight:700;color:${labelCol};padding-right:10px;display:flex;align-items:center;gap:clamp(5px,0.6vw,8px);overflow:hidden">
        <div style="width:${badgeSize};height:${badgeSize};min-width:${badgeSize};border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:${badgeFontSize};font-weight:800;color:#000;flex-shrink:0">${String(i + 1).padStart(2, '0')}</div>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${esc(f.nome)}</span>
        ${chevron}
      </div>
      ${bgCells}
      <div style="grid-row:1;grid-column:${inicio + 1}/span ${semanas};position:relative;display:flex;align-items:center;z-index:2">
        <div
          style="width:100%;height:70%;border-radius:${barRadius};background:linear-gradient(90deg,var(--yellow),rgba(190,255,1,0.72));transform-origin:left center;animation:gbar .55s cubic-bezier(.34,1.56,.64,1) ${delay}s both;display:flex;align-items:center;justify-content:flex-end;padding:0 clamp(4px,0.5vw,8px);transition:filter .2s,transform .15s ease;cursor:default"
          onmouseenter="this.style.filter='brightness(1.12) drop-shadow(0 0 10px rgba(190,255,1,0.55))';this.style.transform='scaleY(1.12)'"
          onmouseleave="this.style.filter='';this.style.transform=''"
        >${semanas >= 2 ? `<span style="font-size:clamp(7px,0.65vw,9px);font-weight:800;color:rgba(0,0,0,0.5);white-space:nowrap">${semanas}sem</span>` : ''}</div>
      </div>
    </div>
    ${detailPanel}`;
  }).join('');

  const totalLine = `DURAÇÃO TOTAL: ${maxWeek} SEMANAS · ${numMonths} MESES`;

  // Toggle script — injected once, guarded against re-definition
  const tpScript = hasAnySubfases ? `
<script>if(!window.tP){window.tP=function(idx){
  document.querySelectorAll('[id^="pd-"]').forEach(function(el){
    var k=parseInt(el.id.slice(3),10);
    var isSelf=k===idx;
    var wasOpen=el.dataset.open==='1';
    var open=isSelf&&!wasOpen;
    el.dataset.open=open?'1':'0';
    el.style.maxHeight=open?el.scrollHeight+'px':'0';
    el.style.opacity=open?'1':'0';
    el.style.marginBottom=open?'6px':'0';
    var r=document.getElementById('pr-'+k);
    var c=document.getElementById('pc-'+k);
    if(r)r.style.background=open?'rgba(190,255,1,0.06)':'';
    if(c)c.style.transform=open?'rotate(90deg)':'';
  });
};}
<\/script>` : '';

  return `
  <div id="gtip" class="gtip"></div>
  <div style="display:grid;grid-template-columns:${col};border-bottom:1px solid ${bc}">
    <div></div>${monthCells}
  </div>
  ${showWeeks ? `<div style="display:grid;grid-template-columns:${col};border-bottom:2px solid ${bc};margin-bottom:clamp(4px,0.5vh,7px)"><div></div>${weekCells}</div>` : ''}
  ${rows}
  <div style="margin-top:clamp(6px,0.8vh,10px);font-size:clamp(8px,0.75vw,10px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${tc}">${totalLine}</div>
  ${tpScript}`;
}
