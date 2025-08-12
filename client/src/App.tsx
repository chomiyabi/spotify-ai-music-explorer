import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SearchPage from './components/SearchPage';
import DebugInfo from './components/DebugInfo';
import DebugBanner from './components/DebugBanner';
import DEPLOYMENT_INFO from './deploymentTrigger';

function App() {
  // 🚀 Latest version with AI DJ & Newsletter features - Build: 2025-08-13T00:15:00Z
  // Force rebuild trigger: ${DEPLOYMENT_INFO.buildHash}
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Layout>
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/search" element={<SearchPage />} />
              </Routes>
            </div>
          </Layout>
          <DebugInfo />
          <DebugBanner />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
