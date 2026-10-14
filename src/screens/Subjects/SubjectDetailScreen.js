import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Linking, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const TABS = ['Announcements', 'Notes', 'Assignments', 'Attendance'];
const UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8'];

export default function SubjectDetailScreen({ route }) {
  const { subject, color } = route.params;
  const { user } = useAuth();
  const c = useTheme();
  const [tab, setTab] = useState('Announcements');
  const [notes, setNotes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTab(); }, [tab]);

  const fetchTab = async () => {
    setLoading(true);
    try {
      if (tab === 'Notes') { const r = await api.get(`/notes/subject/${subject.id}`); setNotes(r.data); }
      else if (tab === 'Announcements') { const r = await api.get(`/announcements/subject/${subject.id}`); setAnnouncements(r.data); }
      else if (tab === 'Assignments') { const r = await api.get(`/assignments/subject/${subject.id}`); setAssignments(r.data); }
      else if (tab === 'Attendance') {
        if (user?.role === 'student') { const r = await api.get(`/attendance/subject/${subject.id}`); setAttendance(r.data); }
        else { const r = await api.get(`/users/students/year/${subject.year}`); setStudents(r.data.map(s => ({ ...s, status: 'present' }))); }
      }
    } catch (e) { reportError(e); }
    finally { setLoading(false); }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const pct = attendance ? parseFloat(attendance.percentage || 0) : 0;
  const pctColor = pct >= 75 ? c.success : pct >= 60 ? c.warning : c.danger;

  const notesByUnit = notes.reduce((acc, n) => {
    const key = n.unit ? `Unit ${n.unit}` : 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});
  const unitOrder = [...UNITS, 'General'].filter(u => notesByUnit[u]);

  const Card = ({ children, style }) => (
    <View style={[{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: c.border }, style]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[{ padding: 20, paddingTop: 16, paddingBottom: 16 }, { backgroundColor: color }]}>
        <Text style={{ fontSize: 16, fontWeight: '400', color: '#fff', letterSpacing: 0.3 }}>{subject.name}</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 0.5 }}>{subject.code} · {subject.professor_name}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: c.card, borderBottomWidth: 0.5, borderBottomColor: c.border, flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ flexDirection: 'row' }}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: tab === t ? color : 'transparent' }} onPress={() => setTab(t)}>
            <Text style={{ fontSize: 12, color: tab === t ? color : c.textMuted, fontWeight: tab === t ? '700' : '400', letterSpacing: 0.5 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={color} /> : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {/* NOTES */}
          {tab === 'Notes' && (
            <>
              {user?.role === 'professor' && <AddNoteForm subjectId={subject.id} color={color} onAdded={fetchTab} c={c} />}
              {notes.length === 0
                ? <Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40, fontWeight: '300' }}>No notes posted yet.</Text>
                : unitOrder.map(unitLabel => (
                  <View key={unitLabel}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 4, color }}>{unitLabel}</Text>
                    {notesByUnit[unitLabel].map(n => (
                      <Card key={n.id} style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                        <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 6 }}>{n.title}</Text>
                        {n.content ? <Text style={{ fontSize: 13, color: c.textMuted, lineHeight: 19, marginBottom: 8, fontWeight: '300' }}>{n.content}</Text> : null}
                        {n.file_url ? (
                          <TouchableOpacity onPress={() => Linking.openURL(n.file_url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 }}>
                            <Ionicons name="attach-outline" size={14} color={color} />
                            <Text style={{ fontSize: 13, fontWeight: '500', color }}>{n.file_name || 'View Attachment'}</Text>
                          </TouchableOpacity>
                        ) : null}
                        <Text style={{ fontSize: 11, color: c.border }}>By {n.posted_by_name} · {fmt(n.created_at)}</Text>
                      </Card>
                    ))}
                  </View>
                ))
              }
            </>
          )}

          {/* ANNOUNCEMENTS */}
          {tab === 'Announcements' && (
            <>
              {user?.role === 'professor' && <AddAnnouncementForm subjectId={subject.id} color={color} onAdded={fetchTab} c={c} />}
              {announcements.length === 0
                ? <Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40, fontWeight: '300' }}>No announcements for this subject.</Text>
                : announcements.map(a => (
                  <Card key={a.id}>
                    <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 6 }}>{a.title}</Text>
                    <Text style={{ fontSize: 13, color: c.textMuted, lineHeight: 19, marginBottom: 8, fontWeight: '300' }}>{a.content}</Text>
                    <Text style={{ fontSize: 11, color: c.border }}>By {a.posted_by_name} · {fmt(a.created_at)}</Text>
                  </Card>
                ))
              }
            </>
          )}

          {/* ASSIGNMENTS */}
          {tab === 'Assignments' && (
            <>
              {user?.role === 'professor' && <CreateAssignmentForm subjectId={subject.id} color={color} onAdded={fetchTab} c={c} />}
              {assignments.length === 0
                ? <Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40, fontWeight: '300' }}>No assignments yet.</Text>
                : assignments.map(a => <AssignmentCard key={a.id} assignment={a} user={user} color={color} onSubmit={fetchTab} c={c} />)
              }
            </>
          )}

          {/* ATTENDANCE - Student */}
          {tab === 'Attendance' && user?.role === 'student' && attendance && (
            <View>
              <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: pctColor, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: c.card }}>
                <Text style={{ fontSize: 32, fontWeight: '200', color: pctColor }}>{pct}%</Text>
                <Text style={{ fontSize: 12, color: c.textMuted }}>Attendance</Text>
              </View>
              <Card>
                {[['✅ Present', attendance.present_count], ['📊 Total', attendance.total_count], ['❌ Absent', attendance.total_count - attendance.present_count]].map(([label, val]) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                    <Text style={{ fontSize: 14, color: c.textSec }}>{label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>{val}</Text>
                  </View>
                ))}
              </Card>
              {pct < 75 && attendance.total_count > 0 && (
                <View style={{ backgroundColor: c.warning + '15', borderRadius: 10, padding: 14, borderLeftWidth: 4, borderLeftColor: c.warning }}>
                  <Text style={{ fontSize: 13, color: c.warning, lineHeight: 19 }}>⚠️ Attendance below 75%. Need {Math.ceil((0.75 * attendance.total_count - attendance.present_count) / 0.25)} more classes to reach 75%.</Text>
                </View>
              )}
            </View>
          )}

          {/* ATTENDANCE - Professor */}
          {tab === 'Attendance' && user?.role === 'professor' && (
            <ProfessorAttendance students={students} setStudents={setStudents} subjectId={subject.id} color={color} c={c} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AddNoteForm({ subjectId, color, onAdded, c }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unit, setUnit] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!r.canceled && r.assets?.length > 0) setFile(r.assets[0]);
    } catch { Alert.alert('Error', 'Could not pick file'); }
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subject_id', String(subjectId));
      if (content.trim()) fd.append('content', content.trim());
      if (unit) fd.append('unit', String(UNITS.indexOf(unit) + 1));
      if (file) fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      await api.post('/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Note posted!');
      setTitle(''); setContent(''); setUnit(null); setFile(null); setOpen(false);
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle = { backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, fontSize: 14, color: c.text, marginBottom: 8, borderWidth: 0.5, borderColor: c.border };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftColor: color, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border }}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '400', color }}>+ Post New Note</Text>
        <Text style={{ color, fontSize: 16 }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 12 }}>
          <TextInput style={inputStyle} placeholder="Title *" value={title} onChangeText={setTitle} placeholderTextColor={c.textMuted} />
          <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Description (optional)" value={content} onChangeText={setContent} multiline placeholderTextColor={c.textMuted} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 6, letterSpacing: 1 }}>UNIT (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {UNITS.map(u => (
              <TouchableOpacity key={u} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: unit === u ? color : c.cardAlt, marginRight: 8, borderWidth: 0.5, borderColor: c.border }} onPress={() => setUnit(unit === u ? null : u)}>
                <Text style={{ fontSize: 13, color: unit === u ? '#fff' : c.textSec }}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', marginBottom: 6, flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={pickFile}>
            <Ionicons name={file ? 'attach-outline' : 'document-outline'} size={16} color={c.textMuted} />
            <Text style={{ fontSize: 14, color: c.textMuted }}>{file ? file.name : 'Attach PDF / File (optional)'}</Text>
          </TouchableOpacity>
          {file && <TouchableOpacity onPress={() => setFile(null)}><Text style={{ fontSize: 12, color: c.danger, textAlign: 'center', marginBottom: 8 }}>✕ Remove file</Text></TouchableOpacity>}
          <TouchableOpacity style={{ backgroundColor: color, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }} onPress={save} disabled={saving}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{saving ? 'Uploading...' : 'Post Note'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AddAnnouncementForm({ subjectId, color, onAdded, c }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
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
      setTitle(''); setContent(''); setOpen(false);
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle = { backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, fontSize: 14, color: c.text, marginBottom: 8, borderWidth: 0.5, borderColor: c.border };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftColor: color, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border }}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '400', color }}>+ Post New Announcement</Text>
        <Text style={{ color, fontSize: 16 }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 12 }}>
          <TextInput style={inputStyle} placeholder="Title *" value={title} onChangeText={setTitle} placeholderTextColor={c.textMuted} />
          <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Message *" value={content} onChangeText={setContent} multiline placeholderTextColor={c.textMuted} />
          <TouchableOpacity style={{ backgroundColor: color, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }} onPress={save} disabled={saving}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{saving ? 'Posting...' : 'Post Announcement'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CreateAssignmentForm({ subjectId, color, onAdded, c }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!r.canceled && r.assets?.length > 0) setFile(r.assets[0]);
    } catch { Alert.alert('Error', 'Could not pick file'); }
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!dueDate.trim()) return Alert.alert('Error', 'Due date required (YYYY-MM-DD)');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('subject_id', String(subjectId));
      fd.append('due_date', dueDate.trim());
      if (description.trim()) fd.append('description', description.trim());
      if (file) fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      await api.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Assignment created!');
      setTitle(''); setDescription(''); setDueDate(''); setFile(null); setOpen(false);
      onAdded();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle = { backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, fontSize: 14, color: c.text, marginBottom: 8, borderWidth: 0.5, borderColor: c.border };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftColor: color, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border }}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '400', color }}>+ Create Assignment</Text>
        <Text style={{ color, fontSize: 16 }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 12 }}>
          <TextInput style={inputStyle} placeholder="Title *" value={title} onChangeText={setTitle} placeholderTextColor={c.textMuted} />
          <TextInput style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Description (optional)" value={description} onChangeText={setDescription} multiline placeholderTextColor={c.textMuted} />
          <TextInput style={inputStyle} placeholder="Due Date (YYYY-MM-DD) *" value={dueDate} onChangeText={setDueDate} placeholderTextColor={c.textMuted} keyboardType="numbers-and-punctuation" />
          <TouchableOpacity style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', marginBottom: 6, flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={pickFile}>
            <Ionicons name={file ? 'attach-outline' : 'document-outline'} size={16} color={c.textMuted} />
            <Text style={{ fontSize: 14, color: c.textMuted }}>{file ? file.name : 'Attach File (optional)'}</Text>
          </TouchableOpacity>
          {file && <TouchableOpacity onPress={() => setFile(null)}><Text style={{ fontSize: 12, color: c.danger, textAlign: 'center', marginBottom: 8 }}>✕ Remove file</Text></TouchableOpacity>}
          <TouchableOpacity style={{ backgroundColor: color, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }} onPress={save} disabled={saving}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{saving ? 'Creating...' : 'Create Assignment'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AssignmentCard({ assignment, user, color, onSubmit, c }) {
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const due = new Date(assignment.due_date);
  const overdue = due < new Date();

  const pickFile = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!r.canceled && r.assets?.length > 0) setFile(r.assets[0]);
    } catch { Alert.alert('Error', 'Could not pick file'); }
  };

  const submit = async () => {
    if (!content.trim() && !file) return Alert.alert('Error', 'Add a note or attach a file');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('assignment_id', String(assignment.id));
      if (content.trim()) fd.append('content', content.trim());
      if (file) fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      await api.post('/assignments/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Assignment submitted!');
      setShowForm(false); setContent(''); setFile(null); onSubmit();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 12, borderLeftColor: color, borderLeftWidth: 3, borderWidth: 0.5, borderColor: c.border }}>
      <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 6 }}>{assignment.title}</Text>
      {assignment.description ? <Text style={{ fontSize: 13, color: c.textMuted, lineHeight: 19, marginBottom: 8, fontWeight: '300' }}>{assignment.description}</Text> : null}
      <Text style={{ fontSize: 12, color: overdue ? c.danger : c.textMuted }}>Due: {fmt(assignment.due_date)} {overdue ? '(Overdue)' : ''}</Text>
      {assignment.file_url ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Given by {assignment.posted_by_name || 'instructor'}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(assignment.file_url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.cardAlt, borderRadius: 8, padding: 10, borderWidth: 0.5, borderColor: c.border }}>
            <Ionicons name="document-text-outline" size={15} color={c.textMuted} />
            <Text style={{ fontSize: 13, color: c.text, fontWeight: '500', flex: 1 }} numberOfLines={1}>{assignment.file_name || 'View Attachment'}</Text>
            <Ionicons name="download-outline" size={15} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}
      {user?.role === 'student' && (
        <View style={{ marginTop: 14, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Your submission
          </Text>

          {assignment.submission_id ? (
            <View style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 10, borderWidth: 0.5, borderColor: c.success, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={c.success} />
                <Text style={{ fontSize: 12, color: c.success, fontWeight: '700', letterSpacing: 1 }}>SUBMITTED</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, flex: 1 }}>
                  {assignment.submitted_at ? fmt(assignment.submitted_at) : ''}
                </Text>
                {assignment.grade ? (
                  <Text style={{ fontSize: 12, color: c.text, fontWeight: '700' }}>{assignment.grade}</Text>
                ) : null}
              </View>
              {assignment.submission_file_url ? (
                <TouchableOpacity onPress={() => Linking.openURL(assignment.submission_file_url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Ionicons name="document-attach-outline" size={14} color={color} />
                  <Text style={{ fontSize: 12, color, flex: 1 }} numberOfLines={1}>{assignment.submission_file_name || 'View file'}</Text>
                </TouchableOpacity>
              ) : null}
              {assignment.feedback ? (
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 8, fontStyle: 'italic' }}>{assignment.feedback}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: overdue ? c.danger : c.textMuted, marginBottom: 8 }}>
              {overdue ? 'Not submitted — the due date has passed.' : 'Nothing submitted yet.'}
            </Text>
          )}

          {!overdue && (
          <TouchableOpacity style={{ backgroundColor: color, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => setShowForm(!showForm)}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              {showForm ? 'Cancel' : assignment.submission_id ? 'Replace submission' : 'Attach & submit'}
            </Text>
          </TouchableOpacity>
          )}
          {showForm && !overdue && (
            <View style={{ marginTop: 10 }}>
              <TextInput
                style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', color: c.text, marginBottom: 8, borderWidth: 0.5, borderColor: c.border }}
                placeholder="Add notes or comments (optional)..."
                value={content} onChangeText={setContent} multiline numberOfLines={3} placeholderTextColor={c.textMuted}
              />
              <TouchableOpacity style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', marginBottom: 6, flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={pickFile}>
                <Ionicons name={file ? 'attach-outline' : 'document-outline'} size={16} color={c.textMuted} />
                <Text style={{ fontSize: 14, color: c.textMuted }}>{file ? file.name : 'Attach PDF / File'}</Text>
              </TouchableOpacity>
              {file && <TouchableOpacity onPress={() => setFile(null)}><Text style={{ fontSize: 12, color: c.danger, textAlign: 'center', marginBottom: 8 }}>✕ Remove file</Text></TouchableOpacity>}
              <TouchableOpacity style={{ backgroundColor: c.success, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }} onPress={submit} disabled={submitting}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{submitting ? 'Uploading...' : 'Confirm Submit'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ProfessorAttendance({ students, setStudents, subjectId, color, c }) {
  const [view, setView] = useState('mark');

  return (
    <View>
      <View style={{ flexDirection: 'row', backgroundColor: c.cardAlt, borderRadius: 10, padding: 3, marginBottom: 16, borderWidth: 0.5, borderColor: c.border }}>
        {[['mark', 'Mark Attendance'], ['report', 'View Report']].map(([key, label]) => (
          <TouchableOpacity key={key} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: view === key ? color : 'transparent' }} onPress={() => setView(key)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: view === key ? '#fff' : c.textMuted }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {view === 'mark'
        ? <MarkAttendance students={students} setStudents={setStudents} subjectId={subjectId} color={color} c={c} />
        : <SectionReport subjectId={subjectId} color={color} c={c} />
      }
    </View>
  );
}

function SectionReport({ subjectId, color, c }) {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);      // student object
  const [detail, setDetail] = useState(null);           // { summary, records }
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get(`/attendance/subject/${subjectId}/report`)
      .then(r => setReport(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [subjectId]);

  const openReport = async (student) => {
    setSelected(student);
    setDetailLoading(true);
    setDetail(null);
    try {
      const r = await api.get(`/attendance/subject/${subjectId}/student/${student.id}`);
      setDetail(r.data);
    } catch (e) { Alert.alert('Error', 'Could not load report'); setSelected(null); }
    finally { setDetailLoading(false); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const pctColor = (pct) => pct >= 75 ? c.success : pct >= 60 ? c.warning : c.danger;

  if (loading) return <ActivityIndicator color={color} style={{ marginTop: 40 }} />;

  const total = report.length;
  const below75 = report.filter(s => parseFloat(s.percentage || 0) < 75).length;
  const detailPct = detail ? parseFloat(detail.summary?.percentage || 0) : 0;
  const detailPc = pctColor(detailPct);

  return (
    <View>
      {/* Summary tiles */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: 22, fontWeight: '200', color: c.text }}>{total}</Text>
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Total Students</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: 22, fontWeight: '200', color: c.danger }}>{below75}</Text>
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Below 75%</Text>
        </View>
      </View>

      {/* Student rows */}
      {report.length === 0
        ? <Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40, fontWeight: '300' }}>No attendance data yet.</Text>
        : report.map(s => {
          const pct = parseFloat(s.percentage || 0);
          const pc = pctColor(pct);
          return (
            <View key={s.id} style={{ backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: c.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '400', color: c.text }}>{s.name}</Text>
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{s.roll_number} · {s.present_count}/{s.total_count} classes</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '300', color: pc }}>{s.total_count > 0 ? `${pct}%` : '—'}</Text>
                  {pct < 75 && s.total_count > 0 && <Text style={{ fontSize: 10, color: c.danger, marginTop: 2 }}>Low</Text>}
                </View>
                <TouchableOpacity onPress={() => openReport(s)} style={{ padding: 6, backgroundColor: color + '18', borderRadius: 8 }}>
                  <Ionicons name="bar-chart-outline" size={18} color={color} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      }

      {/* Per-student detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '400', color: c.text }}>{selected?.name}</Text>
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{selected?.roll_number}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {detailLoading
              ? <ActivityIndicator color={color} style={{ marginVertical: 40 }} />
              : detail && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Circle + stats */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 5, borderColor: detailPc, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: c.card }}>
                      <Text style={{ fontSize: 26, fontWeight: '200', color: detailPc }}>{detail.summary?.total_count > 0 ? `${detailPct}%` : '—'}</Text>
                      <Text style={{ fontSize: 11, color: c.textMuted }}>Attendance</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      {[['Present', detail.summary?.present_count, c.success], ['Absent', detail.summary?.total_count - detail.summary?.present_count, c.danger], ['Total', detail.summary?.total_count, c.text]].map(([label, val, col]) => (
                        <View key={label} style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 0.5, borderColor: c.border }}>
                          <Text style={{ fontSize: 18, fontWeight: '300', color: col }}>{val ?? 0}</Text>
                          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{label}</Text>
                        </View>
                      ))}
                    </View>
                    {detailPct < 75 && detail.summary?.total_count > 0 && (
                      <View style={{ backgroundColor: c.danger + '15', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: c.danger, marginTop: 12, width: '100%' }}>
                        <Text style={{ fontSize: 13, color: c.danger }}>⚠️ Below 75% — needs {Math.ceil((0.75 * detail.summary.total_count - detail.summary.present_count) / 0.25)} more classes to recover.</Text>
                      </View>
                    )}
                  </View>

                  {/* Date-wise list */}
                  <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: c.textMuted, marginBottom: 10 }}>Date-wise Record</Text>
                  {detail.records.length === 0
                    ? <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 10, fontWeight: '300' }}>No records found.</Text>
                    : detail.records.map((rec, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                        <Text style={{ fontSize: 13, color: c.textSec }}>{fmtDate(rec.date)}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: rec.status === 'present' ? c.success : c.danger }} />
                          <Text style={{ fontSize: 13, fontWeight: '500', color: rec.status === 'present' ? c.success : c.danger, textTransform: 'capitalize' }}>{rec.status}</Text>
                        </View>
                      </View>
                    ))
                  }
                  <View style={{ height: 20 }} />
                </ScrollView>
              )
            }
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MarkAttendance({ students, setStudents, subjectId, color, c }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s));
  const markAll = (status) => setStudents(prev => prev.map(s => ({ ...s, status })));

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/attendance/mark-bulk', { subject_id: subjectId, date, records: students.map(s => ({ student_id: s.id, status: s.status })) });
      Alert.alert('Success', 'Attendance saved!');
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const present = students.filter(s => s.status === 'present').length;

  return (
    <View>
      <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: c.border }}>
        <Text style={{ fontSize: 13, fontWeight: '400', color: c.text, marginBottom: 6 }}>Date</Text>
        <TextInput style={{ backgroundColor: c.cardAlt, borderRadius: 8, padding: 12, fontSize: 15, color: c.text, borderWidth: 0.5, borderColor: c.border }} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.textMuted} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: c.success }} onPress={() => markAll('present')}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: c.danger }} onPress={() => markAll('absent')}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>All Absent</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '400', color: c.textSec, marginBottom: 10, textAlign: 'center' }}>{present}/{students.length} Present</Text>
      {students.map(s => (
        <TouchableOpacity key={s.id} style={{ backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: c.border }} onPress={() => toggle(s.id)}>
          <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 12, backgroundColor: s.status === 'present' ? c.success : c.danger }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '400', color: c.text }}>{s.name}</Text>
            <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{s.roll_number}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: s.status === 'present' ? c.success : c.danger }}>{s.status === 'present' ? 'P' : 'A'}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={{ backgroundColor: color, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 20 }} onPress={save} disabled={saving}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{saving ? 'Saving...' : 'Save Attendance'}</Text>
      </TouchableOpacity>
    </View>
  );
}
