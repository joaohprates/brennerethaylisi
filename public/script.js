// Navegação e ideias de presentes.
const paginas = document.querySelectorAll(".page");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function irPara(nome, { updateHistory = true, focus = true } = {}) {
  const target = document.getElementById("page-" + nome);
  if (!target?.classList.contains("page")) return;
  paginas.forEach((page) => {
    const active = page === target;
    page.classList.toggle("active", active);
    page.hidden = !active;
  });
  document.querySelectorAll(".site-header [data-goto]").forEach((link) => {
    if (link.dataset.goto === nome) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (updateHistory && location.hash !== "#" + nome) history.pushState(null, "", "#" + nome);
  if (focus) {
    target.querySelector("h1, h2")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

document.querySelectorAll("[data-goto]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    irPara(link.dataset.goto);
  });
});
function scrollToSite(behavior = "smooth") {
  document.getElementById("site")?.scrollIntoView({
    behavior: motionPreference.matches ? "instant" : behavior,
    block: "start",
  });
}
document.querySelectorAll("[data-scroll]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const go = () => scrollToSite();
    if (document.getElementById("page-home").hidden) {
      irPara("home", { focus: false });
      requestAnimationFrame(go);
    } else {
      go();
    }
    if (location.hash !== "#site") history.pushState(null, "", "#site");
  });
});
function readRoute(focus = true) {
  const name = location.hash.slice(1);
  if (name === "site") {
    irPara("home", { updateHistory: false, focus: false });
    requestAnimationFrame(() => scrollToSite("instant"));
    return;
  }
  const valid = ["home", "info", "presentes"].includes(name);
  if (name === "app") return;
  if (!valid && name) history.replaceState(null, "", location.pathname + location.search + "#home");
  irPara(valid ? name : "home", { updateHistory: false, focus });
}
window.addEventListener("hashchange", () => readRoute());
readRoute(false);

// 16h de Brasília, mesma data e fuso do arquivo de calendário.
const weddingTime = new Date("2027-02-07T16:00:00-03:00").getTime();
function updateCountdown() {
  const seconds = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
  const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  ["days", "hours", "minutes", "seconds"].forEach((unit, index) => {
    document.querySelectorAll('[data-count="' + unit + '"]').forEach((el) => {
      el.textContent = String(values[index]).padStart(2, "0");
    });
  });
  if (seconds === 0) {
    document.getElementById("countdown-eyebrow").textContent = "O NOSSO PARA SEMPRE";
    document.getElementById("countdown-heading").textContent = "Chegou o dia do nosso sim.";
  }
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Os presentes são pagos por Pix direto aos noivos; o site só gera o QR code e copia a chave.
const PIX_KEY = "brenner.carvalho00@gmail.com";
const PRESENTES_EMOCIONAIS = [
  { id: 1, nome: "1 caixa de piso", desc: "Pra noiva que só anda descalça.", valor: 250 },
  { id: 2, nome: "1 lata de tinta", desc: "Para colorir os ambientes.", valor: 300 },
  { id: 3, nome: "Pedrinhas", desc: "Para o nosso jardim.", valor: 70 },
  { id: 4, nome: "Fechadura", desc: "Para proteger nosso cantinho do amor.", valor: 85 },
  { id: 5, nome: "Mangueira", desc: "Para o noivo lavar a calçada.", valor: 100 },
  { id: 6, nome: "1 saco de cimento", desc: "Para firmar nosso amor.", valor: 80 },
  { id: 7, nome: "Plafon", desc: "Para iluminar, porque a noiva não gosta de ambientes escuros.", valor: 150 },
  { id: 8, nome: "Churrasqueira", desc: "Para receber os amigos.", valor: 400 },
  { id: 9, nome: "Torneira", desc: "Pra deixar nosso lar bem limpinho 🙌🏻", valor: 125 },
  { id: 10, nome: "1 cortina", desc: "Para garantir nossa privacidade (e esconder a bagunça).", valor: 180 },
  { id: 11, nome: "Cerca elétrica", desc: "Para não recebermos mais as visitas indesejadas (que nos furtaram durante a construção kk).", valor: 400 },
  { id: 12, nome: "1 espelho", desc: "Para conferir se estamos prontos para a vida adulta.", valor: 150 },
];
const formatBRL = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const giftFeedback = document.getElementById("gift-feedback");

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* Sem suporte a cópia. */ }
    field.remove();
    return ok;
  }
}
document.getElementById("pix-copy").addEventListener("click", async () => {
  giftFeedback.textContent = (await copyText(PIX_KEY))
    ? "Chave Pix copiada!"
    : "Não foi possível copiar. A chave Pix é: " + PIX_KEY;
});

