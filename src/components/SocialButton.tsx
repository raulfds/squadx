import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SocialButtonProps {
    provider: 'google' | 'discord' | 'twitch';
    onPress: () => void;
    isLoading?: boolean;
}

export const SocialButton = ({ provider, onPress, isLoading }: SocialButtonProps) => {
    const getStyles = () => {
        switch (provider) {
            case 'google':
                return {
                    backgroundColor: '#FFFFFF',
                    label: 'Continuar com Google',
                    icon: 'logo-google',
                    textColor: '#000000',
                    iconColor: '#DB4437'
                };
            case 'discord':
                return {
                    backgroundColor: '#5865F2',
                    label: 'Continuar com Discord',
                    icon: 'logo-discord',
                    textColor: '#FFFFFF',
                    iconColor: '#FFFFFF'
                };
            case 'twitch':
                return {
                    backgroundColor: '#9146FF',
                    label: 'Continuar com Twitch',
                    icon: 'logo-twitch',
                    textColor: '#FFFFFF',
                    iconColor: '#FFFFFF'
                };
        }
    };

    const { backgroundColor, label, icon, textColor, iconColor } = getStyles();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor, opacity: isLoading ? 0.7 : 1 }]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.9}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={24} color={iconColor} />
            </View>
            <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)' // Subtle border for dark backgrounds if needed
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
});
