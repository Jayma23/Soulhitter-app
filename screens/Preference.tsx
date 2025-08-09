"use client"

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState, useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width, height } = Dimensions.get("window");

const cards = [
    { id: 1, name: "Adventure", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/d5af474050c2ff7773f174745759d874_wgezje.jpg" },
    { id: 2, name: "Romance", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/f80878eec037881744073d55f1479947_chr4zt.jpg" },
    { id: 3, name: "Mystery", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/cf1ad304328fb5d9e6986bade94418fc_ygqcxa.jpg" },
    { id: 4, name: "Classic", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/99_tuuquh.png" },
    { id: 5, name: "Nature", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/2_btcngo.jpg" },
    { id: 6, name: "Urban", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/5_w4c8i6.jpg" },
    { id: 7, name: "Elegant", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/1_htkc6n.jpg" },
    { id: 8, name: "Creative", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 9, name: "Artistic", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1754506327/ChatGPT_Image_Aug_7_2025_02_51_34_AM_wdh6sz.png" },
    { id: 10, name: "Modern", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1754506032/8704a9704c97b9e8f4b00b753306c3c5_2_ihrcvr.jpg" },
    { id: 11, name: "Vintage", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1754506025/512684ba8581a57b0435f89f71be66c8_zfezcg.jpg" },
    { id: 12, name: "Bold", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1754506008/e6997d3d10ca78a8bdeea6ee90ec94b3_2_oexlt6.jpg" },
];

const CARD_BACK_DESIGNS = [
    {
        id: 1,

        image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/d5af474050c2ff7773f174745759d874_wgezje.jpg",
        gradient: ['#667eea', '#764ba2'] as const,

    },
    {
        id: 2,

        image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/f80878eec037881744073d55f1479947_chr4zt.jpg",
        gradient: ['#f093fb', '#f5576c'] as const,

    },
    {
        id: 3,

        image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/cf1ad304328fb5d9e6986bade94418fc_ygqcxa.jpg",
        gradient: ['#4facfe', '#00f2fe'] as const,

    },
    {
        id: 4,

        image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/99_tuuquh.png",
        gradient: ['#43e97b', '#38f9d7'] as const,

    },
    {
        id: 5,

        image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/2_btcngo.jpg",
        gradient: ['#fa709a', '#fee140'] as const,

    },
];

const MATCHING_PHASES = {
    PERSONALITY_SELECTION: 'personality_selection',
    LOADING_MATCHES: 'loading_matches',
    BLIND_SELECTION: 'blind_selection',
    REVEALING_CARDS: 'revealing_cards',
    FINAL_SELECTION: 'final_selection',
    GENERATING_REPORTS: 'generating_reports',
    CREATING_CONNECTION: 'creating_connection',
    COMPLETED: 'completed'
} as const;

type MatchingPhase = typeof MATCHING_PHASES[keyof typeof MATCHING_PHASES];

const PHASE_MESSAGES: Record<MatchingPhase, string> = {
    [MATCHING_PHASES.PERSONALITY_SELECTION]: "🎴 Choose your personality card first",
    [MATCHING_PHASES.LOADING_MATCHES]: "🎲 Preparing your mystery cards...",
    [MATCHING_PHASES.BLIND_SELECTION]: "🎴 Choose 3 mystery cards that call to you",
    [MATCHING_PHASES.REVEALING_CARDS]: "✨ Revealing your chosen destinies...",
    [MATCHING_PHASES.FINAL_SELECTION]: "💕 Choose your perfect match",
    [MATCHING_PHASES.GENERATING_REPORTS]: "📋 Creating personality reports...",
    [MATCHING_PHASES.CREATING_CONNECTION]: "🔗 Establishing your connection...",
    [MATCHING_PHASES.COMPLETED]: "🎉 Magic complete! Love awaits!"
};

interface MatchUser {
    id: string;
    name: string;
    age: number;
    photo: string;
    match_score: number;
}

interface BlindCard {
    id: string;
    user: MatchUser;
    design: typeof CARD_BACK_DESIGNS[0];
    isSelected: boolean;
    isRevealed: boolean;
}

const API_BASE_URL = 'https://ccbackendx-2.onrender.com';

export default function BlindBoxMatchingScreen() {
    const navigation = useNavigation<any>();

    const [currentPhase, setCurrentPhase] = useState<MatchingPhase>(MATCHING_PHASES.PERSONALITY_SELECTION);
    const [selectedPersonalityCard, setSelectedPersonalityCard] = useState<string | null>(null);
    const [blindCards, setBlindCards] = useState<BlindCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [revealedCards, setRevealedCards] = useState<BlindCard[]>([]);
    const [finalSelection, setFinalSelection] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const getUserId = async () => {
            const userId = await SecureStore.getItemAsync('user_id');
            setCurrentUserId(userId);
        };
        getUserId();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

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

    const handlePersonalityCardSelect = (cardImage: string) => {
        if (currentPhase !== MATCHING_PHASES.PERSONALITY_SELECTION) return;

        setSelectedPersonalityCard(cardImage);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleStartBlindBoxMatching = async () => {
        if (!selectedPersonalityCard || !currentUserId) {
            Alert.alert("Please select your personality card first! 🎴");
            return;
        }

        try {
            setCurrentPhase(MATCHING_PHASES.LOADING_MATCHES);

            await makeAPICall('/personality/preference', 'POST', {
                user_id: currentUserId,
                photo_urls: selectedPersonalityCard,
                distance: 10000
            });

            await makeAPICall('/personality/process-user-embedding', 'POST', {
                user_id: currentUserId
            });

            const matchResponse = await makeAPICall(`/matching/available-users/${currentUserId}?count=5`);
            console.log("/matching/recommendations/${currentUserId}?count=5&min_score=50")
            console.log(currentUserId)

            if (!matchResponse.recommendations || matchResponse.recommendations_count === 0) {
                Alert.alert(
                    "Building Your Network 🏗️",
                    "We're still building our amazing community! Check back soon for your perfect matches. 💕"
                );
                return;
            }


            const blindCardData: BlindCard[] = matchResponse.recommendations.map((user: any, index: number) => ({
                id: user.id,
                user: {
                    id: user.id,
                    name: user.name,
                    age: user.age,
                    photo: user.photo,
                    match_score: user.match_score
                },
                design: CARD_BACK_DESIGNS[index] || CARD_BACK_DESIGNS[0],
                isSelected: false,
                isRevealed: false
            }));
            console.log('Match response:', matchResponse);
            console.log('Blind cards created:', blindCardData);
            console.log('Current phase:', currentPhase);

            setBlindCards(blindCardData);
            setCurrentPhase(MATCHING_PHASES.BLIND_SELECTION);
            console.log('Blind cards state:', blindCards);
            console.log('Current phase:', currentPhase);

        } catch (error) {
            console.error('Error starting blind box matching:', error);
            Alert.alert("Error", "Failed to start matching. Please try again.");
            setCurrentPhase(MATCHING_PHASES.PERSONALITY_SELECTION);
        }
    };

    const handleBlindCardSelect = (cardId: string) => {
        if (currentPhase !== MATCHING_PHASES.BLIND_SELECTION) return;

        if (selectedCards.includes(cardId)) {
            setSelectedCards(prev => prev.filter(id => id !== cardId));
        } else if (selectedCards.length < 3) {
            setSelectedCards(prev => [...prev, cardId]);

            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
        }
    };

    const handleRevealCards = async () => {
        if (selectedCards.length !== 3) {

            Alert.alert("Please select exactly 3 cards first! 🎴");
            return;
        }

        setCurrentPhase(MATCHING_PHASES.REVEALING_CARDS);

        Animated.timing(flipAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            const revealed = blindCards.filter(card => selectedCards.includes(card.id));
            setRevealedCards(revealed);
            setCurrentPhase(MATCHING_PHASES.FINAL_SELECTION);
        }, 1500);
    };

    const handleFinalSelection = async (selectedUserId: string) => {
        if (!currentUserId) return;

        setFinalSelection(selectedUserId);
        setCurrentPhase(MATCHING_PHASES.GENERATING_REPORTS);

        try {
            const selectedUser = revealedCards.find(card => card.id === selectedUserId)?.user;
            if (!selectedUser) return;

            const summaryResponse = await makeAPICall('/matching/generate-personal-summary', 'POST', {
                user_id: currentUserId,
                target_user_id: selectedUserId
            });

            setCurrentPhase(MATCHING_PHASES.CREATING_CONNECTION);

            await makeAPICall('/matching/bind-matched-users', 'POST', {
                user1_id: currentUserId,
                user2_id: selectedUserId,
                match_score: selectedUser.match_score,
                match_analysis: summaryResponse.dating_advice || 'AI-generated match analysis'
            });

            const chatResponse = await makeAPICall('/chatroom/create-or-get-room', 'POST', {
                user1_id: currentUserId,
                user2_id: selectedUserId
            });

            const reportMessage = `🎉 We're matched! Here's what our AI discovered:\n\n📋 Your Personality Report:\n${summaryResponse.user_summary}\n\n💡 Dating Tips:\n${summaryResponse.dating_advice}\n\nI'm excited to get to know you better! 😊`;

            await makeAPICall('/chatroom/send-message', 'POST', {
                chat_id: chatResponse.chat_id,
                sender_id: currentUserId,
                content: reportMessage
            });

            setCurrentPhase(MATCHING_PHASES.COMPLETED);

            Alert.alert(
                "🎉 Perfect Match Created!",
                `You and ${selectedUser.name} are now connected!\n\nPersonality reports have been exchanged and your chat is ready! 💕`,
                [
                    {
                        text: "Start Chatting 💬",
                        onPress: () => {
                            navigation.navigate('ChatRoom', {
                                chatId: chatResponse.chat_id,
                                partner: {
                                    id: selectedUser.id,
                                    name: selectedUser.name,
                                    photo: selectedUser.photo,
                                    user_id: selectedUser.id
                                }
                            });
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error in final selection:', error);
            Alert.alert("Error", "Failed to create connection. Please try again.");
            setCurrentPhase(MATCHING_PHASES.FINAL_SELECTION);
        }
    };

    const renderPersonalityCard = (card: typeof cards[0]) => {
        const isSelected = selectedPersonalityCard === card.image;
        const cardWidth = (width - 80) / 2;

        return (
            <Animated.View
                key={card.id}
                style={[
                    styles.personalityCardContainer,
                    {
                        width: cardWidth,
                        opacity: fadeAnim,
                        transform: [{ scale: isSelected ? scaleAnim : 1 }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.personalityCard,
                        isSelected && styles.selectedPersonalityCard
                    ]}
                    onPress={() => handlePersonalityCardSelect(card.image)}
                    activeOpacity={0.8}
                >
                    <Image source={{ uri: card.image }} style={styles.personalityCardImage} />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.personalityCardGradient}
                    >
                        <Text style={styles.personalityCardName}>{card.name}</Text>
                    </LinearGradient>

                    {isSelected && (
                        <View style={styles.personalitySelectedIndicator}>
                            <LinearGradient
                                colors={['#ff6b9d', '#c44569']}
                                style={styles.personalitySelectedGradient}
                            >
                                <Text style={styles.checkmark}>✓</Text>
                            </LinearGradient>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderBlindCard = (card: BlindCard) => {
        const isSelected = selectedCards.includes(card.id);
        const cardWidth = (width - 80) / 2;

        return (
            <Animated.View
                key={card.id}
                style={[
                    styles.blindCardContainer,
                    {
                        width: cardWidth,
                        opacity: fadeAnim,
                        transform: [{ scale: isSelected ? scaleAnim : 1 }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.blindCard,
                        isSelected && styles.selectedBlindCard
                    ]}
                    onPress={() => handleBlindCardSelect(card.id)}
                    disabled={currentPhase !== MATCHING_PHASES.BLIND_SELECTION}
                    activeOpacity={0.8}
                >
                    {/* 显示实际图片而不是渐变背景 */}
                    <Image
                        source={{ uri: card.design.image }}
                        style={styles.blindCardImage}
                    />

                    {/* 添加半透明遮罩层 */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                        style={styles.blindCardOverlay}
                    >
                        {/* 选中状态的对号指示器 */}
                        {isSelected && (
                            <View style={styles.selectedIndicator}>
                                <Text style={styles.checkmark}>✓</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderRevealedCard = (card: BlindCard) => {
        const isSelected = finalSelection === card.id;
        const cardWidth = (width - 80) / 3;

        return (
            <Animated.View
                key={card.id}
                style={[
                    styles.revealedCardContainer,
                    {
                        width: cardWidth,
                        transform: [
                            {
                                rotateY: flipAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['180deg', '0deg']
                                })
                            }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.revealedCard,
                        isSelected && styles.selectedRevealedCard
                    ]}
                    onPress={() => handleFinalSelection(card.id)}
                    disabled={currentPhase !== MATCHING_PHASES.FINAL_SELECTION}
                    activeOpacity={0.8}
                >
                    <Image source={{ uri: card.user.photo }} style={styles.revealedImage} />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.revealedGradient}
                    >
                        <Text style={styles.revealedName}>{card.user.name}</Text>
                        <Text style={styles.revealedAge}>{card.user.age} years old</Text>
                        <Text style={styles.matchScore}>{card.user.match_score}% Match</Text>
                    </LinearGradient>

                    {isSelected && (
                        <View style={styles.finalSelectedIndicator}>
                            <LinearGradient
                                colors={['#ff6b9d', '#c44569']}
                                style={styles.finalSelectedGradient}
                            >
                                <Text style={styles.heartIcon}>💖</Text>
                            </LinearGradient>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderPhaseContent = () => {
        switch (currentPhase) {
            case MATCHING_PHASES.PERSONALITY_SELECTION:
                return (
                    <View style={styles.personalitySelectionContainer}>
                        <View style={styles.instructionContainer}>
                            <Text style={styles.instructionTitle}>🎴 Choose Your Personality</Text>
                            <Text style={styles.instructionText}>
                                Select the card that best represents your soul
                            </Text>
                        </View>

                        <View style={styles.personalityCardsGrid}>
                            {cards.map((card) => renderPersonalityCard(card))}
                        </View>

                        {selectedPersonalityCard && (
                            <TouchableOpacity
                                style={styles.startMatchingButton}
                                onPress={handleStartBlindBoxMatching}
                            >
                                <LinearGradient
                                    colors={['#ff6b9d', '#c44569']}
                                    style={styles.startMatchingButtonGradient}
                                >
                                    <Text style={styles.startMatchingButtonText}>🚀 Start Blind Box Matching</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case MATCHING_PHASES.LOADING_MATCHES:
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ff6b9d" />
                        <Text style={styles.loadingText}>Preparing your destiny cards...</Text>
                    </View>
                );

            case MATCHING_PHASES.BLIND_SELECTION:
                return (
                    <View style={styles.selectionContainer}>
                        <View style={styles.instructionContainer}>
                            <Text style={styles.instructionTitle}>🎴 Choose Your Destiny</Text>
                            <Text style={styles.instructionText}>
                                Select 3 mystery cards that speak to your heart
                            </Text>
                            <Text style={styles.selectionCounter}>
                                {selectedCards.length}/3 cards selected
                            </Text>
                        </View>

                        <View style={styles.blindCardsGrid}>
                            {blindCards.map((card) => renderBlindCard(card))}
                        </View>

                        {selectedCards.length === 3 && (
                            <TouchableOpacity
                                style={styles.revealButton}
                                onPress={handleRevealCards}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.revealButtonGradient}
                                >
                                    <Text style={styles.revealButtonText}>✨ Reveal Your Matches</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            case MATCHING_PHASES.REVEALING_CARDS:
                return (
                    <View style={styles.revealingContainer}>
                        <Animated.View style={[
                            styles.revealingAnimation,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <Text style={styles.revealingText}>✨ The cards are turning... ✨</Text>
                            <Text style={styles.revealingSubtext}>Your destiny is being revealed</Text>
                        </Animated.View>
                    </View>
                );

            case MATCHING_PHASES.FINAL_SELECTION:
                return (
                    <View style={styles.finalSelectionContainer}>
                        <View style={styles.instructionContainer}>
                            <Text style={styles.instructionTitle}>💕 Choose Your Match</Text>
                            <Text style={styles.instructionText}>
                                These are your revealed matches. Choose the one that captures your heart!
                            </Text>
                        </View>

                        <View style={styles.revealedCardsGrid}>
                            {revealedCards.map((card) => renderRevealedCard(card))}
                        </View>
                    </View>
                );

            case MATCHING_PHASES.GENERATING_REPORTS:
            case MATCHING_PHASES.CREATING_CONNECTION:
                return (
                    <View style={styles.processingContainer}>
                        <Animated.View style={[
                            styles.processingAnimation,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <ActivityIndicator size="large" color="#ff6b9d" />
                            <Text style={styles.processingText}>{PHASE_MESSAGES[currentPhase]}</Text>
                            {currentPhase === MATCHING_PHASES.GENERATING_REPORTS && (
                                <Text style={styles.processingSubtext}>
                                    Creating personalized reports for both of you...
                                </Text>
                            )}
                        </Animated.View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
                style={styles.backgroundGradient}
            />

            {[...Array(8)].map((_, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.magicParticle,
                        {
                            left: Math.random() * width,
                            top: Math.random() * height,
                            opacity: pulseAnim.interpolate({
                                inputRange: [1, 1.05],
                                outputRange: [0.3, 0.8]
                            })
                        }
                    ]}
                >
                    <Text style={styles.particleEmoji}>✨</Text>
                </Animated.View>
            ))}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <BlurView intensity={20} style={styles.headerBlur}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                            style={styles.headerGradient}
                        >
                            <Text style={styles.title}>🔮 Destiny Awaits</Text>
                            <Text style={styles.subtitle}>
                                {PHASE_MESSAGES[currentPhase]}
                            </Text>
                        </LinearGradient>
                    </BlurView>
                </Animated.View>

                <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                    {renderPhaseContent()}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    magicParticle: {
        position: 'absolute',
        zIndex: 1,
    },
    particleEmoji: {
        fontSize: 16,
        color: '#ffffff',
    },
    scrollView: {
        flex: 1,
        zIndex: 2,
    },
    header: {
        margin: 20,
        marginTop: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerBlur: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 25,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        padding: 20,
    },
    personalitySelectionContainer: {
        flex: 1,
    },
    personalityCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    personalityCardContainer: {
        marginBottom: 20,
    },
    personalityCard: {
        borderRadius: 15,
        overflow: 'hidden',
        aspectRatio: 1,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    selectedPersonalityCard: {
        shadowColor: '#ff6b9d',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    personalityCardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    personalityCardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        justifyContent: 'flex-end',
    },
    personalityCardName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
    },
    personalitySelectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 15,
        width: 30,
        height: 30,
    },
    personalitySelectedGradient: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    heartIcon: {
        fontSize: 16,
        color: '#ffffff',
    },

    startMatchingButton: {
        marginTop: 30,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#ff6b9d',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    startMatchingButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    startMatchingButtonText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    loadingText: {
        fontSize: 18,
        color: '#ffffff',
        marginTop: 20,
        fontWeight: '600',
    },
    selectionContainer: {
        flex: 1,
    },
    instructionContainer: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
    },
    instructionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 12,
    },
    selectionCounter: {
        fontSize: 18,
        color: '#feca57',
        fontWeight: '700',
    },
    blindCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    blindCardContainer: {
        marginBottom: 20,
    },
    blindCard: {
        borderRadius: 20,
        overflow: 'hidden',
        aspectRatio: 0.75,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    selectedBlindCard: {
        shadowColor: '#feca57',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    cardBack: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardPattern: {
        fontSize: 60,
        marginBottom: 20,
    },
    cardBackName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#feca57',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mysticalGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    revealButton: {
        marginTop: 30,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    revealButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    revealButtonText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
    },
    revealingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    revealingAnimation: {
        alignItems: 'center',
    },
    revealingText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
    },
    revealingSubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    finalSelectionContainer: {
        flex: 1,
    },
    revealedCardsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    revealedCardContainer: {
        marginBottom: 20,
    },
    revealedCard: {
        borderRadius: 15,
        overflow: 'hidden',
        aspectRatio: 0.75,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    selectedRevealedCard: {
        shadowColor: '#ff6b9d',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    revealedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    revealedGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        justifyContent: 'flex-end',
    },
    revealedName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 2,
    },
    revealedAge: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 4,
    },
    matchScore: {
        fontSize: 12,
        color: '#feca57',
        textAlign: 'center',
        fontWeight: '700',
    },
    finalSelectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 15,
        width: 30,
        height: 30,
    },
    finalSelectedGradient: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    processingAnimation: {
        alignItems: 'center',
    },
    processingText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    processingSubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    blindCardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    blindCardOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
});