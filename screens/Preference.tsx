"use client"

import { useState } from "react"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    StyleSheet,
    Dimensions,
    SafeAreaView,
} from "react-native"
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window")

const cards = [
    { id: 1, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/d5af474050c2ff7773f174745759d874_wgezje.jpg" },
    { id: 2, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745482/f80878eec037881744073d55f1479947_chr4zt.jpg" },
    { id: 3, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/cf1ad304328fb5d9e6986bade94418fc_ygqcxa.jpg" },
    { id: 4, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/99_tuuquh.png" },
    { id: 5, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/2_btcngo.jpg" },
    { id: 6, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/5_w4c8i6.jpg" },
    { id: 7, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/1_htkc6n.jpg" },
    { id: 8, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 9, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 10, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 11, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
    { id: 12, name: "", image: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753745481/4_mcmdcv.jpg" },
]

export default function App() {
    const [range, setRange] = useState("")
    const [selectedCard, setSelectedCard] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!range || selectedCard === null) {

            Alert.alert("Error", "Please fill in all required fields")
            return
        }

        const rangeNum = Number.parseInt(range)
        if (isNaN(rangeNum) || rangeNum < 100 || rangeNum > 100000) {
            Alert.alert("Error", "Please enter a valid geographic range (100-100000 meters)")
            return
        }

        setIsSubmitting(true)

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500))
            const userId = await SecureStore.getItemAsync('user_id');

            // Here you can call the actual API
            const data = {
                user_id: userId,
                distance: rangeNum,
                photo_urls: selectedCard,

            }

            console.log("Submitted data:", data)



            const response = await fetch('https://ccbackendx-2.onrender.com/personality/preference', {
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify(data),
             })

            Alert.alert("Success", "Preferences saved successfully!", [
                {
                    text: "OK",
                    onPress: () => {
                        setRange("")
                        setSelectedCard(null)
                    },
                },
            ])
        } catch (error) {
            Alert.alert("Error", "Submission failed, please try again")
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderCard = (card: (typeof cards)[0]) => {
        const isSelected = selectedCard === card.image
        const cardWidth = (width - 60) / 2 // 2-column layout, considering margins

        return (
            <TouchableOpacity
                key={card.id}
                style={[styles.cardContainer, { width: cardWidth }, isSelected && styles.selectedCard]}
                onPress={() => setSelectedCard(card.image)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: card.image }} style={styles.cardImage} />
                <View style={styles.cardOverlay}>
                    <Text style={styles.cardName}>{card.name}</Text>
                </View>
                {isSelected && (
                    <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedText}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>💕 Set Your Dating Preferences</Text>
                    <Text style={styles.subtitle}>Tell us your expectations and let us find your perfect match</Text>
                </View>

                {/* Geographic Range Selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📍 Dating Geographic Range</Text>
                        <Text style={styles.sectionDescription}>How far would you like to search for potential dates? (in meters)</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Geographic Range (meters)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g., 5000"
                            value={range}
                            onChangeText={setRange}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <Text style={styles.inputHint}>Recommended range: 1000-50000 meters (1-50 kilometers)</Text>
                    </View>
                </View>

                {/* Card Selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🎴 Choose Your Representative Card</Text>
                        <Text style={styles.sectionDescription}>Select one card from the 12 below that best represents your personality</Text>
                    </View>

                    <View style={styles.cardsGrid}>{cards.map(renderCard)}</View>
                </View>

                {/* Submit Button */}
                <View style={styles.submitContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!range || selectedCard === null || isSubmitting) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!range || selectedCard === null || isSubmitting}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Save Preferences"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fdf2f8",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: "center",
        backgroundColor: "#ffffff",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f3e8ff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        lineHeight: 22,
    },
    section: {
        backgroundColor: "#ffffff",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: "#6b7280",
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#ffffff",
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 12,
        color: "#9ca3af",
    },
    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    cardContainer: {
        marginBottom: 15,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#e5e7eb",
        position: "relative",
    },
    selectedCard: {
        borderColor: "#ec4899",
        shadowColor: "#ec4899",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    cardImage: {
        width: "100%",
        height: 120,
        resizeMode: "cover",
    },
    cardOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 8,
    },
    cardName: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    selectedIndicator: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#ec4899",
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    selectedText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "bold",
    },
    submitContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    submitButton: {
        backgroundColor: "#ec4899",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: "#d1d5db",
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "bold",
    },
})