import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface QueryInterfaceProps {
  onQueryComplete: (results: any) => void;
  onError: (error: string) => void;
}

export function QueryInterface({ onQueryComplete, onError }: QueryInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onError('User not authenticated');
      return;
    }

    if (!question.trim()) {
      onError('Please enter a question');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userId: user.username,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data = await response.json();
      onQueryComplete(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700">
            Ask a question about your data
          </label>
          <div className="mt-1">
            <textarea
              id="question"
              rows={3}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="e.g., What is the total revenue for each product?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Submit Query'}
          </button>
        </div>
      </form>
    </div>
  );
} 