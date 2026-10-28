import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api.ts';
import { 
  auth, 
  signInWithGooglePopup, 
  signInWithGoogleRedirect, 
  checkRedirectResult, 
  syncUserProfileToFirestore 
} from '../lib/firebase.ts';
import { signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  loginWithGoogleRedirect: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; college?: string }) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; college?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setToken(currentToken);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const redirectUser = await checkRedirectResult();
        if (redirectUser && redirectUser.email) {
          const res = await api.googleAuth({
            uid: redirectUser.uid,
            email: redirectUser.email,
            name: redirectUser.displayName || undefined,
            photoUrl: redirectUser.photoURL || undefined
          });
          setStoredToken(res.token);
          setToken(res.token);
          setUser(res.user);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Redirect check result:', err);
      }
      refreshUser();
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    // CRITICAL: Call signInWithGooglePopup immediately before any state update
    // to preserve the user's synchronous interaction context in browsers!
    const fbUser = await signInWithGooglePopup();
    if (!fbUser) {
      return null;
    }
    if (!fbUser.email) {
      throw new Error('Google sign-in did not provide an email address.');
    }

    setLoading(true);
    try {
      const res = await api.googleAuth({
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || undefined,
        photoUrl: fbUser.photoURL || undefined
      });

      // Sync Firestore profile asynchronously
      syncUserProfileToFirestore({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role: res.user.role
      }).catch(err => {
        console.warn('Firestore profile sync info:', err);
      });

      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleRedirect = async () => {
    await signInWithGoogleRedirect();
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; college?: string }): Promise<UserProfile> => {
    const res = await api.register(data);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    firebaseSignOut(auth).catch(() => {});
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; college?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        loginWithGoogle,
        loginWithGoogleRedirect,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
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
