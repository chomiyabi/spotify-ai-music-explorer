import React from 'react';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import WelcomeSection from './components/WelcomeSection';
import PresetSection from './components/PresetSection';
import AISearchSection from './components/AISearchSection';
import EnhancedTrackList from './components/EnhancedTrackList';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Layout>
          <div className="max-w-6xl mx-auto">
            <WelcomeSection />
            <PresetSection />
            <AISearchSection />
            <EnhancedTrackList />
          </div>
        </Layout>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
