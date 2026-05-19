import type { PropostaData } from '@/components/documentos/types/proposta';
import { buildGantt } from './slideBase';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(s: string) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CSS = `
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
.sf{position:absolute;bottom:clamp(28px,5.2vh,48px);left:clamp(48px,6.7vw,96px);right:clamp(48px,6.7vw,96px);display:flex;align-items:center;justify-content:space-between}
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
.card{background:var(--white);border:1px solid var(--gray3);border-radius:clamp(10px,1.1vw,16px);padding:clamp(14px,1.67vw,24px);transition:border-color .2s,transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;cursor:default}
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
@keyframes floatpill-sm{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
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
@keyframes gbar{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
.gtip{position:fixed;background:var(--black);color:#fff;font-size:clamp(8px,0.83vw,12px);font-weight:600;padding:clamp(5px,0.56vw,8px) clamp(9px,0.97vw,14px);border-radius:clamp(5px,0.56vw,8px);pointer-events:none;opacity:0;transition:opacity .15s;z-index:200;white-space:nowrap;border:1px solid rgba(190,255,1,0.25);line-height:1.5}
.gtip.show{opacity:1}
`;

function slideHeader(label: string, num: string, dark = false): string {
  const c = dark ? 'color:rgba(255,255,255,0.25)' : '';
  const cn = dark ? 'color:var(--yellow)' : '';
  return `<div class="sh"><div class="st" ${c ? `style="${c}"` : ''}>${esc(label)}</div><div class="sn" ${cn ? `style="${cn}"` : ''}>${esc(num)}</div></div>`;
}

function slideFooter(progress: number): string {
  const w = Math.round(progress * 100);
  return `<div class="sf"><div class="pt"><div class="pf" style="width:${w}%"></div></div></div>`;
}

function ticker(text: string, dark = false): string {
  const color = dark ? 'rgba(255,255,255,0.04)' : 'rgba(190,255,1,0.06)';
  const doubled = `${text} · ${text} · &nbsp;`;
  return `<div class="tw"><div class="ti" style="color:${color}">${doubled}</div></div>`;
}

