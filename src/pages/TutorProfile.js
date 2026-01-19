import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

function TutorProfile() {
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.role !== 'tutor') {
           alert("Access Denied: You are not a tutor.");
           navigate('/main');
           return;
        }
        setBio(data.bio || "");
        setDisplayName(data.displayName || "");
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", user.uid), {
        bio,
        displayName,
        role: 'tutor', 
        email: user.email
      }, { merge: true });
      alert("Profile Updated!");
      navigate('/main'); // Auto-redirect back after save
    } catch (error) {
      alert("Error saving profile: " + error.message);
    }
  };

  if (loading) return <p style={{textAlign: "center", marginTop: "50px"}}>Loading...</p>;

  return (
    <div style={styles.container}>
      {/* 1. BACK BUTTON */}
      <button onClick={() => navigate('/main')} style={styles.backButton}>
        ← Back to Dashboard
      </button>

      <h1>Tutor Profile</h1>
      <form onSubmit={handleSave} style={styles.form}>
        <label style={styles.label}>Display Name</label>
        <input 
          style={styles.input}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Professor Smith"
        />

        <label style={styles.label}>Bio / Experience</label>
        <textarea 
          style={styles.textarea}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell students about your experience..."
        />

        <button type="submit" style={styles.button}>Save Profile</button>
      </form>
    </div>
  );
}

export default TutorProfile;

const styles = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '10px', fontFamily: 'sans-serif' },
  backButton: { background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  label: { fontWeight: 'bold' },
  input: { padding: '10px', fontSize: '16px' },
  textarea: { padding: '10px', fontSize: '16px', minHeight: '150px' },
  button: { padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '5px' }
};