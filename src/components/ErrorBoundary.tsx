import React, { useState, useEffect, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      setHasError(true);
      setError(e.error);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    let errorMessage = "Etwas ist schief gelaufen.";
    try {
      const message = error?.message || '';
      if (message.startsWith('{')) {
        const parsed = JSON.parse(message);
        if (parsed.error) {
          if (parsed.error.includes("Missing or insufficient permissions")) {
            errorMessage = "Zugriff verweigert: Du hast keine Berechtigung für diese Daten. Bitte melde dich erneut an.";
          } else {
            errorMessage = `Fehler: ${parsed.error}`;
          }
        }
      } else {
        errorMessage = message;
      }
    } catch (e) {
      errorMessage = error?.message || "Ein unbekannter Fehler ist aufgetreten.";
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4 text-center">
        <h1 className="text-2xl font-bold text-danger mb-4">Ups! Ein Fehler ist aufgetreten.</h1>
        <p className="text-text-secondary mb-6">{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          Seite neu laden
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
