import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";


export function useCourseProgress(courses) {
  const [progressMap, setProgressMap] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId || courses.length === 0) {
      setLoadingProgress(false);
      return;
    }

    async function fetchProgress() {
      const courseIds = courses.map(c => c.id);

      // Query for all relevant user progress documents
      const q = query(
        collection(db, "user_progress"),
        where("userId", "==", userId),
        where("courseId", "in", courseIds)
      );

      const snapshot = await getDocs(q);
      const newProgressMap = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        newProgressMap[data.courseId] = data.progressPercentage || 0;
      });

    
      courseIds.forEach(id => {
        if (newProgressMap[id] === undefined) {
          newProgressMap[id] = 0;
        }
      });
      
      setProgressMap(newProgressMap);
      setLoadingProgress(false);
    }

    fetchProgress();
  }, [userId, courses]); 

  return { progressMap, loadingProgress };
}

export function useSingleCourseProgress(courseId) {
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId || !courseId) {
      setLoading(false);
      return;
    }

    const fetchSingleProgress = async () => {
      const progressRef = doc(db, "user_progress", `${userId}_${courseId}`);
      const docSnap = await getDoc(progressRef);
      
      if (docSnap.exists()) {
          const data = docSnap.data();
          setProgress(data.progressPercentage || 0);
          setCompletedLessons(data.completedLessons || []);
      }
      setLoading(false);
    };

    fetchSingleProgress();
  }, [userId, courseId]);

  return { progress, completedLessons, loading };
}