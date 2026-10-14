import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CTLogo from '../../components/CTLogo';
import YCCELogo from '../../components/YCCELogo';
import api from '../../services/api';

const YEARS = ['1', '2', '3', '4'];

export default function RegisterScreen({ navigation }) {
  const c = useTheme();
  const { login: authLogin } = useAuth();

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
    if (!name || !email || !rollNumber || !year || !password)
      return Alert.alert('Error', 'All fields are required');
    if (!/^[a-zA-Z0-9]+@ycce\.in$/.test(email))
      return Alert.alert('Invalid Email', 'Only college emails are allowed.\nFormat: 23071189@ycce.in');
    if (email.split('@')[0].toLowerCase() !== rollNumber.toLowerCase())
      return Alert.alert('Email Mismatch', 'Your email must match your roll number.\nExample: 23071189@ycce.in');
    setSending(true);
    try {
      await api.post('/auth/send-otp', { email, name, roll_number: rollNumber });
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

  const verifyAndRegister = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) return Alert.alert('Error', 'Enter the complete 6-digit OTP');
    setVerifying(true);
    try {
      const { data } = await api.post('/auth/verify-register', {
        name, email, password, year: parseInt(year), roll_number: rollNumber, otp: otpStr,
      });
      Alert.alert('Success!', `Welcome, ${data.user.name}! Your account is ready.`, [
        { text: 'Continue', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
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
            <Text style={{ fontSize: 20, fontWeight: '200', color: c.text, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6, lineHeight: 30 }}>Create Account</Text>
            <View style={{ alignSelf: 'center', backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 32, borderWidth: 1.5, borderColor: c.bg }}>
              <Text style={{ fontSize: 10, color: c.bg, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600' }}>Computer Technology</Text>
            </View>

            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Full Name</Text>
              <TextInput style={inputStyle} placeholder="Your full name" placeholderTextColor={c.textMuted} value={name} onChangeText={setName} />

              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Email</Text>
              <TextInput style={inputStyle} placeholder="23071189@ycce.in" placeholderTextColor={c.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Roll Number</Text>
              <TextInput style={inputStyle} placeholder="e.g. 23071183" placeholderTextColor={c.textMuted} value={rollNumber} onChangeText={setRollNumber} keyboardType="numbers-and-punctuation" />

              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Year</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {YEARS.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: year === y ? c.text : c.cardAlt, borderWidth: 0.5, borderColor: c.border }}
                    onPress={() => setYear(y)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '400', color: year === y ? c.bg : c.textSec }}>Y{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardAlt, borderRadius: 10, borderWidth: 0.5, borderColor: c.border, marginBottom: 20 }}>
                <TextInput
                  style={{ flex: 1, padding: 14, fontSize: 15, color: c.text }}
                  placeholder="Choose a password"
                  placeholderTextColor={c.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ paddingHorizontal: 14 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: c.text, borderRadius: 12, padding: 16, alignItems: 'center' }}
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
              <Text style={{ fontSize: 13, color: c.textMuted }}>Already have an account? <Text style={{ color: c.text }}>Sign In</Text></Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 20, fontWeight: '200', color: c.text, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Verify Email</Text>
            <View style={{ alignSelf: 'center', backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 32, borderWidth: 1.5, borderColor: c.bg }}>
              <Text style={{ fontSize: 10, color: c.bg, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '600' }}>Computer Technology</Text>
            </View>

            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center', fontWeight: '300', marginBottom: 6 }}>OTP sent to</Text>
              <Text style={{ fontSize: 14, color: c.text, textAlign: 'center', fontWeight: '400', marginBottom: 28, letterSpacing: 0.3 }}>{email}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
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

              <TouchableOpacity
                style={{ backgroundColor: c.text, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
                onPress={verifyAndRegister}
                disabled={verifying}
              >
                {verifying
                  ? <ActivityIndicator color={c.bg} />
                  : <Text style={{ color: c.bg, fontSize: 14, fontWeight: '300', letterSpacing: 1.5, textTransform: 'uppercase' }}>Verify & Register</Text>
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
              <Text style={{ fontSize: 13, color: c.textMuted }}>← Back to details</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
