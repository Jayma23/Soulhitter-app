// NotificationService.ts - 避免TypeScript类型错误的版本

import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 使用any类型避免类型错误
export class NotificationService {
    // 初始化通知服务
    static initialize() {
        try {
            // 使用类型断言避免TypeScript错误
            (Notifications as any).setNotificationHandler({
                handleNotification: async () => {
                    // 检查免打扰设置
                    const doNotDisturb = await NotificationService.isDoNotDisturbEnabled();

                    return {
                        shouldShowAlert: !doNotDisturb,
                        shouldPlaySound: !doNotDisturb,
                        shouldSetBadge: false,
                    };
                },
            });

            console.log('NotificationService initialized successfully');
        } catch (error) {
            console.error('Error initializing NotificationService:', error);
        }
    }

    // 检查免打扰是否开启
    static async isDoNotDisturbEnabled(): Promise<boolean> {
        try {
            const doNotDisturb = await SecureStore.getItemAsync('doNotDisturb');
            return doNotDisturb ? JSON.parse(doNotDisturb) : false;
        } catch (error) {
            console.error('Error checking Do Not Disturb setting:', error);
            return false;
        }
    }

    // 设置免打扰状态
    static async setDoNotDisturb(enabled: boolean): Promise<void> {
        try {
            await SecureStore.setItemAsync('doNotDisturb', JSON.stringify(enabled));
            console.log(`Do Not Disturb ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error setting Do Not Disturb:', error);
        }
    }

    // 发送新消息通知
    static async sendMessageNotification(senderName: string, message: string, chatId?: string): Promise<void> {
        try {
            // 检查免打扰设置
            const isDoNotDisturb = await this.isDoNotDisturbEnabled();

            if (isDoNotDisturb) {
                console.log('Do Not Disturb is enabled, skipping notification');
                return;
            }

            // 发送通知
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `💕 New message from ${senderName}`,
                    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
                    sound: true,
                    data: {
                        type: 'message',
                        chatId: chatId || '',
                        senderName: senderName,
                    } as any,
                },
                trigger: null,
            });

            console.log('Message notification sent successfully');
        } catch (error) {
            console.error('Error sending message notification:', error);
        }
    }

    // 发送新匹配通知
    static async sendMatchNotification(matchName: string, matchPhoto?: string): Promise<void> {
        try {
            const isDoNotDisturb = await this.isDoNotDisturbEnabled();

            if (isDoNotDisturb) {
                console.log('Do Not Disturb is enabled, skipping match notification');
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎉 It\'s a Match!',
                    body: `You and ${matchName} liked each other!`,
                    sound: true,
                    data: {
                        type: 'match',
                        matchName: matchName,
                        matchPhoto: matchPhoto || '',
                    } as any,
                },
                trigger: null,
            });

            console.log('Match notification sent successfully');
        } catch (error) {
            console.error('Error sending match notification:', error);
        }
    }

    // 请求通知权限
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Notifications.requestPermissionsAsync();

            if (status === 'granted') {
                console.log('Notification permissions granted');
                return true;
            } else {
                console.log('Notification permissions denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    // 获取推送token
    static async getPushToken(): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                console.log('Push tokens not supported on web');
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync();
            const token = (tokenData as any).data;
            console.log('Push token obtained:', token);
            return token;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    // 设置通知点击处理
    static setupNotificationClickHandler(navigation: any) {
        try {
            // 应用在前台时收到通知
            const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
                console.log('Notification received:', notification);
            });

            // 用户点击通知时
            const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
                try {
                    const data = response?.notification?.request?.content?.data;

                    if (data?.type === 'message' && data?.chatId && navigation) {
                        navigation.navigate('ChatRoom', {
                            chatId: data.chatId,
                            partner: { name: data.senderName }
                        });
                    } else if (data?.type === 'match' && navigation) {
                        navigation.navigate('Matches');
                    }
                } catch (error) {
                    console.error('Error handling notification click:', error);
                }
            });

            // 返回清理函数
            return () => {
                try {
                    Notifications.removeNotificationSubscription(notificationListener);
                    Notifications.removeNotificationSubscription(responseListener);
                } catch (error) {
                    console.error('Error cleaning up notification listeners:', error);
                }
            };
        } catch (error) {
            console.error('Error setting up notification click handler:', error);
            return () => {}; // 返回空函数
        }
    }

    // 清除所有通知
    static async clearAllNotifications(): Promise<void> {
        try {
            await Notifications.dismissAllNotificationsAsync();
            console.log('All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    // 获取免打扰状态用于UI显示
    static async getDoNotDisturbStatus(): Promise<{ enabled: boolean; message: string }> {
        try {
            const enabled = await this.isDoNotDisturbEnabled();

            return {
                enabled,
                message: enabled
                    ? '🌙 Do Not Disturb is ON - You won\'t receive notifications'
                    : '🔔 Notifications are ON'
            };
        } catch (error) {
            console.error('Error getting Do Not Disturb status:', error);
            return {
                enabled: false,
                message: '🔔 Notifications are ON'
            };
        }
    }

    // 完整的初始化方法，包含权限请求
    static async initializeWithPermissions(): Promise<boolean> {
        try {
            // 请求权限
            const hasPermissions = await this.requestPermissions();

            if (!hasPermissions) {
                console.log('Notification permissions not granted');
                return false;
            }

            // 初始化处理器
            this.initialize();

            // 获取推送token
            await this.getPushToken();

            console.log('NotificationService fully initialized');
            return true;
        } catch (error) {
            console.error('Error during full initialization:', error);
            return false;
        }
    }
}

export default NotificationService;