function slide01(p: PropostaData): string {
  const tickerText = `${esc(p.nomeCliente || 'Cliente')} · ${esc('Proposta')} · ${esc(p.nomeEmpresa || 'Empresa')}`.toUpperCase();
  return `
<!-- 01 CAPA -->
<div class="slide active" style="background:var(--black2)">

  <!-- dot grid background -->
  <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dotg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="rgba(190,255,1,0.08)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dotg)"/>
  </svg>

  <!-- horizontal scan line -->
  <div style="position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(190,255,1,0.25),transparent);animation:scanv 8s ease-in-out infinite;pointer-events:none"></div>

  <!-- tech orb right -->
  <div style="position:absolute;right:-120px;top:50%;transform:translateY(-50%);pointer-events:none;overflow:visible">
    <svg width="820" height="820" viewBox="0 0 580 580" fill="none" overflow="visible">
      <g style="transform-origin:290px 290px;animation:spin-cw 32s linear infinite">
        <circle cx="290" cy="290" r="275" stroke="rgba(190,255,1,0.09)" stroke-width="1" stroke-dasharray="8 18"/>
        <circle cx="290" cy="15" r="4" fill="rgba(190,255,1,0.22)"/>
        <circle cx="565" cy="290" r="3" fill="rgba(190,255,1,0.16)"/>
      </g>
      <g style="transform-origin:290px 290px;animation:spin-ccw 22s linear infinite">
        <circle cx="290" cy="290" r="195" stroke="rgba(190,255,1,0.11)" stroke-width="1"/>
        <circle cx="290" cy="95" r="5" fill="rgba(190,255,1,0.28)"/>
        <circle cx="485" cy="290" r="3" fill="rgba(190,255,1,0.18)"/>
        <circle cx="95" cy="290" r="2.5" fill="rgba(190,255,1,0.13)"/>
      </g>
      <g style="transform-origin:290px 290px;animation:spin-cw 14s linear infinite">
        <circle cx="290" cy="290" r="115" stroke="rgba(190,255,1,0.16)" stroke-width="1.5" stroke-dasharray="4 8"/>
        <circle cx="290" cy="175" r="5" fill="rgba(190,255,1,0.32)"/>
        <circle cx="405" cy="290" r="3.5" fill="rgba(190,255,1,0.22)"/>
      </g>
      <g style="transform-origin:290px 290px;animation:spin-ccw 52s linear infinite">
        <circle cx="290" cy="290" r="340" stroke="rgba(190,255,1,0.05)" stroke-width="1" stroke-dasharray="3 24"/>
        <circle cx="290" cy="-50" r="2.5" fill="rgba(190,255,1,0.12)"/>
      </g>
      <circle cx="290" cy="290" r="5" fill="rgba(190,255,1,0.3)"/>
      <circle cx="290" cy="290" r="14" stroke="rgba(190,255,1,0.1)" stroke-width="1"/>
    </svg>
  </div>

  <!-- bottom-left ring cluster -->
  <div style="position:absolute;left:-80px;bottom:-80px;pointer-events:none">
    <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
      <g style="transform-origin:160px 160px;animation:spin-ccw 38s linear infinite">
        <circle cx="160" cy="160" r="148" stroke="rgba(190,255,1,0.07)" stroke-width="1" stroke-dasharray="5 16"/>
        <circle cx="160" cy="12" r="3.5" fill="rgba(190,255,1,0.16)"/>
        <circle cx="308" cy="160" r="3" fill="rgba(190,255,1,0.12)"/>
      </g>
      <g style="transform-origin:160px 160px;animation:spin-cw 24s linear infinite">
        <circle cx="160" cy="160" r="96" stroke="rgba(190,255,1,0.11)" stroke-width="1"/>
        <circle cx="160" cy="64" r="4.5" fill="rgba(190,255,1,0.22)"/>
        <circle cx="256" cy="160" r="3" fill="rgba(190,255,1,0.15)"/>
        <circle cx="64" cy="160" r="2.5" fill="rgba(190,255,1,0.1)"/>
      </g>
      <g style="transform-origin:160px 160px;animation:spin-ccw 16s linear infinite">
        <circle cx="160" cy="160" r="52" stroke="rgba(190,255,1,0.14)" stroke-width="1" stroke-dasharray="3 7"/>
        <circle cx="160" cy="108" r="4" fill="rgba(190,255,1,0.24)"/>
      </g>
    </svg>
  </div>

  <!-- corner brackets -->
  <svg style="position:absolute;top:28px;right:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M40 10 L40 0 L30 0" stroke="rgba(190,255,1,0.28)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <svg style="position:absolute;bottom:28px;left:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M0 30 L0 40 L10 40" stroke="rgba(190,255,1,0.28)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <svg style="position:absolute;top:28px;left:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M10 0 L0 0 L0 10" stroke="rgba(190,255,1,0.2)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <svg style="position:absolute;bottom:28px;right:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M30 40 L40 40 L40 30" stroke="rgba(190,255,1,0.2)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>

  <!-- floating particles -->
  <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
    <div style="position:absolute;left:14%;bottom:20%;width:4px;height:4px;border-radius:50%;background:rgba(190,255,1,0.3);animation:rise 5.2s ease-in-out infinite;animation-delay:0s"></div>
    <div style="position:absolute;left:22%;bottom:35%;width:3px;height:3px;border-radius:50%;background:rgba(190,255,1,0.22);animation:rise 6.8s ease-in-out infinite;animation-delay:1.4s"></div>
    <div style="position:absolute;left:8%;bottom:50%;width:2px;height:2px;border-radius:50%;background:rgba(190,255,1,0.25);animation:rise 4.5s ease-in-out infinite;animation-delay:0.7s"></div>
    <div style="position:absolute;left:30%;bottom:15%;width:3px;height:3px;border-radius:50%;background:rgba(190,255,1,0.18);animation:rise 7.1s ease-in-out infinite;animation-delay:2.2s"></div>
    <div style="position:absolute;left:18%;bottom:65%;width:2px;height:2px;border-radius:50%;background:rgba(190,255,1,0.22);animation:rise 5.9s ease-in-out infinite;animation-delay:3.1s"></div>
    <div style="position:absolute;left:40%;bottom:25%;width:2px;height:2px;border-radius:50%;background:rgba(190,255,1,0.18);animation:rise 8.3s ease-in-out infinite;animation-delay:1.8s"></div>
    <div style="position:absolute;left:5%;bottom:40%;width:3px;height:3px;border-radius:50%;background:rgba(190,255,1,0.2);animation:rise 6.0s ease-in-out infinite;animation-delay:4.0s"></div>
    <div style="position:absolute;left:26%;bottom:78%;width:2px;height:2px;border-radius:50%;background:rgba(190,255,1,0.18);animation:rise 5.5s ease-in-out infinite;animation-delay:2.8s"></div>
  </div>

  ${slideHeader('', '01 / 13', true)}
  ${p.website ? `<a href="https://${esc(p.website)}" target="_blank" rel="noopener noreferrer" style="position:absolute;top:clamp(28px,3.3vh,36px);left:clamp(48px,6.7vw,96px);color:var(--yellow);font-size:11px;font-weight:700;text-decoration:none;letter-spacing:.08em;opacity:.7">${esc(p.website)}</a>` : ''}
  <div class="a" style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:28px">Proposta Comercial</div>
  <div class="display a" style="color:#fff"><span class="acc">${esc('Proposta')}</span><br>${esc(p.nomeCliente || 'Cliente')}</div>
  <div class="a" style="display:flex;align-items:center;gap:16px;margin:24px 0 40px">
    <div style="width:60px;height:1px;background:var(--yb)"></div>
    <div style="font-size:16px;color:rgba(255,255,255,0.45);font-weight:500">${formatDate(p.dataProposta)}${p.nomeVendedor ? ` · ${esc(p.nomeVendedor)}` : ''}</div>
  </div>
  ${(p.tagline || p.descricaoEmpresa.split('\n')[0]) ? `<div class="body-text a" style="color:rgba(255,255,255,0.4)">${esc(p.tagline || p.descricaoEmpresa.split('\n')[0])}</div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(1 / 13)}
