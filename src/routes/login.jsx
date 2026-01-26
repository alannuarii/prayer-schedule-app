import { useNavigate } from "@solidjs/router";
import MosqueSilhouette from "../components/MosqueSilhouette";
import GoogleButton from "../components/GoogleButton";
import AppLogo from "../components/AppLogo";

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Simulate Google login - in production, use proper OAuth
    // For now, we'll just redirect to location selection
    const mockUser = {
      name: "User",
      email: "user@example.com",
      picture: ""
    };
    
    // Save user to localStorage (simulating login)
    localStorage.setItem("user", JSON.stringify(mockUser));
    
    // Check if location is already set
    const savedLocation = localStorage.getItem("selectedCity");
    if (savedLocation) {
      navigate("/", { replace: true });
    } else {
      navigate("/lokasi", { replace: true });
    }
  };

  return (
    <div class="login-container">
      {/* iOS Status Bar (decorative) */}
      <div class="ios-status-bar">
        <div>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="d-flex align-items-center gap-1">
          <span class="material-icons" style="font-size: 18px">signal_cellular_alt</span>
          <span class="material-icons" style="font-size: 18px">wifi</span>
          <span class="material-icons" style="font-size: 18px; transform: rotate(90deg)">battery_full</span>
        </div>
      </div>

      {/* Main Content */}
      <div class="login-content">
        <div class="login-logo">
          <AppLogo />
        </div>
        
        <h1 class="login-title">Assalamu'alaikum</h1>
        <p class="login-subtitle">Prayer Times & Location</p>
        
        <GoogleButton onClick={handleGoogleLogin} />
      </div>

      {/* Mosque Silhouette Background */}
      <MosqueSilhouette />
      
      {/* Home Indicator */}
      <div class="home-indicator"></div>
    </div>
  );
}
