"use client"

import React, { useState, useCallback, useMemo } from "react"
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator
} from "react-native"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    withSequence,
    withDelay,
} from "react-native-reanimated"
import { TapGestureHandler, State, PanGestureHandler } from "react-native-gesture-handler"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const CARD_WIDTH = Math.min((SCREEN_WIDTH - 60) / 2.2, 160)
const CARD_HEIGHT = CARD_WIDTH * 1.3
const MAX_SELECTIONS = 3

// Enhanced mock user data with local background images
const mockUsers = [
    {
        id: 1,
        name: "Emma",
        age: 25,
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        fallbackAvatar: "👩",
        // 使用本地图片
        backgroundImage: require('../assets/images/99.png'),
        mbti: "ENFP",
        interests: ["Photography", "Travel", "Coffee"],
        bio: "Adventure seeker with a passion for capturing beautiful moments. Love exploring new places and meeting interesting people.",
        compatibility: 92,
    },
    {
        id: 2,
        name: "Sophia",
        age: 23,
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        fallbackAvatar: "👩‍🦰",
        backgroundImage: require('../assets/images/99.png'),
        mbti: "INFJ",
        interests: ["Reading", "Art", "Yoga"],
        bio: "Bookworm and art enthusiast. Believe in deep conversations and meaningful connections.",
        compatibility: 88,
    },
    {
        id: 3,
        name: "Olivia",
        age: 27,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
        fallbackAvatar: "👩‍🦱",
        backgroundImage: require('../assets/images/99.png'),
        mbti: "ESFJ",
        interests: ["Cooking", "Dancing", "Music"],
        bio: "Food lover and dance enthusiast. Always up for trying new recipes and hitting the dance floor.",
        compatibility: 85,
    },
    {
        id: 4,
        name: "Ava",
        age: 24,
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
        fallbackAvatar: "👩‍💻",
        backgroundImage: require('../assets/images/99.png'),
        mbti: "INTJ",
        interests: ["Technology", "Gaming", "Fitness"],
        bio: "Tech enthusiast and fitness lover. Enjoy solving complex problems and staying active.",
        compatibility: 90,
    },
    {
        id: 5,
        name: "Isabella",
        age: 26,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
        fallbackAvatar: "🌿",
        backgroundImage: require('../assets/images/99.png'),
        mbti: "ENFJ",
        interests: ["Volunteering", "Nature", "Writing"],
        bio: "Nature lover and aspiring writer. Passionate about making a positive impact in the world.",
        compatibility: 87,
    },
]

interface User {
    id: number
    name: string
    age: number
    avatar: string
    fallbackAvatar: string
    backgroundImage: string
    mbti: string
    interests: string[]
    bio: string
    compatibility: number
}

interface CardComponentProps {
    user: User
    index: number
    isFlipped: boolean
    isSelected: boolean
    isFinalChoice: boolean
    shouldFadeOut: boolean
    isDisabled: boolean
    onFlip: () => void
    onShowProfile: () => void
    finalPosition?: { x: number; y: number; scale: number }
}