</div>`;
}

// ── SLIDE 2 — SOBRE NÓS ────────────────────────────────
function slide02(p: PropostaData): string {
  const valores = p.valoresEmpresa.filter(v => v.titulo);
  const cards = valores.map(v => `
    <div class="card ct">
      <div class="card-title">${esc(v.titulo)}</div>
      <div class="card-body">${esc(v.descricao)}</div>
    </div>`).join('');
  const gridClass = valores.length >= 3 ? 'g3' : valores.length === 2 ? 'g2' : '';

  return `
<!-- 02 SOBRE NÓS -->
<div class="slide">
  ${slideHeader('Quem somos', '02 / 13')}
  <div class="title a">${esc(p.sobreNosTitulo || '')}${p.sobreNosTituloAcc ? `<br><span class="acc">${esc(p.sobreNosTituloAcc)}</span>` : ''}</div>
  <div class="rule a"></div>
  ${p.sobreNosDesc1 ? `<div class="body-text a" style="margin-bottom:${valores.length ? '32px' : '0'}">${esc(p.sobreNosDesc1).replace(/\n/g, '<br>')}</div>` : ''}
  ${valores.length ? `<div class="${gridClass} a">${cards}</div>` : ''}
  ${slideFooter(2 / 13)}
</div>`;
}

// ── SLIDE 3 — TECNOLOGIAS ─────────────────────────────
function slide03(p: PropostaData): string {
  const techs = p.tecnologias.filter(t => t.nome);
  const n = techs.length;

  // Responsive sizing based on how many techs there are
  let pillFontSize: number, pillPadV: number, pillPadH: number, cloudGap: number, slidePad: string, titleSize: string, titleMb: number, ruleMargin: string;
  if (n <= 12) {
    pillFontSize = 15; pillPadV = 10; pillPadH = 22; cloudGap = 12;
    slidePad = 'clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px)'; titleSize = 'clamp(28px,3.9vw,56px)'; titleMb = 28; ruleMargin = 'clamp(12px,2vh,20px) auto';
  } else if (n <= 20) {
    pillFontSize = 14; pillPadV = 8; pillPadH = 18; cloudGap = 10;
    slidePad = 'clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px)'; titleSize = 'clamp(26px,3.5vw,50px)'; titleMb = 24; ruleMargin = 'clamp(10px,1.5vh,16px) auto';
  } else if (n <= 32) {
    pillFontSize = 13; pillPadV = 7; pillPadH = 15; cloudGap = 8;
    slidePad = 'clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px)'; titleSize = 'clamp(24px,3.2vw,46px)'; titleMb = 20; ruleMargin = 'clamp(8px,1.2vh,12px) auto';
  } else if (n <= 50) {
    pillFontSize = 12; pillPadV = 5; pillPadH = 12; cloudGap = 6;
    slidePad = 'clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px)'; titleSize = 'clamp(22px,3.0vw,43px)'; titleMb = 18; ruleMargin = 'clamp(6px,1vh,10px) auto';
  } else {
    pillFontSize = 11; pillPadV = 4; pillPadH = 10; cloudGap = 5;
    slidePad = 'clamp(36px,6.7vh,72px) clamp(48px,6.7vw,96px)'; titleSize = 'clamp(22px,2.8vw,40px)'; titleMb = 16; ruleMargin = 'clamp(6px,0.8vh,8px) auto';
  }

  const pills = techs.map((t, i) => {
    const isAccent = i % 3 === 0;
    const delay = ((i * 0.17) % 2.6).toFixed(2);
    const duration = (2.6 + (i * 0.13) % 1.2).toFixed(2);
    const anim = n > 32 ? 'floatpill-sm' : 'floatpill';
    const hoverIn  = n <= 40 ? `this.style.animationPlayState='paused';this.style.transform='translateY(-4px) scale(1.05)'` : '';
    const hoverOut = n <= 40 ? `this.style.animationPlayState='running';this.style.transform=''` : '';
    const hoverAttrs = n <= 40 ? `onmouseenter="${hoverIn}" onmouseleave="${hoverOut}"` : '';
    return `<span class="pill ${isAccent ? 'pill-accent' : 'pill-dark'}" style="font-size:${pillFontSize}px;padding:${pillPadV}px ${pillPadH}px;animation-name:${anim};animation-delay:${delay}s;animation-duration:${duration}s" ${hoverAttrs}>${esc(t.nome)}</span>`;
  }).join('');

  return `
