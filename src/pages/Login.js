import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      navigate("/main");
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };


  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        setIsAuthenticated(true);
        navigate("/main");
    } catch (error) {
        alert("Sign Up Error: " + error.message);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
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

        {/* Toggle Button */}
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
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "300px",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginBottom: "15px",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#4caf50",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s"
  },
  googleButton: {
    backgroundColor: "#4285F4",
    marginBottom: "20px",
  },
  hr: { 
    margin: "20px 0", 
    border: "0", 
    borderTop: "1px solid #eee" 
  },
  toggleContainer: {
      marginTop: "15px",
      fontSize: "14px"
  },
  toggleButton: {
      background: "none",
      border: "none",
      color: "#1976d2",
      cursor: "pointer",
      padding: "0 5px",
      fontWeight: "bold",
  }
};