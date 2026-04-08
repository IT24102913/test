import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../../api/axiosConfig';

export default function ReportManagementScreen() {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleResolve = (reportId, action) => {
    const actionText = action === 'ACCEPT' ? 'accept (delete the comment)' : 'reject';
    Alert.alert(
      `${action === 'ACCEPT' ? 'Accept' : 'Reject'} Report`,
      `Are you sure you want to ${actionText} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'ACCEPT' ? 'Accept' : 'Reject',
          style: action === 'ACCEPT' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.put(`/reports/${reportId}/resolve`, { action });
              Alert.alert('Done', action === 'ACCEPT' ? 'Report accepted and comment deleted.' : 'Report rejected.');
              fetchReports();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const renderReport = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportLabel}>⚠️ Reported Comment</Text>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Reported by:</Text>
        <Text style={styles.infoValue}>{item.reporterName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Comment author:</Text>
        <Text style={styles.infoValue}>{item.commentAuthorName || 'Unknown'}</Text>
      </View>

      <View style={styles.commentBox}>
        <Text style={styles.commentBoxLabel}>REPORTED COMMENT</Text>
        <Text style={styles.commentText}>{item.commentContent}</Text>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>REASON</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleResolve(item._id, 'ACCEPT')}
        >
          <Text style={styles.acceptBtnText}>✅ Accept & Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleResolve(item._id, 'REJECT')}
        >
          <Text style={styles.rejectBtnText}>❌ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🛡️ Report Management</Text>
      <Text style={styles.subtitle}>Pending reports requiring review</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={renderReport}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor="#6C63FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>No pending reports!</Text>
            <Text style={styles.emptySubtext}>All reports have been resolved.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  heading:         { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle:        { color: '#888', fontSize: 13, marginBottom: 16 },
  reportCard:      { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FF9800' },
  reportHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reportLabel:     { color: '#FF9800', fontWeight: '700', fontSize: 15 },
  dateText:        { color: '#666', fontSize: 11 },
  infoRow:         { flexDirection: 'row', gap: 6, marginBottom: 6 },
  infoLabel:       { color: '#888', fontSize: 13 },
  infoValue:       { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentBox:      { backgroundColor: '#0F0F23', borderRadius: 10, padding: 12, marginVertical: 8, borderLeftWidth: 3, borderLeftColor: '#F44336' },
  commentBoxLabel: { color: '#F44336', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  commentText:     { color: '#ccc', lineHeight: 20 },
  reasonBox:       { backgroundColor: '#0F0F23', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#FF9800' },
  reasonLabel:     { color: '#FF9800', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  reasonText:      { color: '#E0E0E0', lineHeight: 20 },
  actionRow:       { flexDirection: 'row', gap: 10 },
  acceptBtn:       { flex: 1, backgroundColor: '#1A3A1A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  acceptBtnText:   { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  rejectBtn:       { flex: 1, backgroundColor: '#3A1A1A', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectBtnText:   { color: '#F44336', fontWeight: 'bold', fontSize: 14 },
  emptyBox:        { alignItems: 'center', marginTop: 60 },
  emptyEmoji:      { fontSize: 48, marginBottom: 12 },
  emptyText:       { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtext:    { color: '#888', fontSize: 14, marginTop: 4 },
});
