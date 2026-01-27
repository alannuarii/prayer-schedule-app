import { createSignal, onMount, onCleanup, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { getSelectedCity } from "../lib/storage";
import { fetchPrayerSchedule, getTodayDate } from "../lib/api";

export default function Home() {
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [prayerData, setPrayerData] = createSignal(null);
  const [cityData, setCityData] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  const [nextPrayer, setNextPrayer] = createSignal(null);
  const [activePrayer, setActivePrayer] = createSignal(null);
  const [progress, setProgress] = createSignal(0);
  const [isDarkMode, setIsDarkMode] = createSignal(true); 
  const [countdown, setCountdown] = createSignal(null);
  const [countdownMode, setCountdownMode] = createSignal('default'); // 'entering', 'after', 'before', 'default'

  // Update clock every second
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  onCleanup(() => clearInterval(timer));

  onMount(async () => {
    // 1. Theme Preference
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

    // 2. Location Check
    const city = getSelectedCity();
    if (!city) {
      navigate("/lokasi", { replace: true });
      return;
    }
    setCityData(city);
    
    // 3. Fetch Prayer Times
    try {
      const today = getTodayDate();
      const data = await fetchPrayerSchedule(city.id, today);
      setPrayerData(data.jadwal);
      calculatePrayerStatus(data.jadwal);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  });

  // Re-calculate prayer status when current time updates
  createEffect(() => {
    // Calling currentTime() here makes this effect track every second
    const time = currentTime();
    if (prayerData()) {
      calculatePrayerStatus(prayerData());
    }
  });

  const calculatePrayerStatus = (jadwal) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    const prayers = [
      { name: "Imsak", time: jadwal.imsak, icon: "schedule" },
      { name: "Subuh", time: jadwal.subuh, icon: "dark_mode" },
      { name: "Terbit", time: jadwal.terbit, icon: "wb_twilight" },
      { name: "Dhuha", time: jadwal.dhuha, icon: "wb_sunny" },
      { name: "Dzuhur", time: jadwal.dzuhur, icon: "wb_sunny" },
      { name: "Ashar", time: jadwal.ashar, icon: "wb_sunny" },
      { name: "Maghrib", time: jadwal.maghrib, icon: "nights_stay" },
      { name: "Isya", time: jadwal.isya, icon: "bedtime" }
    ];

    let upcoming = null;
    let current = null;

    for (let i = 0; i < prayers.length; i++) {
      const p = prayers[i];
      const [ph, pm] = p.time.split(':').map(Number);
      const pMinutes = ph * 60 + pm;

      if (pMinutes > currentTimeMinutes) {
        upcoming = p;
        current = i > 0 ? prayers[i-1] : prayers[prayers.length-1]; 
        
        const prevP = i > 0 ? prayers[i-1] : null;
        if (prevP) {
            const [pph, ppm] = prevP.time.split(':').map(Number);
            const ppMinutes = pph * 60 + ppm;
            const totalDuration = pMinutes - ppMinutes;
            const elapsed = currentTimeMinutes - ppMinutes;
            const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            setProgress(percentage);
        }
        break;
      }
    }

    if (!upcoming) {
      upcoming = prayers[0];
      current = prayers[prayers.length - 1]; 
      setProgress(100);
    }

    // Precise timing in seconds for smooth countdown/countup
    const currentTimeSeconds = currentHours * 3600 + currentMinutes * 60 + now.getSeconds();
    
    // Calculate seconds for Current and Next
    const [ch, cm] = current.time.split(':').map(Number);
    let cSeconds = ch * 3600 + cm * 60;
    
    const [uh, um] = upcoming.time.split(':').map(Number);
    let uSeconds = uh * 3600 + um * 60;

    // Handle wrap around (Isya -> next day Imsak)
    if (uSeconds <= cSeconds) {
      if (currentTimeSeconds >= cSeconds) {
        uSeconds += 86400; // Next is tomorrow
      } else {
        cSeconds -= 86400; // Current was yesterday
      }
    }

    const elapsed = currentTimeSeconds - cSeconds;
    const remaining = uSeconds - currentTimeSeconds;

    if (elapsed >= 0 && elapsed < 60) {
      setCountdownMode('entering');
      setCountdown(null);
    } else if (elapsed > 0 && elapsed <= 1800) {
      setCountdownMode('after');
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      setCountdown(`${m} Menit ${s} Detik`);
    } else if (remaining > 0 && remaining <= 1800) {
      setCountdownMode('before');
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setCountdown(`${m} Menit ${s} Detik`);
    } else {
      setCountdownMode('default');
      setCountdown(null);
    }

    setNextPrayer(upcoming);
    setActivePrayer(current);
  };

  const resetLocation = () => {
    localStorage.removeItem("selectedCity");
    navigate("/lokasi", { replace: true });
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };
    
  const hijriDate = () => {
    try {
      const date = currentTime();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura-nu-latn', options);
      return formatter.format(date) + " H";
    } catch (e) {
      return prayerData()?.tanggal || "";
    }
  };

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

  return (
    <div class="home-page">
      {/* Header */}
      <header class="home-header">
        <div class="main-clock-section">
          <div>
            <h1 class="main-clock">
              {currentTime().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
            </h1>
            <p class="date-display">
              {formatDate(currentTime())} | {hijriDate()}
            </p>
            <div class="location-info">
              <span class="material-icons">location_on</span>
              <span class="city-name">{cityData()?.lokasi || "Memuat..."}</span>
              <button class="reset-btn" onClick={resetLocation}>
                <span class="material-icons">refresh</span>
                Ganti
              </button>
            </div>
          </div>
          <button class="theme-toggle" onClick={toggleTheme}>
             <div style={{
                width: "48px",
                height: "28px",
                background: "#2C2C2E",
                "border-radius": "99px",
                position: "relative",
                display: "flex",
                "align-items": "center",
                border: "1px solid rgba(255,255,255,0.05)",
                transition: "all 0.3s ease"
             }}>
                <div style={{
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
                    transition: "left 0.3s ease"
                }}>
                    <span class="material-icons" style="font-size: 12px; color: black;">
                        {isDarkMode() ? "wb_sunny" : "nightlight_round"}
                    </span>
                </div>
             </div>
          </button>
        </div>
      </header>

      {/* Active Prayer Card */}
      {activePrayer() && nextPrayer() && (
        <section class="active-prayer-card">
          <div class="prayer-glow"></div>
          
          <div class="card-header">
            <h2 class="prayer-name-large">{activePrayer().name}</h2>
            <span class="prayer-status">(Waktu {activePrayer().name} Sedang Berjalan)</span>
          </div>
          
          <div class="progress-container">
            <div class="progress-bar" style={{ width: `${progress()}%` }}></div>
            <div class="progress-thumb" style={{ left: `${progress()}%` }}>
                <span class="material-icons" style="font-size: 14px; color: white;">timer</span>
            </div>
          </div>
          
            <div class="time-labels">
            <span>
              {countdownMode() === 'entering' && <>Waktu Memasuki <span class="countdown-tag">{activePrayer().name}</span></>}
              {countdownMode() === 'after' && <>± <span class="countdown-tag">{countdown()}</span> Setelah Waktu {activePrayer().name}</>}
              {countdownMode() === 'before' && <>± <span class="countdown-tag">{countdown()}</span> Menuju {nextPrayer().name}</>}
              {countdownMode() === 'default' && <>± Menuju {nextPrayer().name}</>}
            </span>
            <span class="next-time">{nextPrayer().time}</span>
          </div>
        </section>
      )}

      {/* Prayer List */}
      <main class="prayer-list">
        {loading() ? (
            <div class="text-center py-10 white-text">Loading Data...</div>
        ) : prayerData() && (
            <>
                {(() => {
                  const baseList = [
                    { key: 'imsak', label: 'Imsak', icon: 'schedule' },
                    { key: 'subuh', label: 'Subuh', icon: 'dark_mode' },
                    { key: 'terbit', label: 'Terbit', icon: 'wb_twilight' },
                    { key: 'dhuha', label: 'Dhuha', icon: 'wb_sunny' },
                    { key: 'dzuhur', label: 'Dzuhur', icon: 'wb_sunny' },
                    { key: 'ashar', label: 'Ashar', icon: 'wb_sunny' },
                    { key: 'maghrib', label: 'Maghrib', icon: 'nights_stay' },
                    { key: 'isya', label: 'Isya', icon: 'bedtime' }
                  ];
                  
                  const activeIndex = baseList.findIndex(item => item.label === activePrayer()?.name);
                  if (activeIndex === -1) return baseList.map(renderItem);
                  
                  // Reorder: Active one first, then the rest in cycle
                  const reordered = [
                    ...baseList.slice(activeIndex),
                    ...baseList.slice(0, activeIndex)
                  ];
                  
                  function renderItem(item) {
                    const isActive = activePrayer()?.name === item.label;
                    return (
                        <div class={`glass-card ${isActive ? 'active' : ''}`}>
                            <div class="prayer-item-left">
                                <div class="prayer-icon">
                                    <span class="material-icons">{item.icon}</span>
                                </div>
                                <span class="prayer-name">{item.label}</span>
                            </div>
                            <span class="prayer-time">{prayerData()[item.key]}</span>
                        </div>
                    );
                  }
                  
                  return reordered.map(renderItem);
                })()}
            </>
        )}
      </main>
    </div>
  );
}
