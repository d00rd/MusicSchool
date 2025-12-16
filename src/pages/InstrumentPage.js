import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useCourseProgress } from "../hooks/useCourseProgress";

function InstrumentPage() {
  const { instrumentId } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);


  const { progressMap, loadingProgress } = useCourseProgress(courses); 

  useEffect(() => {
    async function fetchCourses() {
      const instrumentRef = doc(db, "instruments", instrumentId);
      
      const q = query(
        collection(db, "courses"),
        where("instrument", "==", instrumentRef)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        lessonsCount: doc.data().lessonsCount || 0, 
        ...doc.data(),
      }));

      setCourses(data);
      setLoading(false);
    }

    fetchCourses();
  }, [instrumentId]);


  if (loading || loadingProgress) {
    return <p style={{ textAlign: "center" }}>Loading courses...</p>;
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 style={styles.title}>
        {instrumentId.charAt(0).toUpperCase() + instrumentId.slice(1)} Courses
      </h1>

      <div style={styles.grid}>
        {courses.map(course => {
          const progress = progressMap[course.id] || 0; 
          
          return (
            <div
              key={course.id}
              style={styles.card}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <h2>{course.name}</h2>

              {/* Progress Bar Display */}
              <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBarFill, width: `${progress}%` }}></div>
              </div>
              <p style={styles.progressText}>{progress}% Complete</p>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <p>No courses available for this instrument yet.</p>
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
  },
  backButton: {
    marginBottom: "20px",
    background: "none",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
  },
  title: {
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
    marginTop: "30px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
  progressBarContainer: {
    marginTop: "10px",
    height: "10px",
    backgroundColor: "#e0e0e0",
    borderRadius: "5px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4caf50", 
    transition: "width 0.5s ease-in-out",
  },
  progressText: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#555",
    fontWeight: "bold"
  },
};