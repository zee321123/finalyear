// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ← import your new provider
import { CategoryProvider } from './context/categorycontext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* wrap App in the provider so every page can access categories */}
    <CategoryProvider>
      <App />
    </CategoryProvider>
  </React.StrictMode>
);
