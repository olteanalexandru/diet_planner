import React from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';

const Header: React.FC = () => {
  return (
    <header className="relative z-20 border-b border-space-700 bg-space-800/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-cyber-primary via-cyber-glow to-cyber-accent bg-clip-text text-transparent">
              FutureRecipes
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Dashboard
            </Link>
            <Link 
              href="/create-recipe" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Create Recipe
            </Link>
            <Link 
              href="/social-feed" 
              className="text-gray-300 hover:text-cyber-primary transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-space-700"
            >
              Social Feed
            </Link>
            <div className="pl-6 border-l border-space-600">
              <LoginButton />
            </div>
          </nav>
          
          <button className="md:hidden text-gray-300 hover:text-cyber-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;