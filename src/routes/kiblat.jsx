import { createSignal, onMount, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
  calculateQiblaBearing,
  calculateDistanceToKaaba,
  getCompassDirectionName,
  KAABA_COORDS,
} from "../lib/qibla";
import { getSelectedCity } from "../lib/storage";

export default function Kiblat() {
  const navigate = useNavigate();

  // Coordinates & Qibla Data
  const [coordinates, setCoordinates] = createSignal(null);
  const [locationName, setLocationName] = createSignal("Mendeteksi lokasi...");
  const [qiblaBearing, setQiblaBearing] = createSignal(295); // Default approx for Indonesia
  const [distanceKm, setDistanceKm] = createSignal(null);
  const [loadingGps, setLoadingGps] = createSignal(true);
  const [gpsError, setGpsError] = createSignal(null);

  // Sensor & Orientation
  const [deviceHeading, setDeviceHeading] = createSignal(0);
  const [compassRotation, setCompassRotation] = createSignal(0);
  const [hasSensor, setHasSensor] = createSignal(false);
  const [needsIosPermission, setNeedsIosPermission] = createSignal(false);
  const [isAligned, setIsAligned] = createSignal(false);
  const [isDarkMode, setIsDarkMode] = createSignal(true);

  // Unwrapped angle state to prevent 360-degree spin flickers
  let lastHeading = null;
  let accumulatedRotation = 0;
  let hasVibrated = false;
  let orientationListener = null;

  onMount(async () => {
    // 1. Sync theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    } else {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }

    // 2. Fetch Location & Qibla Bearing
    initLocation();

    // 3. Setup Orientation Sensor
    checkSensorSupport();
  });

  onCleanup(() => {
    if (orientationListener) {
      window.removeEventListener("deviceorientationabsolute", orientationListener);
      window.removeEventListener("deviceorientation", orientationListener);
    }
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode();
    setIsDarkMode(newMode);
    if (newMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  };

  // Location detection
  const initLocation = () => {
    setLoadingGps(true);
    setGpsError(null);

    const savedCity = getSelectedCity();

    if (!navigator.geolocation) {
      fallbackToCityOrDefault(savedCity, "Geolocation tidak didukung browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        applyCoordinates(lat, lng, savedCity?.lokasi || "Lokasi Anda (GPS)");
        setLoadingGps(false);
      },
      (error) => {
        console.warn("GPS error, using fallback city if available:", error);
        fallbackToCityOrDefault(savedCity, "Izin lokasi GPS tidak aktif");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const fallbackToCityOrDefault = async (savedCity, errorReason) => {
    setLoadingGps(false);
    if (savedCity && savedCity.lokasi) {
      setLocationName(savedCity.lokasi);
      setGpsError(`${errorReason}. Mencoba koordinat ${savedCity.lokasi}.`);
      
      // Attempt to geocode the city name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            savedCity.lokasi + ", Indonesia"
          )}&limit=1`
        );
        const data = await res.json();
        if (data && data[0]) {
          applyCoordinates(parseFloat(data[0].lat), parseFloat(data[0].lon), savedCity.lokasi);
          setGpsError(null);
          return;
        }
      } catch (e) {
        console.warn("Geocoding failed:", e);
      }
    }

    // Default fallback: Jakarta coordinates
    setGpsError(`${errorReason}. Menampilkan estimasi arah untuk Indonesia (Jakarta).`);
    applyCoordinates(-6.2088, 106.8456, savedCity?.lokasi || "Indonesia (Jakarta)");
  };

  const applyCoordinates = (lat, lng, label) => {
    setCoordinates({ latitude: lat, longitude: lng });
    setLocationName(label);
    const bearing = calculateQiblaBearing(lat, lng);
    const dist = calculateDistanceToKaaba(lat, lng);
    setQiblaBearing(Math.round(bearing * 10) / 10);
    setDistanceKm(dist);
  };

  // Sensor handling
  const checkSensorSupport = () => {
    // iOS 13+ requires user gesture permission request
    if (
      typeof window !== "undefined" &&
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      setNeedsIosPermission(true);
      return;
    }

    // Android or standard browsers
    startOrientationListener();
  };

  const requestIosPermission = async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setNeedsIosPermission(false);
          startOrientationListener();
        } else {
          alert("Izin sensor orientasi ditolak.");
        }
      }
    } catch (error) {
      console.error("Error requesting orientation permission:", error);
    }
  };

  const startOrientationListener = () => {
    let receivedFirstReading = false;

    orientationListener = (event) => {
      let heading = null;

      if (typeof event.webkitCompassHeading !== "undefined" && event.webkitCompassHeading !== null) {
        // iOS Safari (webkitCompassHeading: 0 is North, clockwise)
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null && typeof event.alpha !== "undefined") {
        // Android / W3C Device Orientation (alpha increases counter-clockwise)
        heading = (360 - event.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        if (!receivedFirstReading) {
          receivedFirstReading = true;
          setHasSensor(true);
        }

        const normalizedHeading = (heading + 360) % 360;
        setDeviceHeading(Math.round(normalizedHeading));

        // Smooth angle unwrapping to eliminate 360 <-> 0 jump spins
        if (lastHeading === null) {
          lastHeading = normalizedHeading;
          accumulatedRotation = -normalizedHeading;
        } else {
          let diff = normalizedHeading - lastHeading;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          accumulatedRotation -= diff;
          lastHeading = normalizedHeading;
        }

        setCompassRotation(accumulatedRotation);

        // Check alignment with Kaaba (within ±3 degrees)
        let angleDiff = (qiblaBearing() - normalizedHeading + 360) % 360;
        if (angleDiff > 180) angleDiff -= 360;

        const aligned = Math.abs(angleDiff) <= 3;
        setIsAligned(aligned);

        // Haptic feedback when aligned
        if (aligned && !hasVibrated) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            try {
              navigator.vibrate(80);
            } catch (e) {
              // Ignore vibration error on unsupported platforms
            }
          }
          hasVibrated = true;
        } else if (!aligned) {
          hasVibrated = false;
        }
      }
    };

    // Prefer deviceorientationabsolute on Android Chrome for absolute orientation
    if ("ondeviceorientationabsolute" in window) {
      window.addEventListener("deviceorientationabsolute", orientationListener, true);
    } else if ("ondeviceorientation" in window) {
      window.addEventListener("deviceorientation", orientationListener, true);
    }
  };

  // Turn recommendation
  const getAlignmentGuidance = () => {
    if (!hasSensor()) {
      return {
        type: "manual",
        text: `Arahkan kompas fisik atau perangkat ke ${qiblaBearing()}° (${getCompassDirectionName(qiblaBearing())})`,
      };
    }

    let diff = (qiblaBearing() - deviceHeading() + 360) % 360;
    if (diff > 180) diff -= 360;

    if (Math.abs(diff) <= 3) {
      return {
        type: "aligned",
        text: "Tepat Menghadap Kiblat! 🕋",
      };
    }

    const roundedDiff = Math.round(Math.abs(diff));
    if (diff > 0) {
      return {
        type: "turning",
        text: `Putar ke kanan ${roundedDiff}°`,
      };
    } else {
      return {
        type: "turning",
        text: `Putar ke kiri ${roundedDiff}°`,
      };
    }
  };

  // Generate SVG Compass Degree Ticks (every 30 degrees and 10 degrees)
  const renderCompassTicks = () => {
    const ticks = [];
    for (let deg = 0; deg < 360; deg += 10) {
      const isMajor = deg % 30 === 0;
      const length = isMajor ? 10 : 5;
      const angleRad = ((deg - 90) * Math.PI) / 180;
      const rOuter = 135;
      const rInner = rOuter - length;
      const cx = 145;
      const cy = 145;
      const x1 = cx + rOuter * Math.cos(angleRad);
      const y1 = cy + rOuter * Math.sin(angleRad);
      const x2 = cx + rInner * Math.cos(angleRad);
      const y2 = cy + rInner * Math.sin(angleRad);

      ticks.push(
        <line
          class={`dial-tick ${isMajor ? "major" : "minor"}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        />
      );
    }
    return ticks;
  };

  return (
    <div class="kiblat-page">
      {/* Header */}
      <header class="kiblat-header">
        <div class="kiblat-header-left">
          <button class="btn-icon-back" onClick={() => navigate("/")} title="Kembali">
            <span class="material-icons">arrow_back</span>
          </button>
          <h1 class="kiblat-title">Arah Kiblat</h1>
        </div>

        <button class="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
          <div
            style={{
              width: "48px",
              height: "28px",
              background: isDarkMode() ? "#2C2C2E" : "#E2E8F0",
              "border-radius": "99px",
              position: "relative",
              display: "flex",
              "align-items": "center",
              border: isDarkMode() ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: isDarkMode() ? "4px" : "24px",
                width: "20px",
                height: "20px",
                background: "white",
                "border-radius": "50%",
                display: "flex",
                "justify-content": "center",
                "align-items": "center",
                "box-shadow": "0 2px 4px rgba(0,0,0,0.2)",
                transition: "left 0.3s ease",
              }}
            >
              <span class="material-icons" style="font-size: 12px; color: black;">
                {isDarkMode() ? "wb_sunny" : "nightlight_round"}
              </span>
            </div>
          </div>
        </button>
      </header>

      {/* Info Summary Card */}
      <section class="kiblat-info-card">
        <div class="kiblat-info-grid">
          <div class="info-item">
            <span class="info-label">Lokasi Saat Ini</span>
            <div class="info-value" style={{ "font-size": "1rem" }}>
              <span class="material-icons" style={{ "font-size": "1.1rem", color: "#2ecc71" }}>
                location_on
              </span>
              <span style={{ "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", "max-width": "140px" }}>
                {locationName()}
              </span>
            </div>
            <span class="info-subtext">
              {coordinates()
                ? `${coordinates().latitude.toFixed(3)}°, ${coordinates().longitude.toFixed(3)}°`
                : "Mencari GPS..."}
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">Sudut Kiblat</span>
            <div class="info-value">
              <span>{qiblaBearing()}°</span>
              <span style={{ "font-size": "0.85rem", color: "#94a3b8", "font-weight": "400" }}>
                {getCompassDirectionName(qiblaBearing())}
              </span>
            </div>
            <span class="info-subtext">
              {distanceKm() ? `± ${distanceKm().toLocaleString("id-ID")} km ke Mekkah` : "Menghitung jarak..."}
            </span>
          </div>
        </div>
      </section>

      {/* Turn Guidance Banner */}
      <div class={`guidance-banner ${getAlignmentGuidance().type}`}>
        <span class="material-icons" style={{ "font-size": "1.2rem" }}>
          {getAlignmentGuidance().type === "aligned"
            ? "check_circle"
            : getAlignmentGuidance().type === "turning"
            ? "navigation"
            : "explore"}
        </span>
        <span>{getAlignmentGuidance().text}</span>
      </div>

      {/* Visual Compass */}
      <div class="compass-wrapper">
        {/* Fixed Phone Forward Pointer (Top of device) */}
        <div class="phone-pointer"></div>

        {/* Glow Ring when Aligned */}
        <div class={`compass-glow ${isAligned() ? "active" : ""}`}></div>

        {/* Rotating Compass Disc */}
        <div
          class="compass-disc"
          style={{
            transform: hasSensor()
              ? `rotate(${compassRotation()}deg)`
              : `rotate(0deg)`,
          }}
        >
          {/* Dial Ticks SVG */}
          <svg class="compass-dial-svg" viewBox="0 0 290 290">
            {renderCompassTicks()}
          </svg>

          {/* Cardinal Directions */}
          <span class="cardinal-mark north">U</span>
          <span class="cardinal-mark east">T</span>
          <span class="cardinal-mark south">S</span>
          <span class="cardinal-mark west">B</span>

          {/* Kaaba Marker fixed on the compass disc at qiblaBearing angle */}
          <div
            class="kaaba-pointer-container"
            style={{ transform: `rotate(${qiblaBearing()}deg)` }}
          >
            <div class="kaaba-radial-beam"></div>
            <div class="kaaba-indicator">
              <div class={`kaaba-badge ${isAligned() ? "kaaba-badge-aligned" : ""}`}>
                <span>🕋</span>
                <span>Kiblat</span>
              </div>
              <div class="kaaba-needle-arrow"></div>
            </div>
          </div>
        </div>

        {/* Center Cap */}
        <div class="compass-center-cap">
          <span class="center-degree-text">
            {hasSensor() ? `${deviceHeading()}°` : `${qiblaBearing()}°`}
          </span>
          <span class="center-label-text">
            {hasSensor() ? "Hadap" : "Kiblat"}
          </span>
        </div>
      </div>

      {/* Actions & Instructions */}
      <div class="kiblat-actions">
        {needsIosPermission() && (
          <button class="btn-kiblat-primary" onClick={requestIosPermission}>
            <span class="material-icons">sensors</span>
            <span>Aktifkan Sensor Kompas (iOS)</span>
          </button>
        )}

        <button class="btn-kiblat-secondary" onClick={initLocation}>
          <span class="material-icons" style={{ "font-size": "1rem" }}>
            my_location
          </span>
          <span>{loadingGps() ? "Memperbarui GPS..." : "Perbarui Akurasi GPS"}</span>
        </button>

        <div class="calibration-tip">
          <span class="material-icons">info</span>
          <div>
            <strong>Panduan Penggunaan:</strong> Letakkan perangkat mendatar (sejajar lantai). Jika arah terasa kurang akurat, gerakkan perangkat membentuk angka <strong>8</strong> di udara untuk kalibrasi kompas.
          </div>
        </div>
      </div>
    </div>
  );
}
