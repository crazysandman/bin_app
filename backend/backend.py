from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random

app = FastAPI()

# CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Erlaube Anfragen vom Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Verbindung zur SQLite-Datenbank
def get_db_connection():
    conn = sqlite3.connect("bins.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Datenbanktabelle erstellen
def create_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            fill_level INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Endpunkt: 1000 Mülleimer mit realistischen Berlin-Koordinaten generieren
@app.post("/generate_bins")
def generate_bins():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Vorhandene Daten löschen
        cursor.execute("DELETE FROM bins")
        print("Vorhandene Daten gelöscht.")

        # 1000 Mülleimer mit zufälligen Standorten in Berlin und Füllständen generieren
        bins_data = [
            (
                random.uniform(52.33, 52.67),  # Zufällige Latitude (Berlin)
                random.uniform(13.09, 13.76),  # Zufällige Longitude (Berlin)
                random.randint(0, 100)         # Zufälliger Füllstand (0-100)
            )
            for _ in range(1000)
        ]
        print("1000 Mülleimer-Daten mit Berlin-Koordinaten generiert.")

        # Daten in die Datenbank einfügen
        cursor.executemany(
            "INSERT INTO bins (latitude, longitude, fill_level) VALUES (?, ?, ?)",
            bins_data
        )
        print("Daten erfolgreich in die Datenbank eingefügt.")

        # Änderungen bestätigen
        conn.commit()
        print("Transaktion erfolgreich commitet.")

        return {"message": "1000 new bins with Berlin coordinates generated successfully"}
    except sqlite3.Error as e:
        conn.rollback()
        print("Fehler beim Schreiben in die Datenbank:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        print("Datenbankverbindung geschlossen.")

# Endpunkt: Alle Mülleimer abrufen
@app.get("/bins")
def get_bins():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM bins")
        bins = cursor.fetchall()
        print("Daten aus der Datenbank abgerufen:", bins)  # Debugging-Information
        return [dict(bin) for bin in bins]
    except sqlite3.Error as e:
        print("Fehler beim Abrufen der Daten:", e)  # Debugging-Information
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        print("Datenbankverbindung geschlossen.")

# Datenbanktabelle beim Start erstellen
create_table()
