import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function gerarPDF(dados: {
  produtor: any;
  formulario: any;
  respostas: Record<string, any>;
  diagnostico?: any;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Diagnóstico Tributário do Agronegócio", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Diagnóstico Fiscal", pageWidth / 2, 32, { align: "center" });

  // Dados do Produtor
  let y = 50;
  doc.setTextColor(26, 92, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Produtor", 14, y);
  y += 10;
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

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
    headStyles: { fillColor: [26, 92, 42], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [51, 51, 51] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: "auto" } },
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Respostas
  doc.setTextColor(26, 92, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Respostas do Formulário", 14, y);
  y += 10;

  const respostasArray = Object.entries(dados.respostas).map(([campo, valor]) => [campo, String(valor)]);
  if (respostasArray.length > 0) {
    (doc as any).autoTable({
      startY: y,
      head: [["Campo", "Valor"]],
      body: respostasArray,
      theme: "grid",
      headStyles: { fillColor: [26, 92, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [51, 51, 51], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: "auto" } },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Diagnóstico
  if (dados.diagnostico) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(26, 92, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Diagnóstico IBS/CBS", 14, y);
    y += 10;

    const diagInfo = [
      ["Enquadramento", dados.diagnostico.enquadramento_ibs_cbs || "-"],
      ["Nível de Risco", dados.diagnostico.nivel_risco || "-"],
      ["Data do Diagnóstico", dados.diagnostico.data_diagnostico ? new Date(dados.diagnostico.data_diagnostico).toLocaleString("pt-BR") : "-"],
    ];
    if (dados.diagnostico.justificativa_enquadramento) {
      diagInfo.push(["Justificativa", dados.diagnostico.justificativa_enquadramento]);
    }

    (doc as any).autoTable({
      startY: y,
      head: [["Campo", "Valor"]],
      body: diagInfo,
      theme: "grid",
      headStyles: { fillColor: [26, 92, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: "auto" } },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    if (dados.diagnostico.parecer_conclusivo) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setTextColor(26, 92, 42);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Parecer Conclusivo", 14, y);
      y += 8;
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(dados.diagnostico.parecer_conclusivo, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 10;
    }
  }

  // Rodapé
  if (y > 260) doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Relatório gerado em ${new Date().toLocaleString("pt-BR")} - Diagnóstico Tributário do Agronegócio`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 5,
    { align: "center" }
  );

  // Espaço para assinatura
  doc.addPage();
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
