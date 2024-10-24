export const UserProfileSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
      <div className="card-cyber p-6">
        <div className="flex gap-6">
          <div className="w-24 h-24 rounded-full bg-space-700" />
          <div className="flex-grow space-y-4">
            <div className="h-8 w-48 bg-space-700 rounded" />
            <div className="h-4 w-32 bg-space-700 rounded" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-space-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-space-700 rounded" />
        ))}
      </div>
    </div>
  );