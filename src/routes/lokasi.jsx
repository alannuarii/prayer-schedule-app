import { createSignal, onMount, For } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { fetchAllCities } from "../lib/api";
import { saveSelectedCity } from "../lib/storage";

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
    if (!query) return [];

    return cities().filter((city) => city.lokasi.toLowerCase().includes(query));
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
          <input type="text" class="search-input" placeholder="Cari Lokasi Sholat" value={searchQuery()} onInput={(e) => setSearchQuery(e.target.value)} />
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
        {!loading() && !error() && searchQuery().length > 0 && (
          <div class="location-list">
            <For each={filteredCities()}>
              {(city) => (
                <div class="location-item" onClick={() => handleSelectCity(city)}>
                  <span class="location-name">{city.lokasi}</span>
                  <span class="material-icons" style="color: #3b82f6; font-size: 20px;">
                    chevron_right
                  </span>
                </div>
              )}
            </For>

            {filteredCities().length === 0 && <div class="p-4 text-center text-gray-500">Kota tidak ditemukan</div>}
          </div>
        )}
      </main>
    </div>
  );
}
