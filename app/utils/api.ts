import { Recipe } from '../types';

export const api = {
    async fetcher(url: string, options: RequestInit = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'An error occurred');
      }
  
      return response.json();
    },
  
    recipes: {
      async delete(id: string) {
        return api.fetcher(`/api/recipes/${id}`, { method: 'DELETE' });
      },
  
      async update(id: string, data: Partial<Recipe>) {
        return api.fetcher(`/api/recipes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
  
      async like(id: string) {
        return api.fetcher(`/api/recipes/${id}/like`, { method: 'POST' });
      },
  
      async unlike(id: string) {
        return api.fetcher(`/api/recipes/${id}/like`, { method: 'DELETE' });
      },
    },
  };