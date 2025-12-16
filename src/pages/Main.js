import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase'; 
import { signOut } from 'firebase/auth';

function Main() {
    const [instruments, setInstruments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    

    const [userEmail, setUserEmail] = useState(''); 

    useEffect(() => {

        if (auth.currentUser) {
            setUserEmail(auth.currentUser.email || 'Guest User');
        }

       
        async function fetchInstruments() {
            try {
                const querySnapshot = await getDocs(collection(db, "instruments"));
                const instrumentsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInstruments(instrumentsData);
            } catch (error) {
                console.error("Error fetching instruments:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInstruments();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Logout failed. Please try again.");
        }
    };

    if (loading) {
        return <p style={{ textAlign: "center", padding: "50px" }}>Loading instruments...</p>;
    }

    return (
        <div style={styles.container}>
            
            {/* Header: Title, Email, and Buttons */}
            <div style={styles.header}>
                <h1 style={styles.title}>Music Learning App</h1>
                
                <div style={styles.buttonGroup}>
                    <span style={styles.emailDisplay}>{userEmail}</span> 

                    {/* My Courses Button */}
                    <button 
                        onClick={() => navigate('/my-courses')} 
                        style={styles.myCoursesButton}
                    >
                        My Courses
                    </button>
                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout} 
                        style={styles.logoutButton}
                    >
                        Logout
                    </button>
                </div>
            </div>
            
            <h2 style={styles.subtitle}>Choose an Instrument to Start</h2>

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
    container: {
        padding: "40px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1000px',
        margin: '0 auto 40px',
    },
    title: {
        textAlign: "left",
        margin: 0,
    },
    buttonGroup: { 
        display: 'flex',
        gap: '10px',
        alignItems: 'center', 
    },
    emailDisplay: { 
        marginRight: '15px',
        fontSize: '16px',
        color: '#555',
        fontWeight: '600',
    },
    myCoursesButton: {
        padding: '10px 20px',
        backgroundColor: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },
    subtitle: {
        textAlign: "center",
        marginBottom: "30px",
        color: "#555",
    },
    instrumentGrid: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "20px",
    },
    card: {
        width: "250px",
        padding: "30px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        cursor: "pointer",
        textAlign: "center",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
};