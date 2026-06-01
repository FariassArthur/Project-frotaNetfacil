import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportPDF(title, headers, rows, filename = 'relatorio.pdf') {
  const doc = new jsPDF({ orientation: rows.length > 20 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 28);

  const tableRows = rows.map(r => r.map(v => {
    if (v === null || v === undefined) return '';
    return String(v);
  }));

  doc.autoTable({
    head: [headers],
    body: tableRows,
    startY: 34,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [255, 127, 30], fontSize: 8, halign: 'center' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 34 },
  });

  doc.save(filename);
}

export function exportMultipleTables(title, tables, filename = 'relatorio_completo.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 28);

  let startY = 34;
  for (const { name, headers, rows } of tables) {
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(11);
    doc.text(name, 14, startY + 4);
    startY += 8;

    const tableRows = rows.map(r => r.map(v => String(v ?? '')));

    doc.autoTable({
      head: [headers],
      body: tableRows,
      startY,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [255, 127, 30], fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
    });

    startY = doc.lastAutoTable.finalY + 10;
  }

  doc.save(filename);
}
