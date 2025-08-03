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
            <StatusBar barStyle="light-content" backgroundColor="#1a1b3a" />

            <LinearGradient
                colors={['#1a1b3a', '#2d1b69', '#4a1942', '#8b5a2b']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={styles.contentContainer}>
                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="sparkles" size={40} color="#ffffff" />
                    </View>
                    <Text style={styles.logoText}>SOUL HITTER</Text>
                    <Text style={styles.subtitleText}>Strike the power within your soul, unleash your infinite potential</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={20} color="#ff6b4a" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor="#a0a0a0"
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
                        <Ionicons name="lock-closed" size={20} color="#ff6b4a" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#a0a0a0"
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
                                color="#ff6b4a"
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
                            colors={isLoading ? ['#a0a0a0', '#808080'] : ['#ff6b4a', '#e74c3c', '#9b59b6', '#6f42c1']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Start Exploring'}
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
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.socialButtonGradient}
                        >
                            <Ionicons name="logo-google" size={20} color="#ff6b4a" />
                            <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <TouchableOpacity
                        style={styles.signupContainer}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.signupText}>
                            New to Soul Hitter? <Text style={styles.signupLink}>Join the journey</Text>
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
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        letterSpacing: 2,
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderRadius: 25,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 15,
        },
        shadowOpacity: 0.35,
        shadowRadius: 25,
        elevation: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 15,
        marginBottom: 18,
        paddingHorizontal: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        paddingVertical: 18,
        fontSize: 16,
        color: '#2d3748',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 6,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 28,
    },
    forgotPasswordText: {
        color: '#ff6b4a',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#ff6b4a',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 20,
        color: '#718096',
        fontSize: 14,
        fontWeight: '500',
    },
    socialButton: {
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    socialButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    socialButtonText: {
        color: '#2d3748',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    signupContainer: {
        alignItems: 'center',
    },
    signupText: {
        color: '#718096',
        fontSize: 15,
        fontWeight: '500',
    },
    signupLink: {
        color: '#ff6b4a',
        fontWeight: '700',
    },
});