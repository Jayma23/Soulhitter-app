// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
    Easing,
    Platform,
    Vibration,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Image,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from './UserContext';

const { width, height } = Dimensions.get('window');
const photoSize = (width - 80) / 3;

// 环境变量配置
import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '@env';

interface Answers {
    [key: string]: any;
}

interface BasicInfoAnswers {
    name: string;
    phone: string;
    birthday: string;
    gender: string;
    sexuality: string;
    ethnicity: string[];
    height: string;
    extroversion: number;
    zipCode: string;
    selectedAreas: string[];
    photos: (string | null)[];
}

interface PreferencesAnswers {
    datingIntentions: string[];
    interestedIn: string[];
    ethnicityAttraction: string[];
    ageRange: number[];
    greenFlags: string;
    redFlags: string;
    physicalAttraction: string;
}

interface PersonalityAnswers {
    hobbies: string;
    aboutMe: string;
    lifestyle: string;
    values: string;
    futureGoals: string;
    perfectDate: string;
}

// Word counting utility function
const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// 照片卡片组件
const PhotoCard = React.memo(({
                                  uri,
                                  index,
                                  onPickImage,
                                  onRemovePhoto,
                                  uploading
                              }: {
    uri: string | null;
    index: number;
    onPickImage: (index: number) => void;
    onRemovePhoto: (index: number) => void;
    uploading: number | null;
}) => {
    const isUploading = uploading === index;
    const isMainPhoto = index === 0;

    return (
        <TouchableOpacity
            style={[
                styles.photoCard,
                isMainPhoto && styles.mainPhotoCard
            ]}
            onPress={() => onPickImage(index)}
            activeOpacity={0.8}
        >
            {uri ? (
                <View style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onRemovePhoto(index)}
                    >
                        <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                    {isMainPhoto && (
                        <View style={styles.mainPhotoLabel}>
                            <Text style={styles.mainPhotoText}>Main</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.photoPlaceholder}>
                    {isUploading ? (
                        <View style={styles.uploadingContainer}>
                            <View style={styles.uploadingSpinner} />
                            <Text style={styles.uploadingText}>Uploading...</Text>
                        </View>
                    ) : (
                        <>
                            <Ionicons name="camera" size={28} color="#c7d2fe" />
                            <Text style={styles.placeholderText}>
                                {isMainPhoto ? 'Main Photo' : `Photo ${index + 1}`}
                            </Text>
                        </>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
});

export default function ProfileUpdateScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [answers, setAnswers] = useState<Answers>({
        photos: [null, null, null, null, null]
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [uploading, setUploading] = useState<number | null>(null);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [originalAnswers, setOriginalAnswers] = useState<Answers>({});

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const { setUser } = useUser();

    const totalSteps = 4;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    // 隐藏默认的导航头部
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // 加载现有数据
    useEffect(() => {
        loadExistingProfile();
    }, []);

    // 监听数据变化
    useEffect(() => {
        if (Object.keys(originalAnswers).length > 0) {
            const changed = JSON.stringify(answers) !== JSON.stringify(originalAnswers);
            setHasChanges(changed);
        }
    }, [answers, originalAnswers]);

    const loadExistingProfile = async () => {
        try {
            setIsLoading(true);
            const userId = await SecureStore.getItemAsync('user_id');

            if (!userId) {
                Alert.alert('Error', 'User not found. Please login again.');
                navigation.goBack();
                return;
            }

            // 获取用户档案数据
            const profileResponse = await fetch(`https://ccbackendx-2.onrender.com/personality/get-profile/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();

                // 合并所有数据 - 适配后端返回格式
                const combinedData = {
                    // 基本信息
                    name: profileData.name || '',
                    age: profileData.age?.toString() || '',
                    height: profileData.height || '',
                    gender: profileData.gender || '',
                    sexuality: profileData.orientation || '', // 注意这里是 orientation
                    photos: profileData.photo_urls || [null, null, null, null, null],

                    // 问卷数据 - 从 questionnaire_answers 获取
                    ...(profileData.questionnaire_answers || {}),
                };

                // 确保照片数组长度为5
                while (combinedData.photos.length < 5) {
                    combinedData.photos.push(null);
                }

                setAnswers(combinedData);
                setOriginalAnswers(JSON.parse(JSON.stringify(combinedData)));
            } else {
                Alert.alert('Error', 'Failed to load profile data.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Network error. Please check your connection.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading) {
            // 页面进入动画
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [currentStep, fadeAnim, slideAnim, scaleAnim, isLoading]);

    useEffect(() => {
        // 更新进度条
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [currentStep, progressAnim, progress]);

    const handleAnswer = (questionId: string, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleGoBack = () => {
        if (hasChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to save them before leaving?',
                [
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    },
                    {
                        text: 'Save',
                        onPress: () => updateProfile()
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    // 新增：返回首页功能
    const handleGoHome = () => {
        if (hasChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Do you want to save them before going home?',
                [
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.navigate('Home') // 假设主页面路由名为 'Home'
                    },
                    {
                        text: 'Save & Go Home',
                        onPress: async () => {
                            await updateProfile();
                            navigation.navigate('Home');
                        }
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            navigation.navigate('Home'); // 假设主页面路由名为 'Home'
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            // 重置动画
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            scaleAnim.setValue(0.9);

            setCurrentStep(prev => prev + 1);
        } else {
            updateProfile();
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            // 重置动画
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
            scaleAnim.setValue(0.9);

            setCurrentStep(prev => prev - 1);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: // Photos step
                const uploadedPhotos = answers.photos?.filter((p: string | null) => p).length || 0;
                return uploadedPhotos >= 1;
            case 1: // Basic info step
                return answers.name && answers.name.trim().length > 0;
            case 2: // Preferences step
                return true;
            case 3: // Personality step
                return answers.aboutMe && answers.aboutMe.trim().length >= 10;
            default:
                return true;
        }
    };

    const updateProfile = async () => {
        if (!hasChanges) {
            Alert.alert('No Changes', 'No changes to save.');
            return;
        }

        setIsSubmitting(true);

        try {
            const userId = await SecureStore.getItemAsync('user_id');
            if (!userId) {
                Alert.alert('Error', 'User not found. Please login again.');
                return;
            }

            // 更新基本资料信息
            const profileData = {
                user_id: userId,
                name: answers.name?.trim() || '',
                height: answers.height?.trim() || null,
                age: /^\d+$/.test(answers.age) ? parseInt(answers.age) : null,
                gender: answers.gender?.trim() || null,
                orientation: answers.sexuality?.trim() || null,
                photo_urls: answers.photos?.filter((p: string | null) => p) || [],
                primary_index: 0
            };

            // 更新用户上下文
            setUser({
                name: answers.name ?? null,
                email: answers.email ?? null,
                photo: answers.photos[0] ?? null,
                user_id: answers.user_id ?? null,
                token: answers.token ?? null,
            });

            const profileResponse = await fetch('https://ccbackendx-2.onrender.com/personality/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to update profile data');
            }

            // 更新AI匹配数据
            const aiMatchingData = {
                user_id: userId,
                questionnaire_answers: {
                    ...answers,
                    phone: answers.phone || '',
                    birthday: answers.birthday || '',
                    ethnicity: answers.ethnicity || [],
                    extroversion: answers.extroversion || 5,
                    zipCode: answers.zipCode || '',
                    selectedAreas: answers.selectedAreas || [],
                    datingIntentions: answers.datingIntentions || [],
                    interestedIn: answers.interestedIn || [],
                    ethnicityAttraction: answers.ethnicityAttraction || [],
                    ageRange: answers.ageRange || [18, 30],
                    greenFlags: answers.greenFlags || '',
                    redFlags: answers.redFlags || '',
                    physicalAttraction: answers.physicalAttraction || '',
                    hobbies: answers.hobbies || '',
                    lifestyle: answers.lifestyle || '',
                    values: answers.values || '',
                    futureGoals: answers.futureGoals || '',
                    perfectDate: answers.perfectDate || ''
                },
                updated_at: new Date().toISOString(),
                total_words: Object.values(answers).join(' ').split(' ').length
            };

            const saveResponse = await fetch('https://ccbackendx-2.onrender.com/personality/update-matching-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiMatchingData)
            });

            if (saveResponse.ok) {
                setOriginalAnswers(JSON.parse(JSON.stringify(answers)));
                setHasChanges(false);

                Alert.alert(
                    'Profile Updated! ✅',
                    'Your profile has been successfully updated.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to update your profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 照片上传相关函数
    const pickImage = useCallback(async (index: number) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            return Alert.alert("Permission Required", "Please allow access to your photo library to upload images.");
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1]
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            uploadToCloudinary(uri, index);
        }
    }, []);

    const uploadToCloudinary = useCallback(async (uri: string, index: number) => {
        setUploading(index);

        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: `profile_${Date.now()}.jpg`,
        } as any);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.secure_url) {
                setAnswers(prev => {
                    const currentPhotos = prev.photos || [null, null, null, null, null];
                    const newPhotos = [...currentPhotos];
                    newPhotos[index] = data.secure_url;
                    return {
                        ...prev,
                        photos: newPhotos
                    };
                });
                Alert.alert('Upload Successful', 'Photo uploaded successfully.');
            } else {
                Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Error', 'Network error. Please check your connection.');
        } finally {
            setUploading(null);
        }
    }, []);

    const removePhoto = useCallback((index: number) => {
        setAnswers(prev => {
            const currentPhotos = prev.photos || [null, null, null, null, null];
            const newPhotos = [...currentPhotos];
            newPhotos[index] = null;
            return {
                ...prev,
                photos: newPhotos
            };
        });
    }, []);

    const stepTitles = [
        'Update Your Photos',
        'Update Basic Information',
        'Update Dating Preferences',
        'Update Your Profile'
    ];

    const stepSubtitles = [
        'Keep your photos fresh',
        'Make sure your info is current',
        'Refine what you\'re looking for',
        'Tell your story better'
    ];

    const stepIcons: (keyof typeof Ionicons.glyphMap)[] = ['camera', 'person', 'heart', 'star'];

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return <PhotosStep
                    answers={answers}
                    updateAnswer={handleAnswer}
                    pickImage={pickImage}
                    removePhoto={removePhoto}
                    uploading={uploading}
                />;
            case 1:
                return <BasicInfoStep answers={answers} updateAnswer={handleAnswer} />;
            case 2:
                return <PreferencesStep answers={answers} updateAnswer={handleAnswer} />;
            case 3:
                return <PersonalityStep answers={answers} updateAnswer={handleAnswer} />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={StyleSheet.absoluteFillObject}
                />
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor="#667eea" />

            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (currentStep > 0) {
                            previousStep();
                        } else {
                            handleGoBack();
                        }
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Update Profile</Text>
                    <Text style={styles.headerSubtitle}>
                        Step {currentStep + 1} of {totalSteps}
                    </Text>
                    {hasChanges && (
                        <View style={styles.changesIndicator}>
                            <Ionicons name="ellipse" size={8} color="#fbbf24" />
                            <Text style={styles.changesText}>Unsaved changes</Text>
                        </View>
                    )}
                </View>

                <View style={styles.rightButtons}>
                    {/* HOME Button */}
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={handleGoHome}
                    >
                        <Ionicons name="home" size={20} color="#ffffff" />
                        <Text style={styles.homeButtonText}>HOME</Text>
                    </TouchableOpacity>

                    {hasChanges && (
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={updateProfile}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {/* Progress Bar */}
            <Animated.View
                style={[
                    styles.progressContainer,
                    { opacity: fadeAnim }
                ]}
            >
                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Card */}
                <Animated.View
                    style={[
                        styles.questionCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* Question Icon */}
                    <View style={styles.questionIconContainer}>
                        <LinearGradient
                            colors={['#ffffff', '#f0f4ff']}
                            style={styles.questionIcon}
                        >
                            <Ionicons name={stepIcons[currentStep]} size={32} color="#667eea" />
                        </LinearGradient>
                    </View>

                    {/* Question Text */}
                    <Text style={styles.questionTitle}>
                        {stepTitles[currentStep]}
                    </Text>

                    <Text style={styles.questionSubtitle}>
                        {stepSubtitles[currentStep]}
                    </Text>

                    {/* Answer Input */}
                    <View style={styles.answerContainer}>
                        {renderCurrentStep()}
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Bottom Actions */}
            <Animated.View
                style={[
                    styles.bottomActions,
                    { opacity: fadeAnim }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        !canProceed() && styles.nextButtonDisabled
                    ]}
                    onPress={() => {
                        if (Platform.OS === 'ios') {
                            Vibration.vibrate();
                        }

                        if (currentStep === totalSteps - 1) {
                            updateProfile();
                        } else {
                            nextStep();
                        }
                    }}
                    disabled={!canProceed() || isSubmitting}
                >
                    <LinearGradient
                        colors={canProceed() ? ['#ffffff', '#f0f4ff'] : ['#9ca3af', '#6b7280']}
                        style={styles.nextButtonGradient}
                    >
                        {isSubmitting ? (
                            <Text style={styles.nextButtonText}>Updating...</Text>
                        ) : (
                            <>
                                <Text style={[
                                    styles.nextButtonText,
                                    { color: canProceed() ? '#667eea' : '#ffffff' }
                                ]}>
                                    {currentStep === totalSteps - 1 ? 'Update Profile' : 'Next Step'}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={canProceed() ? '#667eea' : '#ffffff'}
                                />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

// Photos Step Component
function PhotosStep({
                        answers,
                        updateAnswer,
                        pickImage,
                        removePhoto,
                        uploading
                    }: {
    answers: Answers;
    updateAnswer: (key: string, value: any) => void;
    pickImage: (index: number) => void;
    removePhoto: (index: number) => void;
    uploading: number | null;
}) {
    const photos = answers.photos && Array.isArray(answers.photos)
        ? answers.photos
        : [null, null, null, null, null];

    while (photos.length < 5) {
        photos.push(null);
    }

    const uploadedPhotosCount = photos.filter((p: string | null) => p !== null).length;

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionSubtitle}>
                {uploadedPhotosCount > 0
                    ? `You have ${uploadedPhotosCount} photo${uploadedPhotosCount > 1 ? 's' : ''}. Add ${5 - uploadedPhotosCount} more?`
                    : 'Add up to 5 photos (at least 1 required)'
                }
            </Text>

            {/* Photo Grid */}
            <View style={styles.photoGrid}>
                {/* First row: Main photo */}
                <View style={styles.mainPhotoRow}>
                    <PhotoCard
                        uri={photos[0]}
                        index={0}
                        onPickImage={pickImage}
                        onRemovePhoto={removePhoto}
                        uploading={uploading}
                    />
                </View>

                {/* Second row: Two photos */}
                <View style={styles.photoRow}>
                    <PhotoCard
                        uri={photos[1]}
                        index={1}
                        onPickImage={pickImage}
                        onRemovePhoto={removePhoto}
                        uploading={uploading}
                    />
                    <PhotoCard
                        uri={photos[2]}
                        index={2}
                        onPickImage={pickImage}
                        onRemovePhoto={removePhoto}
                        uploading={uploading}
                    />
                </View>

                {/* Third row: Two photos */}
                <View style={styles.photoRow}>
                    <PhotoCard
                        uri={photos[3]}
                        index={3}
                        onPickImage={pickImage}
                        onRemovePhoto={removePhoto}
                        uploading={uploading}
                    />
                    <PhotoCard
                        uri={photos[4]}
                        index={4}
                        onPickImage={pickImage}
                        onRemovePhoto={removePhoto}
                        uploading={uploading}
                    />
                </View>
            </View>

            {/* Photo Tips */}
            <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Update Tips</Text>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.tipText}>Keep your photos recent and current</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.tipText}>Show different sides of your personality</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.tipText}>Quality photos get more matches</Text>
                </View>
            </View>
        </View>
    );
}

// Basic Info Step Component
function BasicInfoStep({ answers, updateAnswer }: { answers: Answers; updateAnswer: (key: string, value: any) => void }) {
    const basicAnswers: BasicInfoAnswers = {
        name: answers.name || '',
        phone: answers.phone || '',
        birthday: answers.birthday || '',
        gender: answers.gender || '',
        sexuality: answers.sexuality || '',
        ethnicity: answers.ethnicity || [],
        height: answers.height || '',
        extroversion: answers.extroversion || 5,
        zipCode: answers.zipCode || '',
        selectedAreas: answers.selectedAreas || [],
        photos: answers.photos || []
    };

    const areas: { [key: string]: string[] } = {
        'San Francisco': ['Downtown', 'Mission', 'Sunset', 'Castro / Noe Valley', 'SoMa', 'Marina', 'North Beach'],
        'Peninsula': ['Daly City', 'San Mateo', 'Redwood City', 'Menlo Park', 'Palo Alto', 'Mountain View'],
        'South Bay': ['Sunnyvale', 'Cupertino', 'San Jose', 'Santa Clara'],
        'East Bay & North Bay': ['Albany', 'Berkeley', 'Emeryville', 'Fremont', 'Hayward', 'Oakland', 'San Rafael', 'Vallejo', 'Napa']
    };

    const ethnicities = [
        'American Indian', 'Black/African Descent', 'East Asian', 'Hispanic/Latino',
        'Middle Eastern', 'Pacific Islander', 'South Asian', 'White/Caucasian', 'Other', 'Prefer not to say'
    ];

    const genderOptions = ['Female', 'Male', 'Nonbinary'];
    const sexualityOptions = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual', 'Other', 'Prefer not to say'];

    const toggleArea = (area: string) => {
        const newSelected = basicAnswers.selectedAreas.includes(area)
            ? basicAnswers.selectedAreas.filter((a: string) => a !== area)
            : [...basicAnswers.selectedAreas, area];
        updateAnswer('selectedAreas', newSelected);
    };

    const toggleEthnicity = (eth: string) => {
        const newSelected = basicAnswers.ethnicity.includes(eth)
            ? basicAnswers.ethnicity.filter((e: string) => e !== eth)
            : [...basicAnswers.ethnicity, eth];
        updateAnswer('ethnicity', newSelected);
    };

    const selectAllAreas = (regionAreas: string[]) => {
        const allSelected = regionAreas.every((area: string) => basicAnswers.selectedAreas.includes(area));
        if (allSelected) {
            const newSelected = basicAnswers.selectedAreas.filter((area: string) => !regionAreas.includes(area));
            updateAnswer('selectedAreas', newSelected);
        } else {
            const newSelected = [...new Set([...basicAnswers.selectedAreas, ...regionAreas])];
            updateAnswer('selectedAreas', newSelected);
        }
    };

    return (
        <View style={styles.stepContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your name? <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        value={basicAnswers.name}
                        onChangeText={(text: string) => {
                            if (countWords(text) <= 200) {
                                updateAnswer('name', text);
                            } else {
                                Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                            }
                        }}
                        placeholder="Your name"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your phone number?</Text>
                <Text style={styles.subtitle}>Phone number is needed to receive important updates. It will ONLY be shared with your confirmed date.</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        value={basicAnswers.phone}
                        onChangeText={(text: string) => {
                            if (countWords(text) <= 200) {
                                updateAnswer('phone', text);
                            } else {
                                Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                            }
                        }}
                        placeholder="Phone number"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                    />
                </View>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>How old are you?</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="calendar" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        value={answers.age || ''}
                        onChangeText={(text: string) => {
                            if (countWords(text) <= 200) {
                                updateAnswer('age', text);
                            } else {
                                Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                            }
                        }}
                        placeholder="Age"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Height */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>How tall are you?</Text>
                <Text style={styles.subtitle}>e.g.: 180cm</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="resize" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        value={basicAnswers.height}
                        onChangeText={(text: string) => {
                            if (countWords(text) <= 200) {
                                updateAnswer('height', text);
                            } else {
                                Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                            }
                        }}
                        placeholder="Height"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                    <Text style={styles.unitText}>cm</Text>
                </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your gender?</Text>
                <View style={styles.optionsContainer}>
                    {genderOptions.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                basicAnswers.gender === option && styles.optionButtonSelected
                            ]}
                            onPress={() => updateAnswer('gender', option)}
                        >
                            <Text style={[
                                styles.optionText,
                                basicAnswers.gender === option && styles.optionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Sexuality */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your sexuality?</Text>
                <View style={styles.optionsContainer}>
                    {sexualityOptions.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                basicAnswers.sexuality === option && styles.optionButtonSelected
                            ]}
                            onPress={() => updateAnswer('sexuality', option)}
                        >
                            <Text style={[
                                styles.optionText,
                                basicAnswers.sexuality === option && styles.optionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Ethnicity */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your ethnicity?</Text>
                <Text style={styles.subtitle}>Select all that apply</Text>
                <View style={styles.optionsContainer}>
                    {ethnicities.map((eth: string) => (
                        <TouchableOpacity
                            key={eth}
                            style={[
                                styles.optionButton,
                                basicAnswers.ethnicity.includes(eth) && styles.optionButtonSelected
                            ]}
                            onPress={() => toggleEthnicity(eth)}
                        >
                            <Text style={[
                                styles.optionText,
                                basicAnswers.ethnicity.includes(eth) && styles.optionTextSelected
                            ]}>
                                {eth}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Extroversion Scale */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>On a scale of 0-10, how extroverted are you?</Text>
                <View style={styles.scaleContainer}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map((num: number) => (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.scaleButton,
                                basicAnswers.extroversion === num && styles.scaleButtonSelected
                            ]}
                            onPress={() => updateAnswer('extroversion', num)}
                        >
                            <Text style={[
                                styles.scaleText,
                                basicAnswers.extroversion === num && styles.scaleTextSelected
                            ]}>
                                {num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Zip Code */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your zip code?</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="location" size={20} color="#667eea" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        value={basicAnswers.zipCode}
                        onChangeText={(text: string) => {
                            if (countWords(text) <= 200) {
                                updateAnswer('zipCode', text);
                            } else {
                                Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                            }
                        }}
                        placeholder="94704"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Dating Areas */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Pick the areas you&#39;re comfortable going to for an in-person date.</Text>
                <Text style={styles.subtitle}>Select all that apply</Text>

                {Object.entries(areas).map(([region, regionAreas]: [string, string[]]) => (
                    <View key={region} style={styles.regionContainer}>
                        <View style={styles.regionHeader}>
                            <Text style={styles.regionTitle}>{region}</Text>
                            <TouchableOpacity onPress={() => selectAllAreas(regionAreas)}>
                                <Text style={styles.selectAllText}>Select All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.areaButtonsContainer}>
                            {regionAreas.map((area: string) => (
                                <TouchableOpacity
                                    key={area}
                                    style={[
                                        styles.areaButton,
                                        basicAnswers.selectedAreas.includes(area) && styles.areaButtonSelected
                                    ]}
                                    onPress={() => toggleArea(area)}
                                >
                                    <Text style={[
                                        styles.areaText,
                                        basicAnswers.selectedAreas.includes(area) && styles.areaTextSelected
                                    ]}>
                                        {area}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

// Preferences Step Component
function PreferencesStep({ answers, updateAnswer }: { answers: Answers; updateAnswer: (key: string, value: any) => void }) {
    const preferencesAnswers: PreferencesAnswers = {
        datingIntentions: answers.datingIntentions || [],
        interestedIn: answers.interestedIn || [],
        ethnicityAttraction: answers.ethnicityAttraction || [],
        ageRange: answers.ageRange || [18, 30],
        greenFlags: answers.greenFlags || '',
        redFlags: answers.redFlags || '',
        physicalAttraction: answers.physicalAttraction || ''
    };

    const datingOptions = ['Life partner', 'Long-term relationship', 'Short-term relationship', 'Making new friends', 'Prefer not to say'];
    const genderOptions = ['Men', 'Women', 'Nonbinary people', 'Everyone'];
    const ethnicities = ['American Indian', 'Black/African Descent', 'East Asian', 'Hispanic/Latino', 'Middle Eastern', 'Pacific Islander', 'South Asian', 'White/Caucasian', 'Other', 'Prefer not to say'];

    const toggleSelection = (item: string, listKey: keyof PreferencesAnswers) => {
        const currentList = preferencesAnswers[listKey] as string[];
        const newList = currentList.includes(item)
            ? currentList.filter((i: string) => i !== item)
            : [...currentList, item];
        updateAnswer(listKey, newList);
    };

    return (
        <View style={styles.stepContainer}>
            {/* Dating Intentions */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What is your dating intention?</Text>
                <Text style={styles.subtitle}>Select all that apply</Text>
                <View style={styles.optionsContainer}>
                    {datingOptions.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                preferencesAnswers.datingIntentions.includes(option) && styles.optionButtonSelected
                            ]}
                            onPress={() => toggleSelection(option, 'datingIntentions')}
                        >
                            <Text style={[
                                styles.optionText,
                                preferencesAnswers.datingIntentions.includes(option) && styles.optionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Who to Date */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Who do you want to date?</Text>
                <Text style={styles.subtitle}>Select all who you&#39;re open to meeting</Text>
                <View style={styles.optionsContainer}>
                    {genderOptions.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                preferencesAnswers.interestedIn.includes(option) && styles.optionButtonSelected
                            ]}
                            onPress={() => toggleSelection(option, 'interestedIn')}
                        >
                            <Text style={[
                                styles.optionText,
                                preferencesAnswers.interestedIn.includes(option) && styles.optionTextSelected
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Ethnicity Attraction */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What ethnicities are you attracted to?</Text>
                <Text style={styles.subtitle}>Select all that apply</Text>
                <View style={styles.optionsContainer}>
                    {ethnicities.map((ethnicity: string) => (
                        <TouchableOpacity
                            key={ethnicity}
                            style={[
                                styles.optionButton,
                                preferencesAnswers.ethnicityAttraction.includes(ethnicity) && styles.optionButtonSelected
                            ]}
                            onPress={() => toggleSelection(ethnicity, 'ethnicityAttraction')}
                        >
                            <Text style={[
                                styles.optionText,
                                preferencesAnswers.ethnicityAttraction.includes(ethnicity) && styles.optionTextSelected
                            ]}>
                                {ethnicity}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Age Range */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What age range would you like to date in?</Text>
                <Text style={styles.subtitle}>Current range: {preferencesAnswers.ageRange[0]}-{preferencesAnswers.ageRange[1]}</Text>
                <View style={styles.ageRangeContainer}>
                    <Text style={styles.ageLabel}>Min: {preferencesAnswers.ageRange[0]}</Text>
                    <View style={styles.ageInputsContainer}>
                        <TextInput
                            style={styles.ageInput}
                            value={preferencesAnswers.ageRange[0].toString()}
                            onChangeText={(text: string) => {
                                const min = parseInt(text) || 18;
                                const max = preferencesAnswers.ageRange[1];

                                if (min > max) {
                                    Alert.alert("Invalid Range", "Minimum age cannot be greater than maximum age.");
                                } else if (min < 18 || min > 99) {
                                    Alert.alert("Invalid Age", "Age must be between 18 and 99.");
                                } else {
                                    updateAnswer('ageRange', [min, max]);
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="18"
                        />

                        <Text style={styles.ageSeparator}>to</Text>

                        <TextInput
                            style={styles.ageInput}
                            value={preferencesAnswers.ageRange[1].toString()}
                            onChangeText={(text: string) => {
                                const max = parseInt(text) || 30;
                                const min = preferencesAnswers.ageRange[0];

                                if (max < min) {
                                    Alert.alert("Invalid Range", "Maximum age cannot be less than minimum age.");
                                } else if (max < 18 || max > 99) {
                                    Alert.alert("Invalid Age", "Age must be between 18 and 99.");
                                } else {
                                    updateAnswer('ageRange', [min, max]);
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="30"
                        />

                    </View>
                    <Text style={styles.ageLabel}>Max: {preferencesAnswers.ageRange[1]}</Text>
                </View>
            </View>

            {/* Green Flags */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>When dating, what are green flags for you?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={preferencesAnswers.greenFlags}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('greenFlags', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="She is nice. She likes animals. She is extroverted. She likes movies. She has great smiles."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                />
            </View>

            {/* Red Flags */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>When dating, what are red flags for you?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={preferencesAnswers.redFlags}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('redFlags', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="She is very rude and doesn't care"
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                />
            </View>

            {/* Physical Attraction */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What do you find physically attractive?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={preferencesAnswers.physicalAttraction}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('physicalAttraction', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="She is tall and fit. She has big eyes and high nose bridge"
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                />
            </View>
        </View>
    );
}

// Personality Step Component
function PersonalityStep({ answers, updateAnswer }: { answers: Answers; updateAnswer: (key: string, value: any) => void }) {
    const personalityAnswers: PersonalityAnswers = {
        hobbies: answers.hobbies || '',
        aboutMe: answers.aboutMe || '',
        lifestyle: answers.lifestyle || '',
        values: answers.values || '',
        futureGoals: answers.futureGoals || '',
        perfectDate: answers.perfectDate || ''
    };

    return (
        <View style={styles.stepContainer}>
            {/* About Me */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Tell us about yourself <Text style={styles.requiredStar}>*</Text></Text>
                <Text style={styles.subtitle}>What makes you unique? Share your personality and what drives you</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.aboutMe}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('aboutMe', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="I'm someone who loves..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
                <View style={styles.characterCountContainer}>
                    <Text style={styles.characterCount}>
                        {personalityAnswers.aboutMe.length}/500 characters
                    </Text>
                    {personalityAnswers.aboutMe.length >= 10 && (
                        <View style={styles.validIndicator}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text style={styles.validText}>Looking good!</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Hobbies */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What are your interests and hobbies?</Text>
                <Text style={styles.subtitle}>What do you love doing in your free time?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.hobbies}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('hobbies', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="I'm passionate about..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
            </View>

            {/* Lifestyle */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Describe your lifestyle</Text>
                <Text style={styles.subtitle}>Are you more of a homebody or always exploring?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.lifestyle}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('lifestyle', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="My typical day involves..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
            </View>

            {/* Values */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What values are most important to you?</Text>
                <Text style={styles.subtitle}>What principles guide your life and decisions?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.values}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('values', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="The values that matter most to me are..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
            </View>

            {/* Future Goals */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What are your dreams for the future?</Text>
                <Text style={styles.subtitle}>Where do you see yourself in 5 years?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.futureGoals}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('futureGoals', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="In the future, I hope to..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
            </View>

            {/* Perfect Date */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Describe your perfect date</Text>
                <Text style={styles.subtitle}>What would make for an amazing time together?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.perfectDate}
                    onChangeText={(text: string) => {
                        if (countWords(text) <= 200) {
                            updateAnswer('perfectDate', text);
                        } else {
                            Alert.alert('Word Limit Exceeded', 'Please limit your answer to 200 words.');
                        }
                    }}
                    placeholder="My ideal date would be..."
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                    maxLength={500}
                />
            </View>
        </View>
    );
}

// @ts-ignore - 忽略样式类型检查
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    loadingText: {
        color: '#ffffff',
        fontSize: 16,
        marginTop: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    changesIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
        justifyContent: 'center',
    },
    changesText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '500',
    },
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 60,
    },
    // HOME Button Styles
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    homeButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 4,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    questionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    questionIconContainer: {
        marginBottom: 24,
    },
    questionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    questionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 32,
    },
    questionSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    answerContainer: {
        width: '100%',
    },
    stepContainer: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    unitText: {
        fontSize: 16,
        color: '#6b7280',
    },
    requiredStar: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: 'bold',
    },
    textAreaInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    optionButtonSelected: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
    },
    optionText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    optionTextSelected: {
        color: '#92400e',
        fontWeight: '600',
    },
    scaleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    scaleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scaleButtonSelected: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
    },
    scaleText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '600',
    },
    scaleTextSelected: {
        color: '#92400e',
    },
    regionContainer: {
        marginBottom: 16,
    },
    regionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    regionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    selectAllText: {
        fontSize: 14,
        color: '#667eea',
        textDecorationLine: 'underline',
    },
    areaButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    areaButton: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    areaButtonSelected: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
    },
    areaText: {
        fontSize: 14,
        color: '#6b7280',
    },
    areaTextSelected: {
        color: '#92400e',
        fontWeight: '600',
    },
    ageRangeContainer: {
        alignItems: 'center',
        gap: 8,
    },
    ageInputsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ageInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        width: 60,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    ageLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    ageSeparator: {
        fontSize: 16,
        color: '#6b7280',
    },
    characterCountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    characterCount: {
        fontSize: 12,
        color: '#9ca3af',
    },
    validIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    validText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },

    // Photos Section Styles
    photoGrid: {
        marginBottom: 20,
    },
    mainPhotoRow: {
        alignItems: 'center',
        marginBottom: 12,
    },
    photoRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    photoCard: {
        width: photoSize,
        height: photoSize,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mainPhotoCard: {
        width: photoSize * 1.2,
        height: photoSize * 1.2,
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainPhotoLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: '#667eea',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    mainPhotoText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
        textAlign: 'center',
    },
    uploadingContainer: {
        alignItems: 'center',
    },
    uploadingSpinner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#c7d2fe',
        borderTopColor: '#667eea',
        marginBottom: 8,
        backgroundColor: 'transparent',
    },
    uploadingText: {
        color: '#667eea',
        fontSize: 12,
        fontWeight: '500',
    },
    tipsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    tipText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 8,
    },

    // Bottom Actions
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingVertical: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    nextButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});