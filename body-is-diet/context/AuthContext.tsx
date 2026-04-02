import { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearTokens, getUserName, saveUserName } from '../services/api';

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    userName: string | null;
    signIn: (name?: string) => void;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

/** Decode a JWT and check it hasn't expired — no library needed */
function isTokenValid(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return false;
        // exp is in seconds, Date.now() is in milliseconds
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function checkAuth() {
            try {
                const [token, name] = await Promise.all([getAccessToken(), getUserName()]);
                const valid = !!token && isTokenValid(token);

                if (token && !valid) {
                    await clearTokens();
                }

                if (isMounted) {
                    setIsAuthenticated(valid);
                    setUserName(valid ? name : null);
                }
            } catch (error) {
                console.error('Failed to check auth:', error);
                if (isMounted) setIsAuthenticated(false);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        checkAuth();
        return () => { isMounted = false; };
    }, []);

    const signIn = (name?: string) => {
        setIsAuthenticated(true);
        if (name) {
            setUserName(name);
            saveUserName(name);
        }
    };

    const signOut = async () => {
        await clearTokens();
        setIsAuthenticated(false);
        setUserName(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userName, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
