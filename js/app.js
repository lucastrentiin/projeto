import * as S from "./store.js";
import * as D from "./dados.js";
const { verificaInteracoes, paresDaLista, interacoesDaLista, piorGravidade } = D;

// ================= utilitários =================
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = document.getElementById("app");
const PT_DIA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const PT_CURTA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const fmtDia = str => { const t = PT_DIA.format(new Date(str + "T12:00:00")); return t.charAt(0).toUpperCase() + t.slice(1); };
const hhmm = iso => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const primeiroNome = n => n.replace(/^(dra?\.?|sr\.?|sra\.?)\s+/i, "").split(" ")[0];

const ICON = {
  logo: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="3" y="11" width="26" height="10" rx="5" transform="rotate(-35 16 16)" fill="currentColor"/><path d="M16 16 9.6 25.1A5 5 0 0 1 3.4 17.2L9.9 8" fill="#fff" fill-opacity=".35" transform="rotate(0)"/><circle cx="24" cy="24" r="6" fill="#f0b429" stroke="#fff" stroke-width="2"/></svg>',
  hoje: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  pilula: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  historico: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  voltar: '<path d="m15 18-6-6 6-6"/>',
  seta: '<path d="m9 18 6-6-6-6"/>',
  alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  olho: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};
const ic = (n, extra = "") => n === "logo" ? ICON.logo : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[n]}</svg>`;

const ESTADO = {
  tomada: ["Tomada", "check"], pendente: ["No horário", "relogio"], atrasada: ["Aguardando", "relogio"], nao_tomada: ["Não tomada", "x"],
};
const statusTag = (estado, txt) => `<span class="status st-${estado}">${ic(ESTADO[estado][1])}${txt || ESTADO[estado][0]}</span>`;
const erroCampo = m => m ? `<div class="err" role="alert">${ic("alerta")}<span>${esc(m)}</span></div>` : "";

// ---------- toast ----------
let toastTimer;
function toast(msg, acao) {
  document.querySelector(".toast")?.remove(); clearTimeout(toastTimer);
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status");
  t.innerHTML = `<span>${esc(msg)}</span>${acao ? `<button type="button">${esc(acao.texto)}</button>` : ""}`;
  if (acao) t.querySelector("button").onclick = () => { acao.fn(); t.remove(); };
  document.body.appendChild(t); toastTimer = setTimeout(() => t.remove(), acao ? 6000 : 3500);
}

// ---------- modal ----------
function modal(html, aoAbrir) {
  fecharModal(); document.querySelector(".toast")?.remove();
  const bg = document.createElement("div"); bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-t">${html}</div>`;
  bg.addEventListener("click", e => { if (e.target === bg) fecharModal(); });
  document.body.appendChild(bg);
  const anterior = document.activeElement; bg._anterior = anterior;
  aoAbrir?.(bg.firstElementChild);
  (bg.querySelector("[autofocus]") || bg.querySelector("button, input"))?.focus();
  return bg.firstElementChild;
}
function fecharModal() { const bg = document.querySelector(".modal-bg"); if (bg) { bg._anterior?.focus?.(); bg.remove(); } }
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });
function confirmar({ titulo, texto, ok = "Confirmar", perigo = false }) {
  return new Promise(res => {
    const m = modal(`<h2 id="modal-t">${esc(titulo)}</h2><p class="t2">${texto}</p>
      <div class="modal-acoes"><button class="btn btn-secondary" data-n>Cancelar</button><button class="btn ${perigo ? "btn-danger" : "btn-primary"}" data-s autofocus>${esc(ok)}</button></div>`);
    m.querySelector("[data-n]").onclick = () => { fecharModal(); res(false); };
    m.querySelector("[data-s]").onclick = () => { fecharModal(); res(true); };
  });
}

// Erro de campo some assim que a pessoa corrige o campo
document.addEventListener("input", e => {
  const el = e.target; if (el.getAttribute?.("aria-invalid") !== "true") return;
  el.setAttribute("aria-invalid", "false"); el.closest(".field")?.querySelector(".err")?.remove();
});

// ================= preferências de leitura (RNF11, RNF12) =================
function aplicarPrefs() {
  const u = S.usuarioAtual(); const p = u?.prefs || { fonte: 1, contraste: false };
  document.documentElement.style.setProperty("--escala", p.fonte);
  document.documentElement.classList.toggle("contraste", !!p.contraste);
}

// ================= roteamento =================
const ROTAS = [];
const rota = (padrao, tela, fn, opts = {}) => ROTAS.push({ re: new RegExp("^" + padrao.replace(/:(\w+)/g, "([^/]+)") + "$"), tela, fn, ...opts });
function ir(h) { if (location.hash === "#" + h) render(); else location.hash = h; }
window.addEventListener("hashchange", () => render());

function render(opts = {}) {
  if (!opts.silencioso) fecharModal();
  const h = location.hash.slice(1) || "/";
  const u = S.usuarioAtual();
  if (h === "/") return ir(!u ? "/entrar" : u.papel === "paciente" ? "/hoje" : "/pacientes");
  const r = ROTAS.find(x => x.re.test(h));
  if (!r) return ir("/");
  if (r.publica && u) return ir("/");
  if (!r.publica && !u) return ir("/entrar");
  if (u && !r.publica && !u.consentimento && r.tela !== "T04") return ir("/consentimento");
  if (r.papel && u && !r.papel.includes(u.papel)) { // controle de acesso por perfil
    app.innerHTML = layout(u, "Sem permissão", `<div class="empty">${ic("escudo")}<h3>Você não tem acesso a esta página</h3><p>Ela é para outro tipo de conta.</p><a class="btn btn-primary" href="#/">Ir para o início</a></div>`, "");
    return;
  }
  aplicarPrefs();
  const params = h.match(r.re).slice(1).map(decodeURIComponent);
  r.fn(u, ...params);
  marcarTela(r.tela);
  if (opts.silencioso) return;
  window.scrollTo(0, 0);
  const foco = app.querySelector("h1"); if (foco) { foco.tabIndex = -1; foco.focus({ preventScroll: true }); }
}

// Identificação das telas para a documentação da E3 (ativada por ?telas na URL)
const MOSTRAR_ID = (() => { try { if (new URLSearchParams(location.search).has("telas")) sessionStorage.setItem("dd-ids", "1"); return sessionStorage.getItem("dd-ids") === "1"; } catch { return false; } })();
function marcarTela(t) { document.querySelector(".tela-id")?.remove(); if (!MOSTRAR_ID) return; const d = document.createElement("div"); d.className = "tela-id"; d.textContent = "Tela " + t; document.body.appendChild(d); }

// ================= layout logado =================
function navItens(u) {
  if (u.papel === "paciente") {
    const pend = S.vinculosDoPaciente(u.id).filter(v => v.status === "pendente" && v.iniciadoPor === "profissional").length;
    return [["/hoje", "hoje", "Hoje"], ["/medicamentos", "pilula", "Remédios"], ["/historico", "historico", "Histórico"], ["/vinculos", "pessoas", "Vínculos", pend], ["/ajustes", "ajustes", "Ajustes"]];
  }
  const pend = S.vinculosDoProf(u.id).filter(v => v.status === "pendente" && v.iniciadoPor === "paciente").length;
  return [["/pacientes", "pessoas", "Pacientes", pend], ["/buscar", "busca", "Buscar paciente"], ["/ajustes", "ajustes", "Ajustes"]];
}
function layout(u, titulo, corpo, ativo, voltar) {
  const itens = navItens(u);
  const link = ([href, icn, txt, n]) => `<a href="#${href}" ${ativo === href ? 'aria-current="page"' : ""}>${ic(icn)}<span>${txt}</span>${n ? `<span class="badge-dot" aria-label="${n} pendente(s)">${n}</span>` : ""}</a>`;
  return `<div class="shell">
    <aside class="side" aria-label="Menu principal">
      <div class="marca">${ic("logo")}Dose Dupla</div>
      <nav>${itens.map(link).join("")}</nav>
      <div class="rodape"><div class="small"><b>${esc(u.nome)}</b><br><span class="muted">${S.NOME_PAPEL[u.papel]}</span></div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;padding-left:0" data-sair>${ic("sair")}Sair</button></div>
    </aside>
    <div class="main">
      <header class="topbar">${voltar ? `<a class="icon-btn" href="#${voltar}" aria-label="Voltar">${ic("voltar")}</a>` : ""}<h1>${esc(titulo)}</h1></header>
      <main class="content" id="conteudo">${corpo}</main>
    </div>
    <nav class="bottomnav" aria-label="Menu principal">${itens.map(link).join("")}</nav>
  </div>`;
}
document.addEventListener("click", e => { if (e.target.closest("[data-sair]")) { S.sair(); ir("/entrar"); } });

