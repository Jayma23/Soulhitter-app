import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

interface DateCardData {
    name: string;
    photoUrl: string;
    description: string;
}

export default function DateCardGenerator() {
    const [name, setName] = useState<string>('');
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);

    // Replace with your actual backend URL
    const BACKEND_URL = 'https://ccbackendx-2.onrender.com/chat/Gcard'; // Update this!

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setSelectedImage(imageUri);
                setPhotoUrl(imageUri); // For now, using local URI
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image. Please try again.');
            console.error('Image picker error:', error);
        }
    };

    const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
        try {
            // Create form data for Cloudinary upload
            const formData = new FormData();
            formData.append('file', {
                photoUrl: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753775811/IMG_3963_l72j3k.jpg",
                description: "James is bold, curious, and full of life — she’s grounded in what she wants and isn’t afraid to speak her mind, but she’s also warm, funny, and deeply loyal when it counts.",
                name: 'James',
            } as any);
            formData.append('upload_preset', 'your_upload_preset'); // Replace with your Cloudinary preset

            const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            if (data.secure_url) {
                return data.secure_url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    };

    const generateCard = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Information', 'Please enter a name.');
            return;
        }
        if (!selectedImage) {
            Alert.alert('Missing Information', 'Please select a photo.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Missing Information', 'Please enter a description.');
            return;
        }

        setIsGenerating(true);

        try {
            // Upload image to Cloudinary first (or use your preferred image hosting)
            let uploadedPhotoUrl = photoUrl;

            // Uncomment this if you want to upload to Cloudinary
            // uploadedPhotoUrl = await uploadImageToCloudinary(selectedImage);

            const cardData: DateCardData = {
                photoUrl: "https://res.cloudinary.com/dyedqw0mv/image/upload/v1753775811/IMG_3963_l72j3k.jpg",
                description: "James is bold, curious, and full of life — she’s grounded in what she wants and isn’t afraid to speak her mind, but she’s also warm, funny, and deeply loyal when it counts.",
                name: 'James',
            };

            // Call your backend API
            const response = await fetch(`https://ccbackendx-2.onrender.com/chat/Gcard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Assuming your backend returns the generated image as base64 or URL
            const blob = await response.blob();
            const result = URL.createObjectURL(blob);

            if (result) {
                setGeneratedCardUrl(result);
                Alert.alert('Success! 🎉', 'Your date card has been generated successfully!');
            } else {
                throw new Error('Invalid response from server');
            }

        } catch (error) {
            console.error('Card generation error:', error);
            Alert.alert(
                'Generation Failed',
                'Failed to generate the card. Please check your connection and try again.'
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const shareCard = async () => {
        if (!generatedCardUrl) return;

        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(generatedCardUrl);
            } else {
                Alert.alert('Sharing not available', 'Sharing is not available on this device.');
            }
        } catch (error) {
            Alert.alert('Share Error', 'Failed to share the card.');
            console.error('Sharing error:', error);
        }
    };

    const resetForm = () => {
        setName('');
        setPhotoUrl('');
        setDescription('');
        setSelectedImage(null);
        setGeneratedCardUrl(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>💕 Date Card Generator</Text>
                        <Text style={styles.subtitle}>Create beautiful date cards in seconds</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter name (e.g., Chris)"
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                            />
                        </View>

                        {/* Photo Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Photo</Text>
                            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                {selectedImage ? (
                                    <Image source={{ uri: selectedImage }} style={styles.selectedPhoto} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Text style={styles.photoPlaceholderText}>📸</Text>
                                        <Text style={styles.photoPlaceholderSubtext}>Tap to select photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Describe the person's personality, interests, or what makes them special..."
                                value={description}
                                onChangeText={setDescription}
                                multiline={true}
                                numberOfLines={4}
                                maxLength={300}
                                textAlignVertical="top"
                            />
                            <Text style={styles.characterCount}>{description.length}/300</Text>
                        </View>

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                (!name.trim() || !selectedImage || !description.trim() || isGenerating) &&
                                styles.generateButtonDisabled
                            ]}
                            onPress={generateCard}
                            disabled={!name.trim() || !selectedImage || !description.trim() || isGenerating}
                        >
                            {isGenerating ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#ffffff" />
                                    <Text style={styles.generateButtonText}>Generating...</Text>
                                </View>
                            ) : (
                                <Text style={styles.generateButtonText}>✨ Generate Date Card</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Generated Card Preview */}
                    {generatedCardUrl && (
                        <View style={styles.previewContainer}>
                            <Text style={styles.previewTitle}>Your Generated Card 🎉</Text>
                            <View style={styles.cardPreview}>
                                <Image source={{ uri: generatedCardUrl }} style={styles.cardImage} />
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.shareButton} onPress={shareCard}>
                                    <Text style={styles.shareButtonText}>📤 Share Card</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.newCardButton} onPress={resetForm}>
                                    <Text style={styles.newCardButtonText}>🆕 Create New</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fdf2f8',
    },
    flex: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3e8ff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#1f2937',
    },
    textArea: {
        height: 100,
        paddingTop: 16,
    },
    characterCount: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 4,
    },
    photoButton: {
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
        borderRadius: 12,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholder: {
        alignItems: 'center',
    },
    photoPlaceholderText: {
        fontSize: 40,
        marginBottom: 8,
    },
    photoPlaceholderSubtext: {
        fontSize: 16,
        color: '#6b7280',
    },
    selectedPhoto: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    generateButton: {
        backgroundColor: '#ec4899',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#ec4899',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    generateButtonDisabled: {
        backgroundColor: '#d1d5db',
        shadowOpacity: 0,
        elevation: 0,
    },
    generateButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    previewContainer: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    previewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 16,
    },
    cardPreview: {
        alignItems: 'center',
        marginBottom: 20,
    },
    cardImage: {
        width: width - 80,
        height: (width - 80) * 1.25, // Maintain 4:5 aspect ratio
        borderRadius: 12,
        resizeMode: 'cover',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    newCardButton: {
        flex: 1,
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    newCardButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});