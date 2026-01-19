import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { auth, googleProvider, db } from "../firebase";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true); 
  const navigate = useNavigate();

  // --- HELPER: Create User Document if Missing ---
  const createUserDocument = async (user) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Only create if it doesn't exist yet
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            role: 'student', // Default role
            displayName: user.displayName || 'User',
            createdAt: new Date()
        });
        console.log("User profile created in database!");
    } else {
        console.log("User profile already exists.");
    }
  };

  // --- 1. STANDARD LOGIN (Updated) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // FIX: Ensure database entry exists even for existing users
      await createUserDocument(userCredential.user);
      
      setIsAuthenticated(true);
      navigate("/main");
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  // --- 2. SIGN UP ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocument(userCredential.user);
        
        setIsAuthenticated(true);
        navigate("/main");
    } catch (error) {
        alert("Sign Up Error: " + error.message);
    }
  };

  // --- 3. GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user);
      
      setIsAuthenticated(true);
      navigate("/main");
    } catch (error) {
      alert("Google Login Error: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{isLoginView ? "Login" : "Sign Up"}</h1>
        
        <form onSubmit={isLoginView ? handleLogin : handleSignUp} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            {isLoginView ? "Login" : "Create Account"}
          </button>
        </form>

        <hr style={styles.hr} />
        
        <button onClick={handleGoogleLogin} style={{ ...styles.button, ...styles.googleButton }}>
          {isLoginView ? "Login with Google" : "Sign Up with Google"}
        </button>

        <div style={styles.toggleContainer}>
            <p>
                {isLoginView ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
                type="button" 
                onClick={() => setIsLoginView(!isLoginView)} 
                style={styles.toggleButton}
            >
                {isLoginView ? "Sign Up here" : "Login here"}
            </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5" },
  card: { backgroundColor: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "300px", textAlign: "center" },
  title: { marginBottom: "20px", color: "#333" },
  form: { display: "flex", flexDirection: "column" },
  input: { marginBottom: "15px", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  button: { padding: "12px", borderRadius: "6px", border: "none", backgroundColor: "#4caf50", color: "#fff", fontSize: "16px", cursor: "pointer", fontWeight: "bold", transition: "background-color 0.2s" },
  googleButton: { backgroundColor: "#4285F4", marginBottom: "20px" },
  hr: { margin: "20px 0", border: "0", borderTop: "1px solid #eee" },
  toggleContainer: { marginTop: "15px", fontSize: "14px" },
  toggleButton: { background: "none", border: "none", color: "#1976d2", cursor: "pointer", padding: "0 5px", fontWeight: "bold" }
};