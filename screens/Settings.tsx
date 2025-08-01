import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Alert,
    Switch,
    Dimensions,
    Linking,
    Share,
    Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// 导入通知服务 - 根据你的文件路径调整
// import NotificationService from '../services/NotificationService';


const { width, height } = Dimensions.get('window');

export default function Settings() {
    const navigation = useNavigation<any>();

    // Settings state
    const [doNotDisturb, setDoNotDisturb] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // 隐藏默认的导航头部
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => {
        loadSettings();

        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const loadSettings = async () => {
        try {
            const savedDoNotDisturb = await SecureStore.getItemAsync('doNotDisturb');
            if (savedDoNotDisturb !== null) {
                setDoNotDisturb(JSON.parse(savedDoNotDisturb));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSetting = async (key: string, value: boolean) => {
        try {
            await SecureStore.setItemAsync(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving setting:', error);
        }
    };

    // 使用简化的免打扰管理，避免导入NotificationService时的类型错误
    const handleDoNotDisturbToggle = async (value: boolean) => {
        try {
            setDoNotDisturb(value);
            await SecureStore.setItemAsync('doNotDisturb', JSON.stringify(value));
            console.log(`Do Not Disturb ${value ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error saving Do Not Disturb setting:', error);
            // 如果保存失败，恢复之前的状态
            setDoNotDisturb(!value);
        }
    };

    // 页面获得焦点时重新加载设置
    useFocusEffect(
        React.useCallback(() => {
            loadSettings();
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await SecureStore.deleteItemAsync('user_id');
                            await SecureStore.deleteItemAsync('token');
                            await SecureStore.deleteItemAsync('name1');
                            await SecureStore.deleteItemAsync('photo');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (err) {
                            console.error('Logout failed:', err);
                            Alert.alert('Error', 'Could not logout');
                        }
                    }
                }
            ]
        );
    };

    const handleShareApp = async () => {
        try {
            const result = await Share.share({
                message: 'Check out this amazing dating app! Download it now: https://yourapp.com/download',
                title: 'Join me on this amazing dating app!',
            });
        } catch (error) {
            console.error('Error sharing app:', error);
            Alert.alert('Error', 'Could not share the app');
        }
    };

    const handleContactSupport = () => {
        Alert.alert(
            'Contact Support',
            'Choose how you\'d like to contact us:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Email',
                    onPress: async () => {
                        const userId = await SecureStore.getItemAsync('user_id');
                        const userName = await SecureStore.getItemAsync('name1');

                        const emailBody = `User ID: ${userId}\nUser Name: ${userName}\nDevice: ${Platform.OS}\nApp Version: 1.0.0\n\nDescription of issue:\n[Please describe your issue here]`;

                        const emailUrl = `mailto:support@lovedateapp.com?subject=Support Request - Dating App&body=${encodeURIComponent(emailBody)}`;

                        try {
                            await Linking.openURL(emailUrl);
                        } catch (error) {
                            Alert.alert('Error', 'Could not open email client. Please email us at: support@lovedateapp.com');
                        }
                    }
                },
                {
                    text: 'WhatsApp',
                    onPress: async () => {
                        const userName = await SecureStore.getItemAsync('name1') || 'User';
                        const message = `Hi! I'm ${userName} and I need help with the dating app.`;
                        const whatsappUrl = `https://wa.me/12345678900?text=${encodeURIComponent(message)}`;

                        try {
                            await Linking.openURL(whatsappUrl);
                        } catch (error) {
                            Alert.alert('Error', 'Could not open WhatsApp. Please contact us at: +1 (234) 567-8900');
                        }
                    }
                }
            ]
        );
    };

    const SettingsSection = ({ title, children }: any) => {
        return (
            <Animated.View
                style={[
                    styles.settingsSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.sectionContent}>
                    {children}
                </View>
            </Animated.View>
        );
    };

    const SettingsItem = ({
                              iconName,
                              title,
                              subtitle,
                              hasSwitch = false,
                              switchValue = false,
                              onSwitchChange,
                              onPress,
                              gradientColors = ['#667eea', '#764ba2'],
                              uniqueKey = '',
                              isDestructive = false
                          }: any) => {
        const itemScale = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(itemScale, {
                toValue: 0.98,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(itemScale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        const handleSwitchChange = (value: boolean) => {
            if (onSwitchChange) {
                onSwitchChange(value);
            }
        };

        return (
            <Animated.View
                key={uniqueKey}
                style={[styles.settingsItemContainer, { transform: [{ scale: itemScale }] }]}
            >
                <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={hasSwitch}
                    activeOpacity={1}
                >
                    <View style={styles.itemLeft}>
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.itemIcon}
                        >
                            <Ionicons name={iconName} size={20} color="#ffffff" />
                        </LinearGradient>
                        <View style={styles.itemText}>
                            <Text style={[styles.itemTitle, isDestructive && styles.destructiveTitle]}>
                                {title}
                            </Text>
                            {subtitle && (
                                <Text style={styles.itemSubtitle}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.itemRight}>
                        {hasSwitch ? (
                            <Switch
                                key={`switch-${uniqueKey}`}
                                value={switchValue}
                                onValueChange={handleSwitchChange}
                                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                                thumbColor={switchValue ? '#ffffff' : '#f3f4f6'}
                                testID={`switch-${uniqueKey}`}
                            />
                        ) : (
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#6b7280"
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </Animated.View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Notifications Section */}
                <SettingsSection title="Notifications">
                    <SettingsItem
                        uniqueKey="do-not-disturb"
                        iconName="moon"
                        title="Do Not Disturb"
                        subtitle="Turn off message notifications"
                        hasSwitch={true}
                        switchValue={doNotDisturb}
                        onSwitchChange={handleDoNotDisturbToggle}
                        gradientColors={['#6366f1', '#8b5cf6']}
                    />
                </SettingsSection>

                {/* Share & Support Section */}
                <SettingsSection title="Share & Support">
                    <SettingsItem
                        uniqueKey="share-app"
                        iconName="share-social"
                        title="Share App"
                        subtitle="Invite friends to join"
                        onPress={handleShareApp}
                        gradientColors={['#10b981', '#059669']}
                    />
                    <SettingsItem
                        uniqueKey="contact-support"
                        iconName="headset"
                        title="Contact Support"
                        subtitle="Get help from our team"
                        onPress={handleContactSupport}
                        gradientColors={['#3b82f6', '#1d4ed8']}
                    />
                </SettingsSection>

                {/* Account Section */}
                <SettingsSection title="Account">
                    <SettingsItem
                        uniqueKey="logout"
                        iconName="log-out"
                        title="Logout"
                        subtitle="Sign out of your account"
                        onPress={handleLogout}
                        gradientColors={['#ef4444', '#dc2626']}
                        isDestructive={true}
                    />
                </SettingsSection>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    settingsSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        marginLeft: 4,
    },
    sectionContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingsItemContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemText: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    destructiveTitle: {
        color: '#ef4444',
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 18,
    },
    itemRight: {
        marginLeft: 16,
    },
    bottomSpacing: {
        height: 40,
    },
});