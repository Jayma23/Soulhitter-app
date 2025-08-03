import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Animated,
    Easing,
    ScrollView
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 定义导航类型
type RootStackParamList = {
    Login: {
        prefillEmail?: string;
        prefillPassword?: string;
    };
    ProfileSetup: undefined;
    Register: undefined;
    Home: undefined;
    MainTabs: undefined;
};

type NavigationProps = NavigationProp<RootStackParamList>;

// 简化的密码输入组件 - 完全避开系统检测
const PasswordInput = React.memo(({
                                      placeholder,
                                      value,
                                      onChangeText,
                                      isFocused,
                                      onFocus,
                                      onBlur,
                                      isVisible,
                                      onToggleVisibility
                                  }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    isFocused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    isVisible: boolean;
    onToggleVisibility: () => void;
}) => {
    return (
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
            <Ionicons
                name="lock-closed"
                size={20}
                color={isFocused ? '#ff6b4a' : '#9ca3af'}
                style={styles.inputIcon}
            />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                // 关键：完全不让系统知道这是密码
                secureTextEntry={false}
                autoCapitalize="none"
                autoCorrect={false}
                // 不使用任何密码相关的属性
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
                // 强制透明选择
                selectionColor="#ff6b4a"
                selectTextOnFocus={false}
                editable={true}
                // 手动处理密码显示
                defaultValue=""
            />
            <TouchableOpacity
                onPress={onToggleVisibility}
                style={styles.eyeIcon}
            >
                <Ionicons
                    name={isVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color="#ff6b4a"
                />
            </TouchableOpacity>
        </View>
    );
});

// 将CustomInput提取为独立组件，使用React.memo优化
const CustomInput = React.memo(({
                                    placeholder,
                                    value,
                                    onChangeText,
                                    secureTextEntry = false,
                                    keyboardType = 'default',
                                    autoCapitalize = 'sentences',
                                    iconName,
                                    isPassword = false,
                                    isConfirmPassword = false,
                                    isFocused,
                                    onFocus,
                                    onBlur,
                                    isPasswordVisible,
                                    isConfirmPasswordVisible,
                                    onTogglePassword
                                }: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    iconName: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    isConfirmPassword?: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    isPasswordVisible?: boolean;
    isConfirmPasswordVisible?: boolean;
    onTogglePassword?: () => void;
}) => {
    return (
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
            <Ionicons
                name={iconName}
                size={20}
                color={isFocused ? '#ff6b4a' : '#9ca3af'}
                style={styles.inputIcon}
            />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                style={styles.input}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboardType}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && (isPassword ? !isPasswordVisible : !isConfirmPasswordVisible)}
                onFocus={onFocus}
                onBlur={onBlur}
                // 完全禁用所有自动功能
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                // 强制清除所有可能导致高亮的属性
                selectionColor="#ff6b4a"
                underlineColorAndroid="transparent"
                // 对于密码框，使用特殊处理
                {...(secureTextEntry && {
                    textContentType: "none",
                    autoComplete: "off",
                    keyboardType: "default",
                    passwordRules: "",
                })}
                // 确保输入框始终可编辑
                editable={true}
                // 阻止系统选择文本
                selectTextOnFocus={false}
                // 强制使用系统默认行为
                allowFontScaling={false}
            />
            {secureTextEntry && (
                <TouchableOpacity
                    onPress={onTogglePassword}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={
                            isPassword
                                ? (isPasswordVisible ? 'eye-off' : 'eye')
                                : (isConfirmPasswordVisible ? 'eye-off' : 'eye')
                        }
                        size={20}
                        color="#ff6b4a"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
});

