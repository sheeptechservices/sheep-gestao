import type { ContratoData } from '@/components/documentos/types/contrato'

function esc(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(s: string) {
  if (!s) return '___/___/______'
  const [y, m, d] = s.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatBRLExt(v: number) {
  // Simple number-to-words for BRL amounts (handles common cases)
  const units = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove']
  const tens  = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const hundreds = ['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']
  if (v <= 0) return 'zero reais'
  const intPart = Math.floor(v)
  const cents   = Math.round((v - intPart) * 100)
  function toWords(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'
    if (n < 20) return units[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? ' e ' + units[n % 10] : '')
    const h = Math.floor(n / 100)
    const rest = n % 100
    return hundreds[h] + (rest ? ' e ' + toWords(rest) : '')
  }
  function toWordsLarge(n: number): string {
    if (n === 0) return ''
    if (n < 1000) return toWords(n)
    if (n < 1000000) {
      const k = Math.floor(n / 1000)
      const rest = n % 1000
      return (k === 1 ? 'mil' : toWords(k) + ' mil') + (rest ? ' e ' + toWords(rest) : '')
    }
    const m = Math.floor(n / 1000000)
    const rest = n % 1000000
    return toWords(m) + (m === 1 ? ' milhão' : ' milhões') + (rest ? ' e ' + toWordsLarge(rest) : '')
  }
  const reais = toWordsLarge(intPart)
  const centsWords = cents > 0 ? toWords(cents) : ''
  let result = reais ? reais + (intPart === 1 ? ' real' : ' reais') : ''
  if (centsWords) result += (result ? ' e ' : '') + centsWords + (cents === 1 ? ' centavo' : ' centavos')
  return result || 'zero reais'
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --green:#1E8A3E;--green-light:rgba(30,138,62,0.08);--green-mid:rgba(30,138,62,0.25);
  --black:#121316;--gray:#555;--gray2:#888;--gray3:#E3E4E8;--bg:#F7F7F5;--white:#FFFFFF;
}
html,body{height:100%;font-family:'Manrope',sans-serif;background:var(--bg);color:var(--black);overflow:hidden}
.deck{width:100vw;height:100vh;position:relative}
.slide{
  position:absolute;inset:0;display:flex;flex-direction:column;
  opacity:0;pointer-events:none;transition:opacity .35s ease;
  background:var(--bg);overflow:hidden;
}
.slide.active{opacity:1;pointer-events:all}

/* === Page shell === */
.page{
  flex:1;display:flex;flex-direction:column;
  padding:0 clamp(40px,6vw,88px);
  overflow:hidden;
}
.page-inner{
  flex:1;background:var(--white);
  border:1px solid var(--gray3);
  border-radius:clamp(10px,1.1vw,16px);
  padding:clamp(28px,3.6vw,52px) clamp(32px,4.2vw,60px);
  display:flex;flex-direction:column;gap:clamp(16px,2.2vh,28px);
  overflow:hidden;
  box-shadow:0 2px 16px rgba(0,0,0,0.05);
}

/* === Top bar === */
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:clamp(14px,1.8vh,22px) clamp(40px,6vw,88px);
  border-bottom:1px solid var(--gray3);
  background:var(--white);
  flex-shrink:0;
}
.brand{display:flex;align-items:center;gap:8px}
.brand-dot{width:10px;height:10px;border-radius:50%;background:var(--green)}
.brand-name{font-size:clamp(11px,1vw,14px);font-weight:800;letter-spacing:.04em;color:var(--black)}
.doc-tag{font-size:clamp(9px,0.76vw,11px);font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gray2)}

/* === Progress bar === */
.prog-wrap{height:3px;background:var(--gray3);flex-shrink:0}
.prog-fill{height:100%;background:var(--green);transition:width .35s ease}

/* === Typography === */
.contract-title{
  font-size:clamp(13px,1.45vw,20px);font-weight:800;color:var(--black);
  letter-spacing:-.01em;line-height:1.2;
}
.clause-label{
  font-size:clamp(8px,0.7vw,10px);font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;
  color:var(--green);margin-bottom:clamp(4px,0.5vh,7px);
}
.clause-text{
  font-size:clamp(9px,0.97vw,13px);color:var(--gray);line-height:1.75;
}
.clause-bold{font-weight:700;color:var(--black)}

