import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, X, Loader2, Compass, ExternalLink } from 'lucide-react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { CITIES } from '../../data/seed';

interface GeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

export const GlobeSearchBar: React.FC = () => {
  const {
    buildings,
    parcels,
    selectBuilding,
    setSelectedCityId,
    setTargetCameraDestination,
    externalMarker,
    setExternalMarker,
  } = useCadastreStore();

  const [inputQuery, setInputQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedResults, setGeocodedResults] = useState<GeocodeResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter seeded buildings matching query
  const q = inputQuery.trim().toLowerCase();
  const matchedBuildings = q
    ? buildings.filter((b) => {
        const p = parcels.find((parcel) => parcel.parcelId === b.parcelId);
        return (
          b.name.toLowerCase().includes(q) ||
          b.ulpin.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          (b.bmcCtsNo && b.bmcCtsNo.toLowerCase().includes(q)) ||
          (p && p.ulpin2d.toLowerCase().includes(q)) ||
          (p && p.surveyNumber.toLowerCase().includes(q))
        );
      })
    : [];

  // Debounced geocoding search for unseeded Indian locations/cities/addresses
  useEffect(() => {
    if (!q || q.length < 3) {
      setGeocodedResults([]);
      setIsGeocoding(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=in&limit=4&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
          },
        });
        if (res.ok) {
          const data: GeocodeResult[] = await res.json();
          setGeocodedResults(data);
        }
      } catch (err) {
        console.warn('Geocoding query error:', err);
      } finally {
        setIsGeocoding(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [q]);

  const handleSelectBuilding = (buildingId: string) => {
    const b = buildings.find((item) => item.buildingId === buildingId);
    if (!b) return;

    const p = parcels.find((item) => item.parcelId === b.parcelId);
    if (p) {
      const city = CITIES.find((c) => c.code === p.city);
      if (city) setSelectedCityId(city.id);
    }

    setExternalMarker(null);
    selectBuilding(b.buildingId);

    const coords = b.footprint.coordinates[0];
    const centroidLng = coords.reduce((sum, pt) => sum + pt[0], 0) / coords.length;
    const centroidLat = coords.reduce((sum, pt) => sum + pt[1], 0) / coords.length;

    setTargetCameraDestination({
      lng: centroidLng,
      lat: centroidLat,
      height: 400,
      pitch: -38,
      heading: 25,
    });

    setInputQuery(b.name);
    setIsOpen(false);
  };

  const handleSelectGeocodedLocation = (item: GeocodeResult) => {
    const lng = parseFloat(item.lon);
    const lat = parseFloat(item.lat);

    // Deselect building cadastre (no fabricated cadastre for unseeded locations!)
    selectBuilding(null);

    // Drop real marker and fly camera
    setExternalMarker({
      name: item.display_name.split(',').slice(0, 2).join(','),
      lng,
      lat,
    });

    setTargetCameraDestination({
      lng,
      lat,
      height: 750,
      pitch: -40,
    });

    setInputQuery(item.display_name.split(',')[0]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputQuery('');
    setIsOpen(false);
    setExternalMarker(null);
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 z-30 w-80 sm:w-96">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/60 focus-within:border-blue-500 transition-all">
        <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => {
            setInputQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search any building, 3D ULPIN, or place in India..."
          className="w-full bg-transparent pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none"
        />
        {isGeocoding ? (
          <Loader2 size={15} className="absolute right-3 text-blue-400 animate-spin" />
        ) : inputQuery ? (
          <button
            onClick={handleClear}
            className="absolute right-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Clear search"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {/* External Geocoded Place Banner */}
      {externalMarker && (
        <div className="mt-2 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 truncate pr-2">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <MapPin size={13} />
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-100 text-[11px] truncate">
                {externalMarker.name}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {externalMarker.lat.toFixed(4)}°N, {externalMarker.lng.toFixed(4)}°E (Photorealistic 3D Mesh)
              </div>
            </div>
          </div>
          <button
            onClick={() => setExternalMarker(null)}
            className="text-[10px] text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded px-1.5 py-0.5 transition-colors flex-shrink-0 cursor-pointer"
          >
            Clear Pin
          </button>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && (matchedBuildings.length > 0 || geocodedResults.length > 0 || q.length > 2) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
          {/* 1. Seeded 3D Cadastral Buildings */}
          {matchedBuildings.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Building size={12} />
                <span>Seeded 3D Cadastral Structures ({matchedBuildings.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedBuildings.map((b) => (
                  <button
                    key={b.buildingId}
                    onClick={() => handleSelectBuilding(b.buildingId)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-blue-300 truncate">
                        {b.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        ULPIN: <span className="font-mono text-slate-300">{b.ulpin}</span> · {b.floorsAbove} Floors ({b.heightM}m)
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {b.address}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Geocoded Places in India */}
          {geocodedResults.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Compass size={12} />
                <span>Geocoded Places & Addresses across India</span>
              </div>
              <div className="space-y-1 mt-1">
                {geocodedResults.map((item) => (
                  <button
                    key={item.place_id}
                    onClick={() => handleSelectGeocodedLocation(item)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-emerald-300 truncate">
                        {item.display_name.split(',')[0]}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.display_name.split(',').slice(1).join(',')}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        {parseFloat(item.lat).toFixed(4)}°N, {parseFloat(item.lon).toFixed(4)}°E
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Empty State */}
          {matchedBuildings.length === 0 && geocodedResults.length === 0 && !isGeocoding && q.length >= 3 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching buildings or locations found for &ldquo;{inputQuery}&rdquo;. Try another city, street, or 3D ULPIN.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
