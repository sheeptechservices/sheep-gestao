import { CSS, esc, formatDate, slideHeader, slideFooter, ticker, buildGantt } from './slideBase';
import type { KickoffData } from '@/components/documentos/types/kickoff';
import type { Fase } from '@/components/documentos/types/proposta';

function slide01(p: KickoffData): string {
  return `
<!-- 01 CAPA -->
<div class="slide active" style="background:var(--black2)">
  <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dotg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="rgba(190,255,1,0.08)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dotg)"/>
  </svg>
  <div style="position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(190,255,1,0.25),transparent);animation:scanv 8s ease-in-out infinite;pointer-events:none"></div>
  <div style="position:absolute;right:-120px;top:50%;transform:translateY(-50%);pointer-events:none;overflow:visible">
    <svg width="820" height="820" viewBox="0 0 580 580" fill="none" overflow="visible">
      <g style="transform-origin:290px 290px;animation:spin-cw 32s linear infinite">
        <circle cx="290" cy="290" r="275" stroke="rgba(190,255,1,0.09)" stroke-width="1" stroke-dasharray="8 18"/>
        <circle cx="290" cy="15" r="4" fill="rgba(190,255,1,0.22)"/>
      </g>
      <g style="transform-origin:290px 290px;animation:spin-ccw 22s linear infinite">
        <circle cx="290" cy="290" r="195" stroke="rgba(190,255,1,0.11)" stroke-width="1"/>
        <circle cx="290" cy="95" r="5" fill="rgba(190,255,1,0.28)"/>
      </g>
      <circle cx="290" cy="290" r="5" fill="rgba(190,255,1,0.3)"/>
    </svg>
  </div>
  <svg style="position:absolute;top:28px;right:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M40 10 L40 0 L30 0" stroke="rgba(190,255,1,0.28)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <svg style="position:absolute;bottom:28px;left:28px;pointer-events:none" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M0 30 L0 40 L10 40" stroke="rgba(190,255,1,0.28)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  ${slideHeader('', '01 / 06', true)}
  <div class="a" style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:20px">Kickoff de Projeto</div>
  <div class="display a" style="color:#fff"><span class="acc">${esc(p.nomeProjeto || 'Projeto')}</span></div>
  <div class="a" style="display:flex;align-items:center;gap:16px;margin:20px 0 32px">
    <div style="width:60px;height:1px;background:var(--yb)"></div>
    <div style="font-size:16px;color:rgba(255,255,255,0.45);font-weight:500">${esc(p.nomeCliente || '')}${p.dataInicio ? ` · ${formatDate(p.dataInicio)}` : ''}</div>
  </div>
  ${p.nomeResponsavel ? `<div class="a" style="font-size:14px;color:rgba(255,255,255,0.35);font-weight:500">Responsável: <span style="color:rgba(255,255,255,0.6)">${esc(p.nomeResponsavel)}</span></div>` : ''}
  ${slideFooter(1 / 6)}
</div>`;
}

function slide02(p: KickoffData): string {
  const objetivos = p.objetivos.filter(o => o.texto);
  const liItems = objetivos.map(o => `<li class="a">${esc(o.texto)}</li>`).join('');
  return `
<!-- 02 CONTEXTO -->
<div class="slide">
  ${slideHeader('Contexto', '02 / 06')}
  <div class="title a">Contexto & <span class="acc">Objetivo</span></div>
  <div class="rule a"></div>
  <div class="g2">
    <div>
      <div class="body-text a" style="word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical">${esc(p.contexto || '').replace(/\n/g,'<br>')}</div>
    </div>
    <div>
      ${objetivos.length ? `<div class="eyebrow a">Objetivos</div><ul class="krl a">${liItems}</ul>` : ''}
    </div>
  </div>
  ${slideFooter(2 / 6)}
</div>`;
}

