import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

const API_URL = 'http://localhost:5000';

const TestExport = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const dummyCat = {
    name: 'Test Category',
    transactions: [
      { date: new Date(), description: 'Test A', amount: 50 },
      { date: new Date(), description: 'Test B', amount: 100 },
    ],
  };

  const checkExportAllowed = async () => {
    console.log('🧠 [TEST] Checking export limit...');
    if (role === 'admin') return true;
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
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'test_category.csv');
  };

  const exportPDF = async () => {
    console.log('🧪 [TEST] PDF button clicked');
    const allowed = await checkExportAllowed();
    if (!allowed) return;

    const logged = await logExport('pdf');
    if (!logged) return;

    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Description', 'Amount']],
      body: dummyCat.transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount.toFixed(2),
      ]),
      startY: 20,
    });
    doc.text(dummyCat.name, 14, 15);
    doc.save('test_category.pdf');
  };

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
