import { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearTokens } from '../services/api';

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

interface TokenPayload { exp: number; userId: string; email: string; name?: string; }

/** Decode a JWT — returns payload if valid and not expired, null otherwise */
function decodeToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload: TokenPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
        return payload;
    } catch {
        return null;
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
                const token = await getAccessToken();
                const payload = token ? decodeToken(token) : null;

                if (token && !payload) {
                    await clearTokens();
                }

                if (isMounted) {
                    setIsAuthenticated(!!payload);
                    setUserName(payload?.name ?? null);
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
        if (name) setUserName(name);
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
