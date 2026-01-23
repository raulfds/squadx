import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // This route is hit when the auth provider redirects back to the app.
        // The WebBrowser.openAuthSessionAsync in login.tsx should handle the session logic.
        // We just need to ensure this route exists so Expo Router doesn't show a 404,
        // and potentially redirect the user if they got stuck here.

        // In a typical flow, openAuthSessionAsync resolves and the user stays on the Login screen logic,
        // which then redirects them. But if the app was closed or deep link handling took over completely,
        // we might land here.

        // For now, let's just attempt to go back or to root, assuming auth state listener will restart flow.
        // Or simply showing a "Verifying..." state is fine while the listener in _layout or login handles it.

        const timeout = setTimeout(() => {
            router.replace('/');
        }, 1000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator size="large" color="#ff005c" />
            <Text style={{ color: '#fff', marginTop: 20 }}>Autenticando...</Text>
        </View>
    );
}
