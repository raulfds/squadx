import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface SocialButtonProps {
    provider: 'google' | 'discord' | 'twitch';
    onPress: () => void;
    isLoading?: boolean;
}

export const SocialButton = ({ provider, onPress, isLoading }: SocialButtonProps) => {
    const getStyles = () => {
        switch (provider) {
            case 'google':
                return { backgroundColor: '#DB4437', label: 'Entrar com Google', icon: 'chrome' };
            case 'discord':
                return { backgroundColor: '#5865F2', label: 'Entrar com Discord', icon: 'gamepad-2' };
            case 'twitch':
                return { backgroundColor: '#9146FF', label: 'Entrar com Twitch', icon: 'twitch' };
        }
    };

    const { backgroundColor, label } = getStyles();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor, opacity: isLoading ? 0.7 : 1 }]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.8}
        >
            <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 56,
        borderRadius: theme.spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
});
