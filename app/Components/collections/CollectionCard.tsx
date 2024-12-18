import Image from 'next/image';
import Link from 'next/link';
import { Collection } from '@/app/types/collection';

interface CollectionCardProps {
  collection: Collection;
}

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-4 w-4"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="h-12 w-12"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="relative h-48 w-full overflow-hidden">
          {collection.coverImage ? (
            <Image
              src={collection.coverImage}
              alt={collection.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <BookIcon />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {collection.name}
            </h3>
            {!collection.isPublic && (
              <span className="text-gray-500 dark:text-gray-400">
                <LockIcon />
              </span>
            )}
          </div>
          {collection.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {collection.description}
            </p>
          )}
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{collection._count?.recipes || 0} recipes</span>
            <span className="mx-2">•</span>
            <span>{collection.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
