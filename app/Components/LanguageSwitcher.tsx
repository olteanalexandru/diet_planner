'use client';

import { Languages } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../translations';

const LANGUAGE_OPTIONS: { value: Language; label: string; icon: string }[] = [
  { value: 'en', label: 'English', icon: '🇬🇧' },
  { value: 'ro', label: 'Română', icon: '🇷🇴' },
];

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-500/10 transition-colors duration-200"
        aria-label="Change language"
      >
        <Languages className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 py-2 bg-space-800 rounded-lg shadow-xl border border-space-700 z-[100]">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleLanguageChange(option.value)}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-500/10 transition-colors duration-200 ${
                  language === option.value ? 'text-cyber-primary' : 'text-gray-300'
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

export default LanguageSwitcher;
