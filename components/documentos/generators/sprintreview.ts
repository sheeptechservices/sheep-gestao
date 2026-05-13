import { CSS, esc, slideHeader, slideFooter, ticker } from './slideBase';
import type { SprintReviewData, EntregaSprint } from '@/components/documentos/types/sprintreview';

function slide01(p: SprintReviewData): string {
  const tickerText = `${esc(p.nomeProjeto || 'Projeto')} · SPRINT REVIEW`.toUpperCase();
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
  ${slideHeader('', '01 / 05', true)}
  <div class="a" style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:20px">Sprint Review</div>
  <div class="display a" style="color:#fff">Sprint <span class="acc">#${esc(p.sprintNumero || '1')}</span></div>
  <div class="a" style="display:flex;align-items:center;gap:16px;margin:20px 0 32px">
    <div style="width:60px;height:1px;background:var(--yb)"></div>
    <div style="font-size:16px;color:rgba(255,255,255,0.45);font-weight:500">${esc(p.nomeProjeto || '')}${p.periodo ? ` · ${esc(p.periodo)}` : ''}</div>
  </div>
  ${p.timeNome ? `<div class="a" style="font-size:14px;color:rgba(255,255,255,0.35)">Time: <span style="color:rgba(255,255,255,0.6)">${esc(p.timeNome)}</span></div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(1 / 5)}
</div>`;
}

function slide02(p: SprintReviewData): string {
  const badgeColor = p.metaAtingida ? '#22c55e' : '#f59e0b';
  const badgeText = p.metaAtingida ? '✅ Meta Atingida' : '⚠️ Meta Parcial';
  const badgeBg = p.metaAtingida ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
  const badgeBorder = p.metaAtingida ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)';
  return `
<!-- 02 SPRINT GOAL -->
<div class="slide sw">
  ${slideHeader('Sprint Goal', '02 / 05')}
  <div class="title a">Sprint <span class="acc">Goal</span></div>
  <div class="rule a"></div>
  <div class="a" style="font-size:24px;font-weight:700;color:var(--black);margin-bottom:20px;line-height:1.3;max-width:680px">${esc(p.meta || '')}</div>
  <div class="a" style="display:inline-block;padding:8px 18px;border-radius:100px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:13px;font-weight:700;margin-bottom:24px">${badgeText}</div>
  ${p.resultado ? `<div class="body-text a" style="max-width:none;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical">${esc(p.resultado).replace(/\n/g,'<br>')}</div>` : ''}
  ${slideFooter(2 / 5)}
</div>`;
}

function slide03(p: SprintReviewData): string {
  const entregas = p.entregas.filter(e => e.titulo);
  const rows = entregas.map((e: EntregaSprint) => {
    let badgeBg = '#22c55e';
    let badgeText = '✓ Done';
    let badgeColor = '#fff';
    if (e.status === 'partial') { badgeBg = 'var(--yellow)'; badgeText = '~ Parcial'; badgeColor = 'var(--black)'; }
    if (e.status === 'blocked') { badgeBg = '#ef4444'; badgeText = '✗ Bloqueado'; badgeColor = '#fff'; }
    return `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:8px" class="a">
      <div style="flex-shrink:0;padding:4px 12px;border-radius:100px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:800;white-space:nowrap">${badgeText}</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.8);font-weight:500">${esc(e.titulo)}</div>
    </div>`;
  }).join('');
  return `
<!-- 03 ENTREGAS -->
<div class="slide" style="background:#111312">
  ${slideHeader('Entregas', '03 / 05', true)}
  <div class="title a" style="color:#fff">O que foi <span class="acc">entregue</span></div>
  <div class="rule a"></div>
  ${entregas.length ? `<div>${rows}</div>` : ''}
  ${slideFooter(3 / 5)}
</div>`;
}

function slide04(p: SprintReviewData): string {
  const metrics = [
    { val: p.velocidade || '–', label: 'Story Points' },
    { val: p.bugsResolvidos || '–', label: 'Bugs Resolvidos' },
    { val: p.cobertura || '–', label: 'Cobertura de Testes' },
  ];
  const cards = metrics.map(m => `
    <div style="background:var(--white);border:1px solid var(--gray3);border-radius:16px;padding:28px 24px;text-align:center;border-top:2px solid var(--yellow)">
      <div style="font-size:52px;font-weight:800;color:var(--yellow);line-height:1;margin-bottom:10px">${esc(m.val)}</div>
      <div style="font-size:13px;color:var(--gray);letter-spacing:.04em">${esc(m.label)}</div>
    </div>`).join('');
  const impedimentos = p.impedimentos.filter(i => i.texto);
  const liItems = impedimentos.map(i => `<li class="a">${esc(i.texto)}</li>`).join('');
  return `
<!-- 04 MÉTRICAS -->
<div class="slide sw">
  ${slideHeader('Métricas', '04 / 05')}
  <div class="title a">Métricas do <span class="acc">Sprint</span></div>
  <div class="rule a"></div>
  <div class="g3 a">${cards}</div>
  ${impedimentos.length ? `
  <div style="margin-top:32px" class="a">
    <div class="eyebrow">Impedimentos encontrados</div>
    <ul class="krl">${liItems}</ul>
  </div>` : ''}
  ${slideFooter(4 / 5)}
</div>`;
}

function slide05(p: SprintReviewData): string {
  const itens = p.proximosItens.filter(i => i.texto);
  const mrRows = itens.map((i, idx) => `
    <div class="mr a">
      <div class="md">${String(idx + 1).padStart(2, '0')}</div>
      <div class="mt">${esc(i.texto)}</div>
    </div>`).join('');
  const tickerText = `${esc(p.nomeProjeto || 'Projeto')} · SPRINT ${esc(p.sprintNumero || '1')} · REVIEW`.toUpperCase();
  return `
<!-- 05 PRÓXIMO SPRINT -->
<div class="slide" style="background:var(--black2);text-align:center;align-items:center">
  ${slideHeader('', '05 / 05', true)}
  <div class="display a" style="color:#fff;text-align:center">Próximo <span class="acc">Sprint</span></div>
  <div style="width:60px;height:2px;background:var(--yellow);margin:24px auto;border-radius:1px" class="a"></div>
  ${p.proximaMeta ? `<div class="a" style="font-size:20px;font-weight:700;color:var(--yellow);text-align:center;max-width:580px;margin:0 auto 24px;line-height:1.4">${esc(p.proximaMeta)}</div>` : ''}
  ${itens.length ? `<div class="a" style="width:100%;max-width:560px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px 28px;margin:0 auto">${mrRows}</div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(5 / 5)}
</div>`;
}

export function generateSprintReviewHtml(p: SprintReviewData, hiddenSlides: number[] = []): string {
  const allSlides = [slide01(p),slide02(p),slide03(p),slide04(p),slide05(p)];
  const visibleSlides = allSlides.filter((_, i) => !hiddenSlides.includes(i));
  const totalSlides = visibleSlides.length;
  const slides = visibleSlides.join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sprint Review #${esc(p.sprintNumero || '1')} — ${esc(p.nomeProjeto || 'Projeto')}</title>
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
<\/script>
</body>
</html>`;
}
