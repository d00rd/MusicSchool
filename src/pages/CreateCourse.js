import React, { useState, useEffect } from 'react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  query, where, getDocs, serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

function CreateCourse() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- STATE ---
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [courses, setCourses] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [lessons, setLessons] = useState([]);

  // --- 1. FETCH DATA ON LOAD ---
  useEffect(() => {
    async function initData() {
      if (!user) return;
      try {
        // A. Fetch Instruments
        const instSnap = await getDocs(collection(db, "instruments"));
        setInstruments(instSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

        // B. Fetch Tutor's Courses
        const q = query(collection(db, "courses"), where("creatorId", "==", user.uid));
        const courseSnap = await getDocs(q);
        setCourses(courseSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [user]);

  // --- 2. ACTION HANDLERS ---

  // Switch to "Create New" Mode
  const handleStartCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setSelectedInstrument("");
    setLessons([{ id: Date.now(), name: "", videoUrl: "" }]);
    setView('editor');
  };

  // Switch to "Edit" Mode
  const handleStartEdit = (course) => {
    setEditingId(course.id);
    setName(course.name);
    setDescription(course.description);
    setSelectedInstrument(course.instrumentId || "");
    setLessons(course.lessons || []);
    setView('editor');
  };

  // Delete Course
  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "courses", courseId));
      setCourses(courses.filter(c => c.id !== courseId)); // Update UI
    } catch (error) {
      alert("Error deleting: " + error.message);
    }
  };

  // Save (Create OR Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedInstrument) return alert("Select an instrument.");

    const courseData = {
      name,
      description,
      instrumentId: selectedInstrument,
      lessons,
      lessonsCount: lessons.length,
      creatorId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        // UPDATE existing
        await updateDoc(doc(db, "courses", editingId), courseData);
        alert("Course Updated!");
        // Update local list
        setCourses(courses.map(c => c.id === editingId ? { ...c, ...courseData, id: editingId } : c));
      } else {
        // CREATE new
        courseData.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, "courses"), courseData);
        alert("Course Created!");
        // Add to local list
        setCourses([...courses, { ...courseData, id: ref.id }]);
      }
      setView('list'); // Go back to list
    } catch (error) {
      alert("Error saving: " + error.message);
    }
  };

  // Lesson Form Helpers
  const updateLesson = (idx, field, val) => {
    const newLessons = [...lessons];
    newLessons[idx][field] = val;
    setLessons(newLessons);
  };
  const addLesson = () => setLessons([...lessons, { id: Date.now(), name: "", videoUrl: "" }]);
  const removeLesson = (idx) => setLessons(lessons.filter((_, i) => i !== idx));


  // --- 3. RENDER ---
  if (loading) return <p style={{textAlign:"center", marginTop: "50px"}}>Loading Dashboard...</p>;

  return (
    <div style={styles.container}>
      {/* HEADER NAVIGATION */}
      <div style={styles.header}>
        <button onClick={() => navigate('/main')} style={styles.backButton}>← Back to Main</button>
        {view === 'editor' && (
           <button onClick={() => setView('list')} style={styles.cancelButton}>Cancel & Return to List</button>
        )}
      </div>

      {/* VIEW 1: LIST OF COURSES */}
      {view === 'list' && (
        <>
          <div style={styles.listHeader}>
             <h1>My Courses</h1>
             <button onClick={handleStartCreate} style={styles.createButton}>+ Create New Course</button>
          </div>

          {courses.length === 0 ? (
            <div style={styles.emptyState}>
                <p>You haven't created any courses yet.</p>
                <button onClick={handleStartCreate} style={styles.linkButton}>Create your first one now</button>
            </div>
          ) : (
            <div style={styles.grid}>
              {courses.map(course => (
                <div key={course.id} style={styles.card}>
                  <h3 style={styles.cardTitle}>{course.name}</h3>
                  <p style={styles.cardInfo}>{course.lessonsCount || 0} Lessons</p>
                  <div style={styles.cardActions}>
                    <button onClick={() => handleStartEdit(course)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(course.id)} style={styles.delBtn}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: EDITOR FORM */}
      {view === 'editor' && (
        <div style={styles.editorContainer}>
          <h1>{editingId ? "Edit Course" : "Create New Course"}</h1>
          <form onSubmit={handleSave}>
            
            <div style={styles.formGroup}>
                <label>Instrument</label>
                <select 
                    style={styles.select}
                    value={selectedInstrument} 
                    onChange={e => setSelectedInstrument(e.target.value)}
                    required
                >
                    <option value="">-- Select Instrument --</option>
                    {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
            </div>

            <div style={styles.formGroup}>
                <label>Course Name</label>
                <input style={styles.input} value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
                <label>Description</label>
                <textarea style={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div style={styles.lessonsSection}>
                <h3>Course Lessons</h3>
                {lessons.map((l, i) => (
                    <div key={i} style={styles.lessonRow}>
                        <span style={styles.lessonNum}>{i + 1}</span>
                        <input 
                            placeholder="Lesson Title" 
                            style={styles.lessonInput} 
                            value={l.name} 
                            onChange={e => updateLesson(i, 'name', e.target.value)} 
                            required 
                        />
                        <input 
                            placeholder="Video URL" 
                            style={styles.lessonInput} 
                            value={l.videoUrl} 
                            onChange={e => updateLesson(i, 'videoUrl', e.target.value)} 
                            required 
                        />
                        <button type="button" onClick={() => removeLesson(i)} style={styles.removeBtn}>X</button>
                    </div>
                ))}
                <button type="button" onClick={addLesson} style={styles.addLessonBtn}>+ Add Lesson</button>
            </div>

            <div style={styles.formActions}>
                <button type="button" onClick={() => setView('list')} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Save Course</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CreateCourse;

const styles = {
  container: { maxWidth: '1000px', margin: '30px auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  backButton: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '15px' },
  cancelButton: { background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '15px' },
  
  // List View Styles
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  createButton: { backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
  emptyState: { textAlign: 'center', padding: '50px', backgroundColor: '#f9f9f9', borderRadius: '10px' },
  linkButton: { background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: '16px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #eee' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '18px' },
  cardInfo: { color: '#666', fontSize: '14px', marginBottom: '20px' },
  cardActions: { display: 'flex', gap: '10px' },
  editBtn: { flex: 1, padding: '8px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  delBtn: { padding: '8px 12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer' },

  // Editor Styles
  editorContainer: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  formGroup: { marginBottom: '20px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
  select: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
  textarea: { width: '100%', padding: '10px', marginTop: '5px', height: '100px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
  
  lessonsSection: { marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  lessonRow: { display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' },
  lessonNum: { fontWeight: 'bold', width: '20px' },
  lessonInput: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
  removeBtn: { backgroundColor: '#ffcdd2', border: 'none', color: '#c62828', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' },
  addLessonBtn: { marginTop: '10px', background: 'none', border: '1px dashed #999', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },

  formActions: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '15px' },
  saveBtn: { backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#ddd', color: '#333', border: 'none', padding: '12px 20px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }
};