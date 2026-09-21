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
    document.getElementById("count-" + unit).textContent = String(values[index]).padStart(2, "0");
  });
  if (seconds === 0) {
    document.getElementById("countdown-eyebrow").textContent = "O NOSSO PARA SEMPRE";
    document.getElementById("countdown-heading").textContent = "Chegou o dia do nosso sim.";
  }
}
updateCountdown();
setInterval(updateCountdown, 1000);

// A seleção é uma lista de favoritos local, sem pagamento ou envio aos noivos.
const PRESENTES_EMOCIONAIS = [
  { id: 1, nome: "Brinde dos noivos", desc: "Uma taça especial para o primeiro brinde da festa." },
  { id: 2, nome: "Cota lua de mel", desc: "Um carinho para a nossa primeira viagem de casados." },
  { id: 3, nome: "Jantar romântico", desc: "Um jantar à luz de velas durante a lua de mel." },
  { id: 4, nome: "Sessão de fotos", desc: "Registros dos primeiros dias da nossa vida a dois." },
  { id: 5, nome: "Passeio ao pôr do sol", desc: "Um passeio inesquecível para dois." },
  { id: 6, nome: "Carta para o futuro", desc: "Uma carta para abrir no primeiro aniversário de casamento." },
  { id: 7, nome: "Uma música na festa", desc: "Aquela música que vai fazer a gente dançar." },
  { id: 8, nome: "Plante uma árvore", desc: "Um gesto simbólico que cresce junto com a gente." },
];
const STORAGE_KEY = "presentesEmocionais";
const presenteados = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (Array.isArray(saved)) saved.filter((id) => PRESENTES_EMOCIONAIS.some((gift) => gift.id === id)).forEach((id) => presenteados.add(id));
} catch { /* A navegação deve funcionar mesmo com armazenamento bloqueado. */ }

const giftList = document.getElementById("gift-list");
function updateGiftButton(button, gift) {
  const saved = presenteados.has(gift.id);
  button.textContent = saved ? "Salvo ✓" : "Salvar ideia";
  button.setAttribute("aria-pressed", String(saved));
  button.setAttribute("aria-label", (saved ? "Remover ideia: " : "Salvar ideia: ") + gift.nome);
}
PRESENTES_EMOCIONAIS.forEach((gift) => {
  const item = document.createElement("li");
  item.className = "gift-item";
  item.innerHTML = '<span class="gift-number" aria-hidden="true">' + String(gift.id).padStart(2, "0") + '</span><div class="gift-info"><h4 class="gift-nome"></h4><p class="gift-desc"></p></div><button type="button" class="gift-btn"></button>';
  item.querySelector(".gift-nome").textContent = gift.nome;
  item.querySelector(".gift-desc").textContent = gift.desc;
  const button = item.querySelector("button");
  updateGiftButton(button, gift);
  button.addEventListener("click", () => {
    if (presenteados.has(gift.id)) presenteados.delete(gift.id);
    else presenteados.add(gift.id);
    let persisted = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...presenteados])); }
    catch { persisted = false; }
    updateGiftButton(button, gift);
    document.getElementById("gift-feedback").textContent = persisted
      ? (presenteados.has(gift.id) ? "Ideia salva neste dispositivo: " : "Ideia removida: ") + gift.nome + "."
      : "A seleção ficará disponível apenas enquanto esta página estiver aberta.";
  });
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

