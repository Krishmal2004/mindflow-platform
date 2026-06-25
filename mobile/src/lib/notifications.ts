import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './apiClient';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Requests notification permission and registers this device's Expo push token with the
 * backend so the 8 AM greeting / 7 PM pending-task reminder jobs can reach it. No-ops quietly
 * on failure (e.g. permission denied, or no EAS project configured) — reminders are a nice-to-have,
 * not something that should block app usage.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.DEFAULT,
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        if (!token) return;

        await apiFetch('/api/notifications/register-token', {
            method: 'POST',
            body: JSON.stringify({ token, platform: Platform.OS }),
        });
    } catch (error) {
        console.log('Push notification registration skipped:', error);
    }
}
