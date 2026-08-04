import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { SECOES, formatValor, campoCondicionalAtivo } from "./form-secoes";

export function gerarPDF(dados: {
  produtor: any;
  formulario: any;
  respostas: Record<string, any>;
  diagnostico?: any;
  acoes?: any[];
  oportunidades?: any[];
  pendencias?: any[];
  observacoes?: any[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const verde: [number, number, number] = [26, 92, 42];

  function rodape() {
    doc.setFillColor(...verde);
    doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Relatório gerado em ${new Date().toLocaleString("pt-BR")} - Diagnóstico Tributário do Agronegócio`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  }

  function tituloSeccao(texto: string, y: number) {
    if (y > pageHeight - 40) {
      doc.addPage();
      rodape();
      return 22;
    }
    doc.setTextColor(...verde);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(texto, 14, y);
    return y + 4;
  }

  // Cabeçalho (página 1)
  doc.setFillColor(...verde);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico Tributário do Agronegócio", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Diagnóstico Fiscal", pageWidth / 2, 32, { align: "center" });

  const respMap = dados.respostas || {};

  // Dados do Produtor
  let y = 50;
  const produtorInfo = [
    ["Nome/Razão Social", dados.produtor?.nome_razao || "-"],
    ["CPF/CNPJ", dados.produtor?.cpf_cnpj || "-"],
    ["Município/Estado", `${dados.produtor?.municipio || "-"}/${dados.produtor?.estado || "-"}`],
    ["Atividade Principal", dados.produtor?.atividade_principal || "-"],
    ["Tipo", dados.produtor?.tipo || "-"],
    ["Protocolo", dados.formulario?.protocolo || "-"],
    ["Data de Envio", dados.formulario?.data_envio ? new Date(dados.formulario.data_envio).toLocaleString("pt-BR") : "-"],
  ];

  (doc as any).autoTable({
    startY: y,
    head: [["Campo", "Valor"]],
    body: produtorInfo,
    theme: "grid",
    margin: { bottom: 20 },
    didDrawPage: () => rodape(),
    headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [51, 51, 51] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: "auto" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Respostas do Formulário (por seção)
  for (const sec of SECOES) {
    const linhas = sec.campos
      .filter((c) => campoCondicionalAtivo(c.campo, respMap))
      .map((c) => [c.label, formatValor(respMap[c.campo], c.format) ?? "—"]);

    if (linhas.length === 0) continue;

    y = tituloSeccao(sec.titulo, y);
    (doc as any).autoTable({
      startY: y,
      head: [[sec.titulo, ""]],
      body: linhas,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Diagnóstico
  if (dados.diagnostico) {
    y = tituloSeccao("Diagnóstico IBS/CBS", y);

    const diagInfo = [
      ["Enquadramento", dados.diagnostico.enquadramento_ibs_cbs || "-"],
      ["Nível de Risco", dados.diagnostico.nivel_risco || "-"],
      ["Data do Diagnóstico", dados.diagnostico.data_diagnostico ? new Date(dados.diagnostico.data_diagnostico).toLocaleString("pt-BR") : "-"],
    ];
    if (dados.diagnostico.justificativa_enquadramento) diagInfo.push(["Justificativa", dados.diagnostico.justificativa_enquadramento]);

    (doc as any).autoTable({
      startY: y,
      head: [["Campo", "Valor"]],
      body: diagInfo,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (dados.diagnostico.parecer_conclusivo) {
      y = tituloSeccao("Parecer Conclusivo", y);
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(dados.diagnostico.parecer_conclusivo, pageWidth - 28);
      for (let i = 0; i < lines.length; i++) {
        if (y > pageHeight - 40) {
          doc.addPage();
          rodape();
          y = 22;
        }
        doc.text(lines[i], 14, y);
        y += 5;
      }
    }

    if (dados.diagnostico.proxima_acao) {
      y = tituloSeccao("Próxima Ação", y);
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(dados.diagnostico.proxima_acao, pageWidth - 28);
      for (let i = 0; i < lines.length; i++) {
        if (y > pageHeight - 40) {
          doc.addPage();
          rodape();
          y = 22;
        }
        doc.text(lines[i], 14, y);
        y += 5;
      }
    }
  }

  // Ações prioritárias
  if (dados.acoes && dados.acoes.length > 0) {
    y = tituloSeccao("Ações Prioritárias", y);
    const linhas = dados.acoes.map((a, i) => [`Ação ${i + 1}`, a.descricao || "-"]);
    (doc as any).autoTable({
      startY: y,
      head: [[`Ações Prioritárias`, ""]],
      body: linhas,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Oportunidades
  if (dados.oportunidades && dados.oportunidades.length > 0) {
    y = tituloSeccao("Oportunidades", y);
    const linhas = dados.oportunidades.map((o, i) => [`Oportunidade ${i + 1}`, `${o.descricao || "-"}${o.prioridade ? ` (${o.prioridade})` : ""}`]);
    (doc as any).autoTable({
      startY: y,
      head: [["Oportunidades", ""]],
      body: linhas,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Pendências
  if (dados.pendencias && dados.pendencias.length > 0) {
    y = tituloSeccao("Pendências", y);
    const linhas = dados.pendencias.map((p, i) => [`Pendência ${i + 1}`, `${p.descricao || "-"} [${p.resolvida ? "resolvida" : "pendente"}]`]);
    (doc as any).autoTable({
      startY: y,
      head: [["Pendências", ""]],
      body: linhas,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Observações
  if (dados.observacoes && dados.observacoes.length > 0) {
    y = tituloSeccao("Observações", y);
    const linhas = dados.observacoes.map((o, i) => [`Observação ${i + 1}`, o.texto || "-"]);
    (doc as any).autoTable({
      startY: y,
      head: [["Observações", ""]],
      body: linhas,
      theme: "grid",
      margin: { bottom: 20 },
      didDrawPage: () => rodape(),
      headStyles: { fillColor: verde, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Espaço para assinatura
  doc.addPage();
  rodape();
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Espaço para Assinatura", pageWidth / 2, 40, { align: "center" });
  doc.setDrawColor(150, 150, 150);
  doc.line(60, 120, pageWidth - 60, 120);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Responsável pelo Diagnóstico", pageWidth / 2, 130, { align: "center" });
  doc.line(60, 170, pageWidth - 60, 170);
  doc.text("Produtor / Representante", pageWidth / 2, 180, { align: "center" });

  doc.save(`diagnostico-${dados.produtor?.nome_razao?.replace(/\s+/g, "-").toLowerCase() || "produtor"}.pdf`);
}
