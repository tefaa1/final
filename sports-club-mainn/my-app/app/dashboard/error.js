"use client"
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fef2f2',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
           Error Loading Dashboard
        </h1>
        <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
          There was an error loading the dashboard page.
        </p>
        <pre style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.375rem',
          overflow: 'auto',
          marginBottom: '1.5rem'
        }}>
          {error?.message || 'Unknown error'}
        </pre>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}