/* === Party cards === */
.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,1.2vw,18px)}
.party-card{
  background:var(--bg);border:1px solid var(--gray3);border-radius:clamp(8px,0.8vw,12px);
  padding:clamp(12px,1.4vw,20px);display:flex;flex-direction:column;gap:clamp(6px,0.7vh,10px);
}
.party-role{
  font-size:clamp(7px,0.65vw,9px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  color:var(--green);
}
.party-name{font-size:clamp(11px,1.2vw,16px);font-weight:800;color:var(--black);line-height:1.2}
.party-detail{font-size:clamp(8px,0.8vw,11px);color:var(--gray);line-height:1.6}

/* === Scope list === */
.scope-list{display:flex;flex-direction:column;gap:clamp(5px,0.6vh,8px)}
.scope-item{
  display:flex;align-items:flex-start;gap:clamp(8px,0.8vw,12px);
  padding:clamp(7px,0.8vh,11px) clamp(10px,1vw,14px);
  background:var(--bg);border:1px solid var(--gray3);border-radius:clamp(6px,0.6vw,9px);
  font-size:clamp(9px,0.9vw,12px);color:var(--gray);line-height:1.5;
}
.scope-bullet{
  width:clamp(5px,0.5vw,7px);height:clamp(5px,0.5vw,7px);border-radius:50%;
  background:var(--green);margin-top:clamp(4px,0.5vh,6px);flex-shrink:0;
}

/* === Value table === */
.val-table{display:flex;flex-direction:column;gap:0;border:1px solid var(--gray3);border-radius:clamp(8px,0.8vw,12px);overflow:hidden}
.val-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:clamp(8px,0.9vh,12px) clamp(14px,1.5vw,20px);
  border-bottom:1px solid var(--gray3);
  font-size:clamp(9px,0.9vw,13px);
}
.val-row:last-child{border-bottom:none}
.val-desc{color:var(--gray)}
.val-amt{font-weight:700;color:var(--black);white-space:nowrap}
.val-total{
  background:var(--green-light);border-top:2px solid var(--green-mid);
}
.val-total .val-desc{font-weight:800;color:var(--black);font-size:clamp(10px,1vw,14px)}
.val-total .val-amt{color:var(--green);font-size:clamp(11px,1.1vw,16px);font-weight:800}

/* === Timeline === */
.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(8px,1vw,14px)}
.tl-card{
  background:var(--bg);border:1px solid var(--gray3);border-radius:clamp(8px,0.8vw,12px);
  padding:clamp(10px,1.2vw,16px);border-top:3px solid var(--green);
}
.tl-label{font-size:clamp(7px,0.65vw,9px);font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--green);margin-bottom:4px}
.tl-date{font-size:clamp(10px,1vw,14px);font-weight:700;color:var(--black)}

/* === Signature === */
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,3vw,48px);margin-top:auto}
.sig-block{display:flex;flex-direction:column;gap:clamp(6px,0.8vh,10px)}
.sig-line{height:1px;background:var(--black);margin-bottom:clamp(4px,0.5vh,7px)}
.sig-name{font-size:clamp(10px,1vw,13px);font-weight:700;color:var(--black)}
.sig-role{font-size:clamp(8px,0.75vw,10px);color:var(--gray)}

