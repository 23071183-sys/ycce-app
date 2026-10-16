import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, TextField } from '../../components/ui';
import { AuthLayout, AuthLink, PasswordField } from './AuthParts';
import { space } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setLoading(true);
    try { await login(email.trim(), password); }
    catch (err) { Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Yashwantrao Chavan College of Engineering">
      <Card>
        <TextField
          label="Email"
          placeholder="your@ycce.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PasswordField label="Password" placeholder="Password" value={password} onChangeText={setPassword} />
        <Button title="Sign in" onPress={handleLogin} loading={loading} style={styles.submit} />
      </Card>
      <AuthLink prompt="New student?" action="Register here" onPress={() => navigation.navigate('Register')} />
      <AuthLink prompt="Forgot password?" action="Reset it" onPress={() => navigation.navigate('ForgotPassword')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: space.xs },
});
