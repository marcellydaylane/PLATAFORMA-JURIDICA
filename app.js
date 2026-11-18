const moduleInfo = {
 legal_review:["REVISÃO JURÍDICA","Revisão jurídica completa","Examine validade, formalidades, legislação aplicável e riscos do instrumento."],
 clause_analysis:["ANÁLISE DE CLÁUSULAS","Análise individual de cláusulas","Identifique ambiguidades, omissões, desequilíbrios e alternativas de redação."],
 power_of_attorney:["AUDITORIA DE PROCURAÇÕES","Auditoria de procuração","Verifique poderes expressos, limites, prazo, substabelecimento e formalidades."],
 property_review:["AUDITORIA IMOBILIÁRIA","Auditoria imobiliária","Confronte os documentos quanto à titularidade, ônus, restrições e disponibilidade."],
 compare_contracts:["COMPARADOR","Comparação de contratos","Identifique diferenças materiais entre duas versões de um instrumento."],
 swot_analysis:["ANÁLISE SWOT","Análise SWOT do contrato","Mapeie forças, fraquezas, oportunidades e ameaças."],
 economic_analysis:["ANÁLISE ECONÔMICA","Análise econômica e financeira","Avalie pagamentos, multas, reajustes, garantias e exposição econômica."],
 get_advice:["RECOMENDAÇÕES","Aconselhamento e recomendações","Receba recomendações práticas e sugestões de redação."],
 real_time_feedback:["FEEDBACK CONTÍNUO","Análise de alterações","Avalie o impacto de mudanças realizadas no documento."],
 finalize_audit:["RELATÓRIO FINAL","Relatório técnico de auditoria","Consolide achados, riscos, fundamentos, recomendações e pendências."]
};
let current = "legal_review";
const $ = id => document.getElementById(id);
document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => {
 document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
 btn.classList.add("active"); current = btn.dataset.module;
 const [tag,title,desc] = moduleInfo[current];
 $("module-tag").textContent=tag; $("module-title").textContent=title; $("module-desc").textContent=desc;
 $("second-wrap").classList.toggle("hidden", current !== "compare_contracts" && current !== "real_time_feedback");
}));
$("clear").addEventListener("click",()=>{$("audit-form").reset();$("result-box").classList.add("hidden");$("result").textContent="";});
$("audit-form").addEventListener("submit", async e=>{
 e.preventDefault();
 $("loading").classList.remove("hidden"); $("result-box").classList.add("hidden"); $("submit").disabled=true;
 const data = new FormData();
 data.append("module",current); data.append("context",$("context").value); data.append("contract",$("contract").value); data.append("secondText",$("secondText").value);
 [...$("files").files].forEach(f=>data.append("files",f));
 try{
  const r=await fetch("/api/audit",{method:"POST",body:data});
  const j=await r.json(); if(!r.ok) throw new Error(j.error||"Erro ao processar.");
  $("result").textContent=j.result; $("result-box").classList.remove("hidden");
  $("result-box").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(err){$("result").textContent="ERRO: "+err.message;$("result-box").classList.remove("hidden");}
 finally{$("loading").classList.add("hidden");$("submit").disabled=false;}
});
$("copy").addEventListener("click",async()=>{await navigator.clipboard.writeText($("result").textContent);$("copy").textContent="Copiado!";setTimeout(()=>$("copy").textContent="Copiar",1400);});
$("download").addEventListener("click",()=>{const blob=new Blob([$("result").textContent],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="relatorio-audit-juridica.txt";a.click();URL.revokeObjectURL(a.href);});
