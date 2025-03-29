'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute query');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Query Interface</h1>
            <p className="mt-2 text-gray-600">
              Enter your query below to analyze your data.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                Query
              </label>
              <textarea
                id="query"
                name="query"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your query here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Running query...' : 'Run Query'}
              </button>
            </div>
          </form>

          {results && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(results[0] || {}).map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value: any, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {value?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
