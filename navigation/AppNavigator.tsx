// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import WaitingScreen from '../screens/WaitingScreen';
import Card from '../screens/Card';
import profileUpdate from '../screens/profileUpdate';
import Settings from '../screens/Settings';
import ChatListTabView from '../screens/ChatListTabView';
import SmartReplyKeyboard from '../screens/SmartReplyKeyboard';
import Preference from '../screens/Preference'
import Gcard from '../screens/Gcard'
import Web3Wallet from '../screens/Web3Wallet'
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    ProfileSetup: undefined;
    Home: undefined;
    PhotoUpload: undefined;
    ChatList: undefined;
    ChatRoom: { chatId: string; partner: { name: string; photo: string } };
    Waiting: undefined;
    Card: undefined;
    profileUpdate: undefined;
    Settings: undefined;
    Preference: undefined;
    Gcard: undefined
    ChatListTabView: undefined
    Web3Wallet: undefined

};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />

            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="Waiting" component={WaitingScreen} />
            <Stack.Screen name="Card" component={Card} />
            <Stack.Screen name="profileUpdate" component={profileUpdate} />
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Preference" component={Preference} />
            <Stack.Screen name="Gcard" component={Gcard} />

            <Stack.Screen name="Web3Wallet" component={Web3Wallet} />

            <Stack.Screen name="ChatListTabView" component={ChatListTabView} />


        </Stack.Navigator>
    );
}

