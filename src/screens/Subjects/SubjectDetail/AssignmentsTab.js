import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';
import { Badge, Button, Card, EmptyState, Icon, Text, TextField } from '../../../components/ui';
import { radius, space } from '../../../theme';
import { CollapsibleForm, FileField, FileLink, filePart, fmtShort, pickDocument, styles as shared } from './shared';

function CreateAssignmentForm({ subjectId, onAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (close) => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!dueDate.trim()) return Alert.alert('Error', 'Due date required (YYYY-MM-DD)');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subject_id', String(subjectId));
      fd.append('due_date', dueDate.trim());
      if (description.trim()) fd.append('description', description.trim());
      if (file) fd.append('file', filePart(file));
      await api.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Assignment created!');
      setTitle(''); setDescription(''); setDueDate(''); setFile(null); close();
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <CollapsibleForm title="Create assignment">
      {(close) => (
        <>
          <TextField placeholder="Title *" value={title} onChangeText={setTitle} />
          <TextField placeholder="Description (optional)" value={description} onChangeText={setDescription} multiline />
          <TextField
            placeholder="Due date (YYYY-MM-DD) *"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
          />
          <FileField file={file} onPick={async () => { const f = await pickDocument(); if (f) setFile(f); }} onClear={() => setFile(null)} placeholder="Attach file (optional)" />
          <Button title={saving ? 'Creating...' : 'Create assignment'} onPress={() => save(close)} loading={saving} />
        </>
      )}
    </CollapsibleForm>
  );
}

function AssignmentCard({ assignment, user, onSubmit }) {
  const c = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const due = new Date(assignment.due_date);
  const overdue = due < new Date();

  const submit = async () => {
    if (!content.trim() && !file) return Alert.alert('Error', 'Add a note or attach a file');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('assignment_id', String(assignment.id));
      if (content.trim()) fd.append('content', content.trim());
      if (file) fd.append('file', filePart(file));
      await api.post('/assignments/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Assignment submitted!');
      setShowForm(false); setContent(''); setFile(null); onSubmit();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Card style={shared.item}>
      <Text variant="heading">{assignment.title}</Text>
      {assignment.description ? <Text variant="callout" tone="secondary" style={shared.itemBody}>{assignment.description}</Text> : null}
      <View style={styles.dueRow}>
        <Icon name="calendar-outline" size={14} tone={overdue ? 'danger' : 'muted'} />
        <Text variant="caption" tone={overdue ? 'danger' : 'muted'}>Due {fmtShort(assignment.due_date)}</Text>
        {overdue ? <Badge tone="danger">Overdue</Badge> : null}
      </View>

      {assignment.file_url ? (
        <View style={styles.section}>
          <Text variant="label" style={styles.sectionLabel}>Given by {assignment.posted_by_name || 'instructor'}</Text>
          <FileLink url={assignment.file_url} name={assignment.file_name} />
        </View>
      ) : null}

      {user?.role === 'student' && (
        <View style={[styles.submission, { borderTopColor: c.border }]}>
          <Text variant="label" style={styles.sectionLabel}>Your submission</Text>

          {assignment.submission_id ? (
            <View style={[styles.submitted, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <View style={styles.submittedHead}>
                <Badge tone="success">SUBMITTED</Badge>
                <Text variant="caption" tone="muted" style={shared.flex}>
                  {assignment.submitted_at ? fmtShort(assignment.submitted_at) : ''}
                </Text>
                {assignment.grade ? <Text variant="heading">{assignment.grade}</Text> : null}
              </View>
              {assignment.submission_file_url ? (
                <Pressable onPress={() => Linking.openURL(assignment.submission_file_url)} style={styles.ownFile}>
                  <Icon name="document-attach-outline" size={14} tone="accent" />
                  <Text variant="callout" tone="accent" numberOfLines={1} style={shared.flex}>
                    {assignment.submission_file_name || 'View file'}
                  </Text>
                </Pressable>
              ) : null}
              {assignment.feedback ? (
                <Text variant="callout" tone="secondary" style={styles.feedback}>{assignment.feedback}</Text>
              ) : null}
            </View>
          ) : (
            <Text variant="callout" tone={overdue ? 'danger' : 'muted'} style={styles.nothing}>
              {overdue ? 'Not submitted — the due date has passed.' : 'Nothing submitted yet.'}
            </Text>
          )}

          {!overdue && (
            <Button
              title={showForm ? 'Cancel' : assignment.submission_id ? 'Replace submission' : 'Attach & submit'}
              variant={showForm || assignment.submission_id ? 'secondary' : 'primary'}
              onPress={() => setShowForm(!showForm)}
            />
          )}
          {showForm && !overdue && (
            <View style={styles.form}>
              <TextField
                placeholder="Add notes or comments (optional)..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={3}
              />
              <FileField file={file} onPick={async () => { const f = await pickDocument(); if (f) setFile(f); }} onClear={() => setFile(null)} placeholder="Attach PDF / file" />
              <Button title="Confirm submit" onPress={submit} loading={submitting} />
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

export default function AssignmentsTab({ assignments, subjectId, user, isProfessor, onChanged }) {
  return (
    <>
      {isProfessor && <CreateAssignmentForm subjectId={subjectId} onAdded={onChanged} />}
      {assignments.length === 0
        ? <EmptyState icon="clipboard-outline" title="No assignments yet" message="Assignments for this subject will show here." />
        : assignments.map(a => <AssignmentCard key={a.id} assignment={a} user={user} onSubmit={onChanged} />)}
    </>
  );
}

const styles = StyleSheet.create({
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginTop: space.sm },
  section: { marginTop: space.md },
  sectionLabel: { marginBottom: space.sm },
  submission: { marginTop: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  submitted: { borderRadius: radius.md, padding: space.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: space.md },
  submittedHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ownFile: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginTop: space.sm },
  feedback: { marginTop: space.sm, fontStyle: 'italic' },
  nothing: { marginBottom: space.md },
  form: { marginTop: space.md },
});
