// Camada de dados e regras de negócio do protótipo.
// Sem servidor: os dados ficam no navegador (localStorage). Em produção, estas funções
// virariam chamadas a uma API HTTPS com autorização no servidor (RNF04).

const CHAVE = "dosedupla:v1";
const vazio = () => ({ users: [], meds: [], doses: [], vinculos: [], acessos: [], resets: [], sessao: null });

let db = carregar();
function carregar() {
  try { const t = localStorage.getItem(CHAVE); return t ? { ...vazio(), ...JSON.parse(t) } : vazio(); }
  catch { return vazio(); }
}
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* armazenamento indisponível */ } }
export function recarregar() { db = carregar(); }

const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const agoraIso = () => new Date().toISOString();

// ---------- datas ----------
export function hojeStr(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDias(str, n) { const d = new Date(str + "T12:00:00"); d.setDate(d.getDate() + n); return hojeStr(d); }
export function dataHora(dia, hora) { return new Date(`${dia}T${hora}:00`); }

// ---------- senha (RNF01) ----------
async function hash(senha, salt) {
  const dados = new TextEncoder().encode(salt + ":" + senha);
  const buf = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export function senhaFraca(s) {
  if (s.length < 8) return "Use pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(s) || !/\d/.test(s)) return "Use letras e números.";
  return null;
}
const emailOk = e => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e);

// ---------- contas (RF02, RF11, RF17) ----------
export function usuarioAtual() { return db.users.find(u => u.id === db.sessao) || null; }
export function usuario(uid) { return db.users.find(u => u.id === uid) || null; }
export function porEmail(e) { return db.users.find(u => u.email === String(e).trim().toLowerCase()) || null; }

export async function criarConta({ nome, email, senha, papel, registro }) {
  const erros = {};
  email = String(email).trim().toLowerCase();
  if (!nome.trim()) erros.nome = "Informe seu nome.";
  if (!emailOk(email)) erros.email = "Digite um e-mail válido, como nome@exemplo.com.";
  else if (porEmail(email)) erros.email = "Este e-mail já tem conta. Entre ou recupere a senha.";
  const f = senhaFraca(senha); if (f) erros.senha = "Senha fraca. " + f;
  if (papel === "medico" && !String(registro || "").trim()) erros.registro = "Informe o CRM.";
  if (Object.keys(erros).length) return { erros };
  const salt = id();
  const u = { id: id(), nome: nome.trim(), email, papel, registro: (registro || "").trim(), salt,
    hash: await hash(senha, salt), criadoEm: agoraIso(), consentimento: null, prefs: { fonte: 1, contraste: false } };
  db.users.push(u);
  // convites feitos para este e-mail antes de a conta existir passam a apontar para ela
  db.vinculos.forEach(v => { if (v.profEmail === email && !v.profId) v.profId = u.id; });
  db.sessao = u.id; salvar();
  return { usuario: u };
}

export async function entrar(email, senha) {
  const u = porEmail(email);
  if (!u || (await hash(senha, u.salt)) !== u.hash) return { erro: "E-mail ou senha incorretos." };
  db.sessao = u.id; salvar(); return { usuario: u };
}
export function sair() { db.sessao = null; salvar(); }

export function pedirReset(email) {
  const u = porEmail(email);
  if (!u) return null; // a tela mostra a mesma mensagem, para não revelar se o e-mail existe
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  db.resets = db.resets.filter(r => r.email !== u.email);
  db.resets.push({ email: u.email, codigo, expira: Date.now() + 30 * 60000 });
  salvar(); return codigo;
}
export async function redefinirSenha(email, codigo, nova) {
  email = String(email).trim().toLowerCase();
  const r = db.resets.find(x => x.email === email && x.codigo === String(codigo).trim());
  if (!r || r.expira < Date.now()) return { erro: "Código inválido ou vencido. Peça um novo." };
  const f = senhaFraca(nova); if (f) return { erro: "Senha fraca. " + f };
  const u = porEmail(email); u.salt = id(); u.hash = await hash(nova, u.salt);
  db.resets = db.resets.filter(x => x !== r); salvar(); return { ok: true };
}

export function atualizarUsuario(campos) { Object.assign(usuarioAtual(), campos); salvar(); }
export function excluirConta() {
  const u = usuarioAtual(); if (!u) return;
  const minhas = db.meds.filter(m => m.pacienteId === u.id).map(m => m.id);
  db.meds = db.meds.filter(m => m.pacienteId !== u.id);
  db.doses = db.doses.filter(d => !minhas.includes(d.medId));
  db.vinculos = db.vinculos.filter(v => v.pacienteId !== u.id && v.profId !== u.id);
  db.acessos = db.acessos.filter(a => a.pacienteId !== u.id && a.quemId !== u.id);
  db.users = db.users.filter(x => x.id !== u.id); db.sessao = null; salvar();
}
export function exportarMeusDados() {
  const u = usuarioAtual();
  const meds = db.meds.filter(m => m.pacienteId === u.id);
  return { conta: { nome: u.nome, email: u.email, papel: u.papel, criadoEm: u.criadoEm, consentimento: u.consentimento },
    medicamentos: meds, doses: db.doses.filter(d => d.pacienteId === u.id),
    vinculos: db.vinculos.filter(v => v.pacienteId === u.id || v.profId === u.id),
    acessosAosMeusDados: db.acessos.filter(a => a.pacienteId === u.id) };
}

// ---------- medicamentos (RF01, RF09) ----------
export function medsDe(pid) { return db.meds.filter(m => m.pacienteId === pid && m.ativo).sort((a, b) => a.nome.localeCompare(b.nome)); }
export function med(mid) { return db.meds.find(m => m.id === mid) || null; }
export function validaMed({ nome, dose, horarios }) {
  const e = {};
  if (!String(nome).trim()) e.nome = "Informe o nome do medicamento.";
  if (!String(dose).trim()) e.dose = "Informe a dose, por exemplo 50 mg ou 1 comprimido.";
  if (!horarios.length) e.horarios = "Adicione pelo menos um horário.";
  return e;
}
export function salvarMed(pid, dados, mid) {
  const limpo = { nome: dados.nome.trim(), dose: dados.dose.trim(), horarios: [...new Set(dados.horarios)].sort(), obs: (dados.obs || "").trim() };
  const ciencia = dados.ciencia ? { em: agoraIso(), lista: dados.ciencia } : null; // interações aceitas pelo paciente ao salvar
  if (mid) {
    const m = med(mid);
    // guarda a dose antiga para o histórico continuar mostrando a dose da época
    if (m.dose !== limpo.dose) (m.historicoDose ||= []).push({ ate: agoraIso(), dose: m.dose });
    Object.assign(m, limpo, { atualizadoEm: agoraIso() }); if (ciencia) m.ciencia = ciencia;
    salvar(); return m;
  }
  const m = { id: id(), pacienteId: pid, ...limpo, inicio: hojeStr(), criadoEm: agoraIso(), atualizadoEm: agoraIso(), ativo: true, ciencia };
  db.meds.push(m); salvar(); return m;
}
export function removerMed(mid) { const m = med(mid); if (m) { m.ativo = false; m.fim = hojeStr(); salvar(); } }

// ---------- doses (RF05, RF12, RF15, RF16) ----------
export const ANTECEDENCIA_MIN = 30; // "Tomei" libera 30 min antes do horário
export function doseEm(m, quando) {
  const h = (m.historicoDose || []).find(x => new Date(x.ate) > quando);
  return h ? h.dose : m.dose;
}
// estado: tomada | pendente | atrasada (até 60 min) | nao_tomada (mais de 60 min)
export function dosesDoDia(pid, dia, agora = new Date()) {
  const lista = [];
  for (const m of db.meds.filter(x => x.pacienteId === pid)) {
    if (m.inicio > dia || (m.fim && m.fim < dia) || (!m.ativo && !m.fim)) continue;
    for (const h of m.horarios) {
      const reg = db.doses.find(d => d.medId === m.id && d.data === dia && d.hora === h);
      const quando = dataHora(dia, h);
      if (!reg && quando < new Date(m.criadoEm)) continue; // horário anterior ao cadastro do remédio
      const min = (agora - quando) / 60000;
      let estado = reg ? "tomada" : min < 0 ? "pendente" : min <= 60 ? "atrasada" : "nao_tomada";
      lista.push({ med: m, hora: h, dia, estado, reg, chave: `${m.id}|${dia}|${h}`,
        dose: reg?.dose || doseEm(m, quando), podeConfirmar: !reg && min >= -ANTECEDENCIA_MIN,
        liberaAs: new Date(quando - ANTECEDENCIA_MIN * 60000).toTimeString().slice(0, 5) });
    }
  }
  return lista.sort((a, b) => a.hora.localeCompare(b.hora) || a.med.nome.localeCompare(b.med.nome));
}
export function confirmarDose(medId, dia, hora) {
  const m = med(medId);
  if (db.doses.some(d => d.medId === medId && d.data === dia && d.hora === hora)) return { ok: true };
  const quando = dataHora(dia, hora);
  if (Date.now() < quando - ANTECEDENCIA_MIN * 60000) return { erro: `Esta dose só pode ser confirmada a partir de 30 minutos antes do horário.` };
  db.doses.push({ id: id(), medId, pacienteId: m.pacienteId, data: dia, hora, dose: doseEm(m, quando), tomadaEm: agoraIso() }); salvar();
  return { ok: true };
}
export function desfazerDose(medId, dia, hora) {
  db.doses = db.doses.filter(d => !(d.medId === medId && d.data === dia && d.hora === hora)); salvar();
}

// ---------- vínculos (RF03, RF04, RF07, RF08) ----------
export function vinculosDoPaciente(pid) { return db.vinculos.filter(v => v.pacienteId === pid && v.status !== "encerrado"); }
export function vinculosDoProf(uid) { return db.vinculos.filter(v => v.profId === uid && v.status !== "encerrado"); }
export function vinculoAtivo(pid, uid) { return db.vinculos.find(v => v.pacienteId === pid && v.profId === uid && v.status === "ativo"); }

// paciente convida (história 9) — quem aceita é o convidado
export function pacienteConvida(pid, email, papel) {
  email = String(email).trim().toLowerCase();
  if (!emailOk(email)) return { erro: "Digite um e-mail válido." };
  const prof = porEmail(email);
  if (prof && prof.id === pid) return { erro: "Você não pode convidar a si mesmo." };
  if (prof && prof.papel !== papel) return { erro: `Esta conta está cadastrada como ${NOME_PAPEL[prof.papel].toLowerCase()}, não como ${NOME_PAPEL[papel].toLowerCase()}.` };
  if (db.vinculos.some(v => v.pacienteId === pid && v.profEmail === email && ["pendente", "ativo"].includes(v.status))) return { erro: "Já existe um convite ou vínculo com este e-mail." };
  db.vinculos.push({ id: id(), pacienteId: pid, profEmail: email, profId: prof ? prof.id : null, papel, iniciadoPor: "paciente", status: "pendente", criadoEm: agoraIso() });
  salvar(); return { ok: true, temConta: !!prof };
}
// médico ou cuidador pede (histórias 6 e 8) — quem aceita é o paciente
export function profissionalPede(uid, emailPaciente) {
  const p = porEmail(emailPaciente); const eu = usuario(uid);
  if (!p || p.papel !== "paciente") return { erro: "Não encontramos paciente com este e-mail." };
  if (db.vinculos.some(v => v.pacienteId === p.id && v.profId === uid && ["pendente", "ativo"].includes(v.status))) return { erro: "Você já tem um pedido ou vínculo com este paciente." };
  db.vinculos.push({ id: id(), pacienteId: p.id, profEmail: eu.email, profId: uid, papel: eu.papel, iniciadoPor: "profissional", status: "pendente", criadoEm: agoraIso() });
  salvar(); return { ok: true, paciente: p };
}
export function medicoAtivo(pid) { return db.vinculos.find(v => v.pacienteId === pid && v.papel === "medico" && v.status === "ativo"); }
// RN: o paciente tem um único médico responsável; aceitar outro substitui o atual
export function responder(vid, aceita) {
  const v = db.vinculos.find(x => x.id === vid); if (!v) return;
  if (aceita && v.papel === "medico") { const atual = medicoAtivo(v.pacienteId); if (atual && atual !== v) { atual.status = "encerrado"; atual.encerradoEm = agoraIso(); } }
  v.status = aceita ? "ativo" : "recusado"; v.respondidoEm = agoraIso(); salvar();
}
export function encerrar(vid) { const v = db.vinculos.find(x => x.id === vid); if (v) { v.status = "encerrado"; v.encerradoEm = agoraIso(); salvar(); } }

// ---------- log de acesso (RNF07) ----------
export function registrarAcesso(pid, quemId, acao) { db.acessos.push({ id: id(), pacienteId: pid, quemId, acao, quando: agoraIso() }); salvar(); }
export function acessosDe(pid) { return db.acessos.filter(a => a.pacienteId === pid).sort((a, b) => b.quando.localeCompare(a.quando)); }

export const NOME_PAPEL = { paciente: "Paciente", medico: "Médico(a)", cuidador: "Cuidador(a)" };

// ---------- dados de exemplo para validação ----------
export async function criarExemplo() {
  const contas = [
    ["João da Silva", "joao@exemplo.com", "paciente", ""],
    ["Dra. Helena Souza", "helena@exemplo.com", "medico", "CRM/SC 12345"],
    ["Ana Pereira", "ana@exemplo.com", "cuidador", ""],
  ];
  for (const [nome, email] of contas) { const u = porEmail(email); if (u) { db.sessao = u.id; excluirConta(); } }
  const ids = {};
  for (const [nome, email, papel, registro] of contas) {
    const r = await criarConta({ nome, email, senha: "Dose2026", papel, registro }); ids[papel] = r.usuario.id;
  }
  const j = usuario(ids.paciente); j.consentimento = agoraIso();
  usuario(ids.medico).consentimento = agoraIso(); usuario(ids.cuidador).consentimento = agoraIso();
  const inicio = addDias(hojeStr(), -9);
  const meds = [["Losartana", "50 mg", ["08:00", "20:00"]], ["Metformina", "850 mg", ["07:00", "19:00"]], ["Sinvastatina", "20 mg", ["22:00"]]]
    .map(([nome, dose, horarios]) => ({ id: id(), pacienteId: j.id, nome, dose, horarios, obs: "", inicio, criadoEm: dataHora(inicio, "00:00").toISOString(), atualizadoEm: agoraIso(), ativo: true }));
  db.meds.push(...meds);
  const faltas = new Set(["2|19:00", "4|20:00", "6|22:00", "7|20:00"]);
  for (let i = 9; i >= 1; i--) {
    const dia = addDias(hojeStr(), -i);
    for (const m of meds) for (const h of m.horarios) {
      if (faltas.has(`${i}|${h}`)) continue;
      const t = dataHora(dia, h); t.setMinutes(t.getMinutes() + ((i * 7 + h.length) % 25));
      db.doses.push({ id: id(), medId: m.id, pacienteId: j.id, data: dia, hora: h, dose: m.dose, tomadaEm: t.toISOString() });
    }
  }
  db.vinculos.push({ id: id(), pacienteId: j.id, profEmail: "ana@exemplo.com", profId: ids.cuidador, papel: "cuidador", iniciadoPor: "profissional", status: "ativo", criadoEm: agoraIso(), respondidoEm: agoraIso() });
  db.vinculos.push({ id: id(), pacienteId: j.id, profEmail: "helena@exemplo.com", profId: ids.medico, papel: "medico", iniciadoPor: "profissional", status: "pendente", criadoEm: agoraIso() });
  db.sessao = null; salvar();
}
export function apagarTudo() { db = vazio(); salvar(); }