// ================= T01 Entrar =================
rota("/entrar", "T01", () => {
  app.innerHTML = `<div class="auth"><div class="auth-box">
    <div class="marca">${ic("logo")}Dose Dupla</div>
    <p class="auth-sub">Seus remédios na hora certa, acompanhados por quem cuida de você.</p>
    <form class="panel panel-b" novalidate>
      <h1 class="sr">Entrar</h1>
      <div id="erro"></div>
      <div class="field"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-primary btn-block" type="submit">Entrar</button>
      <div style="text-align:center;margin-top:8px"><a class="btn btn-ghost" href="#/recuperar">Esqueci minha senha</a></div>
      <div class="divisor">ainda não tem conta?</div>
      <a class="btn btn-secondary btn-block" href="#/cadastro">Criar conta</a>
    </form>
    <div class="demo">
      <b>Para testar o protótipo</b>
      <p class="t2 small" style="margin:6px 0 10px">Cria três contas de exemplo com 9 dias de histórico: <code>joao@exemplo.com</code> (paciente), <code>helena@exemplo.com</code> (médica) e <code>ana@exemplo.com</code> (cuidadora). Senha de todas: <code>Dose2026</code>.</p>
      <div class="row wrap"><button class="btn btn-secondary btn-sm" data-exemplo>Criar dados de exemplo</button><button class="btn btn-ghost btn-sm" data-apagar>Apagar dados deste navegador</button></div>
    </div>
    <p class="small muted" style="text-align:center;margin-top:16px">Protótipo acadêmico · os dados ficam só neste navegador · <a href="e3.html">Documentação da E3</a></p>
  </div></div>`;
  const f = $("form");
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector("[type=submit]"); btn.classList.add("carregando"); btn.textContent = "Entrando…";
    const r = await S.entrar($("#email").value, $("#senha").value);
    if (r.erro) { btn.classList.remove("carregando"); btn.textContent = "Entrar"; $("#erro").innerHTML = `<div class="alert alert-danger" role="alert" style="margin-bottom:16px">${ic("alerta")}<span>${r.erro}</span></div>`; return; }
    ir("/"); setTimeout(verificarLembretes, 600);
  };
  $("[data-exemplo]").onclick = async ev => {
    ev.target.classList.add("carregando"); await S.criarExemplo();
    $("#email").value = "joao@exemplo.com"; $("#senha").value = "Dose2026"; ev.target.classList.remove("carregando");
    toast("Contas de exemplo criadas. Já preenchi o login do João.");
  };
  $("[data-apagar]").onclick = async () => { if (await confirmar({ titulo: "Apagar todos os dados?", texto: "Remove todas as contas, remédios e históricos salvos neste navegador. Não dá para desfazer.", ok: "Apagar tudo", perigo: true })) { S.apagarTudo(); toast("Dados apagados."); } };
}, { publica: true });

// ================= T02 Criar conta =================
rota("/cadastro", "T02", () => {
  const desenha = (v = {}, e = {}) => {
    app.innerHTML = `<div class="auth"><div class="auth-box">
      <div class="row" style="margin-bottom:12px"><a class="icon-btn" href="#/entrar" aria-label="Voltar">${ic("voltar")}</a><h1>Criar conta</h1></div>
      <form class="panel panel-b" novalidate>
        <fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><legend class="label">Como você vai usar o Dose Dupla?</legend>
          <div class="radio-group">
            ${[["paciente", "Para controlar meus remédios"], ["cuidador", "Para acompanhar alguém que eu cuido"], ["medico", "Sou médico(a) e acompanho pacientes"]].map(([k, t]) =>
              `<label class="radio-card"><input type="radio" name="papel" value="${k}" ${(v.papel || "paciente") === k ? "checked" : ""}><span>${t}</span></label>`).join("")}
          </div></fieldset>
        <div class="field"><label for="nome">Nome completo</label><input id="nome" autocomplete="name" value="${esc(v.nome)}" aria-invalid="${!!e.nome}">${erroCampo(e.nome)}</div>
        <div class="field" id="f-crm" ${(v.papel || "paciente") === "medico" ? "" : "hidden"}><label for="crm">CRM</label><input id="crm" placeholder="CRM/SC 12345" value="${esc(v.registro)}" aria-invalid="${!!e.registro}">${erroCampo(e.registro)}</div>
        <div class="field"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" value="${esc(v.email)}" aria-invalid="${!!e.email}">${erroCampo(e.email)}</div>
        <div class="field"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="new-password" aria-describedby="dica-senha" aria-invalid="${!!e.senha}">
          <div class="hint" id="dica-senha">Pelo menos 8 caracteres, com letras e números.</div>${erroCampo(e.senha)}</div>
        <button class="btn btn-primary btn-block" type="submit">Criar conta</button>
      </form></div></div>`;
    app.querySelectorAll("[name=papel]").forEach(r => r.onchange = () => { $("#f-crm").hidden = r.value !== "medico"; });
    $("form").onsubmit = async ev => {
      ev.preventDefault();
      const dados = { papel: $("[name=papel]:checked").value, nome: $("#nome").value, email: $("#email").value, senha: $("#senha").value, registro: $("#crm").value };
      const r = await S.criarConta(dados);
      if (r.erros) { desenha(dados, r.erros); app.querySelector("[aria-invalid=true]")?.focus(); return; }
      ir("/consentimento");
    };
  };
  desenha();
}, { publica: true });

// ================= T03 Recuperar senha =================
rota("/recuperar", "T03", () => {
  const passo1 = () => {
    app.innerHTML = `<div class="auth"><div class="auth-box">
      <div class="row" style="margin-bottom:12px"><a class="icon-btn" href="#/entrar" aria-label="Voltar">${ic("voltar")}</a><h1>Recuperar senha</h1></div>
      <form class="panel panel-b" novalidate>
        <p class="t2">Informe o e-mail da sua conta. Vamos enviar um código de 6 números para você criar uma senha nova.</p>
        <div class="field"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" required></div>
        <button class="btn btn-primary btn-block">Enviar código</button>
      </form></div></div>`;
    $("form").onsubmit = e => { e.preventDefault(); const email = $("#email").value.trim(); const codigo = S.pedirReset(email); passo2(email, codigo); };
  };
  const passo2 = (email, codigo, erro) => {
    app.innerHTML = `<div class="auth"><div class="auth-box">
      <div class="row" style="margin-bottom:12px"><a class="icon-btn" href="#/entrar" aria-label="Voltar">${ic("voltar")}</a><h1>Criar senha nova</h1></div>
      <form class="panel panel-b" novalidate>
        <div class="alert alert-ok" style="margin-bottom:16px">${ic("check")}<span>Se existir conta com <b>${esc(email)}</b>, o código foi enviado. Ele vale por 30 minutos.</span></div>
        ${codigo ? `<div class="alert alert-info" style="margin-bottom:16px">${ic("info")}<span><b>Protótipo:</b> sem servidor de e-mail, o código aparece aqui: <b>${codigo}</b></span></div>` : ""}
        ${erro ? `<div class="alert alert-danger" role="alert" style="margin-bottom:16px">${ic("alerta")}<span>${esc(erro)}</span></div>` : ""}
        <div class="field"><label for="cod">Código recebido</label><input id="cod" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>
        <div class="field"><label for="nova">Senha nova</label><input id="nova" type="password" autocomplete="new-password"><div class="hint">Pelo menos 8 caracteres, com letras e números.</div></div>
        <button class="btn btn-primary btn-block">Salvar senha nova</button>
      </form></div></div>`;
    $("form").onsubmit = async e => {
      e.preventDefault();
      const r = await S.redefinirSenha(email, $("#cod").value, $("#nova").value);
      if (r.erro) return passo2(email, codigo, r.erro);
      ir("/entrar"); toast("Senha alterada. Entre com a senha nova.");
    };
  };
  passo1();
}, { publica: true });

