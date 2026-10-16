import React, { useState, useRef, useEffect } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Button, Card, SegmentedControl, Text, TextField } from '../../components/ui';
import { AuthLayout, AuthLink, OtpBoxes, PasswordField } from './AuthParts';
import api from '../../services/api';
import { space } from '../../theme';

const YEARS = ['1', '2', '3', '4'].map(y => ({ value: y, label: `Y${y}` }));

export default function RegisterScreen({ navigation }) {
  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

  if (step === 1) {
    return (
      <AuthLayout title="Create account">
        <Card>
          <TextField label="Full name" placeholder="Your full name" value={name} onChangeText={setName} />
          <TextField
            label="Email"
            placeholder="23071189@ycce.in"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Roll number"
            placeholder="e.g. 23071183"
            value={rollNumber}
            onChangeText={setRollNumber}
            keyboardType="numbers-and-punctuation"
          />
          <Text variant="label" style={styles.label}>Year</Text>
          <SegmentedControl options={YEARS} value={year} onChange={setYear} style={styles.years} />
          <PasswordField label="Password" placeholder="Choose a password" value={password} onChangeText={setPassword} />
          <Button title="Send OTP" onPress={sendOtp} loading={sending} style={styles.submit} />
        </Card>
        <AuthLink prompt="Already have an account?" action="Sign in" onPress={() => navigation.goBack()} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify email">
      <Card>
        <Text variant="callout" tone="muted" style={styles.center}>OTP sent to</Text>
        <Text variant="body" style={[styles.center, styles.sentTo]}>{email}</Text>
        <OtpBoxes otp={otp} inputRefs={otpRefs} onChangeDigit={handleOtpChange} />
        <Button title="Verify & register" onPress={verifyAndRegister} loading={verifying} />
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
      <AuthLink icon="arrow-back" action="Back to details" onPress={() => setStep(1)} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space.xs + 2 },
  years: { marginBottom: space.md },
  submit: { marginTop: space.sm },
  center: { textAlign: 'center' },
  sentTo: { marginTop: space.xs, marginBottom: space.xxl },
  resend: { alignItems: 'center', paddingTop: space.md },
});