export default function RegisterScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // 使用 useRef 来跟踪组件是否已卸载
    const isMountedRef = useRef(true);

    // 动画值
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // 使用useCallback优化事件处理函数
    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
    }, []);

    const handlePasswordChange = useCallback((text: string) => {
        setPassword(text);
    }, []);

    const handleConfirmPasswordChange = useCallback((text: string) => {
        setConfirmPassword(text);
    }, []);

    const handleEmailFocus = useCallback(() => {
        setFocusedInput('Email Address');
    }, []);

    const handleEmailBlur = useCallback(() => {
        setFocusedInput(null);
    }, []);

    const handlePasswordFocus = useCallback(() => {
        setFocusedInput('Password');
    }, []);

    const handlePasswordBlur = useCallback(() => {
        setFocusedInput(null);
    }, []);

    const handleConfirmPasswordFocus = useCallback(() => {
        setFocusedInput('Confirm Password');
    }, []);

    const handleConfirmPasswordBlur = useCallback(() => {
        setFocusedInput(null);
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setIsPasswordVisible(prev => !prev);
    }, []);

    const toggleConfirmPasswordVisibility = useCallback(() => {
        setIsConfirmPasswordVisible(prev => !prev);
    }, []);

    const toggleTermsAgreement = useCallback(() => {
        setAgreedToTerms(prev => !prev);
    }, []);

    const navigateToLogin = useCallback(() => {
        navigation.navigate('Login', {});
    }, [navigation]);

    useEffect(() => {
        isMountedRef.current = true;

        // 入场动画
        const animationSequence = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: true,
            })
        ]);

        animationSequence.start();

        // 清理函数
        return () => {
            isMountedRef.current = false;
            animationSequence.stop();
        };
    }, []);

    const validateEmail = useCallback((email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validatePassword = useCallback((password: string) => {
        return password.length >= 8;
    }, []);

    const handleRegister = useCallback(async () => {
        // 防止重复点击
        if (isLoading) return;

        // 表单验证
        if (!email || !password || !confirmPassword) {
            Alert.alert("Notice", "Please fill in all fields");
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert("Invalid Email", "Please enter a valid email address");
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert("Weak Password", "Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Password Mismatch", "Passwords do not match");
            return;
        }

        if (!agreedToTerms) {
            Alert.alert("Terms Required", "Please agree to the terms and conditions");
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting registration for:', email);

            const response = await fetch('https://ccbackendx-2.onrender.com/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password
                })
            });

            // 检查组件是否还在挂载状态
            if (!isMountedRef.current) return;

            console.log('Registration response status:', response.status);

            // 首先检查响应状态
            if (!response.ok) {
                let errorMessage = 'Registration failed';

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
                } catch (parseError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                console.error('Registration failed:', errorMessage);
                Alert.alert("Registration Failed", errorMessage);
                return;
            }

            // 尝试解析成功响应
            let data;
            try {
                data = await response.json();
                console.log('Registration successful:', data);
            } catch (parseError) {
                console.log('Registration successful but no JSON response');
                data = { success: true };
            }

            // 注册成功动画
            if (isMountedRef.current) {
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 0.3,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ]).start();

                // 简单的成功处理
                Alert.alert(
                    'Registration Successful!',
                    'Your account has been created successfully. You will be redirected to sign in.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => {
                                // 跳转到登录页面并预填邮箱和密码
                                navigation.navigate('Login', {
                                    prefillEmail: email.trim().toLowerCase(),
                                    prefillPassword: password
                                });
                            }
                        }
                    ]
                );
            }

        } catch (error) {
            console.error('Registration error:', error);

            // 检查组件是否还在挂载状态
            if (!isMountedRef.current) return;

            let errorMessage = 'Network error. Please check your internet connection and try again.';

            if (error instanceof Error) {
                console.log('Error details:', error.message);
                if (error.message.includes('Network request failed')) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout. Please try again.';
                } else {
                    errorMessage = error.message;
                }
            }

            Alert.alert('Registration Error', errorMessage);
        } finally {
            // 检查组件是否还在挂载状态
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [email, password, confirmPassword, agreedToTerms, isLoading, validateEmail, validatePassword, navigation, fadeAnim]);

    // 使用useMemo优化密码强度计算
    const passwordStrength = useMemo(() => {
        if (password.length === 0) return null;

        const strength = password.length < 4 ? 'Weak' : password.length < 8 ? 'Medium' : 'Strong';
        const width = Math.min((password.length / 8) * 100, 100);
        const color = password.length < 4 ? '#ef4444' : password.length < 8 ? '#f59e0b' : '#10b981';

        return { strength, width, color };
    }, [password.length]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1b3a" />

            <LinearGradient
                colors={['#1a1b3a', '#2d1b69', '#4a1942', '#8b5a2b']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                    keyboardDismissMode="on-drag"
                >
                    <Animated.View
                        style={[
                            styles.contentContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Logo区域 */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="sparkles" size={40} color="#ffffff" />
                            </View>
                            <Text style={styles.logoText}>JOIN THE JOURNEY</Text>
                            <Text style={styles.subtitleText}>Become part of the Soul Hitter community</Text>
                        </View>

                        {/* 表单区域 */}
                        <View style={styles.formContainer}>
                            <CustomInput
                                placeholder="Email Address"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                iconName="mail"
                                isFocused={focusedInput === 'Email Address'}
                                onFocus={handleEmailFocus}
                                onBlur={handleEmailBlur}
                            />

                            <PasswordInput
                                placeholder="Password"
                                value={password}
                                onChangeText={handlePasswordChange}
                                isFocused={focusedInput === 'Password'}
                                onFocus={handlePasswordFocus}
                                onBlur={handlePasswordBlur}
                                isVisible={true}  // 默认显示密码，避免黄色高亮
                                onToggleVisibility={togglePasswordVisibility}
                            />

                            <PasswordInput
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                isFocused={focusedInput === 'Confirm Password'}
                                onFocus={handleConfirmPasswordFocus}
                                onBlur={handleConfirmPasswordBlur}
                                isVisible={true}  // 默认显示密码，避免黄色高亮
                                onToggleVisibility={toggleConfirmPasswordVisibility}
                            />

                            {/* 密码强度指示器 */}
                            {passwordStrength && (
                                <View style={styles.passwordStrengthContainer}>
                                    <View style={styles.passwordStrengthBar}>
                                        <View
                                            style={[
                                                styles.passwordStrengthFill,
                                                {
                                                    width: `${passwordStrength.width}%`,
                                                    backgroundColor: passwordStrength.color
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.passwordStrengthText}>
                                        {passwordStrength.strength}
                                    </Text>
                                </View>
                            )}

                            {/* 条款同意 */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={toggleTermsAgreement}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                                    {agreedToTerms && (
                                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                                    )}
                                </View>
                                <Text style={styles.checkboxText}>
                                    I agree to unleash my infinite potential and accept the <Text style={styles.termsLink}>Terms & Conditions</Text>
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isLoading ? ['#9ca3af', '#6b7280'] : ['#ff6b4a', '#e74c3c', '#9b59b6', '#6f42c1']}
                                    style={styles.buttonGradient}
                                >
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <Animated.View
                                                style={[
                                                    styles.loadingDot,
                                                    {
                                                        transform: [{
                                                            rotate: fadeAnim.interpolate({
                                                                inputRange: [0, 1],
                                                                outputRange: ['0deg', '360deg']
                                                            })
                                                        }]
                                                    }
                                                ]}
                                            />
                                            <Text style={styles.buttonText}>Creating Your Journey...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.buttonText}>Begin Your Journey</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>Or</Text>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                                <Ionicons name="logo-google" size={20} color="#ff6b4a" />
                                <Text style={styles.socialButtonText}>Continue with Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginContainer}
                                onPress={navigateToLogin}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.loginText}>
                                    Already on the journey? <Text style={styles.loginLink}>Welcome back</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1b3a',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 20,
        minHeight: height,
    },
    contentContainer: {
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
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputFocused: {
        borderColor: '#ff6b4a',
        backgroundColor: '#ffffff',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: 'transparent',
        // 强制覆盖任何可能的系统样式
        textShadowColor: 'transparent',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0,
        // 确保输入文字可见
        opacity: 1,
        textDecorationLine: 'none',
        // 阻止任何背景色变化
        borderWidth: 0,
        borderColor: 'transparent',
        // 强制文字颜色
        textAlign: 'left',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    eyeIcon: {
        padding: 4,
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    passwordStrengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        marginRight: 12,
        overflow: 'hidden',
    },
    passwordStrengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    passwordStrengthText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#ff6b4a',
        borderColor: '#ff6b4a',
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    termsLink: {
        color: '#ff6b4a',
        fontWeight: '500',
    },
    registerButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    registerButtonDisabled: {
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
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderTopColor: 'transparent',
        marginRight: 8,
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
        color: '#ff6b4a',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    loginContainer: {
        alignItems: 'center',
    },
    loginText: {
        color: '#6b7280',
        fontSize: 14,
    },
    loginLink: {
        color: '#ff6b4a',
        fontWeight: '600',
    },
});