// ================= T04 Consentimento (RNF06) =================
rota("/consentimento", "T04", u => {
  const pac = u.papel === "paciente";
  app.innerHTML = `<div class="auth"><div class="auth-box">
    <div class="marca">${ic("logo")}Dose Dupla</div>
    <div class="panel panel-b" style="margin-top:16px">
      <h1 style="margin-bottom:12px">${pac ? "Antes de começar: seus dados de saúde" : "Antes de começar: dados dos pacientes"}</h1>
      ${pac ? `<p class="t2">Para funcionar, o Dose Dupla guarda os <b>seus remédios, horários e doses tomadas</b>. Isso é dado de saúde, protegido pela LGPD.</p>
        <ul class="t2" style="padding-left:20px;margin:0 0 16px"><li>Usamos para lembrar seus horários e avisar sobre interações.</li>
        <li>Médico e cuidador só veem seus dados se <b>você aceitar</b> o vínculo, e cada acesso fica registrado.</li>
        <li>Não usamos seus dados para propaganda.</li>
        <li>Você pode baixar ou apagar tudo a qualquer momento em Ajustes.</li></ul>`
        : `<p class="t2">Você só verá os dados de pacientes que aceitarem o seu vínculo. Cada acesso aos dados fica registrado e o paciente pode consultar esse registro.</p>`}
      <label class="check" style="margin-bottom:16px"><input type="checkbox" id="ok"><span>${pac ? "Autorizo o uso dos meus dados de saúde para estas finalidades." : "Entendo e me comprometo a usar os dados só para acompanhar o paciente."}</span></label>
      <button class="btn btn-primary btn-block" id="seguir" disabled>Continuar</button>
      <button class="btn btn-ghost btn-block" data-sair style="margin-top:6px">Agora não (sair)</button>
    </div></div></div>`;
  $("#ok").onchange = e => { $("#seguir").disabled = !e.target.checked; };
  $("#seguir").onclick = () => { S.atualizarUsuario({ consentimento: new Date().toISOString() }); ir("/"); };
});

// ================= T05 Hoje =================
rota("/hoje", "T05", u => {
  const hoje = S.hojeStr(); const doses = S.dosesDoDia(u.id, hoje);
  const prox = doses.find(d => d.estado === "atrasada") || doses.find(d => d.estado === "pendente");
  const pendVinc = S.vinculosDoPaciente(u.id).filter(v => v.status === "pendente" && v.iniciadoPor === "profissional");
  const tomadas = doses.filter(d => d.estado === "tomada").length;
  const notifEstado = "Notification" in window ? Notification.permission : "indisponivel";

  let corpo = `<p class="t2" style="margin-bottom:16px">${fmtDia(hoje)}</p>`;
  if (pendVinc.length) corpo += `<div class="alert alert-info" style="margin-bottom:16px">${ic("pessoas")}<div><b>${pendVinc.length === 1 ? esc(S.usuario(pendVinc[0].profId)?.nome || pendVinc[0].profEmail) + " quer acompanhar você." : pendVinc.length + " pedidos de acompanhamento esperando sua resposta."}</b><br><a class="btn btn-secondary btn-sm" href="#/vinculos">Ver pedido${pendVinc.length > 1 ? "s" : ""}</a></div></div>`;
  if (notifEstado === "default") corpo += `<div class="alert alert-warn" style="margin-bottom:16px">${ic("sino")}<div><b>Ative os lembretes</b> para receber um aviso na hora de cada remédio.<br><button class="btn btn-secondary btn-sm" data-notif>Ativar lembretes</button></div></div>`;
  if (notifEstado === "denied") corpo += `<div class="alert alert-warn" style="margin-bottom:16px">${ic("sino")}<span>Os avisos do navegador estão bloqueados. Os lembretes aparecem só com o app aberto. Para liberar, permita notificações nas configurações do navegador.</span></div>`;

  if (!doses.length) {
    corpo += `<div class="panel"><div class="empty">${ic("pilula")}<h3>Nenhum remédio cadastrado</h3><p>Cadastre o primeiro remédio para receber os lembretes.</p><a class="btn btn-primary" href="#/medicamentos/novo">${ic("mais")}Cadastrar remédio</a></div></div>`;
  } else {
    const perdidas = doses.filter(d => d.estado === "nao_tomada");
    const botaoProx = prox && (prox.podeConfirmar
      ? `<button class="btn" data-tomar="${prox.chave}">${ic("check")}Tomei</button>`
      : `<span class="small" style="opacity:.9">Confirmação libera às ${prox.liberaAs}</span>`);
    if (perdidas.length) corpo += `<div class="alert alert-danger" style="margin-bottom:16px">${ic("alerta")}<span><b>${perdidas.length === 1 ? "1 dose de hoje não foi confirmada" : perdidas.length + " doses de hoje não foram confirmadas"}</b> (${perdidas.map(d => d.hora + " " + esc(d.med.nome)).join(", ")}). Se você tomou, confirme na lista abaixo.</span></div>`;
    corpo += prox
      ? `<div class="proxima" aria-live="polite"><div class="grow"><div class="small" style="opacity:.85">${prox.estado === "atrasada" ? "Dose aguardando confirmação" : "Próxima dose"}</div><div class="h">${prox.hora}</div><div style="font-weight:650;margin-top:4px">${esc(prox.med.nome)} · ${esc(prox.dose)}</div></div>${botaoProx}</div>`
      : perdidas.length ? "" : `<div class="alert alert-ok">${ic("check")}<span><b>Tudo certo por hoje.</b> Todas as doses foram confirmadas.</span></div>`;
    corpo += `<section class="section"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Doses de hoje</h2><span class="muted small">${tomadas} de ${doses.length} tomadas</span></div>
      <div class="panel"><ul class="list">${doses.map(d => `<li><span class="hora">${d.hora}</span><div class="grow"><div class="trunc"><b>${esc(d.med.nome)}</b> <span class="small muted">${esc(d.dose)}</span></div><div class="linha2">${d.estado === "tomada" ? statusTag("tomada", "Tomada às " + hhmm(d.reg.tomadaEm)) : statusTag(d.estado)}</div></div>
        ${d.estado === "tomada" ? `<button class="icon-btn" title="Desfazer" aria-label="Desfazer confirmação de ${esc(d.med.nome)} ${d.hora}" data-desfazer="${d.chave}">${ic("x")}</button>`
          : !d.podeConfirmar ? `<span class="small muted" style="text-align:right">Libera<br>às ${d.liberaAs}</span>`
          : `<button class="btn ${d.estado === "pendente" ? "btn-secondary" : "btn-primary"} btn-sm" data-tomar="${d.chave}" aria-label="Marcar ${esc(d.med.nome)} ${d.hora} como tomada">Tomei</button>`}</li>`).join("")}</ul></div>
      <p class="small muted" style="margin-top:8px">A confirmação de cada dose libera 30 minutos antes do horário.</p></section>
      <div style="margin-top:16px"><a class="btn btn-secondary" href="#/medicamentos/novo">${ic("mais")}Adicionar remédio</a></div>`;
  }
  app.innerHTML = layout(u, `Olá, ${primeiroNome(u.nome)}`, corpo, "/hoje");
  ligarDoses();
  $("[data-notif]")?.addEventListener("click", async () => { await Notification.requestPermission(); render(); });
}, { papel: ["paciente"] });

function ligarDoses() {
  app.querySelectorAll("[data-tomar]").forEach(b => b.onclick = () => {
    const [mid, dia, hora] = b.dataset.tomar.split("|"); const r = S.confirmarDose(mid, dia, hora);
    if (r.erro) return toast(r.erro);
    render();
    toast("Dose registrada.", { texto: "Desfazer", fn: () => { S.desfazerDose(mid, dia, hora); render(); } });
  });
  app.querySelectorAll("[data-desfazer]").forEach(b => b.onclick = () => { const [mid, dia, hora] = b.dataset.desfazer.split("|"); S.desfazerDose(mid, dia, hora); render(); toast("Confirmação desfeita."); });
}

