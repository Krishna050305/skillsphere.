import React, { useState, useEffect } from 'react';

export default function GigFilters({ onChange, initialFilters = {} }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [skill, setSkill] = useState(initialFilters.skill || '');
  const [minBudget, setMinBudget] = useState(initialFilters.minBudget || '');
  const [maxBudget, setMaxBudget] = useState(initialFilters.maxBudget || '');
  const [isRemoteOk, setIsRemoteOk] = useState(initialFilters.isRemoteOk || false);
  const [radius, setRadius] = useState(initialFilters.radius || 50);

  const [useGeoloc, setUseGeoloc] = useState(false);
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);

  useEffect(() => {
    if (useGeoloc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation access denied, falling back to default coordinates.', err.message);
        }
      );
    }
  }, [useGeoloc]);

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
    }, 400);

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
    <div className="card p-6 sticky top-24 space-y-6" style={{ background: 'var(--bg-card)' }}>
      <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border-secondary)' }}>
        <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Filter Gigs</h3>
        <button
          onClick={handleReset}
          className="text-xs font-semibold hover:underline cursor-pointer"
          style={{ color: 'var(--accent-primary)' }}
        >
          Reset All
        </button>
      </div>

      {/* Keyword Search */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
          Keyword Search
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Title, description..."
          className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Skill Tag */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
          Required Skill
        </label>
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="React, Python, Node..."
          className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
          Budget Range ($)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
            placeholder="Min $"
            className="w-full text-sm rounded-xl px-3 py-2 outline-none transition-all"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          />
          <input
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="Max $"
            className="w-full text-sm rounded-xl px-3 py-2 outline-none transition-all"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Remote Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Remote Work Only</span>
        <input
          type="checkbox"
          checked={isRemoteOk}
          onChange={(e) => setIsRemoteOk(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer accent-[var(--accent-primary)]"
        />
      </div>

      {/* Hyperlocal Geolocation Filters */}
      <div className="border-t pt-5 space-y-4" style={{ borderColor: 'var(--border-secondary)' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>Hyperlocal Matching</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Limit by travel radius</span>
          </div>
          <input
            type="checkbox"
            checked={useGeoloc}
            onChange={(e) => setUseGeoloc(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-[var(--accent-primary)]"
          />
        </div>

        {useGeoloc && (
          <div className="space-y-3 p-4 rounded-xl border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
            <div className="flex justify-between items-center text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Search Radius</span>
              <span className="font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{radius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

