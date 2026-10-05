// frontend/src/components/route/RouteMapVisualizer.tsx
//
// Real-coastline maritime corridor chart: Natural Earth land geometry
// (public domain, via the world-atlas package) rendered through a proper
// equirectangular projection (d3-geo). The active shipping lane is drawn
// as great-circle arcs between documented sea-lane waypoints, and US Gulf
// lanes switch between the Suez and Cape of Good Hope corridors depending
// on the recommended vessel class — matching the cost engine.
import React, { useMemo } from 'react';
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import { PORT_COORDINATES, ROUTES } from '../../lib/procurementEngine';
import { VesselEvaluation } from '../../types';
import { Compass, Navigation, Clock, Fuel, ShieldCheck } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { CardHeader } from '../ui/Primitives';

interface RouteMapVisualizerProps {
  origin: string;
  destination: string;
  optimalVessel?: VesselEvaluation;
}

// Documented sea-lane waypoints [lon, lat] per corridor. US Gulf lanes carry
// two variants: Suez (default, canal fee) and Cape of Good Hope (Capesize).
const MARITIME_CORRIDORS: Record<
  string,
  Record<string, { laneName: string; waypoints: [number, number][]; capeLaneName?: string; capeWaypoints?: [number, number][] }>
> = {
  "Australia (Newcastle)": {
    "Paradip": {
      laneName: "Tasman Sea – Lombok Strait – Bay of Bengal",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [93.0, 8.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Indo-Pacific Trans-Oceanic Bulk Corridor",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [92.0, 10.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Lombok Strait – Coromandel Approach",
      waypoints: [[151.8, -32.9], [153.0, -26.0], [143.0, -11.0], [118.0, -9.0], [102.0, -1.0], [90.0, 7.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "East Coast Deepwater Bulk Lane",
      waypoints: [[151.8, -32.9], [154.0, -24.0], [145.0, -10.5], [120.0, -8.5], [105.0, -2.0], [92.5, 9.0], [87.0, 20.8]]
    }
  },
  "Australia (Hay Point)": {
    "Paradip": {
      laneName: "Coral Sea – Torres Strait – Bay of Bengal",
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
      laneName: "Makassar Strait – Malacca Strait – Bay of Bengal",
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
      laneName: "Mozambique Channel – Trans-Indian Ocean",
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
      laneName: "Gulf of Mexico – Mediterranean – Suez Canal – Bay of Bengal",
      waypoints: [[-90.1, 29.9], [-83.0, 24.5], [-72.0, 33.0], [-40.0, 36.5], [-5.5, 35.9], [15.0, 34.5], [32.3, 31.3], [32.6, 29.5], [40.0, 20.0], [55.0, 12.0], [70.0, 7.0], [80.0, 12.0], [86.6, 20.3]],
      capeLaneName: "Gulf of Mexico – Atlantic – Cape of Good Hope – Indian Ocean",
      capeWaypoints: [[-90.1, 29.9], [-83.0, 24.5], [-70.0, 22.0], [-61.0, 12.0], [-30.0, 3.0], [-5.0, -24.0], [18.5, -34.8], [52.0, -20.0], [72.0, 2.0], [80.0, 12.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Mississippi Bulk – Suez Route – Haldia",
      waypoints: [[-90.1, 29.9], [-83.0, 24.5], [-72.0, 33.0], [-40.0, 36.5], [-5.5, 35.9], [15.0, 34.5], [32.3, 31.3], [32.6, 29.5], [40.0, 20.0], [55.0, 12.0], [70.0, 7.0], [80.0, 12.0], [88.1, 22.0]],
      capeLaneName: "US Gulf – Cape Route – Haldia",
      capeWaypoints: [[-90.1, 29.9], [-83.0, 24.5], [-70.0, 22.0], [-61.0, 12.0], [-30.0, 3.0], [-5.0, -24.0], [18.5, -34.8], [52.0, -20.0], [72.0, 2.0], [80.0, 12.0], [88.1, 22.0]]
    },
    "Vizag": {
      laneName: "Trans-Suez Corridor – Vizag",
      waypoints: [[-90.1, 29.9], [-83.0, 24.5], [-72.0, 33.0], [-40.0, 36.5], [-5.5, 35.9], [15.0, 34.5], [32.3, 31.3], [32.6, 29.5], [40.0, 20.0], [55.0, 12.0], [70.0, 7.0], [78.0, 10.0], [83.2, 17.7]],
      capeLaneName: "Trans-Atlantic Capesize Corridor – Vizag",
      capeWaypoints: [[-90.1, 29.9], [-83.0, 24.5], [-70.0, 22.0], [-61.0, 12.0], [-30.0, 3.0], [-5.0, -24.0], [18.5, -34.8], [52.0, -20.0], [72.0, 2.0], [78.0, 10.0], [83.2, 17.7]]
    },
    "Dhamra": {
      laneName: "US Gulf Export – Suez – Dhamra Terminal",
      waypoints: [[-90.1, 29.9], [-83.0, 24.5], [-72.0, 33.0], [-40.0, 36.5], [-5.5, 35.9], [15.0, 34.5], [32.3, 31.3], [32.6, 29.5], [40.0, 20.0], [55.0, 12.0], [70.0, 7.0], [80.0, 12.0], [87.0, 20.8]],
      capeLaneName: "US Gulf Deepwater Export – Cape – Dhamra",
      capeWaypoints: [[-90.1, 29.9], [-83.0, 24.5], [-70.0, 22.0], [-61.0, 12.0], [-30.0, 3.0], [-5.0, -24.0], [18.5, -34.8], [52.0, -20.0], [72.0, 2.0], [80.0, 12.0], [87.0, 20.8]]
    }
  },
  "Russia (Vladivostok)": {
    "Paradip": {
      laneName: "Sea of Japan – Taiwan Strait – Malacca – Paradip",
      waypoints: [[131.9, 43.1], [129.5, 33.0], [123.0, 25.0], [115.0, 15.0], [104.5, 1.3], [98.0, 5.5], [89.0, 12.0], [86.6, 20.3]]
    },
    "Haldia": {
      laneName: "Russian Far East Metallurgical Route – Haldia",
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

const WIDTH = 920;
const HEIGHT = 420;

export const RouteMapVisualizer: React.FC<RouteMapVisualizerProps> = ({
  origin,
  destination,
  optimalVessel,
}) => {
  const origGeo = PORT_COORDINATES[origin] || { lat: -32.92, lon: 151.78 };
  const destGeo = PORT_COORDINATES[destination] || { lat: 20.26, lon: 86.60 };
  const distance = ROUTES[origin]?.[destination] || 4500;

  // Equirectangular projection centered on the corridor hemisphere.
  // rotate([-35,0]) centers 35°E; scale 188 spans ~280° of longitude across
  // the 920px canvas — covering the US Gulf, Africa, India and Australia.
  const projection = useMemo(
    () =>
      geoEquirectangular()
        .rotate([-35, 0])
        .scale(188)
        .translate([WIDTH / 2, HEIGHT / 2])
        .precision(0.4),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);

  // Real Natural Earth coastlines (public domain).
  const landPath = useMemo(() => {
    const land = feature(landTopo as never, (landTopo as never as { objects: { land: never } }).objects.land);
    return pathGen(land as never) || '';
  }, [pathGen]);

  const graticulePath = useMemo(() => pathGen(geoGraticule().step([20, 20])()) || '', [pathGen]);

  // Great-circle route through the documented sea-lane waypoints, switching
  // to the Cape corridor when a Capesize is recommended on a US Gulf lane.
  const route = useMemo(() => {
    const corridor = MARITIME_CORRIDORS[origin]?.[destination];
    const useCape =
      origin === 'USA (New Orleans)' && optimalVessel?.vessel === 'Capesize' && corridor?.capeWaypoints;
    const waypoints = useCape ? corridor.capeWaypoints! : corridor?.waypoints ||
      [[origGeo.lon, origGeo.lat] as [number, number], [destGeo.lon, destGeo.lat] as [number, number]];
    const laneName = useCape ? corridor.capeLaneName! : corridor?.laneName || 'Direct Maritime Transit';

    const routeD = pathGen({ type: 'LineString', coordinates: waypoints } as never) || '';
    const mid = waypoints[Math.floor(waypoints.length / 2)];
    const midPoint = projection(mid as never) || [WIDTH / 2, HEIGHT / 2];
    const startPoint = projection(waypoints[0] as never) || [0, 0];
    const endPoint = projection(waypoints[waypoints.length - 1] as never) || [0, 0];
    return { routeD, laneName, midPoint, startPoint, endPoint };
  }, [origin, destination, optimalVessel?.vessel, origGeo, destGeo, pathGen, projection]);

  const project = (lon: number, lat: number): [number, number] => {
    const p = projection([lon, lat]);
    return p ? [p[0], p[1]] : [0, 0];
  };
  const [origX, origY] = project(origGeo.lon, origGeo.lat);
  const [destX, destY] = project(destGeo.lon, destGeo.lat);

  // Latitude reference lines (equator / tropics) in projected space.
  const equatorY = project(0, 0)[1];
  const cancerY = project(0, 23.5)[1];
  const capricornY = project(0, -23.5)[1];

  return (
    <div className="terminal-card p-4 flex flex-col justify-between mb-5 reveal reveal-d3">
      <div>
        <CardHeader
          icon={<Navigation className="w-4 h-4" />}
          title="Ocean Transit Corridor"
          subtitle="Natural Earth coastlines · great-circle sea lanes"
          right={
            <>
              <span className="text-xs font-mono text-slate-400">
                Distance: <strong className="text-sky-300 num">{distance.toLocaleString()} NM</strong>
              </span>
              <ProvenanceBadge type="BENCHMARK" />
            </>
          }
        />

        {/* Maritime chart */}
        <div
          className="relative w-full h-[300px] rounded-lg border border-[rgba(56,116,187,0.22)] overflow-hidden shadow-inner"
          style={{ background: 'linear-gradient(180deg, #08152b 0%, #060f20 45%, #051426 100%)' }}
        >
          <svg className="w-full h-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="landGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1c3a5e" />
                <stop offset="100%" stopColor="#142c49" />
              </linearGradient>
              <filter id="coastGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Graticule */}
            <path d={graticulePath} fill="none" stroke="rgba(86,140,200,0.10)" strokeWidth="0.6" />

            {/* Latitude reference lines */}
            <line x1="0" y1={cancerY} x2={WIDTH} y2={cancerY} stroke="rgba(86,140,200,0.14)" strokeWidth="0.8" strokeDasharray="3,5" />
            <text x="8" y={cancerY - 4} fill="rgba(125,170,215,0.45)" fontSize="8.5" fontFamily="JetBrains Mono">TROPIC OF CANCER</text>
            <line x1="0" y1={equatorY} x2={WIDTH} y2={equatorY} stroke="rgba(86,140,200,0.18)" strokeWidth="0.8" strokeDasharray="4,5" />
            <text x="8" y={equatorY - 4} fill="rgba(125,170,215,0.55)" fontSize="8.5" fontFamily="JetBrains Mono">EQUATOR</text>
            <line x1="0" y1={capricornY} x2={WIDTH} y2={capricornY} stroke="rgba(86,140,200,0.14)" strokeWidth="0.8" strokeDasharray="3,5" />
            <text x="8" y={capricornY - 4} fill="rgba(125,170,215,0.45)" fontSize="8.5" fontFamily="JetBrains Mono">TROPIC OF CAPRICORN</text>

            {/* Real coastlines (Natural Earth 110m, public domain) */}
            <path
              d={landPath}
              fill="url(#landGrad)"
              stroke="rgba(120,180,235,0.45)"
              strokeWidth="0.7"
              filter="url(#coastGlow)"
            />

            {/* Wide navigational corridor glow */}
            <path d={route.routeD} fill="none" stroke="#0369a1" strokeWidth="9" opacity="0.14" strokeLinecap="round" />
            {/* Corridor boundary */}
            <path d={route.routeD} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2" strokeLinecap="round" />
            {/* Primary animated track */}
            <path
              d={route.routeD}
              fill="none"
              stroke="url(#corridorGrad)"
              strokeWidth="3"
              strokeDasharray="10,6"
              className="route-flow"
              filter="url(#coastGlow)"
              strokeLinecap="round"
            />

            {/* Origin port node (label mirrors left when near the right edge) */}
            <g transform={`translate(${origX}, ${origY})`}>
              <circle r="13" fill="#f59e0b" opacity="0.2" className="animate-ping" />
              <circle r="5.5" fill="#fbbf24" stroke="#04070d" strokeWidth="2" />
              {origX > WIDTH - 220 ? (
                <>
                  <rect x="-138" y="-11" width="128" height="19" rx="4" fill="rgba(7,13,24,0.92)" stroke="rgba(251,191,36,0.55)" strokeWidth="0.8" />
                  <text x="-131" y="3" fill="#fcd34d" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    ORIGIN: {origin.split(' ')[0].toUpperCase()}
                  </text>
                </>
              ) : (
                <>
                  <rect x="10" y="-11" width="128" height="19" rx="4" fill="rgba(7,13,24,0.92)" stroke="rgba(251,191,36,0.55)" strokeWidth="0.8" />
                  <text x="17" y="3" fill="#fcd34d" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                    ORIGIN: {origin.split(' ')[0].toUpperCase()}
                  </text>
                </>
              )}
            </g>

            {/* Discharge port node */}
            <g transform={`translate(${destX}, ${destY})`}>
              <circle r="15" fill="#10b981" opacity="0.22" className="animate-ping" />
              <circle r="6.5" fill="#34d399" stroke="#04070d" strokeWidth="2" />
              <rect x="-138" y="-13" width="128" height="21" rx="4" fill="rgba(7,13,24,0.92)" stroke="rgba(52,211,153,0.55)" strokeWidth="0.8" />
              <text x="-131" y="2" fill="#6ee7b7" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
                DISCHARGE: {destination}
              </text>
            </g>

            {/* Mid-course transit badge */}
            <g transform={`translate(${route.midPoint[0] - 70}, ${route.midPoint[1] - 26})`}>
              <rect width="140" height="22" rx="5" fill="rgba(9,19,34,0.95)" stroke="rgba(56,116,187,0.5)" strokeWidth="1" />
              <text x="70" y="15" textAnchor="middle" fill="#93c5fd" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                {optimalVessel ? `${optimalVessel.voyage_days}d Transit` : 'Optimal Transit'}
              </text>
            </g>

            {/* Active lane caption */}
            <g transform={`translate(14, ${HEIGHT - 16})`}>
              <rect width={Math.min(560, route.laneName.length * 6.1 + 90)} height="22" rx="4" fill="rgba(5,10,20,0.85)" stroke="rgba(56,116,187,0.25)" />
              <text x="10" y="15" fill="rgba(148,163,184,0.9)" fontSize="9.5" fontFamily="JetBrains Mono">
                LANE: <tspan fill="#7dd3fc" fontWeight="bold">{route.laneName}</tspan>
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Corridor KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[rgba(56,116,187,0.14)] text-xs font-mono">
        <div className="inset-well p-2.5">
          <span className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Nautical Range
          </span>
          <span className="font-bold text-slate-100 text-sm num">{distance.toLocaleString()} NM</span>
        </div>
        <div className="inset-well p-2.5">
          <span className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Ocean Transit
          </span>
          <span className="font-bold text-slate-100 text-sm num">{optimalVessel?.voyage_days ?? '--'} Days</span>
        </div>
        <div className="inset-well p-2.5">
          <span className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
            <Fuel className="w-3.5 h-3.5 text-rose-400" /> Marine Fuel Burn
          </span>
          <span className="font-bold text-slate-100 text-sm num">{optimalVessel?.fuel_burned_mt ?? '--'} MT</span>
        </div>
        <div className="inset-well p-2.5">
          <span className="text-slate-500 text-[10px] flex items-center gap-1 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {optimalVessel?.route_via ? `Routing: ${optimalVessel.route_via}` : 'Channel Status'}
          </span>
          <span className="font-bold text-emerald-400 text-sm num">
            {PORT_COORDINATES[destination]?.draft_limit_m || 14.5}m Max Berth
          </span>
        </div>
      </div>
    </div>
  );
};
