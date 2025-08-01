import React, {useEffect, useState, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    StatusBar,
    Dimensions,
    BackHandler,
    Animated,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
// 导入你现有的游戏
import AirplaneGame from './AirplaneGame';
import CardMatch from './CardMatch';

const {width, height} = Dimensions.get('window');

export default function WaitingScreen() {
    const navigation = useNavigation<any>();
    const [isMatched, setIsMatched] = useState(false);
    const [checking, setChecking] = useState(false);
    const [dots, setDots] = useState('');
    const [searchTime, setSearchTime] = useState(0);
    const [showGame, setShowGame] = useState<'airplane' | 'cardmatch' | null>(null);

    // 搜索动画相关
    const rippleAnim1 = useRef(new Animated.Value(1)).current;
    const rippleAnim2 = useRef(new Animated.Value(1)).current;
    const rippleAnim3 = useRef(new Animated.Value(1)).current;
    const rippleOpacity1 = useRef(new Animated.Value(0.1)).current;
    const rippleOpacity2 = useRef(new Animated.Value(0.15)).current;
    const rippleOpacity3 = useRef(new Animated.Value(0.2)).current;

    // 匹配成功后的加载点动画
    const dotAnim1 = useRef(new Animated.Value(0.4)).current;
    const dotAnim2 = useRef(new Animated.Value(0.7)).current;
    const dotAnim3 = useRef(new Animated.Value(1)).current;

    // 隐藏默认的导航头部
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // 处理 Android 硬件返回键
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (showGame) {
                    // 如果在游戏中，先退出游戏
                    setShowGame(null);
                    return true; // 阻止默认返回行为
                } else {
                    // 如果在等待界面，显示确认对话框
                    handleCancel();
                    return true; // 阻止默认返回行为
                }
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [showGame])
    );

    // 搜索波纹动画
    useEffect(() => {
        const createPulseAnimation = (animValue: Animated.Value, opacityValue: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(animValue, {
                            toValue: 1.3,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityValue, {
                            toValue: 0,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityValue, {
                        toValue: 0.1,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const pulse1 = createPulseAnimation(rippleAnim1, rippleOpacity1, 0);
        const pulse2 = createPulseAnimation(rippleAnim2, rippleOpacity2, 400);
        const pulse3 = createPulseAnimation(rippleAnim3, rippleOpacity3, 800);

        pulse1.start();
        pulse2.start();
        pulse3.start();

        return () => {
            pulse1.stop();
            pulse2.stop();
            pulse3.stop();
        };
    }, []);

    // 匹配成功后的加载点动画
    useEffect(() => {
        if (isMatched) {
            const createDotAnimation = (animValue: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0.4,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            const dot1Anim = createDotAnimation(dotAnim1, 0);
            const dot2Anim = createDotAnimation(dotAnim2, 200);
            const dot3Anim = createDotAnimation(dotAnim3, 400);

            dot1Anim.start();
            dot2Anim.start();
            dot3Anim.start();

            return () => {
                dot1Anim.stop();
                dot2Anim.stop();
                dot3Anim.stop();
            };
        }
    }, [isMatched]);

    useEffect(() => {
        const intervalId = setInterval(checkMatchStatus, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // Animated dots effect
    useEffect(() => {
        const dotsInterval = setInterval(() => {
            setDots(prev => {
                if (prev === '...') return '';
                return prev + '.';
            });
        }, 500);
        return () => clearInterval(dotsInterval);
    }, []);

    // Search timer
    useEffect(() => {
        const timerInterval = setInterval(() => {
            setSearchTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timerInterval);
    }, []);

    const checkMatchStatus = async () => {
        if (checking) return;
        setChecking(true);

        try {
            const user_id = await SecureStore.getItemAsync('user_id');
            const res = await fetch(`https://ccbackendx-2.onrender.com/match/status/${user_id}`);

            if (!res.ok) {
                const text = await res.text();
                console.error('❌ Match status error:', text);
                return;
            }

            const data = await res.json();

            if (data.status === 'matched') {
                setIsMatched(true);
                // 如果在游戏中被匹配，先退出游戏
                setShowGame(null);
                setTimeout(() => {
                    // 重置导航栈，确保用户可以正常返回主页
                    navigation.reset({
                        index: 1,
                        routes: [
                            { name: 'Home' }, // 主页在栈底
                            {
                                name: 'ChatRoom',
                                params: {
                                    chatId: data.chat_id,
                                    partner: {
                                        name: data.partner?.name || 'Unknown',
                                        photo: data.partner?.photo || '',
                                    }
                                }
                            }
                        ],
                    });
                }, 1500);
            }
        } catch (err) {
            console.error('Check match error:', err);
        } finally {
            setChecking(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Search',
            'Are you sure you want to stop looking for matches?',
            [
                {text: 'Keep Searching', style: 'cancel'},
                {
                    text: 'Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 可以在这里添加取消搜索的 API 调用
                            const user_id = await SecureStore.getItemAsync('user_id');
                            // await fetch(`https://ccbackendx-2.onrender.com/match/cancel/${user_id}`, { method: 'POST' });
                        } catch (error) {
                            console.error('Cancel search error:', error);
                        }

                        navigation.reset({
                            index: 0,
                            routes: [{name: 'Home'}],
                        });
                    }
                }
            ]
        );
    };

    const handleBackPress = () => {
        if (showGame) {
            setShowGame(null);
        } else {
            handleCancel();
        }
    };

    const startAirplaneGame = () => {
        setShowGame('airplane');
    };

    const startCardMatchGame = () => {
        setShowGame('cardmatch');
    };

    const exitGame = () => {
        setShowGame(null);
    };

    // 如果匹配成功
    if (isMatched) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#667eea"/>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* 添加返回主页按钮 */}
                <View style={styles.matchedHeader}>
                    <TouchableOpacity
                        style={styles.matchedBackButton}
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        })}
                    >
                        <Ionicons name="home-outline" size={24} color="#ffffff"/>
                    </TouchableOpacity>
                    <Text style={styles.matchedHeaderText}>Match Found!</Text>
                    <View style={styles.placeholder}/>
                </View>

                <View style={styles.matchedContainer}>
                    <View style={styles.matchedIconContainer}>
                        <View style={styles.heartContainer}>
                            <Ionicons name="heart" size={60} color="#ffffff"/>
                        </View>
                    </View>

                    <Text style={styles.matchedTitle}>It's a Match! 💕</Text>
                    <Text style={styles.matchedSubtitle}>
                        Get ready to start an amazing conversation!
                    </Text>

                    <View style={styles.loadingDots}>
                        <Animated.View style={[styles.dot, { opacity: dotAnim1 }]}/>
                        <Animated.View style={[styles.dot, { opacity: dotAnim2 }]}/>
                        <Animated.View style={[styles.dot, { opacity: dotAnim3 }]}/>
                    </View>

                    <Text style={styles.redirectText}>Redirecting to chat...</Text>

                    {/* 添加手动跳转选项 */}
                    <View style={styles.matchedActions}>
                        <TouchableOpacity
                            style={styles.chatNowButton}
                            onPress={() => {
                                navigation.reset({
                                    index: 1,
                                    routes: [
                                        { name: 'Home' },
                                        {
                                            name: 'ChatRoom',
                                            params: {
                                                chatId: 'temp_chat_id', // 你需要从匹配数据中获取
                                                partner: {
                                                    name: 'Match',
                                                    photo: '',
                                                }
                                            }
                                        }
                                    ],
                                });
                            }}
                        >
                            <Text style={styles.chatNowText}>Start Chat Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.laterButton}
                            onPress={() => navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            })}
                        >
                            <Text style={styles.laterText}>Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // 如果正在游戏中
    if (showGame) {
        const gameTitle = showGame === 'airplane' ? 'Airplane Game' : 'Card Match Game';

        return (
            <View style={styles.gameContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#000000"/>

                {/* 游戏头部信息栏 */}
                <View style={styles.gameHeader}>
                    <TouchableOpacity style={styles.gameBackButton} onPress={exitGame}>
                        <Ionicons name="chevron-back" size={24} color="#ffffff"/>
                    </TouchableOpacity>
                    <Text style={styles.gameHeaderText}>{gameTitle}</Text>
                    <View style={styles.searchIndicator}>
                        <View style={styles.searchDot} />
                        <Text style={styles.searchText}>Searching{dots}</Text>
                    </View>
                </View>

                {/* 游戏内容 */}
                <View style={styles.gameWrapper}>
                    {showGame === 'airplane' ? <AirplaneGame /> : <CardMatch />}
                </View>

                {/* 游戏底部信息 */}
                <View style={styles.gameFooter}>
                    <Text style={styles.gameFooterText}>
                        ⏱️ Search time: {formatTime(searchTime)}
                    </Text>
                    <Text style={styles.gameFooterText}>
                        🎮 Playing while searching for matches...
                    </Text>
                    <TouchableOpacity style={styles.gameExitButton} onPress={exitGame}>
                        <Ionicons name="exit-outline" size={16} color="#ffffff"/>
                        <Text style={styles.gameExitText}>Exit Game</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // 默认等待界面
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#667eea"/>

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header - 更明显的返回按钮 */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                >
                    <Ionicons name="chevron-back" size={24} color="#ffffff"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Finding Your Match</Text>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCancel}
                >
                    <Ionicons name="close" size={24} color="#ffffff"/>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Search Animation */}
                <View style={styles.searchContainer}>
                    <Animated.View style={[
                        styles.searchRipple,
                        {
                            transform: [{ scale: rippleAnim1 }],
                            opacity: rippleOpacity1
                        }
                    ]}>
                        <Animated.View style={[
                            styles.searchRipple2,
                            {
                                transform: [{ scale: rippleAnim2 }],
                                opacity: rippleOpacity2
                            }
                        ]}>
                            <Animated.View style={[
                                styles.searchRipple3,
                                {
                                    transform: [{ scale: rippleAnim3 }],
                                    opacity: rippleOpacity3
                                }
                            ]}>
                                <View style={styles.searchCenter}>
                                    <Ionicons name="search" size={40} color="#ffffff"/>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </Animated.View>
                </View>

                {/* Status Text */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusTitle}>
                        Looking for your perfect match{dots}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                        We're searching through compatible profiles to find someone special for you
                    </Text>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.8)"/>
                    <Text style={styles.timerText}>Search time: {formatTime(searchTime)}</Text>
                </View>

                {/* 游戏选择区域 */}
                <View style={styles.gamesContainer}>
                    <Text style={styles.gamesTitle}>🎮 Play Games While Waiting</Text>

                    {/* 游戏入口按钮 */}
                    <View style={styles.gameButtonsRow}>
                        {/* 飞机游戏 */}
                        <TouchableOpacity style={styles.gameButton} onPress={startAirplaneGame}>
                            <View style={[styles.gameButtonIcon, { backgroundColor: 'rgba(102, 126, 234, 0.15)' }]}>
                                <Ionicons name="airplane" size={28} color="#667eea"/>
                            </View>
                            <Text style={styles.gameButtonText}>Airplane Game</Text>
                            <Text style={styles.gameButtonSubtext}>Shoot & Survive</Text>
                        </TouchableOpacity>

                        {/* 消消乐游戏 */}
                        <TouchableOpacity style={styles.gameButton} onPress={startCardMatchGame}>
                            <View style={[styles.gameButtonIcon, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                                <Ionicons name="grid" size={28} color="#ff6b6b"/>
                            </View>
                            <Text style={[styles.gameButtonText, { color: '#ff6b6b' }]}>Card Match</Text>
                            <Text style={styles.gameButtonSubtext}>Match & Score</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tips Section */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>💡 While you wait...</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="game-controller" size={16} color="#10b981"/>
                        <Text style={styles.tipText}>Play games to pass time and have fun</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981"/>
                        <Text style={styles.tipText}>Make sure your profile is complete</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981"/>
                        <Text style={styles.tipText}>Be patient - good things take time!</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Actions - 更明显的取消按钮 */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                >
                    <Ionicons name="stop-circle-outline" size={20} color="#ffffff"/>
                    <Text style={styles.cancelButtonText}>Cancel Search</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('profileUpdate')}
                >
                    <Ionicons name="person-outline" size={20} color="#667eea"/>
                    <Text style={styles.profileButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    searchContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    searchRipple: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    searchRipple2: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchRipple3: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchCenter: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    timerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    gamesContainer: {
        width: '100%',
        marginBottom: 20,
    },
    gamesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 15,
    },
    gameButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    gameButton: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    gameButtonIcon: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
    },
    gameButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    gameButtonSubtext: {
        color: 'rgba(102, 126, 234, 0.7)',
        fontSize: 12,
        textAlign: 'center',
    },
    tipsContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    tipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        marginLeft: 10,
        flex: 1,
    },
    bottomContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    profileButton: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    profileButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Game specific styles
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    gameBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    searchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    searchText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
    },
    gameWrapper: {
        flex: 1,
    },
    gameFooter: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    gameFooterText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 2,
    },
    gameExitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginTop: 8,
    },
    gameExitText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    // Match found styles
    matchedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    matchedBackButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    matchedHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    matchedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    matchedIconContainer: {
        marginBottom: 32,
    },
    heartContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchedTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
    },
    matchedSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 40,
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        marginHorizontal: 4,
    },
    redirectText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 40,
    },
    matchedActions: {
        width: '100%',
        gap: 12,
    },
    chatNowButton: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    chatNowText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: 'bold',
    },
    laterButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    laterText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    placeholder: {
        width: 44,
    },
});