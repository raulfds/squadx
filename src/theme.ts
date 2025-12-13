/**
 * squadx Theme
 * Dark user interface with neon accents for a "Gamer" aesthetic.
 */

const palette = {
    background: '#0D0D0D', // Almost black
    surface: '#1A1A1A',     // Dark grey
    primary: '#04D361',     // Neon Green (Matches Success/Like)
    secondary: '#8257E5',   // Purple/Violet
    text: '#FFFFFF',
    textSecondary: '#A8A8B3',
    border: '#29292E',
    error: '#E83F5B',
    success: '#04D361',
    warning: '#FFCD1E'
};

export const theme = {
    colors: {
        background: palette.background,
        surface: palette.surface,
        primary: palette.primary,
        secondary: palette.secondary,
        text: palette.text,
        textSecondary: palette.textSecondary,
        border: palette.border,
        error: palette.error,
        success: palette.success,
        warning: palette.warning,

        // Navigation Defaults
        tint: palette.primary,
        tabIconDefault: palette.textSecondary,
        tabIconSelected: palette.primary,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 20,
        xl: 30,
        round: 9999,
    },
    typography: {
        // Assumption: Using system fonts or pre-loaded Google Fonts like Inter/Roboto
        header: {
            fontSize: 24,
            fontWeight: 'bold',
        },
        body: {
            fontSize: 16,
        }
    }
};

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: palette.primary,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: palette.primary,
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: palette.primary,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: palette.primary,
    },
};
