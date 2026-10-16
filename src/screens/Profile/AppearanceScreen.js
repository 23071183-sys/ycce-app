import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemeControls } from '../../context/ThemeContext';
import { Card, Icon, ListItem, Screen, SectionLabel, Text } from '../../components/ui';
import { space } from '../../theme';

const OPTIONS = [
  { value: 'system', title: 'System', subtitle: 'Follow the phone’s light or dark setting', icon: 'phone-portrait-outline' },
  { value: 'light', title: 'Light', icon: 'sunny-outline' },
  { value: 'dark', title: 'Dark', icon: 'moon-outline' },
];

export default function AppearanceScreen() {
  const { preference, setPreference } = useThemeControls();
  return (
    <Screen>
      <SectionLabel>Theme</SectionLabel>
      <Card padded={false} style={styles.inset}>
        {OPTIONS.map((o, i) => (
          <ListItem
            key={o.value}
            title={o.title}
            subtitle={o.subtitle}
            leading={<Icon name={o.icon} />}
            trailing={preference === o.value ? <Icon name="checkmark" tone="accent" /> : null}
            onPress={() => setPreference(o.value)}
            chevron={false}
            last={i === OPTIONS.length - 1}
          />
        ))}
      </Card>
      <Text variant="caption" tone="muted" style={styles.note}>Saved on this phone.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: space.lg },
  note: { marginTop: space.sm },
});
