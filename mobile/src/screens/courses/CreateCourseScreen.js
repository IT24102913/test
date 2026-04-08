import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import api from '../../api/axiosConfig';

export default function CreateCourseScreen({ route, navigation }) {
  const { courseId, edit } = route.params || {};
  const [form, setForm] = useState({ title: '', description: '', level: 'BEGINNER', minimumPointsRequired: '0' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Validation', 'Title and description are required.'); return;
    }
    setLoading(true);
    try {
      const payload = { ...form, minimumPointsRequired: parseInt(form.minimumPointsRequired) || 0 };
      if (edit && courseId) {
        await api.put(`/courses/${courseId}`, payload);
        Alert.alert('Success', 'Course updated!');
      } else {
        await api.post('/courses', payload);
        Alert.alert('Success', 'Course created!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>{edit ? '✏️ Edit Course' : '📚 Create Course'}</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="Course title (5–100 chars)" placeholderTextColor="#888" value={form.title} onChangeText={set('title')} />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="Course description (20–1000 chars)" placeholderTextColor="#888" value={form.description} onChangeText={set('description')} multiline numberOfLines={4} />

      <Text style={styles.label}>Level</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.levelBtn, form.level === l && styles.levelBtnActive]}
            onPress={() => set('level')(l)}
          >
            <Text style={[styles.levelBtnText, form.level === l && styles.levelBtnTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Min Points Required</Text>
      <TextInput style={styles.input} placeholder="0" placeholderTextColor="#888" value={form.minimumPointsRequired} onChangeText={set('minimumPointsRequired')} keyboardType="numeric" />

      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{edit ? 'Save Changes' : 'Create Course'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23', padding: 20 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 20 },
  label:     { color: '#ccc', marginBottom: 6, fontSize: 14 },
  input: {
    backgroundColor: '#1A1A2E', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A',
  },
  textarea:  { height: 100, textAlignVertical: 'top' },
  levelRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  levelBtn:  { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#1A1A2E', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  levelBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  levelBtnText:   { color: '#aaa', fontSize: 12, fontWeight: '600' },
  levelBtnTextActive: { color: '#fff' },
  btn:    { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
