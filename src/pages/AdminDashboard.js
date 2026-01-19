import React, { useEffect, useState } from 'react';
import { 
  collection, getDocs, updateDoc, deleteDoc, addDoc, doc, 
  query, orderBy 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'instruments'
  const [users, setUsers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  
  // Form state for new instrument
  const [instName, setInstName] = useState("");
  const [instImage, setInstImage] = useState("");
  
  const navigate = useNavigate();

  // 1. Security Check & Data Fetching
  useEffect(() => {
    async function init() {
      // Check if user is admin (you can also do this via a stronger rule later)
      // For now, we rely on the database role check
      if (!auth.currentUser) return navigate('/login');

      // Fetch Users
      const userSnap = await getDocs(collection(db, "users"));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Instruments
      const instSnap = await getDocs(collection(db, "instruments"));
      setInstruments(instSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    init();
  }, [navigate]);

  // --- USER ACTIONS ---
  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'tutor' ? 'student' : 'tutor';
    if(!window.confirm(`Change role from ${currentRole} to ${newRole}?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Error updating role: " + error.message);
    }
  };

  // --- INSTRUMENT ACTIONS ---
  const handleAddInstrument = async (e) => {
    e.preventDefault();
    try {
      const ref = await addDoc(collection(db, "instruments"), {
        name: instName,
        image: instImage || "https://via.placeholder.com/150" // Default placeholder
      });
      setInstruments([...instruments, { id: ref.id, name: instName, image: instImage }]);
      setInstName("");
      setInstImage("");
      alert("Instrument Added!");
    } catch (error) {
      alert("Error adding instrument: " + error.message);
    }
  };

  const handleDeleteInstrument = async (id) => {
    if(!window.confirm("Delete this instrument?")) return;
    try {
      await deleteDoc(doc(db, "instruments", id));
      setInstruments(instruments.filter(i => i.id !== id));
    } catch (error) {
      alert("Error deleting: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/main')} style={styles.backBtn}>← Back to Main</button>
      
      <div style={styles.header}>
        <h1>Admin Dashboard</h1>
        <div style={styles.tabs}>
          <button 
            style={activeTab === 'users' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button 
            style={activeTab === 'instruments' ? styles.activeTab : styles.tab} 
            onClick={() => setActiveTab('instruments')}
          >
            Manage Instruments
          </button>
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div style={styles.section}>
          <h2>All Users ({users.length})</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Current Role</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.displayName}</td>
                    <td style={styles.td}>
                      <span style={user.role === 'tutor' ? styles.badgeTutor : user.role === 'admin' ? styles.badgeAdmin : styles.badgeStudent}>
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => toggleRole(user.id, user.role)} 
                          style={styles.actionBtn}
                        >
                          {user.role === 'tutor' ? 'Demote to Student' : 'Promote to Tutor'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- INSTRUMENTS TAB --- */}
      {activeTab === 'instruments' && (
        <div style={styles.section}>
          <h2>Manage Instruments</h2>
          
          {/* Add Form */}
          <form onSubmit={handleAddInstrument} style={styles.addForm}>
            <input 
              placeholder="Instrument Name (e.g. Violin)" 
              value={instName}
              onChange={e => setInstName(e.target.value)}
              style={styles.input}
              required
            />
            <input 
              placeholder="Image URL (optional)" 
              value={instImage}
              onChange={e => setInstImage(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.addBtn}>+ Add Instrument</button>
          </form>

          {/* List */}
          <div style={styles.instGrid}>
            {instruments.map(inst => (
              <div key={inst.id} style={styles.instCard}>
                <span style={{fontWeight: 'bold'}}>{inst.name}</span>
                <button onClick={() => handleDeleteInstrument(inst.id)} style={styles.deleteBtn}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' },
  backBtn: { border: 'none', background: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px' },
  header: { marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' },
  tabs: { display: 'flex', gap: '10px', marginTop: '15px' },
  tab: { padding: '10px 20px', border: 'none', backgroundColor: '#eee', cursor: 'pointer', borderRadius: '5px' },
  activeTab: { padding: '10px 20px', border: 'none', backgroundColor: '#333', color: 'white', cursor: 'pointer', borderRadius: '5px' },
  
  section: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  
  // Table Styles
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee', color: '#555' },
  td: { padding: '12px', borderBottom: '1px solid #eee' },
  tr: { '&:last-child td': { borderBottom: 'none' } },
  
  badgeStudent: { backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeTutor: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  badgeAdmin: { backgroundColor: '#fce4ec', color: '#c2185b', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' },
  
  actionBtn: { padding: '6px 12px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' },
  
  // Instrument Styles
  addForm: { display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
  input: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' },
  addBtn: { padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  
  instGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
  instCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '6px' },
  deleteBtn: { color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }
};