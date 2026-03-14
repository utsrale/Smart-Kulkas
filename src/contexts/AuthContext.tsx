import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

// FLAG UNTUK PREVIEW UI
export const IS_DEMO_MODE = false;

interface AuthContextType {
    user: any | null; // Changed to any to support dummy user
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (IS_DEMO_MODE) {
            // Auto-login dummy user for UI purposes
            setTimeout(() => {
                setUser({ uid: 'demo-123', email: 'jessica@example.com' });
                setIsLoading(false);
            }, 500);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (usr) => {
            setUser(usr);
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