// ================= T08 Medicamentos =================
rota("/medicamentos", "T08", u => {
  const meds = S.medsDe(u.id);
  const corpo = meds.length
    ? `<div class="row" style="justify-content:space-between;margin-bottom:16px"><p class="t2" style="margin:0">${meds.length} remédio${meds.length > 1 ? "s" : ""} em uso</p><a class="btn btn-primary" href="#/medicamentos/novo">${ic("mais")}Adicionar</a></div>
       ${blocoInteracoes(meds, "paciente")}
       <div class="panel"><ul class="list">${linhasMeds(meds, true)}</ul></div>`
    : `<div class="panel"><div class="empty">${ic("pilula")}<h3>Nenhum remédio cadastrado</h3><p>Leva menos de um minuto: nome, dose e horários.</p><a class="btn btn-primary" href="#/medicamentos/novo">${ic("mais")}Cadastrar remédio</a></div></div>`;
  app.innerHTML = layout(u, "Meus remédios", corpo, "/medicamentos");
}, { papel: ["paciente"] });

// Interações entre os remédios em uso (RF06): visíveis depois de salvar, para paciente, médico e cuidador
const SEV_TXT = { grave: "Interação grave", moderada: "Interação moderada", leve: "Interação leve" };
function linhasMeds(meds, link) {
  const mapa = interacoesDaLista(meds);
  return meds.map(m => {
    const it = mapa[m.id]; const pior = piorGravidade(it.lista);
    const selo = pior ? `<span class="sev sev-${pior}">${SEV_TXT[pior]}</span>` : !it.reconhecido ? `<span class="status st-pendente">Fora da base</span>` : "";
    const conteudo = `<div class="grow"><div class="trunc"><b>${esc(m.nome)}</b> · ${esc(m.dose)}</div><div class="small muted">${m.horarios.join(" · ")}${m.obs ? " · " + esc(m.obs) : ""}</div>${selo ? `<div class="linha2">${selo}</div>` : ""}</div>`;
    return link ? `<li><a class="li-link" href="#/medicamentos/${m.id}">${conteudo}<span class="muted">${ic("seta", 'width="20" height="20"')}</span></a></li>` : `<li>${conteudo}</li>`;
  }).join("");
}
function blocoInteracoes(meds, quem) {
  const pares = paresDaLista(meds);
  if (!pares.length) return "";
  const ciente = (a, b) => meds.find(m => (m.nome === a || m.nome === b) && m.ciencia?.lista?.some(c => c.com === a || c.com === b));
  return `<section class="panel panel-b" style="margin-bottom:16px" aria-labelledby="t-inter">
    <h2 id="t-inter" style="margin-bottom:4px">Interações entre ${quem === "paciente" ? "seus remédios" : "os remédios em uso"}</h2>
    <p class="small t2">${quem === "paciente" ? "Converse com seu médico ou farmacêutico. Não pare nem mude remédios por conta própria." : "Possíveis interações identificadas pelo app na lista atual do paciente."}</p>
    <div class="stack">${pares.map(x => { const c = ciente(x.a, x.b); return `<div class="inter ${x.gravidade}"><span class="sev sev-${x.gravidade}">${x.gravidade}</span><h3 style="margin:6px 0 2px">${esc(x.a)} + ${esc(x.b)}</h3><div class="t2 small">${esc(x.texto)}</div>${c ? `<div class="small muted" style="margin-top:4px">Paciente salvo ciente do alerta em ${PT_CURTA.format(new Date(c.ciencia.em))}.</div>` : ""}</div>`; }).join("")}</div>
    <p class="small muted" style="margin-top:10px">Base de interações versão ${esc(D.BASE.versao)} (demonstração).</p></section>`;
}

// ================= T06 / T09 Cadastro e edição + T07 alerta =================
function formMed(u, mid) {
  const existente = mid ? S.med(mid) : null;
  if (mid && (!existente || existente.pacienteId !== u.id || !existente.ativo)) {
    app.innerHTML = layout(u, "Remédio", `<div class="panel"><div class="empty">${ic("alerta")}<h3>Remédio não encontrado</h3><p>Ele pode ter sido removido.</p><a class="btn btn-primary" href="#/medicamentos">Ver meus remédios</a></div></div>`, "/medicamentos", "/medicamentos");
    return;
  }
  const v = existente ? { nome: existente.nome, dose: existente.dose, horarios: [...existente.horarios], obs: existente.obs } : { nome: "", dose: "", horarios: [], obs: "" };
  let erros = {};
  const desenha = () => {
    const corpo = `<form class="panel panel-b" novalidate style="max-width:560px">
      <div class="field"><label for="nome">Nome do remédio</label><input id="nome" list="catalogo" autocomplete="off" value="${esc(v.nome)}" placeholder="Ex.: Losartana" aria-invalid="${!!erros.nome}">
        <datalist id="catalogo">${D.CATALOGO.map(c => `<option value="${c}">`).join("")}</datalist>
        <div class="hint">Comece a digitar e escolha da lista. Assim conseguimos verificar as interações.</div>${erroCampo(erros.nome)}</div>
      <div class="field"><label for="dose">Dose</label><input id="dose" value="${esc(v.dose)}" placeholder="Ex.: 50 mg ou 1 comprimido" aria-invalid="${!!erros.dose}">${erroCampo(erros.dose)}</div>
      <div class="field"><span class="label" id="lbl-h">Horários</span>
        <div class="chips" aria-labelledby="lbl-h" style="margin-bottom:10px">${v.horarios.length ? v.horarios.map((h, i) => `<span class="chip">${h}<button type="button" aria-label="Remover ${h}" data-rm="${i}">${ic("x")}</button></span>`).join("") : '<span class="muted small">Nenhum horário adicionado.</span>'}</div>
        <div class="row"><label for="hora" class="sr">Novo horário</label><input id="hora" type="time" value="08:00" style="max-width:160px"><button type="button" class="btn btn-secondary" data-add>${ic("mais")}Adicionar horário</button></div>${erroCampo(erros.horarios)}</div>
      <div class="field"><label for="obs">Observação <span class="muted">(opcional)</span></label><input id="obs" value="${esc(v.obs)}" placeholder="Ex.: tomar depois do café"></div>
      <div class="row wrap" style="margin-top:8px"><button class="btn btn-primary" type="submit">${existente ? "Salvar alterações" : "Salvar remédio"}</button>
      ${existente ? `<button type="button" class="btn btn-danger-outline" data-remover>Parar de usar</button>` : ""}</div>
      <p class="small muted" style="margin-top:12px">Ao salvar, verificamos se este remédio interage com os outros que você usa.</p>
    </form>`;
    app.innerHTML = layout(u, existente ? "Editar remédio" : "Novo remédio", corpo, "/medicamentos", "/medicamentos");
    const lerCampos = () => { v.nome = $("#nome").value; v.dose = $("#dose").value; v.obs = $("#obs").value; };
    app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { lerCampos(); v.horarios.splice(+b.dataset.rm, 1); desenha(); });
    $("[data-add]").onclick = () => { lerCampos(); const h = $("#hora").value; if (h && !v.horarios.includes(h)) { v.horarios.push(h); v.horarios.sort(); } erros.horarios = null; desenha(); $("#hora").focus(); };
    $("[data-remover]")?.addEventListener("click", async () => {
      if (await confirmar({ titulo: `Parar de usar ${existente.nome}?`, texto: "Os lembretes deste remédio param a partir de agora. O histórico de doses continua guardado.", ok: "Parar de usar", perigo: true })) {
        S.removerMed(existente.id); ir("/medicamentos"); toast(`${existente.nome} removido da lista.`);
      }
    });
    $("form").onsubmit = e => {
      e.preventDefault(); lerCampos();
      erros = S.validaMed(v); if (Object.keys(erros).length) { desenha(); app.querySelector("[aria-invalid=true]")?.focus(); return; }
      const outros = S.medsDe(u.id).filter(m => m.id !== mid);
      const dup = outros.find(m => m.nome.toLowerCase() === v.nome.trim().toLowerCase());
      const r = verificaInteracoes(v.nome, outros);
      if (r.lista.length || !r.reconhecido || dup) alertaInteracao(r, v, dup, () => concluir(r.lista));
      else concluir();
    };
  };
  const concluir = (lista = []) => {
    v.ciencia = lista.length ? lista.map(i => ({ com: i.com, gravidade: i.gravidade })) : null;
    S.salvarMed(u.id, v, mid); fecharModal(); ir("/medicamentos");
    toast(existente ? "Alterações salvas. Interações verificadas de novo." : `${v.nome.trim()} salvo. Os lembretes já estão agendados.`);
  };
  desenha();
}
// T07
function alertaInteracao(r, v, dup, salvar) {
  const grave = r.lista.some(i => i.gravidade === "grave");
  const m = modal(`<h2 id="modal-t">${r.lista.length ? "Atenção: possível interação" : "Confira antes de salvar"}</h2>
    ${dup ? `<div class="alert alert-warn" style="margin-bottom:12px">${ic("alerta")}<span>Você já tem <b>${esc(dup.nome)}</b> na lista. Confira se não é o mesmo remédio cadastrado duas vezes.</span></div>` : ""}
    ${!r.reconhecido ? `<div class="alert alert-warn" style="margin-bottom:12px">${ic("alerta")}<span><b>${esc(v.nome)}</b> não está na nossa base, então <b>não conseguimos verificar interações</b>. Confira o nome na caixa do remédio ou pergunte ao farmacêutico.</span></div>` : ""}
    ${r.lista.length ? `<p class="t2">Encontramos ${r.lista.length} possível${r.lista.length > 1 ? "is" : ""} interaç${r.lista.length > 1 ? "ões" : "ão"} entre <b>${esc(v.nome)}</b> e remédios que você já usa:</p>
      <div class="stack">${r.lista.map(i => `<div class="inter ${i.gravidade}"><span class="sev sev-${i.gravidade}">${i.gravidade}</span><h3 style="margin:8px 0 4px">${esc(v.nome)} + ${esc(i.com)}</h3><div class="t2">${esc(i.texto)}</div></div>`).join("")}</div>
      <div class="alert alert-info" style="margin-top:12px">${ic("info")}<span>${grave ? "<b>Não comece a usar sem falar com seu médico.</b> " : ""}Não pare nem mude nenhum remédio por conta própria. Converse com seu médico ou farmacêutico.</span></div>
      ${grave ? `<label class="check" style="margin-top:12px"><input type="checkbox" id="ciente"><span>Entendi o risco e vou conversar com meu médico.</span></label>` : ""}
      <p class="small muted" style="margin-top:12px">Base de interações versão ${esc(D.BASE.versao)} · reduzida, só para demonstração. O alerta fica visível na sua lista de remédios e para o seu médico e cuidador.</p>` : ""}
    <div class="modal-acoes"><button class="btn btn-secondary" data-revisar autofocus>Voltar e revisar</button><button class="btn btn-primary" data-salvar ${grave ? "disabled" : ""}>Salvar mesmo assim</button></div>`);
  m.querySelector("[data-revisar]").onclick = fecharModal;
  m.querySelector("[data-salvar]").onclick = salvar;
  m.querySelector("#ciente")?.addEventListener("change", e => { m.querySelector("[data-salvar]").disabled = !e.target.checked; });
}
rota("/medicamentos/novo", "T06", u => formMed(u), { papel: ["paciente"] });
rota("/medicamentos/:id", "T09", (u, id) => formMed(u, id), { papel: ["paciente"] });

