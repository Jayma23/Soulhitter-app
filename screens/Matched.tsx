import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface MatchedUser {
    id: string;
    name: string;
    photo: string;
    age: number;
    location: string;
}

interface RouteParams {
    matchedUser: MatchedUser;
    currentUser: MatchedUser;
}

interface ChatRoom {
    chat_id: string;
}

const API_BASE_URL = 'https://ccbackendx-2.onrender.com';

export default function MatchSuccessScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const [currentUserInfo, setCurrentUserInfo] = useState({ name: '', photo: '' });
    const [matchedUserInfo, setMatchedUserInfo] = useState({ name: '', photo: '' });


    // 安全地获取参数，提供默认值
    const params = route.params as RouteParams | undefined;

    const matchedUser = params?.matchedUser || {
        id: 'default_matched',
        name: currentUserInfo.name,
        photo: currentUserInfo.photo,

    };
    const currentUser = params?.currentUser || {
        id: 'default_current',
        name: matchedUserInfo.name,
        photo: matchedUserInfo.photo,

    };

    // Animation values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const heartAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // State
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Time slots
    const timeSlots = [
        '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
        '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
    ];

    useEffect(() => {
        // Get current user ID from SecureStore
        const fetchUserInfo = async () => {
            try {
                const userId = await SecureStore.getItemAsync('user_id');
                if (!userId) return;

                const response = await fetch(`${API_BASE_URL}/matching/get_their_and_my_info/${userId}`);
                const data = await response.json();
                console.log(data)

                if (data) {
                    setCurrentUserInfo({
                        name: data.myInfo.name,
                        photo: data.myInfo.photo,
                    });

                    setMatchedUserInfo({
                        name: data.theirInfo.name,
                        photo: data.theirInfo.photo,
                    });
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        fetchUserInfo();

        // Entrance animations
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]),
            // Heart animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(heartAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ])
            )
        ]).start();

        // Pulse animation for buttons
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    // Enhanced API helper function
    const makeAPICall = async (endpoint: string, method: string = 'GET', body: any = null): Promise<any> => {
        try {
            const config: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                ...(body && { body: JSON.stringify(body) })
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Call Error (${endpoint}):`, error);
            throw error;
        }
    };

    // Create or get existing chat room using your backend API
    const createChatRoom = async (user1Id: string, user2Id: string): Promise<{ chat_id: string }> => {
        try {
            // Use your existing API endpoint
            const response = await makeAPICall('/chatroom/create-or-get-room', 'POST', {
                user1_id: user1Id,
                user2_id: user2Id
            });

            if (response.chat_id) {
                return { chat_id: response.chat_id };
            }

            throw new Error('Failed to create or get chat room');
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    };

    // Send initial match message
    const sendInitialMessage = async (chatRoomId: string, fromUserId: string): Promise<void> => {
        try {
            const initialMessage = `Hey ${matchedUser.name}! 👋 We matched! I'm excited to get to know you better. How's your day going? 😊`;

            await makeAPICall('/chat/send-message', 'POST', {
                chat_room_id: chatRoomId,
                sender_id: fromUserId,
                message: initialMessage,
                message_type: 'text'
            });

            console.log('Initial message sent successfully');
        } catch (error) {
            console.error('Error sending initial message:', error);
            // Don't throw error here - chat room creation is more important
        }
    };

    const handleStartChat = async () => {
        if (!currentUserId) {
            Alert.alert('Error', 'Please log in again to start chatting.');
            return;
        }

        setIsCreatingChat(true);

        try {
            console.log('🚀 Creating chat room between:', currentUserId, 'and', matchedUser.id);

            // Create or get existing chat room
            const chatRoom = await createChatRoom(currentUserId, matchedUser.id);
            console.log('✅ Chat room created/retrieved:', chatRoom);

            // Send initial message to break the ice
            await sendInitialMessage(chatRoom.chat_id, currentUserId);

            // Navigate to chat screen with proper parameters
            navigation.navigate('ChatRoom', {
                chatId: chatRoom.chat_id,
                chatRoomId: chatRoom.chat_id,
                partner: {
                    id: matchedUser.id,
                    name: matchedUser.name,
                    photo: matchedUser.photo,
                    user_id: matchedUser.id
                },
                currentUser: {
                    id: currentUserId,
                    name: currentUser.name,
                    photo: currentUser.photo
                }
            });

        } catch (error) {
            console.error('❌ Error starting chat:', error);

            let errorMessage = 'Failed to start chat. Please try again.';
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('timeout')) {
                    errorMessage = 'Network error. Please check your connection and try again.';
                } else if (error.message.includes('auth')) {
                    errorMessage = 'Authentication error. Please log in again.';
                }
            }

            Alert.alert(
                'Chat Error 💬',
                errorMessage,
                [
                    {
                        text: 'Try Again',
                        onPress: () => handleStartChat()
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleScheduleDate = () => {
        setShowCalendar(true);
    };

    const handleDateSelect = (day: any) => {
        setSelectedDate(day.dateString);
        setShowTimeSlots(true);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        setShowTimeSlots(false);
    };

    const handleSendDateRequest = async () => {
        if (!selectedDate || !selectedTime || !currentUserId) {
            Alert.alert('Error', 'Please select both date and time, and make sure you\'re logged in.');
            return;
        }

        try {
            // Send date request through chat system
            const dateRequestMessage = `🌟 Date Request 🌟\n\nI'd love to take you out on ${selectedDate} at ${selectedTime}! \n\nWhat do you think? 💕`;

            // First create/get chat room if it doesn't exist
            const chatRoom = await createChatRoom(currentUserId, matchedUser.id);

            // Send date request as a message
            await makeAPICall('/chatroom/send-message', 'POST', {
                chat_id: chatRoom.chat_id,
                sender_id: currentUserId,
                content: dateRequestMessage
            });

            Alert.alert(
                'Date Request Sent! 💕',
                `Your date request for ${selectedDate} at ${selectedTime} has been sent to ${matchedUser.name}!`,
                [
                    {
                        text: 'View Chat',
                        onPress: () => {
                            setShowCalendar(false);
                            setSelectedDate('');
                            setSelectedTime('');

                            // Navigate to chat to see the date request
                            navigation.navigate('ChatRoom', {
                                chatId: chatRoom.chat_id,
                                chatRoomId: chatRoom.chat_id,
                                partner: {
                                    id: matchedUser.id,
                                    name: matchedUser.name,
                                    photo: matchedUser.photo,
                                    user_id: matchedUser.id
                                },
                                currentUser: {
                                    id: currentUserId,
                                    name: currentUser.name,
                                    photo: currentUser.photo
                                }
                            });
                        }
                    },
                    {
                        text: 'Great!',
                        onPress: () => {
                            setShowCalendar(false);
                            setSelectedDate('');
                            setSelectedTime('');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error sending date request:', error);
            Alert.alert('Error', 'Failed to send date request. Please try again.');
        }
    };

    const UserProfile = ({ user, isLeft }: { user: MatchedUser; isLeft: boolean }) => (
        <Animated.View
            style={[
                styles.userProfile,
                isLeft ? styles.leftProfile : styles.rightProfile,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateX: slideAnim.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, isLeft ? -50 : 50]
                            })}
                    ]
                }
            ]}
        >
            <View style={styles.profileImageContainer}>
                <Image source={{ uri: user.photo }} style={styles.profileImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.profileGradient}
                />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userDetails}>{user.age} • {user.location}</Text>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#ff6b6b', '#ff8e8e', '#feca57', '#ff9ff3']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Floating Hearts Animation */}
            {[...Array(6)].map((_, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.floatingHeart,
                        {
                            left: Math.random() * width,
                            opacity: heartAnim,
                            transform: [{
                                translateY: heartAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -100]
                                })
                            }]
                        }
                    ]}
                >
                    <Text style={styles.heartEmoji}>💖</Text>
                </Animated.View>
            ))}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <Text style={styles.matchTitle}>It&#39;s a Match!</Text>
                    <Text style={styles.matchSubtitle}>You and {matchedUser.name} liked each other</Text>
                </Animated.View>

                {/* User Profiles */}
                <View style={styles.profilesContainer}>
                    <UserProfile user={currentUser} isLeft={true} />

                    {/* Heart in the middle */}
                    <Animated.View
                        style={[
                            styles.centerHeart,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { scale: scaleAnim },
                                    { rotate: heartAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '10deg']
                                        })}
                                ]
                            }
                        ]}
                    >

                    </Animated.View>

                    <UserProfile user={matchedUser} isLeft={false} />
                </View>

                {/* Action Buttons */}


                {/* Keep Swiping Button */}

            </ScrollView>

            {/* Calendar Modal */}
            <Modal
                visible={showCalendar}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={styles.modalBlur}>
                        <View style={styles.calendarModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Schedule Your Date</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setShowCalendar(false)}
                                >
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <Calendar
                                style={styles.calendar}
                                theme={{
                                    backgroundColor: '#ffffff',
                                    calendarBackground: '#ffffff',
                                    textSectionTitleColor: '#666',
                                    selectedDayBackgroundColor: '#667eea',
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: '#667eea',
                                    dayTextColor: '#2d4150',
                                    textDisabledColor: '#d9e1e8',
                                    arrowColor: '#667eea',
                                    monthTextColor: '#2d4150',
                                    indicatorColor: '#667eea',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '600'
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                                onDayPress={handleDateSelect}
                                markedDates={{
                                    [selectedDate]: {
                                        selected: true,
                                        selectedColor: '#667eea'
                                    }
                                }}
                            />

                            {/* Time Slots */}
                            {showTimeSlots && (
                                <View style={styles.timeSlotsContainer}>
                                    <Text style={styles.timeSlotsTitle}>Select Time</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.timeSlotsScroll}
                                    >
                                        {timeSlots.map((time) => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeSlot,
                                                    selectedTime === time && styles.selectedTimeSlot
                                                ]}
                                                onPress={() => handleTimeSelect(time)}
                                            >
                                                <Text style={[
                                                    styles.timeSlotText,
                                                    selectedTime === time && styles.selectedTimeSlotText
                                                ]}>
                                                    {time}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Send Date Request Button */}
                            {selectedDate && selectedTime && (
                                <TouchableOpacity
                                    style={styles.sendDateButton}
                                    onPress={handleSendDateRequest}
                                >
                                    <LinearGradient
                                        colors={['#667eea', '#764ba2']}
                                        style={styles.sendDateGradient}
                                    >
                                        <Text style={styles.sendDateText}>
                                            Send Date Request for {selectedDate} at {selectedTime}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    floatingHeart: {
        position: 'absolute',
        top: height * 0.8,
        zIndex: 1,
    },
    heartEmoji: {
        fontSize: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    matchTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    matchSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontWeight: '500',
    },
    profilesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 50,
    },
    userProfile: {
        alignItems: 'center',
        flex: 1,
    },
    leftProfile: {
        marginRight: 20,
    },
    rightProfile: {
        marginLeft: 20,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#ffffff',
    },
    profileGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
        textAlign: 'center',
    },
    userDetails: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    centerHeart: {
        position: 'absolute',
        top: 30,
        left: width / 2 - 35,
        zIndex: 10,
    },
    heartBackground: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    actionsContainer: {
        paddingHorizontal: 30,
        gap: 20,
    },
    actionButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonGradient: {
        paddingVertical: 24,
        paddingHorizontal: 30,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginLeft: 12,
        flex: 1,
    },
    buttonSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        position: 'absolute',
        bottom: 8,
        left: 70,
    },
    keepSwipingContainer: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    keepSwipingButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    keepSwipingText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBlur: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarModal: {
        width: width * 0.9,
        maxHeight: height * 0.8,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    calendar: {
        marginHorizontal: 10,
        marginVertical: 10,
    },
    timeSlotsContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    timeSlotsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    timeSlotsScroll: {
        flexDirection: 'row',
    },
    timeSlot: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 10,
        borderRadius: 15,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    selectedTimeSlot: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    timeSlotText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    selectedTimeSlotText: {
        color: '#ffffff',
    },
    sendDateButton: {
        margin: 20,
        marginTop: 10,
        borderRadius: 15,
        overflow: 'hidden',
    },
    sendDateGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    sendDateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
});