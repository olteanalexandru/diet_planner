import React from 'react';
import ContentLoader from 'react-content-loader';

export const RecipeSkeleton = () => (
  <div className="container mt-5">
    <div className="row">
      <ContentLoader 
        speed={2}
        width={400}
        height={500}
        viewBox="0 0 400 500"
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <rect x="0" y="0" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="90" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="180" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="270" rx="5" ry="5" width="350" height="70" />
        <rect x="0" y="360" rx="5" ry="5" width="350" height="70" />
      </ContentLoader>
    </div>
  </div>
);

export default RecipeSkeleton;
