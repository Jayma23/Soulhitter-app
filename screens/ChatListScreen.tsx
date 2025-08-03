import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    StatusBar,
    RefreshControl,
    Dimensions,
    Animated,
    Platform,
    Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ChatItem = {
    chat_id: string;
    partner_id: string;
    partner_name: string;
    partner_photo: string | null;
    last_message: string;
    last_updated: string;
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ChatListScreen() {
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hiddenChats, setHiddenChats] = useState<Set<string>>(new Set());
    const navigation = useNavigation<any>();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => {
        fetchChats();
        loadHiddenChats();
    }, []);

    const loadHiddenChats = async () => {
        try {
            const hidden = await SecureStore.getItemAsync('hidden_chats');
            if (hidden) {
                setHiddenChats(new Set(JSON.parse(hidden)));
            }
        } catch (err) {
            console.error('Failed to load hidden chats:', err);
        }
    };

    const saveHiddenChats = async (hiddenSet: Set<string>) => {
        try {
            await SecureStore.setItemAsync('hidden_chats', JSON.stringify(Array.from(hiddenSet)));
        } catch (err) {
            console.error('Failed to save hidden chats:', err);
        }
    };

    const fetchChats = async () => {
        const userId = await SecureStore.getItemAsync('user_id');
        if (!userId) return;

        try {
            const res = await fetch(`https://ccbackendx-2.onrender.com/chatroom/list?user_id=${userId}`);
            const data = await res.json();
            setChatList(data.chats || []);
        } catch (err) {
            console.error('Failed to fetch chats:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const deleteChat = async (chatId: string) => {
        const userId = await SecureStore.getItemAsync('user_id');
        if (!userId) return;

        try {
            const res = await fetch(`https://ccbackendx-2.onrender.com/chatroom/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    user_id: userId
                })
            });

            if (res.ok) {
                setChatList(prevList => prevList.filter(chat => chat.chat_id !== chatId));
                // 同时从隐藏列表中移除
                const newHiddenChats = new Set(hiddenChats);
                newHiddenChats.delete(chatId);
                setHiddenChats(newHiddenChats);
                saveHiddenChats(newHiddenChats);
            } else {
                Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
        } catch (err) {
            console.error('Failed to delete chat:', err);
            Alert.alert('Error', 'Failed to delete chat. Please try again.');
        }
    };

    const hideChat = (chatId: string) => {
        const newHiddenChats = new Set(hiddenChats);
        newHiddenChats.add(chatId);
        setHiddenChats(newHiddenChats);
        saveHiddenChats(newHiddenChats);
    };

    const unhideChat = (chatId: string) => {
        const newHiddenChats = new Set(hiddenChats);
        newHiddenChats.delete(chatId);
        setHiddenChats(newHiddenChats);
        saveHiddenChats(newHiddenChats);
    };

    const showChatOptions = (item: ChatItem) => {
        const isHidden = hiddenChats.has(item.chat_id);

        Alert.alert(
            'Chat Options',
            `What would you like to do with ${item.partner_name}'s conversation?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: isHidden ? 'Unhide Chat' : 'Hide Chat',
                    onPress: () => {
                        if (isHidden) {
                            unhideChat(item.chat_id);
                        } else {
                            hideChat(item.chat_id);
                        }
                    },
                },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () => confirmDeleteChat(item.chat_id, item.partner_name),
                },
            ]
        );
    };

    const confirmDeleteChat = (chatId: string, partnerName: string) => {
        Alert.alert(
            'Delete Conversation',
            `Are you sure you want to permanently delete your conversation with ${partnerName}? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () => deleteChat(chatId),
                },
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const formatTime = (timestamp: string) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 168) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // 过滤显示的聊天列表
    const visibleChats = chatList.filter(chat => !hiddenChats.has(chat.chat_id));
    const hiddenChatsCount = chatList.filter(chat => hiddenChats.has(chat.chat_id)).length;

    const ChatItem = ({ item, index }: { item: ChatItem; index: number }) => {
        const scaleAnim = new Animated.Value(1);
        const fadeAnim = new Animated.Value(0);
        const slideAnim = new Animated.Value(50);
        const isHidden = hiddenChats.has(item.chat_id);

        useEffect(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    delay: index * 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        const handlePressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.96,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        const handlePress = () => {
            navigation.navigate('ChatRoom', {
                chatId: item.chat_id,
                partner: {
                    user_id: item.partner_id,
                    name: item.partner_name,
                    photo: item.partner_photo,
                }
            });
        };

        const handleLongPress = () => {
            showChatOptions(item);
        };

        return (
            <Animated.View
                style={[
                    styles.chatItemWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            >
                <AnimatedTouchableOpacity
                    style={[
                        styles.chatItem,
                        isHidden && styles.hiddenChatItem,
                        {
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onLongPress={handleLongPress}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={isHidden ? ['#f1f5f9', '#e2e8f0'] : ['#ffffff', '#f8fafc']}
                        style={styles.chatGradient}
                    >
                        <View style={styles.chatContent}>
                            <View style={styles.avatarContainer}>
                                {item.partner_photo ? (
                                    <View style={styles.avatarWrapper}>
                                        <LinearGradient
                                            colors={isHidden ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2', '#f093fb']}
                                            style={styles.avatarRing}
                                        >
                                            <View style={styles.avatarInner}>
                                                <Image
                                                    source={{ uri: item.partner_photo }}
                                                    style={[styles.avatar, isHidden && styles.hiddenAvatar]}
                                                />
                                            </View>
                                        </LinearGradient>
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={isHidden ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Text style={styles.avatarInitials}>
                                            {getInitials(item.partner_name)}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <View style={[styles.onlineIndicator, isHidden && styles.hiddenOnlineIndicator]}>
                                    <View style={styles.onlinePulse} />
                                </View>
                                {isHidden && (
                                    <View style={styles.hiddenBadge}>
                                        <Ionicons name="eye-off" size={12} color="#ffffff" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.chatTextContainer}>
                                <View style={styles.nameTimeRow}>
                                    <Text style={[styles.name, isHidden && styles.hiddenText]} numberOfLines={1}>
                                        {item.partner_name}
                                    </Text>
                                    <View style={styles.timeContainer}>
                                        <Text style={[styles.time, isHidden && styles.hiddenTime]}>
                                            {formatTime(item.last_updated)}
                                        </Text>
                                        {!item.last_message && !isHidden && (
                                            <View style={styles.newIndicator}>
                                                <View style={styles.newIndicatorPulse} />
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.messageRow}>
                                    <Text numberOfLines={2} style={[styles.lastMessage, isHidden && styles.hiddenText]}>
                                        {isHidden ? 'Hidden conversation' : (item.last_message || '👋 Say hello to start chatting!')}
                                    </Text>
                                    {!item.last_message && !isHidden && (
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            style={styles.newChatBadge}
                                        >
                                            <Text style={styles.newChatText}>New</Text>
                                        </LinearGradient>
                                    )}
                                </View>
                            </View>

                            <View style={styles.chevronContainer}>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={isHidden ? "#94a3b8" : "#c7d2fe"}
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </AnimatedTouchableOpacity>
            </Animated.View>
        );
    };

    const HiddenChatsHeader = () => {
        if (hiddenChatsCount === 0) return null;

        return (
            <View style={styles.hiddenHeader}>
                <LinearGradient
                    colors={['#f1f5f9', '#e2e8f0']}
                    style={styles.hiddenHeaderGradient}
                >
                    <Ionicons name="eye-off" size={16} color="#64748b" />
                    <Text style={styles.hiddenHeaderText}>
                        {hiddenChatsCount} hidden conversation{hiddenChatsCount > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.hiddenHeaderSubtext}>
                        Long press to manage
                    </Text>
                </LinearGradient>
            </View>
        );
    };

    const EmptyState = () => {
        const bounceAnim = new Animated.Value(0);

        useEffect(() => {
            const bounce = () => {
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]).start(() => bounce());
            };
            bounce();
        }, []);

        const translateY = bounceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
        });

        return (
            <View style={styles.emptyContainer}>
                <Animated.View
                    style={[
                        styles.emptyIconContainer,
                        { transform: [{ translateY }] }
                    ]}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        style={styles.emptyGradient}
                    >
                        <Ionicons name="chatbubbles" size={50} color="#ffffff" />
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.emptyTitle}>No Visible Conversations</Text>
                <Text style={styles.emptySubtitle}>
                    {hiddenChatsCount > 0
                        ? `You have ${hiddenChatsCount} hidden conversation${hiddenChatsCount > 1 ? 's' : ''}. Long press any chat to manage visibility.`
                        : 'Start matching with people to begin your first conversation!'
                    }
                </Text>
                <TouchableOpacity
                    style={styles.startMatchingButton}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.buttonGradient}
                    >
                        <Ionicons name="heart" size={20} color="#ffffff" />
                        <Text style={styles.buttonText}>Start Matching</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    const LoadingState = () => {
        const spinValue = new Animated.Value(0);

        useEffect(() => {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        }, []);

        const spin = spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });

        return (
            <View style={styles.loadingContainer}>
                <Animated.View
                    style={[
                        styles.loadingSpinner,
                        { transform: [{ rotate: spin }] }
                    ]}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        style={styles.spinnerGradient}
                    >
                        <View style={styles.spinnerInner} />
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
        );
    };

    if (loading) {
        return <LoadingState />;
    }

    // 合并可见和隐藏的聊天，隐藏的聊天排在后面
    const allChats = [
        ...visibleChats,
        ...chatList.filter(chat => hiddenChats.has(chat.chat_id))
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#f1f5f9', '#ffffff']}
                            style={styles.backButtonGradient}
                        >
                            <Ionicons name="chevron-back" size={24} color="#667eea" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Messages</Text>
                        <Text style={styles.headerSubtitle}>
                            {visibleChats.length} visible{hiddenChatsCount > 0 ? `, ${hiddenChatsCount} hidden` : ''}
                        </Text>
                    </View>

                    <View style={styles.rightPlaceholder} />
                </View>
            </LinearGradient>

            {/* Chat List */}
            <FlatList
                data={allChats}
                keyExtractor={(item) => item.chat_id}
                renderItem={({ item, index }) => <ChatItem item={item} index={index} />}
                contentContainerStyle={[
                    styles.listContainer,
                    allChats.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#667eea', '#764ba2']}
                        tintColor="#667eea"
                        progressBackgroundColor="#ffffff"
                    />
                }
                ListEmptyComponent={EmptyState}
                ListHeaderComponent={visibleChats.length > 0 ? HiddenChatsHeader : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        minHeight: 80,
    },
    backButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    backButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    rightPlaceholder: {
        width: 40,
        height: 40,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    emptyListContainer: {
        flex: 1,
    },
    hiddenHeader: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    hiddenHeaderGradient: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    hiddenHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginLeft: 8,
        flex: 1,
    },
    hiddenHeaderSubtext: {
        fontSize: 12,
        color: '#94a3b8',
    },
    chatItemWrapper: {
        marginBottom: 16,
    },
    chatItem: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        backgroundColor: '#ffffff',
    },
    hiddenChatItem: {
        shadowColor: '#94a3b8',
        shadowOpacity: 0.05,
    },
    chatGradient: {
        borderRadius: 20,
    },
    chatContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatarWrapper: {
        padding: 2,
    },
    avatarRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
    hiddenAvatar: {
        opacity: 0.6,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hiddenOnlineIndicator: {
        backgroundColor: '#94a3b8',
    },
    onlinePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
    },
    hiddenBadge: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#64748b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatTextContainer: {
        flex: 1,
    },
    nameTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontWeight: '700',
        fontSize: 16,
        color: '#1f2937',
        flex: 1,
    },
    hiddenText: {
        color: '#64748b',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
    },
    hiddenTime: {
        color: '#94a3b8',
    },
    newIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#667eea',
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newIndicatorPulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ffffff',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        color: '#6b7280',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    newChatBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginLeft: 8,
    },
    newChatText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    chevronContainer: {
        marginLeft: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 32,
    },
    emptyGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    startMatchingButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingSpinner: {
        marginBottom: 24,
    },
    spinnerGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
    },
});