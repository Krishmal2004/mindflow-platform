export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function setAuth(token: string, userName: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userName', userName);
}

export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userName');
}

export function getUserName(): string {
  return localStorage.getItem('userName') || 'Mindful User';
}
