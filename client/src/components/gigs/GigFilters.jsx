import React, { useState, useEffect } from 'react';

export default function GigFilters({ onChange, initialFilters = {} }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [skill, setSkill] = useState(initialFilters.skill || '');
  const [minBudget, setMinBudget] = useState(initialFilters.minBudget || '');
  const [maxBudget, setMaxBudget] = useState(initialFilters.maxBudget || '');
  const [isRemoteOk, setIsRemoteOk] = useState(initialFilters.isRemoteOk || false);
  const [radius, setRadius] = useState(initialFilters.radius || 50);

  // Geographic coordinates (Mumbai coordinates as default mock, or read from browser geolocation)
  const [useGeoloc, setUseGeoloc] = useState(false);
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);

  // Capture user location if checkbox clicked
  useEffect(() => {
    if (useGeoloc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation access denied, falling back to default Mumbai coordinates.', err.message);
        }
      );
    }
  }, [useGeoloc]);

  // Debounce filter trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const filters = {
        search,
        skill,
        minBudget,
        maxBudget,
        isRemoteOk: isRemoteOk ? 'true' : undefined,
      };

      if (useGeoloc) {
        filters.latitude = latitude;
        filters.longitude = longitude;
        filters.radius = radius;
      }

      onChange(filters);
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [search, skill, minBudget, maxBudget, isRemoteOk, radius, useGeoloc, latitude, longitude, onChange]);

  const handleReset = () => {
    setSearch('');
    setSkill('');
    setMinBudget('');
    setMaxBudget('');
    setIsRemoteOk(false);
    setUseGeoloc(false);
    setRadius(50);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm sticky top-24 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h3 className="text-md font-bold text-slate-100">Filter Gigs</h3>
        <button
          onClick={handleReset}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Keyword Search */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
          Keyword Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, desc..."
            className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Skill Tag */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
          Required Skill Tag
        </label>
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="e.g. React, Node.js"
          className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
          Budget Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
            placeholder="Min"
            className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="Max"
            className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Remote Toggle */}
      <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/65">
        <span className="text-xs font-semibold text-slate-300">Remote Work Only</span>
        <input
          type="checkbox"
          checked={isRemoteOk}
          onChange={(e) => setIsRemoteOk(e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
        />
      </div>

      {/* Hyperlocal Geolocation Filters */}
      <div className="border-t border-slate-800/80 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Hyperlocal Matching</span>
            <span className="text-[10px] text-slate-500 font-mono">Limit by travel radius</span>
          </div>
          <input
            type="checkbox"
            checked={useGeoloc}
            onChange={(e) => setUseGeoloc(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500 focus:ring-2"
          />
        </div>

        {useGeoloc && (
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 animate-fadeIn">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Search Radius</span>
              <span className="font-mono font-bold text-indigo-400">{radius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="text-[10px] text-slate-500 font-mono flex justify-between">
              <span>Lat: {latitude.toFixed(4)}</span>
              <span>Lng: {longitude.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
