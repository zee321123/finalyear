const { jsPDF } = require('jspdf');
require('jspdf-autotable'); // Patches jsPDF with autoTable

const { Parser } = require('json2csv');

function generatePDF(transactions) {
  try {
    const doc = new jsPDF();

    const tableData = transactions.map(tx => [
      tx.date ? new Date(tx.date).toLocaleDateString() : '',
      tx.description || '',
      tx.category || '',
      tx.type || '',
      tx.currency || '',
      tx.amount?.toFixed(2) || '0.00',
    ]);

    doc.text('Transactions Report', 14, 15);

    doc.autoTable({
      head: [['Date', 'Description', 'Category', 'Type', 'Currency', 'Amount']],
      body: tableData,
      styles: { fontSize: 8 },
      margin: { top: 20 },
    });

    const buffer = Buffer.from(doc.output('arraybuffer'));
    return buffer;
  } catch (err) {
    console.error('❌ [generatePDF] PDF generation failed:', err);
    return null;
  }
}

function generateCSV(transactions) {
  const fields = ['date', 'amount', 'category', 'type', 'currency', 'description'];
  const parser = new Parser({ fields });
  return parser.parse(transactions);
}

module.exports = {
  generatePDF,
  generateCSV,
};
