// frontend/src/components/route/RouteMapVisualizer.tsx
import React, { useMemo } from 'react';
import { PORT_COORDINATES, ROUTES } from '../../lib/procurementEngine';
import { VesselEvaluation } from '../../types';
import { Compass, Navigation, Clock, Fuel, ShieldCheck } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface RouteMapVisualizerProps {
  origin: string;
  destination: string;
  optimalVessel?: VesselEvaluation;
}

// Strategic waypoints for realistic maritime sea lanes (avoiding landmass penetration)
const MARITIME_CORRIDORS: Record<string, Record<string, { waypoints: [number, number][]; laneName: string }>> = {
  "Australia (Newcastle)": {
    "Paradip": {
      laneName: "Tasman Sea – Coral Sea – Torres Strait / Lombok – Bay of Bengal",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [93.0, 8.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Indo-Pacific Trans-Oceanic Bulk Corridor",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [92.0, 10.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Southern Ocean – Lombok Strait – Coromandel Approach",
      waypoints: [[151.8, -32.9], [153.0, -26.0], [143.0, -11.0], [118.0, -9.0], [102.0, -1.0], [90.0, 7.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "East Coast Deepwater Bulk Lane",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [92.5, 9.0], [87.0, 20.8]]
    }
  },
  "Australia (Hay Point)": {
    "Paradip": {
      laneName: "Great Barrier Reef Inshore Passage – Malacca/Sunda – Bay of Bengal",
      waypoints: [[149.3, -21.3], [147.0, -14.0], [135.0, -9.0], [115.0, -7.0], [100.0, 0.0], [92.0, 8.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Queensland Bulk Corridor – Sandheads Berth",
      waypoints: [[149.3, -21.3], [147.0, -14.0], [135.0, -9.0], [115.0, -7.0], [100.0, 0.0], [92.0, 11.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Hay Point – Java Sea – Vizag Outer Berth",
      waypoints: [[149.3, -21.3], [146.0, -14.0], [134.0, -9.0], [114.0, -7.0], [98.0, 1.0], [89.0, 8.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "Hay Point – Dhamra Deepwater Corridor",
      waypoints: [[149.3, -21.3], [147.0, -14.0], [135.0, -9.0], [115.0, -7.0], [100.0, 0.0], [91.0, 10.0], [87.0, 20.8]]
    }
  },
  "Indonesia (Samarinda)": {
    "Paradip": {
      laneName: "Makassar Strait – Java Sea – Malacca Strait – Bay of Bengal",
      waypoints: [[117.2, -0.5], [116.0, -3.5], [108.0, -1.0], [104.0, 1.3], [98.0, 5.5], [92.0, 10.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Kalimantan Thermal Route – Hooghly Estuary",
      waypoints: [[117.2, -0.5], [116.0, -3.5], [108.0, -1.0], [104.0, 1.3], [98.0, 5.5], [93.0, 13.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Samarinda Direct Malacca Transit",
      waypoints: [[117.2, -0.5], [116.0, -3.5], [108.0, -1.0], [104.0, 1.3], [98.0, 5.5], [89.0, 9.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "Samarinda Bulk Corridor – Dhamra Discharge",
      waypoints: [[117.2, -0.5], [116.0, -3.5], [108.0, -1.0], [104.0, 1.3], [98.0, 5.5], [91.0, 11.0], [87.0, 20.8]]
    }
  },
  "Mozambique (Maputo)": {
    "Paradip": {
      laneName: "Mozambique Channel – Trans-Indian Ocean – Bay of Bengal",
      waypoints: [[32.6, -26.0], [42.0, -18.0], [55.0, -5.0], [70.0, 5.0], [80.0, 10.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "East Africa Coking Route – Bengal Basin",
      waypoints: [[32.6, -26.0], [42.0, -18.0], [55.0, -5.0], [70.0, 5.0], [82.0, 12.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Maputo – Equatorial Indian Ocean – Vizag",
      waypoints: [[32.6, -26.0], [42.0, -18.0], [55.0, -5.0], [68.0, 4.0], [80.0, 10.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "Southern Africa Bulk Express",
      waypoints: [[32.6, -26.0], [42.0, -18.0], [55.0, -5.0], [70.0, 5.0], [82.0, 11.0], [87.0, 20.8]]
    }
  },
  "USA (New Orleans)": {
    "Paradip": {
      laneName: "Gulf of Mexico – Atlantic – Cape of Good Hope – Indian Ocean",
      waypoints: [[-90.1, 29.9], [-85.0, 24.0], [-70.0, 20.0], [-40.0, 0.0], [-10.0, -25.0], [20.0, -36.0], [45.0, -25.0], [70.0, 0.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Mississippi Bulk – Atlantic / Cape Route – Haldia",
      waypoints: [[-90.1, 29.9], [-85.0, 24.0], [-70.0, 20.0], [-40.0, 0.0], [-10.0, -25.0], [20.0, -36.0], [45.0, -25.0], [70.0, 0.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Trans-Atlantic Capesize Corridor",
      waypoints: [[-90.1, 29.9], [-85.0, 24.0], [-70.0, 20.0], [-40.0, 0.0], [-10.0, -25.0], [20.0, -36.0], [45.0, -25.0], [70.0, 0.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "US Gulf Deepwater Export – Dhamra Terminal",
      waypoints: [[-90.1, 29.9], [-85.0, 24.0], [-70.0, 20.0], [-40.0, 0.0], [-10.0, -25.0], [20.0, -36.0], [45.0, -25.0], [70.0, 0.0], [87.0, 20.8]]
    }
  },
  "Russia (Vladivostok)": {
    "Paradip": {
      laneName: "Sea of Japan – East China Sea – Taiwan Strait – Malacca – Paradip",
      waypoints: [[131.9, 43.1], [129.5, 33.0], [123.0, 25.0], [115.0, 15.0], [104.5, 1.3], [98.0, 5.5], [89.0, 12.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Russian Far East Metallurgical Route – Haldia River",
      waypoints: [[131.9, 43.1], [129.5, 33.0], [123.0, 25.0], [115.0, 15.0], [104.5, 1.3], [98.0, 5.5], [90.0, 14.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Far East Coal Lane – Vizag Port",
      waypoints: [[131.9, 43.1], [129.5, 33.0], [123.0, 25.0], [115.0, 15.0], [104.5, 1.3], [98.0, 5.5], [88.0, 10.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "Far East Bulk Corridor – Dhamra Berth",
      waypoints: [[131.9, 43.1], [129.5, 33.0], [123.0, 25.0], [115.0, 15.0], [104.5, 1.3], [98.0, 5.5], [90.0, 12.0], [87.0, 20.8]]
    }
  }
};

export const RouteMapVisualizer: React.FC<RouteMapVisualizerProps> = ({
  origin,
  destination,
  optimalVessel,
}) => {
  const origGeo = PORT_COORDINATES[origin] || { lat: -32.92, lon: 151.78 };
  const destGeo = PORT_COORDINATES[destination] || { lat: 20.26, lon: 86.60 };
  const distance = ROUTES[origin]?.[destination] || 4500;

  // Viewport setup (900x420)
  // Projected centered on Indian Ocean & Eastern Hemisphere with Atlantic window
  // Lon mapped from -100 to 170 (270 degrees span)
  // Lat mapped from -45 to 55 (100 degrees span)
  const project = (lon: number, lat: number): [number, number] => {
    // Normalization for Atlantic-to-Indian continuity
    const normLon = lon < -30 ? lon + 360 : lon; // Shift USA/Atlantic to western flank
    const minLon = 15;
    const maxLon = 175;
    const minLat = -45;
    const maxLat = 55;

    // Constrained projection coordinates
    const x = 50 + ((normLon - minLon) / (maxLon - minLon)) * 800;
    const y = 370 - ((lat - minLat) / (maxLat - minLat)) * 320;
    return [
      Math.max(30, Math.min(870, Math.round(x * 10) / 10)),
      Math.max(25, Math.min(395, Math.round(y * 10) / 10))
    ];
  };

  // Build high-accuracy maritime corridor path
  const routeData = useMemo(() => {
    const corridor = MARITIME_CORRIDORS[origin]?.[destination];
    const waypoints = corridor?.waypoints || [[origGeo.lon, origGeo.lat], [destGeo.lon, destGeo.lat]];
    const projectedPts = waypoints.map(([lon, lat]) => project(lon, lat));

    // Smooth Bezier or multi-segment path
    if (projectedPts.length <= 2) {
      const [p1, p2] = projectedPts;
      const midX = (p1[0] + p2[0]) / 2;
      const midY = Math.min(p1[1], p2[1]) - 35;
      return {
        pathD: `M ${p1[0]} ${p1[1]} Q ${midX} ${midY} ${p2[0]} ${p2[1]}`,
        laneName: corridor?.laneName || "Direct Maritime Transit Arc",
        midPoint: [midX, midY] as [number, number],
        startPoint: p1,
        endPoint: p2
      };
    }

    // Generate Catmull-Rom or multi-segment poly-bezier
    let d = `M ${projectedPts[0][0]} ${projectedPts[0][1]}`;
    for (let i = 1; i < projectedPts.length; i++) {
      const prev = projectedPts[i - 1];
      const curr = projectedPts[i];
      const cx = (prev[0] + curr[0]) / 2;
      const cy = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]} ${prev[1]} ${cx} ${cy}`;
    }
    d += ` L ${projectedPts[projectedPts.length - 1][0]} ${projectedPts[projectedPts.length - 1][1]}`;

    const midIdx = Math.floor(projectedPts.length / 2);
    return {
      pathD: d,
      laneName: corridor?.laneName || "International Bulk Shipping Corridor",
      midPoint: projectedPts[midIdx],
      startPoint: projectedPts[0],
      endPoint: projectedPts[projectedPts.length - 1]
    };
  }, [origin, destination, origGeo, destGeo]);

  const [origX, origY] = project(origGeo.lon, origGeo.lat);
  const [destX, destY] = project(destGeo.lon, destGeo.lat);

  return (
    <div className="terminal-card p-4 flex flex-col justify-between mb-5">
      <div>
        <div className="flex flex-wrap items-center justify-between pb-2.5 mb-3 border-b border-[#182942] gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Ocean Transit Corridor & AIS Route Visualizer
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">
              Distance: <strong className="text-sky-300">{distance.toLocaleString()} NM</strong>
            </span>
            <ProvenanceBadge type="BENCHMARK" />
          </div>
        </div>

        {/* High-Fidelity SVG Maritime Chart */}
        <div className="relative w-full h-[280px] bg-[#050a14] rounded-lg border border-[#162740] overflow-hidden shadow-inner">
          {/* Subtle Lat/Lon Graticule Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1a2c_1px,transparent_1px),linear-gradient(to_bottom,#0f1a2c_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"></div>

          {/* Oceanic Depth Gradient Glow */}
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-sky-950/20 rounded-full blur-3xl pointer-events-none"></div>

          <svg className="w-full h-full" viewBox="0 0 920 420" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Linear gradient for ocean transit route */}
              <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Radar pulse animation filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Latitude Marker Lines (Equator, Tropics) */}
            <line x1="40" y1="226" x2="880" y2="226" stroke="#13243a" strokeWidth="1" strokeDasharray="4,4" />
            <text x="50" y="222" fill="#334d70" fontSize="9" fontFamily="JetBrains Mono">EQUATOR 0°</text>

            <line x1="40" y1="150" x2="880" y2="150" stroke="#101e32" strokeWidth="1" strokeDasharray="3,3" />
            <text x="50" y="146" fill="#253850" fontSize="8" fontFamily="JetBrains Mono">TROPIC OF CANCER 23.5°N</text>

            <line x1="40" y1="300" x2="880" y2="300" stroke="#101e32" strokeWidth="1" strokeDasharray="3,3" />
            <text x="50" y="296" fill="#253850" fontSize="8" fontFamily="JetBrains Mono">TROPIC OF CAPRICORN 23.5°S</text>

            {/* ========================================================================= */}
            {/* REALISTIC CONTINENTAL COASTLINE LANDMASSES (ACCURATE SVG GEOMETRIES)       */}
            {/* ========================================================================= */}

            {/* 1. AFRICA & MADAGASCAR */}
            <g id="landmass-africa">
              {/* East / Southern African Coastline */}
              <path
                d="M 60,110 L 95,115 L 120,135 L 135,170 L 155,200 L 175,225 L 170,260 L 140,310 L 110,345 L 80,365 L 60,375 L 50,340 L 55,280 L 50,220 Z"
                fill="#0d1829"
                stroke="#1c3352"
                strokeWidth="1.2"
              />
              {/* Mozambique & Horn of Africa Extension */}
              <path
                d="M 125,140 L 165,150 L 195,170 L 180,210 L 160,250 L 145,295 L 120,340 L 115,310 L 135,270 L 145,220 L 135,170 Z"
                fill="#0f1c30"
                stroke="#223d61"
                strokeWidth="1"
              />
              {/* Madagascar */}
              <polygon points="180,270 195,290 190,340 170,320" fill="#0d1829" stroke="#1c3352" strokeWidth="1" />
            </g>

            {/* 2. ARABIAN PENINSULA & RED SEA */}
            <path
              d="M 190,130 L 220,135 L 245,155 L 235,185 L 195,175 L 180,145 Z"
              fill="#0e1b2e"
              stroke="#1f385a"
              strokeWidth="1"
            />

            {/* 3. INDIAN SUBCONTINENT (BAY OF BENGAL & ARABIAN SEA) - HIGH ACCURACY FOR SAIL PORTS */}
            <g id="landmass-india">
              <path
                d="M 285,115 L 340,110 L 390,120 L 415,140 L 405,170 L 380,195 L 350,245 L 340,255 L 330,245 L 315,195 L 285,160 L 275,135 Z"
                fill="#112239"
                stroke="#254670"
                strokeWidth="1.5"
              />
              {/* Sri Lanka */}
              <polygon points="345,260 355,270 350,285 340,275" fill="#0e1a2b" stroke="#1d3656" strokeWidth="1" />
              {/* Bay of Bengal Basin Water Depth Area */}
              <path
                d="M 345,180 Q 375,210 405,180 L 410,210 Q 370,245 340,215 Z"
                fill="#030814"
                opacity="0.4"
              />
            </g>

            {/* 4. SOUTHEAST ASIA & INDOCHINA */}
            <g id="landmass-se-asia">
              {/* Myanmar / Thailand / Vietnam */}
              <path
                d="M 410,135 L 435,145 L 460,165 L 450,195 L 430,205 L 420,180 L 415,140 Z"
                fill="#0d1829"
                stroke="#1d3454"
                strokeWidth="1.2"
              />
              {/* Malay Peninsula */}
              <path d="M 425,200 L 435,225 L 440,245 L 430,245 L 420,215 Z" fill="#0e1b2e" stroke="#1f395c" strokeWidth="1" />
              {/* Sumatra */}
              <polygon points="415,245 440,265 470,295 450,305 425,280 405,255" fill="#0e1a2c" stroke="#1c3555" strokeWidth="1" />
              {/* Java */}
              <polygon points="465,305 520,310 535,320 480,318" fill="#0e1a2c" stroke="#1c3555" strokeWidth="1" />
              {/* Borneo (Kalimantan - Samarinda Port) */}
              <path
                d="M 480,245 L 530,250 L 545,285 L 515,300 L 485,290 L 475,265 Z"
                fill="#12233b"
                stroke="#294d7a"
                strokeWidth="1.2"
              />
              {/* Philippines */}
              <path d="M 525,180 L 545,190 L 550,230 L 535,240 L 520,210 Z" fill="#0d1829" stroke="#1a314f" strokeWidth="1" />
            </g>

            {/* 5. EAST ASIA & SEA OF JAPAN (CHINA, KOREA, JAPAN, VLADIVOSTOK) */}
            <g id="landmass-east-asia">
              {/* China Coastline */}
              <path
                d="M 430,110 L 490,115 L 520,135 L 505,170 L 475,175 L 445,150 Z"
                fill="#0e1b2e"
                stroke="#1e3759"
                strokeWidth="1.2"
              />
              {/* Korean Peninsula */}
              <polygon points="525,115 540,125 535,150 520,140" fill="#0d1829" stroke="#1d3454" strokeWidth="1" />
              {/* Japan Archipelago */}
              <path d="M 545,110 L 580,115 L 590,140 L 565,155 L 540,145 Z" fill="#0e1b2e" stroke="#1e3759" strokeWidth="1" />
              {/* Russian Far East Coast (Vladivostok) */}
              <path d="M 525,80 L 565,75 L 585,100 L 545,105 L 520,95 Z" fill="#112035" stroke="#23426b" strokeWidth="1.2" />
            </g>

            {/* 6. AUSTRALIA & OCEANIA (HAY POINT & NEWCASTLE) */}
            <g id="landmass-australia">
              {/* Main Australian Continent */}
              <path
                d="M 580,290 L 640,285 L 685,300 L 710,335 L 695,380 L 650,395 L 600,385 L 570,345 L 565,310 Z"
                fill="#13243d"
                stroke="#294e7c"
                strokeWidth="1.5"
              />
              {/* Great Barrier Reef Arc */}
              <path d="M 660,285 Q 695,305 715,340" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
              {/* Tasmania */}
              <polygon points="665,405 680,405 675,415 660,412" fill="#0e1a2c" stroke="#1c3453" strokeWidth="1" />
              {/* Papua New Guinea */}
              <polygon points="575,250 635,255 650,270 590,275" fill="#0d192a" stroke="#1d3556" strokeWidth="1" />
            </g>

            {/* ========================================================================= */}
            {/* OCEAN TRANSIT CORRIDOR - DYNAMIC MULTI-WAYPOINT MARITIME SHIPPING LANE    */}
            {/* ========================================================================= */}

            {/* Wide Sea Lane Navigational Corridor Glow */}
            <path
              d={routeData.pathD}
              fill="none"
              stroke="#0369a1"
              strokeWidth="10"
              opacity="0.15"
            />

            {/* Secondary Tactical Corridor Boundary */}
            <path
              d={routeData.pathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              opacity="0.4"
            />

            {/* Primary Pulsing AIS Track Line */}
            <path
              d={routeData.pathD}
              fill="none"
              stroke="url(#corridorGrad)"
              strokeWidth="3.5"
              strokeDasharray="8,5"
              className="animate-pulse"
              filter="url(#glow)"
            />

            {/* Origin Port Node */}
            <g transform={`translate(${origX}, ${origY})`}>
              <circle r="14" fill="#f59e0b" opacity="0.25" className="animate-ping" />
              <circle r="6.5" fill="#f59e0b" stroke="#050a14" strokeWidth="2.5" />
              <rect x="10" y="-12" width="130" height="20" rx="3" fill="#070e1b" stroke="#f59e0b" strokeWidth="0.8" opacity="0.95" />
              <text x="16" y="2" fill="#fbbf24" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                ● ORIGIN: {origin.split(' ')[0]}
              </text>
            </g>

            {/* Destination Port Node (SAIL Berth) */}
            <g transform={`translate(${destX}, ${destY})`}>
              <circle r="16" fill="#10b981" opacity="0.3" className="animate-ping" />
              <circle r="7.5" fill="#10b981" stroke="#050a14" strokeWidth="2.5" />
              <rect x="-145" y="-14" width="135" height="22" rx="3" fill="#070e1b" stroke="#10b981" strokeWidth="1" opacity="0.95" />
              <text x="-139" y="1" fill="#34d399" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                ⚓ SAIL: {destination}
              </text>
            </g>

            {/* Waypoint Mid-Course Operational Badge */}
            <g transform={`translate(${routeData.midPoint[0] - 80}, ${routeData.midPoint[1] - 14})`}>
              <rect width="160" height="24" rx="4" fill="#091322" stroke="#25436c" strokeWidth="1.2" filter="url(#glow)" />
              <text x="80" y="16" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                {optimalVessel ? `${optimalVessel.voyage_days}d Transit @ 14kts` : 'Optimal Transit'}
              </text>
            </g>

            {/* Maritime Corridor Legend Badge */}
            <g transform="translate(45, 370)">
              <rect width="360" height="26" rx="4" fill="#060c18" stroke="#162740" opacity="0.9" />
              <text x="12" y="17" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                Active Lane: <tspan fill="#38bdf8" fontWeight="bold">{routeData.laneName}</tspan>
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Corridor Summary Key Operational Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#162740] text-xs font-mono">
        <div className="p-2.5 rounded bg-[#070d17] border border-[#142236]">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1 mb-0.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Nautical Range
          </span>
          <span className="font-bold text-slate-100 text-sm">{distance.toLocaleString()} NM</span>
        </div>

        <div className="p-2.5 rounded bg-[#070d17] border border-[#142236]">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Ocean Transit
          </span>
          <span className="font-bold text-slate-100 text-sm">{optimalVessel?.voyage_days || '--'} Days</span>
        </div>

        <div className="p-2.5 rounded bg-[#070d17] border border-[#142236]">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1 mb-0.5">
            <Fuel className="w-3.5 h-3.5 text-rose-400" /> Marine Fuel Burn
          </span>
          <span className="font-bold text-slate-100 text-sm">{optimalVessel?.fuel_burned_mt || '--'} MT</span>
        </div>

        <div className="p-2.5 rounded bg-[#070d17] border border-[#142236]">
          <span className="text-slate-500 text-[10px] block flex items-center gap-1 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Channel Status
          </span>
          <span className="font-bold text-emerald-400 text-sm">
            {PORT_COORDINATES[destination]?.draft_limit_m || 14.5}m Max Berth
          </span>
        </div>
      </div>
    </div>
  );
};
