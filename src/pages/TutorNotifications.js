import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

function TutorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        // Get notifications meant for THIS user (the tutor)
        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  const handleMarkRead = async (notificationId) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, { read: true });
      // Update UI locally
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleDelete = async (notificationId) => {
      // (Optional) You could implement delete logic here
      alert("Delete logic not implemented yet, but you can mark as read!");
  };

  if (loading) return <p style={{textAlign:"center", marginTop:"50px"}}>Loading updates...</p>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/main')} style={styles.backButton}>← Back to Dashboard</button>
      
      <h1>My Notifications</h1>
      
      {notifications.length === 0 ? (
        <div style={styles.emptyState}>
            <p>You're all caught up! No new notifications.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map(notif => (
            <div 
                key={notif.id} 
                style={notif.read ? styles.cardRead : styles.cardUnread}
                onClick={() => handleMarkRead(notif.id)}
            >
              <div style={styles.header}>
                 <span style={{fontWeight: 'bold', color: '#1976d2'}}>{notif.senderEmail}</span>
                 <span style={styles.date}>
                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : "Just now"}
                 </span>
              </div>
              <p style={styles.message}>{notif.message}</p>
              
              {!notif.read && <span style={styles.badge}>NEW</span>}
              
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/course/${notif.courseId}`);
                }}
                style={styles.linkButton}
              >
                Go to Course →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TutorNotifications;

const styles = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' },
  backButton: { border: 'none', background: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px' },
  emptyState: { textAlign: 'center', color: '#888', marginTop: '50px' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px' },
  cardUnread: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #1976d2', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  cardRead: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #ccc', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' },
  date: { color: '#888', fontSize: '12px' },
  message: { margin: '5px 0 15px 0', color: '#333' },
  badge: { backgroundColor: '#ff1744', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginRight: '10px' },
  linkButton: { padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }
};