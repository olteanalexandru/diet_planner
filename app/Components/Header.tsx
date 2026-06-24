'use client';
import React from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import {  ChefHat, Layout, Users, ScrollText, Bell, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t('nav.dashboard'), icon: <Layout size={18} /> },
    { href: "/create-recipe", label: t('nav.createRecipe'), icon: <ChefHat size={18} /> },
    { href: "/recipe-feed", label: t('nav.recipeFeed'), icon: <ScrollText size={18} /> },
    { href: "/social-feed", label: t('nav.socialFeed'), icon: <Users size={18} /> },
    { href: "/search" , label: t('nav.search'), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5-5m2-2l-5-5-5 5-5-5m2 2l-5 5m5-5l5-5" /></svg> },
    { href: "/notifications", label: t('nav.notifications'), icon: <Bell size={18} /> },
    { href: "/pricing", label: t('nav.pricing'), icon: <Sparkles size={18} /> },
  ];

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
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  pathname === item.href 
                    ? 'text-cyber-primary bg-cyber-primary/10' 
                    : 'text-gray-300 hover:text-cyber-primary hover:bg-space-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pl-6 border-l border-space-600 flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <LoginButton />
            </div>
          </nav>
          
          {/* Mobile Navigation Button */}
          <button className="md:hidden text-gray-300 hover:text-cyber-primary p-2 rounded-lg hover:bg-space-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu - You can implement a slide-out menu here */}
      {/* Additional mobile menu implementation would go here */}
    </header>
  );
};

export default Header;