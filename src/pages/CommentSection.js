import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

function CommentSection({ courseId, lessonId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const user = auth.currentUser;

  // 1. Fetch Comments in Real-Time
  useEffect(() => {
    if (!courseId || !lessonId) return;

    // Query: Get comments for THIS course and THIS lesson, ordered by newest first
    const q = query(
      collection(db, "comments"),
      where("courseId", "==", courseId),
      where("lessonId", "==", String(lessonId)), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [courseId, lessonId]);

  // 2. Handle New Comment Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
        alert("You must be logged in to comment.");
        return;
    }

    try {
      await addDoc(collection(db, "comments"), {
        courseId: courseId,
        lessonId: String(lessonId), // Ensure it's stored as a string
        text: newComment,
        userEmail: user.email,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewComment(""); // Clear input
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment");
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Discussion</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question or share your thoughts..."
          style={styles.textarea}
        />
        <button type="submit" disabled={!newComment.trim()} style={styles.button}>
          Post Comment
        </button>
      </form>

      {/* Comments List */}
      <div style={styles.list}>
        {comments.length === 0 ? (
            <p style={{color: '#888', fontStyle: 'italic'}}>No comments yet. Be the first!</p>
        ) : (
            comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
                <div style={styles.commentHeader}>
                    <span style={styles.email}>{comment.userEmail}</span>
                    <span style={styles.date}>
                        {comment.createdAt?.toDate().toLocaleDateString()}
                    </span>
                </div>
                <p style={styles.text}>{comment.text}</p>
            </div>
            ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    textAlign: 'left',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  },
  header: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
  form: { marginBottom: '30px' },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  button: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  commentCard: {
    borderBottom: '1px solid #f0f0f0',
    padding: '15px 0',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '12px',
    color: '#666'
  },
  email: { fontWeight: 'bold', color: '#333' },
  text: { margin: '0', fontSize: '15px', lineHeight: '1.4' }
};

export default CommentSection;