'use client';

import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

interface Key {
  _id: string;
  keyCode: string;
  name: string;
  status: string;
  hwid: string;
  lockedToDevice: boolean;
  createdAt: string;
  expiresAt: string;
}

interface KeysListProps {
  keys: Key[];
  loading: boolean;
  onRefresh: () => void;
}

export default function KeysList({ keys, loading, onRefresh }: KeysListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteKey = async (keyId: string, keyCode: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Key',
      message: `Are you sure you want to delete key "${keyCode}"? This action cannot be undone.`,
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setActionLoading(keyId);
        try {
          const token = localStorage.getItem('adminToken');
          await fetch(`/api/delete?key=${keyCode}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          onRefresh();
        } catch (error) {
          console.error('Error deleting key:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleResetHWID = async (keyId: string, keyCode: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Reset HWID',
      message: `Reset HWID for key "${keyCode}"? This will allow it to be used on a new device.`,
      onConfirm: async () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setActionLoading(keyId);
        try {
          const token = localStorage.getItem('adminToken');
          await fetch(`/api/adminReset?key=${keyCode}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          onRefresh();
        } catch (error) {
          console.error('Error resetting HWID:', error);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleDeleteAll = async () => {
    setModalConfig({
      isOpen: true,
      title: 'Delete All Keys - CONFIRMATION',
      message: '⚠️ WARNING: This will delete ALL license keys permanently! This action cannot be undone. Type "DELETE ALL" to confirm.',
      onConfirm: async () => {
        const confirmation = prompt('Type "DELETE ALL" to confirm:');
        if (confirmation === 'DELETE ALL') {
          setModalConfig({ ...modalConfig, isOpen: false });
          setActionLoading('all');
          try {
            const token = localStorage.getItem('adminToken');
            await fetch('/api/deleteAll', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            onRefresh();
          } catch (error) {
            console.error('Error deleting all keys:', error);
          } finally {
            setActionLoading(null);
          }
        } else {
          setModalConfig({ ...modalConfig, isOpen: false });
          alert('Confirmation cancelled. Keys were not deleted.');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading keys...</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            License Keys
          </h2>
          <button
            onClick={handleDeleteAll}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Delete All Keys
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Key Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Key Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">HWID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No keys found. Create your first key!
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{key.name}</td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{key.keyCode}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        key.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {key.hwid ? (
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{key.hwid.substring(0, 20)}...</code>
                      ) : (
                        <span className="text-gray-400">Not locked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(key.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetHWID(key._id, key.keyCode)}
                          disabled={actionLoading === key._id}
                          className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Reset HWID"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key._id, key.keyCode)}
                          disabled={actionLoading === key._id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Key"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </>
  );
}