function slide03(p: KickoffData): string {
  const incluidos = p.incluidos.filter(i => i.texto);
  const excluidos = p.excluidos.filter(i => i.texto);
  const incItems = incluidos.map(i => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(190,255,1,0.06);border:1px solid rgba(190,255,1,0.15);border-radius:8px;margin-bottom:8px">
      <div style="width:5px;height:5px;border-radius:50%;background:var(--yellow);margin-top:7px;flex-shrink:0"></div>
      <span style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.55">${esc(i.texto)}</span>
    </div>`).join('');
  const excItems = excluidos.map(i => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px">
      <div style="width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.25);margin-top:7px;flex-shrink:0"></div>
      <span style="font-size:14px;color:rgba(255,255,255,0.45);line-height:1.55">${esc(i.texto)}</span>
    </div>`).join('');
  return `
<!-- 03 ESCOPO -->
<div class="slide" style="background:#111312">
  ${slideHeader('Escopo', '03 / 06', true)}
  <div class="title a" style="color:#fff">O que está <span class="acc">no escopo</span></div>
  <div class="rule a"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="a">
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--yellow);margin-bottom:14px">INCLUÍDO</div>
      ${incItems}
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:14px">FORA DO ESCOPO</div>
      ${excItems}
    </div>
  </div>
  ${slideFooter(3 / 6)}
</div>`;
}

function slide04(p: KickoffData): string {
  const equipe = p.equipe.filter(m => m.nome);
  const cols = equipe.length <= 2 ? equipe.length : equipe.length <= 3 ? 3 : 4;
  const cards = equipe.map(m => `
    <div class="card ct">
      <div class="card-title">${esc(m.nome)}</div>
      ${m.papel ? `<div style="font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px">${esc(m.papel)}</div>` : ''}
      ${m.email ? `<div class="card-body">${esc(m.email)}</div>` : ''}
    </div>`).join('');
  return `
<!-- 04 EQUIPE -->
<div class="slide sw">
  ${slideHeader('Equipe', '04 / 06')}
  <div class="title a">Nossa <span class="acc">equipe</span></div>
  <div class="rule a"></div>
  ${equipe.length ? `<div class="a" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;margin-top:4px">${cards}</div>` : ''}
  ${slideFooter(4 / 6)}
</div>`;
}

function slide05(p: KickoffData): string {
  const fases = p.fases.filter((f: Fase) => f.nome && f.semanas > 0);
  return `
<!-- 05 CRONOGRAMA -->
<div class="slide sw">
  ${slideHeader('Cronograma', '05 / 06')}
  <div class="title a">Cronograma do <span class="acc">projeto</span></div>
  <div class="rule a"></div>
  <div class="a" style="width:100%;overflow:hidden">
    ${buildGantt(fases, false)}
  </div>
  ${slideFooter(5 / 6)}
</div>`;
}

function slide06(p: KickoffData): string {
  const passos = p.proximosPassos.filter(pp => pp.texto);
  const mrRows = passos.map((pp, i) => `
    <div class="mr a">
      <div class="md">${String(i + 1).padStart(2, '0')}</div>
      <div class="mt">${esc(pp.texto)}</div>
    </div>`).join('');
  const tickerText = `${esc(p.nomeProjeto || 'Projeto')} · ${esc(p.nomeCliente || 'Cliente')} · KICKOFF`.toUpperCase();
  return `
<!-- 06 PRÓXIMOS PASSOS -->
<div class="slide" style="background:var(--black2);text-align:center;align-items:center">
  ${slideHeader('', '06 / 06', true)}
  <div class="display a" style="color:#fff;text-align:center">Próximos <span class="acc">passos</span></div>
  <div style="width:60px;height:2px;background:var(--yellow);margin:24px auto;border-radius:1px" class="a"></div>
  ${passos.length ? `<div class="a" style="width:100%;max-width:560px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px 28px;margin:0 auto 24px">${mrRows}</div>` : ''}
  ${p.canaisComunicacao ? `<div class="a" style="font-size:13px;color:rgba(255,255,255,0.3);max-width:520px;text-align:center;line-height:1.6">${esc(p.canaisComunicacao)}</div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(6 / 6)}
</div>`;
}

export function generateKickoffHtml(p: KickoffData, hiddenSlides: number[] = []): string {
  const allSlides = [slide01(p),slide02(p),slide03(p),slide04(p),slide05(p),slide06(p)];
  const visibleSlides = allSlides.filter((_, i) => !hiddenSlides.includes(i));
  const totalSlides = visibleSlides.length;
  const slides = visibleSlides.join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kickoff — ${esc(p.nomeProjeto || 'Projeto')}</title>
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
