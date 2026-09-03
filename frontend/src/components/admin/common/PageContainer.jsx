import React from 'react';

/**
 * Standard PageContainer providing responsive padding and layout constraints
 */
export const PageContainer = ({ children, className = '', maxWidth = 'max-w-[1440px]' }) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0 max-w-full ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
