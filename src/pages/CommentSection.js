import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

function CommentSection({ courseId, lessonId, courseCreatorId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    // Debugging Logs
    console.log("--- CommentSection Mounted ---");
    console.log("Course ID:", courseId);
    console.log("Lesson ID:", lessonId);

    if (!courseId || !lessonId) return;

    // QUERY: Note that we convert lessonId to String to ensure matching works
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
      console.log("Fetched Comments:", fetchedComments); // See if data comes back
      setComments(fetchedComments);
    }, (error) => {
        console.error("Firebase Query Error:", error);
    });

    return () => unsubscribe();
  }, [courseId, lessonId]);

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
        lessonId: String(lessonId), // Always save as String
        text: newComment,
        userEmail: user.email,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewComment(""); 
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment");
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Discussion</h3>

      {/* Input Form */}
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

      {/* List */}
      <div style={styles.list}>
        {comments.length === 0 ? (
            <p style={{color: '#888', fontStyle: 'italic'}}>No comments yet.</p>
        ) : (
            comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
                <div style={styles.commentHeader}>
                    <span style={styles.email}>
                        {comment.userEmail}
                        {/* Tutor Badge Logic */}
                        {courseCreatorId && comment.userId === courseCreatorId && (
                           <span style={styles.tutorBadge}>🎓 INSTRUCTOR</span>
                        )}
                    </span>
                    <span style={styles.date}>
                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : "Just now"}
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
  container: { maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: '20px', backgroundColor: '#fff', borderRadius: '10px' },
  header: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', color: '#333' },
  form: { marginBottom: '30px' },
  textarea: { width: '100%', height: '80px', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  button: { backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  commentCard: { borderBottom: '1px solid #f0f0f0', padding: '15px 0' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#666' },
  email: { fontWeight: 'bold', color: '#333' },
  text: { margin: '0', fontSize: '15px', lineHeight: '1.4' },
  tutorBadge: { marginLeft: '10px', backgroundColor: '#1976d2', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', verticalAlign: 'middle' }
};

export default CommentSection;