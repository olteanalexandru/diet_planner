'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { UsageBadge } from './UsageBadge';
import { ChefHat, Layout, Users, ScrollText, Bell, Sparkles, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/dashboard", label: t('nav.dashboard'), icon: <Layout size={18} />, requiresAuth: true },
    { href: "/create-recipe", label: t('nav.createRecipe'), icon: <ChefHat size={18} />, requiresAuth: true },
    { href: "/recipe-feed", label: t('nav.recipeFeed'), icon: <ScrollText size={18} />, requiresAuth: false },
    { href: "/social-feed", label: t('nav.socialFeed'), icon: <Users size={18} />, requiresAuth: false },
    {
      href: "/search",
      label: t('nav.search'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5-5m2-2l-5-5-5 5-5-5m2 2l-5 5m5-5l5-5" />
        </svg>
      ),
      requiresAuth: false,
    },
    { href: "/notifications", label: t('nav.notifications'), icon: <Bell size={18} />, requiresAuth: true },
  ].filter((item) => !item.requiresAuth || !!user);

  const linkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
      pathname === href
        ? 'text-cyber-primary bg-cyber-primary/10'
        : 'text-gray-300 hover:text-cyber-primary hover:bg-space-700'
    }`;

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
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <Link href="/pricing" className={`relative ${linkClass('/pricing')}`}>
              <Sparkles size={18} />
              <span>{t('nav.pricing')}</span>
              {user ? (
                <UsageBadge className="ml-1" />
              ) : (
                <span
                  title={t('nav.premiumTeaser')}
                  className="ml-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-cyber-primary text-space-900"
                >
                  {t('nav.upgrade')}
                </span>
              )}
            </Link>
            <div className="pl-6 border-l border-space-600 flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <LoginButton />
            </div>
          </nav>

          {/* Mobile Navigation Button */}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileMenuOpen}
            className="md:hidden text-gray-300 hover:text-cyber-primary p-2 rounded-lg hover:bg-space-700"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-space-700 bg-space-800 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <Link href="/pricing" className={`relative ${linkClass('/pricing')}`}>
            <Sparkles size={18} />
            <span>{t('nav.pricing')}</span>
            {user ? (
              <UsageBadge className="ml-1" />
            ) : (
              <span className="ml-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-cyber-primary text-space-900">
                {t('nav.upgrade')}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-4 pt-3 mt-2 border-t border-space-700">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <div className="pt-2">
            <LoginButton />
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
