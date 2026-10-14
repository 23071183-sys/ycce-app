import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CTLogo from '../../components/CTLogo';
import YCCELogo from '../../components/YCCELogo';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const c = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setLoading(true);
    try { await login(email.trim(), password); }
    catch (err) { Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ position: 'absolute', top: 60, left: 24 }}>
        <YCCELogo size={40} />
      </View>
      <View style={{ position: 'absolute', top: 60, right: 24 }}>
        <CTLogo size={40} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '200', color: c.text, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, lineHeight: 32 }}>Yashwantrao Chavan College of Engineering</Text>
        <View style={{ alignSelf: 'center', backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 40, borderWidth: 1.5, borderColor: c.bg }}>
          <Text style={{ fontSize: 10, color: c.bg, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600' }}>Computer Technology</Text>
        </View>

        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Email</Text>
          <TextInput
            style={{ backgroundColor: c.cardAlt, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16, color: c.text, borderWidth: 0.5, borderColor: c.border }}
            placeholder="your@ycce.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={c.textMuted}
          />
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardAlt, borderRadius: 10, borderWidth: 0.5, borderColor: c.border, marginBottom: 16 }}>
            <TextInput
              style={{ flex: 1, padding: 14, fontSize: 15, color: c.text }}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={c.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ paddingHorizontal: 14 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ backgroundColor: c.text, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 }} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={c.bg} />
              : <Text style={{ color: c.bg, fontSize: 14, fontWeight: '300', letterSpacing: 1.5, textTransform: 'uppercase' }}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.navigate('Register')}>
          <Text style={{ fontSize: 13, color: c.textMuted, letterSpacing: 0.5 }}>New student? <Text style={{ color: c.text }}>Register here</Text></Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={{ fontSize: 13, color: c.textMuted, letterSpacing: 0.5 }}>Forgot password? <Text style={{ color: c.text }}>Reset it</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
