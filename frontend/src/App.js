import React from "react";
import "./App.css";
import MapComponent from "./MapComponent"; // Import der Karte

function App() {
  return (
    <div className="App">
      <h1>Meine Karte</h1>
      <MapComponent /> {/* Hier wird die Karte eingefügt */}
    </div>
  );
}

export default App;
