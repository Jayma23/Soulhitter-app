"use client"

import { useEffect } from "react"
import { View, Text, Image, StyleSheet, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
} from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { Ionicons } from "@expo/vector-icons"

import type { User, SelectionPhase } from '../.expo/types';

const { width } = Dimensions.get("window")
const CARD_WIDTH = (width - 80) / 3
const CARD_HEIGHT = CARD_WIDTH * 1.4

interface CardComponentProps {
    user: User
    isSelected: boolean
    isFlipped: boolean
    onSelect: (user: User) => void
    onPress: (user: User) => void
    phase: SelectionPhase
    finalMatch: User | null
}

export default function CardComponent({
                                          user,
                                          isSelected,
                                          isFlipped,
                                          onSelect,
                                          onPress,
                                          phase,
                                          finalMatch,
                                      }: CardComponentProps) {
    // Shared values for animations
    const scale = useSharedValue(1)
    const rotateY = useSharedValue(0)
    const opacity = useSharedValue(1)
    const glowOpacity = useSharedValue(0)

    useEffect(() => {
        // Flip animation
        if (isFlipped) {
            rotateY.value = withSpring(180, { damping: 15, stiffness: 100 })
        }

        // Selection glow
        if (isSelected) {
            glowOpacity.value = withTiming(1, { duration: 300 })
        } else {
            glowOpacity.value = withTiming(0, { duration: 300 })
        }

        // Final phase animations
        if (phase === "final") {
            if (finalMatch?.id === user.id) {
                // Selected card grows and centers
                scale.value = withSpring(1.3, { damping: 12, stiffness: 80 })
            } else if (isSelected) {
                // Other selected cards fade away
                opacity.value = withTiming(0, { duration: 800 })
                scale.value = withTiming(0.8, { duration: 800 })
            }
        }
    }, [isFlipped, isSelected, phase, finalMatch])

    // Gesture handling
    const tapGesture = Gesture.Tap()
        .onStart(() => {
            scale.value = withSpring(0.95, { damping: 15, stiffness: 200 })
        })
        .onEnd(() => {
            scale.value = withSpring(isSelected ? 1.05 : 1, { damping: 15, stiffness: 200 })

            if (phase === "selecting") {
                if (isFlipped) {
                    runOnJS(onPress)(user)
                } else {
                    runOnJS(onSelect)(user)
                }
            }
        })

    // Animated styles
    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            {
                rotateY: `${rotateY.value}deg`,
            },
        ],
        opacity: opacity.value,
    }))

    const frontStyle = useAnimatedStyle(() => ({
        opacity: interpolate(rotateY.value, [0, 90, 180], [0, 0, 1]),
        transform: [{ rotateY: "180deg" }],
    }))

    const backStyle = useAnimatedStyle(() => ({
        opacity: interpolate(rotateY.value, [0, 90, 180], [1, 0, 0]),
    }))

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }))

    return (
        <GestureDetector gesture={tapGesture}>
            <Animated.View style={[styles.cardContainer, cardStyle]}>
                {/* Glow effect for selected cards */}
                <Animated.View style={[styles.cardGlow, glowStyle]} />

                {/* Card Back */}
                <Animated.View style={[styles.cardSide, styles.cardBack, backStyle]}>
                    <LinearGradient colors={["#2d1b69", "#11998e", "#38ef7d"]} style={styles.cardBackGradient}>
                        <View style={styles.cardBackContent}>
                            {/* Mystical pattern */}
                            <View style={styles.mysticalPattern}>
                                <View style={styles.outerCircle}>
                                    <View style={styles.middleCircle}>
                                        <View style={styles.innerCircle}>
                                            <Ionicons name="heart" size={20} color="#ffffff" />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Corner decorations */}
                            <View style={styles.cornerDecorations}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>

                            {/* Sparkle effects */}
                            <View style={styles.sparkles}>
                                <Ionicons name="sparkles" size={16} color="rgba(255, 255, 255, 0.6)" style={styles.sparkle1} />
                                <Ionicons name="sparkles" size={12} color="rgba(255, 255, 255, 0.4)" style={styles.sparkle2} />
                                <Ionicons name="sparkles" size={14} color="rgba(255, 255, 255, 0.5)" style={styles.sparkle3} />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Card Front */}
                <Animated.View style={[styles.cardSide, styles.cardFront, frontStyle]}>
                    <View style={styles.cardFrontContent}>
                        <Image source={{ uri: user.photo }} style={styles.userPhoto} />
                        <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.photoOverlay}>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userAge}>{user.age}</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* Selection indicator */}
                {isSelected && (
                    <View style={styles.selectionIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color="#ff6b9d" />
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        margin: 5,
    },
    cardGlow: {
        position: "absolute",
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 20,
        backgroundColor: "#ff6b9d",
        shadowColor: "#ff6b9d",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    cardSide: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 15,
        backfaceVisibility: "hidden",
        overflow: "hidden",
    },
    cardBack: {
        backgroundColor: "#2d1b69",
    },
    cardBackGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cardBackContent: {
        flex: 1,
        width: "100%",
        position: "relative",
    },
    mysticalPattern: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -30 }, { translateY: -30 }],
    },
    outerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    middleCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    innerCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    cornerDecorations: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    corner: {
        position: "absolute",
        width: 20,
        height: 20,
        borderColor: "rgba(255, 255, 255, 0.5)",
    },
    topLeft: {
        top: 10,
        left: 10,
        borderTopWidth: 2,
        borderLeftWidth: 2,
    },
    topRight: {
        top: 10,
        right: 10,
        borderTopWidth: 2,
        borderRightWidth: 2,
    },
    bottomLeft: {
        bottom: 10,
        left: 10,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
    },
    bottomRight: {
        bottom: 10,
        right: 10,
        borderBottomWidth: 2,
        borderRightWidth: 2,
    },
    sparkles: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sparkle1: {
        position: "absolute",
        top: 20,
        right: 20,
    },
    sparkle2: {
        position: "absolute",
        bottom: 30,
        left: 15,
    },
    sparkle3: {
        position: "absolute",
        top: 60,
        left: 25,
    },
    cardFront: {
        backgroundColor: "#ffffff",
    },
    cardFrontContent: {
        flex: 1,
        position: "relative",
    },
    userPhoto: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    photoOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "40%",
        justifyContent: "flex-end",
        padding: 12,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ffffff",
    },
    userAge: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
    },
    selectionIndicator: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#ffffff",
        borderRadius: 15,
        padding: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
})
