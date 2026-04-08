import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  // Reply State
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${postId}`);
      setComments(res.data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (isReply = false) => {
    const contentToSubmit = isReply ? replyContent : newComment;
    const parentId = isReply ? replyingToId : null;

    if (contentToSubmit.trim().length < 2) {
      Alert.alert('Validation', 'Comment must be at least 2 characters.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/comments', { 
        content: contentToSubmit.trim(), 
        postId, 
        parentCommentId: parentId 
      });
      if (isReply) {
        setReplyContent('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }
      fetchComments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
             try {
               await api.delete(`/comments/${commentId}`);
               fetchComments();
             } catch (err) { Alert.alert('Error', err.message); }
          }
        }
      ]
    );
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditingContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (editingContent.trim().length < 2) {
      Alert.alert('Validation', 'Comment must be at least 2 characters.'); return;
    }
    try {
      await api.put(`/comments/${editingCommentId}`, { content: editingContent.trim() });
      setEditingCommentId(null);
      setEditingContent('');
      fetchComments();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReport = async (commentId) => {
    Alert.prompt('Report Comment', 'Briefly describe your reason:', async (reason) => {
      if (!reason?.trim()) return;
      try {
        await api.post('/reports', { commentId, reason });
        Alert.alert('Reported', 'Comment has been reported for review.');
      } catch (err) { Alert.alert('Error', err.message); }
    });
  };

  const renderComment = (c, isReplyNode = false) => {
    const authorStr = String(c.authorId);
    const isOwner = user && (authorStr === String(user.id) || authorStr === String(user._id));
    const isStaffOrAdmin = user && ['ADMIN', 'STAFF'].includes(user.role);
    const canDelete = isOwner || isStaffOrAdmin;
    const isEditingThis = editingCommentId === c._id;

    return (
      <View key={c._id} style={[styles.commentCard, isReplyNode && styles.replyCard, isEditingThis && styles.commentEditing]}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{c.authorName}</Text>
          <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
        </View>

        {isEditingThis ? (
          <View>
            <TextInput
              style={[styles.input, styles.editTextarea]}
              value={editingContent}
              onChangeText={setEditingContent}
              multiline
              numberOfLines={3}
              maxLength={800}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveEditText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingCommentId(null)}>
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.commentContent}>{c.content}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => {
                 // For 1-level deep, replying to a reply just defaults to replying to the parent thread
                 setReplyingToId(c.parentCommentId || c._id);
                 setReplyContent('');
              }}>
                <Text style={styles.replyText}>💬 Reply</Text>
              </TouchableOpacity>
              
              {isOwner && (
                <TouchableOpacity onPress={() => handleStartEdit(c)}>
                   <Text style={styles.editText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                   <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              {!isOwner && !isStaffOrAdmin && (
                <TouchableOpacity onPress={() => handleReport(c._id)}>
                   <Text style={styles.reportText}>⚑ Report</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="small" color="#6C63FF" /></View>;

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c => c.parentCommentId);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>💬 Comments ({comments.length})</Text>
      
      {topLevelComments.map((topComment) => {
        const threadReplies = replies.filter(r => r.parentCommentId === topComment._id);

        return (
          <View key={topComment._id} style={styles.threadContainer}>
            {/* Top Level Comment */}
            {renderComment(topComment, false)}

            {/* Replies */}
            {threadReplies.map(reply => renderComment(reply, true))}

            {/* Reply Input Box */}
            {replyingToId === topComment._id && (
              <View style={styles.replyInputBox}>
                <TextInput
                  style={[styles.input, styles.textarea, { height: 70 }]}
                  placeholder="Write a reply..."
                  placeholderTextColor="#888"
                  value={replyContent}
                  onChangeText={setReplyContent}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.saveEditBtn} onPress={() => handleAddComment(true)} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveEditText}>Post Reply</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setReplyingToId(null)}>
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Add new top-level comment */}
      <Text style={styles.sectionTitle}>Leave a Comment</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Write your comment..."
        placeholderTextColor="#888"
        value={newComment}
        onChangeText={setNewComment}
        multiline
        numberOfLines={3}
        maxLength={800}
      />
      <TouchableOpacity style={styles.submitBtn} onPress={() => handleAddComment(false)} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Post Comment</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { marginTop: 10 },
  center:          { paddingVertical: 20, alignItems: 'center' },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 4 },
  threadContainer: { marginBottom: 10 },
  
  commentCard:     { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12, marginBottom: 8 },
  replyCard:       { marginLeft: 24, padding: 10, backgroundColor: '#141424', borderLeftWidth: 2, borderLeftColor: '#6C63FF', marginBottom: 6 },
  replyInputBox:   { marginLeft: 24, marginBottom: 10 },
  
  commentEditing:  { borderWidth: 1, borderColor: '#6C63FF' },
  commentHeader:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor:   { color: '#6C63FF', fontWeight: '600', fontSize: 13 },
  commentDate:     { color: '#666', fontSize: 11 },
  commentContent:  { color: '#ccc', lineHeight: 18 },
  
  commentActions:  { flexDirection: 'row', gap: 16, marginTop: 8 },
  replyText:       { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
  editText:        { color: '#6C63FF', fontSize: 12, fontWeight: '600' },
  deleteText:      { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  reportText:      { color: '#FF9800', fontSize: 12 },
  
  editActions:     { flexDirection: 'row', gap: 10, marginTop: 8 },
  saveEditBtn:     { backgroundColor: '#6C63FF', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  saveEditText:    { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelEditBtn:   { backgroundColor: '#2A2A4A', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  cancelEditText:  { color: '#aaa', fontWeight: 'bold', fontSize: 14 },
  editTextarea:    { height: 80, textAlignVertical: 'top', marginBottom: 0 },
  
  input: {
    backgroundColor: '#0F0F23', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A4A', fontSize: 14,
  },
  textarea:        { height: 100, textAlignVertical: 'top' },
  submitBtn:       { backgroundColor: '#6C63FF', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  submitText:      { color: '#fff', fontWeight: '700' },
});
