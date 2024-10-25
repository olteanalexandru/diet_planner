
export const ProfileSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="card-cyber p-6">
        <div className="flex gap-6">
          {/* Avatar Skeleton */}
          <div className="w-24 h-24 rounded-full bg-space-700" />
  
          {/* Info Skeleton */}
          <div className="flex-grow space-y-4">
            <div className="h-8 w-48 bg-space-700 rounded" />
            <div className="h-4 w-32 bg-space-700 rounded" />
            <div className="h-4 w-56 bg-space-700 rounded" />
          </div>
        </div>
  
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-space-700 rounded" />
          ))}
        </div>
      </div>
  
      {/* Tabs Skeleton */}
      <div className="space-y-6">
        {/* Tab Navigation Skeleton */}
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-space-700 rounded" />
          ))}
        </div>
  
        {/* Content Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-space-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );