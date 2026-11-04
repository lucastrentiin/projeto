// Base de medicamentos e interações.
// Fica em dados/interacoes.json, separada do código: para atualizar a base basta trocar
// esse arquivo, sem mudar o app (RNF14). O app baixa a versão mais nova ao abrir e guarda
// uma cópia para funcionar sem internet.
// A base atual é reduzida e serve só para demonstração acadêmica: NÃO substitui bula,
// farmacêutico ou médico (RNF03).

export let CATALOGO = [];
let INTERACOES = [];
export let BASE = { versao: "?", fonte: "" };

const CHAVE = "dosedupla:base";
function usar(b) {
  BASE = { versao: b.versao, fonte: b.fonte };
  CATALOGO = b.medicamentos;
  INTERACOES = b.interacoes;
}
export async function carregarBase() {
  try {
    const r = await fetch("dados/interacoes.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    const b = await r.json(); usar(b);
    try { localStorage.setItem(CHAVE, JSON.stringify(b)); } catch {}
    return true;
  } catch {
    try { const c = localStorage.getItem(CHAVE); if (c) { usar(JSON.parse(c)); return true; } } catch {}
    return false;
  }
}

export function normaliza(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

// Reconhece o princípio ativo pelo início do nome digitado ("Losartana potássica" -> Losartana)
export function reconhece(nome) {
  const n = normaliza(nome);
  if (!n) return null;
  return CATALOGO.find(c => n === normaliza(c) || n.startsWith(normaliza(c))) || null;
}

const ORDEM = { grave: 0, moderada: 1, leve: 2 };
export const piorGravidade = lista => lista.reduce((p, i) => (p === null || ORDEM[i.gravidade] < ORDEM[p] ? i.gravidade : p), null);

// Verifica o medicamento novo contra a lista atual (RF06, RF13, RF14)
export function verificaInteracoes(nomeNovo, meds) {
  const a = reconhece(nomeNovo);
  if (!a) return { reconhecido: false, lista: [] };
  const lista = [];
  for (const m of meds) {
    const b = reconhece(m.nome);
    if (!b || b === a) continue;
    for (const i of INTERACOES) {
      if ((i.a === a && i.b === b) || (i.a === b && i.b === a)) lista.push({ com: m.nome, comId: m.id, gravidade: i.gravidade, texto: i.texto });
    }
  }
  lista.sort((p, q) => ORDEM[p.gravidade] - ORDEM[q.gravidade]);
  return { reconhecido: true, principio: a, lista };
}

// Interações entre todos os remédios em uso: { [medId]: [{com, gravidade, texto}] }
export function interacoesDaLista(meds) {
  const mapa = {};
  for (const m of meds) {
    const r = verificaInteracoes(m.nome, meds.filter(x => x.id !== m.id));
    mapa[m.id] = { reconhecido: r.reconhecido, lista: r.lista };
  }
  return mapa;
}
// Pares únicos, para mostrar em lista
export function paresDaLista(meds) {
  const vistos = new Set(); const pares = [];
  const mapa = interacoesDaLista(meds);
  for (const m of meds) for (const i of mapa[m.id].lista) {
    const k = [m.id, i.comId].sort().join("|"); if (vistos.has(k)) continue; vistos.add(k);
    pares.push({ a: m.nome, b: i.com, gravidade: i.gravidade, texto: i.texto });
  }
  return pares.sort((p, q) => ORDEM[p.gravidade] - ORDEM[q.gravidade]);
}
