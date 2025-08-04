import ChatListTabView from "@/screens/ChatListTabView";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from './UserContext';
const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [lastTap, setLastTap] = useState(0);
    const { user } = useUser();
    const insets = useSafeAreaInsets();

    // Enhanced Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const profileMenuAnim = useRef(new Animated.Value(0)).current;
    const cardScaleAnim = useRef(new Animated.Value(1)).current;
    const tabBarAnim = useRef(new Animated.Value(0)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Enhanced entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(tabBarAnim, {
                toValue: 1,
                duration: 1000,
                delay: 300,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
            })
        ]).start();

        // Enhanced sparkle animation
        const sparkleLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(sparkleAnim, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        );
        sparkleLoop.start();

        // Enhanced pulse animation
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        );
        pulseLoop.start();

        // Enhanced float animation
        const floatLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 5000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 5000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        );
        floatLoop.start();

        return () => {
            sparkleLoop.stop();
            pulseLoop.stop();
            floatLoop.stop();
        };
    }, []);

    const handleLogout = async () => {
        // Enhanced haptic feedback
        if (Platform.OS === 'ios') {
            Vibration.vibrate(2);
        }

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
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    };

    const handleProfilePress = () => {
        // Enhanced haptic feedback
        if (Platform.OS === 'ios') {
            Vibration.vibrate(1);
        }

        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
            // Double tap detected - show profile menu
            setShowProfileMenu(!showProfileMenu);
            Animated.timing(profileMenuAnim, {
                toValue: showProfileMenu ? 0 : 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else {
            // Single tap - navigate to profile
            navigation.navigate('profileUpdate');
        }
        setLastTap(now);
    };

    // Enhanced Beautiful Feature Card
    const BeautifulFeatureCard = ({ onPress, loading = false }: any) => {
        const cardScale = useRef(new Animated.Value(1)).current;
        const buttonGlow = useRef(new Animated.Value(0)).current;
        const cardRotate = useRef(new Animated.Value(0)).current;

        const handlePressIn = () => {
            if (Platform.OS === 'ios') {
                Vibration.vibrate(1);
            }

            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 0.98,
                    useNativeDriver: true,
                }),
                Animated.timing(buttonGlow, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(cardRotate, {
                    toValue: 1,
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
                Animated.timing(buttonGlow, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(cardRotate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        };

        const floatInterpolate = floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3]
        });

        const sparkleOpacity = sparkleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3]
        });

        const glowOpacity = buttonGlow.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
        });

        const rotateInterpolate = cardRotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '2deg']
        });

        return (
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: Animated.add(slideAnim, floatInterpolate) },
                            { scale: Animated.multiply(pulseAnim, cardScale) },
                            { rotate: rotateInterpolate }
                        ]
                    }
                ]}
            >
                {/* Enhanced glow effect */}
                <Animated.View
                    style={[
                        styles.cardGlow,
                        { opacity: glowOpacity }
                    ]}
                />

                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                    style={styles.card}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Enhanced sparkle overlay */}
                        <Animated.View
                            style={[
                                styles.sparkleOverlay,
                                { opacity: sparkleOpacity }
                            ]}
                        />

                        {/* Enhanced featured badge */}
                        <View style={styles.featuredBadge}>
                            <Ionicons name="star" size={12} color="#1a1f3a" />
                            <Text style={styles.featuredText}> FEATURED</Text>
                        </View>

                        <View style={styles.cardContent}>
                            {/* Enhanced icon */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                                    style={styles.iconBackground}
                                >
                                    <Ionicons name="heart" size={28} color="#ffffff" />
                                </LinearGradient>
                            </View>

                            {/* Enhanced text content */}
                            <View style={styles.textContent}>
                                <Text style={styles.cardTitle}>Deep Match</Text>
                                <Text style={styles.cardSubtitle}>
                                    Find a card that can represent you
                                </Text>
                            </View>

                            {/* Enhanced arrow */}
                            <View style={styles.arrowContainer}>
                                {loading ? (
                                    <Animated.View style={styles.loadingSpinner} />
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Enhanced Tab Button
    const TabButton = ({ iconName, label, isActive, onPress }: any) => {
        const tabScale = useRef(new Animated.Value(1)).current;
        const tabGlow = useRef(new Animated.Value(0)).current;

        const handlePress = () => {
            if (Platform.OS === 'ios') {
                Vibration.vibrate(1);
            }

            Animated.sequence([
                Animated.timing(tabScale, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(tabScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();

            // Enhanced glow effect for active tab
            if (isActive) {
                Animated.timing(tabGlow, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }

            onPress();
        };

        return (
            <Animated.View style={[styles.tabButton, { transform: [{ scale: tabScale }] }]}>
                <TouchableOpacity
                    style={styles.tabButtonInner}
                    onPress={handlePress}
                    activeOpacity={0.8}
                >
                    <Animated.View style={[
                        styles.tabIconContainer,
                        isActive && {
                            transform: [{ scale: pulseAnim }]
                        }
                    ]}>
                        <Ionicons
                            name={iconName}
                            size={24}
                            color={isActive ? '#ffffff' : 'rgba(255,255,255,0.6)'}
                        />
                    </Animated.View>
                    <Text style={[styles.tabLabel, { color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)' }]}>
                        {label}
                    </Text>
                    {isActive && (
                        <Animated.View style={[
                            styles.activeIndicator,
                            { transform: [{ scale: pulseAnim }] }
                        ]} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Enhanced Profile Option Item
    const ProfileOptionItem = ({ iconName, title, subtitle, onPress, gradientColors }: any) => {
        const optionScale = useRef(new Animated.Value(1)).current;
        const optionGlow = useRef(new Animated.Value(0)).current;

        const handlePressIn = () => {
            if (Platform.OS === 'ios') {
                Vibration.vibrate(1);
            }

            Animated.parallel([
                Animated.spring(optionScale, {
                    toValue: 0.98,
                    useNativeDriver: true,
                }),
                Animated.timing(optionGlow, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        };

        const handlePressOut = () => {
            Animated.parallel([
                Animated.spring(optionScale, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.timing(optionGlow, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
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
                                <Ionicons name={iconName} size={20} color="#ffffff" />
                            </View>
                            <View style={styles.profileOptionText}>
                                <Text style={styles.profileOptionTitle}>{title}</Text>
                                <Text style={styles.profileOptionSubtitle}>{subtitle}</Text>
                            </View>
                            <View style={styles.profileOptionArrow}>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
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
                {/* Enhanced Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: headerAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <BlurView intensity={15} style={styles.headerBlur}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                            style={styles.headerGradient}
                        >
                            <View style={styles.headerLeft}>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>{user?.name || 'User'} 👋</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.profileButton}
                                onPress={handleProfilePress}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={20} style={styles.profileButtonBlur}>
                                    <Ionicons name="person" size={20} color="#ffffff" />
                                </BlurView>
                            </TouchableOpacity>
                        </LinearGradient>
                    </BlurView>
                </Animated.View>

                {/* Enhanced Hero Section */}
                <Animated.View
                    style={[
                        styles.heroSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.heroTitle}>Discover & Connect</Text>
                    <Text style={styles.heroSubtitle}>
                        Find meaningful connections with advanced compatibility matching
                    </Text>
                </Animated.View>

                {/* Enhanced Main Feature Card */}
                <BeautifulFeatureCard
                    onPress={() => navigation.navigate('Preference', { mode: 'detailed' })}
                    loading={isLoading}
                />

                {/* Bottom Spacing */}
                <View style={[styles.bottomSpacing, { height: 120 + insets.bottom }]} />
            </ScrollView>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return renderMainContent();
            case 1:
                return <ChatListTabView />;
            case 2:
                return <ChatListTabView />;
            case 3:
                return (
                    <ScrollView
                        style={styles.profileScrollView}
                        contentContainerStyle={[
                            styles.profileScrollContent,
                            { paddingBottom: 120 + insets.bottom }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.profileTabContent}>
                            {/* Enhanced Profile Header */}
                            <View style={styles.profileHeader}>
                                <BlurView intensity={15} style={styles.profileHeaderBlur}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                                        style={styles.profileHeaderGradient}
                                    >
                                        {user?.photo ? (
                                            <Image
                                                source={{ uri: user?.photo ?? 'default.png' }}
                                                style={styles.profileImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.profileAvatar}>
                                                <Ionicons name="person" size={32} color="rgba(255,255,255,0.8)" />
                                            </View>
                                        )}
                                        <Text style={styles.profileName}>{user?.name ?? 'Anonymous'}</Text>
                                    </LinearGradient>
                                </BlurView>
                            </View>

                            {/* Enhanced Profile Options */}
                            <View style={styles.profileOptionsContainer}>
                                <ProfileOptionItem
                                    iconName="person-outline"
                                    title="Personal Information"
                                    subtitle="Manage your details"
                                    gradientColors={['#4facfe', '#00f2fe']}
                                    onPress={() => navigation.navigate('profileUpdate')}
                                />

                                <ProfileOptionItem
                                    iconName="settings-outline"
                                    title="Settings"
                                    subtitle="App preferences"
                                    gradientColors={['#667eea', '#764ba2']}
                                    onPress={() => navigation.navigate('Settings')}
                                />

                                <ProfileOptionItem
                                    iconName="wallet-outline"
                                    title="Cold Wallet"
                                    subtitle="Secure storage"
                                    gradientColors={['#f093fb', '#f5576c']}
                                    onPress={() => navigation.navigate('Web3Wallet')}
                                />

                                {/* Enhanced Logout Button */}
                                <TouchableOpacity 
                                    style={styles.logoutButton} 
                                    onPress={handleLogout}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#ff6b6b', '#ee5a52']}
                                        style={styles.logoutGradient}
                                    >
                                        <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                                        <Text style={styles.logoutButtonText}>Logout</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                );
            default:
                return renderMainContent();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={false}
                hidden={false}
            />

            <SafeAreaView style={styles.safeContainer}>
                {/* Enhanced background gradient */}
                <LinearGradient
                    colors={['#1a1f3a', '#2d4a9c', '#4c63d2', '#7c3aed', '#ec4899']}
                    style={[
                        styles.backgroundGradient,
                        { bottom: 90 + (insets.bottom > 0 ? insets.bottom : 0) }
                    ]}
                />

                <View style={styles.mainContent}>
                    {renderTabContent()}
                </View>

                {/* Enhanced Tab Bar */}
                <Animated.View style={[
                    styles.tabBar,
                    {
                        opacity: tabBarAnim,
                        transform: [{ translateY: tabBarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        }) }],
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                        height: 90 + (insets.bottom > 0 ? insets.bottom : 0),
                    }
                ]}>
                    <BlurView intensity={30} style={styles.tabBarBlur}>
                        <LinearGradient
                            colors={['rgba(26, 31, 58, 0.8)', 'rgba(45, 53, 97, 0.8)']}
                            style={styles.tabBarGradient}
                        >
                            <View style={styles.tabBarContent}>
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
                        </LinearGradient>
                    </BlurView>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1f3a',
    },
    safeContainer: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
    },
    mainContent: {
        flex: 1,
    },

    // Enhanced Header styles
    header: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    headerBlur: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    headerGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 2,
        fontWeight: '500',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    profileButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    profileButtonBlur: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Enhanced Scroll view
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    // Enhanced Hero section
    heroSection: {
        marginBottom: 40,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '400',
        paddingHorizontal: 20,
    },

    // Enhanced Beautiful card styles
    cardWrapper: {
        marginBottom: 20,
        alignItems: 'center',
    },
    cardGlow: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 24,
        backgroundColor: 'rgba(240, 147, 251, 0.4)',
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        width: width - 40,
        shadowColor: '#f093fb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    cardGradient: {
        padding: 20,
        position: 'relative',
    },
    sparkleOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
    },
    featuredBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,215,0,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1a1f3a',
        letterSpacing: 0.5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    iconContainer: {
        marginRight: 16,
    },
    iconBackground: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        flex: 1,
        paddingRight: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 18,
        fontWeight: '400',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSpinner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderTopColor: 'transparent',
    },

    bottomSpacing: {
        height: 120,
    },

    // Enhanced Tab bar styles
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 0,
        overflow: 'hidden',
    },
    tabBarBlur: {
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 10,
        overflow: 'hidden',
    },
    tabBarGradient: {
        flex: 1,
    },
    tabBarContent: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
    },
    tabButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        position: 'relative',
    },
    tabIconContainer: {
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
    },
    activeIndicator: {
        position: 'absolute',
        top: -12,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ffffff',
    },

    // Enhanced Profile styles
    profileScrollView: {
        flex: 1,
    },
    profileScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    profileTabContent: {
        flex: 1,
    },
    profileHeader: {
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    profileHeaderBlur: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    profileHeaderGradient: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    profileOptionsContainer: {
        gap: 12,
    },
    profileOptionContainer: {
        marginBottom: 0,
    },
    profileOption: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    profileOptionGradient: {
        padding: 16,
    },
    profileOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileOptionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileOptionText: {
        flex: 1,
    },
    profileOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 2,
    },
    profileOptionSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    profileOptionArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 20,
    },

    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});