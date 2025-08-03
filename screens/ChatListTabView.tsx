import React, {JSX, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    RefreshControl,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 类型定义
type ChatItem = {
    chat_id: string;
    partner_id: string;
    partner_name: string;
    partner_photo: string | null;
    last_message: string;
    last_updated: string;
};

interface ChatListTabViewProps {
    onNavigateToFullList?: () => void;
}

interface AnimatedChatItemProps {
    item: ChatItem;
    index: number;
}

// 专门用于选项卡的聊天列表组件 - 移除了独立的头部和状态栏
export default function ChatListTabView({ onNavigateToFullList }: ChatListTabViewProps) {
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hiddenChats, setHiddenChats] = useState<Set<string>>(new Set());
    const navigation = useNavigation<any>();

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

    const fetchChats = async (): Promise<void> => {
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
        console.log('Hiding chat:', chatId);
        const newHiddenChats = new Set(hiddenChats);
        newHiddenChats.add(chatId);
        setHiddenChats(newHiddenChats);
        saveHiddenChats(newHiddenChats);
        console.log('Hidden chats updated:', Array.from(newHiddenChats));
    };

    const unhideChat = (chatId: string) => {
        console.log('Unhiding chat:', chatId);
        const newHiddenChats = new Set(hiddenChats);
        newHiddenChats.delete(chatId);
        setHiddenChats(newHiddenChats);
        saveHiddenChats(newHiddenChats);
        console.log('Hidden chats updated:', Array.from(newHiddenChats));
    };

    const showChatOptions = (item: ChatItem) => {
        console.log('Showing options for:', item.partner_name);

        Alert.alert(
            'Chat Options',
            `What would you like to do with ${item.partner_name}'s conversation?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Cancel pressed')
                },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: () => {
                        console.log('Delete selected');
                        confirmDeleteChat(item.chat_id, item.partner_name);
                    },
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

    const onRefresh = (): void => {
        setRefreshing(true);
        fetchChats();
    };

    const formatTime = (timestamp: string): string => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffInHours < 168) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getInitials = (name: string): string => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // 只显示可见的聊天，隐藏的聊天完全不显示
    const visibleChats = chatList.filter(chat => !hiddenChats.has(chat.chat_id));
    const hiddenChatsCount = chatList.filter(chat => hiddenChats.has(chat.chat_id)).length;

    const AnimatedChatItem = ({ item, index }: AnimatedChatItemProps) => {
        const fadeAnim = React.useRef(new Animated.Value(0)).current;
        const slideAnim = React.useRef(new Animated.Value(50)).current;

        React.useEffect(() => {
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
        }, [fadeAnim, slideAnim, index]);

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
                <TouchableOpacity
                    style={styles.chatItem}
                    onPress={() => {
                        console.log('Chat pressed:', item.partner_name);
                        navigation.navigate('ChatRoom', {
                            chatId: item.chat_id,
                            partner: {
                                user_id: item.partner_id,
                                name: item.partner_name,
                                photo: item.partner_photo,
                            }
                        });
                    }}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.chatGradient}
                    >
                        <View style={styles.chatContent}>
                            <View style={styles.avatarContainer}>
                                {item.partner_photo ? (
                                    <View style={styles.avatarWrapper}>
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2', '#f093fb']}
                                            style={styles.avatarRing}
                                        >
                                            <View style={styles.avatarInner}>
                                                <Image
                                                    source={{ uri: item.partner_photo }}
                                                    style={styles.avatar}
                                                />
                                            </View>
                                        </LinearGradient>
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Text style={styles.avatarInitials}>
                                            {getInitials(item.partner_name)}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <View style={styles.onlineIndicator}>
                                    <View style={styles.onlinePulse} />
                                </View>
                            </View>

                            <View style={styles.chatTextContainer}>
                                <View style={styles.nameTimeRow}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {item.partner_name}
                                    </Text>
                                    <Text style={styles.time}>
                                        {formatTime(item.last_updated)}
                                    </Text>
                                </View>
                                <Text numberOfLines={2} style={styles.lastMessage}>
                                    {item.last_message || '👋 Say hello to start chatting!'}
                                </Text>
                            </View>

                            <View style={styles.chevronContainer}>
                                <TouchableOpacity
                                    onPress={() => {
                                        console.log('Options button pressed for:', item.partner_name);
                                        showChatOptions(item);
                                    }}
                                    style={styles.optionsButton}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                >
                                    <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const HiddenChatsIndicator = (): JSX.Element | null => {
        if (hiddenChatsCount === 0) return null;

        return (
            <View style={styles.hiddenIndicator}>
                <LinearGradient
                    colors={['#f1f5f9', '#e2e8f0']}
                    style={styles.hiddenIndicatorGradient}
                >
                    <Ionicons name="eye-off" size={14} color="#64748b" />
                    <Text style={styles.hiddenIndicatorText}>
                        {hiddenChatsCount} hidden chat{hiddenChatsCount > 1 ? 's' : ''}
                    </Text>
                </LinearGradient>
            </View>
        );
    };

    const EmptyState = (): JSX.Element => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                style={styles.emptyGradient}
            >
                <Ionicons name="chatbubbles" size={40} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Visible Conversations</Text>
            <Text style={styles.emptySubtitle}>
                {hiddenChatsCount > 0
                    ? `You have ${hiddenChatsCount} hidden conversation${hiddenChatsCount > 1 ? 's' : ''}. Long press to manage.`
                    : 'Start matching with people to begin your first conversation!'
                }
            </Text>
        </View>
    );

    const ListHeader = (): JSX.Element => (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSubtitle}>
                    {visibleChats.length} conversation{visibleChats.length === 1 ? '' : 's'}
                    {hiddenChatsCount > 0 ? ` (${hiddenChatsCount} hidden)` : ''}
                </Text>
            </View>
            {(visibleChats.length > 0 || hiddenChatsCount > 0) && onNavigateToFullList && (
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={onNavigateToFullList}
                    activeOpacity={0.7}
                >
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="chevron-forward" size={16} color="#667eea" />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderItem = ({ item, index }: { item: ChatItem; index: number }) => (
        <AnimatedChatItem item={item} index={index} />
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Animated.View style={styles.loadingSpinner} />
                <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
        );
    }

    // 合并可见和隐藏的聊天，隐藏的聊天排在后面
    const allChats = [
        ...visibleChats,
        ...chatList.filter(chat => hiddenChats.has(chat.chat_id))
    ];

    return (
        <View style={styles.container}>
            <FlatList<ChatItem>
                data={allChats}
                keyExtractor={(item: ChatItem) => item.chat_id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={EmptyState}
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
            />
            <HiddenChatsIndicator />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
        marginRight: 4,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    chatItemWrapper: {
        marginBottom: 16,
    },
    chatItem: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        backgroundColor: '#ffffff',
        marginHorizontal: 2,
    },
    hiddenChatItem: {
        shadowColor: '#94a3b8',
        shadowOpacity: 0.05,
    },
    chatGradient: {
        borderRadius: 24,
    },
    chatContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatarWrapper: {
        padding: 2,
    },
    avatarRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },
    hiddenAvatar: {
        opacity: 0.6,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarInitials: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
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
        top: -1,
        left: -1,
        width: 14,
        height: 14,
        borderRadius: 7,
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
        fontWeight: '800',
        fontSize: 17,
        color: '#1f2937',
        flex: 1,
        letterSpacing: 0.3,
    },
    hiddenText: {
        color: '#64748b',
    },
    time: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    hiddenTime: {
        color: '#94a3b8',
    },
    lastMessage: {
        color: '#6b7280',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    chevronContainer: {
        marginLeft: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionsButton: {
        padding: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.12)',
    },
    hiddenIndicator: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    hiddenIndicatorGradient: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    hiddenIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingSpinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#f1f5f9',
        borderTopColor: '#667eea',
        marginBottom: 16,
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
    },
});