import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Icon, Text } from '../../components/ui';
import CTLogo from '../../components/CTLogo';
import YCCELogo from '../../components/YCCELogo';
import { radius, space, type } from '../../theme';

// Shared frame for the signed-out screens: both logos on top, a title and the
// department line, then the form.
export function AuthLayout({ title, children }) {
  const c = useTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logos}>
          <YCCELogo size={40} />
          <CTLogo size={40} />
        </View>
        <View style={styles.body}>
          <Text variant="title" style={styles.center}>{title}</Text>
          <Text variant="label" style={[styles.center, styles.dept]}>Computer Technology</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// A labelled password input with a show/hide toggle.
export function PasswordField({ label, value, onChangeText, placeholder }) {
  const c = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text variant="label" style={styles.label}>{label}</Text>
      <View style={[styles.passwordRow, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <TextInput
          style={[type.body, styles.passwordInput, { color: c.text }]}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setVisible(v => !v)}
          hitSlop={8}
          style={styles.eye}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} tone="muted" />
        </Pressable>
      </View>
    </View>
  );
}

// Six single-digit boxes. The parent owns the digits and focus movement.
export function OtpBoxes({ otp, inputRefs, onChangeDigit }) {
  const c = useTheme();
  return (
    <View style={styles.otpRow}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={ref => { inputRefs.current[i] = ref; }}
          style={[
            styles.otpBox,
            {
              color: c.text,
              backgroundColor: c.surfaceAlt,
              borderColor: digit ? c.text : c.border,
              borderWidth: digit ? 1 : StyleSheet.hairlineWidth,
            },
          ]}
          maxLength={1}
          keyboardType="number-pad"
          value={digit}
          onChangeText={val => onChangeDigit(val, i)}
        />
      ))}
    </View>
  );
}

// A centred text link under the form, e.g. "New student? Register here".
export function AuthLink({ prompt, action, onPress, icon }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.link}>
      {icon ? <Icon name={icon} size={14} tone="muted" /> : null}
      <Text variant="callout" tone="muted">
        {prompt ? `${prompt} ` : ''}<Text variant="callout" tone="accent">{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, padding: space.xxl, paddingTop: 60 },
  logos: { flexDirection: 'row', justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', paddingVertical: space.xxxl },
  center: { textAlign: 'center' },
  dept: { marginTop: space.sm, marginBottom: space.xxxl },
  field: { marginBottom: space.md },
  label: { marginBottom: space.xs + 2 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  passwordInput: { flex: 1, paddingHorizontal: space.md, paddingVertical: space.md - 2 },
  eye: { paddingHorizontal: space.md },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginBottom: space.xxl },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '300',
  },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, marginTop: space.lg },
});
