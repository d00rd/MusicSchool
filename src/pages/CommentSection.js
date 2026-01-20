import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';

function CommentSection({ courseId, lessonId, courseCreatorId, instructorEmail, courseName }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    if (!courseId || !lessonId) return;
    const q = query(
      collection(db, "comments"),
      where("courseId", "==", courseId),
      where("lessonId", "==", String(lessonId)), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [courseId, lessonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) return alert("Please log in.");

    try {
      // 1. Save Comment
      await addDoc(collection(db, "comments"), {
        courseId, lessonId: String(lessonId), text: newComment,
        userEmail: user.email, userId: user.uid, createdAt: serverTimestamp()
      });

      // --- DEBUGGING LOGIC ---
      console.log("--- STARTING NOTIFICATION CHECK ---");
      console.log("1. Current User:", user.email);
      console.log("2. Course Creator ID:", courseCreatorId);
      console.log("3. Instructor Email:", instructorEmail);

      if (courseCreatorId && user.uid !== courseCreatorId) {
          
          // 2. In-App Notification
          await addDoc(collection(db, "notifications"), {
              recipientId: courseCreatorId,
              message: `New comment in ${courseName}: "${newComment.substring(0, 30)}..."`,
              senderEmail: user.email,
              courseId: courseId,
              createdAt: serverTimestamp(),
              read: false
          });
          console.log("✅ In-App Notification Sent");

          // 3. Send Email via Node Server
          if (instructorEmail) {
              console.log("📨 Sending email request to Node server...");
              
              fetch('http://localhost:5000/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      to: instructorEmail,
                      subject: `New Question in ${courseName}`,
                      text: `${user.email} asked: ${newComment}`,
                      html: `<p><strong>${user.email}</strong> asked:</p><p>${newComment}</p>`
                  })
              })
              .then(res => {
                  console.log("📡 Server responded with status:", res.status);
                  return res.json();
              })
              .then(data => console.log("📡 Server data:", data))
              .catch(err => console.error("❌ Network Error (Is Node running?):", err));

          } else {
              console.warn("⚠️ SKIPPING EMAIL: 'instructorEmail' is missing or undefined.");
          }
      } else {
          console.log("ℹ️ Skipping notification: User is the creator.");
      }

      setNewComment(""); 
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Discussion</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question..."
          style={styles.textarea}
        />
        <button type="submit" disabled={!newComment.trim()} style={styles.button}>Post</button>
      </form>
      <div style={styles.list}>
        {comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
                <div style={styles.commentHeader}>
                    <span style={styles.email}>{comment.userEmail}</span>
                    {courseCreatorId && comment.userId === courseCreatorId && (
                       <span style={styles.tutorBadge}>INSTRUCTOR</span>
                    )}
                </div>
                <p style={styles.text}>{comment.text}</p>
            </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' },
  header: { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
  form: { marginBottom: '30px' },
  textarea: { width: '100%', height: '80px', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  button: { backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
  commentCard: { borderBottom: '1px solid #f0f0f0', padding: '15px 0' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#666' },
  email: { fontWeight: 'bold', color: '#333' },
  text: { margin: '0' },
  tutorBadge: { marginLeft: '10px', backgroundColor: '#1976d2', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }
};

export default CommentSection;