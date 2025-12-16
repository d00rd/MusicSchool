import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";


export const markLessonAsComplete = async (courseId, lessonId, totalLessons) => {
    if (!auth.currentUser) {
        throw new Error("User must be logged in to mark progress.");
    }
    
    const userId = auth.currentUser.uid;

    const progressRef = doc(db, "user_progress", `${userId}_${courseId}`);


    const progressDoc = await getDoc(progressRef);
    let completedLessons = progressDoc.exists() ? progressDoc.data().completedLessons || [] : [];
    
    if (completedLessons.includes(lessonId)) {
        return; 
    }


    const newCompletedLessons = [...completedLessons, lessonId];
    

    const newProgressPercentage = totalLessons > 0 
        ? Math.round((newCompletedLessons.length / totalLessons) * 100)
        : 100;


    await setDoc(progressRef, {
        userId,
        courseId,
        completedLessons: newCompletedLessons,
        progressPercentage: newProgressPercentage,
    }, { merge: true }); 
    
    return newProgressPercentage;
};