import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { Icon } from '../../components/ui';
import { space } from '../../theme';

export const CHECKERS = ['fest_admin', 'admin', 'super_admin'];

// Seat counts and the user's own registrations for one event type ('fest' or
// 'compufest'), with register and cancel actions. Also puts "My tickets" and,
// for door staff, "Check in" buttons in the screen header.
export default function useEventRegistration(type, navigation) {
  const { user } = useAuth();
  const counts = useApi(`/events/${type}/counts`, { initialData: [] });
  const [busyId, setBusyId] = useState(null);
  const byEvent = new Map((counts.data || []).map(r => [r.event_id, r]));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.header}>
          {CHECKERS.includes(user?.role) ? (
            <Pressable onPress={() => navigation.navigate('CheckIn')} hitSlop={8} accessibilityLabel="Check in">
              <Icon name="scan-outline" size={22} tone="default" />
            </Pressable>
          ) : null}
          <Pressable onPress={() => navigation.navigate('MyTickets')} hitSlop={8} accessibilityLabel="My tickets">
            <Icon name="ticket-outline" size={22} tone="default" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, user?.role]);

  const register = async (eventId) => {
    setBusyId(eventId);
    try {
      await api.post(`/events/${type}/${eventId}/register`);
      await counts.revalidate();
    } catch (e) {
      Alert.alert(
        e.response?.status === 409 ? "Can't register" : 'Could not register',
        e.response?.data?.error || 'Try again in a moment.'
      );
      counts.revalidate();
    } finally {
      setBusyId(null);
    }
  };

  const cancel = (eventId, title) => {
    Alert.alert('Cancel registration?', `Your ticket for ${title} will stop working.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel registration',
        style: 'destructive',
        onPress: async () => {
          setBusyId(eventId);
          try {
            await api.delete(`/events/${type}/${eventId}/register`);
            await counts.revalidate();
          } catch (e) {
            Alert.alert('Could not cancel', e.response?.data?.error || 'Try again in a moment.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const rows = counts.data || [];
  const totals = {
    registered: rows.reduce((n, r) => n + (r.registered || 0), 0),
    mine: rows.filter(r => r.mine).length,
  };

  return { countsFor: (id) => byEvent.get(id), totals, busyId, register, cancel, refreshCounts: counts.refresh };
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: space.lg, paddingHorizontal: space.lg },
});
