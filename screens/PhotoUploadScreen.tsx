import React, { useState, useRef, useEffect } from 'react';
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
    KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Question {
    id: string;
    question: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
}

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

const QUESTIONS: Question[] = [
    {
        id: 'about_me',
        question: 'Tell us about yourself',
        subtitle: 'What makes you unique? Share your personality and what drives you',
        icon: 'person',
        placeholder: 'I\'m someone who loves...'
    },
    {
        id: 'interests',
        question: 'What are your interests and hobbies?',
        subtitle: 'What do you love doing in your free time?',
        icon: 'heart',
        placeholder: 'I\'m passionate about...'
    },
    {
        id: 'lifestyle',
        question: 'Describe your lifestyle',
        subtitle: 'Are you more of a homebody or always exploring?',
        icon: 'sunny',
        placeholder: 'My typical day involves...'
    },
    {
        id: 'ideal_partner',
        question: 'What are you looking for in a partner?',
        subtitle: 'Describe the qualities that matter most to you',
        icon: 'heart-circle',
        placeholder: 'I\'m looking for someone who...'
    },
    {
        id: 'relationship_goals',
        question: 'What are your relationship goals?',
        subtitle: 'What kind of relationship are you hoping to build?',
        icon: 'infinite',
        placeholder: 'I want to find...'
    },
    {
        id: 'values',
        question: 'What values are most important to you?',
        subtitle: 'What principles guide your life and decisions?',
        icon: 'star',
        placeholder: 'The values that matter most to me are...'
    },
    {
        id: 'perfect_date',
        question: 'Describe your perfect date',
        subtitle: 'What would make for an amazing time together?',
        icon: 'wine',
        placeholder: 'My ideal date would be...'
    },
    {
        id: 'future_dreams',
        question: 'What are your dreams for the future?',
        subtitle: 'Where do you see yourself in 5 years?',
        icon: 'rocket',
        placeholder: 'In the future, I hope to...'
    }
];