<!-- 03 TECNOLOGIAS -->
<div class="slide sw" style="padding:${slidePad};justify-content:center;gap:${titleMb}px">
  ${slideHeader('Stack Tecnológico', '03 / 13')}
  <div class="a" style="display:flex;flex-direction:column;align-items:center;text-align:center">
    <div class="title" style="font-size:${titleSize}">Ferramentas e tecnologias <span class="acc">que utilizamos</span></div>
    <div class="rule" style="margin:${ruleMargin}"></div>
  </div>
  <div style="width:100%;overflow:visible">
    <div class="pill-cloud" style="gap:${cloudGap}px;align-content:center;justify-content:center;overflow:visible;width:100%">${pills}</div>
  </div>
  ${slideFooter(3 / 13)}
</div>`;
}

// ── SLIDE 4 — CLIENTES ────────────────────────────────
function slide04(p: PropostaData): string {
  const clientes = p.clientes.filter(c => c.nome || c.logo);
  const cols = clientes.length <= 3 ? clientes.length : clientes.length <= 6 ? 3 : clientes.length <= 8 ? 4 : 5;
  const cards = clientes.map(c => `
    <div style="background:#fff;border:1px solid var(--gray3);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:center;aspect-ratio:2/1;transition:border-color .2s,transform .2s,box-shadow .2s" onmouseenter="this.style.borderColor='var(--yellow)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(0,0,0,0.08)'" onmouseleave="this.style.borderColor='var(--gray3)';this.style.transform='';this.style.boxShadow=''">
      ${c.logo
        ? `<img src="${c.logo}" alt="${esc(c.nome)}" style="max-width:100%;max-height:44px;object-fit:contain"/>`
        : `<span style="font-size:12px;font-weight:700;color:var(--black);letter-spacing:-.01em;text-align:center">${esc(c.nome)}</span>`
      }
    </div>`).join('');

  return `
