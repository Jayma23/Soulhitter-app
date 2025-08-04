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
    Dimensions
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
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchChats();
    }, []);

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
                    onPress={() => navigation.navigate('ChatRoom', {
                        chatId: item.chat_id,
                        partner: {
                            user_id: item.partner_id,
                            name: item.partner_name,
                            photo: item.partner_photo,
                        }
                    })}
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
                                <Ionicons name="chevron-forward" size={20} color="#c7d2fe" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
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
            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
            <Text style={styles.emptySubtitle}>
                Start matching with people to begin your first conversation!
            </Text>
        </View>
    );

    const ListHeader = (): JSX.Element => (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSubtitle}>
                    {chatList.length} {chatList.length === 1 ? 'conversation' : 'conversations'}
                </Text>
            </View>
            {chatList.length > 0 && onNavigateToFullList && (
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

    return (
        <View style={styles.container}>
            <FlatList<ChatItem>
                data={chatList}
                keyExtractor={(item: ChatItem) => item.chat_id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={EmptyState}
                contentContainerStyle={[
                    styles.listContainer,
                    chatList.length === 0 && styles.emptyListContainer
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
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
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
    onlinePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
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
    time: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
    },
    lastMessage: {
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 20,
    },
    chevronContainer: {
        marginLeft: 12,
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