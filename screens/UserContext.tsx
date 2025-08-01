// UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
type UserType = {
    name: string | null;
    email: string | null;
    photo: string | null;
    user_id: string | null;
    token: string | null;
};

type UserContextType = {
    user: UserType | null;
    setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);



export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within UserProvider');
    return context;
};
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        const loadUserFromStorage = async () => {
            const user_id = await SecureStore.getItemAsync('user_id');
            const name = await SecureStore.getItemAsync('name1');
            const email = await SecureStore.getItemAsync('email1');
            const photo = await SecureStore.getItemAsync('photo');
            const token = await SecureStore.getItemAsync('token');
            console.log(photo, "ewewew")

            if (user_id && email && token) {
                setUser({
                    user_id,
                    name: name ?? null,
                    email,
                    photo: photo ?? null,
                    token,
                });
            }
        };

        loadUserFromStorage();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};