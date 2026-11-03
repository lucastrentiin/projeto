// Base de medicamentos e interações usada pelo protótipo.
// Conjunto reduzido, montado só para demonstração acadêmica: NÃO substitui bula,
// farmacêutico ou médico. Em produção, a fonte seria uma base reconhecida e atualizável (RNF03, RNF14).

export const CATALOGO = [
  "AAS", "Amiodarona", "Anlodipino", "Atenolol", "Captopril", "Carbonato de cálcio",
  "Claritromicina", "Clopidogrel", "Diclofenaco", "Digoxina", "Dipirona", "Enalapril",
  "Espironolactona", "Fluoxetina", "Furosemida", "Glibenclamida", "Hidroclorotiazida",
  "Ibuprofeno", "Insulina NPH", "Isossorbida", "Levotiroxina", "Losartana", "Metformina",
  "Naproxeno", "Omeprazol", "Paracetamol", "Prednisona", "Sertralina", "Sildenafila",
  "Sinvastatina", "Sulfato ferroso", "Tramadol", "Varfarina"
];

// g: leve | moderada | grave
export const INTERACOES = [
  ["Varfarina", "AAS", "grave", "Aumenta muito o risco de sangramento."],
  ["Varfarina", "Ibuprofeno", "grave", "Aumenta muito o risco de sangramento, inclusive no estômago."],
  ["Varfarina", "Diclofenaco", "grave", "Aumenta muito o risco de sangramento."],
  ["Varfarina", "Naproxeno", "grave", "Aumenta muito o risco de sangramento."],
  ["Varfarina", "Paracetamol", "moderada", "Uso frequente de paracetamol pode aumentar o efeito da varfarina."],
  ["Sildenafila", "Isossorbida", "grave", "Pode causar queda forte da pressão arterial."],
  ["Sertralina", "Tramadol", "grave", "Risco de síndrome serotoninérgica e de convulsões."],
  ["Fluoxetina", "Tramadol", "grave", "Risco de síndrome serotoninérgica e de convulsões."],
  ["Sinvastatina", "Claritromicina", "grave", "Aumenta o risco de dano muscular grave."],
  ["Digoxina", "Amiodarona", "grave", "Pode elevar a digoxina no sangue a níveis tóxicos."],
  ["Enalapril", "Espironolactona", "grave", "Pode elevar o potássio no sangue a níveis perigosos."],
  ["Losartana", "Espironolactona", "moderada", "Pode elevar o potássio no sangue."],
  ["Losartana", "Ibuprofeno", "moderada", "Pode reduzir o efeito sobre a pressão e sobrecarregar os rins."],
  ["Losartana", "Diclofenaco", "moderada", "Pode reduzir o efeito sobre a pressão e sobrecarregar os rins."],
  ["Enalapril", "Ibuprofeno", "moderada", "Pode reduzir o efeito sobre a pressão e sobrecarregar os rins."],
  ["Captopril", "Ibuprofeno", "moderada", "Pode reduzir o efeito sobre a pressão e sobrecarregar os rins."],
  ["Clopidogrel", "Omeprazol", "moderada", "O omeprazol pode reduzir o efeito do clopidogrel."],
  ["Clopidogrel", "AAS", "moderada", "Aumenta o risco de sangramento; o uso conjunto deve ser orientado pelo médico."],
  ["AAS", "Ibuprofeno", "moderada", "Aumenta o risco de sangramento e pode reduzir o efeito protetor do AAS."],
  ["Sinvastatina", "Anlodipino", "moderada", "Pode aumentar o efeito da sinvastatina; costuma exigir dose limitada."],
  ["Metformina", "Prednisona", "moderada", "A prednisona pode aumentar a glicose e reduzir o controle do diabetes."],
  ["Glibenclamida", "Prednisona", "moderada", "A prednisona pode aumentar a glicose e reduzir o controle do diabetes."],
  ["Levotiroxina", "Carbonato de cálcio", "moderada", "Reduz a absorção da levotiroxina. Tomar com 4 horas de intervalo."],
  ["Levotiroxina", "Sulfato ferroso", "moderada", "Reduz a absorção da levotiroxina. Tomar com 4 horas de intervalo."],
  ["Levotiroxina", "Omeprazol", "leve", "Pode reduzir um pouco a absorção da levotiroxina."],
  ["Atenolol", "Ibuprofeno", "leve", "Pode reduzir um pouco o efeito sobre a pressão."],
  ["Furosemida", "Ibuprofeno", "leve", "Pode reduzir um pouco o efeito diurético."],
];

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

// Verifica o medicamento novo contra a lista atual (RF06, RF13, RF14)
export function verificaInteracoes(nomeNovo, meds) {
  const a = reconhece(nomeNovo);
  if (!a) return { reconhecido: false, lista: [] };
  const lista = [];
  for (const m of meds) {
    const b = reconhece(m.nome);
    if (!b || b === a) continue;
    for (const [x, y, g, t] of INTERACOES) {
      if ((x === a && y === b) || (x === b && y === a)) lista.push({ com: m.nome, gravidade: g, texto: t });
    }
  }
  lista.sort((p, q) => ORDEM[p.gravidade] - ORDEM[q.gravidade]);
  return { reconhecido: true, principio: a, lista };
}
