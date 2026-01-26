import { createSignal, onMount, onCleanup, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { getUser, getSelectedCity } from "../lib/storage";
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

  // Update clock every second
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  onCleanup(() => clearInterval(timer));

  onMount(async () => {
    const user = getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const city = getSelectedCity();
    if (!city) {
      navigate("/lokasi", { replace: true });
      return;
    }

    setCityData(city);
    
    // Fetch prayer times
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

    // Find next prayer
    for (let i = 0; i < prayers.length; i++) {
      const p = prayers[i];
      const [ph, pm] = p.time.split(':').map(Number);
      const pMinutes = ph * 60 + pm;

      if (pMinutes > currentTimeMinutes) {
        upcoming = p;
        // Previous one is active
        current = i > 0 ? prayers[i-1] : prayers[prayers.length-1]; 
        
        // Calculate progress
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
      // If no upcoming today, it means next is Imsak tomorrow
      upcoming = prayers[0];
      current = prayers[prayers.length - 1]; // Isya is active
      setProgress(100); // Full progress bar for end of day
    }

    setNextPrayer(upcoming);
    setActivePrayer(current);
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };
    
  const hijriDate = () => prayerData()?.tanggal || "14 Rajab 1447 H";

  return (
    <div class="home-page">
      {/* Header */}
      <header class="home-header">
        <div class="status-bar">
          <span>{currentTime().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          <div class="status-icons">
             <span class="material-icons" style="font-size: 16px">signal_cellular_alt</span>
             <span class="material-icons" style="font-size: 16px">wifi</span>
             <span class="material-icons" style="font-size: 18px; transform: rotate(90deg)">battery_full</span>
          </div>
        </div>

        <div class="main-clock-section">
          <div>
            <h1 class="main-clock">
              {currentTime().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
            </h1>
            <p class="date-display">
              {formatDate(currentTime())} | {hijriDate()}
            </p>
          </div>
          <button class="theme-toggle" onClick={() => navigate("/lokasi")}>
             <div style="width: 48px; height: 28px; background: #2C2C2E; border-radius: 99px; position: relative; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                <div style="position: absolute; left: 4px; width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <span class="material-icons" style="font-size: 12px; color: black;">wb_sunny</span>
                </div>
                <div style="position: absolute; right: 6px; color: #6b7280;">
                    <span class="material-icons" style="font-size: 14px;">nightlight_round</span>
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
            <h2 class="prayer-name-large text-white">{activePrayer().name}</h2>
            <span class="prayer-status">(Waktu {activePrayer().name} Sedang Berjalan)</span>
          </div>
          
          <div class="progress-container">
            <div class="progress-bar" style={{ width: `${progress()}%` }}></div>
            <div class="progress-thumb" style={{ left: `${progress()}%` }}>
                <span class="material-icons" style="font-size: 14px; color: white;">timer</span>
            </div>
          </div>
          
          <div class="time-labels">
            <span>± Menuju {nextPrayer().name}</span>
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
                {[
                  { key: 'imsak', label: 'Imsak', icon: 'schedule' },
                  { key: 'subuh', label: 'Subuh', icon: 'dark_mode' },
                  { key: 'terbit', label: 'Terbit', icon: 'wb_twilight' },
                  { key: 'dhuha', label: 'Dhuha', icon: 'wb_sunny' },
                  { key: 'dzuhur', label: 'Dzuhur', icon: 'wb_sunny' },
                  { key: 'ashar', label: 'Ashar', icon: 'wb_sunny' },
                  { key: 'maghrib', label: 'Maghrib', icon: 'nights_stay' },
                  { key: 'isya', label: 'Isya', icon: 'bedtime' }
                ].map((item) => {
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
                })}
            </>
        )}
      </main>
    </div>
  );
}
