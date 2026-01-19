import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrolledCourses } from '../hooks/useEnrolledCourses';

function MyCoursesPage() {
  const navigate = useNavigate();
  // Fetch the courses using the hook
  const { courses, loading } = useEnrolledCourses();

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading your courses...</p>;
  }

  return (
    <div style={styles.container}>
      {/* Standard Back Button */}
      <button style={styles.backButton} onClick={() => navigate('/main')}>
        ← Back to Instruments
      </button>

      <h1 style={styles.title}>My Enrolled Courses</h1>

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>You haven't enrolled in any courses yet.</p>
          <button style={styles.actionButton} onClick={() => navigate('/main')}>
            Browse Instruments
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {courses.map((course) => (
            <div key={course.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{course.name}</h3>
              <p style={styles.cardDescription}>{course.description}</p>
              <button 
                style={styles.actionButton}
                onClick={() => navigate(`/course/${course.id}`)}
              >
                Continue Learning
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Styles consistent with CoursePage.js and LessonPage.js
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
    padding: "0", 
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'center',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'center',
  },
  cardTitle: {
    margin: '0 0 10px 0',
    color: '#1976d2',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  actionButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
};

export default MyCoursesPage;