// BR Code estático do Pix (padrão EMV do Banco Central). Nome e cidade: sem acentos, até 25 e 15 caracteres.
const PIX_NOME = "BRENNER CARVALHO";
const PIX_CIDADE = "MARINGA";
const emv = (id, value) => id + String(value.length).padStart(2, "0") + value;
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function pixPayload(valor) {
  const payload =
    emv("00", "01") +
    emv("26", emv("00", "br.gov.bcb.pix") + emv("01", PIX_KEY)) +
    emv("52", "0000") +
    emv("53", "986") +
    (valor ? emv("54", valor.toFixed(2)) : "") +
    emv("58", "BR") +
    emv("59", PIX_NOME) +
    emv("60", PIX_CIDADE) +
    emv("62", emv("05", "***")) +
    "6304";
  return payload + crc16(payload);
}

const pixDialog = document.getElementById("pix-dialog");
const pixDialogFeedback = document.getElementById("pix-dialog-feedback");
let currentPixCode = "";
function openPix(gift) {
  currentPixCode = pixPayload(gift?.valor);
  document.getElementById("pix-dialog-title").textContent = gift ? gift.nome : "Um carinho para o nosso lar";
  document.getElementById("pix-dialog-valor").textContent = gift ? formatBRL(gift.valor) : "Valor livre";
  const qr = qrcode(0, "M");
  qr.addData(currentPixCode);
  qr.make();
  document.getElementById("pix-qr-code").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: "QR code Pix" });
  pixDialogFeedback.textContent = "";
  pixDialog.showModal();
}
document.getElementById("pix-qr").addEventListener("click", () => openPix());
document.getElementById("pix-close").addEventListener("click", () => pixDialog.close());
pixDialog.addEventListener("click", (event) => { if (event.target === pixDialog) pixDialog.close(); });
document.getElementById("pix-copy-code").addEventListener("click", async () => {
  pixDialogFeedback.textContent = (await copyText(currentPixCode))
    ? "Código copiado! Cole no app do seu banco em Pix copia e cola."
    : "Não foi possível copiar. Use a chave acima.";
});

const giftList = document.getElementById("gift-list");
PRESENTES_EMOCIONAIS.forEach((gift) => {
  const item = document.createElement("li");
  item.className = "gift-item";
  item.innerHTML = '<span class="gift-number" aria-hidden="true">' + String(gift.id).padStart(2, "0") + '</span><div class="gift-info"><h4 class="gift-nome"></h4><p class="gift-desc"></p><p class="gift-valor"></p></div><button type="button" class="gift-btn">Presentear via Pix</button>';
  item.querySelector(".gift-nome").textContent = gift.nome;
  item.querySelector(".gift-desc").textContent = gift.desc;
  item.querySelector(".gift-valor").textContent = formatBRL(gift.valor);
  const button = item.querySelector("button");
  button.setAttribute("aria-label", "Abrir QR code Pix para presentear: " + gift.nome + ", " + formatBRL(gift.valor));
  button.addEventListener("click", () => openPix(gift));
  giftList.appendChild(item);
});
const btnEmocionais = document.getElementById("btn-emocionais");
const listaEmocionais = document.getElementById("lista-emocionais");
btnEmocionais.addEventListener("click", () => {
  const opening = listaEmocionais.hidden;
  listaEmocionais.hidden = !opening;
  btnEmocionais.setAttribute("aria-expanded", String(opening));
  btnEmocionais.querySelector(".opcao-cta").textContent = opening ? "Recolher as ideias ↑" : "Explorar as ideias ↓";
  if (opening) listaEmocionais.scrollIntoView({ behavior: motionPreference.matches ? "instant" : "smooth", block: "start" });
});

