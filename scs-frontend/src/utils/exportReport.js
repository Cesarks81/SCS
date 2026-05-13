import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HOY = () => new Date().toLocaleDateString('es-ES');
const FILENAME_DATE = () => new Date().toISOString().slice(0, 10);

function buildRows(productos, warehouses) {
  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, `${w.name} — ${w.location}`]));
  return productos.map((p) => ({
    Modelo: p.model || '',
    Tipo: p.type === 'countable' ? 'Lote/Grupo' : 'Individual',
    Categoría: p.category || '',
    'S/N': p.type === 'individual' ? (p.serial_number || '') : '',
    'Stock actual': p.type === 'countable' ? p.current_stock ?? 0 : '',
    'Stock seguridad': p.type === 'countable' ? (p.stock_safety ?? 0) : '',
    'Stock mínimo': p.type === 'countable' ? (p.stock_min ?? 0) : '',
    'Stock máximo': p.type === 'countable' ? (p.stock_max ?? 0) : '',
    Almacén: whMap[p.warehouse_id] || p.warehouse_id || '',
    Estado: p.status || '',
  }));
}

export function exportToExcel(productos, warehouses) {
  const rows = buildRows(productos, warehouses);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 30 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `inventario_${FILENAME_DATE()}.xlsx`);
}

export function exportToPDF(productos, warehouses) {
  const rows = buildRows(productos, warehouses);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Informe de Inventario', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Generado el ${HOY()} · ${productos.length} producto(s)`, 14, 23);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 28,
    head: [Object.keys(rows[0] || {})],
    body: rows.map((r) => Object.values(r)),
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 40 },
      8: { cellWidth: 45 },
    },
  });

  doc.save(`inventario_${FILENAME_DATE()}.pdf`);
}
