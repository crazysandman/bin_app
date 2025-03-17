import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./MapComponent.css";

// Icons definieren
const userIcon = new L.Icon({
  iconUrl: "/icons/location.svg",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

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

// Komponenten
const UpdateMapView = ({ userLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (userLocation) map.flyTo(userLocation, 16);
  }, [userLocation, map]);
  return null;
};

const Routing = ({ userLocation, selectedBin }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !selectedBin) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(selectedBin.latitude, selectedBin.longitude),
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: { styles: [{ color: "#FF5722", weight: 5 }] },
    }).addTo(map);

    return () => map.removeControl(control);
  }, [userLocation, selectedBin, map]);

  return null;
};

// Hauptkomponente
const MapComponent = () => {
  const [bins, setBins] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

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

  // Standortverfolgung
  useEffect(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setAccuracy(position.coords.accuracy);
      },
      (error) => console.error("Standortfehler:", error),
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="App">
      <div className="status-bar">
        <div>
          Letzte Aktualisierung: {lastUpdated?.toLocaleTimeString() || "Wird geladen..."}
          {accuracy && ` | Genauigkeit: ${Math.round(accuracy)}m`}
        </div>
        <button onClick={fetchData} className="refresh-button">
          🔄 Neu laden
        </button>
      </div>

      <MapContainer
        center={userLocation || [52.52, 13.405]}
        zoom={13}
        style={{ height: "80vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Dein Standort</Popup>
          </Marker>
        )}

        {bins.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.latitude, bin.longitude]}
            icon={getBinIcon(bin.fill_level)}
            eventHandlers={{
              click: () => setSelectedBin(bin),
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

        <UpdateMapView userLocation={userLocation} />
        <Routing userLocation={userLocation} selectedBin={selectedBin} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;