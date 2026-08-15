import React, { createContext, useContext, useState } from 'react';

// Aplikasi berjalan sepenuhnya lokal tanpa login.
// User bersifat "guest" permanen; semua data disimpan di perangkat (AsyncStorage).
interface AuthContextType {
    user: { uid: string; displayName: string | null; email: string | null } | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: { uid: 'local', displayName: null, email: null },
    isLoading: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user] = useState<AuthContextType['user']>({ uid: 'local', displayName: null, email: null });

    return (
        <AuthContext.Provider value={{ user, isLoading: false }}>
            {children}
        </AuthContext.Provider>
    );
};