<!-- 04 CLIENTES -->
<div class="slide sw">
  ${slideHeader('Nossos Clientes', '04 / 13')}
  <div style="font-size:clamp(16px,2.4vw,34px);font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--black)" class="a">Empresas que confiam <span class="acc">em nós</span></div>
  <div class="rule a"></div>
  ${clientes.length ? `
  <div class="a" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;margin-top:0">
    ${cards}
  </div>` : ''}
  ${slideFooter(4 / 13)}
</div>`;
}

// ── SLIDE 5 — SOLUÇÕES ────────────────────────────────
function slide05(p: PropostaData): string {
  const solucoes = p.solucoesSheep.filter(s => s.titulo);
  const cols = solucoes.length <= 2 ? solucoes.length : solucoes.length <= 4 ? 2 : 3;
  const cards = solucoes.map(s => `
    <div class="card" style="border-top:2px solid var(--yellow);padding:24px">
      ${s.icone ? `<div class="sol-icon">${esc(s.icone)}</div>` : ''}
      <div class="card-title">${esc(s.titulo)}</div>
      <div class="card-body">${esc(s.descricao)}</div>
    </div>`).join('');

  return `
<!-- 05 SOLUÇÕES -->
<div class="slide sw">
  ${slideHeader('Nossas Soluções', '05 / 13')}
  <div style="font-size:clamp(16px,2.4vw,34px);font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--black)" class="a">O que a Sheep Tech <span class="acc">oferece</span></div>
  <div class="rule a"></div>
  ${solucoes.length ? `<div class="a" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;margin-top:4px">${cards}</div>` : ''}
  ${slideFooter(5 / 13)}
</div>`;
}

// ── SLIDE 6 — O DESAFIO ────────────────────────────────
function slide06(p: PropostaData): string {
  const dores = p.pontosDeDor.filter(d => d.texto);
  const liItems = dores.map(d => `<li class="a">${esc(d.texto)}</li>`).join('');

  return `
<!-- 06 O DESAFIO -->
<div class="slide">
  ${slideHeader('O Desafio', '06 / 13')}
  <div class="g2">
    <div>
      <div class="title a">O desafio de<br><span class="acc">${esc(p.nomeCliente || 'você')}</span></div>
      <div class="rule a"></div>
      <div class="body-text a" style="word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical">${esc(p.descricaoDesafio || '').replace(/\n/g, '<br>')}</div>
    </div>
    <div>
      ${dores.length ? `<div class="eyebrow a" style="color:var(--black)">Principais dores</div><ul class="krl a">${liItems}</ul>` : ''}
    </div>
  </div>
  ${slideFooter(6 / 13)}
</div>`;
}

// ── SLIDE 7 — A SOLUÇÃO ────────────────────────────────
function slide07(p: PropostaData): string {
  const difs = p.diferenciais.filter(d => d.label);
  const cards = difs.map(d => `
    <div class="card ct a">
      <div class="card-title">${esc(d.label)}</div>
      <div class="card-body">${esc(d.descricao)}</div>
    </div>`).join('');

  // Dynamic grid: auto-fit so the last row always fills with no empty slots.
  // 4 items → 2×2; 1/2/3/5 items → auto-fit minmax(28%, 1fr) fills naturally.
  const n = difs.length;
  const gridStyle = n === 4
    ? 'display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(9px,1.11vw,16px)'
    : `display:grid;grid-template-columns:repeat(auto-fit,minmax(28%,1fr));gap:clamp(9px,1.11vw,16px)`;

  return `
