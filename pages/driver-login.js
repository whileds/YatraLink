import { useState } from "react";
import { auth } from "../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";

export default function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const loginDriver = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Success ✅");
      router.push("/driver-dashboard");
    } catch (error) {
      alert(error.message);
    }
  };
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e40af, #2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    background: "white",
    padding: "40px",
    borderRadius: "18px",
    width: "380px",
    textAlign: "center",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
  },

  title: {
    marginBottom: "10px",
    fontWeight: "800",
    fontSize: "26px",
  },

  subtitle: {
    color: "gray",
    marginBottom: "25px",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "bold",
    fontSize: "15px",
    color: "white",
    cursor: "pointer",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
  },
};

 return (
  <div style={styles.page}>
    <div style={styles.card}>
      <h1 style={styles.title}>🚍 Driver Login</h1>
      <p style={styles.subtitle}>Secure access for bus drivers</p>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      <button onClick={loginDriver} style={styles.button}>
        LOGIN
      </button>
    </div>
  </div>
);

}