export default function AIMatchingQuestionnaire() {
    const navigation = useNavigation<any>();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    const totalSteps = 3;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    // 隐藏默认的导航头部
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => {
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
    }, [currentStep, fadeAnim, slideAnim, scaleAnim]);

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

    const handleGoToHome = () => {
        if (Object.keys(answers).length > 0) {
            Alert.alert(
                'Leave Questionnaire',
                'You haven\'t completed the questionnaire yet. Are you sure you want to return to the main menu? Your answers will be lost.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        onPress: () => navigation.navigate('Home')
                    }
                ]
            );
        } else {
            navigation.navigate('Home');
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
            submitAnswers();
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

    const submitAnswers = async () => {
        setIsSubmitting(true);

        try {
            const userId = await SecureStore.getItemAsync('user_id');
            if (!userId) {
                Alert.alert('Error', 'User not found. Please login again.');
                return;
            }

            // 准备发送给AI的数据
            const aiMatchingData = {
                user_id: userId,
                questionnaire_answers: answers,
                completed_at: new Date().toISOString(),
                total_words: Object.values(answers).join(' ').split(' ').length
            };

            console.log('Submitting AI matching data:', aiMatchingData);

            // 发送到后端进行AI分析
            const response = await fetch('https://ccbackendx-2.onrender.com/chat/analyze-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aiMatchingData)
            });
            const saveResponse = await fetch('https://ccbackendx-2.onrender.com/chat/save-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aiMatchingData)
            });

            const result = await response.json();
            const save = await saveResponse.json();

            if (saveResponse.ok) {
                Alert.alert(
                    'Profile Complete! 🎉',
                    'Your AI matching profile is ready! We\'ll use this to find your perfect matches.',
                    [
                        {
                            text: 'Start Matching',
                            onPress: () => navigation.navigate('Home')
                        }
                    ]
                );
            } else {
                console.error('Failed to submit profile:', result);
                console.error('Failed to submit profile:', save);
                Alert.alert('Error', 'Failed to save your profile. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting questionnaire:', error);
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepTitles = [
        'Tell us about yourself',
        'Tell us about your type',
        'Your personality'
    ];

    const stepSubtitles = [
        'Basic information',
        'Dating preferences',
        'What makes you unique'
    ];

    const stepIcons: (keyof typeof Ionicons.glyphMap)[] = ['person', 'heart', 'star'];

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return <BasicInfoStep answers={answers} updateAnswer={handleAnswer} />;
            case 1:
                return <PreferencesStep answers={answers} updateAnswer={handleAnswer} />;
            case 2:
                return <PersonalityStep answers={answers} updateAnswer={handleAnswer} />;
            default:
                return null;
        }
    };

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
                            navigation.goBack();
                        }
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>AI Matching</Text>
                    <Text style={styles.headerSubtitle}>
                        Step {currentStep + 1} of {totalSteps}
                    </Text>
                </View>

                <View style={styles.rightButtons}>
                    {/* Skip按钮 */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => {
                            if (currentStep < totalSteps - 1) {
                                nextStep();
                            }
                        }}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    {/* 主菜单按钮 */}
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={handleGoToHome}
                    >
                        <Ionicons name="home" size={18} color="#ffffff" />
                        <Text style={styles.homeButtonText}>Home</Text>
                    </TouchableOpacity>
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
                    style={styles.nextButton}
                    onPress={() => {
                        if (Platform.OS === 'ios') {
                            Vibration.vibrate();
                        }

                        if (currentStep === totalSteps - 1) {
                            submitAnswers();
                        } else {
                            nextStep();
                        }
                    }}
                    disabled={isSubmitting}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f0f4ff']}
                        style={styles.nextButtonGradient}
                    >
                        {isSubmitting ? (
                            <Text style={styles.nextButtonText}>Submitting...</Text>
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>
                                    {currentStep === totalSteps - 1 ? 'Complete Profile' : 'Next Question'}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color="#667eea"
                                />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

// Step Components
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
        selectedAreas: answers.selectedAreas || []
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
                <Text style={styles.label}>What&#39;s your name?</Text>
                <TextInput
                    style={styles.textInput}
                    value={basicAnswers.name}
                    onChangeText={(text: string) => updateAnswer('name', text)}
                    placeholder="Your name"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>What&#39;s your phone number?</Text>
                <Text style={styles.subtitle}>Phone number is needed to receive important updates. It will ONLY be shared with your confirmed date.</Text>
                <TextInput
                    style={styles.textInput}
                    value={basicAnswers.phone}
                    onChangeText={(text: string) => updateAnswer('phone', text)}
                    placeholder="Phone number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                />
            </View>

            {/* Birthday */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>When is your birthday?</Text>
                <Text style={styles.subtitle}>Only your age will be shown to others</Text>
                <TextInput
                    style={styles.textInput}
                    value={basicAnswers.birthday}
                    onChangeText={(text: string) => updateAnswer('birthday', text)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                />
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

            {/* Height */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>How tall are you?</Text>
                <Text style={styles.subtitle}>e.g.: 5&#39;11&#34; or 180cm</Text>
                <View style={styles.heightContainer}>
                    <TextInput
                        style={[styles.textInput, styles.heightInput]}
                        value={basicAnswers.height}
                        onChangeText={(text: string) => updateAnswer('height', text)}
                        placeholder="180"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                    />
                    <Text style={styles.heightUnit}>cm</Text>
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
                <TextInput
                    style={styles.textInput}
                    value={basicAnswers.zipCode}
                    onChangeText={(text: string) => updateAnswer('zipCode', text)}
                    placeholder="94704"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                />
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

            {/* Green Flags */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>When dating, what are green flags for you?</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={preferencesAnswers.greenFlags}
                    onChangeText={(text: string) => updateAnswer('greenFlags', text)}
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
                    onChangeText={(text: string) => updateAnswer('redFlags', text)}
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
                    onChangeText={(text: string) => updateAnswer('physicalAttraction', text)}
                    placeholder="She is tall and fit. She has big eyes and high nose bridge"
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={4}
                />
            </View>
        </View>
    );
}

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
                <Text style={styles.label}>Tell us about yourself</Text>
                <Text style={styles.subtitle}>What makes you unique? Share your personality and what drives you</Text>
                <TextInput
                    style={styles.textAreaInput}
                    value={personalityAnswers.aboutMe}
                    onChangeText={(text: string) => updateAnswer('aboutMe', text)}
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
                    onChangeText={(text: string) => updateAnswer('hobbies', text)}
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
                    onChangeText={(text: string) => updateAnswer('lifestyle', text)}
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
                    onChangeText={(text: string) => updateAnswer('values', text)}
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
                    onChangeText={(text: string) => updateAnswer('futureGoals', text)}
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
                    onChangeText={(text: string) => updateAnswer('perfectDate', text)}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    skipButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    skipText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    homeButtonText: {
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
    textInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        borderWidth: 2,
        borderColor: '#e5e7eb',
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
    heightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heightInput: {
        flex: 1,
    },
    heightUnit: {
        fontSize: 16,
        color: '#6b7280',
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
        color: '#667eea',
    },
});