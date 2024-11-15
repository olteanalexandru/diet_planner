'use client';

import { useState } from 'react';

export default function DeleteDatabase() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear the entire database? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setStatus('Clearing database...');

    try {
      const response = await fetch('/api/ClearDatabase', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Success: ${data.message} at ${data.timestamp}`);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus('Error: Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Database Management</h1>
      <button
        onClick={handleClearDatabase}
        disabled={isLoading}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isLoading ? 'Clearing...' : 'Clear Database'}
      </button>
      {status && (
        <p className={`mt-4 ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {status}
        </p>
      )}
    </div>
  );
}

