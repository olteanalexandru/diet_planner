import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FavoritesProvider } from './context/FavoritesContext';
import { RecipeProvider } from './context/RecipeContext';
import { CommentProvider } from './context/CommentContext';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Header from './Components/Header';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FutureRecipes",
  description: "A modern recipe management application for the future of cooking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} 
        bg-gradient-to-b from-space-800 to-space-900 
        text-gray-100 min-h-screen
        font-geist-sans antialiased selection:bg-cyber-primary/20 selection:text-cyber-primary`}>
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
        <div className="fixed inset-0 bg-gradient-to-tr from-cyber-primary/5 via-transparent to-cyber-accent/5"></div>
        
        {/* Main Content */}
        <UserProvider>
          <RecipeProvider>
            <CommentProvider>
              <FavoritesProvider>
                <div className="relative z-10 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                      {children}
                    </div>
                  </main>
                  <footer className="border-t border-space-700 bg-space-800/50 backdrop-blur-sm py-6">
                    <div className="container mx-auto px-4 text-center text-space-300 text-sm">
                      <p>© {new Date().getFullYear()} FutureRecipes. All rights reserved.</p>
                    </div>
                  </footer>
                </div>
              </FavoritesProvider>
            </CommentProvider>
          </RecipeProvider>
        </UserProvider>
      </body>
    </html>
  );
}