// Import global styles
import './App.css';

// Import React Router components for navigation and routing
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Import Context Providers for managing global state
import { CategoryProvider } from './context/categorycontext';
import { SearchProvider } from './context/searchprovider';
import { UserProvider } from './context/userprovider'; // Handles live user updates (e.g., name, avatar)

// Import all route pages
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

// Import shared layout components
import Sidebar from './components/sidebar';
import Header from './components/header';
import Footer from './components/footer';

/**
 * TokenHandler checks the URL for an OAuth token after login and stores it in localStorage.
 * This is useful for handling redirects after third-party authentication.
 */
function TokenHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token); // Save token for future requests
      navigate(location.pathname, { replace: true }); // Remove token from URL
    }
  }, [location, navigate]);

  return null;
}

/**
 * DashboardLayout wraps authenticated pages with a sidebar, header, and footer.
 * Used across all internal routes except Auth and TestExport.
 */
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

/**
 * Main App component that sets up routing, context providers, and layouts.
 */
function App() {
  return (
    <UserProvider>
      <CategoryProvider>
        <SearchProvider>
          <Router>
            <TokenHandler />
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<Auth />} />

              {/* Private Routes with Layout */}
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

              {/* Standalone test route (no layout wrapper) */}
              <Route path="/test-export" element={<TestExport />} />
            </Routes>
          </Router>
        </SearchProvider>
      </CategoryProvider>
    </UserProvider>
  );
}

export default App;
