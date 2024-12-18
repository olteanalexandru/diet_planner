'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Collection } from '@/app/types/collection';
import CollectionGrid from '@/app/Components/collections/CollectionGrid';
import CreateCollectionModal from '@/app/Components/collections/CreateCollectionModal';

export default function CollectionsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`/api/collections?userId=${user?.sub}`);
        if (!response.ok) throw new Error('Failed to fetch collections');
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCollections();
    }
  }, [user]);

  if (userLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sign in to view your collections
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage your recipe collections by signing in to your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Collections
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Organize your favorite recipes into collections
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Collection
        </button>
      </div>

      <CollectionGrid
        collections={collections}
        emptyMessage="Create your first collection to start organizing your recipes"
      />

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
