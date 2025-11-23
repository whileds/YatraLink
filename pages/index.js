
import { useEffect, useState } from "react";
import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { getDistance } from "geolib";

export default function Home() {

  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestBus, setNearestBus] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [delay, setDelay] = useState(null);
  const [weather, setWeather] = useState("Checking...");
  const [roadCondition, setRoadCondition] = useState("Normal");

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  // USER LOCATION (LIVE)
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // GET BUSES FROM FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "buses"), (snap) => {
      let list = [];

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.lat && d.lng) {
          list.push({
            id: doc.id,
            lat: d.lat,
            lng: d.lng,
            email: d.email
          });
        }
      });

      setBuses(list);
    });

    return () => unsub();
  }, []);

  // WEATHER + ROAD CONDITION
  useEffect(() => {
    if (!userLocation) return;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current_weather=true`
    )
      .then(res => res.json())
      .then(data => {
        if (!data?.current_weather) return;

        const code = data.current_weather.weathercode;

        let condition = "Clear";
        let road = "Normal";

        if ([61,63,65].includes(code)) {
          condition = "Rainy";
          road = "Slippery";
        }
        else if ([71,73,75].includes(code)) {
          condition = "Snow";
          road = "Very Dangerous";
        }
        else if ([45,48].includes(code)) {
          condition = "Fog";
          road = "Low Visibility";
        }

        setWeather(condition);
        setRoadCondition(road);
      })
      .catch(() => {
        setWeather("Unavailable");
        setRoadCondition("Unknown");
      });

  }, [userLocation]);

  // AI PREDICTION
  useEffect(() => {
    if (!userLocation || buses.length === 0) return;

    let nearest = null;
    let minDist = Infinity;

    buses.forEach(bus => {
      const d = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: bus.lat, longitude: bus.lng }
      );

      if (d < minDist) {
        minDist = d;
        nearest = bus;
      }
    });

    if (!nearest) return;

    const km = minDist / 1000;
    const hour = new Date().getHours();

    // AI SPEED PREDICTION
    let speed = 35;

    if (hour >= 7 && hour <= 10) speed = 16;
    else if (hour >= 17 && hour <= 20) speed = 18;
    else if (hour >= 22 || hour <= 5) speed = 45;

    if (weather === "Rainy") speed -= 6;
    if (weather === "Fog") speed -= 10;
    if (speed < 10) speed = 10; // never allow too low

    const minutes = (km / speed) * 60;

    // AI CROWD PREDICTION
    let crowdLevel = "LOW";
    if (hour >= 7 && hour <= 10) crowdLevel = "HIGH";
    else if (hour >= 12 && hour <= 15) crowdLevel = "MEDIUM";
    else if (hour >= 17 && hour <= 20) crowdLevel = "HIGH";

    // AI DELAY
    let delayStatus = minutes > 30 ? "Delay expected" : "On time";

    setNearestBus(nearest);
    setDistance(km.toFixed(2));
    setEta(minutes.toFixed(1));
    setCrowd(crowdLevel);
    setDelay(delayStatus);

  }, [userLocation, buses, weather]);

  if (!isLoaded) return <h2>Loading map...</h2>;

  const center = userLocation || { lat: 28.6139, lng: 77.2090 };
  const styles = {
  page: {
    height: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    padding: "20px",
    gap: "20px",
  },

  left: {
    width: "35%",
    color: "white",
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)",
  },

  right: {
    width: "65%",
    padding: "10px",
    borderRadius: "20px",
    background: "white",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)"
  },

  title: {
    fontSize: "2.2rem",
    marginBottom: "20px",
  },

  infoBox: {
    background: "rgba(255,255,255,0.15)",
    padding: "20px",
    borderRadius: "15px",
    lineHeight: "2rem",
    fontSize: "1.1rem"
  },

  note: {
    marginTop: "20px",
    fontSize: "0.9rem",
    opacity: 0.7
  }
};

  return (
  <div style={styles.page}>
    {/* LEFT PANEL */}
    <div style={styles.left}>
      <h1 style={styles.title}>🚌 AI Bus Tracking</h1>

      <div style={styles.infoBox}>
        <p><b>🌤 Weather:</b> {weather}</p>
        <p><b>🛣 Road:</b> {roadCondition}</p>
        {distance && <p><b>📍 Nearest Bus:</b> {distance} km</p>}
        {eta && <p><b>⏱ AI ETA:</b> {eta} min</p>}
        {crowd && <p><b>👥 Crowd:</b> {crowd}</p>}
        {delay && <p><b>⚠ Status:</b> {delay}</p>}
      </div>

      <p style={styles.note}>
        * Live data fetched from Firebase & Open-Meteo AI system
      </p>
    </div>

    {/* RIGHT PANEL - MAP */}
    <div style={styles.right}>
      <GoogleMap
        center={center}
        zoom={13}
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "15px" }}
      >
        {userLocation && <Marker position={userLocation} label="You" />}

        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            label="Bus"
          />
        ))}

        {nearestBus && userLocation && (
          <Polyline
            path={[
              userLocation,
              { lat: nearestBus.lat, lng: nearestBus.lng }
            ]}
            options={{
              strokeColor: "red",
              strokeOpacity: 0.8,
              strokeWeight: 4
            }}
          />
        )}

      </GoogleMap>
    </div>
  </div>
);

}



// import { useEffect, useState } from "react";
// import dynamic from "next/dynamic";
// import { collection, onSnapshot } from "firebase/firestore";
// import { db } from "../lib/firebaseConfig";
// import { getDistance } from "geolib";
// //import L from "leaflet";

// // ✅ STEP 1 — dynamic imports (NO SSR)
// const MapContainer = dynamic(() =>
//   import("react-leaflet").then((mod) => mod.MapContainer),
//   { ssr: false }
// );

// const TileLayer = dynamic(() =>
//   import("react-leaflet").then((mod) => mod.TileLayer),
//   { ssr: false }
// );

// const Marker = dynamic(() =>
//   import("react-leaflet").then((mod) => mod.Marker),
//   { ssr: false }
// );

// const Popup = dynamic(() =>
//   import("react-leaflet").then((mod) => mod.Popup),
//   { ssr: false }
// );

// const Polyline = dynamic(() =>
//   import("react-leaflet").then((mod) => mod.Polyline),
//   { ssr: false }
// );

// // ✅ STEP 2 — Fix marker icon
// // delete L.Icon.Default.prototype._getIconUrl;

// // L.Icon.Default.mergeOptions({
// //   iconRetinaUrl:
// //     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
// //   iconUrl:
// //     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
// //   shadowUrl:
// //     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// // });

// export default function Home() {

//   const [buses, setBuses] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [nearestBus, setNearestBus] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [crowd, setCrowd] = useState(null);
//   const [delay, setDelay] = useState(null);
//   const [weather, setWeather] = useState("Checking...");
//   const [roadCondition, setRoadCondition] = useState("Normal");

//   // USER LOCATION
//   useEffect(() => {
//     if (!navigator.geolocation) return alert("GPS not supported");

//     const id = navigator.geolocation.watchPosition(
//       (pos) => {
//         setUserLocation({
//           lat: pos.coords.latitude,
//           lng: pos.coords.longitude
//         });
//       },
//       (err) => console.log(err),
//       { enableHighAccuracy: true }
//     );

//     return () => navigator.geolocation.clearWatch(id);
//   }, []);

//   // GET BUSES
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "buses"), (snap) => {
//       const list = [];
//       snap.forEach((doc) => {
//         const d = doc.data();
//         if (d.lat && d.lng) {
//           list.push({
//             id: doc.id,
//             lat: d.lat,
//             lng: d.lng,
//             email: d.email
//           });
//         }
//       });
//       setBuses(list);
//     });
//     return () => unsub();
//   }, []);

//   // WEATHER
//   useEffect(() => {
//     if (!userLocation) return;

//     fetch(
//       `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current_weather=true`
//     )
//       .then(res => res.json())
//       .then(data => {
//         if (!data?.current_weather) return;

//         const code = data.current_weather.weathercode;

//         let condition = "Clear";
//         let road = "Normal";

//         if ([61,63,65].includes(code)) {
//           condition = "Rainy";
//           road = "Slippery";
//         } else if ([45,48].includes(code)) {
//           condition = "Fog";
//           road = "Low Visibility";
//         }

//         setWeather(condition);
//         setRoadCondition(road);
//       });
//   }, [userLocation]);

//   // AI LOGIC
//   useEffect(() => {
//     if (!userLocation || buses.length === 0) return;

//     let nearest = null;
//     let minDist = Infinity;

//     buses.forEach(bus => {
//       const d = getDistance(
//         { latitude: userLocation.lat, longitude: userLocation.lng },
//         { latitude: bus.lat, longitude: bus.lng }
//       );

//       if (d < minDist) {
//         minDist = d;
//         nearest = bus;
//       }
//     });

//     if (!nearest) return;

//     const km = minDist / 1000;
//     const hour = new Date().getHours();

//     let speed = 35;
//     if (hour >= 7 && hour <= 10) speed = 16;
//     else if (hour >= 17 && hour <= 20) speed = 18;

//     if (weather === "Rainy") speed -= 6;
//     if (weather === "Fog") speed -= 10;
//     if (speed < 10) speed = 10;

//     const minutes = (km / speed) * 60;

//     let crowdLevel = "LOW";
//     if (hour >= 7 && hour <= 10) crowdLevel = "HIGH";
//     else if (hour >= 17 && hour <= 20) crowdLevel = "HIGH";

//     let delayStatus = minutes > 30 ? "Delay expected" : "On time";

//     setNearestBus(nearest);
//     setDistance(km.toFixed(2));
//     setEta(minutes.toFixed(1));
//     setCrowd(crowdLevel);
//     setDelay(delayStatus);

//   }, [userLocation, buses, weather]);

//   if (!userLocation) return <h2>Waiting for GPS...</h2>;

//   return (
//     <div style={{ padding: 15 }}>
//       <h2>AI Bus Tracking System (OpenStreetMap)</h2>

//       <h3>Weather: {weather}</h3>
//       <h3>Road: {roadCondition}</h3>
//       {distance && <h3>Nearest Bus: {distance} km</h3>}
//       {eta && <h3>AI ETA: {eta} min</h3>}
//       {crowd && <h3>Crowd Level: {crowd}</h3>}
//       {delay && <h3>Status: {delay}</h3>}

//       <MapContainer
//         center={[userLocation.lat, userLocation.lng]}
//         zoom={13}
//         style={{ height: "80vh", width: "100%" }}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution="© OpenStreetMap contributors"
//         />

//         <Marker position={[userLocation.lat, userLocation.lng]}>
//           <Popup>You are here</Popup>
//         </Marker>

//         {buses.map(bus => (
//           <Marker key={bus.id} position={[bus.lat, bus.lng]}>
//             <Popup>Bus: {bus.email}</Popup>
//           </Marker>
//         ))}

//         {nearestBus && (
//           <Polyline
//             positions={[
//               [userLocation.lat, userLocation.lng],
//               [nearestBus.lat, nearestBus.lng]
//             ]}
//             pathOptions={{ color: "red" }}
//           />
//         )}
//       </MapContainer>
//     </div>
//   );
// }

