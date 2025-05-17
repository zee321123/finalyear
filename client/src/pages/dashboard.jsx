import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import './Dashboard.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { CategoryContext } from '../context/categorycontext';
import { SearchContext } from '../context/searchcontext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:5000';
const brightColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

const getCurrencySymbol = (code) => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' };
  return symbols[code] || code;
};

function SummaryCard({ title, value, prefix }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = value;
    const duration = 1000;
    const stepTime = 16;
    const totalSteps = Math.ceil(duration / stepTime);
    let step = 0;

    const counter = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const eased = progress * (2 - progress);
      setDisplayValue((end * eased).toFixed(2));
      if (step >= totalSteps) {
        setDisplayValue(end.toFixed(2));
        clearInterval(counter);
      }
    }, stepTime);

    return () => clearInterval(counter);
  }, [value]);

  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{prefix}{displayValue}</p>
    </div>
  );
}

export default function Dashboard() {
  const { categories } = useContext(CategoryContext);
  const { searchTerm } = useContext(SearchContext);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    incomeThisMonth: 0,
    expensesThisMonth: 0,
    netProfitLoss: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasShownToast = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const start = Date.now();
      const token = localStorage.getItem('token');

      const [sumRes, txRes, schedRes] = await Promise.all([
        fetch(`${API_URL}/api/reports`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/transactions?limit=30`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/scheduled`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!sumRes.ok || !txRes.ok || !schedRes.ok) throw new Error("Fetch failed");

      const sumData = await sumRes.json();
      const txData = await txRes.json();
      const schedData = await schedRes.json();

      setSummary({
        totalBalance: sumData.balance ?? 0,
        incomeThisMonth: sumData.totalIncome ?? 0,
        expensesThisMonth: sumData.totalExpenses ?? 0,
        netProfitLoss: (sumData.totalIncome ?? 0) - (sumData.totalExpenses ?? 0),
      });
      setTransactions(txData);
      setScheduled(Array.isArray(schedData) ? schedData : []);

      const elapsed = Date.now() - start;
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), delay);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    const token = localStorage.getItem('token');

    if (window.location.search.includes('paid=true') && !hasShownToast.current) {
      hasShownToast.current = true;

      fetch(`${API_URL}/api/profile`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(() => {
          setTimeout(() => {
            toast.success('🎉 Payment successful! Premium features unlocked.', {
              position: 'top-center',
              autoClose: 4000,
            });

            const url = new URL(window.location);
            url.searchParams.delete('paid');
            window.history.replaceState({}, '', url);
          }, 3000);
        })
        .catch((err) => console.error('❌ Error refreshing user:', err));
    }

    fetchData();
  }, [fetchData]);

  // Listen for transaction updates and refresh data
  useEffect(() => {
    const handler = () => {
      fetchData();
    };
    window.addEventListener('transactionsUpdated', handler);
    return () => {
      window.removeEventListener('transactionsUpdated', handler);
    };
  }, [fetchData]);

  const getCategoryName = id => {
    if (!id) return 'Uncategorized';
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : 'Uncategorized';
  };

  const search = searchTerm.toLowerCase();
  const filteredTx = transactions.filter(tx =>
    tx.description?.toLowerCase().includes(search) ||
    getCategoryName(tx.category)?.toLowerCase().includes(search)
  );

  const filteredScheduled = scheduled.filter(item =>
    item.title?.toLowerCase().includes(search) ||
    item.category?.toLowerCase().includes(search)
  );

  const recentTx = filteredTx.slice(0, 5);
  const upcoming = filteredScheduled
    .map((item) => ({ ...item, _parsedDate: new Date(item.nextRun) }))
    .filter((it) => !isNaN(it._parsedDate.getTime()))
    .sort((a, b) => a._parsedDate - b._parsedDate)
    .slice(0, 5);

  const today = new Date();
  const dates = [];
  const incomeByDate = {};
  const expenseByDate = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dates.push(key);
    incomeByDate[key] = 0;
    expenseByDate[key] = 0;
  }

  transactions.forEach((tx) => {
    const dateKey = new Date(tx.date).toISOString().split('T')[0];
    if (incomeByDate[dateKey] !== undefined) {
      if (tx.type === 'income') incomeByDate[dateKey] += tx.amount;
      else expenseByDate[dateKey] += tx.amount;
    }
  });

  const trendChartData = {
    labels: dates,
    datasets: [
      { label: 'Income', data: dates.map((d) => incomeByDate[d]), fill: false },
      { label: 'Expenses', data: dates.map((d) => expenseByDate[d]), fill: false },
    ],
  };

  const categoryTotals = {};
  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const name = getCategoryName(tx.category);
      categoryTotals[name] = (categoryTotals[name] || 0) + tx.amount;
    }
  });

  const catLabels = Object.keys(categoryTotals);
  const catValues = Object.values(categoryTotals);
  const categoryChartData = {
    labels: catLabels,
    datasets: [
      {
        label: 'Expenses by Category',
        data: catValues,
        backgroundColor: catLabels.map((_, idx) => brightColors[idx % brightColors.length]),
      },
    ],
  };

  if (loading) {
    return (
      <div className="dashboard-container loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ToastContainer />
      <div className="summary-cards">
        <SummaryCard title="Total Balance" value={summary.totalBalance} prefix="$" />
        <SummaryCard title="Income This Month" value={summary.incomeThisMonth} prefix="+ $" />
        <SummaryCard title="Expenses This Month" value={summary.expensesThisMonth} prefix="- $" />
        <SummaryCard title="Net Profit/Loss" value={summary.netProfitLoss} prefix="$" />
      </div>

      <div className="charts-container">
        <div className="chart-item" data-aos="fade-up">
          <h4>Income vs. Expenses (30d)</h4>
          <Line data={trendChartData} />
        </div>
        <div className="chart-item" data-aos="fade-up" data-aos-delay="100">
          <h4>Expenses by Category</h4>
          <Pie data={categoryChartData} />
        </div>
      </div>

      <div className="details-container">
        <div className="list-section" data-aos="fade-up">
          <h4>Recent Transactions</h4>
          <div className="tx-cards-container">
            {recentTx.map((tx) => {
              const d = new Date(tx.date);
              const formattedDate = isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
              const isIncome = tx.type === 'income';
              return (
                <div className={`tx-card ${isIncome ? 'income-card' : 'expense-card'}`} key={tx._id}>
                  <div className="tx-card-left">
                    <div className="tx-date">{formattedDate}</div>
                    <div className="tx-desc">{tx.description}</div>
                    <div className="tx-cat">{getCategoryName(tx.category)}</div>
                  </div>
                  <div className="tx-amount">
                    {isIncome ? '💰 +' : '💸 -'}
                    {getCurrencySymbol(tx.currency)}{tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="upcoming-scheduled-list" data-aos="fade-up" data-aos-delay="100">
          <h4>Upcoming Scheduled</h4>
          <ul>
            {upcoming.length > 0 ? (
              upcoming.map((item) => (
                <li key={item._id} className={item.type === 'income' ? 'income-item' : 'expense-item'}>
                  <div className="scheduled-left">
                    <span className="scheduled-icon">{item.type === 'income' ? '💰' : '💸'}</span>
                    <div>
                      <div className="scheduled-date">{item._parsedDate.toLocaleDateString()}</div>
                      <div className={`scheduled-category ${item.type}`}>
                        {item.category || 'Uncategorized'}
                      </div>
                    </div>
                  </div>
                  <div className="scheduled-amount">
                    {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                  </div>
                </li>
              ))
            ) : (
              <li className="no-scheduled">No upcoming items</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  
}
