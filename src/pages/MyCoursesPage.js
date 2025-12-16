import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useSingleCourseProgress } from "../hooks/useCourseProgress";
import { enrollUserInCourse } from '../utils/enrollmentUtils'; // NEW IMPORT

function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false); 
  
  const { progress, completedLessons, loading: loadingProgress } = useSingleCourseProgress(courseId);
  
  
  const checkEnrollmentStatus = async (courseRef) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    const q = query(
      collection(db, "enrollments"),
      where("userId", "==", userId),
      where("courseRef", "==", courseRef)
    );
    const snapshot = await getDocs(q);
    setIsEnrolled(!snapshot.empty);
  };
  
  useEffect(() => {
    async function fetchCourseData() {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        console.error("Course not found!");
        setLoading(false);
        return;
      }
      
      const courseData = courseSnap.data();
      const embeddedLessons = courseData.lessons || [];
      
      setCourse({ 
        id: courseSnap.id, 
        ...courseData, 
        lessons: embeddedLessons, 
        lessonsCount: embeddedLessons.length 
      });

      await checkEnrollmentStatus(courseRef);

      setLoading(false);
    }

    fetchCourseData();
  }, [courseId]);
  

  const handleEnroll = async () => {
    if (isEnrolled) return;
    setEnrollmentLoading(true);
    try {
      await enrollUserInCourse(courseId);
      setIsEnrolled(true); 
      alert("Successfully Enrolled! You can now access your lessons.");
    } catch (error) {
      alert(`Enrollment failed: ${error.message}`);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading || loadingProgress) {
    return <p style={{ textAlign: "center" }}>Loading course structure...</p>;
  }
  
  if (!course) {
    return <p style={{ textAlign: "center" }}>Course not found.</p>;
  }

  const lessons = course.lessons;

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back to Instruments
      </button>

      <h1 style={styles.title}>{course.name}</h1>
      
      {/*  Enrollment Button */}
      <div style={styles.enrollmentSection}>
        <button 
          onClick={handleEnroll}
          disabled={isEnrolled || enrollmentLoading}
          style={isEnrolled ? styles.enrolledButton : styles.enrollButton}
        >
          {enrollmentLoading ? "Processing..." : (isEnrolled ? "✓ Enrolled" : "Enroll Now")}
        </button>
      </div>

      {/* Course Progress only visible if enrolled */}
      {isEnrolled && (
        <div style={styles.progressHeader}>
          <p>Overall Progress:</p>
          <div style={styles.progressBarContainer}>
            <div style={{ ...styles.progressBarFill, width: `${progress}%` }}></div>
          </div>
          <p style={styles.progressText}>{progress}% Complete</p>
        </div>
      )}

      {/* Lesson List */}
      <div style={styles.lessonList}>
        <h2>Lessons ({lessons.length} total)</h2> 
        {lessons.length > 0 ? lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <div
              key={lesson.id}
              // Lessons are only clickable/visible if enrolled
              style={{
                ...styles.lessonCard, 
                borderLeftColor: isCompleted ? '#4caf50' : '#ccc',
                opacity: isEnrolled ? 1 : 0.5,
                cursor: isEnrolled ? 'pointer' : 'default',
              }}
              onClick={() => isEnrolled && navigate(`/course/${courseId}/lesson/${lesson.id}`)}
            >
              <span style={styles.lessonOrder}>{index + 1}.</span>
              <span style={styles.lessonName}>{lesson.name}</span>
              <span style={isCompleted ? styles.completedTag : styles.incompleteTag}>
                {isEnrolled ? (isCompleted ? "✓ Completed" : "Start") : "Locked"}
              </span>
            </div>
          );
        }) : <p>No lessons found for this course.</p>}
      </div>

    </div>
  );
}

export default CoursePage;

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
        marginBottom: "30px",
    },
    enrollmentSection: {
        textAlign: "center",
        marginBottom: "30px",
    },
    enrollButton: {
        padding: "12px 25px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#28a745", 
        color: "#fff",
        fontSize: "18px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
    enrolledButton: {
        padding: "12px 25px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#6c757d", 
        color: "#fff",
        fontSize: "18px",
        fontWeight: "bold",
        cursor: "default",
        opacity: 0.8,
    },
    progressHeader: {
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto 40px",
    },
    progressBarContainer: {
        marginTop: "10px",
        height: "15px",
        backgroundColor: "#e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#4caf50", 
        transition: "width 0.5s ease-in-out",
    },
    progressText: {
        marginTop: "5px",
        fontSize: "14px",
        fontWeight: "bold"
    },
    lessonList: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    lessonCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: "15px 20px",
        margin: "10px 0",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        borderLeft: "5px solid #ccc",
        transition: "opacity 0.1s",
    },
    lessonOrder: {
        fontWeight: "bold",
        marginRight: "15px",
        color: "#555"
    },
    lessonName: {
        flexGrow: 1,
        textAlign: "left"
    },
    completedTag: {
        padding: "5px 10px",
        backgroundColor: "#e8f5e9",
        color: "#4caf50",
        borderRadius: "5px",
        fontWeight: "bold",
        fontSize: "12px",
    },
    incompleteTag: {
        padding: "5px 10px",
        backgroundColor: "#e3f2fd",
        color: "#2196f3",
        borderRadius: "5px",
        fontWeight: "bold",
        fontSize: "12px",
    }
};