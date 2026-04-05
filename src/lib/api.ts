export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    console.error('No token found in localStorage');
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('No token found');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    console.error('Unauthorized - clearing storage and redirecting');
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
}