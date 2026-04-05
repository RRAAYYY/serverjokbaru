'use client';

import { useState } from 'react';

interface CreateKeyFormProps {
  onSuccess: () => void;
}

export default function CreateKeyForm({ onSuccess }: CreateKeyFormProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(720);
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/make', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, duration })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedKey(data.keyCode);
        setName('');
        onSuccess();
      } else {
        alert('Error creating key: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating key:', error);
      alert('Error creating key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      alert('Key copied to clipboard!');
    }
  };

  return (
    <div className="card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key Name *
          </label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="e.g., Premium User - John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Give this key a name to track who is using it
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration *
          </label>
          <select
            className="input-field"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={24}>24 Hours (1 day)</option>
            <option value={72}>72 Hours (3 days)</option>
            <option value={168}>168 Hours (7 days)</option>
            <option value={720}>720 Hours (30 days)</option>
            <option value={2160}>2160 Hours (90 days)</option>
            <option value={8760}>8760 Hours (365 days)</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Generating...' : 'Generate Key'}
        </button>
      </form>
      
      {generatedKey && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            ✅ Key Generated Successfully!
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-lg font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border border-green-200 dark:border-green-700">
              {generatedKey}
            </code>
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-green-700 dark:text-green-400 mt-2">
            Share this key with the user. It will expire in {duration} hours.
          </p>
        </div>
      )}
    </div>
  );
}