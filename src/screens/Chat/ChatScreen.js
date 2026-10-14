import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const BASE_URL = api.defaults.baseURL?.replace('/api', '') || '';

const STUDENT_SUGGESTIONS = [
  'Show my attendance',
  'Download my attendance PDF',
  'What assignments are pending?',
  'Show my results & CGPA',
  'Show my timetable',
  'Any new announcements?',
  'Show my notes',
  'What Compufest events are coming?',
];

const ADMIN_SUGGESTIONS = [
  'List all controllers',
  'Show all routes in server.js',
  'Show all users in the DB',
  'Show all DB tables and columns',
  'Read attendanceController.js',
  'Check for any DB issues',
  'Fix a bug in a controller',
  'Run a query to inspect data',
];

export default function ChatScreen() {
  const c = useTheme();
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  const SUGGESTIONS = isAdmin ? ADMIN_SUGGESTIONS : STUDENT_SUGGESTIONS;

  const greeting = isAdmin
    ? `Hi ${user?.name?.split(' ')[0] || 'Admin'}! 🛠️ I'm your YCCE developer assistant.\n\nI can read and fix backend files, run DB queries, inspect routes, and diagnose issues — just describe the problem.`
    : `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your YCCE CT assistant.\n\nI can fetch your live attendance, assignments, timetable, and even generate a PDF report — just ask!`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    scrollToBottom();

    try {
      const apiMessages = updated
        .filter(m => m.role !== 'assistant' || updated.indexOf(m) > 0)
        .map(m => ({ role: m.role, content: m.content }));

      const endpoint = isAdmin ? '/chat/admin' : '/chat';
      const { data } = await api.post(endpoint, { messages: apiMessages });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, pdf_url: data.pdf_url || null },
      ]);
    } catch (e) {
      const msg = e.response?.data?.error?.includes('Credits depleted')
        ? 'AI Chat is temporarily unavailable — credits depleted. Please try again later.'
        : 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const openPdf = (pdfPath) => {
    const fullUrl = `${BASE_URL}${pdfPath}`;
    Linking.openURL(fullUrl).catch(() =>
      alert('Could not open PDF. Try again.')
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        marginBottom: 12,
        marginHorizontal: 16,
      }}>
        {!isUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
            <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: c.text, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: c.bg, fontSize: 10, fontWeight: '700' }}>CT</Text>
            </View>
            <Text style={{ fontSize: 10, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Assistant</Text>
          </View>
        )}

        <View style={{
          backgroundColor: isUser ? c.text : c.card,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          padding: 12,
          borderWidth: isUser ? 0 : 0.5,
          borderColor: c.border,
        }}>
          <Text style={{ fontSize: 14, color: isUser ? c.bg : c.text, lineHeight: 21, fontWeight: '300' }}>
            {item.content}
          </Text>

          {/* PDF download button */}
          {item.pdf_url && (
            <TouchableOpacity
              onPress={() => openPdf(item.pdf_url)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                marginTop: 10, backgroundColor: c.bg,
                borderRadius: 10, padding: 10,
                borderWidth: 1, borderColor: c.border,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={18} color="#1a73e8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1a73e8' }}>Attendance Report.pdf</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>Tap to open</Text>
              </View>
              <Ionicons name="download-outline" size={18} color="#1a73e8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
              <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: c.text, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: c.bg, fontSize: 10, fontWeight: '700' }}>CT</Text>
              </View>
              <View style={{ backgroundColor: c.card, borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, borderWidth: 0.5, borderColor: c.border }}>
                <ActivityIndicator size="small" color={c.textMuted} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestions — only at start */}
      {messages.length === 1 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 10, color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Try asking</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={{ backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: c.border }}
                onPress={() => send(s)}
              >
                <Text style={{ fontSize: 12, color: c.textSec, fontWeight: '400' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 0.5, borderTopColor: c.border,
        backgroundColor: c.card,
      }}>
        <TextInput
          style={{
            flex: 1, backgroundColor: c.cardAlt, borderRadius: 22,
            paddingHorizontal: 16, paddingVertical: 10,
            fontSize: 14, color: c.text, maxHeight: 100,
            borderWidth: 0.5, borderColor: c.border, fontWeight: '300',
          }}
          placeholder="Ask anything..."
          placeholderTextColor={c.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: input.trim() ? c.text : c.card,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 0.5, borderColor: c.border,
          }}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="arrow-up" size={18} color={input.trim() ? c.bg : c.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