<!-- 07 A SOLUÇÃO -->
<div class="slide sw">
  ${slideHeader('A Solução', '07 / 13')}
  <div class="title a">O que vamos<br><span class="acc">entregar</span></div>
  <div class="rule a"></div>
  <div class="body-text a" style="max-width:none;margin-bottom:${difs.length ? 'clamp(16px,2.2vh,28px)' : '0'};word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${esc(p.descricaoSolucao || '').replace(/\n/g, '<br>')}</div>
  ${difs.length ? `<div class="a" style="${gridStyle}">${cards}</div>` : ''}
  ${slideFooter(7 / 13)}
</div>`;
}

// ── SLIDE 8 — CRONOGRAMA ───────────────────────────────
function slide09(p: PropostaData): string {
  const fases = p.fases.filter(f => f.nome && f.semanas > 0);
  const toAbsWeek = (f: { mes: number }) => Math.max(1, (f.mes - 1) * 4 + 1);
  const maxWeek = fases.length ? Math.max(...fases.map(f => toAbsWeek(f) + (f.semanas || 1) - 1)) : 0;
  const numMonths = fases.length ? Math.ceil(maxWeek / 4) : 0;
  return `
<!-- 08 CRONOGRAMA -->
<div class="slide sw" style="padding-top:clamp(56px,8vh,88px)">
  ${slideHeader('Cronograma', '08 / 12')}
  <div style="display:flex;gap:clamp(24px,3.5vw,48px);align-items:flex-start;flex:1;min-height:0">

    <!-- Left column: title + stats -->
    <div style="width:26%;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;gap:clamp(6px,0.8vh,10px)">
      <div style="font-size:clamp(8px,0.75vw,10px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#aaa">CRONOGRAMA</div>
      <div class="title">Fases do<br><span class="acc">projeto</span></div>
      <div class="rule" style="margin:clamp(6px,0.8vh,10px) 0"></div>
      ${fases.length ? `
      <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="background:var(--yd);color:#2a4a00;border:1px solid var(--yb);border-radius:100px;font-size:clamp(8px,0.75vw,10px);font-weight:800;letter-spacing:.08em;padding:clamp(2px,0.3vh,4px) clamp(8px,0.9vw,12px)">${fases.length} fase${fases.length !== 1 ? 's' : ''}</span>
      </div>
      <div style="font-size:clamp(8px,0.72vw,10px);color:var(--gray2);font-weight:600;letter-spacing:.06em">${maxWeek} semanas · ${numMonths} ${numMonths === 1 ? 'mês' : 'meses'}</div>` : ''}
    </div>

    <!-- Right column: Gantt -->
    <div style="flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center">
      ${buildGantt(fases, false)}
    </div>

  </div>
  ${slideFooter(8 / 12)}
</div>`;
}

// ── SLIDE 10 — INVESTIMENTO ─────────────────────────────
function slide10(p: PropostaData): string {
  const itens = p.itensInvestimento.filter(it => it.descricao);
  const total = itens.reduce((acc, it) => acc + (it.valor || 0), 0);

  const rows = itens.map(it => `
    <tr>
      <td>${esc(it.descricao)}</td>
      <td>${formatBRL(it.valor)}</td>
    </tr>`).join('');

  return `
<!-- 09 INVESTIMENTO -->
<div class="slide sw">
  ${slideHeader('Investimento', '09 / 12')}
  <div class="title a">Proposta de <span class="acc">valor</span></div>
  <div class="rule a"></div>
  <div class="a">
    <table class="inv-table">
      <tbody>
        ${rows}
        <tr class="inv-total">
          <td style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:11px">Total</td>
          <td>${formatBRL(total)}</td>
        </tr>
      </tbody>
    </table>
    ${p.formaPagamento ? `<div class="body-text" style="margin-top:20px;font-size:14px">${esc(p.formaPagamento)}</div>` : ''}
  </div>
  ${slideFooter(9 / 12)}
