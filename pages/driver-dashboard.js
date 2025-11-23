

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

// DISTANCE FUNCTION
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(2);
}

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("OFF");

  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  const watchIdRef = useRef(null);

  // CHECK LOGIN
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/driver-login";
      } else {
        setUser(currentUser);
      }
    });

    return () => unsub();
  }, []);

  // GET USER LOCATION (PASSENGER SIDE)
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  // START TRACKING
  const startTracking = async () => {
    if (!navigator.geolocation) return alert("GPS not supported");

    setStatus("ON");

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // CALCULATE DISTANCE FROM USER
        if (userLocation) {
          const d = getDistance(
            lat,
            lng,
            userLocation.lat,
            userLocation.lng
          );
          setDistance(d);
        }

        // SAVE BUS LOCATION
        const docRef = doc(db, "buses", user.uid);
        await setDoc(
          docRef,
          {
            email: user.email,
            lat,
            lng,
            status: "on_trip",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      },
      (err) => {
        alert(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 20000,
      }
    );

    watchIdRef.current = watchId;
  };

  // END TRACKING
  const stopTracking = async () => {
    setStatus("OFF");

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (user) {
      const docRef = doc(db, "buses", user.uid);
      await deleteDoc(docRef);
    }

    alert("Trip Stopped");
  };
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #7790d4ff, #3c5895ff)"
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    width: "360px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },

  title: {
    marginBottom: "10px",
    fontWeight: "700"
  },

  subText: {
    color: "gray",
    fontSize: "14px",
    marginBottom: "15px"
  },

  status: {
    padding: "10px",
    borderRadius: "20px",
    color: "white",
    fontWeight: "bold",
    margin: "15px 0",
    letterSpacing: "2px"
  },

  distanceBox: {
    background: "#f1f5f9",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px"
  },

  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },

  btn: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    minWidth: "120px"
  }
};

  return (
  <div style={styles.page}>
    <div style={styles.card}>
      <h1 style={styles.title}>Driver Dashboard</h1>

      {user && <p style={styles.subText}>👤 {user.email}</p>}

      <div
        style={{
          ...styles.status,
          backgroundColor: status === "ON" ? "#16a34a" : "#dc2626"
        }}
      >
        {status}
      </div>

      {distance && (
        <div style={styles.distanceBox}>
          <h2 style={{ margin: 0 }}>📍 Distance to User</h2>
          <h1 style={{ margin: "5px 0", color: "#2563eb" }}>
            {distance} km
          </h1>
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button
          onClick={startTracking}
          disabled={status === "ON"}
          style={{
            ...styles.btn,
            background: status === "ON" ? "#9ca3af" : "#16a34a"
          }}
        >
          ▶ START TRIP
        </button>

        <button
          onClick={stopTracking}
          disabled={status === "OFF"}
          style={{
            ...styles.btn,
            background: status === "OFF" ? "#9ca3af" : "#dc2626"
          }}
        >
          ⏹ END TRIP
        </button>
      </div>
    </div>
  </div>
);
}

