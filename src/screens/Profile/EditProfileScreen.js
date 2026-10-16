import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { imagePickerAvailable, pickSquarePhoto } from '../../utils/imagePicker';
import { Avatar, Button, Card, InfoRow, Screen, SectionLabel, TextField } from '../../components/ui';
import { space } from '../../theme';

const errorMessage = (e, fallback) => e.response?.data?.error || fallback;

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return Alert.alert('Check your name', 'Name must be at least 2 characters.');
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { name: name.trim(), phone: phone.trim(), bio: bio.trim() });
      await refreshUser(data);
      navigation.goBack();
    } catch (e) { Alert.alert('Could not save', errorMessage(e, 'Try again in a moment.')); }
    finally { setSaving(false); }
  };

  const changePhoto = async () => {
    let asset;
    try { asset = await pickSquarePhoto(); }
    catch { return Alert.alert('Error', 'Could not open your photos'); }
    if (!asset) return;
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('photo', {
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      const { data } = await api.post('/users/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser(data);
    } catch (e) { Alert.alert('Could not upload photo', errorMessage(e, 'Try a smaller image.')); }
    finally { setPhotoBusy(false); }
  };

  const removePhoto = () => {
    Alert.alert('Remove photo?', 'Your initials will show instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotoBusy(true);
          try {
            const { data } = await api.delete('/users/profile/photo');
            await refreshUser(data);
          } catch (e) { Alert.alert('Could not remove photo', errorMessage(e, 'Try again in a moment.')); }
          finally { setPhotoBusy(false); }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.photo}>
        <Avatar name={user?.name} uri={user?.avatar_url} size={96} />
        <View style={styles.photoActions}>
          {imagePickerAvailable ? (
            <Button title="Change photo" variant="secondary" size="sm" icon="camera-outline" onPress={changePhoto} loading={photoBusy} />
          ) : null}
          {user?.avatar_url ? (
            <Button title="Remove" variant="ghost" size="sm" onPress={removePhoto} disabled={photoBusy} />
          ) : null}
        </View>
      </View>

      <SectionLabel>About you</SectionLabel>
      <Card style={styles.group}>
        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Optional"
        />
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={500}
          placeholder="A line about yourself (optional)"
          hint={`${bio.length}/500`}
          style={styles.last}
        />
      </Card>

      <SectionLabel>Set by the college</SectionLabel>
      <Card padded={false} style={[styles.inset, styles.group]}>
        <InfoRow label="Email" value={user?.email} />
        {user?.role === 'student' ? <InfoRow label="Roll number" value={user?.roll_number} /> : null}
        {user?.role === 'student' ? <InfoRow label="Year" value={user?.year ? `Year ${user.year}` : null} /> : null}
        <InfoRow label="Department" value={user?.department || 'Computer Technology'} last />
      </Card>

      <Button title="Save changes" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', paddingVertical: space.xl, gap: space.md },
  photoActions: { flexDirection: 'row', gap: space.sm },
  group: { marginBottom: space.xxl },
  inset: { paddingHorizontal: space.lg },
  last: { marginBottom: 0 },
});
