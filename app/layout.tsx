import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FavoritesProvider } from './context/FavoritesContext';
import { RecipeProvider } from './context/RecipeContext';
import { CommentProvider } from './context/CommentContext';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Header } from './Components/Header';

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-dark text-light`}>
        <UserProvider>
          <RecipeProvider>
            <CommentProvider>
              <FavoritesProvider>
                <Header />
                <main className="container py-4">
                  <div className="row justify-content-center">
                    <div className="col-lg-10">
                      <div className="bg-light bg-opacity-10 p-4 rounded-3 shadow-lg">
                        {children}
                      </div>
                    </div>
                  </div>
                </main>
              </FavoritesProvider>
            </CommentProvider>
          </RecipeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
