import { Collection } from '@/app/types/collection';
import CollectionCard from './CollectionCard';

interface CollectionGridProps {
  collections: Collection[];
  emptyMessage?: string;
}

export default function CollectionGrid({ 
  collections, 
  emptyMessage = "No collections found" 
}: CollectionGridProps) {
  if (collections.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
