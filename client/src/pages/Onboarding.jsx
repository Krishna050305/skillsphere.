import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth.js';
import { updateMe } from '../api/auth.api.js';
import { updateProfileSuccess } from '../store/authSlice.js';

export default function Onboarding() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, getMe } = useAuth();

  // Freelancer states
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [proficiency, setProficiency] = useState('intermediate');
  const [skills, setSkills] = useState([]); // [{ name, proficiency }]
  const [hourlyRate, setHourlyRate] = useState(30);

  // Client states
  const [companyName, setCompanyName] = useState('');
  const [about, setAbout] = useState('');

  // General states
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in or onboarding already complete
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Check if onboarding is already completed
    if (user.role === 'freelancer' && user.freelancerProfile?.headline && user.freelancerProfile?.bio) {
      navigate('/');
    } else if (user.role === 'client' && user.clientProfile?.companyName) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === skillInput.trim().toLowerCase())) {
      setError('Skill already added.');
      return;
    }
    if (skills.length >= 20) {
      setError('You can add up to 20 skills.');
      return;
    }
    setSkills([...skills, { name: skillInput.trim(), proficiency }]);
    setSkillInput('');
    setError('');
  };

  const handleRemoveSkill = (indexToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let payload = {};

      if (user.role === 'freelancer') {
        if (!headline.trim() || !bio.trim()) {
          throw new Error('Headline and Bio are required.');
        }
        payload = {
          location: {
            city: city.trim() || undefined,
            address: address.trim() || undefined,
          },
          freelancerProfile: {
            headline: headline.trim(),
            bio: bio.trim(),
            skills,
            hourlyRate: Number(hourlyRate),
          },
        };
      } else {
        if (!companyName.trim()) {
          throw new Error('Company Name is required.');
        }
        payload = {
          location: {
            city: city.trim() || undefined,
            address: address.trim() || undefined,
          },
          clientProfile: {
            companyName: companyName.trim(),
            about: about.trim() || undefined,
          },
        };
      }

      const res = await updateMe(payload);
      if (res.success) {
        dispatch(updateProfileSuccess(res.user));
        // Refresh token state
        await getMe();
        navigate('/');
      } else {
        setError(res.message || 'Onboarding update failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(26,107,75,0.06), transparent 70%)' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative">
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
            <span className="text-xl font-black text-white font-display">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight font-display" style={{ color: 'var(--accent-primary)' }}>
            Skill<span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>Complete Your Profile</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          You are registered as a <span className="font-semibold uppercase" style={{ color: 'var(--accent-primary)' }}>{user.role}</span>.
          Let's set up the remaining details.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative">
        <div className="py-8 px-6 rounded-2xl sm:px-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', boxShadow: 'var(--shadow-lg)' }}>
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CONDITIONAL RENDER: Freelancer Onboarding Fields */}
            {user.role === 'freelancer' && (
              <>
                {/* Headline */}
                <div>
                  <label htmlFor="headline" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Professional Headline *
                  </label>
                  <input
                    id="headline"
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="e.g. Senior Full Stack Engineer / Expert UI Designer"
                    maxLength={100}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Professional Bio *
                  </label>
                  <textarea
                    id="bio"
                    required
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all resize-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="Describe your experience, past projects, and domain expertise..."
                    maxLength={1000}
                  />
                </div>

                {/* Skills Manager */}
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Skills & Expertise (Min 1, Max 20)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="flex-1 rounded-xl px-4 py-2.5 outline-none transition-all"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      placeholder="e.g. React, Node.js, Figma"
                    />
                    <select
                      value={proficiency}
                      onChange={(e) => setProficiency(e.target.value)}
                      className="rounded-xl px-3 py-2.5 outline-none font-semibold"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="btn-primary px-4 rounded-xl font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Skills Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="badge badge-green"
                      >
                        {skill.name}{' '}
                        <span className="text-[10px] uppercase font-mono" style={{ color: 'var(--text-muted)' }}>({skill.proficiency})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-rose-400 hover:text-rose-300 ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No skills added yet.</span>
                    )}
                  </div>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label htmlFor="hourlyRate" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Hourly Rate ($ USD) *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="font-mono" style={{ color: 'var(--text-muted)' }}>$</span>
                    </div>
                    <input
                      id="hourlyRate"
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full rounded-xl pl-8 pr-4 py-3 outline-none transition-all"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* CONDITIONAL RENDER: Client Onboarding Fields */}
            {user.role === 'client' && (
              <>
                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Company / Organization Name *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="e.g. Stripe Inc. or Freelance Buyer"
                  />
                </div>

                {/* About Company */}
                <div>
                  <label htmlFor="about" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    About Company / Business Description
                  </label>
                  <textarea
                    id="about"
                    rows={4}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all resize-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="Describe your company, main products, and why you are looking to hire freelancers..."
                  />
                </div>
              </>
            )}

            {/* Location Fields (Common) */}
            <div className="pt-6" style={{ borderTop: '1px solid var(--border-secondary)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="e.g. San Francisco"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    State / Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="e.g. California, USA"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Complete Onboarding'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
