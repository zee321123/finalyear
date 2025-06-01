// Import jsPDF for PDF generation
const { jsPDF } = require('jspdf');

// Import autoTable plugin to support table formatting in PDF
require('jspdf-autotable'); // Enhances jsPDF with table support

// Import JSON to CSV converter
const { Parser } = require('json2csv');

/**
 * Generates a PDF buffer containing a formatted table of transactions.
 * @param {Array} transactions - Array of transaction objects
 * @returns {Buffer|null} PDF buffer or null on failure
 */
function generatePDF(transactions) {
  try {
    const doc = new jsPDF(); // Create a new PDF document

    // Format transaction data into a table format for PDF
    const tableData = transactions.map(tx => [
      tx.date ? new Date(tx.date).toLocaleDateString() : '',
      tx.description || '',
      tx.category || '',
      tx.type || '',
      tx.currency || '',
      tx.amount?.toFixed(2) || '0.00',
    ]);

    // Add a title to the PDF
    doc.text('Transactions Report', 14, 15);

    // Generate table using autoTable
    doc.autoTable({
      head: [['Date', 'Description', 'Category', 'Type', 'Currency', 'Amount']],
      body: tableData,
      styles: { fontSize: 8 },
      margin: { top: 20 },
    });

    // Convert the generated PDF to a buffer for sending/saving
    const buffer = Buffer.from(doc.output('arraybuffer'));
    return buffer;
  } catch (err) {
    console.error('❌ [generatePDF] PDF generation failed:', err);
    return null;
  }
}

/**
 * Generates a CSV string from transaction data.
 * @param {Array} transactions - Array of transaction objects
 * @returns {string} CSV-formatted string
 */
function generateCSV(transactions) {
  // Define which fields to include in the CSV
  const fields = ['date', 'amount', 'category', 'type', 'currency', 'description'];

  // Create a CSV parser with the defined fields
  const parser = new Parser({ fields });

  // Parse and return CSV string
  return parser.parse(transactions);
}

// Export both PDF and CSV generators
module.exports = {
  generatePDF,
  generateCSV,
};
