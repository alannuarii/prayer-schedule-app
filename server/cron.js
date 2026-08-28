import "dotenv/config";
import cron from "node-cron";
import fetch from "node-fetch";

const PUSH_SERVICE_API_KEY = process.env.PUSH_SERVICE_API_KEY || "";
const PUSH_SERVICE_URL = process.env.PUSH_SERVICE_URL || "https://push-notify.serveer.biz.id";

// Map region (daerah / provinsi) to Indonesian timezone
function getTimezoneByDaerah(daerah = "") {
  const d = daerah.toUpperCase();

  // WITA (UTC+8)
  const witaKeywords = [
    "BALI", "NUSA TENGGARA", "SULAWESI", "GORONTALO", 
    "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA"
  ];
  if (witaKeywords.some(k => d.includes(k))) return "Asia/Makassar";

  // WIT (UTC+9)
  const witKeywords = ["MALUKU", "PAPUA"];
  if (witKeywords.some(k => d.includes(k))) return "Asia/Jayapura";

  // WIB (UTC+7)
  return "Asia/Jakarta";
}

// Get current minutes since midnight in a specific timezone
function getMinutesInTimezone(timezone = "Asia/Jakarta") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === "hour").value) % 24;
  const minute = Number(parts.find(p => p.type === "minute").value);
  return hour * 60 + minute;
}

// Convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

let allCities = [];
const scheduleCache = new Map(); // cityId -> { date, schedule, timezone }
let isFetchingSchedules = false;

// 1. Fetch List of All Cities from MyQuran
async function loadAllCities() {
  try {
    console.log("Fetching all cities from MyQuran API...");
    const res = await fetch("https://api.myquran.com/v2/sholat/kota/semua");
    const json = await res.json();
    if (json.status && json.data) {
      allCities = json.data;
      console.log(`Loaded ${allCities.length} cities.`);
    }
  } catch (error) {
    console.error("Failed to load cities:", error);
  }
}

// 2. Fetch schedule for a specific city
async function fetchCitySchedule(cityId, dateStr, year, month, day) {
  try {
    const formattedDate = `${year}/${month}/${day}`;
    const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${formattedDate}`);
    const data = await response.json();

    if (data.status && data.data) {
      const timezone = getTimezoneByDaerah(data.data.daerah || "");
      const cacheData = { date: dateStr, schedule: data.data.jadwal, timezone };
      scheduleCache.set(cityId, cacheData);
      return cacheData;
    }
  } catch (error) {
    // console.error(`Error fetching schedule for city ${cityId}:`, error.message);
  }
  return null;
}

// 3. Pre-warm cache for all cities slowly (to avoid rate limits)
async function prefetchDailySchedules() {
  if (isFetchingSchedules || allCities.length === 0) return;
  isFetchingSchedules = true;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  let fetchedCount = 0;
  console.log(`Starting daily prefetch for ${allCities.length} cities...`);

  for (const city of allCities) {
    const cached = scheduleCache.get(city.id);
    if (!cached || cached.date !== dateStr) {
      await fetchCitySchedule(city.id, dateStr, year, month, day);
      fetchedCount++;
      // Wait 100ms between requests to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`Finished daily prefetch. Fetched ${fetchedCount} new schedules.`);
  isFetchingSchedules = false;
}

// 4. Send Notification via Centralized Service
async function sendPushNotification(cityId, title, body) {
  if (!PUSH_SERVICE_API_KEY) {
    console.warn("PUSH_SERVICE_API_KEY is not set. Skipping notification.");
    return;
  }

  try {
    const payload = {
      target: {
        type: "tags",
        tags: { cityId: String(cityId) }
      },
      notification: {
        title: title,
        body: body,
        icon: "/icon-192.png",
        data: { url: "/" }
      }
    };

    const res = await fetch(`${PUSH_SERVICE_URL}/api/v1/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PUSH_SERVICE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`Failed to send push for city ${cityId}: HTTP ${res.status}`);
    }
  } catch (error) {
    console.error(`Error communicating with push service for city ${cityId}:`, error.message);
  }
}

export async function startCron() {
  console.log("Starting Timezone-Adaptive Cron Service for Universal Push...");
  
  // Load initial data
  await loadAllCities();
  prefetchDailySchedules(); // Fire and forget prefetch

  // Cron to trigger prefetching every midnight
  cron.schedule("1 0 * * *", () => {
    prefetchDailySchedules();
  });

  // Main evaluation cron (Runs every minute)
  cron.schedule("* * * * *", async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (const city of allCities) {
      const cachedData = scheduleCache.get(city.id);
      if (!cachedData || cachedData.date !== dateStr || !cachedData.schedule) continue;

      const { schedule, timezone } = cachedData;
      const currentMinutes = getMinutesInTimezone(timezone);

      const prayers = [
        { name: "Subuh", time: schedule.subuh },
        { name: "Dzuhur", time: schedule.dzuhur },
        { name: "Ashar", time: schedule.ashar },
        { name: "Maghrib", time: schedule.maghrib },
        { name: "Isya", time: schedule.isya }
      ];

      for (const p of prayers) {
        const pMinutes = timeToMinutes(p.time);
        
        if (pMinutes === currentMinutes) {
          sendPushNotification(
            city.id, 
            `Waktu ${p.name}`, 
            `Waktu sholat ${p.name} telah tiba (${p.time})`
          );
          break;
        } else if (pMinutes - 10 === currentMinutes) {
          sendPushNotification(
            city.id, 
            `Persiapan Sholat ${p.name}`, 
            `10 menit lagi menuju waktu sholat ${p.name} (${p.time})`
          );
          break;
        }
      }
    }
  });
}
