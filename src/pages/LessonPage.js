import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSingleCourseProgress } from "../hooks/useCourseProgress";
import { markLessonAsComplete } from "../utils/progressUtils";
import ReactPlayer from 'react-player';

function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoFinished, setVideoFinished] = useState(false); 

  const { completedLessons, loading: loadingProgress } = useSingleCourseProgress(courseId);

  const isCompleted = completedLessons.includes(lessonId);

  useEffect(() => {
    async function fetchData() {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        console.error("Course not found!");
        setLoading(false);
        return;
      }
      
      const courseData = courseSnap.data();
      const lessonsArray = courseData.lessons || [];
      
      
      const foundLesson = lessonsArray.find(l => l.id === lessonId);
      
      if (foundLesson) {
          setLesson(foundLesson);
      } else {
         
          console.error("Lesson not found in embedded array!"); 
      }

      setCourse({ 
        id: courseSnap.id, 
        ...courseData, 
        lessonsCount: lessonsArray.length 
      });

      setLoading(false);
    }

    fetchData();
  }, [courseId, lessonId]);


  const handleMarkComplete = async () => {
    if (!course || !lesson || isCompleted) return; 
    
    try {
      
      await markLessonAsComplete(courseId, lessonId, course.lessonsCount);
      

      navigate(`/course/${courseId}`, { replace: true }); 
    } catch (error) {
      alert("Error updating progress: " + error.message);
    }
  };

  
  const handleVideoEnd = () => {
      setVideoFinished(true); 
  };
  

  const videoUrl = lesson ? lesson.URL || lesson.videoUrl : null;
  
  const buttonText = isCompleted 
    ? "✓ Lesson Already Completed" 
    : videoFinished 
      ? "Mark as Complete and Continue" 
      : "Watch Video to Mark Complete";


  if (loading || loadingProgress) {
    return <p style={{ textAlign: "center" }}>Loading lesson...</p>;
  }

  if (!lesson) {
    return <p style={{ textAlign: "center" }}>Lesson content not found.</p>;
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back to Course
      </button>

      <h1 style={styles.title}>{lesson.name}</h1>
      <p style={styles.courseName}>Course: {course?.name || "Loading..."}</p>

      {/* Video Player - Reverted to ReactPlayer */}
      <div style={styles.videoPlayerWrapper}>
        {videoUrl ? (
          <ReactPlayer 
            url={videoUrl}
            controls={true}
            width="100%"
            height="100%"
            onEnded={handleVideoEnd} 
          />
        ) : (
          <p style={{ color: '#fff', padding: '20px' }}>Video URL not found for this lesson.</p>
        )}
      </div>

      <button 
        onClick={handleMarkComplete}
     
        style={isCompleted ? styles.completedButton : (videoFinished ? styles.completeButton : styles.disabledButton)}
        disabled={isCompleted || !videoFinished}
      >
        {buttonText}
      </button>

      <p style={styles.note}>
        Total Lessons in Course: {course?.lessonsCount || '...'}
      </p>
    </div>
  );
}

export default LessonPage;

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    textAlign: "center",
  },
  backButton: {
    float: "left",
    marginBottom: "20px",
    background: "none",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
  },
  title: {
    marginBottom: "10px",
  },
  courseName: {
    color: "#666",
    marginBottom: "30px",
  },

  videoPlayerWrapper: { 
    width: "100%",
    maxWidth: "800px",
    aspectRatio: "16/9", 
    margin: "0 auto 30px",
    borderRadius: "10px",
    overflow: "hidden", 
  },
  completeButton: {
    padding: "15px 30px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  completedButton: {
    padding: "15px 30px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4caf50",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "default",
    opacity: 0.7,
  },
  disabledButton: { 
    padding: "15px 30px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#9e9e9e",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "not-allowed",
  },
  note: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#888"
  }
};