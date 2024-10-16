'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Favorites from './Components/Favorites';


export default function Home() {
  const [query, setQuery] = useState<string>('');
  const router = useRouter();
   
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/recipes/?query=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="container mt-5">

      <form onSubmit={handleSearch}>
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="What do you feel like eating?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              background: 'none', 
              color: 'grey', 
              borderColor: 'lightGrey', 
              borderRight: 'none', 
              borderTopLeftRadius: '50px', 
              borderBottomLeftRadius: '50px'
            }}
          />
          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ 
              background: 'none', 
              color: 'grey', 
              borderColor: 'lightGrey', 
              borderLeft: 'none', 
              borderTopRightRadius: '50px', 
              borderBottomRightRadius: '50px'
            }}
          >
            Search
          </button>
        </div>
      </form>
      <Favorites />
    </div>
  );
}