</div>`;
}

// ── SLIDE 11 — INFRAESTRUTURA ──────────────────────────
function slide11(p: PropostaData): string {
  const itens = p.itensInfra.filter(it => it.descricao);
  const total = itens.reduce((acc, it) => acc + (it.valorMensal || 0), 0);

  const rows = itens.map(it => `
    <tr>
      <td>${esc(it.descricao)}</td>
      <td>${formatBRL(it.valorMensal)}<span style="font-size:11px;font-weight:500;color:var(--gray2)">/mês</span></td>
    </tr>`).join('');

  return `
<!-- 10 INFRAESTRUTURA -->
<div class="slide sw">
  ${slideHeader('Infra', '10 / 12')}
  <div class="title a">Custos de <span class="acc">infraestrutura</span></div>
  <div class="rule a"></div>
  <div class="a">
    <table class="inv-table">
      <tbody>
        ${rows}
        <tr class="inv-total">
          <td style="font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:11px">Total mensal</td>
          <td>${formatBRL(total)}<span style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.5)">/mês</span></td>
        </tr>
      </tbody>
    </table>
    ${p.notasInfra ? `<div class="body-text" style="margin-top:20px;font-size:14px">${esc(p.notasInfra)}</div>` : ''}
  </div>
  ${slideFooter(10 / 12)}
</div>`;
}

// ── SLIDE 12 — CENÁRIOS DE OPERAÇÃO ────────────────────
function slide12(p: PropostaData): string {
  const cenarios = p.cenariosInfra.filter(c => c.nome);

  const cards = cenarios.map((c, i) => {
    const total = (c.infraMensal || 0) + (c.manutencaoMensal || 0);
    const isHighlight = i === 1;
    return `
    <div style="
      flex:1;min-width:0;
      background:${isHighlight ? 'rgba(190,255,1,0.06)' : 'rgba(255,255,255,0.05)'};
      border:1px solid ${isHighlight ? 'var(--yellow)' : 'rgba(255,255,255,0.08)'};
      border-radius:16px;padding:28px 24px;
      display:flex;flex-direction:column;gap:0;position:relative;
    " class="a">
      ${isHighlight ? `<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--yellow);color:var(--black);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:3px 12px;border-radius:100px">Recomendado</div>` : ''}
      <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:4px">${esc(c.nome)}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:20px">${esc(c.usuarios)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:13px;color:rgba(255,255,255,0.5)">Infra / mês</span>
        <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.8)">${formatBRL(c.infraMensal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <span style="font-size:13px;color:rgba(255,255,255,0.5)">Manutenção / mês</span>
        <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.8)">${formatBRL(c.manutencaoMensal)}</span>
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:6px">Total / mês</div>
      <div style="font-size:26px;font-weight:800;color:var(--yellow)">${formatBRL(total)}</div>
    </div>`;
  }).join('');

  return `
<!-- 11 CENÁRIOS -->
<div class="slide" style="background:var(--black2)">
  ${slideHeader(p.nomeEmpresa || 'Empresa', '11 / 12', true)}
  <div class="title a" style="color:#fff">Cenários de <span class="acc">operação</span></div>
  <div class="rule a"></div>
  <div class="a" style="display:flex;gap:20px;align-items:stretch">
    ${cards}
  </div>
  ${slideFooter(11 / 12)}
</div>`;
}

// ── SLIDE 13 — PRÓXIMOS PASSOS ─────────────────────────
function slide13(p: PropostaData): string {
  const passos = p.proximosPassos.filter(pp => pp.texto);
  const mrRows = passos.map((pp, i) => `
    <div class="mr a">
      <div class="md">${String(i + 1).padStart(2, '0')}</div>
      <div class="mt">${esc(pp.texto)}</div>
    </div>`).join('');

  const contactLine = [p.emailContato, p.telefoneContato].filter(Boolean).join('  ·  ');
  const tickerText = `${esc(p.nomeEmpresa || 'Empresa')} · ${esc(p.nomeCliente || 'Cliente')} · PROPOSTA COMERCIAL`.toUpperCase();

  return `
