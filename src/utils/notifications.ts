import i18n from '@/src/i18n';
import { Platform } from 'react-native';

// expo-notifications diimport secara lazy (dinamis): module tersebut punya
// side-effect saat dievaluasi yang memicu warning "[expo-notifications] Listening
// to push token changes is not yet fully supported on web." di console web.
// Dengan lazy import, expo-notifications tidak pernah dimuat di platform web.
async function getNotifications() {
    return await import('expo-notifications');
}

export async function requestNotificationPermission() {
    if (Platform.OS === 'web') return false;

    const Notifications = await getNotifications();

    // Mengatur tingkah laku notifikasi saat app sedang dibuka
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
    }
    return true;
}

export async function scheduleExpiryNotification(itemName: string, daysLeft: number) {
    if (Platform.OS === 'web') return;

    // Dalam production, kita akan jadwalkan pada tanggal/jam spesifik sebelum kadaluwarsa.
    // Tapi untuk MVP Demo ini, kita jadwalkan beberapa detik/menit dari sekarang untuk melihatnya bereaksi.

    let bodyText = ``;
    if (daysLeft <= 0) {
        bodyText = i18n.t('notifications.expiredBody', { name: itemName });
    } else if (daysLeft <= 2) {
        bodyText = i18n.t('notifications.expiringBody', { name: itemName, count: daysLeft });
    } else {
        bodyText = i18n.t('notifications.freshBody', { name: itemName });
    }

    const Notifications = await getNotifications();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: i18n.t('notifications.title'),
            body: bodyText,
            sound: true,
        },
        trigger: {
            // Untuk demo, kita set trigger 5 detik dari sekarang jika user membuat item baru yang kritis.
            seconds: 5,
        } as any,
    });
}

export async function cancelAllNotifications() {
    if (Platform.OS === 'web') return;
    const Notifications = await getNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
}
