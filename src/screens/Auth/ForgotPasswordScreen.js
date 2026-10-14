import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import CTLogo from '../../components/CTLogo';
import YCCELogo from '../../components/YCCELogo';
import api from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const c = useTheme();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef([]);

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const inputStyle = {
    backgroundColor: c.cardAlt, borderRadius: 10, padding: 14,
    fontSize: 15, color: c.text, borderWidth: 0.5, borderColor: c.border, marginBottom: 12,
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; } return t - 1; });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Email is required');
    if (!email.includes('@') || !email.includes('.'))
      return Alert.alert('Error', 'Enter a valid email address');
    setSending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      startTimer();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (val, index) => {
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
    if (!val && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const resetPassword = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) return Alert.alert('Error', 'Enter the complete 6-digit OTP');
    if (!newPassword) return Alert.alert('Error', 'Enter your new password');
    setResetting(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otpStr, newPassword });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ position: 'absolute', top: 60, left: 24 }}>
        <YCCELogo size={40} />
      </View>
      <View style={{ position: 'absolute', top: 60, right: 24 }}>
        <CTLogo size={40} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {step === 1 ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: '200', color: c.text, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6, lineHeight: 30 }}>Reset Password</Text>
            <View style={{ alignSelf: 'center', backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 32, borderWidth: 1.5, borderColor: c.bg }}>
              <Text style={{ fontSize: 10, color: c.bg, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600' }}>Computer Technology</Text>
            </View>

            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 13, color: c.textMuted, fontWeight: '300', marginBottom: 20 }}>
                Enter your registered email and we'll send you an OTP to reset your password.
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Email</Text>
              <TextInput
                style={inputStyle}
                placeholder="your@email.com"
                placeholderTextColor={c.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={{ backgroundColor: c.text, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }}
                onPress={sendOtp}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color={c.bg} />
                  : <Text style={{ color: c.bg, fontSize: 14, fontWeight: '300', letterSpacing: 1.5, textTransform: 'uppercase' }}>Send OTP</Text>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: 13, color: c.textMuted }}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 20, fontWeight: '200', color: c.text, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>New Password</Text>
            <View style={{ alignSelf: 'center', backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 32, borderWidth: 1.5, borderColor: c.bg }}>
              <Text style={{ fontSize: 10, color: c.bg, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600' }}>Computer Technology</Text>
            </View>

            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center', fontWeight: '300', marginBottom: 6 }}>OTP sent to</Text>
              <Text style={{ fontSize: 14, color: c.text, textAlign: 'center', fontWeight: '400', marginBottom: 24, letterSpacing: 0.3 }}>{email}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => otpRefs.current[i] = ref}
                    style={{
                      width: 44, height: 54, borderRadius: 10, textAlign: 'center',
                      fontSize: 22, fontWeight: '300', color: c.text,
                      backgroundColor: c.cardAlt, borderWidth: digit ? 1.5 : 0.5,
                      borderColor: digit ? c.text : c.border,
                    }}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={val => handleOtpChange(val, i)}
                  />
                ))}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>New Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardAlt, borderRadius: 10, borderWidth: 0.5, borderColor: c.border, marginBottom: 20 }}>
                <TextInput
                  style={{ flex: 1, padding: 14, fontSize: 15, color: c.text }}
                  placeholder="Choose a new password"
                  placeholderTextColor={c.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ paddingHorizontal: 14 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: c.text, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
                onPress={resetPassword}
                disabled={resetting}
              >
                {resetting
                  ? <ActivityIndicator color={c.bg} />
                  : <Text style={{ color: c.bg, fontSize: 14, fontWeight: '300', letterSpacing: 1.5, textTransform: 'uppercase' }}>Reset Password</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 12, alignItems: 'center' }}
                onPress={resendTimer === 0 ? sendOtp : undefined}
                disabled={resendTimer > 0 || sending}
              >
                <Text style={{ fontSize: 13, color: resendTimer > 0 ? c.textMuted : c.text }}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setStep(1)}>
              <Text style={{ fontSize: 13, color: c.textMuted }}>← Back to email</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
