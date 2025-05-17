import './app.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Context Providers
import { CategoryProvider } from './context/categorycontext';
import { SearchProvider } from './context/searchprovider';
import { UserProvider } from './context/userprovider'; // ✅ NEW: Handles real-time avatar/name updates

// Pages
import Auth from './pages/auth';
import Dashboard from './pages/dashboard';
import Categories from './pages/categories';
import AddTransaction from './pages/addtransaction';
import Reports from './pages/reports';
import Scheduled from './pages/scheduled';
import Settings from './pages/settings';
import Receipts from './pages/receipts';
import Upgrade from './pages/upgrade';
import Support from './pages/support';
import Privacy from './pages/privacy';
import Terms from './pages/terms';
import TestExport from './pages/TestExport';

// Layout Components
import Sidebar from './components/sidebar';
import Header from './components/header';
import Footer from './components/footer';

// ✅ Handles token passed via OAuth redirect
function TokenHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

// ✅ Reusable Layout for authenticated pages
function DashboardLayout({ children }) {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <CategoryProvider>
        <SearchProvider>
          <Router>
            <TokenHandler />
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/categories" element={<DashboardLayout><Categories /></DashboardLayout>} />
              <Route path="/add-transaction" element={<DashboardLayout><AddTransaction /></DashboardLayout>} />
              <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
              <Route path="/scheduled" element={<DashboardLayout><Scheduled /></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
              <Route path="/receipts" element={<DashboardLayout><Receipts /></DashboardLayout>} />
              <Route path="/upgrade" element={<DashboardLayout><Upgrade /></DashboardLayout>} />
              <Route path="/support" element={<DashboardLayout><Support /></DashboardLayout>} />
              <Route path="/privacy" element={<DashboardLayout><Privacy /></DashboardLayout>} />
              <Route path="/terms" element={<DashboardLayout><Terms /></DashboardLayout>} />
              <Route path="/test-export" element={<TestExport />} />
            </Routes>
          </Router>
        </SearchProvider>
      </CategoryProvider>
    </UserProvider>
  );
}

export default App;
