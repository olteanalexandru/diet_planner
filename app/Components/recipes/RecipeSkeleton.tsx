import React from 'react';

export const RecipeCardSkeleton = () => (
  <div className="w-full">
    <div className="card-cyber group relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
        {/* Image Skeleton */}
        <div className="w-full md:w-48 h-48 md:h-32 relative rounded-lg overflow-hidden flex-shrink-0 bg-space-700 animate-pulse" />

        {/* Content Skeleton */}
        <div className="flex-grow min-w-0 w-full">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-grow space-y-2">
              {/* Title Skeleton */}
              <div className="h-7 bg-space-700 animate-pulse rounded w-3/4" />
              
              {/* Meta Info Skeleton */}
              <div className="flex items-center gap-4 mt-2">
                <div className="h-5 bg-space-700 animate-pulse rounded w-24" />
                <div className="h-5 bg-space-700 animate-pulse rounded w-32" />
              </div>

              {/* Preview Content Skeleton */}
              <div className="space-y-1 mt-2">
                <div className="h-4 bg-space-700 animate-pulse rounded w-full" />
                <div className="h-4 bg-space-700 animate-pulse rounded w-5/6" />
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex md:flex-col items-center gap-2">
              <div className="w-8 h-8 bg-space-700 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RecipeGridSkeleton = () => (
  <div className="grid gap-6">
    {[1, 2, 3, 4, 5].map((index) => (
      <RecipeCardSkeleton key={index} />
    ))}
  </div>
);
