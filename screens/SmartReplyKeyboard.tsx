import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SmartReplyKeyboardProps {
    onSendMessage: (message: string) => void;
    placeholder?: string;
    disabled?: boolean;
    userId: number | null;            // ✅ 当前用户
    partnerUserId: number | null;     // ✅ 对方用户
}

const SmartReplyKeyboard: React.FC<SmartReplyKeyboardProps> = ({
                                                                   onSendMessage,
                                                                   placeholder = "Type your message...",
                                                                   disabled = false,
                                                                   userId,
                                                                   partnerUserId
                                                               }) => {
    const [text, setText] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [contextInput, setContextInput] = useState('');

    const fetchSuggestions = async (context: string) => {
        if (!context.trim()) {
            Alert.alert('Error', 'Context cannot be empty');
            return;
        }

        console.log('🚀 Fetching suggestions for:', context);
        setIsLoadingSuggestions(true);

        try {
            const response = await fetch('https://ccbackendx-2.onrender.com/ai/suggest-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context,
                    userId: userId,           // 👈 你要从 props 传入
                    partnerUserId: partnerUserId     // 👈 你要从 props 传入
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch suggestions');

            const data = await response.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
        } catch (err) {
            console.error('❌ Error fetching suggestions:', err);
            Alert.alert('Error', 'Failed to fetch smart replies');
        } finally {
            setIsLoadingSuggestions(false);
            setShowModal(false);
            setContextInput('');
        }
    };


    const handleSendMessage = () => {
        if (!text.trim() || disabled) return;
        onSendMessage(text.trim());
        setText('');
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const useSuggestion = (suggestion: string) => {
        setText(suggestion);
        setShowSuggestions(false);
    };

    return (
        <View style={styles.container}>
            {/* 🚀 Suggestion Panel - 只在真正需要时才渲染 */}
            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.suggestionsScroll}
                        showsHorizontalScrollIndicator={false}
                    >
                        {isLoadingSuggestions ? (
                            <ActivityIndicator size="small" color="#667eea" />
                        ) : suggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionChip}
                                onPress={() => useSuggestion(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 🚀 Input Bar */}
            <View style={styles.inputBar}>
                {/* 📋 Context Paste */}
                <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={styles.smartButton}
                >
                    <Ionicons name="document-text-outline" size={20} color="#667eea" />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                />

                {text.trim() && (
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        style={styles.sendButton}
                        disabled={disabled}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.sendButtonGradient}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            {/* 🚀 Modal for Context Input */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Paste conversation context</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={contextInput}
                            onChangeText={setContextInput}
                            placeholder="Paste the conversation here..."
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => fetchSuggestions(contextInput)}>
                                <Text style={styles.generateText}>Generate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        // 关键修复：确保容器不占用多余空间
        minHeight: 'auto',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        margin: 12,
        marginTop: 8, // 减少顶部间距
    },
    smartButton: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        marginRight: 6
    },
    input: {
        flex: 1,
        maxHeight: 100,
        minHeight: 36,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    sendButton: { marginLeft: 6, borderRadius: 18, overflow: 'hidden' },
    sendButtonGradient: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    suggestionsContainer: {
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 8,
        // 关键：确保容器高度自适应
        minHeight: 50,
        maxHeight: 60,
    },
    suggestionsScroll: {
        paddingHorizontal: 12,
        alignItems: 'center',
        flexGrow: 1,
    },
    suggestionChip: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 34, // 固定高度
        justifyContent: 'center',
    },
    suggestionText: { fontSize: 14, color: '#374151' },
    modalBackdrop: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContainer: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    modalInput: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        textAlignVertical: 'top',
        marginBottom: 12
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    cancelText: { color: '#ef4444', fontWeight: 'bold' },
    generateText: { color: '#3b82f6', fontWeight: 'bold' }
});

export default SmartReplyKeyboard;