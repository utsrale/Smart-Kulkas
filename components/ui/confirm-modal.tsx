import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export function ConfirmModal({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Hapus',
    cancelText = 'Batal',
    type = 'danger'
}: ConfirmModalProps) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.overlay} onPress={onCancel}>
                <Pressable style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: type === 'danger' ? '#fee2e2' : '#e0f2fe' }]}>
                        <IconSymbol
                            name={type === 'danger' ? "trash.fill" : "exclamationmark.circle.fill"}
                            size={28}
                            color={type === 'danger' ? "#ef4444" : "#0ea5e9"}
                        />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelBtnText}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: type === 'danger' ? '#ef4444' : '#13ec6d' }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmBtnText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
