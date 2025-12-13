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
        primary: '#FF0054', // Hot Pink from Logo Glasses/Text
        secondary: '#FFD1DC', // Light Pink for accents
        background: '#FFF8F4', // Light Cream background (Seashell/Linen tone)
        surface: '#FFFFFF', // White cards
        text: '#2D1B22', // Dark brownish/black text for softness
        textSecondary: '#8A7A80',
        border: '#EAD1DC',
        success: '#00C851',
        error: '#ff4444',
        warning: '#ffbb33',

        // Navigation Defaults
        tint: '#FF0054', // Using primary for tint
        tabIconDefault: '#8A7A80', // Using textSecondary for default tab icon
        tabIconSelected: '#FF0054', // Using primary for selected tab icon
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
