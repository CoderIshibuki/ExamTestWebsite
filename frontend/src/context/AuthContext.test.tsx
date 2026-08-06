import { renderHook, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from './AuthContext';
import { useContext } from 'react';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('login updates token and isAuthenticated', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    act(() => {
      result.current.login('test-access', 'test-refresh');
    });

    expect(result.current.accessToken).toBe('test-access');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('test-access');
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh');
  });

  it('logout clears state and local storage', () => {
    localStorage.setItem('access_token', 'initial-access');
    localStorage.setItem('refresh_token', 'initial-refresh');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.accessToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
