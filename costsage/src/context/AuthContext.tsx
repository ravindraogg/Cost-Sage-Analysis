// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Option 1: Decode token if it contains user info (e.g., JWT)
      try {
        const decoded = JSON.parse(atob(token.split('.')[1])); // Basic JWT decoding
        setUser({
          email: decoded.email || 'user@example.com',
          displayName: decoded.name || undefined,
          photoURL: decoded.picture || undefined,
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
      // Option 2: Fetch user info from API using token
      /*
      fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUser({ email: data.email, displayName: data.name, photoURL: data.photo }))
        .catch(err => console.error('Failed to fetch user:', err));
      */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};