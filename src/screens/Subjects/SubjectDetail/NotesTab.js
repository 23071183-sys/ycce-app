import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';
import { Button, Card, EmptyState, SectionLabel, Text, TextField } from '../../../components/ui';
import { radius, space } from '../../../theme';
import { Byline, CollapsibleForm, FileField, FileLink, UNITS, filePart, pickDocument, styles as shared } from './shared';

function AddNoteForm({ subjectId, onAdded }) {
  const c = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unit, setUnit] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (close) => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subject_id', String(subjectId));
      if (content.trim()) fd.append('content', content.trim());
      if (unit) fd.append('unit', String(UNITS.indexOf(unit) + 1));
      if (file) fd.append('file', filePart(file));
      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Note posted!');
      setTitle(''); setContent(''); setUnit(null); setFile(null); close();
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <CollapsibleForm title="Post new note">
      {(close) => (
        <>
          <TextField placeholder="Title *" value={title} onChangeText={setTitle} />
          <TextField placeholder="Description (optional)" value={content} onChangeText={setContent} multiline />
          <Text variant="label" style={styles.unitLabel}>Unit (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.units} contentContainerStyle={styles.unitRow}>
            {UNITS.map(u => {
              const selected = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(selected ? null : u)}
                  accessibilityState={{ selected }}
                  style={[
                    styles.chip,
                    selected
                      ? { backgroundColor: c.accentSoft, borderColor: c.accent }
                      : { backgroundColor: c.surfaceAlt, borderColor: c.border },
                  ]}
                >
                  <Text variant="callout" tone={selected ? 'accent' : 'secondary'}>{u}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <FileField file={file} onPick={async () => { const f = await pickDocument(); if (f) setFile(f); }} onClear={() => setFile(null)} placeholder="Attach PDF / file (optional)" />
          <Button title={saving ? 'Uploading...' : 'Post note'} onPress={() => save(close)} loading={saving} />
        </>
      )}
    </CollapsibleForm>
  );
}

export default function NotesTab({ notes, subjectId, isProfessor, onChanged }) {
  const notesByUnit = notes.reduce((acc, n) => {
    const key = n.unit ? `Unit ${n.unit}` : 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});
  const unitOrder = [...UNITS, 'General'].filter(u => notesByUnit[u]);

  return (
    <>
      {isProfessor && <AddNoteForm subjectId={subjectId} onAdded={onChanged} />}
      {notes.length === 0
        ? <EmptyState icon="document-text-outline" title="No notes yet" message="Notes posted for this subject will show here." />
        : unitOrder.map(unitLabel => (
          <View key={unitLabel} style={styles.unit}>
            <SectionLabel>{unitLabel}</SectionLabel>
            {notesByUnit[unitLabel].map(n => (
              <Card key={n.id} style={shared.item}>
                <Text variant="heading">{n.title}</Text>
                {n.content ? <Text variant="callout" tone="secondary" style={shared.itemBody}>{n.content}</Text> : null}
                {n.file_url ? (
                  <View style={styles.file}><FileLink url={n.file_url} name={n.file_name} icon="attach-outline" /></View>
                ) : null}
                <Byline name={n.posted_by_name} date={n.created_at} />
              </Card>
            ))}
          </View>
        ))}
    </>
  );
}

const styles = StyleSheet.create({
  unitLabel: { marginBottom: space.xs + 2 },
  units: { marginBottom: space.md },
  unitRow: { gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth },
  unit: { marginBottom: space.md },
  file: { marginTop: space.md },
});