/* === Animations === */
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.slide.active .a{animation:up .4s ease forwards;opacity:0}
.slide.active .a:nth-child(1){animation-delay:.04s}
.slide.active .a:nth-child(2){animation-delay:.1s}
.slide.active .a:nth-child(3){animation-delay:.16s}
.slide.active .a:nth-child(4){animation-delay:.22s}
.slide.active .a:nth-child(5){animation-delay:.28s}
`

const JS = `
const slides = document.querySelectorAll('.slide');
const fills  = document.querySelectorAll('.prog-fill');
const n = slides.length;
let cur = 0;
function go(i){
  if(i<0||i>=n) return;
  slides[cur].classList.remove('active');
  cur=i;
  slides[cur].classList.add('active');
  fills.forEach(f=>f.style.width=((cur+1)/n*100)+'%');
}
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' ') go(cur+1);
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') go(cur-1);
});
document.addEventListener('click',e=>{ if(!e.target.closest('a')) go(cur+1) });
window.addEventListener('message',e=>{ if(typeof e.data?.goSlide==='number') go(e.data.goSlide) });
go(0);
`

function topbar(title: string) {
  return `
  <div class="topbar">
    <div class="brand">
      <div class="brand-dot"></div>
      <span class="brand-name">Sheep Technology</span>
    </div>
    <span class="doc-tag">${esc(title)}</span>
  </div>
  <div class="prog-wrap"><div class="prog-fill"></div></div>`
}

export function generateContratoHtml(d: ContratoData): string {
  const totalValor = (d.itensValor || []).reduce((acc, i) => acc + (Number(i.valor) || 0), 0)
  const totalExt   = formatBRLExt(totalValor)
  const docTitle   = d.tituloContrato
    ? `Contrato — ${esc(d.tituloContrato)}`
    : 'Contrato de Prestação de Serviços'

  // ── Slide 1: Capa / Partes ──────────────────────────────────────────────────
  const slide1 = `
  <div class="slide active">
    ${topbar(docTitle)}
    <div class="page" style="padding-top:clamp(16px,2vh,24px);padding-bottom:clamp(16px,2vh,24px)">
      <div class="page-inner">
        <div class="a" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="clause-label">Contrato de Prestação de Serviços</div>
            <div class="contract-title">${esc(d.tituloContrato || 'Contrato de Prestação de Serviços')}</div>
          </div>
          <div style="font-size:clamp(9px,0.85vw,12px);color:var(--gray2);text-align:right;line-height:1.7">
            <div>Data: <strong style="color:var(--black)">${formatDate(d.dataAssinatura)}</strong></div>
          </div>
        </div>

        <div class="a" style="height:1px;background:var(--gray3)"></div>

        <div class="a">
          <div class="clause-label">Partes contratantes</div>
          <div class="party-grid">
            <div class="party-card">
              <div class="party-role">Contratante</div>
              <div class="party-name">${esc(d.nomeCliente || '___________________________')}</div>
              <div class="party-detail">
                ${d.cnpjCliente ? `CNPJ: ${esc(d.cnpjCliente)}<br>` : ''}
                ${d.enderecoCliente ? `${esc(d.enderecoCliente)}<br>` : ''}
                ${d.representanteCliente ? `Repr.: ${esc(d.representanteCliente)}${d.cargoRepresentanteCliente ? ` — ${esc(d.cargoRepresentanteCliente)}` : ''}` : ''}
              </div>
            </div>
            <div class="party-card" style="border-color:var(--green-mid);border-top:2px solid var(--green)">
              <div class="party-role">Contratada</div>
              <div class="party-name">${esc(d.nomeContratada || 'Sheep Technology')}</div>
              <div class="party-detail">
                ${d.cnpjContratada ? `CNPJ: ${esc(d.cnpjContratada)}<br>` : ''}
                ${d.enderecoContratada ? `${esc(d.enderecoContratada)}<br>` : ''}
                ${d.representanteContratada ? `Repr.: ${esc(d.representanteContratada)}` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="a">
          <div class="clause-text">
            As partes acima identificadas celebram o presente Contrato de Prestação de Serviços,
            que se regerá pelas cláusulas e condições a seguir estipuladas.
          </div>
        </div>
      </div>
    </div>
  </div>`

  // ── Slide 2: Objeto ─────────────────────────────────────────────────────────
  const escopoRows = (d.escopoItens || []).map(i =>
    `<div class="scope-item"><div class="scope-bullet"></div><span>${esc(i.texto)}</span></div>`
  ).join('')

  const slide2 = `
  <div class="slide">
    ${topbar(docTitle)}
    <div class="page" style="padding-top:clamp(16px,2vh,24px);padding-bottom:clamp(16px,2vh,24px)">
      <div class="page-inner">
        <div class="a">
          <div class="clause-label">Cláusula 1</div>
          <div class="contract-title">Do Objeto</div>
        </div>
        <div class="a">
          <div class="clause-text">
            <strong class="clause-bold">1.1</strong> O presente contrato tem como objeto a prestação de serviços de
            <strong class="clause-bold">${esc(d.tituloContrato || 'desenvolvimento de software')}</strong>
            pela Contratada à Contratante, conforme detalhado a seguir:
          </div>
        </div>
        ${d.descricaoObjeto ? `
        <div class="a">
          <div class="clause-text" style="padding:clamp(10px,1.1vw,16px);background:var(--bg);border-radius:8px;border-left:3px solid var(--green)">
            ${esc(d.descricaoObjeto)}
          </div>
        </div>` : ''}
        ${escopoRows ? `
        <div class="a">
          <div class="clause-label" style="margin-bottom:clamp(6px,0.7vh,10px)">1.2 — Escopo de serviços</div>
          <div class="scope-list">${escopoRows}</div>
        </div>` : ''}
        <div class="a">
          <div class="clause-text">
            <strong class="clause-bold">1.3</strong> Quaisquer serviços adicionais não previstos no escopo acima
            deverão ser formalizados por meio de aditivo contratual.
          </div>
        </div>
      </div>
    </div>
  </div>`

  // ── Slide 3: Valores ────────────────────────────────────────────────────────
  const valorRows = (d.itensValor || []).map(i => `
    <div class="val-row">
      <span class="val-desc">${esc(i.descricao || '—')}</span>
      <span class="val-amt">${formatBRL(Number(i.valor) || 0)}</span>
    </div>`
  ).join('')

  const slide3 = `
  <div class="slide">
    ${topbar(docTitle)}
    <div class="page" style="padding-top:clamp(16px,2vh,24px);padding-bottom:clamp(16px,2vh,24px)">
      <div class="page-inner">
        <div class="a">
          <div class="clause-label">Cláusula 2</div>
          <div class="contract-title">Do Valor e Forma de Pagamento</div>
        </div>
        <div class="a">
          <div class="clause-text">
            <strong class="clause-bold">2.1</strong> Pelos serviços prestados, a Contratante pagará à Contratada
            o valor total de <strong class="clause-bold">${formatBRL(totalValor)}</strong>
            ${totalExt ? `<span style="color:var(--gray2)">(${totalExt})</span>` : ''}.
          </div>
        </div>
        ${valorRows ? `
        <div class="a">
          <div class="clause-label" style="margin-bottom:clamp(6px,0.7vh,10px)">2.2 — Composição do valor</div>
          <div class="val-table">
            ${valorRows}
            <div class="val-row val-total">
              <span class="val-desc">Total</span>
              <span class="val-amt">${formatBRL(totalValor)}</span>
            </div>
          </div>
        </div>` : ''}
        ${d.formaPagamento ? `
        <div class="a">
          <div class="clause-label" style="margin-bottom:clamp(6px,0.7vh,10px)">2.3 — Forma de pagamento</div>
          <div class="clause-text" style="padding:clamp(10px,1.1vw,16px);background:var(--bg);border-radius:8px;border-left:3px solid var(--green)">
            ${esc(d.formaPagamento)}
          </div>
        </div>` : ''}
        <div class="a">
          <div class="clause-text">
            <strong class="clause-bold">2.4</strong> O não pagamento nas datas acordadas sujeitará a Contratante
            a multa de 2% sobre o valor em atraso, acrescida de juros de 1% ao mês.
          </div>
        </div>
      </div>
    </div>
  </div>`

  // ── Slide 4: Prazos + Condições ─────────────────────────────────────────────
  const slide4 = `
  <div class="slide">
    ${topbar(docTitle)}
    <div class="page" style="padding-top:clamp(16px,2vh,24px);padding-bottom:clamp(16px,2vh,24px)">
      <div class="page-inner">
        <div class="a">
          <div class="clause-label">Cláusula 3</div>
          <div class="contract-title">Dos Prazos</div>
        </div>
        <div class="a">
          <div class="timeline">
            <div class="tl-card">
              <div class="tl-label">Assinatura</div>
              <div class="tl-date">${formatDate(d.dataAssinatura)}</div>
            </div>
            <div class="tl-card">
              <div class="tl-label">Início dos serviços</div>
              <div class="tl-date">${formatDate(d.dataInicio)}</div>
            </div>
            <div class="tl-card">
              <div class="tl-label">Entrega final</div>
              <div class="tl-date">${formatDate(d.dataTermino)}</div>
            </div>
          </div>
        </div>
        <div class="a">
          <div class="clause-text">
            <strong class="clause-bold">3.1</strong> Os serviços terão início em <strong class="clause-bold">${formatDate(d.dataInicio)}</strong>
            e deverão ser concluídos até <strong class="clause-bold">${formatDate(d.dataTermino)}</strong>,
            salvo atrasos decorrentes de caso fortuito, força maior ou solicitações de alteração pela Contratante.
          </div>
        </div>
        <div class="a" style="height:1px;background:var(--gray3)"></div>
        <div class="a">
          <div class="clause-label">Cláusula 4 — Confidencialidade</div>
          <div class="clause-text">
            <strong class="clause-bold">4.1</strong> As partes comprometem-se a manter sigilo sobre todas as informações
            trocadas no âmbito deste contrato, pelo prazo de <strong class="clause-bold">5 (cinco) anos</strong> após
            o término da vigência, sob pena das sanções legais cabíveis.
          </div>
        </div>
        ${d.condicoesEspeciais ? `
        <div class="a">
          <div class="clause-label">Cláusula 5 — Condições especiais</div>
          <div class="clause-text" style="padding:clamp(10px,1.1vw,16px);background:var(--bg);border-radius:8px;border-left:3px solid var(--green)">
            ${esc(d.condicoesEspeciais)}
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>`

  // ── Slide 5: Assinaturas ────────────────────────────────────────────────────
  const slide5 = `
  <div class="slide">
    ${topbar(docTitle)}
    <div class="page" style="padding-top:clamp(16px,2vh,24px);padding-bottom:clamp(16px,2vh,24px)">
      <div class="page-inner">
        <div class="a">
          <div class="clause-label">Cláusula ${d.condicoesEspeciais ? '6' : '5'} — Do Foro</div>
          <div class="clause-text">
            Fica eleito o foro da comarca de <strong class="clause-bold">São Paulo/SP</strong> para dirimir
            quaisquer controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro,
            por mais privilegiado que seja.
          </div>
        </div>
        <div class="a">
          <div class="clause-text">
            E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em
            2 (duas) vias de igual teor, na presença de 2 (duas) testemunhas.
          </div>
        </div>
        <div class="a" style="text-align:center;font-size:clamp(9px,0.85vw,12px);color:var(--gray2)">
          São Paulo, ${formatDate(d.dataAssinatura)}
        </div>
        <div class="a sig-grid">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">${esc(d.representanteCliente || '___________________________')}</div>
            <div class="sig-role">${esc(d.cargoRepresentanteCliente || 'Representante Legal')}</div>
            <div class="sig-role" style="font-weight:700;color:var(--black)">${esc(d.nomeCliente || 'Contratante')}</div>
            ${d.cnpjCliente ? `<div class="sig-role">CNPJ: ${esc(d.cnpjCliente)}</div>` : ''}
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">${esc(d.representanteContratada || 'Guilherme Zaidan')}</div>
            <div class="sig-role">Representante Legal</div>
            <div class="sig-role" style="font-weight:700;color:var(--black)">${esc(d.nomeContratada || 'Sheep Technology')}</div>
            ${d.cnpjContratada ? `<div class="sig-role">CNPJ: ${esc(d.cnpjContratada)}</div>` : ''}
          </div>
        </div>
        <div class="a" style="display:grid;grid-template-columns:1fr 1fr;gap:clamp(20px,3vw,48px);margin-top:auto">
          <div class="sig-block">
            <div class="sig-line" style="border-top:1px dashed var(--gray3)"></div>
            <div class="sig-role">Testemunha 1</div>
          </div>
          <div class="sig-block">
            <div class="sig-line" style="border-top:1px dashed var(--gray3)"></div>
            <div class="sig-role">Testemunha 2</div>
          </div>
        </div>
      </div>
    </div>
  </div>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${docTitle}</title>
<style>${CSS}</style>
</head>
<body>
<div class="deck">
  ${slide1}
  ${slide2}
  ${slide3}
  ${slide4}
  ${slide5}
</div>
<script>${JS}</script>
</body>
</html>`
}
