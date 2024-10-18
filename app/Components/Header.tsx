import React from 'react';
import Link from 'next/link';
import { LoginButton } from './LoginButton';

export const Header: React.FC = () => {
  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-primary py-3" style={{
      background: 'linear-gradient(135deg, rgba(13,110,253,0.8), rgba(13,110,253,0.6))',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <span className="me-2" style={{ fontSize: '1.5rem' }}>🍽️</span>
          <span style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}>
            FutureRecipes
          </span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link href="/dashboard" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link href="/create-recipe" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Create Recipe</Link>
            </li>
            <li className="nav-item">
              <Link href="/social-feed" className="nav-link px-3 py-2 rounded-pill transition-all hover-shadow">Social Feed</Link>
            </li>
            <li className="nav-item ms-lg-3">
              <LoginButton />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};