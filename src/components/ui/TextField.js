import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';
import { radius, space, type } from '../../theme';

// A labelled text input. error shows under the field and outlines it in red.
const TextField = forwardRef(function TextField(
  { label, error, hint, multiline = false, style, inputStyle, ...rest },
  ref
) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text variant="label" style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor={c.textMuted}
        style={[
          type.body,
          styles.input,
          multiline && styles.multiline,
          { color: c.text, backgroundColor: c.surfaceAlt, borderColor: error ? c.danger : c.border },
          inputStyle,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger" style={styles.below}>{error}</Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.below}>{hint}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.xs + 2 },
  input: {
    borderRadius: radius.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    paddingVertical: space.md - 2,
    minHeight: 44,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  below: { marginTop: space.xs },
});
