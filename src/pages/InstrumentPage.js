import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function InstrumentPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [instrument, setInstrument] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Instrument Details
        const instRef = doc(db, "instruments", id);
        const instSnap = await getDoc(instRef);
        
        if (instSnap.exists()) {
          setInstrument({ id: instSnap.id, ...instSnap.data() });
        }

        // 2. Fetch Courses for this Instrument
        const q = query(
          collection(db, "courses"), 
          where("instrumentId", "==", id) 
        );
        
        const querySnapshot = await getDocs(q);
        
        // 3. FETCH CREATOR NAMES
        // We use Promise.all to fetch the User info for every course in parallel
        const coursesWithAuthors = await Promise.all(querySnapshot.docs.map(async (courseDoc) => {
          const courseData = courseDoc.data();
          let authorName = "Unknown Tutor";

          // If there is a creatorId, fetch that user's profile
          if (courseData.creatorId) {
            try {
              const userRef = doc(db, "users", courseData.creatorId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                authorName = userSnap.data().displayName || "Unknown Tutor";
              }
            } catch (err) {
              console.error("Error fetching tutor:", err);
            }
          }

          return {
            id: courseDoc.id,
            ...courseData,
            authorName: authorName // <--- We add the name to the course object
          };
        }));
        
        setCourses(coursesWithAuthors);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <p style={{textAlign: "center", marginTop: "50px"}}>Loading courses...</p>;
  if (!instrument) return <p style={{textAlign: "center", marginTop: "50px"}}>Instrument not found.</p>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/main')} style={styles.backButton}>
        ← Back to Instruments
      </button>

      <h1 style={styles.title}>{instrument.name} Courses</h1>
      <p style={styles.subtitle}>Select a course to start learning</p>

      {courses.length === 0 ? (
        <div style={styles.emptyState}>
            <p>No courses available for {instrument.name} yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {courses.map(course => (
            <div 
              key={course.id} 
              style={styles.card}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div>
                <h2 style={styles.courseTitle}>{course.name}</h2>
                {/* NEW: Display the Tutor's Name */}
                <p style={styles.tutorName}>By {course.authorName}</p> 
                <p style={styles.description}>{course.description}</p>
              </div>

              <div style={styles.footer}>
                 <span style={styles.badge}>{course.lessonsCount || 0} Lessons</span>
                 <span style={styles.arrow}>Start →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstrumentPage;

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  title: {
    color: "#333",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "25px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "180px"
  },
  courseTitle: {
    fontSize: "20px",
    margin: "0 0 5px 0",
    color: "#2c3e50",
  },
  tutorName: {
    fontSize: "14px",
    color: "#1976d2",
    fontWeight: "bold",
    margin: "0 0 15px 0",
  },
  description: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #eee",
    paddingTop: "15px",
  },
  badge: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  arrow: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: "14px",
  },
  emptyState: {
    textAlign: "center",
    color: "#888",
    marginTop: "50px",
    fontSize: "18px",
  }
};