import { createSignal, onMount, For } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { fetchAllCities } from "../lib/api";
import { saveSelectedCity } from "../lib/storage";
import { detectLocationCity } from "../lib/location";

export default function Lokasi() {
  const navigate = useNavigate();
  const [cities, setCities] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [loading, setLoading] = createSignal(true);
  const [detecting, setDetecting] = createSignal(false);
  const [error, setError] = createSignal(null);

  onMount(async () => {
    try {
      const data = await fetchAllCities();
      setCities(data);
    } catch (err) {
      setError("Gagal memuat data kota. Silakan periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  });

  // Filter cities based on search query
  const filteredCities = () => {
    const query = searchQuery().toLowerCase().trim();
    if (!query) return [];

    return cities().filter((city) => city.lokasi.toLowerCase().includes(query));
  };

  const handleSelectCity = (city) => {
    saveSelectedCity(city);
    // Redirect to home (which will now show prayer times)
    navigate("/", { replace: true });
  };

  const handleCurrentLocation = async () => {
    try {
      setDetecting(true);
      setError(null);
      const city = await detectLocationCity();
      handleSelectCity(city);
    } catch (err) {
      setError(err.message || "Gagal mendeteksi lokasi secara otomatis.");
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div class="location-page">
      {/* Header */}
      <header class="location-header" style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "inherit",
            width: "36px",
            height: "36px",
            "border-radius": "10px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            cursor: "pointer",
          }}
          title="Kembali ke Beranda"
        >
          <span class="material-icons" style={{ "font-size": "20px" }}>arrow_back</span>
        </button>
        <h1 class="location-title" style={{ margin: 0 }}>Select Location</h1>
      </header>

      {/* Main Content */}
      <main class="location-content">
        {/* Search Bar */}
        <div class="search-container">
          <span class="material-icons text-gray-400">search</span>
          <input
            type="text"
            class="search-input"
            placeholder="Cari Lokasi Sholat (contoh: Sangihe, Manado)"
            value={searchQuery()}
            onInput={(e) => {
              setError(null);
              setSearchQuery(e.target.value);
            }}
          />
        </div>

        {/* Current Location Button */}
        <button
          class="btn-current-location"
          onClick={handleCurrentLocation}
          disabled={detecting()}
          style={{ opacity: detecting() ? 0.7 : 1, cursor: detecting() ? "wait" : "pointer" }}
        >
          <span class="material-icons">{detecting() ? "sync" : "my_location"}</span>
          <span>{detecting() ? "Mendeteksi Lokasi GPS..." : "Use Current Location"}</span>
        </button>

        {/* Status Messages */}
        {loading() && <div class="text-center py-4 text-white">Memuat data kota...</div>}
        {error() && <div class="text-center py-4 text-red-400">{error()}</div>}

        {/* Location List - Always renders search results regardless of prior location error */}
        {!loading() && searchQuery().length > 0 && (
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

            {filteredCities().length === 0 && (
              <div class="p-4 text-center text-gray-400">
                Kota/Kabupaten "{searchQuery()}" tidak ditemukan. Coba ketik nama bagian lain (misal: Sangihe).
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
