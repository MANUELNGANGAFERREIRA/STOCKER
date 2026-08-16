'use client';

// Geração de relatórios em PDF — 100% no lado do cliente (jsPDF +
// jspdf-autotable). Não há nenhuma chamada de rede aqui: a biblioteca
// já vem embutida no bundle da aplicação, por isso isto funciona
// mesmo sem internet, tal como o resto do ContaFácil AO.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cores da marca (ver tailwind.config.js), em RGB para o jsPDF.
const COR_PRIMARIA: [number, number, number] = [30, 64, 175]; // #1E40AF
const COR_SECUNDARIA: [number, number, number] = [245, 158, 11]; // #F59E0B
const COR_TEXTO_CLARO: [number, number, number] = [255, 255, 255];
const COR_TEXTO_MUTED: [number, number, number] = [107, 114, 128]; // gray-500
const COR_LINHA_PAR: [number, number, number] = [243, 244, 246]; // gray-100

export interface ColunaRelatorio {
  cabecalho: string;
  chave: string;
  alinhamento?: 'left' | 'right' | 'center';
}

export interface LinhaResumo {
  rotulo: string;
  valor: string;
}

export interface DadosRelatorioPDF {
  /** Título do relatório, ex: "Inventário Atual" */
  titulo: string;
  /** Nome do negócio/utilizador, mostrado no cabeçalho */
  nomeNegocio?: string;
  /** Período do relatório, ex: "01/08/2026 – 16/08/2026" (opcional) */
  periodo?: string;
  colunas: ColunaRelatorio[];
  linhas: Record<string, string | number>[];
  /** Linhas de resumo mostradas num bloco destacado antes da tabela */
  resumo?: LinhaResumo[];
  /** Nome do ficheiro a descarregar, sem extensão */
  nomeFicheiro: string;
}

export function exportarRelatorioPDF(dados: DadosRelatorioPDF) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 40;

  // ---- Cabeçalho de marca ----
  doc.setFillColor(...COR_PRIMARIA);
  doc.rect(0, 0, largura, 88, 'F');
  doc.setFillColor(...COR_SECUNDARIA);
  doc.rect(0, 88, largura, 4, 'F');

  doc.setTextColor(...COR_TEXTO_CLARO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ContaFácil AO', margem, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Gestão de stock simples para o seu negócio', margem, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(dados.titulo, margem, 74);

  // Data/hora de geração e nome do negócio, alinhados à direita
  const agora = new Date();
  const dataGeracao = agora.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaGeracao = agora.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (dados.nomeNegocio) {
    doc.text(dados.nomeNegocio, largura - margem, 36, { align: 'right' });
  }
  doc.text(`Gerado em ${dataGeracao} às ${horaGeracao}`, largura - margem, 50, { align: 'right' });
  if (dados.periodo) {
    doc.text(`Período: ${dados.periodo}`, largura - margem, 64, { align: 'right' });
  }

  let cursorY = 112;

  // ---- Bloco de resumo (opcional) ----
  if (dados.resumo && dados.resumo.length > 0) {
    const alturaBloco = 34;
    doc.setFillColor(...COR_LINHA_PAR);
    doc.roundedRect(margem, cursorY, largura - margem * 2, alturaBloco, 4, 4, 'F');

    const larguraItem = (largura - margem * 2) / dados.resumo.length;
    dados.resumo.forEach((item, i) => {
      const x = margem + larguraItem * i + 14;
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(item.rotulo.toUpperCase(), x, cursorY + 13);
      doc.setTextColor(...COR_PRIMARIA);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(item.valor, x, cursorY + 27);
    });

    cursorY += alturaBloco + 20;
  }

  // ---- Tabela de dados ----
  if (dados.linhas.length === 0) {
    doc.setTextColor(...COR_TEXTO_MUTED);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Sem dados para este relatório.', margem, cursorY + 10);
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margem, right: margem },
      head: [dados.colunas.map((c) => c.cabecalho)],
      body: dados.linhas.map((linha) => dados.colunas.map((c) => String(linha[c.chave] ?? ''))),
      columnStyles: Object.fromEntries(
        dados.colunas.map((c, i) => [i, { halign: c.alinhamento || 'left' }])
      ),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 6,
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: COR_PRIMARIA,
        textColor: COR_TEXTO_CLARO,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: COR_LINHA_PAR,
      },
    });
  }

  // ---- Rodapé (número de página) em todas as páginas ----
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    const alturaPagina = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...COR_LINHA_PAR);
    doc.line(margem, alturaPagina - 34, largura - margem, alturaPagina - 34);
    doc.setTextColor(...COR_TEXTO_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Gerado offline pelo ContaFácil AO 🇦🇴', margem, alturaPagina - 20);
    doc.text(`Página ${i} de ${totalPaginas}`, largura - margem, alturaPagina - 20, { align: 'right' });
  }

  doc.save(`${dados.nomeFicheiro}.pdf`);
}
