import { createSignal, onMount, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { fetchAllCities } from "../lib/api";
import { saveSelectedCity, hasLocation } from "../lib/storage";

export default function Lokasi() {
  const navigate = useNavigate();
  const [cities, setCities] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);

  onMount(async () => {
    try {
      const data = await fetchAllCities();
      setCities(data);
    } catch (err) {
      setError("Gagal memuat data kota. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  });

  // Filter cities based on search query
  const filteredCities = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return cities();
    
    return cities().filter(city => 
      city.lokasi.toLowerCase().includes(query)
    );
  };

  const handleSelectCity = (city) => {
    saveSelectedCity(city);
    // Redirect to home (which will now show prayer times)
    navigate("/", { replace: true });
  };

  const handleCurrentLocation = () => {
    // Placeholder for geolocation functionality
    // Ideally we would get coordinates and find the nearest city
    // For now, let's just show an alert or console log
    alert("Fitur deteksi lokasi otomatis akan segera hadir!");
  };

  return (
    <div class="location-page">
      {/* Header */}
      <header class="location-header">
        <h1 class="location-title">Select Location</h1>
      </header>

      {/* Main Content */}
      <main class="location-content">
        {/* Search Bar */}
        <div class="search-container">
          <span class="material-icons text-gray-400">search</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Cari Lokasi Sholat"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Current Location Button */}
        <button class="btn-current-location" onClick={handleCurrentLocation}>
          <span class="material-icons">my_location</span>
          <span>Use Current Location</span>
        </button>

        {/* Status Messages */}
        {loading() && <div class="text-center py-4 text-white">Memuat data kota...</div>}
        {error() && <div class="text-center py-4 text-red-400">{error()}</div>}

        {/* Location List */}
        {!loading() && !error() && (
          <div class="location-list">
            <For each={filteredCities()}>
              {(city) => (
                <div class="location-item" onClick={() => handleSelectCity(city)}>
                  <span class="location-name">{city.lokasi}</span>
                  <span class="material-icons" style="color: #3b82f6; font-size: 20px;">chevron_right</span>
                </div>
              )}
            </For>

            {filteredCities().length === 0 && (
              <div class="p-4 text-center text-gray-500">
                Kota tidak ditemukan
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer class="bottom-nav">
        <a href="/" class="nav-item">
          <span class="material-icons nav-icon">home</span>
          <span class="nav-label">Home</span>
        </a>
        <a href="#" class="nav-item">
          <span class="material-icons nav-icon">calendar_today</span>
          <span class="nav-label">Jadwal</span>
        </a>
        {/* Active Item Example - if this was the locations page in nav, it would be active. 
            However, the design shows 'Home' as active in footer, but we are on 'Select Location'. 
            Based on the prompt "Select Location Screen", this might be a separate flow or part of 'Profile'/'Settings'.
            The prompt says flow is Login -> Location -> Main. 
            So this page is technically part of the setup. 
            But the footer shows Home/Jadwal/Qibla/Profile.
            I will leave Home active or none active? 
            The image shows Home active. I'll stick to the snippet.
        */}
        <a href="#" class="nav-item active">
          <span class="material-icons nav-icon" style="color: #3b82f6">explore</span> {/* Qibla icon proxy */}
          <span class="nav-label" style="color: #3b82f6">Lokasi</span> 
          {/* Wait, the snippet had Home, Jadwal, Qibla, Profile. 
              The page is "Select Location". 
              Usually location selection is distinct. 
              I'll just replicate the footer from the snippet roughly.
          */}
        </a>
        <a href="#" class="nav-item">
          <span class="material-icons nav-icon">person</span>
          <span class="nav-label">Profile</span>
        </a>
      </footer>
    </div>
  );
}
