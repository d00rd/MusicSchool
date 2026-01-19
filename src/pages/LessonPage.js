import React, { useEffect, useState, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSingleCourseProgress } from "../hooks/useCourseProgress";
import { markLessonAsComplete } from "../utils/progressUtils";
import CommentSection from './CommentSection';


// --- PROGRESS-TRACKING VIDEO PLAYER ---
const VideoPlayer = memo(({ url, onProgress, onEnded }) => {
  const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));

  // 1. YouTube Listener (Time & End Detection)
  useEffect(() => {
    if (!isYouTube) return;

    const handleMessage = (event) => {
      if (!event.origin.includes("youtube") && !event.origin.includes("youtube-nocookie")) return;

      try {
        const data = JSON.parse(event.data);

        // A. Detect "Ended" State
        if (data.event === "onStateChange" && data.info === 0) {
          onEnded();
        }

        // B. Detect Progress (infoDelivery often contains currentTime & duration)
        if (data.event === "infoDelivery" && data.info) {
          const { currentTime, duration } = data.info;
          if (currentTime && duration) {
            const percent = (currentTime / duration) * 100;
            onProgress(percent);
          }
        }
      } catch (err) {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isYouTube, onProgress, onEnded]);

  const getYouTubeId = (link) => {
    if (!link) return null;
    const match = link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (!url) return <div style={{color: 'white', padding: '20px'}}>No Video Available</div>;

  if (isYouTube) {
    const videoId = getYouTubeId(url);
    return (
      <iframe
        key={videoId} 
        width="100%"
        height="100%"
        // enablejsapi=1 is REQUIRED for tracking time
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`}
        title="Lesson Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    );
  }

  // 2. Native HTML5 Player (Firebase/MP4)
  // This is very reliable for progress tracking
  return (
    <video 
      src={url} 
      controls 
      width="100%" 
      height="100%"
      onEnded={onEnded}
      onTimeUpdate={(e) => {
         const { currentTime, duration } = e.target;
         if (duration > 0) {
           const percent = (currentTime / duration) * 100;
           onProgress(percent);
         }
      }}
      style={{ outline: 'none', backgroundColor: 'black' }}
    >
      Your browser does not support the video tag.
    </video>
  );
}, (prev, next) => prev.url === next.url);


function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State to track if video requirements are met
  const [videoFinished, setVideoFinished] = useState(false); 

  const { completedLessons, loading: loadingProgress } = useSingleCourseProgress(courseId);
  const isCompleted = completedLessons.includes(lessonId);

  useEffect(() => {
    let isMounted = true; 
    async function fetchData() {
      try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        
        if (!isMounted) return;

        if (!courseSnap.exists()) {
          setLoading(false);
          return;
        }
        
        const courseData = courseSnap.data();
        const lessonsArray = courseData.lessons || [];
        const foundLesson = lessonsArray.find(l => String(l.id) === String(lessonId));
        
        if (foundLesson) setLesson(foundLesson);

        setCourse({ 
          id: courseSnap.id, 
          ...courseData, 
          lessonsCount: lessonsArray.length 
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
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

  // --- PROGRESS HANDLER ---
  // Unlocks the button if progress > 60% OR video ends
  const handleProgress = (percent) => {
     // You can change '60' to any percentage you want
     if (percent > 60 && !videoFinished) {
         setVideoFinished(true);
         console.log(`Video unlocked at ${Math.round(percent)}%`);
     }
  };

  const videoUrl = lesson ? (lesson.URL || lesson.videoUrl || lesson.url || lesson.link) : null;
  const canComplete = isCompleted || videoFinished;

  if (loading || loadingProgress) return <p style={{textAlign: "center", marginTop: "50px"}}>Loading lesson...</p>;
  if (!lesson) return <p style={{textAlign: "center", marginTop: "50px"}}>Lesson content not found.</p>;

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back to Course
      </button>

      <h1 style={styles.title}>{lesson.name}</h1>
      <p style={styles.courseName}>Course: {course?.name}</p>

      {/* VIDEO PLAYER */}
      <div style={styles.videoPlayerWrapper}>
        <VideoPlayer 
          url={videoUrl} 
          onProgress={handleProgress}
          onEnded={() => setVideoFinished(true)} 
        />
      </div>

      <div style={styles.controlsArea}>
        {/* Helper Text */}
        {!canComplete && (
           <p style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
             Watch at least 60% of the video to unlock.
           </p>
        )}

        {/* Manual Fallback (Just in case specific browsers block tracking) */}
        {!canComplete && (
           <div style={styles.fallbackBox}>
             <label style={styles.checkboxLabel}>
               <input 
                  type="checkbox" 
                  style={{transform: "scale(1.3)", marginRight: "10px", cursor: "pointer"}}
                  onChange={(e) => setVideoFinished(e.target.checked)}
               />
               I have finished watching
             </label>
           </div>
        )}

        <button 
          onClick={handleMarkComplete}
          style={isCompleted ? styles.completedButton : (canComplete ? styles.completeButton : styles.disabledButton)}
          disabled={!canComplete}
        >
          {isCompleted ? "✓ Lesson Completed" : (canComplete ? "Mark as Complete & Continue" : "Locked")}
        </button>
      </div>
      <CommentSection courseId={courseId} lessonId={lessonId} />
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
    fontFamily: "sans-serif",
  },
  backButton: {
    float: "left",
    marginBottom: "20px",
    background: "none",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
  title: {
    marginBottom: "10px",
    clear: "both",
    color: "#333",
  },
  courseName: {
    color: "#666",
    marginBottom: "30px",
  },
  videoPlayerWrapper: { 
    width: "100%",
    maxWidth: "800px",
    aspectRatio: "16/9", 
    margin: "0 auto 20px",
    borderRadius: "12px",
    overflow: "hidden", 
    backgroundColor: "#000",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
  },
  controlsArea: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px"
  },
  fallbackBox: {
    backgroundColor: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333"
  },
  completeButton: {
    padding: "15px 40px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1976d2",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(25, 118, 210, 0.3)",
    transition: "transform 0.1s",
  },
  completedButton: {
    padding: "15px 40px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4caf50",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "default",
    opacity: 0.9,
  },
  disabledButton: { 
    padding: "15px 40px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#cfd8dc",
    color: "#90a4ae",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "not-allowed",
  }
};