import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth';

function Main() {
    const [instruments, setInstruments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('student'); // 'student', 'tutor', or 'admin'
    const [userEmail, setUserEmail] = useState(''); 
    
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.currentUser) {
            setUserEmail(auth.currentUser.email || 'User');
            checkUserRole(auth.currentUser.uid);
        }

        // 1. Check Role
        async function checkUserRole(uid) {
            try {
                const docRef = doc(db, "users", uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRole(docSnap.data().role || 'student');
                }
            } catch (error) {
                console.error("Error checking role:", error);
            }
        }

        // 2. Fetch Instruments
        async function fetchInstruments() {
            try {
                const querySnapshot = await getDocs(collection(db, "instruments"));
                setInstruments(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error("Error fetching instruments:", error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchInstruments();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    if (loading) return <p style={{textAlign:"center", padding:"50px"}}>Loading...</p>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Music Learning App</h1>
                
                <div style={styles.buttonGroup}>
                    <span style={styles.emailDisplay}>{userEmail}</span> 

                    {/* ADMIN BUTTON */}
                    {role === 'admin' && (
                        <button 
                            onClick={() => navigate('/admin')} 
                            style={styles.adminButton}
                        >
                            ⚙️ Admin Panel
                        </button>
                    )}

                    {/* TUTOR BUTTONS */}
                    {(role === 'tutor' || role === 'admin') && (
                        <button onClick={() => navigate('/tutor/create-course')} style={styles.tutorButton}>
                            Manage Courses
                        </button>
                    )}

                    <button onClick={() => navigate('/my-courses')} style={styles.myCoursesButton}>
                        My Learning
                    </button>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>
            
            <h2 style={styles.subtitle}>Choose an Instrument</h2>
            <div style={styles.instrumentGrid}>
                {instruments.map(instrument => (
                    <div 
                        key={instrument.id} 
                        style={styles.card}
                        onClick={() => navigate(`/instrument/${instrument.id}`)}
                    >
                        <h2>{instrument.name}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Main;

const styles = {
    container: { padding: "40px", backgroundColor: "#f0f2f5", minHeight: "100vh" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { margin: 0, fontSize: '24px' },
    buttonGroup: { display: 'flex', gap: '10px', alignItems: 'center' },
    emailDisplay: { marginRight: '15px', fontSize: '14px', color: '#555', fontWeight: '600' },
    myCoursesButton: { padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    tutorButton: { padding: '8px 16px', backgroundColor: '#673ab7', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    adminButton: { padding: '8px 16px', backgroundColor: '#212121', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }, // Dark/Black button for Admin
    logoutButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    subtitle: { textAlign: "center", marginBottom: "30px", color: "#555" },
    instrumentGrid: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" },
    card: { width: "250px", padding: "30px", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", cursor: "pointer", textAlign: "center", transition: "transform 0.2s" },
};