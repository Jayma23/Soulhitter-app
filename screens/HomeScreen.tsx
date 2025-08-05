import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Alert,
    Platform,
    Vibration,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
const { width, height } = Dimensions.get('window');
import { useUser } from './UserContext';
import { Image } from 'react-native';
import ChatListScreen from "@/screens/ChatListScreen";

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState(0);
    const { user } = useUser();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;

    console.log(user?.photo)
    console.log(user?.name)

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need camera access to take a selfie');
            return false;
        }
        return true;
    };

    const uploadToCloudinary = async (uri: string) => {
        const data = new FormData();
        const response = await fetch(uri);
        const blob = await response.blob();

        data.append('file', blob as any, 'selfie.jpg');
        data.append('upload_preset', '<YOUR_UPLOAD_PRESET>');

        const res = await fetch('https://api.cloudinary.com/v1_1/dyedqw0mv/image/upload', {
            method: 'POST',
            body: data
        });

        const result = await res.json();
        return result.secure_url;
    };

    const handleVerifyWithSelfie = async () => {
        try {
            const userId = await SecureStore.getItemAsync('user_id');
            if (!userId) {
                Alert.alert('Error', 'Missing user ID');
                return;
            }

            const hasPermission = await requestCameraPermission();
            if (!hasPermission) return;

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.7
            });

            if (result.canceled) {
                Alert.alert('Cancelled', 'No image captured');
                return;
            }

            setIsLoading(true);
            const photoUri = result.assets[0].uri;
            const selfieUrl = await uploadToCloudinary(photoUri);
            console.log({ userId, selfieUrl });

            const res = await fetch('https://ccbackendx-2.onrender.com/verify/identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    selfie_url: selfieUrl
                })
            });

            const data = await res.json();
            if (data.verified) {
                Alert.alert('Success', 'Identity verified!');
            } else {
                Alert.alert('Failed', data.message || 'Face verification failed');
            }
        } catch (err) {
            console.error('Verification error', err);
            Alert.alert('Error', 'Verification process failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
            })
        ]).start();

        // Sparkle animation for featured card
        const sparkleLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(sparkleAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        );
        sparkleLoop.start();

        // Pulse animation for featured card
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        );
        pulseLoop.start();

        loadUserData();

        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => {
            clearInterval(timeInterval);
            sparkleLoop.stop();
            pulseLoop.stop();
        };
    }, []);

    const loadUserData = async () => {
        try {
            const userId = await SecureStore.getItemAsync('user_id');
            // You could fetch user name from API here
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleQuickMatch = async () => {
        if (Platform.OS === 'ios') {
            Vibration.vibrate();
        }

        setIsLoading(true);

        try {
            const user_id = await SecureStore.getItemAsync('user_id');
            console.log('🔐 Retrieved user_id:', user_id);

            if (!user_id) {
                Alert.alert('Error', 'Missing user ID from SecureStore');
                return;
            }

            const res = await fetch('https://ccbackendx-2.onrender.com/match/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('❌ Match check failed:', res.status, text);
                throw new Error('Match check failed');
            }

            const data = await res.json();
            if (res.ok) {
                navigation.navigate('Waiting');
            } else {
                Alert.alert('Error', data.error || 'Quick Match failed');
            }
        } catch (err) {
            console.error('Quick Match error:', err);
            Alert.alert('Server Error', 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await SecureStore.deleteItemAsync('user_id');
                            await SecureStore.deleteItemAsync('token');

                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (err) {
                            console.error('Log out failed:', err);
                            Alert.alert('Error', 'Could not log out');
                        }
                    }
                }
            ]
        );
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    };

    const FeatureCard = ({
                             title,
                             subtitle,
                             iconName,
                             gradientColors,
                             onPress,
                             loading = false,
                             featured = false
                         }: any) => {
        const cardScale = useRef(new Animated.Value(1)).current;
        const cardRotate = useRef(new Animated.Value(0)).current;
        const iconScale = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 0.96,
                    useNativeDriver: true,
                }),
                Animated.spring(iconScale, {
                    toValue: 1.1,
                    useNativeDriver: true,
                }),
                Animated.timing(cardRotate, {
                    toValue: featured ? 1 : 0.5,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        };

        const handlePressOut = () => {
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.spring(iconScale, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.timing(cardRotate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        };

        const rotateInterpolate = cardRotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '2deg']
        });

        return (
            <Animated.View
                style={[
                    styles.cardContainer,
                    featured && styles.featuredCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: featured ? pulseAnim : cardScale },
                            { rotate: rotateInterpolate }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                    style={[styles.card, featured && styles.featuredCardInner]}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={gradientColors}
                        style={[styles.cardGradient, featured && styles.featuredGradient]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {featured && (
                            <>
                                <View style={styles.featuredBadge}>
                                    <Text style={styles.featuredBadgeText}>✨ FEATURED</Text>
                                </View>
                                <Animated.View
                                    style={[
                                        styles.sparkleOverlay,
                                        { opacity: sparkleAnim }
                                    ]}
                                />
                            </>
                        )}
                        <View style={styles.cardContent}>
                            <Animated.View
                                style={[
                                    styles.cardIcon,
                                    featured && styles.featuredIcon,
                                    { transform: [{ scale: iconScale }] }
                                ]}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={featured ? 32 : 28}
                                    color="#ffffff"
                                />
                            </Animated.View>
                            <View style={styles.cardText}>
                                <Text style={[styles.cardTitle, featured && styles.featuredTitle]}>
                                    {title}
                                </Text>
                                <Text style={[styles.cardSubtitle, featured && styles.featuredSubtitle]}>
                                    {subtitle}
                                </Text>
                            </View>
                            <View style={styles.cardArrow}>
                                {loading ? (
                                    <Animated.View style={styles.loadingSpinner} />
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const StatCard = ({ number, label, color }: any) => {
        const statAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(statAnim, {
                toValue: 1,
                duration: 1000,
                delay: Math.random() * 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, []);

        return (
            <Animated.View
                style={[
                    styles.statCard,
                    {
                        opacity: statAnim,
                        transform: [{
                            translateY: statAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                            })
                        }]
                    }
                ]}
            >
                <Text style={[styles.statNumber, { color }]}>{number}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </Animated.View>
        );
    };

    const TabButton = ({ iconName, label, isActive, onPress }: any) => {
        const tabScale = useRef(new Animated.Value(1)).current;

        const handlePress = () => {
            Animated.sequence([
                Animated.timing(tabScale, {
                    toValue: 0.9,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(tabScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
            onPress();
        };

        return (
            <Animated.View style={[styles.tabButton, { transform: [{ scale: tabScale }] }]}>
                <TouchableOpacity
                    style={styles.tabButtonInner}
                    onPress={handlePress}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={iconName}
                        size={26}
                        color={isActive ? '#10b981' : '#9ca3af'}
                    />
                    <Text style={[styles.tabLabel, { color: isActive ? '#10b981' : '#9ca3af' }]}>
                        {label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Profile Option Item Component
    const ProfileOptionItem = ({ iconName, title, subtitle, onPress, gradientColors }: any) => {
        const optionScale = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(optionScale, {
                toValue: 0.97,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(optionScale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View style={[styles.profileOptionContainer, { transform: [{ scale: optionScale }] }]}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={styles.profileOption}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.profileOptionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.profileOptionContent}>
                            <View style={styles.profileOptionIcon}>
                                <Ionicons name={iconName} size={24} color="#ffffff" />
                            </View>
                            <View style={styles.profileOptionText}>
                                <Text style={styles.profileOptionTitle}>{title}</Text>
                                <Text style={styles.profileOptionSubtitle}>{subtitle}</Text>
                            </View>
                            <View style={styles.profileOptionArrow}>
                                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderMainContent = () => {
        return (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <TouchableOpacity>
                            <Text style={styles.userName}>{user?.name} 👋</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeText}>
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('profileUpdate')}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.profileGradient}
                        >
                            <Ionicons name="person" size={24} color="#ffffff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Section */}
                <Animated.View
                    style={[
                        styles.statsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                </Animated.View>

                {/* Main Features */}
                <View style={styles.featuresContainer}>
                    <Text style={styles.sectionTitle}>Find Your Match</Text>

                    {/* Circular Deep Match Button */}
                    <View style={styles.circularMatchContainer}>
                        <Animated.View
                            style={[
                                styles.circularMatchWrapper,
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        { translateY: slideAnim },
                                        { scale: pulseAnim }
                                    ]
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.circularMatchButton}
                                onPress={() => navigation.navigate('Preference', { mode: 'detailed' })}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2', '#f093fb']}
                                    style={styles.circularGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {/* Animated sparkle overlay */}
                                    <Animated.View
                                        style={[
                                            styles.circularSparkle,
                                            { opacity: sparkleAnim }
                                        ]}
                                    />

                                    {/* Heart icon */}
                                    <View style={styles.circularIconContainer}>
                                        <Ionicons name="heart" size={48} color="#ffffff" />
                                    </View>

                                    {/* Text content */}
                                    <View style={styles.circularTextContainer}>
                                        <Text style={styles.circularTitle}>Deep Match</Text>
                                        <Text style={styles.circularSubtitle}>
                                            Start your journey to find meaningful connections
                                        </Text>
                                    </View>

                                    {/* Floating hearts animation */}
                                    <View style={styles.floatingHeart1}>
                                        <Animated.View
                                            style={{
                                                transform: [{
                                                    translateY: sparkleAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, -20]
                                                    })
                                                }],
                                                opacity: sparkleAnim
                                            }}
                                        >
                                            <Text style={styles.floatingHeartText}>💖</Text>
                                        </Animated.View>
                                    </View>

                                    <View style={styles.floatingHeart2}>
                                        <Animated.View
                                            style={{
                                                transform: [{
                                                    translateY: sparkleAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, -15]
                                                    })
                                                }],
                                                opacity: sparkleAnim.interpolate({
                                                    inputRange: [0, 0.5, 1],
                                                    outputRange: [0, 1, 0]
                                                })
                                            }}
                                        >
                                            <Text style={styles.floatingHeartText}>✨</Text>
                                        </Animated.View>
                                    </View>

                                    <View style={styles.floatingHeart3}>
                                        <Animated.View
                                            style={{
                                                transform: [{
                                                    translateY: sparkleAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, -25]
                                                    })
                                                }],
                                                opacity: sparkleAnim.interpolate({
                                                    inputRange: [0, 0.3, 0.7, 1],
                                                    outputRange: [0, 1, 1, 0]
                                                })
                                            }}
                                        >
                                            <Text style={styles.floatingHeartText}>💕</Text>
                                        </Animated.View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Ripple effect */}
                        <Animated.View
                            style={[
                                styles.rippleEffect,
                                {
                                    opacity: sparkleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 0]
                                    }),
                                    transform: [{
                                        scale: sparkleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.3]
                                        })
                                    }]
                                }
                            ]}
                        />
                    </View>
                </View>

                {/* Bottom Spacing for tab bar */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return renderMainContent();
            case 1:
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.tabContentTitle}>Matches</Text>
                        <Text style={styles.tabContentSubtitle}>Your potential matches will appear here</Text>
                    </View>
                );
            case 2:
                return (
                    <ChatListScreen />
                );
            case 3:
                return (
                    <ScrollView
                        style={styles.profileScrollView}
                        contentContainerStyle={styles.profileScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.profileTabContent}>
                            {/* Profile Header */}
                            <View style={styles.profileAvatarContainer}>
                                {user?.photo ? (
                                    <Image
                                        source={{ uri: user?.photo ?? 'default.png' }}
                                        style={styles.profileImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.profileAvatar}
                                    >
                                        <Ionicons name="person" size={40} color="#ffffff" />
                                    </LinearGradient>
                                )}
                                <Text style={styles.profileName}>{user?.name ?? 'Anonymous'}</Text>
                            </View>

                            {/* Profile Options */}
                            <View style={styles.profileOptionsContainer}>
                                <ProfileOptionItem
                                    iconName="person-outline"
                                    title="Personal Information"
                                    subtitle="Manage your personal details"
                                    gradientColors={['#4facfe', '#00f2fe']}
                                    onPress={() => navigation.navigate('profileUpdate')}
                                />

                                <ProfileOptionItem
                                    iconName="settings-outline"
                                    title="Settings"
                                    subtitle="App preferences and configurations"
                                    gradientColors={['#667eea', '#764ba2']}
                                    onPress={() => navigation.navigate('Settings')}
                                />

                                <ProfileOptionItem
                                    iconName="wallet-outline"
                                    title="Cold Wallet"
                                    subtitle="Secure cryptocurrency storage"
                                    gradientColors={['#f093fb', '#f5576c']}
                                    onPress={() => navigation.navigate('ColdWallet')}
                                />

                                {/* Logout Button */}
                                <View style={styles.logoutSection}>
                                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                        <LinearGradient
                                            colors={['#ff6b6b', '#ee5a52']}
                                            style={styles.logoutGradient}
                                        >
                                            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                                            <Text style={styles.logoutButtonText}>Logout</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                );
            default:
                return renderMainContent();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Main Content */}
            <View style={styles.mainContent}>
                {renderTabContent()}
            </View>

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <TabButton
                    iconName="home"
                    label="Home"
                    isActive={activeTab === 0}
                    onPress={() => setActiveTab(0)}
                />
                <TabButton
                    iconName="heart"
                    label="Matches"
                    isActive={activeTab === 1}
                    onPress={() => setActiveTab(1)}
                />
                <TabButton
                    iconName="chatbubbles"
                    label="Messages"
                    isActive={activeTab === 2}
                    onPress={() => setActiveTab(2)}
                />
                <TabButton
                    iconName="person"
                    label="Profile"
                    isActive={activeTab === 3}
                    onPress={() => setActiveTab(3)}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    mainContent: {
        flex: 1,
        paddingBottom: 90, // 减少底部padding，匹配tabBar高度
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 10, // 减少顶部padding
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        marginBottom: 16,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    timeText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    profileButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    profileGradient: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    statsContainer: {
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 32, // 增加间距
        letterSpacing: 0.5,
        textAlign: 'center', // 居中标题
    },
    featuresContainer: {
        marginBottom: 32,
        alignItems: 'center', // 居中容器
    },
    // Circular Match Button Styles
    circularMatchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginTop: 20,
    },
    circularMatchWrapper: {
        position: 'relative',
    },
    circularMatchButton: {
        width: 280,
        height: 280,
        borderRadius: 140,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    circularGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    circularSparkle: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 140,
    },
    circularIconContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    circularTextContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    circularTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    circularSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Floating hearts
    floatingHeart1: {
        position: 'absolute',
        top: 40,
        right: 50,
    },
    floatingHeart2: {
        position: 'absolute',
        top: 60,
        left: 40,
    },
    floatingHeart3: {
        position: 'absolute',
        bottom: 50,
        right: 40,
    },
    floatingHeartText: {
        fontSize: 20,
    },
    // Ripple effect
    rippleEffect: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 2,
        borderColor: '#667eea',
        backgroundColor: 'transparent',
    },
    cardContainer: {
        marginBottom: 16,
    },
    featuredCard: {
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    featuredCardInner: {
        borderRadius: 24,
    },
    cardGradient: {
        padding: 20,
        position: 'relative',
    },
    featuredGradient: {
        padding: 24,
    },
    featuredBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    featuredBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ff6b6b',
        letterSpacing: 0.5,
    },
    sparkleOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    featuredIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    featuredTitle: {
        fontSize: 22,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 20,
    },
    featuredSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: 'rgba(255,255,255,0.9)',
    },
    cardArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSpinner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderTopColor: 'transparent',
    },
    bottomSpacing: {
        height: 20, // 大幅减少底部空白
    },
    // Tab Bar Styles
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingVertical: 12, // 减少垂直padding
        paddingHorizontal: 0,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12, // iOS考虑Home indicator
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90, // 保持固定高度
        width: '100%',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8, // 减少padding
        paddingHorizontal: 0,
        position: 'relative',
        minHeight: 50, // 减少最小高度
        width: '25%',
    },
    tabButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
    },
    activeIndicator: {
        position: 'absolute',
        top: -16,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    // Tab Content Styles
    tabContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    tabContentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    tabContentSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    // Profile Tab Styles
    profileScrollView: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    profileScrollContent: {
        paddingBottom: 100, // 减少profile页面底部空白
    },
    profileTabContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    profileAvatarContainer: {
        alignItems: 'center',
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 34,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    profileOptionsContainer: {
        flex: 1,
    },
    profileOptionContainer: {
        marginBottom: 16,
    },
    profileOption: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    profileOptionGradient: {
        padding: 20,
    },
    profileOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileOptionText: {
        flex: 1,
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#fff',
        marginBottom: 10, // 与名字之间留点空隙
    },
    profileOptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    profileOptionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
    },
    profileOptionArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutSection: {
        marginTop: 32,
        alignItems: 'center',
    },
    logoutButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        minWidth: 200,
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});