// ================= T13 Histórico =================
function historicoHTML(pid, dias, filtro) {
  const hoje = S.hojeStr(); const blocos = []; let tom = 0, nao = 0;
  for (let i = 0; i < dias; i++) {
    const dia = S.addDias(hoje, -i);
    let ds = S.dosesDoDia(pid, dia).filter(d => d.estado === "tomada" || d.estado === "nao_tomada");
    if (filtro) ds = ds.filter(d => d.med.id === filtro);
    tom += ds.filter(d => d.estado === "tomada").length; nao += ds.filter(d => d.estado === "nao_tomada").length;
    if (ds.length) blocos.push(`<div class="dia"><h3>${i === 0 ? "Hoje" : i === 1 ? "Ontem" : fmtDia(dia)}</h3><div class="panel"><ul class="list">${ds.map(d =>
      `<li><span class="hora">${d.hora}</span><div class="grow"><div class="trunc"><b>${esc(d.med.nome)}</b> <span class="muted small">${esc(d.dose)}</span></div><div class="linha2">${d.estado === "tomada" ? statusTag("tomada", "Tomada às " + hhmm(d.reg.tomadaEm)) : statusTag("nao_tomada")}</div></div></li>`).join("")}</ul></div></div>`);
  }
  const total = tom + nao;
  if (!total) return `<div class="panel"><div class="empty">${ic("historico")}<h3>Ainda não há histórico</h3><p>As doses aparecem aqui depois do horário de cada uma.</p></div></div>`;
  return `<div class="kpis" role="group" aria-label="Resumo"><div><b>${Math.round(tom / total * 100)}%</b><span>doses tomadas</span></div><div><b>${tom}</b><span>tomadas</span></div><div><b>${nao}</b><span>não tomadas</span></div></div>${blocos.join("")}`;
}
function filtrosHistorico(pid, dias, filtro) {
  const meds = S.medsDe(pid);
  return `<div class="row wrap" style="margin-bottom:16px;gap:12px">
    <div class="seg" role="group" aria-label="Período">${[7, 14, 30].map(n => `<button type="button" data-dias="${n}" aria-pressed="${dias === n}">${n} dias</button>`).join("")}</div>
    <div style="min-width:200px;flex:1;max-width:280px"><label class="sr" for="fmed">Remédio</label><select id="fmed"><option value="">Todos os remédios</option>${meds.map(m => `<option value="${m.id}" ${filtro === m.id ? "selected" : ""}>${esc(m.nome)}</option>`).join("")}</select></div></div>`;
}
function ligarFiltros(estado, redesenha) {
  app.querySelectorAll("[data-dias]").forEach(b => b.onclick = () => { estado.dias = +b.dataset.dias; redesenha(); });
  $("#fmed").onchange = e => { estado.filtro = e.target.value; redesenha(); };
}
rota("/historico", "T13", u => {
  const st = { dias: 7, filtro: "" };
  const desenha = () => { app.innerHTML = layout(u, "Histórico de doses", filtrosHistorico(u.id, st.dias, st.filtro) + historicoHTML(u.id, st.dias, st.filtro), "/historico"); ligarFiltros(st, desenha); };
  desenha();
}, { papel: ["paciente"] });

