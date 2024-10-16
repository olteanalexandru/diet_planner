'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';

interface FavoritesContextType {
  favorites: Recipe[];
  addFavorite: (recipe: Recipe) => void;
  removeFavorite: (recipe: Recipe) => void;
  isFavorite: (recipe: Recipe) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  useEffect(() => {
   localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (recipe: Recipe) => {
    setFavorites((prevFavorites) => [...prevFavorites, recipe]);
  };

  const removeFavorite = (recipe: Recipe) => {
    setFavorites((prevFavorites) =>
      prevFavorites.filter((fav) => fav.id !== recipe.id)
    );
  };

  const isFavorite = (recipe: Recipe) => {
    return favorites.some((fav) => fav.id === recipe.id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};