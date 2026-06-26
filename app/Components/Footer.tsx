'use client';

import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-space-700 bg-space-800/50 backdrop-blur-sm py-6">
      <div className="container mx-auto px-4 text-center text-space-300 text-sm">
        <p>© {new Date().getFullYear()} FutureRecipes. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
