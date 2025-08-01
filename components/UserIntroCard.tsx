"use client"

import { useEffect } from "react"
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { Ionicons } from "@expo/vector-icons"

import type { User } from '../.expo/types'

const { width, height } = Dimensions.get("window")

interface UserIntroCardProps {
    user: User
    onClose: () => void
    onSelect: (user: User) => void
}

export default function UserIntroCard({ user, onClose, onSelect }: UserIntroCardProps) {
    // Shared values for animations
    const translateY = useSharedValue(height)
    const opacity = useSharedValue(0)
    const scale = useSharedValue(0.8)

    useEffect(() => {
        // Entrance animation
        opacity.value = withTiming(1, { duration: 300 })
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 })
        scale.value = withSpring(1, { damping: 15, stiffness: 100 })
    }, [])

    const handleClose = () => {
        // Exit animation
        opacity.value = withTiming(0, { duration: 200 })
        translateY.value = withTiming(height, { duration: 300 })
        scale.value = withTiming(0.8, { duration: 300 })

        setTimeout(() => {
            runOnJS(onClose)()
        }, 300)
    }

    const handleSelect = () => {
        runOnJS(onSelect)(user)
    }

    // Pan gesture for swipe to close
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY
                opacity.value = Math.max(0.3, 1 - event.translationY / (height * 0.5))
            }
        })
        .onEnd((event) => {
            if (event.translationY > height * 0.3 || event.velocityY > 500) {
                runOnJS(handleClose)()
            } else {
                translateY.value = withSpring(0)
                opacity.value = withTiming(1)
            }
        })

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }))

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }))

    const getMBTIColor = (mbti: string) => {
        const colors = {
            ENFP: ["#ff6b9d", "#c44569"],
            INTJ: ["#4834d4", "#686de0"],
            ESFJ: ["#00d2d3", "#54a0ff"],
            ESTP: ["#ff9ff3", "#f368e0"],
            INFP: ["#7bed9f", "#70a1ff"],
        }
        return colors[mbti as keyof typeof colors] || ["#ff6b9d", "#c44569"]
    }

    // @ts-ignore
    return (
        <View style={styles.container}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <BlurView intensity={50} style={StyleSheet.absoluteFillObject} />
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />
            </Animated.View>

            {/* Card */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.card, cardStyle]}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Hero Image */}
                        <View style={styles.heroSection}>
                            <Image source={{ uri: user.photo }} style={styles.heroImage} />
                            <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.heroOverlay}>
                                <View style={styles.heroContent}>
                                    <Text style={styles.heroName}>
                                        {user.name}, {user.age}
                                    </Text>
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.locationText}>{user.location}</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            {/* MBTI Badge */}
                            <View style={styles.mbtiContainer}>
                                <LinearGradient colors={getMBTIColor(user.mbti) as [string, string]}
                                                style={styles.mbtiBadge}>
                                    <Text style={styles.mbtiText}>{user.mbti}</Text>
                                </LinearGradient>
                                <Text style={styles.occupationText}>{user.occupation}</Text>
                            </View>

                            {/* Bio */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>About</Text>
                                <Text style={styles.bioText}>{user.bio}</Text>
                            </View>

                            {/* Interests */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Interests</Text>
                                <View style={styles.interestsContainer}>
                                    {user.interests.map((interest, index) => (
                                        <View key={index} style={styles.interestTag}>
                                            <Text style={styles.interestText}>{interest}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.passButton} onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#ff4757" />
                            <Text style={styles.passButtonText}>Pass</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
                            <LinearGradient colors={["#ff6b9d", "#c44569"]} style={styles.selectButtonGradient}>
                                <Ionicons name="heart" size={24} color="#ffffff" />
                                <Text style={styles.selectButtonText}>Choose</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "flex-end",
    },
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    card: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: height * 0.85,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 20,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        height: 300,
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    heroOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50%",
        justifyContent: "flex-end",
        padding: 20,
    },
    heroContent: {
        marginBottom: 10,
    },
    heroName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    locationText: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.8)",
        marginLeft: 4,
    },
    content: {
        padding: 20,
    },
    mbtiContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    mbtiBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 12,
    },
    mbtiText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#ffffff",
    },
    occupationText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    bioText: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
    },
    interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    interestTag: {
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e9ecef",
    },
    interestText: {
        fontSize: 14,
        color: "#495057",
        fontWeight: "500",
    },
    actionButtons: {
        flexDirection: "row",
        padding: 20,
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: "#f1f3f4",
    },
    passButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: "#ff4757",
        backgroundColor: "#ffffff",
    },
    passButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ff4757",
        marginLeft: 8,
    },
    selectButton: {
        flex: 1,
        borderRadius: 25,
        overflow: "hidden",
    },
    selectButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ffffff",
        marginLeft: 8,
    },
})
