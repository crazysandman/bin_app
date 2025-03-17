import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./MapComponent.css";

// Icons definieren
const getBinIcon = (fillLevel) => {
  if (fillLevel <= 33) {
    return new L.Icon({
      iconUrl: "/icons/bin_icon_green.svg",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  } else if (fillLevel <= 66) {
    return new L.Icon({
      iconUrl: "/icons/bin_icon_yellow.svg",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  } else {
    return new L.Icon({
      iconUrl: "/icons/bin_icon_red.svg",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }
};

// Hauptkomponente
const MapComponent = () => {
  const [bins, setBins] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Zustand für den Benutzerstandort
  const [route, setRoute] = useState(null); // Zustand für die Route

  // Benutzerstandort ermitteln
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Fehler bei der Standortermittlung:", error);
        }
      );
    } else {
      console.error("Geolocation wird nicht unterstützt.");
    }
  }, []);

  // Automatische Datenaktualisierung
  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/bins");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API-Antwort:", data); // Logge die Antwort
      setBins(data.filter((b) => b.latitude && b.longitude));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Aktualisierungsfehler:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Alle 5 Minuten aktualisieren
    return () => clearInterval(interval);
  }, []);

  // Route berechnen
  const calculateRoute = (destination) => {
    if (userLocation && destination) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.latitude, userLocation.longitude), // Startpunkt
          L.latLng(destination.latitude, destination.longitude), // Zielpunkt
        ],
        routeWhileDragging: true,
      }).addTo(map);

      setRoute(routingControl);
    }
  };

  return (
    <div className="App">
      <div className="status-bar">
        <div>
          Letzte Aktualisierung: {lastUpdated?.toLocaleTimeString() || "Wird geladen..."}
        </div>
        <button onClick={fetchData} className="refresh-button">
          🔄 Neu laden
        </button>
      </div>

      <MapContainer
        center={userLocation ? [userLocation.latitude, userLocation.longitude] : [52.52, 13.405]} // Zentrierung auf Benutzerstandort oder Berlin
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
        whenCreated={(map) => (window.map = map)} // Map-Instanz global verfügbar machen
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={L.icon({
              iconUrl: "/icons/user_icon.svg", // Icon für den Benutzerstandort
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            })}
          >
            <Popup>Dein Standort</Popup>
          </Marker>
        )}

        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.latitude, bin.longitude]}
            icon={getBinIcon(bin.fill_level)}
            eventHandlers={{
              click: () => calculateRoute(bin), // Route zum Mülleimer berechnen
            }}
          >
            <Popup>
              <div className="popup">
                <h4>{bin.name}</h4>
                <div
                  className="fill-level"
                  style={{
                    width: `${bin.fill_level}%`,
                    backgroundColor:
                      bin.fill_level > 66
                        ? "#f44336"
                        : bin.fill_level > 33
                        ? "#ffc107"
                        : "#4caf50",
                  }}
                />
                <p>{bin.fill_level}% gefüllt</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
