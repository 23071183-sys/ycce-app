import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { space } from '../../theme';

// The small uppercase heading above a group of content, with an optional action
// on the right such as "See all".
export default function SectionLabel({ children, action, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text variant="label">{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="caption" tone="accent">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
});
