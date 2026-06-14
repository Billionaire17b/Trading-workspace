import { createContext, useState, useCallback, type ReactNode } from 'react';

interface AuthContextValue {
  isAuthed: boolean;
  setAuthed: (value: boolean) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return sessionStorage.getItem('tw-authed') === 'true';
  });

  const setAuthed = useCallback((value: boolean) => {
    setIsAuthed(value);
    if (value) {
      sessionStorage.setItem('tw-authed', 'true');
    } else {
      sessionStorage.removeItem('tw-authed');
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthed(false);
    sessionStorage.removeItem('tw-authed');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthed, setAuthed, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
