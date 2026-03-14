import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export async function requestNotificationPermission() {
    if (Platform.OS === 'web') return false;

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
        bodyText = `Peringatan: ${itemName} Anda sudah kedaluwarsa!`;
    } else if (daysLeft <= 2) {
        bodyText = `${itemName} Anda akan kedaluwarsa dalam ${daysLeft} hari. Segera Konsumsi!`;
    } else {
        bodyText = `Jangan lupa bahan ${itemName} ini masih segar untuk diolah!`;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Smart Kulkas Reminder 🥦",
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
    await Notifications.cancelAllScheduledNotificationsAsync();
}
