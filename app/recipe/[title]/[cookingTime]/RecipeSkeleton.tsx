import ContentLoader from 'react-content-loader';

export  const RecipeSkeleton = () => (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <ContentLoader 
            speed={2}
            width={400}
            height={400}
            viewBox="0 0 400 400"
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <rect x="0" y="0" rx="5" ry="5" width="320" height="200" />
            <rect x="0" y="220" rx="5" ry="5" width="320" height="20" />
            <rect x="0" y="250" rx="5" ry="5" width="200" height="20" />
          </ContentLoader>
        </div>
        <div className="col-md-6">
          <ContentLoader 
            speed={2}
            width={400}
            height={400}
            viewBox="0 0 400 400"
            backgroundColor="#f3f3f3"
            foregroundColor="#ecebeb"
          >
            <rect x="0" y="0" rx="5" ry="5" width="300" height="30" />
            <rect x="0" y="50" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="70" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="90" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="110" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="130" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="160" rx="5" ry="5" width="300" height="30" />
            <rect x="0" y="200" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="220" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="240" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="260" rx="5" ry="5" width="350" height="10" />
            <rect x="0" y="280" rx="5" ry="5" width="350" height="10" />
          </ContentLoader>

        </div>
      </div>
    </div>
  );