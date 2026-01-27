import { useNavigate } from "@solidjs/router";
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
      picture: "",
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
      {/* Main Content */}
      <div class="login-content">
        <div class="login-logo">
          <AppLogo />
        </div>

        <h1 class="login-title">Assalamu'alaikum</h1>
        <p class="login-subtitle">Prayer Times & Location</p>

        <GoogleButton onClick={handleGoogleLogin} />
      </div>
      <div class="home-indicator"></div>
    </div>
  );
}
