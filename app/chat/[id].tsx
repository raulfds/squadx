import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setupChat();
    }, [id]);

    const setupChat = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setCurrentUser(session.user);

        // Fetch other user details
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
        setOtherUser(profile);

        // Fetch initial messages
        fetchMessages(session.user.id);

        // Subscribe to real-time messages
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${session.user.id}`, // Filter for messages sent to me
                },
                (payload) => {
                    // Only add if it's from the current chat partner
                    if (payload.new.sender_id === id) {
                        setMessages((prev) => [...prev, payload.new]);
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const fetchMessages = async (myId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !currentUser) return;

        const content = inputText.trim();
        setInputText('');

        const newMessage = {
            sender_id: currentUser.id,
            receiver_id: id,
            content,
            created_at: new Date().toISOString(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, newMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });

        const { error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            receiver_id: id,
            content,
        });

        if (error) {
            console.error('Error sending message:', error);
            // Revert logic could go here
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{otherUser?.username || 'Chat'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id || item.created_at}
                contentContainerStyle={styles.messagesList}
                renderItem={({ item }) => {
                    const isMe = item.sender_id === currentUser?.id;
                    return (
                        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                            <Text style={styles.messageText}>{item.content}</Text>
                        </View>
                    );
                }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite uma mensagem..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Ionicons name="send" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginTop: Platform.OS === 'android' ? 30 : 0,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    messagesList: {
        padding: theme.spacing.md,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 2,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 2,
    },
    messageText: {
        color: '#FFF',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: theme.colors.text,
        marginRight: 8,
    },
    sendButton: {
        padding: 8,
    },
});
