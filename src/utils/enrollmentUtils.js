import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc } from 'firebase/firestore';


export const enrollUserInCourse = async (courseId) => {
    if (!auth.currentUser) {
        throw new Error("User must be logged in to enroll.");
    }
    const userId = auth.currentUser.uid;
    

    const q = query(
        collection(db, "enrollments"),
        where("userId", "==", userId),
        where("courseRef", "==", doc(db, "courses", courseId)) 
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        throw new Error("User is already enrolled in this course.");
    }


    const courseRef = doc(db, "courses", courseId);

    await addDoc(collection(db, "enrollments"), {
        userId: userId,
        courseRef: courseRef, 
        enrolledAt: new Date(),
    });
    
    console.log(`User ${userId} successfully enrolled in course ${courseId}`);
    return true;
};