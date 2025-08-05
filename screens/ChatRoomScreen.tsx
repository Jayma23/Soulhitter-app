import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    PanResponder,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { io } from 'socket.io-client';

// 🚀 Type definitions
interface Partner {
    name: string;
    photo: string;
    user_id?: string;
    wallet_address?: string;
    isVerified?: boolean;
    story?: boolean;
}

interface RouteParams {
    chatId: string;
    partner: Partner;
}

interface Message {
    sender_id: number | string;
    message: string;
    timestamp: string;
    _temp?: boolean;
    isDecentralized?: boolean;
    type?: 'text' | 'image' | 'voice' | 'reaction';
    replyTo?: string;
    reactions?: { emoji: string; count: number }[];
}

// 🚀 Decentralized chat service Mock
const useDecentralizedChat = () => {
    const [isDecentralizedMode, setIsDecentralizedMode] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);

    const enableDecentralizedMode = async () => {
        setIsInitializing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setUserAddress('0x742d35Cc6cF888F61c7e6dB95f18E3924cE0eB44');
            setIsDecentralizedMode(true);
        } catch (error) {
            console.error('Failed to enable decentralized mode:', error);
            throw error;
        } finally {
            setIsInitializing(false);
        }
    };

    const sendDecentralizedMessage = async (chatId: string, senderId: number, message: string) => {
        try {
            console.log('🔗 Sending decentralized message:', { chatId, sender_id: senderId, content: message });

            const res = await fetch('https://ccbackendx-2.onrender.com/chatroom/send-message-b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    sender_id: senderId,
                    content: message
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log('🔗 Decentralized message sent successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error sending decentralized message:', error);
            throw error;
        }
    };

    const getDecentralizedHistory = async (otherUserAddress: string) => {
        console.log('📥 Fetching from blockchain:', otherUserAddress);
        return [
            {
                sender_id: '0x742d35cc...',
                message: "Hello from blockchain! 🔗✨",
                timestamp: new Date(Date.now() - 60000).toISOString(),
                isDecentralized: true,
                reactions: [{ emoji: '🔥', count: 2 }]
            }
        ];
    };

    return {
        isDecentralizedMode,
        isInitializing,
        userAddress,
        enableDecentralizedMode,
        sendDecentralizedMessage,
        getDecentralizedHistory,
        setIsDecentralizedMode
    };
};

const { width, height } = Dimensions.get('window');

