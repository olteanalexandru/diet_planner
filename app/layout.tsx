
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FavoritesProvider } from './context/FavoritesContext';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { LoginButton } from './Components/LoginButton';
import Link from 'next/link';

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
  title: "Recipe App",
  description: "A modern recipe management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProvider>
          <FavoritesProvider>
            <header className="bg-primary text-white py-3">
              <div className="container d-flex justify-content-between align-items-center">
                <h1 className="h4 m-0">
                  <Link href="/" className="text-white text-decoration-none">Recipes</Link>
                </h1>
                <nav>
                  <Link href="/dashboard" className="btn btn-outline-light me-2">Dashboard</Link>
                  <Link href="/create-recipe" className="btn btn-outline-light me-2">Create Recipe</Link>
                  <Link href="/social-feed" className="btn btn-outline-light me-2">Social Feed</Link>
                  <LoginButton />
                </nav>
              </div>
            </header>
            <div className="container-fluid" style={{ maxWidth: "700px", margin: "0 auto" }}>
              {children}
            </div>
          </FavoritesProvider>
        </UserProvider>
      </body>
    </html>
  );
}
