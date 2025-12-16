import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';

export function useEnrolledCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }
            const userId = auth.currentUser.uid;
            

            const enrollmentQuery = query(
                collection(db, "enrollments"),
                where("userId", "==", userId)
            );

            const enrollmentSnapshot = await getDocs(enrollmentQuery);
            const coursePromises = [];

            enrollmentSnapshot.forEach(doc => {
                const courseRef = doc.data().courseRef; 
                coursePromises.push(getDoc(courseRef));
            });

            const courseSnaps = await Promise.all(coursePromises);
            
            const enrolledCourses = courseSnaps
                .filter(snap => snap.exists())
                .map(snap => ({
                    id: snap.id,
                    ...snap.data(),
                }));

            setCourses(enrolledCourses);
            setLoading(false);
        };

        fetchEnrolledCourses();
    }, []); 

    return { courses, loading };
}