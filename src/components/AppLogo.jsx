export default function AppLogo() {
  return (
    <svg class="drop-shadow-sm" width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="paint0_linear" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8BBBE2" />
          <stop offset="1" stop-color="#4A7C9D" />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="60" y1="30" x2="60" y2="90" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E8C488" />
          <stop offset="1" stop-color="#C59D5F" />
        </linearGradient>
      </defs>
      {/* Moon */}
      <path d="M60 105C84.8528 105 105 84.8528 105 60C105 35.1472 84.8528 15 60 15C56.6346 15 53.3601 15.445 50.2163 16.2894C53.2201 19.8653 55 24.5029 55 29.5C55 43.5833 43.5833 55 29.5 55C24.5029 55 19.8653 53.2201 16.2894 50.2163C15.445 53.3601 15 56.6346 15 60C15 84.8528 35.1472 105 60 105Z" fill="url(#paint0_linear)" />
      {/* Star glow */}
      <path d="M60 25L68 52L95 60L68 68L60 95L52 68L25 60L52 52L60 25Z" fill="#E2E8F0" style="opacity: 0.4" />
      {/* Star */}
      <path d="M60 30L65 55L90 60L65 65L60 90L55 65L30 60L55 55L60 30Z" fill="url(#paint1_linear)" />
      {/* Shadow */}
      <path d="M60 30L60 90L30 60L60 30Z" fill="rgba(0,0,0,0.1)" />
    </svg>
  );
}
