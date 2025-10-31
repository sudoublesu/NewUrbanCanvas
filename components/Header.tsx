
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-5 px-4 md:px-8 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            UrbanCanvas AI
          </h1>
          <p className="text-gray-400 text-sm md:text-base mt-1">Reimagine your city's architecture.</p>
        </div>
      </div>
    </header>
  );
};
