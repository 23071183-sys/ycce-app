import React, { useState } from 'react';
import { Alert } from 'react-native';
import api from '../../../services/api';
import { Button, Card, EmptyState, Text, TextField } from '../../../components/ui';
import { Byline, CollapsibleForm, styles as shared } from './shared';

function AddAnnouncementForm({ subjectId, onAdded }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (close) => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!content.trim()) return Alert.alert('Error', 'Message is required');
    setSaving(true);
    try {
      // Professors may only post subject_specific announcements for subjects they teach.
      await api.post('/announcements', {
        title: title.trim(),
        content: content.trim(),
        type: 'subject_specific',
        subject_id: subjectId,
      });
      Alert.alert('Success', 'Announcement posted!');
      setTitle(''); setContent(''); close();
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <CollapsibleForm title="Post new announcement">
      {(close) => (
        <>
          <TextField placeholder="Title *" value={title} onChangeText={setTitle} />
          <TextField placeholder="Message *" value={content} onChangeText={setContent} multiline />
          <Button title={saving ? 'Posting...' : 'Post announcement'} onPress={() => save(close)} loading={saving} />
        </>
      )}
    </CollapsibleForm>
  );
}

export default function AnnouncementsTab({ announcements, subjectId, isProfessor, onChanged }) {
  return (
    <>
      {isProfessor && <AddAnnouncementForm subjectId={subjectId} onAdded={onChanged} />}
      {announcements.length === 0
        ? <EmptyState icon="megaphone-outline" title="No announcements" message="Nothing has been announced for this subject yet." />
        : announcements.map(a => (
          <Card key={a.id} style={shared.item}>
            <Text variant="heading">{a.title}</Text>
            <Text variant="callout" tone="secondary" style={shared.itemBody}>{a.content}</Text>
            <Byline name={a.posted_by_name} date={a.created_at} />
          </Card>
        ))}
    </>
  );
}
