import React from 'react';
import { Toaster } from 'sonner';

export const Toast: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
        },
      }}
    />
  );
};