const CardComponent: React.FC<CardComponentProps> = ({
                                                         user,
                                                         index,
                                                         isFlipped,
                                                         isSelected,
                                                         isFinalChoice,
                                                         shouldFadeOut,
                                                         isDisabled,
                                                         onFlip,
                                                         onShowProfile,
                                                         finalPosition,
                                                     }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)
    const [backgroundError, setBackgroundError] = useState(false)
    const [backgroundLoading, setBackgroundLoading] = useState(true)

    // 调试日志
    React.useEffect(() => {
        console.log(`Card ${user.id} - Background Image:`, user.backgroundImage)
        console.log(`Card ${user.id} - Background Error:`, backgroundError)
        console.log(`Card ${user.id} - Background Loading:`, backgroundLoading)
    }, [user.backgroundImage, backgroundError, backgroundLoading])

    const flipAnimation = useSharedValue(0)
    const scaleAnimation = useSharedValue(1)
    const glowAnimation = useSharedValue(0)
    const fadeAnimation = useSharedValue(1)
    const positionX = useSharedValue(0)
    const positionY = useSharedValue(0)
    const shakeAnimation = useSharedValue(0)
    const pulseAnimation = useSharedValue(0)

    React.useEffect(() => {
        if (isFlipped) {
            flipAnimation.value = withTiming(1, { duration: 600 })
            // Add a subtle pulse when flipped
            pulseAnimation.value = withSequence(
                withTiming(1, { duration: 200 }),
                withTiming(0, { duration: 200 })
            )
        }
    }, [isFlipped])

    React.useEffect(() => {
        if (isSelected) {
            scaleAnimation.value = withSpring(1.05, { damping: 15 })
            glowAnimation.value = withTiming(1, { duration: 300 })
        } else {
            scaleAnimation.value = withSpring(1, { damping: 15 })
            glowAnimation.value = withTiming(0, { duration: 300 })
        }
    }, [isSelected])

    React.useEffect(() => {
        if (shouldFadeOut) {
            fadeAnimation.value = withTiming(0, { duration: 800 })
        }
    }, [shouldFadeOut])

    React.useEffect(() => {
        if (isFinalChoice && finalPosition) {
            positionX.value = withSpring(finalPosition.x, {
                damping: 20,
                stiffness: 90,

            })
            positionY.value = withSpring(finalPosition.y, {
                damping: 20,
                stiffness: 90,

            })
            scaleAnimation.value = withSpring(finalPosition.scale, {
                damping: 15,

            })
        }
    }, [isFinalChoice, finalPosition])

    // Shake animation for disabled cards
    React.useEffect(() => {
        if (isDisabled && !isSelected) {
            shakeAnimation.value = withSequence(
                withTiming(-5, { duration: 50 }),
                withTiming(5, { duration: 50 }),
                withTiming(-3, { duration: 50 }),
                withTiming(3, { duration: 50 }),
                withTiming(0, { duration: 50 })
            )
        }
    }, [isDisabled])

    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: positionX.value + shakeAnimation.value },
                { translateY: positionY.value },
                { scale: scaleAnimation.value }
            ],
            opacity: fadeAnimation.value * (isDisabled && !isSelected ? 0.6 : 1),
            position: isFinalChoice ? "absolute" : "relative",
            top: isFinalChoice ? SCREEN_HEIGHT / 2 - CARD_HEIGHT / 2 - 100 : "auto",
            left: isFinalChoice ? SCREEN_WIDTH / 2 - (CARD_WIDTH * 1.4) / 2 : "auto",
            zIndex: isFinalChoice ? 1000 : isSelected ? 10 : 1,
        }
    })

    const cardStyle = useAnimatedStyle(() => {
        const shadowOpacity = interpolate(glowAnimation.value, [0, 1], [0.15, 0.4])
        const shadowRadius = interpolate(glowAnimation.value, [0, 1], [4, 12])
        const pulseScale = interpolate(pulseAnimation.value, [0, 1], [1, 1.02])

        return {
            shadowOpacity,
            shadowRadius,
            shadowColor: isSelected ? "#FF6B9D" : "#000",
            elevation: interpolate(glowAnimation.value, [0, 1], [4, 12]),
            transform: [{ scale: pulseScale }],
            borderWidth: isSelected ? 2 : 0,
            borderColor: "#FF6B9D",
        }
    })

    const backOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(flipAnimation.value, [0, 0.5], [1, 0]),
    }))

    const frontOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(flipAnimation.value, [0.5, 1], [0, 1]),
    }))

    const handleTap = useCallback((event: any) => {
        if (event.nativeEvent.state === State.END) {
            if (isDisabled && !isSelected) {
                return // Don't allow interaction with disabled cards
            }

            if (!isFlipped) {
                runOnJS(onFlip)()
            } else {
                runOnJS(onShowProfile)()
            }
        }
    }, [isFlipped, isDisabled, isSelected, onFlip, onShowProfile])

    const renderAvatar = () => {
        if (imageError) {
            return (
                <View style={styles.fallbackAvatar}>
                    <Text style={styles.fallbackAvatarText}>{user.fallbackAvatar}</Text>
                </View>
            )
        }

        return (
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: user.avatar }}
                    style={styles.avatar}
                    onError={(error) => {
                        console.log('Image load error:', error.nativeEvent.error)
                        setImageError(true)
                        setImageLoading(false)
                    }}
                    onLoadStart={() => {
                        setImageLoading(true)
                        setImageError(false)
                    }}
                    onLoadEnd={() => setImageLoading(false)}
                    onLoad={() => setImageLoading(false)}
                    // 添加超时处理

                />
                {imageLoading && !imageError && (
                    <View style={styles.imageLoader}>
                        <ActivityIndicator size="small" color="#FF6B9D" />
                    </View>
                )}
            </View>
        )
    }

    return (
        <Animated.View style={[styles.cardContainer, containerStyle]}>
            <TapGestureHandler onHandlerStateChange={handleTap}>
                <Animated.View style={[styles.card, cardStyle]}>
                    {/* Card Back (Mystery) */}
                    <Animated.View style={[styles.cardContent, styles.cardBack, backOpacity]}>
                        {/* 调试信息 - 可以临时显示来检查状态 */}
                        {__DEV__ && (
                            <View style={styles.debugInfo}>
                                <Text style={styles.debugText}>
                                    BG: {backgroundError ? 'Error' : backgroundLoading ? 'Loading' : 'Loaded'}
                                </Text>
                            </View>
                        )}

                        {/* Background Image */}
                        {user.backgroundImage && (
                            <Image
                                source={user.backgroundImage} // 直接使用 require() 的结果
                                style={styles.backgroundImage}
                                onLoadStart={() => {
                                    console.log(`Background loading started for user ${user.id}`)
                                    setBackgroundLoading(true)
                                    setBackgroundError(false)
                                }}
                                onLoad={() => {
                                    console.log(`Background loaded successfully for user ${user.id}`)
                                    setBackgroundLoading(false)
                                }}
                                onError={(error) => {
                                    console.log(`Background load error for user ${user.id}:`, error.nativeEvent.error)
                                    setBackgroundError(true)
                                    setBackgroundLoading(false)
                                }}
                                resizeMode="cover"
                            />
                        )}

                        {/* Loading indicator for background */}
                        {backgroundLoading && !backgroundError && (
                            <View style={styles.backgroundLoader}>
                                <ActivityIndicator size="large" color="#FF6B9D" />
                                <Text style={styles.loadingText}>Loading...</Text>
                            </View>
                        )}

                        {/* Default background when image fails or doesn't exist */}
                        {(backgroundError || !user.backgroundImage) && (
                            <View style={styles.defaultBackground}>
                                <Text style={styles.fallbackText}>
                                    {backgroundError ? 'Image Failed' : 'No Image'}
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Card Front (User Info) */}
                    <Animated.View style={[styles.cardContent, styles.cardFront, frontOpacity]}>
                        {renderAvatar()}
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userAge}>{user.age} years old</Text>

                        <View style={styles.mbtiContainer}>
                            <Text style={styles.mbtiText}>{user.mbti}</Text>
                        </View>

                        <View style={styles.compatibilityContainer}>
                            <Text style={styles.compatibilityText}>
                                {user.compatibility}% match
                            </Text>
                        </View>

                        {isSelected && (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>✓</Text>
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>
            </TapGestureHandler>
        </Animated.View>
    )
}

interface UserIntroCardProps {
    user: User
    visible: boolean
    onClose: () => void
    onChoose: () => void
}

const UserIntroCard: React.FC<UserIntroCardProps> = ({ user, visible, onClose, onChoose }) => {
    const [imageError, setImageError] = useState(false)
    const slideAnimation = useSharedValue(0)
    const overlayAnimation = useSharedValue(0)

    React.useEffect(() => {
        if (visible) {
            overlayAnimation.value = withTiming(1, { duration: 300 })
            slideAnimation.value = withSpring(1, { damping: 20, stiffness: 90 })
        } else {
            overlayAnimation.value = withTiming(0, { duration: 300 })
            slideAnimation.value = withTiming(0, { duration: 300 })
        }
    }, [visible])

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayAnimation.value,
    }))

    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(slideAnimation.value, [0, 1], [SCREEN_HEIGHT, 0]),
            },
        ],
    }))

    if (!visible) return null

    const renderAvatar = () => {
        if (imageError) {
            return (
                <View style={styles.introFallbackAvatar}>
                    <Text style={styles.introFallbackAvatarText}>{user.fallbackAvatar}</Text>
                </View>
            )
        }

        return (
            <View style={styles.introAvatarContainer}>
                <Image
                    source={{ uri: user.avatar }}
                    style={styles.introAvatar}
                    onError={(error) => {
                        console.log('Intro image load error:', error.nativeEvent.error)
                        setImageError(true)
                    }}
                    onLoadStart={() => setImageError(false)}
                    onLoadEnd={() => {}} // 简化处理
                    onLoad={() => {}} // 简化处理
                />
            </View>
        )
    }

    return (
        <View style={styles.modalContainer}>
            <Animated.View style={[styles.modalOverlay, overlayStyle]}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={onClose}
                    activeOpacity={1}
                />
            </Animated.View>

            <Animated.View style={[styles.introCard, cardStyle]}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>

                {renderAvatar()}

                <Text style={styles.introName}>
                    {user.name}, {user.age}
                </Text>

                <View style={styles.compatibilityRow}>
                    <View style={styles.introMbtiContainer}>
                        <Text style={styles.introMbtiText}>{user.mbti}</Text>
                    </View>
                    <View style={styles.compatibilityBadge}>
                        <Text style={styles.compatibilityBadgeText}>
                            {user.compatibility}% match
                        </Text>
                    </View>
                </View>

                <View style={styles.interestsContainer}>
                    {user.interests.map((interest, index) => (
                        <View key={index} style={styles.interestTag}>
                            <Text style={styles.interestText}>{interest}</Text>
                        </View>
                    ))}
                </View>

                <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.bioText}>{user.bio}</Text>
                </ScrollView>

                <TouchableOpacity
                    style={styles.chooseButton}
                    onPress={onChoose}
                    activeOpacity={0.8}
                >
                    <Text style={styles.chooseButtonText}>Choose as My Match 💖</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    )
}

