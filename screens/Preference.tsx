"use client"

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
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
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const { width, height } = Dimensions.get("window")

const cards = [
    { id: 1, name: "Adventure", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/d5af474050c2ff7773f174745759d874_wgezje.jpg" },
    { id: 2, name: "Romance", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/f80878eec037881744073d55f1479947_chr4zt.jpg" },
    { id: 3, name: "Mystery", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/cf1ad304328fb5d9e6986bade94418fc_ygqcxa.jpg" },
    { id: 4, name: "Classic", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/99_tuuquh.png" },
    { id: 5, name: "Nature", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/2_btcngo.jpg" },
    { id: 6, name: "Urban", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/5_w4c8i6.jpg" },
    { id: 7, name: "Elegant", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/1_htkc6n.jpg" },
    { id: 8, name: "Creative", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 9, name: "Artistic", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 10, name: "Modern", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 11, name: "Vintage", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 12, name: "Bold", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
]

// Processing states for better UX
const PROCESSING_STATES = {
    IDLE: 'idle',
    SAVING_PREFERENCES: 'saving_preferences',
    PROCESSING_EMBEDDING: 'processing_embedding',
    FINDING_MATCHES: 'finding_matches',
    COMPLETED: 'completed'
}

const PROCESSING_MESSAGES = {
    [PROCESSING_STATES.SAVING_PREFERENCES]: "💾 Saving your preferences...",
    [PROCESSING_STATES.PROCESSING_EMBEDDING]: "🧠 Analyzing your personality with AI...",
    [PROCESSING_STATES.FINDING_MATCHES]: "💕 Finding your perfect matches...",
    [PROCESSING_STATES.COMPLETED]: "✨ All done! Ready to find love!"
}

export default function App() {
    const [range, setRange] = useState("")
    const [selectedCard, setSelectedCard] = useState<string | null>(null)
    const [processingState, setProcessingState] = useState(PROCESSING_STATES.IDLE)
    const [matchResults, setMatchResults] = useState(null)
    const [progressValue, setProgressValue] = useState(0)

    const scaleAnim = useRef(new Animated.Value(1)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(50)).current
    const progressAnim = useRef(new Animated.Value(0)).current
    const pulseAnim = useRef(new Animated.Value(1)).current

    React.useEffect(() => {
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
        ]).start()

        // Pulse animation for processing state
        if (processingState !== PROCESSING_STATES.IDLE) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            )
            pulseAnimation.start()
            return () => pulseAnimation.stop()
        }
    }, [processingState])

    const animateProgress = (toValue: number) => {
        Animated.timing(progressAnim, {
            toValue,
            duration: 1000,
            useNativeDriver: false,
        }).start(() => {
            setProgressValue(toValue)
        })
    }

    const handleCardPress = (cardImage: string) => {
        if (processingState !== PROCESSING_STATES.IDLE) return

        setSelectedCard(cardImage)

        // Animate selection
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
        ]).start()
    }

    const processUserEmbedding = async (userId: string) => {
        try {
            setProcessingState(PROCESSING_STATES.PROCESSING_EMBEDDING)
            animateProgress(50)

            const response = await fetch('https://ccbackendx-2.onrender.com/personality/process-user-embedding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId }),
            })

            if (!response.ok) {
                throw new Error('Failed to process embedding')
            }

            const result = await response.json()
            console.log('Embedding processed:', result)
            return result
        } catch (error) {
            console.error('Error processing embedding:', error)
            throw error
        }
    }

    const findBestMatches = async (userId: string) => {
        try {
            setProcessingState(PROCESSING_STATES.FINDING_MATCHES)
            animateProgress(80)

            const response = await fetch(`https://ccbackendx-2.onrender.com/match/best-matches/${userId}?limit=5`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to find matches')
            }

            const result = await response.json()
            console.log('Matches found:', result)
            return result
        } catch (error) {
            console.error('Error finding matches:', error)
            throw error
        }
    }

    const showMatchResults = (matches: any) => {
        if (!matches || !matches.matches || matches.matches.length === 0) {
            Alert.alert(
                "Building Your Profile 🏗️",
                "Your profile is now ready! We're building our user base and will notify you when amazing matches become available. Stay tuned! 💕",
                [{ text: "Sounds Great! 🌟", style: "default" }]
            )
            return
        }

        const topMatch = matches.matches[0]
        const matchScore = topMatch.match_score?.overall || 0
        const matchUser = topMatch.user

        let matchEmoji = "💫"
        let matchLevel = "Good"

        if (matchScore >= 90) {
            matchEmoji = "💖"
            matchLevel = "Perfect"
        } else if (matchScore >= 80) {
            matchEmoji = "✨"
            matchLevel = "Excellent"
        } else if (matchScore >= 70) {
            matchEmoji = "💕"
            matchLevel = "Great"
        }

        Alert.alert(
            `${matchEmoji} ${matchLevel} Match Found!`,
            `We found ${matches.matches.length} potential matches!\n\n` +
            `🌟 Top Match: ${matchUser?.name || 'Someone Special'}\n` +
            `📊 Compatibility: ${matchScore}%\n` +
            `🎯 Age: ${matchUser?.age || 'N/A'}\n\n` +
            `Your journey to find love has begun! 💕`,
            [
                {
                    text: "Amazing! 🚀",
                    onPress: () => {
                        setMatchResults(matches)
                    }
                }
            ]
        )
    }

    const handleSubmit = async () => {
        if (!range || selectedCard === null) {
            Alert.alert("Oops! 💭", "Please fill in all required fields to continue your journey", [
                { text: "Got it! ✨", style: "default" }
            ])
            return
        }

        const rangeNum = Number.parseInt(range)
        if (isNaN(rangeNum) || rangeNum < 100 || rangeNum > 100000) {
            Alert.alert("Invalid Range 📍", "Please enter a valid geographic range (100-100000 meters)", [
                { text: "Try Again 🔄", style: "default" }
            ])
            return
        }

        try {
            const userId = await SecureStore.getItemAsync('user_id')
            if (!userId) {
                Alert.alert("Error", "User ID not found. Please log in again.")
                return
            }

            // Step 1: Save preferences
            setProcessingState(PROCESSING_STATES.SAVING_PREFERENCES)
            animateProgress(20)

            const preferenceData = {
                user_id: userId,
                distance: rangeNum,
                photo_urls: selectedCard,
            }

            const preferenceResponse = await fetch('https://ccbackendx-2.onrender.com/personality/preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferenceData),
            })

            if (!preferenceResponse.ok) {
                throw new Error('Failed to save preferences')
            }

            // Step 2: Process user embedding
            await processUserEmbedding(userId)

            // Step 3: Find matches
            const matches = await findBestMatches(userId)

            // Step 4: Complete
            setProcessingState(PROCESSING_STATES.COMPLETED)
            animateProgress(100)

            // Show results after a brief delay
            setTimeout(() => {
                showMatchResults(matches)

                // Reset state after showing results
                setTimeout(() => {
                    setProcessingState(PROCESSING_STATES.IDLE)
                    setProgressValue(0)
                    progressAnim.setValue(0)
                    setRange("")
                    setSelectedCard(null)
                }, 2000)
            }, 1000)

        } catch (error) {
            console.error('Error in processing:', error)
            setProcessingState(PROCESSING_STATES.IDLE)
            setProgressValue(0)
            progressAnim.setValue(0)

            Alert.alert(
                "Connection Issue 🔌",
                "Something went wrong during processing. Please check your connection and try again.",
                [{ text: "Retry 🚀", style: "default" }]
            )
        }
    }

    const renderCard = (card: (typeof cards)[0], index: number) => {
        const isSelected = selectedCard === card.image
        const cardWidth = (width - 60) / 2
        const cardDelay = index * 100
        const isDisabled = processingState !== PROCESSING_STATES.IDLE

        return (
            <Animated.View
                key={card.id}
                style={{
                    opacity: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, isDisabled ? 0.5 : 1],
                    }),
                    transform: [
                        {
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, cardDelay / 10],
                            })
                        },
                        { scale: isSelected ? scaleAnim : 1 }
                    ]
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.cardContainer,
                        { width: cardWidth },
                        isSelected && styles.selectedCard,
                        isDisabled && styles.disabledCard
                    ]}
                    onPress={() => handleCardPress(card.image)}
                    disabled={isDisabled}
                    activeOpacity={0.8}
                >
                    <Image source={{ uri: card.image }} style={styles.cardImage} />

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.cardGradient}
                    >
                        <Text style={styles.cardName}>{card.name}</Text>
                    </LinearGradient>

                    {/* Selection Indicator with Animation */}
                    {isSelected && (
                        <Animated.View style={[styles.selectedIndicator, { transform: [{ scale: scaleAnim }] }]}>
                            <LinearGradient
                                colors={['#ff6b9d', '#c44569']}
                                style={styles.selectedGradient}
                            >
                                <Text style={styles.selectedText}>✨</Text>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Shimmer Effect for Selected Card */}
                    {isSelected && (
                        <View style={styles.shimmerContainer}>
                            <LinearGradient
                                colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shimmer}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        )
    }

    const isProcessing = processingState !== PROCESSING_STATES.IDLE
    const isFormDisabled = !range || selectedCard === null || isProcessing

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#dc2430', '#2d3561', '#4c5aa3', '#7b4397', '#dc2430']}
                style={styles.backgroundGradient}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Animated Header with Blur Effect */}
                <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
                    <BlurView intensity={20} style={styles.headerBlur}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                            style={styles.headerGradient}
                        >
                            <Animated.Text style={[
                                styles.title,
                                isProcessing && { transform: [{ scale: pulseAnim }] }
                            ]}>
                                {isProcessing ? "🔮 Creating Magic" : "💕 Find Your Perfect Match"}
                            </Animated.Text>
                            <Text style={styles.subtitle}>
                                {isProcessing
                                    ? "AI is working hard to find your soulmate ✨"
                                    : "Set your preferences and let destiny do the rest ✨"
                                }
                            </Text>
                            <View style={styles.decorativeLine} />
                        </LinearGradient>
                    </BlurView>
                </Animated.View>

                {/* Processing Progress Bar */}
                {isProcessing && (
                    <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                            style={styles.progressGradient}
                        >
                            <Text style={styles.progressTitle}>
                                {PROCESSING_MESSAGES[processingState]}
                            </Text>

                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBackground}>
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 100],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#ff6b9d', '#c44569', '#8b5a9f']}
                                            style={styles.progressGradientFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    </Animated.View>
                                </View>
                            </View>

                            <Text style={styles.progressPercentage}>
                                {Math.round(progressValue)}% Complete
                            </Text>

                            <View style={styles.loadingDotsContainer}>
                                {[0, 1, 2].map((index) => (
                                    <Animated.View
                                        key={index}
                                        style={[
                                            styles.loadingDot,
                                            {
                                                opacity: pulseAnim.interpolate({
                                                    inputRange: [1, 1.1],
                                                    outputRange: [0.3, 1],
                                                }),
                                                transform: [{
                                                    scale: pulseAnim.interpolate({
                                                        inputRange: [1, 1.1],
                                                        outputRange: [0.8, 1.2],
                                                    })
                                                }]
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Geographic Range Section */}
                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, isProcessing ? 0.6 : 1],
                            }),
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                        style={styles.sectionGradient}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionIcon}>📍</Text>
                                <Text style={styles.sectionTitle}>Geographic Range</Text>
                            </View>
                            <Text style={styles.sectionDescription}>
                                How far should we search for your soulmate?
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Distance in Meters</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        range && styles.textInputFilled,
                                        isProcessing && styles.textInputDisabled
                                    ]}
                                    placeholder="e.g., 5000"
                                    placeholderTextColor="#94a3b8"
                                    value={range}
                                    onChangeText={setRange}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    editable={!isProcessing}
                                />
                                <View style={styles.inputIcon}>
                                    <Text style={styles.inputIconText}>📏</Text>
                                </View>
                            </View>
                            <Text style={styles.inputHint}>
                                💡 Sweet spot: 1000-50000 meters (1-50 km)
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Card Selection Section */}
                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, isProcessing ? 0.6 : 1],
                            }),
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                        style={styles.sectionGradient}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionIcon}>🎴</Text>
                                <Text style={styles.sectionTitle}>Your Personality Card</Text>
                            </View>
                            <Text style={styles.sectionDescription}>
                                Choose the card that resonates with your soul
                            </Text>
                        </View>

                        <View style={styles.cardsGrid}>
                            {cards.map((card, index) => renderCard(card, index))}
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Submit Button with Enhanced Design */}
                <Animated.View
                    style={[
                        styles.submitContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isFormDisabled && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={isFormDisabled}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={
                                isFormDisabled
                                    ? ['#94a3b8', '#64748b']
                                    : ['#ff6b9d', '#c44569', '#8b5a9f']
                            }
                            style={styles.submitGradient}
                        >
                            {isProcessing ? (
                                <View style={styles.submitProcessing}>
                                    <ActivityIndicator color="#ffffff" size="small" />
                                    <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                                        {PROCESSING_MESSAGES[processingState]}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>
                                        🚀 Find My Soulmate
                                    </Text>
                                    <View style={styles.submitIcon}>
                                        <Text style={styles.submitIconText}>💖</Text>
                                    </View>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height * 1.5,
    },
    scrollView: {
        flex: 1,
    },
    headerContainer: {
        marginBottom: 25,
        overflow: 'hidden',
    },
    headerBlur: {
        borderRadius: 20,
        margin: 20,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 30,
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: "#475569",
        textAlign: "center",
        lineHeight: 26,
        fontWeight: "500",
    },
    decorativeLine: {
        width: 60,
        height: 4,
        backgroundColor: "#ff6b9d",
        borderRadius: 2,
        marginTop: 20,
    },
    progressContainer: {
        marginHorizontal: 20,
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#ff6b9d",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    progressGradient: {
        padding: 25,
        alignItems: 'center',
    },
    progressTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1e293b",
        marginBottom: 20,
        textAlign: 'center',
    },
    progressBarContainer: {
        width: '100%',
        marginBottom: 15,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressGradientFill: {
        flex: 1,
    },
    progressPercentage: {
        fontSize: 16,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 20,
    },
    loadingDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff6b9d',
        marginHorizontal: 4,
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
    },
    sectionGradient: {
        padding: 25,
    },
    sectionHeader: {
        marginBottom: 25,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1e293b",
        letterSpacing: -0.3,
    },
    sectionDescription: {
        fontSize: 16,
        color: "#64748b",
        lineHeight: 24,
        fontWeight: "500",
    },
    inputContainer: {
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 12,
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    textInput: {
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderRadius: 16,
        padding: 18,
        fontSize: 18,
        backgroundColor: "rgba(255,255,255,0.8)",
        fontWeight: "600",
        paddingRight: 50,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    textInputFilled: {
        borderColor: "#ff6b9d",
        backgroundColor: "rgba(255,255,255,0.95)",
    },
    textInputDisabled: {
        opacity: 0.6,
        backgroundColor: "rgba(255,255,255,0.5)",
    },
    inputIcon: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    inputIconText: {
        fontSize: 20,
    },
    inputHint: {
        fontSize: 14,
        color: "#94a3b8",
        fontWeight: "500",
    },
    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 15,
    },
    cardContainer: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.8)",
        position: "relative",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    selectedCard: {
        borderColor: "#ff6b9d",
        shadowColor: "#ff6b9d",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    disabledCard: {
        opacity: 0.5,
    },
    cardImage: {
        width: "100%",
        height: 140,
        resizeMode: "cover",
    },
    cardGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        justifyContent: 'flex-end',
    },
    cardName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    selectedIndicator: {
        position: "absolute",
        top: 12,
        right: 12,
        borderRadius: 18,
        width: 36,
        height: 36,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    selectedGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    selectedText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
    shimmerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: '-100%',
        right: 0,
        bottom: 0,
        width: '200%',
    },
    submitContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    submitButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    submitButtonDisabled: {
        shadowOpacity: 0.1,
        elevation: 5,
    },
    submitGradient: {
        padding: 20,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
    },
    submitProcessing: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    submitIcon: {
        marginLeft: 10,
    },
    submitIconText: {
        fontSize: 20,
    },
})