import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-spotify-dark border-b border-spotify-light">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-spotify-green">
              Spotify Music Explorer
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              音楽データを視覚的に探索しよう
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Powered by Spotify API
            </div>
            <div className="w-2 h-2 bg-spotify-green rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;