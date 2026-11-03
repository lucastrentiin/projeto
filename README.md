# Dose Dupla — protótipo (E3)

Aplicação web estática, sem build. Os dados ficam no navegador (localStorage).

- `index.html` — o app (T01 a T19). Use `index.html?telas` para mostrar o número de cada tela.
- `e3.html` — documentação da E3: fluxo, matriz telas × histórias × requisitos, roteiro e registro de validação.
- `js/store.js` — dados e regras; `js/dados.js` — base reduzida de interações (demonstração); `js/app.js` — telas.

## Publicar no Vercel
1. Suba esta pasta para um repositório no GitHub.
2. vercel.com → Add New → Project → importe o repositório → Framework Preset: **Other** → Deploy.

Ou, com o Node instalado, dentro da pasta: `npx vercel --prod`.

## Limitações conhecidas (protótipo)
- Sem servidor: cada navegador tem os próprios dados; vínculos entre contas funcionam no mesmo navegador.
- Recuperação de senha mostra o código na tela, em vez de enviar e-mail.
- Lembrete com o app fechado depende de push pelo servidor (implementação); aqui ele funciona com o app aberto.
- A base de interações é reduzida e serve só para demonstração.