// ================= T11 Vínculos + T12 convite =================
rota("/vinculos", "T11", u => {
  const vs = S.vinculosDoPaciente(u.id);
  const nomeDe = v => S.usuario(v.profId)?.nome || v.profEmail;
  const pedidos = vs.filter(v => v.status === "pendente" && v.iniciadoPor === "profissional");
  const convites = vs.filter(v => v.status === "pendente" && v.iniciadoPor === "paciente");
  const medico = vs.find(v => v.status === "ativo" && v.papel === "medico");
  const cuids = vs.filter(v => v.status === "ativo" && v.papel === "cuidador");
  const pessoa = (v, extra) => `<li><div class="grow"><div class="trunc"><b>${esc(nomeDe(v))}</b></div><div class="small muted trunc">${esc(v.profEmail)}${S.usuario(v.profId)?.registro ? " · " + esc(S.usuario(v.profId).registro) : ""}</div></div>${extra}</li>`;
  let corpo = "";
  if (pedidos.length) corpo += `<section><h2 style="margin-bottom:12px">Pedidos para acompanhar você</h2><div class="panel"><ul class="list">${pedidos.map(v => `<li style="flex-wrap:wrap"><div class="grow" style="min-width:200px"><b>${esc(nomeDe(v))}</b> quer acompanhar você como <b>${v.papel === "medico" ? "médico(a) responsável" : "cuidador(a)"}</b>.<div class="small muted">Vai poder ver seus remédios e o histórico de doses.</div></div><div class="row"><button class="btn btn-secondary btn-sm" data-recusar="${v.id}">Recusar</button><button class="btn btn-primary btn-sm" data-aceitar="${v.id}">Aceitar</button></div></li>`).join("")}</ul></div></section>`;
  corpo += `<section class="section"><h2 style="margin-bottom:12px">Médico responsável</h2><div class="panel">${medico ? `<ul class="list">${pessoa(medico, `<button class="btn btn-ghost btn-sm" data-encerrar="${medico.id}">Remover</button>`)}</ul>` : `<div class="panel-b muted">Nenhum médico vinculado.</div>`}</div></section>`;
  corpo += `<section class="section"><h2 style="margin-bottom:12px">Cuidadores</h2><div class="panel">${cuids.length ? `<ul class="list">${cuids.map(v => pessoa(v, `<button class="btn btn-ghost btn-sm" data-encerrar="${v.id}">Remover</button>`)).join("")}</ul>` : `<div class="panel-b muted">Nenhum cuidador vinculado. O cuidador é avisado quando você não confirma uma dose em até 60 minutos.</div>`}</div></section>`;
  if (convites.length) corpo += `<section class="section"><h2 style="margin-bottom:12px">Convites enviados</h2><div class="panel"><ul class="list">${convites.map(v => pessoa(v, `<span class="status st-pendente">Aguardando aceite</span><button class="btn btn-ghost btn-sm" data-encerrar="${v.id}" aria-label="Cancelar convite">Cancelar</button>`)).join("")}</ul></div></section>`;
  corpo += `<div class="row wrap" style="margin-top:24px"><button class="btn btn-primary" data-convidar>${ic("mais")}Convidar médico ou cuidador</button><a class="btn btn-ghost" href="#/acessos">${ic("olho")}Quem acessou meus dados</a></div>`;
  app.innerHTML = layout(u, "Vínculos", corpo, "/vinculos");

  app.querySelectorAll("[data-aceitar]").forEach(b => b.onclick = async () => {
    const v = vs.find(x => x.id === b.dataset.aceitar);
    if (v.papel === "medico" && medico && !(await confirmar({ titulo: "Trocar o médico responsável?", texto: `Hoje seu médico responsável é <b>${esc(nomeDe(medico))}</b>. Ao aceitar, <b>${esc(nomeDe(v))}</b> passa a ser o responsável e o vínculo anterior é encerrado.`, ok: "Aceitar e trocar" }))) return;
    S.responder(v.id, true); render(); toast(`${nomeDe(v)} agora acompanha você.`);
  });
  app.querySelectorAll("[data-recusar]").forEach(b => b.onclick = () => { const v = vs.find(x => x.id === b.dataset.recusar); S.responder(v.id, false); render(); toast("Pedido recusado. Essa pessoa não verá seus dados."); });
  app.querySelectorAll("[data-encerrar]").forEach(b => b.onclick = async () => {
    const v = vs.find(x => x.id === b.dataset.encerrar);
    const conv = v.status === "pendente";
    if (await confirmar({ titulo: conv ? "Cancelar convite?" : `Remover ${esc(nomeDe(v))}?`, texto: conv ? "O convite deixa de valer." : "Essa pessoa deixa de ver seus remédios e histórico imediatamente.", ok: conv ? "Cancelar convite" : "Remover", perigo: !conv })) { S.encerrar(v.id); render(); toast(conv ? "Convite cancelado." : "Vínculo removido."); }
  });
  $("[data-convidar]").onclick = () => abrirConvite(u);
}, { papel: ["paciente"] });

function abrirConvite(u, erro, val = {}) { // T12
  const m = modal(`<h2 id="modal-t">Convidar para acompanhar você</h2>
    <form novalidate>
      <fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><legend class="label">Essa pessoa é</legend><div class="radio-group">
        <label class="radio-card"><input type="radio" name="papel" value="cuidador" ${val.papel !== "medico" ? "checked" : ""}><span>Cuidador(a) · familiar ou pessoa que ajuda você</span></label>
        <label class="radio-card"><input type="radio" name="papel" value="medico" ${val.papel === "medico" ? "checked" : ""}><span>Médico(a) responsável</span></label></div></fieldset>
      <div class="field"><label for="cemail">E-mail da pessoa</label><input id="cemail" type="email" value="${esc(val.email)}" aria-invalid="${!!erro}" autofocus>${erroCampo(erro)}
        <div class="hint">Ela só verá seus dados depois de aceitar o convite.</div></div>
      <div class="modal-acoes"><button type="button" class="btn btn-secondary" data-cancelar>Cancelar</button><button class="btn btn-primary">Enviar convite</button></div>
    </form>`);
  m.querySelector("[data-cancelar]").onclick = fecharModal;
  m.querySelector("form").onsubmit = e => {
    e.preventDefault();
    const dados = { email: m.querySelector("#cemail").value, papel: m.querySelector("[name=papel]:checked").value };
    const r = S.pacienteConvida(u.id, dados.email, dados.papel);
    if (r.erro) return abrirConvite(u, r.erro, dados);
    fecharModal(); render(); toast(r.temConta ? "Convite enviado. Aguardando a pessoa aceitar." : "Convite registrado. Ele aparece para a pessoa quando ela criar a conta com este e-mail.");
  };
}

// ================= T19 Quem acessou meus dados (RNF07) =================
rota("/acessos", "T19", u => {
  const lista = S.acessosDe(u.id);
  const corpo = lista.length
    ? `<p class="t2">Cada vez que seu médico ou cuidador abre seus dados, isso fica registrado aqui.</p><div class="panel"><ul class="list">${lista.slice(0, 100).map(a => { const q = S.usuario(a.quemId); return `<li><div class="grow"><b>${esc(q?.nome || "Conta removida")}</b> <span class="muted small">${q ? S.NOME_PAPEL[q.papel] : ""}</span><div class="small muted">${esc(a.acao)}</div></div><span class="small t2" style="white-space:nowrap">${PT_CURTA.format(new Date(a.quando))}</span></li>`; }).join("")}</ul></div>`
    : `<div class="panel"><div class="empty">${ic("escudo")}<h3>Ninguém acessou seus dados ainda</h3><p>Quando um médico ou cuidador vinculado abrir seus dados, o acesso aparece aqui.</p></div></div>`;
  app.innerHTML = layout(u, "Quem acessou meus dados", corpo, "/vinculos", "/vinculos");
}, { papel: ["paciente"] });

