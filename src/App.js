import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // Import your Firebase auth
import { onAuthStateChanged } from 'firebase/auth';

// Page Imports
import Login from './pages/Login';
import Main from './pages/Main';
import InstrumentPage from './pages/InstrumentPage';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import VideoTestPage from './pages/VideoTestPage'; 
import MyCoursesPage from './pages/MyCoursesPage'; 
import TutorProfile from './pages/TutorProfile';
import CreateCourse from './pages/CreateCourse';
import AdminDashboard from './pages/AdminDashboard.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{textAlign: 'center', padding: '50px'}}>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/main" />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        
        {/* NEW TEST ROUTE */}
        <Route path="/test-video" element={
          isAuthenticated ? <VideoTestPage /> : <Navigate to="/login" />
        } />
        
        {/* NEW MY COURSES ROUTE */}
        <Route path="/my-courses" element={
          isAuthenticated ? <MyCoursesPage /> : <Navigate to="/login" />
        } />

        {/* Protected Routes */}
        <Route path="/main" element={
          isAuthenticated ? <Main /> : <Navigate to="/login" />
        } />
        <Route path="/instrument/:id" element={
          isAuthenticated ? <InstrumentPage /> : <Navigate to="/login" />
        } />
        <Route path="/course/:courseId" element={
          isAuthenticated ? <CoursePage /> : <Navigate to="/login" />
        } />
        <Route path="/course/:courseId/lesson/:lessonId" element={
          isAuthenticated ? <LessonPage /> : <Navigate to="/login" />
        } />
        <Route path="/tutor/profile" element={
          isAuthenticated ? <TutorProfile /> : <Navigate to="/login" />
        } />
        <Route path="/tutor/create-course" element={
          isAuthenticated ? <CreateCourse /> : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />
          } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;