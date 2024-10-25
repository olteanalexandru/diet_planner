'use client';

import { Palette } from 'lucide-react';
import { useState } from 'react';
import { useTheme, Theme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Cyber Dark', icon: '🌙' },
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'foodie', label: 'Foodie', icon: '🍽️' },
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-500/10 transition-colors duration-200"
        aria-label="Change theme"
      >
        <Palette className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 py-2 bg-space-800 rounded-lg shadow-xl border border-space-700">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-500/10 transition-colors duration-200 ${
                  theme === option.value ? 'text-cyber-primary' : 'text-gray-300'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;