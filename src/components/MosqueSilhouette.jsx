export default function MosqueSilhouette() {
  return (
    <div class="mosque-silhouette">
      <svg preserveAspectRatio="none" viewBox="0 0 375 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Main Dome */}
        <path d="M110 220 V190 C110 190 120 150 187.5 150 C255 150 265 190 265 190 V220 H110 Z" />
        <rect x="185.5" y="145" width="4" height="15" rx="2" />
        <circle cx="187.5" cy="142" r="4" />
        <path d="M187.5 130 C191.642 130 195 133.358 195 137.5 C195 137.5 193 137.5 191 135.5 C189 133.5 189 130 187.5 130 Z" transform="rotate(-15 187.5 137.5) scale(1.5)" />
        
        {/* Left Minaret */}
        <rect x="20" y="170" width="16" height="50" />
        <path d="M18 170 H38 L28 155 L18 170 Z" />
        <circle cx="28" cy="153" r="3" />
        <rect x="27" y="148" width="2" height="5" />
        
        {/* Left Small Minaret */}
        <rect x="65" y="185" width="14" height="35" />
        <path d="M63 185 H81 L72 175 L63 185 Z" />
        <circle cx="72" cy="173" r="2.5" />
        <rect x="71" y="168" width="2" height="5" />
        
        {/* Right Minaret */}
        <rect x="339" y="170" width="16" height="50" />
        <path d="M337 170 H357 L347 155 L337 170 Z" />
        <circle cx="347" cy="153" r="3" />
        <rect x="346" y="148" width="2" height="5" />
        
        {/* Right Small Minaret */}
        <rect x="296" y="185" width="14" height="35" />
        <path d="M294 185 H312 L303 175 L294 185 Z" />
        <circle cx="303" cy="173" r="2.5" />
        <rect x="302" y="168" width="2" height="5" />
        
        {/* Base/Wall */}
        <rect x="30" y="195" width="315" height="25" style="opacity: 0.8" />
        <rect x="80" y="190" width="30" height="15" />
        <rect x="265" y="190" width="30" height="15" />
        
        {/* Doors */}
        <path d="M40 220 V200 H60 V220 Z" style="opacity: 0.5" />
        <path d="M315 220 V200 H335 V220 Z" style="opacity: 0.5" />
      </svg>
    </div>
  );
}
