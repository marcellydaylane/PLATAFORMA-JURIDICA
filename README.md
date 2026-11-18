# AUDIT JURÍDICA AI — versão web 1.0

Aplicação web responsiva com módulos de auditoria jurídica, leitura de PDF/DOCX/TXT e análise via OpenAI Responses API.

## O que está implementado
- Revisão jurídica, cláusulas, SWOT, análise econômica, recomendações e relatório final.
- Auditoria de procurações e documentos imobiliários.
- Comparação de duas versões/textos.
- Upload de até 2 arquivos PDF, DOCX ou TXT (12 MB cada).
- Exportação simples do resultado em TXT e cópia para área de transferência.
- Chave da API mantida no servidor, nunca no navegador.

## Requisitos
- Node.js 20+
- Chave de API da OpenAI com faturamento/créditos habilitados.

## Rodar localmente
1. Extraia o ZIP.
2. Abra um terminal na pasta do projeto.
3. Execute `npm install`.
4. Copie `.env.example` para `.env` e preencha `OPENAI_API_KEY`.
5. Execute `npm start`.
6. Acesse `http://localhost:3000`.

No Windows PowerShell, para copiar o arquivo: `Copy-Item .env.example .env`.

## Publicar com link (Render)
1. Crie uma conta em https://render.com e um repositório no GitHub.
2. Envie os arquivos deste projeto para o repositório.
3. No Render, escolha **New > Blueprint** e conecte o repositório.
4. O Render identificará `render.yaml` e criará o serviço.
5. Em Environment, informe `OPENAI_API_KEY` com sua chave secreta.
6. Aguarde o deploy. O Render fornecerá uma URL pública `https://...onrender.com`.

Não coloque sua chave de API no GitHub, no HTML ou em mensagens públicas. Configure-a apenas como variável secreta no painel do Render.

## Observações importantes
- Esta é uma primeira versão funcional, não um sistema jurídico certificado.
- O módulo de legislação/jurisprudência não faz pesquisa automática em bases oficiais nesta versão. A IA deve sinalizar pontos que precisam de validação.
- O conteúdo dos arquivos é enviado ao provedor de IA para processamento. Não use documentos sigilosos ou dados pessoais sem base legal, autorização, controles de acesso e avaliação de segurança/LGPD.
- Antes de uso profissional, implemente autenticação, segregação por usuário, política de retenção, criptografia/gestão de segredos, logs sem conteúdo sensível, backup e revisão de segurança.
- O modelo pode ser alterado pela variável `OPENAI_MODEL`, conforme os modelos habilitados na sua conta.