// ================= T14 Ajustes =================
rota("/ajustes", "T14", u => {
  const p = u.prefs || { fonte: 1, contraste: false };
  const corpo = `<section class="panel panel-b"><h2 style="margin-bottom:4px">Leitura</h2><p class="t2 small">Vale para todas as telas deste aparelho.</p>
      <span class="label" id="lf">Tamanho da letra</span>
      <div class="seg" role="group" aria-labelledby="lf">${[[1, "Normal"], [1.15, "Grande"], [1.3, "Muito grande"]].map(([v, t]) => `<button type="button" data-fonte="${v}" aria-pressed="${p.fonte === v}">${t}</button>`).join("")}</div>
      <span class="label" id="lc" style="margin-top:16px">Alto contraste</span>
      <div class="seg" role="group" aria-labelledby="lc"><button type="button" data-contraste="0" aria-pressed="${!p.contraste}">Desligado</button><button type="button" data-contraste="1" aria-pressed="${!!p.contraste}">Ligado</button></div></section>
    <section class="panel panel-b section"><h2 style="margin-bottom:12px">Conta</h2>
      <div class="small t2" style="margin-bottom:12px"><b>${esc(u.nome)}</b> · ${esc(u.email)}<br>${S.NOME_PAPEL[u.papel]}${u.registro ? " · " + esc(u.registro) : ""}</div>
      <button class="btn btn-secondary" data-sair>${ic("sair")}Sair</button></section>
    <section class="panel panel-b section"><h2 style="margin-bottom:4px">Privacidade (LGPD)</h2><p class="t2 small">Consentimento dado em ${u.consentimento ? PT_CURTA.format(new Date(u.consentimento)) : "—"}.</p>
      <div class="row wrap">${u.papel === "paciente" ? `<a class="btn btn-secondary" href="#/acessos">${ic("olho")}Quem acessou meus dados</a>` : ""}<button class="btn btn-secondary" data-exportar>Baixar meus dados</button><button class="btn btn-danger-outline" data-excluir>Excluir minha conta</button></div></section>`;
  app.innerHTML = layout(u, "Ajustes", corpo, "/ajustes");
  app.querySelectorAll("[data-fonte]").forEach(b => b.onclick = () => { S.atualizarUsuario({ prefs: { ...p, fonte: +b.dataset.fonte } }); render(); });
  app.querySelectorAll("[data-contraste]").forEach(b => b.onclick = () => { S.atualizarUsuario({ prefs: { ...p, contraste: b.dataset.contraste === "1" } }); render(); });
  $("[data-exportar]").onclick = () => {
    const blob = new Blob([JSON.stringify(S.exportarMeusDados(), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dose-dupla-meus-dados.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  $("[data-excluir]").onclick = async () => {
    if (await confirmar({ titulo: "Excluir sua conta?", texto: "Apaga sua conta, remédios, histórico e vínculos. Não dá para desfazer.", ok: "Excluir conta", perigo: true })) { S.excluirConta(); ir("/entrar"); toast("Conta excluída."); }
  };
});

// ================= T15 Pacientes (médico/cuidador) + T18 aviso =================
rota("/pacientes", "T15", u => {
  const vs = S.vinculosDoProf(u.id);
  const ativos = vs.filter(v => v.status === "ativo");
  const convites = vs.filter(v => v.status === "pendente" && v.iniciadoPor === "paciente");
  const aguardando = vs.filter(v => v.status === "pendente" && v.iniciadoPor === "profissional");
  const hoje = S.hojeStr();
  const faltas = u.papel === "cuidador" ? ativos.flatMap(v => S.dosesDoDia(v.pacienteId, hoje).filter(d => d.estado === "nao_tomada").map(d => ({ ...d, pac: S.usuario(v.pacienteId) }))) : [];
  let corpo = "";
  if (faltas.length) corpo += `<section aria-labelledby="t-avisos"><h2 id="t-avisos" style="margin-bottom:12px">Avisos</h2><div class="stack">${faltas.map(f =>
    `<div class="alert alert-danger">${ic("alerta")}<div class="grow"><b>${esc(f.pac.nome)} não confirmou a dose das ${f.hora}</b><div>${esc(f.med.nome)} · ${esc(f.med.dose)} · sem confirmação há mais de 60 minutos</div>
      <div class="row wrap" style="margin-top:8px"><a class="btn btn-secondary btn-sm" href="#/pacientes/${f.pac.id}">Ver ficha</a><a class="btn btn-secondary btn-sm" href="mailto:${esc(f.pac.email)}?subject=${encodeURIComponent("Dose das " + f.hora)}">Enviar e-mail</a></div></div></div>`).join("")}</div></section>`;
  if (convites.length) corpo += `<section class="${faltas.length ? "section" : ""}"><h2 style="margin-bottom:12px">Convites recebidos</h2><div class="panel"><ul class="list">${convites.map(v => { const p = S.usuario(v.pacienteId); return `<li style="flex-wrap:wrap"><div class="grow" style="min-width:200px"><b>${esc(p?.nome)}</b> convidou você para acompanhá-lo como ${v.papel === "medico" ? "médico(a) responsável" : "cuidador(a)"}.</div><div class="row"><button class="btn btn-secondary btn-sm" data-recusar="${v.id}">Recusar</button><button class="btn btn-primary btn-sm" data-aceitar="${v.id}">Aceitar</button></div></li>`; }).join("")}</ul></div></section>`;
  corpo += `<section class="${faltas.length || convites.length ? "section" : ""}"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Meus pacientes</h2><a class="btn btn-secondary btn-sm" href="#/buscar">${ic("busca")}Buscar paciente</a></div>`;
  corpo += ativos.length
    ? `<div class="panel"><ul class="list">${ativos.map(v => { const p = S.usuario(v.pacienteId); const ds = S.dosesDoDia(p.id, hoje); const n = ds.filter(d => d.estado === "nao_tomada").length; const t = ds.filter(d => d.estado === "tomada").length;
        return `<li><a class="li-link" href="#/pacientes/${p.id}"><div class="grow"><div class="trunc"><b>${esc(p.nome)}</b></div><div class="small muted">${S.medsDe(p.id).length} remédios · hoje ${t} de ${ds.length} doses tomadas</div></div>${n ? statusTag("nao_tomada", n + " não tomada" + (n > 1 ? "s" : "")) : statusTag("tomada", "Em dia")}<span class="muted">${ic("seta", 'width="20" height="20"')}</span></a></li>`; }).join("")}</ul></div>`
    : `<div class="panel"><div class="empty">${ic("pessoas")}<h3>Nenhum paciente vinculado</h3><p>Busque o paciente pelo e-mail e envie um pedido. Você verá os dados depois que ele aceitar.</p><a class="btn btn-primary" href="#/buscar">${ic("busca")}Buscar paciente</a></div></div>`;
  corpo += `</section>`;
  if (aguardando.length) corpo += `<section class="section"><h2 style="margin-bottom:12px">Pedidos enviados</h2><div class="panel"><ul class="list">${aguardando.map(v => `<li><div class="grow trunc"><b>${esc(S.usuario(v.pacienteId)?.nome)}</b></div><span class="status st-pendente">Aguardando o paciente</span></li>`).join("")}</ul></div></section>`;
  app.innerHTML = layout(u, `Olá, ${primeiroNome(u.nome)}`, corpo, "/pacientes");
  app.querySelectorAll("[data-aceitar]").forEach(b => b.onclick = () => { S.responder(b.dataset.aceitar, true); render(); toast("Convite aceito."); });
  app.querySelectorAll("[data-recusar]").forEach(b => b.onclick = () => { S.responder(b.dataset.recusar, false); render(); toast("Convite recusado."); });
}, { papel: ["medico", "cuidador"] });

// ================= T16 Buscar paciente =================
rota("/buscar", "T16", u => {
  const desenha = (msg, achado, email = "") => {
    const corpo = `<form class="panel panel-b" novalidate style="max-width:560px">
      <p class="t2">Digite o e-mail que o paciente usa no Dose Dupla. Ele recebe seu pedido e decide se aceita.</p>
      <div class="field"><label for="bemail">E-mail do paciente</label><div class="row"><input id="bemail" type="email" value="${esc(email)}" class="grow"><button class="btn btn-secondary">${ic("busca")}Buscar</button></div>${msg ? erroCampo(msg) : ""}</div>
      ${achado ? (() => { const ja = S.vinculosDoProf(u.id).find(v => v.pacienteId === achado.id && ["ativo", "pendente"].includes(v.status));
        if (ja) return `<div class="panel panel-b" style="background:var(--surface-2)"><b>${esc(achado.nome)}</b><div class="small muted">${esc(achado.email)}</div>
          <div class="linha2" style="margin:8px 0 12px">${ja.status === "ativo" ? statusTag("tomada", "Você já acompanha este paciente") : `<span class="status st-pendente">${ja.iniciadoPor === "paciente" ? "Convite do paciente esperando sua resposta" : "Pedido enviado, aguardando o paciente"}</span>`}</div>
          <a class="btn btn-primary" href="#/${ja.status === "ativo" ? "pacientes/" + achado.id : "pacientes"}">${ja.status === "ativo" ? "Abrir ficha" : "Ver em Meus pacientes"}</a></div>`;
        return `<div class="panel panel-b" style="background:var(--surface-2)"><b>${esc(achado.nome)}</b><div class="small muted">${esc(achado.email)}</div>
        <p class="small t2" style="margin:8px 0 12px">Você só verá os remédios e o histórico depois que ${esc(primeiroNome(achado.nome))} aceitar.</p>
        <button type="button" class="btn btn-primary" data-pedir>Enviar pedido para acompanhar</button></div>`; })() : ""}
    </form>`;
    app.innerHTML = layout(u, "Buscar paciente", corpo, "/buscar");
    $("form").onsubmit = e => { e.preventDefault(); const em = $("#bemail").value.trim().toLowerCase(); const p = S.porEmail(em);
      if (!p || p.papel !== "paciente") return desenha("Não encontramos paciente com este e-mail. Confira com ele o e-mail usado no app.", null, em);
      desenha(null, p, em); };
    $("[data-pedir]")?.addEventListener("click", () => { const r = S.profissionalPede(u.id, achado.email); if (r.erro) return desenha(r.erro, achado, achado.email); ir("/pacientes"); toast("Pedido enviado. Aguardando o paciente aceitar."); });
  };
  desenha();
}, { papel: ["medico", "cuidador"] });

// ================= T17 Ficha do paciente =================
rota("/pacientes/:id", "T17", (u, pid) => {
  const v = S.vinculoAtivo(pid, u.id);
  if (!v) { app.innerHTML = layout(u, "Paciente", `<div class="panel"><div class="empty">${ic("escudo")}<h3>Sem acesso a este paciente</h3><p>Você só vê os dados de pacientes que aceitaram o vínculo.</p><a class="btn btn-primary" href="#/pacientes">Voltar</a></div></div>`, "/pacientes", "/pacientes"); return; }
  const p = S.usuario(pid);
  S.registrarAcesso(pid, u.id, "Abriu a ficha (remédios e histórico)");
  const st = { aba: "hoje", dias: 7, filtro: "" };
  const desenha = () => {
    const meds = S.medsDe(pid); const doses = S.dosesDoDia(pid, S.hojeStr());
    let aba = "";
    if (st.aba === "hoje") aba = doses.length ? `<div class="panel"><ul class="list">${doses.map(d => `<li><span class="hora">${d.hora}</span><div class="grow"><div class="trunc"><b>${esc(d.med.nome)}</b> <span class="muted small">${esc(d.dose)}</span></div><div class="linha2">${statusTag(d.estado, d.estado === "tomada" ? "Tomada às " + hhmm(d.reg.tomadaEm) : null)}</div></div></li>`).join("")}</ul></div>` : `<div class="panel"><div class="empty"><h3>Sem doses hoje</h3></div></div>`;
    if (st.aba === "remedios") aba = meds.length ? `${blocoInteracoes(meds, "prof")}<div class="panel"><ul class="list">${linhasMeds(meds, false)}</ul></div>` : `<div class="panel"><div class="empty"><h3>Nenhum remédio cadastrado</h3></div></div>`;
    if (st.aba === "historico") aba = filtrosHistorico(pid, st.dias, st.filtro) + historicoHTML(pid, st.dias, st.filtro);
    const corpo = `<div class="small t2" style="margin-bottom:12px">${esc(p.email)} · você acompanha como ${v.papel === "medico" ? "médico(a) responsável" : "cuidador(a)"}</div>
      ${(() => { const pares = paresDaLista(meds); return pares.length && st.aba !== "remedios" ? `<div class="alert alert-${piorGravidade(pares) === "grave" ? "danger" : "warn"}" style="margin-bottom:12px">${ic("alerta")}<div><b>${pares.length} possível${pares.length > 1 ? "is" : ""} interaç${pares.length > 1 ? "ões" : "ão"} entre os remédios em uso</b> (${pares.map(x => esc(x.a) + " + " + esc(x.b)).join("; ")}).<br><button class="btn btn-secondary btn-sm" data-aba="remedios">Ver detalhes</button></div></div>` : ""; })()}
      <div class="alert alert-info" style="margin-bottom:16px">${ic("escudo")}<span>Este acesso foi registrado e ${esc(primeiroNome(p.nome))} pode ver quem abriu os dados dele.</span></div>
      <div class="tabs" role="tablist">${[["hoje", "Hoje"], ["remedios", "Remédios"], ["historico", "Histórico"]].map(([k, t]) => `<button role="tab" aria-selected="${st.aba === k}" data-aba="${k}">${t}</button>`).join("")}</div>${aba}`;
    app.innerHTML = layout(u, p.nome, corpo, "/pacientes", "/pacientes");
    app.querySelectorAll("[data-aba]").forEach(b => b.onclick = () => { st.aba = b.dataset.aba; desenha(); });
    if (st.aba === "historico") ligarFiltros(st, desenha);
  };
  desenha();
}, { papel: ["medico", "cuidador"] });

// ================= T10 Lembretes (RF05, RF16) =================
// Com o app aberto, confere a cada 20 s. Notificação com o app fechado depende de push
// pelo servidor (fora deste protótipo); a tela T10 aparece dentro do app.
const avisados = new Set(JSON.parse(sessionStorage.getItem("dd-avisados") || "[]"));
function marcaAvisado(k) { avisados.add(k); try { sessionStorage.setItem("dd-avisados", JSON.stringify([...avisados])); } catch {} }
async function notificar(titulo, corpo, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) reg.showNotification(titulo, { body: corpo, tag, icon: "icon.svg", badge: "icon.svg" }); else new Notification(titulo, { body: corpo, tag }); } catch {}
}
function verificarLembretes() {
  const u = S.usuarioAtual(); if (!u || !u.consentimento) return;
  const hoje = S.hojeStr();
  if (u.papel === "paciente") {
    const devidas = S.dosesDoDia(u.id, hoje).filter(d => d.estado === "atrasada" && !avisados.has(d.chave));
    if (!devidas.length || document.querySelector(".modal-bg")) return;
    devidas.forEach(d => marcaAvisado(d.chave));
    notificar("Hora do seu remédio", devidas.map(d => `${d.med.nome} ${d.dose} · ${d.hora}`).join("\n"), "dose-" + hoje);
    const m = modal(`<div class="row" style="margin-bottom:8px;color:var(--brand)">${ic("sino", 'width="28" height="28"')}<h2 id="modal-t">Hora do seu remédio</h2></div>
      <div class="panel"><ul class="list">${devidas.map(d => `<li><span class="hora">${d.hora}</span><div class="grow"><b>${esc(d.med.nome)}</b><div class="small muted">${esc(d.dose)}${d.med.obs ? " · " + esc(d.med.obs) : ""}</div></div></li>`).join("")}</ul></div>
      <div class="modal-acoes"><button class="btn btn-secondary" data-depois>Lembrar em 10 min</button><button class="btn btn-primary" data-tomei autofocus>${ic("check")}Tomei</button></div>`);
    m.querySelector("[data-tomei]").onclick = () => { devidas.forEach(d => S.confirmarDose(d.med.id, d.dia, d.hora)); fecharModal(); render(); toast("Dose registrada."); };
    m.querySelector("[data-depois]").onclick = () => { fecharModal(); setTimeout(() => { devidas.forEach(d => { avisados.delete(d.chave); }); verificarLembretes(); }, 10 * 60000); toast("Vamos lembrar de novo em 10 minutos."); };
  } else if (u.papel === "cuidador") {
    S.vinculosDoProf(u.id).filter(v => v.status === "ativo").forEach(v => {
      const p = S.usuario(v.pacienteId);
      S.dosesDoDia(p.id, hoje).filter(d => d.estado === "nao_tomada" && !avisados.has("c|" + d.chave)).forEach(d => {
        marcaAvisado("c|" + d.chave);
        const recente = (new Date() - S.dataHora(d.dia, d.hora)) / 60000 < 75;
        if (recente) notificar(`${p.nome} não confirmou uma dose`, `${d.med.nome} das ${d.hora} · sem confirmação há 60 minutos`, "falta-" + d.chave);
      });
    });
  }
}
setInterval(() => { verificarLembretes(); if (!document.querySelector(".modal-bg") && /^#\/(hoje|pacientes)$/.test(location.hash)) render({ silencioso: true }); }, 20000);

// ================= início =================
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
D.carregarBase().then(ok => {
  render(); setTimeout(verificarLembretes, 800);
  if (!ok) toast("Não foi possível carregar a base de interações. Verifique a internet.");
});
