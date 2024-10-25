'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Favorites from './Components/Favorites';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const router = useRouter();
   
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     router.push(`/recipes/?query=${encodeURIComponent(query)}`);

  };
  
  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold">
          <span className="bg-gradient-to-r from-cyber-primary via-cyber-glow to-cyber-accent bg-clip-text text-transparent">
            Discover the Future
          </span>
          <br />
          <span className="text-gray-100">of Cooking</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Explore AI-powered recipes tailored to your taste, and join a community of future-forward food enthusiasts.
        </p>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="input-cyber w-full h-14 pl-5 pr-12 text-lg"
            placeholder="What do you feel like eating?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg 
              text-cyber-primary hover:bg-cyber-primary/10 transition-colors duration-200"
          >
            <Search size={24} />
          </button>
        </form>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4">
        {['AI-Powered Recipes', 'Smart Meal Planning', 'Social Cooking'].map((feature, index) => (
          <div key={index} className="card-cyber group">
            <div className="h-12 w-12 rounded-lg bg-cyber-primary/10 mb-4 flex items-center justify-center group-hover:bg-cyber-primary/20 transition-colors duration-200">
              <span className="text-2xl">{['🤖', '📅', '👥'][index]}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">{feature}</h3>
            <p className="text-gray-400">Experience the next generation of cooking with our innovative features.</p>
          </div>
        ))}
      </div>

      {/* Favorites Section */}
      <div className="w-full max-w-5xl mx-auto px-4">
        <Favorites />
      </div>
    </div>
  );
}


