import React, { useState, useRef, useEffect } from 'react';
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
    SafeAreaView,
    Platform,
    Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface WalletData {
    symbol: string;
    name: string;
    balance: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface ActionCardProps {
    title: string;
    subtitle: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    gradientColors: readonly [string, string, ...string[]];
}

interface WalletCardProps {
    wallet: WalletData;
    index: number;
}

const walletData: WalletData[] = [
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.00123456', value: '$45.67', icon: 'logo-bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', balance: '0.245', value: '$432.10', icon: 'diamond-outline' },
    { symbol: 'SOL', name: 'Solana', balance: '12.34', value: '$789.23', icon: 'sunny-outline' },
    { symbol: 'USDC', name: 'USD Coin', balance: '1,234.56', value: '$1,234.56', icon: 'disc-outline' },
];

export default function ColdWalletScreen() {
    const insets = useSafeAreaInsets();
    const [totalBalance] = useState('$2,501.56');

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // Continuous shimmer effect
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        );
        shimmerLoop.start();

        // Pulse animation
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        );
        pulseLoop.start();

        return () => {
            shimmerLoop.stop();
            pulseLoop.stop();
        };
    }, []);

    const WalletCard: React.FC<WalletCardProps> = ({ wallet, index }) => {
        const cardScale = useRef(new Animated.Value(1)).current;
        const cardRotate = useRef(new Animated.Value(0)).current;

        const handlePressIn = () => {
            if (Platform.OS === 'ios') {
                Vibration.vibrate();
            }
            Animated.parallel([
                Animated.spring(cardScale, {
                    toValue: 0.96,
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
                Animated.timing(cardRotate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        };

        const rotateInterpolate = cardRotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '1deg']
        });

        const gradientColors: readonly [string, string] = index % 2 === 0
            ? ['rgba(240, 147, 251, 0.8)', 'rgba(245, 87, 108, 0.8)'] as const
            : ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'] as const;

        return (
            <Animated.View
                style={[
                    styles.walletCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: cardScale },
                            { rotate: rotateInterpolate }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => {
                        Alert.alert(
                            `${wallet.name}`,
                            `Balance: ${wallet.balance} ${wallet.symbol}\nValue: ${wallet.value}`,
                            [
                                { text: 'Send', onPress: () => console.log('Send pressed') },
                                { text: 'Receive', onPress: () => console.log('Receive pressed') },
                                { text: 'Cancel', style: 'cancel' }
                            ]
                        );
                    }}
                    style={styles.walletCardInner}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.walletCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Shimmer overlay */}
                        <Animated.View
                            style={[
                                styles.shimmerOverlay,
                                {
                                    opacity: shimmerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 0.3]
                                    })
                                }
                            ]}
                        />

                        <View style={styles.walletCardContent}>
                            <View style={styles.walletIconContainer}>
                                <View style={styles.walletIcon}>
                                    <Ionicons name={wallet.icon} size={28} color="#ffffff" />
                                </View>
                                <View style={styles.hexPattern}>
                                    <Text style={styles.hexText}>⬢</Text>
                                </View>
                            </View>

                            <View style={styles.walletInfo}>
                                <View style={styles.walletHeader}>
                                    <Text style={styles.walletSymbol}>{wallet.symbol}</Text>
                                    <View style={styles.statusDot} />
                                </View>
                                <Text style={styles.walletName}>{wallet.name}</Text>
                                <View style={styles.balanceContainer}>
                                    <Text style={styles.walletBalance}>{wallet.balance}</Text>
                                    <Text style={styles.walletValue}>{wallet.value}</Text>
                                </View>
                            </View>

                            <View style={styles.walletActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="arrow-up" size={16} color="#ffffff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="arrow-down" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Blockchain pattern overlay */}
                        <View style={styles.blockchainPattern}>
                            <Text style={styles.patternText}>⬣ ⬢ ⬣</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, iconName, onPress, gradientColors }) => {
        const actionScale = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(actionScale, {
                toValue: 0.95,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(actionScale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View
                style={[
                    styles.actionCard,
                    { transform: [{ scale: actionScale }] }
                ]}
            >
                <TouchableOpacity
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={onPress}
                    style={styles.actionCardInner}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.actionCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name={iconName} size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.actionTitle}>{title}</Text>
                        <Text style={styles.actionSubtitle}>{subtitle}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#1a1f3a', '#2d3561', '#4c5aa3', '#7b4397', '#dc2430']}
                style={styles.backgroundGradient}
            />

            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
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
                    <TouchableOpacity style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cold Wallet</Text>
                    <TouchableOpacity style={styles.menuButton}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Total Balance Card */}
                <Animated.View
                    style={[
                        styles.balanceCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }, { scale: pulseAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.balanceCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Animated background pattern */}
                        <Animated.View
                            style={[
                                styles.balancePattern,
                                {
                                    opacity: shimmerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.1, 0.3]
                                    })
                                }
                            ]}
                        />

                        <View style={styles.balanceHeader}>
                            <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
                            <View style={styles.balanceControls}>
                                <TouchableOpacity style={styles.controlButton}>
                                    <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.controlButton}>
                                    <Ionicons name="refresh-outline" size={16} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.totalBalance}>{totalBalance}</Text>
                        <Text style={styles.balanceChange}>+2.34% (24h)</Text>

                        {/* Decorative crypto symbols - repositioned */}
                        <View style={styles.cryptoSymbols}>
                            <Text style={styles.cryptoSymbol}>₿</Text>
                            <Text style={styles.cryptoSymbol}>Ξ</Text>
                            <Text style={styles.cryptoSymbol}>◎</Text>
                            <Text style={styles.cryptoSymbol}>●</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View
                    style={[
                        styles.actionsSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <ActionCard
                            title="Send"
                            subtitle="Transfer crypto"
                            iconName="paper-plane-outline"
                            gradientColors={['rgba(255, 107, 107, 0.8)', 'rgba(238, 90, 82, 0.8)'] as const}
                            onPress={() => Alert.alert('Send', 'Send crypto functionality')}
                        />
                        <ActionCard
                            title="Receive"
                            subtitle="Get crypto"
                            iconName="download-outline"
                            gradientColors={['rgba(67, 206, 162, 0.8)', 'rgba(24, 90, 157, 0.8)'] as const}
                            onPress={() => Alert.alert('Receive', 'Receive crypto functionality')}
                        />
                        <ActionCard
                            title="Swap"
                            subtitle="Exchange tokens"
                            iconName="swap-horizontal-outline"
                            gradientColors={['rgba(79, 172, 254, 0.8)', 'rgba(0, 242, 254, 0.8)'] as const}
                            onPress={() => Alert.alert('Swap', 'Swap crypto functionality')}
                        />
                        <ActionCard
                            title="Stake"
                            subtitle="Earn rewards"
                            iconName="layers-outline"
                            gradientColors={['rgba(163, 230, 53, 0.8)', 'rgba(236, 252, 203, 0.8)'] as const}
                            onPress={() => Alert.alert('Stake', 'Staking functionality')}
                        />
                    </View>
                </Animated.View>

                {/* Wallet List */}
                <Animated.View
                    style={[
                        styles.walletsSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Assets</Text>
                        <TouchableOpacity style={styles.addButton}>
                            <Ionicons name="add" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    {walletData.map((wallet, index) => (
                        <WalletCard key={wallet.symbol} wallet={wallet} index={index} />
                    ))}
                </Animated.View>

                {/* Security Section */}
                <Animated.View
                    style={[
                        styles.securitySection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.securityCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.securityHeader}>
                            <View style={styles.shieldIcon}>
                                <Ionicons name="shield-checkmark" size={24} color="#4ade80" />
                            </View>
                            <Text style={styles.securityTitle}>Secure Storage</Text>
                        </View>
                        <Text style={styles.securityText}>
                            Your assets are secured with military-grade encryption and stored offline in a hardware wallet.
                        </Text>
                        <View style={styles.securityFeatures}>
                            <View style={styles.feature}>
                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                <Text style={styles.featureText}>Offline Storage</Text>
                            </View>
                            <View style={styles.feature}>
                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                <Text style={styles.featureText}>Multi-Signature</Text>
                            </View>
                            <View style={styles.feature}>
                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                <Text style={styles.featureText}>Encrypted Backup</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1f3a',
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceCard: {
        borderRadius: 24,
        marginBottom: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    balanceCardGradient: {
        padding: 30,
        position: 'relative',
        minHeight: 160,
    },
    balancePattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceLabel: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    balanceControls: {
        flexDirection: 'row',
        gap: 8,
    },
    controlButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalBalance: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: -1,
        textAlign: 'center',
    },
    balanceChange: {
        fontSize: 16,
        color: '#4ade80',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    cryptoSymbols: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    cryptoSymbol: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.3)',
        fontWeight: 'bold',
    },
    actionsSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: (width - 50) / 2,
        marginBottom: 15,
    },
    actionCardInner: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    actionCardGradient: {
        padding: 20,
        alignItems: 'center',
        minHeight: 120,
        justifyContent: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    walletsSection: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletCard: {
        marginBottom: 16,
    },
    walletCardInner: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    walletCardGradient: {
        padding: 20,
        position: 'relative',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    walletCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletIconContainer: {
        position: 'relative',
        marginRight: 16,
    },
    walletIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hexPattern: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    hexText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    walletInfo: {
        flex: 1,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    walletSymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginRight: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
    },
    walletName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 8,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    walletBalance: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginRight: 8,
    },
    walletValue: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    walletActions: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    blockchainPattern: {
        position: 'absolute',
        bottom: 8,
        right: 16,
    },
    patternText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: 2,
    },
    securitySection: {
        marginBottom: 20,
    },
    securityCard: {
        borderRadius: 20,
        padding: 24,
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    shieldIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    securityTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    securityText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 20,
        marginBottom: 16,
    },
    securityFeatures: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '48%',
    },
    featureText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 6,
        fontWeight: '500',
    },
});