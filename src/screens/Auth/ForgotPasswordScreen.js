import React, { useState, useRef, useEffect } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Button, Card, Text, TextField } from '../../components/ui';
import { AuthLayout, AuthLink, OtpBoxes, PasswordField } from './AuthParts';
import api from '../../services/api';
import { space } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const otpRefs = useRef([]);

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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

  if (step === 1) {
    return (
      <AuthLayout title="Reset password">
        <Card>
          <Text variant="callout" tone="secondary" style={styles.intro}>
            Enter your registered email and we'll send you an OTP to reset your password.
          </Text>
          <TextField
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button title="Send OTP" onPress={sendOtp} loading={sending} style={styles.submit} />
        </Card>
        <AuthLink icon="arrow-back" action="Back to sign in" onPress={() => navigation.goBack()} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="New password">
      <Card>
        <Text variant="callout" tone="muted" style={styles.center}>OTP sent to</Text>
        <Text variant="body" style={[styles.center, styles.sentTo]}>{email}</Text>
        <OtpBoxes otp={otp} inputRefs={otpRefs} onChangeDigit={handleOtpChange} />
        <PasswordField
          label="New password"
          placeholder="Choose a new password"
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Button title="Reset password" onPress={resetPassword} loading={resetting} style={styles.submit} />
        <Pressable
          style={styles.resend}
          onPress={resendTimer === 0 ? sendOtp : undefined}
          disabled={resendTimer > 0 || sending}
        >
          <Text variant="callout" tone={resendTimer > 0 ? 'muted' : 'accent'}>
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </Pressable>
      </Card>
      <AuthLink icon="arrow-back" action="Back to email" onPress={() => setStep(1)} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: space.lg },
  submit: { marginTop: space.sm },
  center: { textAlign: 'center' },
  sentTo: { marginTop: space.xs, marginBottom: space.xxl },
  resend: { alignItems: 'center', paddingTop: space.md },
});
