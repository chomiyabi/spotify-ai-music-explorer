import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SearchPage from './components/SearchPage';
import DebugInfo from './components/DebugInfo';

function App() {
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
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
