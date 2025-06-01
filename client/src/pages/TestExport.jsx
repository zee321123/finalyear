// Import necessary libraries
import React from 'react';
import { jsPDF } from 'jspdf'; // For generating PDF files
import autoTable from 'jspdf-autotable'; // For creating tables in PDF
import { saveAs } from 'file-saver'; // For saving files to the user's computer

// API base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Main component
const TestExport = () => {
  // Get user token and role from localStorage
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Dummy category data for testing export
  const dummyCat = {
    name: 'Test Category',
    transactions: [
      { date: new Date(), description: 'Test A', amount: 50 },
      { date: new Date(), description: 'Test B', amount: 100 },
    ],
  };

  // Function to check if export is allowed for current user
  const checkExportAllowed = async () => {
    console.log('🧠 [TEST] Checking export limit...');
    if (role === 'admin') return true; // Admins have no limit

    try {
      const res = await fetch(`${API_URL}/api/export/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      console.log('✅ [TEST] Check result:', result);
      return result.allowed;
    } catch (err) {
      console.error('❌ [TEST] Export check failed:', err);
      return false;
    }
  };

  // Function to log an export action (CSV or PDF)
  const logExport = async (type) => {
    console.log(`📦 [TEST] Logging export type: ${type}`);
    try {
      const res = await fetch(`${API_URL}/api/export/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      const result = await res.json();
      console.log('📄 [TEST] Log response:', result);
      return res.ok;
    } catch (err) {
      console.error('❌ [TEST] Export log failed:', err);
      return false;
    }
  };

  // Function to export the dummy category data to CSV
  const exportCSV = async () => {
    console.log('🧪 [TEST] CSV button clicked');

    const allowed = await checkExportAllowed();
    if (!allowed) return;

    const logged = await logExport('csv');
    if (!logged) return;

    const header = ['Date', 'Description', 'Amount'];
    const rows = dummyCat.transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.amount.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');

    // Save CSV file
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'test_category.csv');
  };

  // Function to export the dummy category data to PDF
  const exportPDF = async () => {
    console.log('🧪 [TEST] PDF button clicked');

    const allowed = await checkExportAllowed();
    if (!allowed) return;

    const logged = await logExport('pdf');
    if (!logged) return;

    const doc = new jsPDF();

    // Add table to PDF using autoTable
    autoTable(doc, {
      head: [['Date', 'Description', 'Amount']],
      body: dummyCat.transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount.toFixed(2),
      ]),
      startY: 20,
    });

    // Add category name as title
    doc.text(dummyCat.name, 14, 15);

    // Save PDF file
    doc.save('test_category.pdf');
  };

  // Component UI
  return (
    <div style={{ padding: 30 }}>
      <h2>🧪 Test Export Buttons</h2>
      <button onClick={exportCSV} style={{ marginRight: 20 }}>
        Export CSV
      </button>
      <button onClick={exportPDF}>
        Export PDF
      </button>
    </div>
  );
};

export default TestExport;
