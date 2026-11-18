import express from "express";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import fs from "node:fs";
import path from "node:path";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const ok = [".pdf", ".docx", ".txt"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Formato não aceito. Envie PDF, DOCX ou TXT."), ok);
  }
});

const modules = {
  clause_analysis: "Analise cláusulas individualmente: clareza, ambiguidades, riscos, omissões, equilíbrio contratual, abusividade e proposta de redação alternativa.",
  legal_review: "Faça revisão jurídica ampla no Direito brasileiro: validade, capacidade, objeto, forma, legislação aplicável, formalidades e entendimentos jurisprudenciais apenas quando puder identificá-los com segurança. Não invente leis, artigos, precedentes ou números de processos.",
  swot_analysis: "Faça análise SWOT do instrumento: forças, fraquezas, oportunidades e ameaças jurídicas, econômicas e operacionais.",
  economic_analysis: "Analise valores, preço, fluxo de pagamento, juros, correção, multas, reajustes, garantias, custos, penalidades e riscos econômicos. Demonstre cálculos quando houver dados suficientes.",
  get_advice: "Apresente recomendações práticas priorizadas e sugestões de redação, distinguindo exigências legais, riscos relevantes e melhorias negociais.",
  real_time_feedback: "Compare as versões/alterações fornecidas, identifique mudanças materiais, riscos criados ou removidos e recomende ajustes.",
  finalize_audit: "Produza relatório técnico final com escopo, resumo executivo, pontos críticos, matriz de riscos, fundamentação, recomendações e conclusão.",
  power_of_attorney: "Audite a procuração: qualificação, capacidade, poderes gerais e especiais, poderes de alienar/onerar/transigir/receber e dar quitação, limites, prazo, revogação, substabelecimento, autocontratação, conflito de interesses e formalidades. Não presuma poderes que não estejam expressos.",
  property_review: "Audite os aspectos imobiliários a partir dos documentos fornecidos: titularidade, continuidade, disponibilidade, descrição, ônus, gravames, indisponibilidades, restrições, enfiteuse, foro/laudêmio e legitimidade dos signatários. Diferencie o que consta do documento do que ainda precisa ser confirmado na serventia competente.",
  compare_contracts: "Compare os dois textos/versões de contrato. Liste inclusões, exclusões, alterações de valor, prazo, obrigações, garantias, penalidades, foro e efeitos jurídicos."
};

const systemPrompt = `Você é AUDIT JURÍDICA AI, assistente de apoio à auditoria documental e contratual no Brasil.
Trabalhe com rigor técnico, linguagem clara e estrutura organizada.
REGRAS OBRIGATÓRIAS:
1) Não invente legislação, artigos, súmulas, jurisprudência, precedentes, decisões ou fatos.
2) Se não puder confirmar a atualidade de uma norma ou precedente, sinalize expressamente que precisa de conferência em fonte oficial.
3) Diferencie nulidade, anulabilidade, ineficácia, risco, irregularidade formal e mera recomendação negocial.
4) Não afirme que um documento é válido ou inválido de forma conclusiva sem todos os elementos necessários.
5) Aponte lacunas documentais e perguntas que precisam ser respondidas.
6) Proteja dados pessoais: recomende anonimização de CPF, RG, endereços, dados bancários e informações sensíveis antes do envio.
7) A resposta é apoio informativo e não substitui revisão de advogado habilitado, conferência de fontes oficiais nem decisão do profissional responsável.
8) Organize a análise em: Resumo; Achados; Riscos (alto/médio/baixo); Fundamentação e ressalvas; Recomendações; Pendências.
Se o pedido tratar de procuração ou imóvel, aplique os critérios específicos pertinentes.`;

async function extractFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf") {
    const result = await pdf(file.buffer);
    return `\\n\\n[ARQUIVO: ${file.originalname}]\\n${result.text}`;
  }
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return `\\n\\n[ARQUIVO: ${file.originalname}]\\n${result.value}`;
  }
  return `\\n\\n[ARQUIVO: ${file.originalname}]\\n${file.buffer.toString("utf8")}`;
}

app.post("/api/audit", upload.array("files", 2), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "A chave da API ainda não foi configurada pelo administrador." });
    const { module, context = "", contract = "", secondText = "" } = req.body;
    if (!modules[module]) return res.status(400).json({ error: "Módulo inválido." });

    let documentText = "";
    for (const f of (req.files || [])) documentText += await extractFile(f);
    const total = (context + contract + secondText + documentText).trim();
    if (!total) return res.status(400).json({ error: "Inclua um texto ou arquivo para iniciar a auditoria." });
    if (total.length > 180000) return res.status(413).json({ error: "O conteúdo excede o limite desta versão. Divida o documento em partes." });

    const input = `${modules[module]}

CONTEXTO INFORMADO:
${context || "Não informado."}

DOCUMENTO / TEXTO PRINCIPAL:
${contract || "Não informado."}

SEGUNDA VERSÃO / TEXTO COMPARATIVO:
${secondText || "Não informado."}

CONTEÚDO EXTRAÍDO DOS ARQUIVOS:
${documentText || "Nenhum arquivo enviado."}

Execute a análise com base somente no material apresentado e no conhecimento jurídico disponível. Marque claramente qualquer ponto que exija pesquisa ou validação externa.`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6",
      instructions: systemPrompt,
      input,
      max_output_tokens: 6000
    });
    res.json({ result: response.output_text || "Não foi possível gerar texto de análise." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao processar a auditoria. Verifique a configuração da API e tente novamente." });
  }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "AUDIT JURÍDICA AI" }));
app.get("*", (_req, res) => res.sendFile(path.resolve("public/index.html")));
app.listen(PORT, () => console.log(`AUDIT JURÍDICA AI ativo na porta ${PORT}`));
