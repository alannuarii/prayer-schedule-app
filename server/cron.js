import "dotenv/config";
import cron from "node-cron";
import webpush from "web-push";
import { Client } from "pg";
import fetch from "node-fetch";

// Setup web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Map region (daerah / provinsi) to Indonesian timezone
function getTimezoneByDaerah(daerah = "") {
  const d = daerah.toUpperCase();

  // WITA (UTC+8): Bali, NTB, NTT, Sulawesi, Gorontalo, Kalsel, Kaltim, Kaltara
  const witaKeywords = [
    "BALI",
    "NUSA TENGGARA",
    "SULAWESI",
    "GORONTALO",
    "KALIMANTAN SELATAN",
    "KALIMANTAN TIMUR",
    "KALIMANTAN UTARA"
  ];
  if (witaKeywords.some(k => d.includes(k))) {
    return "Asia/Makassar";
  }

  // WIT (UTC+9): Maluku, Papua
  const witKeywords = ["MALUKU", "PAPUA"];
  if (witKeywords.some(k => d.includes(k))) {
    return "Asia/Jayapura";
  }

  // WIB (UTC+7 - Default for Sumatera, Jawa, Kalbar, Kalteng):
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

// Cache for prayer schedules to avoid spamming the API
const scheduleCache = new Map(); // cityId -> { date, schedule, timezone }

async function getPrayerSchedule(cityId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const cached = scheduleCache.get(cityId);
  if (cached && cached.date === dateStr) {
    return cached;
  }

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
    console.error(`Error fetching schedule for city ${cityId}:`, error);
  }
  return null;
}

// Convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function startCron() {
  console.log("Starting Timezone-Adaptive Web Push Cron Service...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    // Using a separate client for each cron run to ensure DB freshness
    const client = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    try {
      await client.connect();
      
      // Get all unique cities that have subscriptions
      const cityRes = await client.query("SELECT DISTINCT city_id FROM subscriptions");
      const activeCities = cityRes.rows.map(row => row.city_id);

      for (const cityId of activeCities) {
        const cachedData = await getPrayerSchedule(cityId);
        if (!cachedData || !cachedData.schedule) continue;

        const { schedule, timezone } = cachedData;
        // Evaluate current time in the local timezone of this specific city
        const currentMinutes = getMinutesInTimezone(timezone);

        const prayers = [
          { name: "Subuh", time: schedule.subuh },
          { name: "Dzuhur", time: schedule.dzuhur },
          { name: "Ashar", time: schedule.ashar },
          { name: "Maghrib", time: schedule.maghrib },
          { name: "Isya", time: schedule.isya }
        ];

        let notificationPayload = null;

        for (const p of prayers) {
          const pMinutes = timeToMinutes(p.time);
          
          if (pMinutes === currentMinutes) {
            notificationPayload = {
              title: `Waktu ${p.name}`,
              body: `Waktu sholat ${p.name} telah tiba (${p.time})`,
              icon: "/icon.png"
            };
            break;
          } else if (pMinutes - 10 === currentMinutes) {
            notificationPayload = {
              title: `Persiapan Sholat ${p.name}`,
              body: `10 menit lagi menuju waktu sholat ${p.name} (${p.time})`,
              icon: "/icon.png"
            };
            break;
          }
        }

        if (notificationPayload) {
          // Get all subscriptions for this city
          const subRes = await client.query("SELECT * FROM subscriptions WHERE city_id = $1", [cityId]);
          
          const payloadString = JSON.stringify(notificationPayload);
          
          for (const row of subRes.rows) {
            const pushSubscription = {
              endpoint: row.endpoint,
              keys: {
                p256dh: row.p256dh,
                auth: row.auth
              }
            };
            
            try {
              await webpush.sendNotification(pushSubscription, payloadString);
            } catch (error) {
              // If subscription is invalid (status 410 or 404), remove it from DB
              if (error.statusCode === 410 || error.statusCode === 404) {
                await client.query("DELETE FROM subscriptions WHERE endpoint = $1", [row.endpoint]);
              } else {
                console.error("Error sending push:", error);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Cron Database Error:", err);
    } finally {
      await client.end();
    }
  });
}
