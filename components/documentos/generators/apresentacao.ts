import { CSS, esc, slideHeader, slideFooter, ticker } from './slideBase';
import type { ApresentacaoData } from '@/components/documentos/types/apresentacao';

function slide01(p: ApresentacaoData): string {
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
        <circle cx="565" cy="290" r="3" fill="rgba(190,255,1,0.16)"/>
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
  <div class="display a" style="color:#fff">${esc(p.nomeEmpresa || 'Sheep Tech')}</div>
  <div class="a" style="font-size:20px;font-weight:500;color:rgba(255,255,255,0.55);margin-top:16px;max-width:520px;line-height:1.4">${esc(p.tagline || '')}</div>
  ${p.website ? `<a href="https://${esc(p.website)}" target="_blank" rel="noopener noreferrer" class="a" style="margin-top:20px;color:var(--yellow);font-size:13px;font-weight:700;text-decoration:none;letter-spacing:.06em;opacity:.8">${esc(p.website)}</a>` : ''}
  ${slideFooter(1 / 6)}
</div>`;
}

function slide02(p: ApresentacaoData): string {
  return `
<!-- 02 MISSÃO -->
<div class="slide">
  ${slideHeader('Nossa Missão', '02 / 06')}
  <div class="title a">Quem somos e no que <span class="acc">acreditamos</span></div>
  <div class="rule a"></div>
  <div class="body-text a" style="max-width:none;margin-bottom:32px;word-break:break-word;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical">${esc(p.descricao || '').replace(/\n/g,'<br>')}</div>
  <div class="g2 a">
    <div style="background:var(--white);border:1px solid var(--gray3);border-radius:14px;padding:24px;border-top:2px solid var(--yellow)">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px">MISSÃO</div>
      <div style="font-size:15px;color:var(--gray);line-height:1.65">${esc(p.missao || '')}</div>
    </div>
    <div style="background:var(--white);border:1px solid var(--gray3);border-radius:14px;padding:24px;border-top:2px solid var(--yellow)">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px">VISÃO</div>
      <div style="font-size:15px;color:var(--gray);line-height:1.65">${esc(p.visao || '')}</div>
    </div>
  </div>
  ${slideFooter(2 / 6)}
</div>`;
}

function slide03(p: ApresentacaoData): string {
  const stats = [
    { val: p.anoFundacao || '–', label: 'Ano de Fundação' },
    { val: p.numProjetos || '–', label: 'Projetos Entregues' },
    { val: p.numClientes || '–', label: 'Clientes Ativos' },
    { val: p.numProfissionais || '–', label: 'Profissionais' },
  ];
  const cards = stats.map(st => `
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;text-align:center">
      <div style="font-size:56px;font-weight:800;color:var(--yellow);line-height:1;margin-bottom:10px">${esc(st.val)}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:.04em">${esc(st.label)}</div>
    </div>`).join('');
  return `
<!-- 03 NÚMEROS -->
<div class="slide" style="background:var(--black2)">
  ${slideHeader('Nossos Números', '03 / 06', true)}
  <div class="title a" style="color:#fff">Números que <span class="acc">falam por nós</span></div>
  <div class="rule a"></div>
  <div class="g4 a">${cards}</div>
  ${slideFooter(3 / 6)}
</div>`;
}

function slide04(p: ApresentacaoData): string {
  const servicos = p.servicos.filter(sv => sv.titulo);
  const cols = servicos.length <= 2 ? servicos.length : servicos.length <= 4 ? 2 : 3;
  const cards = servicos.map(sv => `
    <div class="card" style="border-top:2px solid var(--yellow);padding:24px">
      ${sv.icone ? `<div class="sol-icon">${esc(sv.icone)}</div>` : ''}
      <div class="card-title">${esc(sv.titulo)}</div>
      <div class="card-body">${esc(sv.descricao)}</div>
    </div>`).join('');
  return `
<!-- 04 SERVIÇOS -->
<div class="slide sw">
  ${slideHeader('Nossos Serviços', '04 / 06')}
  <div class="title a">O que a <span class="acc">Sheep Tech</span> faz</div>
  <div class="rule a"></div>
  ${servicos.length ? `<div class="a" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;margin-top:4px">${cards}</div>` : ''}
  ${slideFooter(4 / 6)}
</div>`;
}

function slide05(p: ApresentacaoData): string {
  const clientes = p.clientes.filter(c => c.nome || c.logo);
  const cols = clientes.length <= 3 ? clientes.length : clientes.length <= 6 ? 3 : clientes.length <= 8 ? 4 : 5;
  const cards = clientes.map(c => `
    <div style="background:#fff;border:1px solid var(--gray3);border-radius:14px;padding:20px 24px;display:flex;align-items:center;justify-content:center;aspect-ratio:2/1;transition:border-color .2s,transform .2s,box-shadow .2s" onmouseenter="this.style.borderColor='var(--yellow)';this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseleave="this.style.borderColor='var(--gray3)';this.style.transform='';this.style.boxShadow=''">
      ${c.logo ? `<img src="${c.logo}" alt="${esc(c.nome)}" style="max-width:100%;max-height:64px;object-fit:contain"/>` : `<span style="font-size:15px;font-weight:700;color:var(--black);letter-spacing:-.01em;text-align:center">${esc(c.nome)}</span>`}
    </div>`).join('');
  return `
<!-- 05 CLIENTES -->
<div class="slide sw">
  ${slideHeader('Nossos Clientes', '05 / 06')}
  <div class="title a">Empresas que confiam <span class="acc">em nós</span></div>
  <div class="rule a"></div>
  ${clientes.length ? `<div class="a" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;margin-top:4px">${cards}</div>` : ''}
  ${slideFooter(5 / 6)}
</div>`;
}

function slide06(p: ApresentacaoData): string {
  const contactLine = [p.emailContato, p.telefoneContato].filter(Boolean).join('  ·  ');
  const tickerText = `${esc(p.nomeEmpresa || 'Sheep Tech')} · APRESENTAÇÃO INSTITUCIONAL`.toUpperCase();
  return `
<!-- 06 CONTATO -->
<div class="slide" style="background:var(--black2);text-align:center;align-items:center">
  ${slideHeader(p.nomeEmpresa || 'Sheep Tech', '06 / 06', true)}
  <div class="display a" style="color:#fff;text-align:center">Vamos<br>conversar <span class="acc">?</span></div>
  <div style="width:60px;height:2px;background:var(--yellow);margin:24px auto;border-radius:1px" class="a"></div>
  ${p.nomeContato ? `
  <div class="body-text a" style="color:rgba(255,255,255,0.5);text-align:center;margin:0 auto">
    <strong style="color:rgba(255,255,255,0.8)">${esc(p.nomeContato)}</strong>${contactLine ? `<br>${esc(contactLine)}` : ''}
    ${p.website ? `<br><a href="https://${esc(p.website)}" target="_blank" rel="noopener noreferrer" style="color:var(--yellow);font-size:13px;font-weight:600;text-decoration:none">${esc(p.website)}</a>` : ''}
  </div>` : ''}
  ${ticker(tickerText, true)}
  ${slideFooter(6 / 6)}
</div>`;
}

export function generateApresentacaoHtml(p: ApresentacaoData, hiddenSlides: number[] = []): string {
  const allSlides = [slide01(p),slide02(p),slide03(p),slide04(p),slide05(p),slide06(p)];
  const visibleSlides = allSlides.filter((_, i) => !hiddenSlides.includes(i));
  const totalSlides = visibleSlides.length;
  const slides = visibleSlides.join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.nomeEmpresa || 'Apresentação')} — Sheep Tech</title>
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
