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
  fases: Array<{ nome: string; mes: number; semanas: number; subfases?: Array<{ nome: string; mes?: number; semanas?: number }> }>,
  dark = false
): string {
  if (!fases.length) return '';

  const toAbsW = (mes: number) => Math.max(1, (mes - 1) * 4 + 1);

  // Calcula total de semanas (fases + subfases)
  const ends: number[] = [];
  fases.forEach(f => {
    ends.push(toAbsW(f.mes) + Math.max(1, f.semanas) - 1);
    (f.subfases || []).forEach(s => {
      if (s.mes && s.semanas) ends.push(toAbsW(s.mes) + s.semanas - 1);
    });
  });
  const maxWeek = Math.max(...ends);
  const totalWeeks = Math.ceil(maxWeek / 4) * 4;
  const numMonths = totalWeeks / 4;

  const nameW = 'clamp(160px,18vw,220px)';
  const col = `${nameW} repeat(${totalWeeks},1fr)`;

  // Cores — tabela sempre escura
  const tableBg = '#0E0F13';
  const hdrBg   = '#18191E';
  const border   = 'rgba(255,255,255,0.08)';
  const mthClr   = 'rgba(255,255,255,0.85)';
  const wkClr    = 'rgba(255,255,255,0.28)';
  const sfClr    = 'rgba(255,255,255,0.72)';
  const rowEven  = '#131418';
  const rowOdd   = '#111216';
  const labelClr = dark ? 'rgba(255,255,255,0.45)' : 'var(--gray2)';

  let ri = 0;
  const rowBg = () => ri++ % 2 === 0 ? rowEven : rowOdd;
  let animIdx = 0;
  const nextDelay = () => (0.08 + animIdx++ * 0.07).toFixed(2);

  // Fundo listrado por mês (por linha)
  const mkBg = () => Array.from({ length: numMonths }, (_, m) => {
    const mbg = m % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';
    return `<div style="grid-row:1;grid-column:${m * 4 + 2}/span 4;background:${mbg};height:100%;border-left:1px solid ${border}"></div>`;
  }).join('');

  // Cabeçalho: nomes dos meses
  const monthCells = Array.from({ length: numMonths }, (_, m) =>
    `<div style="grid-column:span 4;text-align:center;font-size:clamp(8px,0.72vw,10px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${mthClr};padding:clamp(5px,0.55vh,8px) 0;border-left:1px solid ${border}">mês ${m + 1}</div>`
  ).join('');

  // Cabeçalho: números das semanas
  const weekCells = Array.from({ length: totalWeeks }, (_, w) =>
    `<div style="text-align:center;font-size:clamp(6px,0.58vw,9px);font-weight:600;color:${wkClr};padding:clamp(2px,0.3vh,4px) 0;${w % 4 === 0 ? `border-left:1px solid ${border}` : ''}">${(w % 4) + 1}</div>`
  ).join('');

  // Diamantes de sprint review
  const sprintCells = Array.from({ length: totalWeeks }, (_, w) => {
    const gc = w + 2;
    const isEnd = (w + 1) % 4 === 0 && w < totalWeeks - 1;
    const isLast = w === totalWeeks - 1;
    const fill = isLast ? '#3B82F6' : '#F59E0B';
    if (!isEnd && !isLast) return '';
    return `<div style="grid-row:1;grid-column:${gc};display:flex;align-items:center;justify-content:center;z-index:3"><svg width="8" height="8" viewBox="0 0 8 8"><rect x="4" y="0.5" width="5" height="5" transform="rotate(45 4 4)" fill="${fill}"/></svg></div>`;
  }).filter(Boolean).join('');

  // Linhas de fases + subfases
  const rows = fases.map((f, fi) => {
    const subs = (f.subfases || []).filter(s => s.nome.trim());
    const subsWithBars = subs.filter(s => s.mes && s.semanas);

    // Linha de cabeçalho da fase (badge amarelo)
    const phRow = `
<div style="display:grid;grid-template-columns:${col};min-height:clamp(26px,3vh,38px);align-items:center;background:${rowBg()};border-top:1px solid ${border}">
  <div style="grid-row:1;grid-column:1;padding:clamp(4px,0.45vh,6px) clamp(8px,0.9vw,12px);display:flex;align-items:center">
    <span style="display:inline-block;background:var(--yellow);color:#000;border-radius:clamp(3px,0.3vw,4px);padding:clamp(1px,0.2vh,3px) clamp(5px,0.58vw,8px);font-size:clamp(8px,0.74vw,11px);font-weight:800;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis">${String(fi + 1).padStart(2, '0')}: ${esc(f.nome)}</span>
  </div>
  ${mkBg()}
</div>`;

    // Linhas de subfases
    const sfRows = subs.map(s => {
      const hasBar = !!(s.mes && s.semanas);
      const bg = rowBg();
      const delay = nextDelay();
      const span = Math.max(1, s.semanas || 1);
      const startGc = hasBar ? toAbsW(s.mes!) + 1 : 0;

      return `
<div style="display:grid;grid-template-columns:${col};min-height:clamp(22px,2.6vh,34px);align-items:center;background:${bg};border-top:1px solid ${border}">
  <div style="grid-row:1;grid-column:1;padding:clamp(3px,0.32vh,5px) clamp(10px,1.1vw,14px);font-size:clamp(7px,0.67vw,10px);font-weight:600;color:${sfClr};display:flex;align-items:center;gap:clamp(4px,0.44vw,6px);overflow:hidden">
    <span style="width:3px;height:3px;border-radius:50%;background:var(--yellow);flex-shrink:0"></span>
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.nome)}</span>
  </div>
  ${mkBg()}
  ${hasBar ? `<div style="grid-row:1;grid-column:${startGc}/span ${span};z-index:2;padding:clamp(3px,0.38vh,5px) 0;display:flex;align-items:center"><div style="width:100%;height:62%;border-radius:clamp(3px,0.3vw,4px);background:linear-gradient(90deg,var(--yellow),rgba(190,255,1,0.78));transform-origin:left;animation:gbar .5s cubic-bezier(.34,1.56,.64,1) ${delay}s both;display:flex;align-items:center;justify-content:flex-end;padding:0 clamp(3px,0.3vw,5px);cursor:default;transition:filter .18s" onmouseenter="this.style.filter='brightness(1.12) drop-shadow(0 0 8px rgba(190,255,1,0.5))'" onmouseleave="this.style.filter=''">${span >= 2 ? `<span style="font-size:clamp(6px,0.54vw,8px);font-weight:800;color:rgba(0,0,0,0.5)">${span}sem</span>` : ''}</div></div>` : ''}
</div>`;
    }).join('');

    // Barra da fase (só se sem subfases com timing)
    let phBar = '';
    if (subs.length === 0 || subsWithBars.length === 0) {
      const bg = rowBg();
      const startGc = toAbsW(f.mes) + 1;
      const span = Math.max(1, f.semanas);
      const delay = nextDelay();
      phBar = `
<div style="display:grid;grid-template-columns:${col};min-height:clamp(24px,2.8vh,36px);align-items:center;background:${bg};border-top:1px solid ${border}">
  <div style="grid-row:1;grid-column:1"></div>
  ${mkBg()}
  <div style="grid-row:1;grid-column:${startGc}/span ${span};z-index:2;padding:clamp(3px,0.4vh,6px) 0;display:flex;align-items:center"><div style="width:100%;height:58%;border-radius:clamp(3px,0.3vw,4px);background:linear-gradient(90deg,var(--yellow),rgba(190,255,1,0.78));transform-origin:left;animation:gbar .55s cubic-bezier(.34,1.56,.64,1) ${delay}s both;display:flex;align-items:center;justify-content:flex-end;padding:0 clamp(3px,0.3vw,5px);cursor:default;transition:filter .18s" onmouseenter="this.style.filter='brightness(1.12) drop-shadow(0 0 8px rgba(190,255,1,0.5))'" onmouseleave="this.style.filter=''">${span >= 2 ? `<span style="font-size:clamp(6px,0.54vw,8px);font-weight:800;color:rgba(0,0,0,0.5)">${span}sem</span>` : ''}</div></div>
</div>`;
    }

    return phRow + sfRows + phBar;
  }).join('');

  return `
<div id="gtip" class="gtip"></div>
<div style="border-radius:clamp(8px,0.9vw,12px);overflow:hidden;width:100%">
  <div style="display:grid;grid-template-columns:${col};background:${hdrBg}">
    <div style="font-size:clamp(7px,0.62vw,9px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.36);padding:clamp(5px,0.58vh,8px) clamp(8px,0.9vw,12px);border-right:1px solid ${border}">etapa</div>
    ${monthCells}
  </div>
  <div style="display:grid;grid-template-columns:${col};background:${hdrBg};border-top:1px solid ${border}">
    <div></div>${weekCells}
  </div>
  <div style="display:grid;grid-template-columns:${col};height:clamp(14px,1.6vh,20px);background:${tableBg};border-top:1px solid ${border}">
    <div style="grid-row:1;grid-column:1"></div>
    ${mkBg()}
    ${sprintCells}
  </div>
  ${rows}
</div>
<div style="margin-top:clamp(5px,0.65vh,9px);font-size:clamp(7px,0.66vw,9px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${labelClr}">DURAÇÃO TOTAL: ${maxWeek} SEMANAS · ${numMonths} MESES</div>`;
}
