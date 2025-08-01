import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from './UserContext';
// 定义导航类型
type RootStackParamList = {
    Login: {
        prefillEmail?: string;
        prefillPassword?: string;
    };
    Register: undefined;
    Home: undefined;
    ProfileSetup: undefined;
};

type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;
type NavigationProps = NavigationProp<RootStackParamList>;

export default function LoginScreen() {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<LoginScreenRouteProp>();
    const { setUser } = useUser();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    // 处理预填数据
    useEffect(() => {
        if (route.params?.prefillEmail) {
            setEmail(route.params.prefillEmail);
            console.log('Pre-filled email:', route.params.prefillEmail);
        }
        if (route.params?.prefillPassword) {
            setPassword(route.params.prefillPassword);
            console.log('Pre-filled password');
        }
    }, [route.params]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Notice", "Please enter email and password");
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting login for:', email);

            const res = await fetch('https://ccbackendx-2.onrender.com/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password
                })
            });

            console.log('Login response status:', res.status);
            const data = await res.json();
            console.log('Login response data:', data);

            if (!res.ok) {
                const errorMessage = data.error || data.message || 'Please check your credentials';
                Alert.alert("Login Failed", errorMessage);
                setIsLoading(false);
                return;
            }

            // 保存登录信息到 SecureStore

            console.log(data.photo, "cwecevwe")

            // 保存邮箱
            await SecureStore.setItemAsync('user_email', email.trim().toLowerCase());
            await SecureStore.setItemAsync('user_id', String(data.user_id));
            await SecureStore.setItemAsync('name1', String(data.name));
            await SecureStore.setItemAsync('email1', String(data.email));
            await SecureStore.setItemAsync('photo', String(data.photo));
            await SecureStore.setItemAsync('token', String(data.token));
            setUser({
                name: data.name ?? null,
                email: data.email ?? null,
                photo: data.photo ?? null,
                user_id: String(data.user_id),
                token: data.token ?? null,
            });


            console.log('✅ Login Success:', data);

            // 使用 CommonActions.reset 替代 replace
            if (data.form_submitted) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    })
                );
            } else {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'ProfileSetup' }],
                    })
                );
            }

        } catch (err) {
            console.error('Login error:', err);

            let errorMessage = 'Network connection failed, please try again later';

            if (err instanceof Error) {
                if (err.message.includes('Network request failed')) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                } else if (err.message.includes('timeout')) {
                    errorMessage = 'Request timeout. Please try again.';
                } else {
                    errorMessage = err.message;
                }
            }

            Alert.alert('Login Error', errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.contentContainer}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="person" size={40} color="#ffffff" />
                    </View>
                    <Text style={styles.logoText}>Welcome Back</Text>
                    <Text style={styles.subtitleText}>Sign in to your account</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            autoCorrect={false}
                            autoComplete="off"
                            textContentType="none"
                            importantForAutofill="no"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#9ca3af"
                            style={styles.input}
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                            autoCorrect={false}
                            autoComplete="off"
                            textContentType="none"
                            importantForAutofill="no"
                        />
                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                size={20}
                                color="#9ca3af"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotPasswordContainer}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>Or</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                        <Ionicons name="logo-google" size={20} color="#667eea" />
                        <Text style={styles.socialButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <TouchableOpacity
                        style={styles.signupContainer}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.signupText}>
                            Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6b7280',
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 24,
    },
    socialButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    signupContainer: {
        alignItems: 'center',
    },
    signupText: {
        color: '#6b7280',
        fontSize: 14,
    },
    signupLink: {
        color: '#667eea',
        fontWeight: '600',
    },
});