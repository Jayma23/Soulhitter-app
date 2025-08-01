import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { UserProvider } from './screens/UserContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <UserProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </UserProvider>
        </GestureHandlerRootView>
    );
}
