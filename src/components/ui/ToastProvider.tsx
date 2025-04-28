'use client';

import React from 'react';
import ToastContainer from './ToastContainer';

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContainer position="top-center" />
      {children}
    </>
  );
}