<!-- 12 PRÓXIMOS PASSOS -->
<div class="slide" style="background:var(--black2);text-align:center;align-items:center">
  ${slideHeader(p.nomeEmpresa || 'Empresa', '12 / 12', true)}
  <div class="a" style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);text-align:center;margin-bottom:20px">Próximos Passos</div>
  <div class="display a" style="color:#fff;text-align:center">Vamos<br>começar <span class="acc">juntos?</span></div>
  <div style="width:60px;height:2px;background:var(--yellow);margin:24px auto;border-radius:1px" class="a"></div>
  ${passos.length ? `
  <div class="a" style="width:100%;max-width:560px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px 28px;margin:0 auto 24px">
    ${mrRows}
  </div>` : ''}
  ${p.nomeContato ? `
  <div class="body-text a" style="color:rgba(255,255,255,0.5);text-align:center;margin:0 auto">
    <strong style="color:rgba(255,255,255,0.8)">${esc(p.nomeContato)}</strong>${contactLine ? `<br>${esc(contactLine)}` : ''}
    ${p.website ? `<br><a href="https://${esc(p.website)}" target="_blank" rel="noopener noreferrer" style="color:var(--yellow);font-size:13px;font-weight:600;text-decoration:none">${esc(p.website)}</a>` : ''}
    ${p.validadeProposta ? `<br><span style="font-size:13px;color:rgba(255,255,255,0.25)">Proposta válida até ${formatDate(p.validadeProposta)}</span>` : ''}
  </div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(12 / 12)}
</div>`;
}

export function generatePropostaHtml(p: PropostaData, hiddenSlides: number[] = []): string {
  const allSlides = [
    slide01(p),
    slide02(p),
    slide03(p),
    slide04(p),
    slide05(p),
    slide06(p),
    slide07(p),
    slide09(p),
    slide10(p),
    slide11(p),
    slide12(p),
    slide13(p),
  ];
  const visibleSlides = allSlides.filter((_, i) => !hiddenSlides.includes(i));
  const totalSlides = visibleSlides.length;
  const slides = visibleSlides.join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Proposta — ${esc(p.nomeCliente || '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="hint" id="hint">← → para navegar · clique para avançar</div>
<div class="deck">
${slides}
</div>
<script>
const slides=document.querySelectorAll('.slide'),total=${totalSlides};
let cur=0,hT;
function go(n){if(n<0||n>=total)return;slides[cur].classList.remove('active');cur=n;slides[cur].classList.add('active');const pf=document.querySelector('.pf');if(pf)pf.style.width=((cur+1)/total*100)+'%';sh();}
function sh(){const h=document.getElementById('hint');h.classList.remove('hidden');clearTimeout(hT);hT=setTimeout(()=>h.classList.add('hidden'),3000);}
document.addEventListener('keydown',e=>{
  if(['ArrowRight','ArrowDown',' '].includes(e.key)){e.preventDefault();go(cur+1);}
  if(['ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();go(cur-1);}
  if(e.key==='Home')go(0);if(e.key==='End')go(total-1);
});
document.querySelector('.deck').addEventListener('click',e=>{e.clientX>window.innerWidth/2?go(cur+1):go(cur-1);});
window.addEventListener('message',function(e){if(e.data&&typeof e.data.goSlide==='number')go(e.data.goSlide);});
sh();
(function(){var tip=document.getElementById('gtip');if(!tip)return;document.querySelectorAll('.gantt-row').forEach(function(row){row.addEventListener('mouseenter',function(){tip.textContent=row.dataset.tip||'';tip.classList.add('show');});row.addEventListener('mousemove',function(e){tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY-40)+'px';});row.addEventListener('mouseleave',function(){tip.classList.remove('show');});});})();
<\/script>
</body>
</html>`;
}