export default function InstagramChatRoom() {
    const route = useRoute();
    const [isPartnerOnline, setIsPartnerOnline] = useState(false);

    const socket = useRef<any>(null);
    const navigation = useNavigation<any>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    // 🆕 Swipe to decentralized mode animations
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const decentralizedModeAnim = useRef(new Animated.Value(0)).current;
    const particleAnims = useRef(Array.from({ length: 15 }, () => new Animated.Value(0))).current;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Entry animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 65,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const { chatId, partner } = route.params as RouteParams;

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [showReactions, setShowReactions] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<number | null>(null);

    const {
        isDecentralizedMode,
        isInitializing,
        userAddress,
        enableDecentralizedMode,
        sendDecentralizedMessage,
        getDecentralizedHistory,
        setIsDecentralizedMode
    } = useDecentralizedChat();

    const flatListRef = useRef<FlatList>(null);

    // 🆕 Swipe gesture handler for decentralized mode
    const swipePanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onMoveShouldSetPanResponderCapture: () => false,

        onPanResponderGrant: () => {
            swipeAnim.setValue(0);
        },

        onPanResponderMove: (_, gestureState) => {
            // Only respond to upward swipes
            if (gestureState.dy < 0) {
                const progress = Math.min(Math.abs(gestureState.dy) / 150, 1);
                swipeAnim.setValue(progress);
            }
        },

        onPanResponderRelease: (_, gestureState) => {
            const swipeThreshold = -120; // Pixels to swipe up

            if (gestureState.dy < swipeThreshold && gestureState.vy < -0.5) {
                // Trigger decentralized mode
                Animated.timing(swipeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }).start(() => {
                    toggleDecentralizedMode();
                });
            } else {
                // Reset animation
                Animated.timing(swipeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    // 🆕 Toggle decentralized mode with animations
    const toggleDecentralizedMode = async () => {
        if (!isDecentralizedMode) {
            //try {
                // Start particle animation
                createParticleEffect();

                // Enable decentralized mode
                await enableDecentralizedMode();

                // Animate background transition
                Animated.timing(decentralizedModeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false,
                }).start();

                // Haptic feedback
                if (Platform.OS === 'ios') {
                    const { HapticFeedback } = require('expo-haptics');
                    HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
                }

                // Show success message
                setTimeout(() => {
                    Alert.alert(
                        '🔗 Decentralized Mode Activated',
                        'Your messages are now secured on the blockchain!',
                        [{ text: 'Got it!', style: 'default' }]
                    );
                }, 500);

           /* } catch (error) {
                console.error('Failed to enable decentralized mode:', error);
                Alert.alert('Error', 'Failed to connect to blockchain. Please try again.');
            }*/
        } else {
            // Disable decentralized mode
            Alert.alert(
                '🔄 Switch to Traditional Chat',
                'Switch back to standard messaging?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Switch',
                        onPress: () => {
                            setIsDecentralizedMode(false);
                            Animated.timing(decentralizedModeAnim, {
                                toValue: 0,
                                duration: 600,
                                useNativeDriver: false,
                            }).start();
                            setMessages([]);
                        }
                    }
                ]
            );
        }

        // Reset swipe animation
        swipeAnim.setValue(0);
    };

    // 🆕 Create particle effect for mode transition
    const createParticleEffect = () => {
        const animations = particleAnims.map((anim, index) => {
            anim.setValue(0);
            return Animated.sequence([
                Animated.delay(index * 50),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ]);
        });

        Animated.parallel(animations).start(() => {
            // Reset particles
            particleAnims.forEach(anim => anim.setValue(0));
        });
    };

    // Separate userId initialization and message loading
    useEffect(() => {
        const initUserId = async () => {
            const id = await SecureStore.getItemAsync('user_id');
            setUserId(id ? parseInt(id, 10) : null);
        };
        initUserId();
    }, []);

    // Only load messages after userId is ready
    useEffect(() => {
        if (userId === null) return; // Wait for userId initialization

        const loadMessages = async () => {
            if (isDecentralizedMode) {
                await loadDecentralizedMessages();
            } else {
                await loadTraditionalMessages();
            }
        };

        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [chatId, userId, isDecentralizedMode]);

    const loadDecentralizedMessages = async () => {
        try {
            console.log('🔗 Loading decentralized messages for chatId:', chatId);
            const res = await fetch(`https://ccbackendx-2.onrender.com/chatroom/messages-b/${chatId}`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log('🔗 Decentralized messages response:', data);

            const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
                sender_id: msg.sender_id,
                message: msg.message,
                timestamp: msg.timestamp,
                isDecentralized: true,
                reactions: msg.reactions || []
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('❌ Error loading decentralized messages:', error);
            // Fallback to mock data if API fails
            const mockMessages: Message[] = [
                {
                    sender_id: 999,
                    message: "Hello from blockchain! 🔗✨",
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    isDecentralized: true,
                    reactions: [{ emoji: '🔥', count: 2 }]
                }
            ];
            setMessages(mockMessages);
        }
    };

    const loadTraditionalMessages = async () => {
        try {
            console.log('Fetching messages for chatId:', chatId);
            console.log('Request URL:', `https://ccbackendx-2.onrender.com/chatroom/messages/${chatId}`);

            const res = await fetch(`https://ccbackendx-2.onrender.com/chatroom/messages/${chatId}`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // Add debug logs
            console.log('API Response:', data);
            console.log('Messages array:', data.messages);

            // Ensure message format is correct
            const formattedMessages = (data.messages || []).map((msg: any) => ({
                sender_id: msg.sender_id,
                message: msg.message || msg.content, // Compatible with different field names
                timestamp: msg.timestamp,
                reactions: msg.reactions || []
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error fetching traditional messages:', error);
            const testMessages: Message[] = [
                {
                    sender_id: 999,
                    message: "Hey! How's your day going? 😊✨",
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    reactions: [{ emoji: '❤️', count: 1 }, { emoji: '😊', count: 2 }]
                },
                {
                    sender_id: userId || 1,
                    message: "Amazing! Just finished my morning workout 💪",
                    timestamp: new Date(Date.now() - 240000).toISOString(),
                },
                {
                    sender_id: 999,
                    message: "That's awesome! I love your dedication 🔥",
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                }
            ];
            setMessages(testMessages);
        }
    };

    const checkPartnerOnline = async () => {
        try {
            console.log("Checking online status for user:", partner.user_id);
            const res = await fetch(`https://ccbackendx-2.onrender.com/user/${partner.user_id}/online-status`);
            const data = await res.json();
            setIsPartnerOnline(data.isOnline);
        } catch (err) {
            console.error('Failed to fetch online status', err);
        }
    };

    useEffect(() => {
        if (partner?.user_id) {
            checkPartnerOnline();
        }
    }, [partner?.user_id]);

    useEffect(() => {
        socket.current = io('https://ccbackendx-2.onrender.com', {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        socket.current.on('connect', () => {
            console.log('✅ Socket connected');
            socket.current.emit('register', userId);
        });

        socket.current.on('receive_message', (message: any) => {
            console.log('📥 Real-time message:', message);
            setMessages(prev => [...prev.filter(msg => !msg._temp), {
                sender_id: message.sender_id,
                message: message.content,
                timestamp: message.timestamp
            }]);
        });

        socket.current.on('typing', (data: any) => {
            console.log('✍️ Partner is typing...', data);
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        });

        socket.current.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        return () => {
            socket.current?.disconnect();
        };
    }, [userId]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        const optimisticMessage: Message = {
            sender_id: userId || 0,
            message: text.trim(),
            timestamp: new Date().toISOString(),
            _temp: true,
            isDecentralized: isDecentralizedMode
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setText('');

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        try {
            if (isDecentralizedMode) {
                await sendDecentralizedMessage(chatId, userId || 0, text.trim());
            } else {
                socket.current.emit('send_message', {
                    chat_id: chatId,
                    sender_id: userId,
                    receiver_id: partner.user_id,
                    content: text.trim()
                });
            }

            setMessages(prev => prev.filter(msg => !msg._temp));
        } catch (error) {
            console.error('❌ Error sending message:', error);
            setMessages(prev => prev.filter(msg => !msg._temp));
        }
    };

    const handleTextChange = (textValue: string) => {
        setText(textValue);
        if (socket.current && !isDecentralizedMode) {
            socket.current.emit('typing', { receiver_id: partner.user_id });
        }
    };

    const addReaction = (messageIndex: number, emoji: string) => {
        setMessages(prev => prev.map((msg, index) => {
            if (index === messageIndex) {
                const reactions = msg.reactions || [];
                const existingReaction = reactions.find(r => r.emoji === emoji);

                if (existingReaction) {
                    existingReaction.count += 1;
                } else {
                    reactions.push({ emoji, count: 1 });
                }

                return { ...msg, reactions: [...reactions] };
            }
            return msg;
        }));
        setShowReactions(false);
        setSelectedMessage(null);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
        return date.toLocaleDateString();
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        console.log('Rendering message:', item, 'at index:', index);

        if (!item || !item.message) {
            console.warn('Invalid message item:', item);
            return null;
        }

        const isMe = item.sender_id === userId;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = !isMe && (!previousMessage || previousMessage.sender_id !== item.sender_id);
        const nextMessage = messages[index + 1];
        const showTime = !nextMessage ||
            nextMessage.sender_id !== item.sender_id ||
            (new Date(nextMessage.timestamp).getTime() - new Date(item.timestamp).getTime()) > 300000;

        // Long press gesture
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponderCapture: () => false,
            onPanResponderGrant: () => {
                setSelectedMessage(index);
                setShowReactions(true);
            },
        });

        return (
            <Animated.View
                style={[
                    styles.messageWrapper,
                    { opacity: fadeAnim }
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    onLongPress={() => {
                        setSelectedMessage(index);
                        setShowReactions(true);
                    }}
                    delayLongPress={500}
                    activeOpacity={0.9}
                >
                    <View style={[
                        styles.messageContainer,
                        isMe ? styles.myMessageContainer : styles.theirMessageContainer
                    ]}>
                        {!isMe && showAvatar && (
                            <View style={styles.avatarContainer}>
                                {partner.photo ? (
                                    <View style={styles.avatarWrapper}>
                                        <Image source={{ uri: partner.photo }} style={styles.messageAvatar} />
                                        {partner.story && <View style={styles.storyRing} />}
                                        {partner.isVerified && (
                                            <View style={styles.verificationBadge}>
                                                <Ionicons name="checkmark" size={8} color="#ffffff" />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Text style={styles.avatarInitials}>{getInitials(partner.name)}</Text>
                                    </LinearGradient>
                                )}
                            </View>
                        )}

                        {!isMe && !showAvatar && <View style={styles.avatarSpacer} />}

                        <View style={[
                            styles.messageBubble,
                            isMe ? styles.myMessage : styles.theirMessage,
                            item.isDecentralized && styles.decentralizedMessage,
                            item._temp && styles.sendingMessage
                        ]}>
                            {isMe && item.isDecentralized && (
                                <LinearGradient
                                    colors={['rgba(16, 185, 129, 0.8)', 'rgba(5, 150, 105, 0.8)']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}

                            <Text style={[
                                styles.messageText,
                                isMe ? styles.myMessageText : styles.theirMessageText
                            ]}>
                                {item.message}
                            </Text>

                            {item.isDecentralized && (
                                <View style={styles.decentralizedIndicator}>
                                    <Ionicons name="shield-checkmark" size={12} color="rgba(255,255,255,0.9)" />
                                </View>
                            )}

                            {item._temp && (
                                <View style={styles.sendingIndicator}>
                                    <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                                </View>
                            )}

                            {/* Instagram-style reactions */}
                            {item.reactions && item.reactions.length > 0 && (
                                <View style={styles.reactionsContainer}>
                                    {item.reactions.map((reaction, idx) => (
                                        <View key={idx} style={styles.reactionBubble}>
                                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                                            <Text style={styles.reactionCount}>{reaction.count}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {showTime && (
                        <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                            {formatTime(item.timestamp)}
                            {item.isDecentralized && (
                                <Text style={styles.blockchainBadge}> • On-chain</Text>
                            )}
                        </Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Add debug info
    useEffect(() => {
        console.log('Messages state updated:', messages);
        console.log('Messages count:', messages.length);
    }, [messages]);

    useEffect(() => {
        console.log('Route params:', route.params);
        console.log('ChatId:', chatId);
        console.log('Partner:', partner);
    }, []);

    // 🆕 Dynamic background based on mode
    const backgroundInterpolation = decentralizedModeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#f8fafc', '#0f172a']
    });

    return (
        <View style={styles.container} {...swipePanResponder.panHandlers}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* 🆕 Animated Background */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: backgroundInterpolation }
                ]}
            />

            {/* 🆕 Particle Effects */}
            {particleAnims.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.particle,
                        {
                            left: Math.random() * width,
                            top: Math.random() * height,
                            opacity: anim,
                            transform: [
                                {
                                    translateY: anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -100]
                                    })
                                },
                                {
                                    scale: anim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0, 1.2, 0]
                                    })
                                }
                            ]
                        }
                    ]}
                />
            ))}



            {/* Header with dynamic styling */}
            <Animated.View style={styles.headerWrapper}>
                <LinearGradient
                    colors={isDecentralizedMode ?
                        ['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.9)', 'rgba(51, 65, 85, 0.85)'] :
                        ['#ffffff', '#f8fafc', '#f1f5f9']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <BlurView intensity={20} tint={isDecentralizedMode ? "dark" : "light"} style={StyleSheet.absoluteFill} />

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={26} color={isDecentralizedMode ? "#ffffff" : "#1f2937"} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <View style={styles.partnerInfo}>
                            {partner.photo ? (
                                <View style={styles.headerAvatarWrapper}>
                                    <Image source={{ uri: partner.photo }} style={styles.headerAvatar} />
                                    {partner.story && <View style={styles.headerStoryRing} />}
                                    {partner.isVerified && (
                                        <View style={styles.headerVerificationBadge}>
                                            <Ionicons name="checkmark" size={10} color="#ffffff" />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <LinearGradient
                                    colors={isDecentralizedMode ? ['#10b981', '#059669'] : ['#667eea', '#764ba2']}
                                    style={styles.headerAvatarPlaceholder}
                                >
                                    <Text style={styles.headerAvatarInitials}>{getInitials(partner.name)}</Text>
                                </LinearGradient>
                            )}

                            <View style={styles.partnerDetails}>
                                <View style={styles.nameRow}>
                                    <Text style={[
                                        styles.partnerName,
                                        { color: isDecentralizedMode ? "#ffffff" : "#1f2937" }
                                    ]}>
                                        {partner.name}
                                    </Text>
                                    {partner.isVerified && (
                                        <Ionicons name="checkmark-circle" size={16} color="#1d9bf0" style={styles.verifiedIcon} />
                                    )}
                                </View>

                                <View style={styles.statusContainer}>
                                    <View style={[
                                        styles.statusDot,
                                        isDecentralizedMode ? styles.decentralizedStatus :
                                            isPartnerOnline ? styles.onlineStatus : styles.offlineStatus
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: isDecentralizedMode ? "rgba(255,255,255,0.8)" : "rgba(31, 41, 55, 0.7)" }
                                    ]}>
                                        {isDecentralizedMode ? 'Blockchain secured' :
                                            isPartnerOnline ? 'Active now' : 'Offline'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="videocam" size={22} color={isDecentralizedMode ? "#ffffff" : "#1f2937"} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="call" size={20} color={isDecentralizedMode ? "#ffffff" : "#1f2937"} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Chat content area */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <Animated.View style={[styles.messagesContainer, { transform: [{ translateY: slideAnim }] }]}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(_, index) => index.toString()}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => {
                            console.log('FlatList content size changed, messages count:', messages.length);
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }}
                        removeClippedSubviews={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                    />
                </Animated.View>

                {/* Input area with dynamic styling */}
                <BlurView
                    intensity={95}
                    tint={isDecentralizedMode ? "dark" : "light"}
                    style={[
                        styles.inputContainer,
                        { backgroundColor: isDecentralizedMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255,255,255,0.95)' }
                    ]}
                >
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.cameraButton}>
                            <LinearGradient
                                colors={isDecentralizedMode ? ['#10b981', '#059669'] : ['#667eea', '#764ba2']}
                                style={styles.cameraButtonGradient}
                            >
                                <Ionicons name="camera" size={20} color="#ffffff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={[
                            styles.inputBar,
                            {
                                backgroundColor: isDecentralizedMode ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
                                borderColor: isDecentralizedMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(31, 41, 55, 0.1)'
                            }
                        ]}>
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: isDecentralizedMode ? '#ffffff' : '#1f2937' }
                                ]}
                                placeholder="Message..."
                                placeholderTextColor={isDecentralizedMode ? "rgba(255,255,255,0.6)" : "rgba(107, 114, 128, 0.6)"}
                                value={text}
                                onChangeText={handleTextChange}
                                multiline
                                maxLength={1000}
                            />

                            <TouchableOpacity style={styles.emojiButton}>
                                <Text style={styles.emojiText}>😊</Text>
                            </TouchableOpacity>
                        </View>

                        {text.trim() ? (
                            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                <LinearGradient
                                    colors={isDecentralizedMode ? ['#10b981', '#059669'] : ['#667eea', '#764ba2']}
                                    style={styles.sendButtonGradient}
                                >
                                    <Ionicons name="send" size={18} color="#ffffff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.voiceButton}>
                                <Ionicons
                                    name="mic"
                                    size={20}
                                    color={isDecentralizedMode ? "#10b981" : "#667eea"}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </BlurView>
            </KeyboardAvoidingView>

            {/* Reaction selector */}
            {showReactions && (
                <TouchableOpacity
                    style={styles.reactionOverlay}
                    onPress={() => {
                        setShowReactions(false);
                        setSelectedMessage(null);
                    }}
                >
                    <BlurView intensity={20} tint="light" style={styles.reactionPickerContainer}>
                        <View style={styles.reactionPicker}>
                            {['❤️', '😂', '😮', '😢', '😡', '👍'].map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.reactionOption}
                                    onPress={() => selectedMessage !== null && addReaction(selectedMessage, emoji)}
                                >
                                    <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </BlurView>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 3,
    },
    headerWrapper: {
        zIndex: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 16,
        elevation: 8,
        shadowColor: '#1f2937',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
    },
    partnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatarWrapper: {
        position: 'relative',
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'rgba(31, 41, 55, 0.1)',
    },
    headerStoryRing: {
        position: 'absolute',
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#f093fb',
    },
    headerVerificationBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#1d9bf0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    headerAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(31, 41, 55, 0.1)',
    },
    headerAvatarInitials: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    partnerDetails: {
        marginLeft: 14,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partnerName: {
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    verifiedIcon: {
        marginLeft: 6,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    onlineStatus: {
        backgroundColor: '#00ff88',
        shadowColor: '#00ff88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
    },
    offlineStatus: {
        backgroundColor: 'rgba(107, 114, 128, 0.6)',
    },
    decentralizedStatus: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeActionButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    messageWrapper: {
        marginBottom: 12,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    theirMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 10,
        marginBottom: 4,
    },
    avatarWrapper: {
        position: 'relative',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    storyRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#f093fb',
    },
    verificationBadge: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1d9bf0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    avatarSpacer: {
        width: 38,
    },
    messageBubble: {
        maxWidth: width * 0.75,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    myMessage: {
        backgroundColor: '#667eea',
        marginLeft: 'auto',
        borderBottomRightRadius: 6,
        shadowColor: '#667eea',
        shadowOpacity: 0.3,
    },
    theirMessage: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(31, 41, 55, 0.1)',
    },
    decentralizedMessage: {
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    sendingMessage: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '400',
    },
    myMessageText: {
        color: '#ffffff',
    },
    theirMessageText: {
        color: '#1f2937',
    },
    decentralizedIndicator: {
        position: 'absolute',
        top: 8,
        right: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderRadius: 8,
        padding: 2,
    },
    sendingIndicator: {
        position: 'absolute',
        bottom: 8,
        right: 10,
    },
    reactionsContainer: {
        flexDirection: 'row',
        marginTop: 6,
        flexWrap: 'wrap',
    },
    reactionBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(31, 41, 55, 0.1)',
    },
    reactionEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    reactionCount: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 4,
        fontWeight: '500',
    },
    myTimestamp: {
        textAlign: 'right',
        marginRight: 12,
    },
    theirTimestamp: {
        textAlign: 'left',
        marginLeft: 48,
    },
    blockchainBadge: {
        color: '#10b981',
        fontWeight: '600',
    },
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(31, 41, 55, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    cameraButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    cameraButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 4,
        paddingVertical: 4,
        minHeight: 40,
        maxHeight: 100,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        lineHeight: 20,
        maxHeight: 80,
    },
    emojiButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    emojiText: {
        fontSize: 20,
    },
    sendButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(31, 41, 55, 0.1)',
    },
    reactionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(31, 41, 55, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reactionPickerContainer: {
        borderRadius: 25,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    reactionPicker: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
        backgroundColor: '#ffffff',
    },
    reactionOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(31, 41, 55, 0.1)',
        shadowColor: '#1f2937',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reactionOptionEmoji: {
        fontSize: 24,
    },
});