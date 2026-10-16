import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import api from '../../../services/api';
import useApi from '../../../hooks/useApi';
import { Badge, Button, Card, ListItem, SectionLabel, SegmentedControl, Skeleton, Text, TextField } from '../../../components/ui';
import { space } from '../../../theme';
import { CollapsibleForm, FileField, filePart, pickDocument } from './shared';

const EXAM_TYPES = [
  { value: 'MSE1', label: 'MSE 1' },
  { value: 'MSE2', label: 'MSE 2' },
  { value: 'RE_MSE', label: 'RE-MSE' },
  { value: 'ESE', label: 'ESE' },
];
const EXAM_LABEL = Object.fromEntries(EXAM_TYPES.map(t => [t.value, t.label]));

const EXTRACT = {
  done: { tone: 'success', label: 'Ready' },
  processing: { tone: 'warning', label: 'Reading…' },
  pending: { tone: 'neutral', label: 'Queued' },
  failed: { tone: 'danger', label: 'Failed' },
};

// e.g. "2025-26" for the academic year that started last June.
const currentAcademicYear = () => {
  const now = new Date();
  const start = now.getMonth() + 1 < 6 ? now.getFullYear() - 1 : now.getFullYear();
  return `${start}-${String(start + 1).slice(-2)}`;
};

function UploadPaperForm({ subjectId, onAdded }) {
  const [examType, setExamType] = useState('MSE1');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (close) => {
    if (!file) return Alert.alert('Attach the paper', 'Choose a PDF or a photo of the question paper.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('subject_id', String(subjectId));
      fd.append('exam_type', examType);
      if (academicYear.trim()) fd.append('academic_year', academicYear.trim());
      fd.append('file', filePart(file));
      await api.post('/study/papers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Uploaded', 'Questions are being read from the paper. It shows Ready when done.');
      setFile(null); close();
      onAdded();
    } catch (e) { Alert.alert('Upload failed', e.response?.data?.error || 'Try again in a moment.'); }
    finally { setSaving(false); }
  };

  return (
    <CollapsibleForm title="Upload past paper">
      {(close) => (
        <>
          <Text variant="label" style={styles.label}>Exam</Text>
          <SegmentedControl options={EXAM_TYPES} value={examType} onChange={setExamType} style={styles.control} />
          <TextField label="Academic year" value={academicYear} onChangeText={setAcademicYear} placeholder="2025-26" />
          <FileField
            file={file}
            onPick={async () => { const f = await pickDocument(); if (f) setFile(f); }}
            onClear={() => setFile(null)}
            placeholder="Attach PDF or photo"
          />
          <Button title="Upload paper" onPress={() => save(close)} loading={saving} />
        </>
      )}
    </CollapsibleForm>
  );
}

// Professors' past papers for a subject. The server reads the questions out of
// each paper so quizzes and flashcards can be built from them.
export default function PapersSection({ subjectId }) {
  const { data, loading, revalidate } = useApi('/study/papers', { params: { subject_id: subjectId }, initialData: [] });
  const [retrying, setRetrying] = useState(null);
  const papers = data || [];

  const retry = async (id) => {
    setRetrying(id);
    try {
      await api.post(`/study/papers/${id}/extract`);
      await revalidate();
    } catch (e) {
      Alert.alert(
        e.response?.status === 503 ? "AI isn't available right now" : 'Could not retry',
        e.response?.status === 503 ? 'Try again later.' : e.response?.data?.error || 'Try again in a moment.'
      );
    } finally { setRetrying(null); }
  };

  return (
    <View style={styles.section}>
      <SectionLabel action="Refresh" onAction={revalidate}>Past papers</SectionLabel>
      <UploadPaperForm subjectId={subjectId} onAdded={revalidate} />
      {loading ? (
        <Card style={styles.skeleton}><Skeleton height={14} /><Skeleton width="60%" height={14} /></Card>
      ) : papers.length ? (
        <Card padded={false} style={styles.inset}>
          {papers.map((p, i) => {
            const st = EXTRACT[p.extract_status] || { tone: 'neutral', label: p.extract_status || '—' };
            const canRetry = p.extract_status === 'failed' || p.extract_status === 'pending';
            return (
              <ListItem
                key={p.id}
                title={`${EXAM_LABEL[p.exam_type] || p.exam_type}${p.academic_year ? ` · ${p.academic_year}` : ''}`}
                subtitle={[
                  p.question_count ? `${p.question_count} questions` : null,
                  p.extract_status === 'failed' && p.extract_error ? p.extract_error : null,
                  p.file_name,
                ].filter(Boolean).join(' · ') || undefined}
                trailing={
                  <View style={styles.trailing}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {canRetry ? (
                      <Button title="Retry" variant="ghost" size="sm" onPress={() => retry(p.id)} loading={retrying === p.id} />
                    ) : null}
                  </View>
                }
                last={i === papers.length - 1}
              />
            );
          })}
        </Card>
      ) : (
        <Text variant="callout" tone="muted">No papers yet. Uploaded papers power students' quizzes and flashcards.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.xxl },
  label: { marginBottom: space.xs + 2 },
  control: { marginBottom: space.md },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  trailing: { alignItems: 'flex-end', gap: 2 },
});