const SelectionProgress: React.FC<{ current: number; max: number }> = ({ current, max }) => {
    const progressAnimation = useSharedValue(0)

    React.useEffect(() => {
        progressAnimation.value = withSpring(current / max, { damping: 15 })
    }, [current, max])

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressAnimation.value * 100}%`,
    }))

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.progressText}>{current}/{max} cards selected</Text>
        </View>
    )
}

const CardSelectionScreen: React.FC = () => {
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [selectedCards, setSelectedCards] = useState<number[]>([])
    const [showingProfile, setShowingProfile] = useState<number | null>(null)
    const [finalChoice, setFinalChoice] = useState<number | null>(null)
    const [phase, setPhase] = useState<"selection" | "final">("selection")

    const isSelectionFull = flippedCards.length >= MAX_SELECTIONS

    const handleCardFlip = useCallback((userId: number) => {
        if (isSelectionFull && !flippedCards.includes(userId)) {
            // Show helpful feedback
            Alert.alert(
                "Maximum Reached",
                `You can only select ${MAX_SELECTIONS} cards. Deselect one to choose another.`,
                [{ text: "OK", style: "default" }]
            )
            return
        }

        if (!flippedCards.includes(userId)) {
            setFlippedCards(prev => [...prev, userId])
            setSelectedCards(prev => [...prev, userId])
        }
    }, [flippedCards, isSelectionFull])

    const handleShowProfile = useCallback((userId: number) => {
        setShowingProfile(userId)
    }, [])

    const handleCloseProfile = useCallback(() => {
        setShowingProfile(null)
    }, [])

    const handleChooseFinal = useCallback((userId: number) => {
        setFinalChoice(userId)
        setPhase("final")
        setShowingProfile(null)
    }, [])

    const handleReset = useCallback(() => {
        setFlippedCards([])
        setSelectedCards([])
        setFinalChoice(null)
        setPhase("selection")
    }, [])

    const getFinalPosition = useCallback(() => {
        return { x: 0, y: -100, scale: 1.4 }
    }, [])

    const selectedUser = useMemo(() =>
            mockUsers.find(u => u.id === showingProfile) || mockUsers[0],
        [showingProfile]
    )

    const finalUser = useMemo(() =>
            mockUsers.find(u => u.id === finalChoice),
        [finalChoice]
    )

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Destiny Cards</Text>
                    {phase === "selection" ? (
                        <View style={styles.selectionHeader}>
                            <Text style={styles.subtitle}>
                                Select up to {MAX_SELECTIONS} cards to find your perfect match
                            </Text>
                            <SelectionProgress current={flippedCards.length} max={MAX_SELECTIONS} />
                        </View>
                    ) : (
                        <Text style={styles.subtitle}>🎉 Your Perfect Match! 🎉</Text>
                    )}
                </View>

                <View style={styles.cardsContainer}>
                    {mockUsers.map((user, index) => (
                        <CardComponent
                            key={user.id}
                            user={user}
                            index={index}
                            isFlipped={flippedCards.includes(user.id)}
                            isSelected={selectedCards.includes(user.id)}
                            isFinalChoice={finalChoice === user.id}
                            shouldFadeOut={phase === "final" && finalChoice !== user.id}
                            isDisabled={isSelectionFull && !selectedCards.includes(user.id)}
                            onFlip={() => handleCardFlip(user.id)}
                            onShowProfile={() => handleShowProfile(user.id)}
                            finalPosition={finalChoice === user.id ? getFinalPosition() : undefined}
                        />
                    ))}
                </View>

                {phase === "final" && finalUser && (
                    <View style={styles.finalMessage}>
                        <Text style={styles.finalText}>
                            Congratulations! You&#39;ve found your {finalUser.compatibility}% match with {finalUser.name}! 🎉
                        </Text>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <UserIntroCard
                user={selectedUser}
                visible={showingProfile !== null}
                onClose={handleCloseProfile}
                onChoose={() => showingProfile && handleChooseFinal(showingProfile)}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a2e",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#a0a0a0",
        textAlign: "center",
        marginBottom: 16,
    },
    selectionHeader: {
        width: "100%",
        alignItems: "center",
    },
    progressContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: 8,
    },
    progressBar: {
        width: "80%",
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#FF6B9D",
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: "#a0a0a0",
        marginTop: 4,
    },
    cardsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        paddingHorizontal: 20,
        gap: 15,
        minHeight: CARD_HEIGHT * 2 + 40,
    },
    cardContainer: {
        marginBottom: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    cardContent: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    cardBack: {
        borderWidth: 2,
        borderColor: "#4a3c8c",
        overflow: "hidden", // 确保背景图片不会溢出圆角
    },
    backgroundImage: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        borderRadius: 14, // 稍微小一点以适应边框
    },
    defaultBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#2d1b69", // 保持原始紫色作为默认背景
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    backgroundLoader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(45, 27, 105, 0.8)",
        borderRadius: 14,
    },
    loadingText: {
        color: "#fff",
        marginTop: 8,
        fontSize: 12,
    },
    fallbackText: {
        color: "#fff",
        fontSize: 12,
        opacity: 0.7,
    },
    debugInfo: {
        position: "absolute",
        top: 5,
        left: 5,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 4,
        borderRadius: 4,
        zIndex: 100,
    },
    debugText: {
        color: "#fff",
        fontSize: 10,
    },
    cardFront: {
        backgroundColor: "#fff",
        padding: 16,
    },
    mysteryPattern: {
        alignItems: "center",
        zIndex: 10, // 确保内容在背景图片之上
        display: "none", // 隐藏所有神秘元素
    },
    mysteryText: {
        fontSize: 40,
        color: "#ff6b9d",
        fontWeight: "bold",
        marginBottom: 8,
        display: "none", // 隐藏问号
    },
    mysterySubtext: {
        fontSize: 12,
        color: "#a0a0a0",
        textAlign: "center",
        marginBottom: 8,
        display: "none", // 隐藏提示文字
    },
    sparkles: {
        flexDirection: "row",
        gap: 4,
        display: "none", // 隐藏装饰元素
    },
    sparkle: {
        fontSize: 12,
        opacity: 0.7,
        display: "none", // 隐藏星星
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center",
        marginBottom: 8,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: "center",
    },
    fallbackAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        alignSelf: "center",
    },
    fallbackAvatarText: {
        fontSize: 24,
    },
    imageLoader: {
        position: "absolute",
        top: 0,
        left: "50%",
        marginLeft: -30,
        width: 60,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 30,
    },
    userName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 2,
        textAlign: "center",
    },
    userAge: {
        fontSize: 11,
        color: "#666",
        marginBottom: 6,
        textAlign: "center",
    },
    mbtiContainer: {
        backgroundColor: "#ff6b9d",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: "center",
        marginBottom: 4,
    },
    mbtiText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    compatibilityContainer: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: "center",
    },
    compatibilityText: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "bold",
    },
    selectedBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
    },
    selectedBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    modalContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    introCard: {
        position: "absolute",
        bottom: 0,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: SCREEN_HEIGHT * 0.75,
    },
    closeButton: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 20,
        color: "#666",
    },
    introAvatarContainer: {
        alignSelf: "center",
        marginBottom: 16,
    },
    introAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: "center",
    },
    introFallbackAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 16,
    },
    introFallbackAvatarText: {
        fontSize: 40,
    },
    introName: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 12,
    },
    compatibilityRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    introMbtiContainer: {
        backgroundColor: "#ff6b9d",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    introMbtiText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    compatibilityBadge: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    compatibilityBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 16,
        gap: 8,
    },
    interestTag: {
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    interestText: {
        fontSize: 13,
        color: "#666",
    },
    bioContainer: {
        maxHeight: 80,
        marginBottom: 20,
    },
    bioText: {
        fontSize: 15,
        color: "#333",
        lineHeight: 22,
        textAlign: "center",
    },
    chooseButton: {
        backgroundColor: "#ff6b9d",
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    chooseButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    finalMessage: {
        marginTop: 40,
        marginHorizontal: 20,
        backgroundColor: "rgba(255, 107, 157, 0.9)",
        padding: 24,
        borderRadius: 20,
        alignItems: "center",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    finalText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 24,
    },
    resetButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    resetButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
})

export default CardSelectionScreen