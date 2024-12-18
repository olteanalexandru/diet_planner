'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Collection } from '@/app/types/collection';

interface AddToCollectionButtonProps {
  recipeId: string;
}

export default function AddToCollectionButton({
  recipeId,
}: AddToCollectionButtonProps) {
  const { user } = useUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/collections?userId=${user.sub}`);
        if (!response.ok) throw new Error('Failed to fetch collections');
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [user]);

  const handleAddToCollection = async () => {
    if (!selectedCollectionId) return;
    setIsAdding(true);

    try {
      const response = await fetch(
        `/api/collections/${selectedCollectionId}/recipes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
        }
      );

      if (!response.ok) throw new Error('Failed to add recipe to collection');

      setIsModalOpen(false);
      setSelectedCollectionId('');
    } catch (error) {
      console.error('Error adding recipe to collection:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add to Collection
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add to Collection
              </h2>

              {isLoading ? (
                <div className="mt-4 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : collections.length === 0 ? (
                <div className="mt-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    You don't have any collections yet.
                  </p>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      // Navigate to collections page
                      window.location.href = '/collections';
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Create a collection
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <select
                    value={selectedCollectionId}
                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddToCollection}
                      disabled={!selectedCollectionId || isAdding}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isAdding ? 'Adding...' : 'Add to Collection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
