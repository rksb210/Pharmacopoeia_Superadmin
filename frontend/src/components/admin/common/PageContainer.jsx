import React from 'react';

/**
 * Standard PageContainer providing responsive padding and layout constraints
 */
export const PageContainer = ({ children, className = '', maxWidth = 'max-w-[1440px]' }) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto p-4 sm:p-6 lg:p-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
