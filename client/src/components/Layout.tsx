import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-spotify-dark border-t border-spotify-light mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2024 Spotify Music Explorer. Built with React + TypeScript</p>
            <p className="mt-2">
              Data provided by 
              <a 
                href="https://developer.spotify.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-spotify-green hover:text-spotify-hover ml-1 underline"
              >
                Spotify Web API
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;