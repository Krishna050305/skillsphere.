import React, { useState } from 'react';
import { X, Plus, Trash2, Check, User, Briefcase, Award, MapPin, DollarSign, Clock } from 'lucide-react';

export default function EditFreelancerProfileModal({ user, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'skills', 'work', 'portfolio'
  
  // Basic info
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.location?.city || '');
  const [address, setAddress] = useState(user.location?.address || '');

  // Freelancer profile info
  const fp = user.freelancerProfile || {};
  const [headline, setHeadline] = useState(fp.headline || '');
  const [bio, setBio] = useState(fp.bio || '');
  const [hourlyRate, setHourlyRate] = useState(fp.hourlyRate || 30);
  const [availability, setAvailability] = useState(fp.availability || 'available');

  // Skills
  const [skills, setSkills] = useState(fp.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');

  // Work History
  const [workHistory, setWorkHistory] = useState(fp.workHistory || []);
  const [whTitle, setWhTitle] = useState('');
  const [whCompany, setWhCompany] = useState('');
  const [whFrom, setWhFrom] = useState('');
  const [whTo, setWhTo] = useState('');
  const [whDesc, setWhDesc] = useState('');

  // Portfolio Items
  const [portfolio, setPortfolio] = useState(fp.portfolio || []);
  const [portTitle, setPortTitle] = useState('');
  const [portImage, setPortImage] = useState('');
  const [portLink, setPortLink] = useState('');
  const [portDesc, setPortDesc] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Skills handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setError('Skill already added.');
      return;
    }
    setSkills([...skills, { name: newSkillName.trim(), proficiency: newSkillProficiency }]);
    setNewSkillName('');
    setError('');
  };

  const handleRemoveSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  // Work history handlers
  const handleAddWork = () => {
    if (!whTitle.trim() || !whCompany.trim() || !whFrom) {
      setError('Title, Company, and From Date are required for work history.');
      return;
    }
    setWorkHistory([
      ...workHistory,
      {
        title: whTitle.trim(),
        company: whCompany.trim(),
        from: new Date(whFrom).toISOString(),
        to: whTo ? new Date(whTo).toISOString() : null,
        description: whDesc.trim(),
      },
    ]);
    setWhTitle('');
    setWhCompany('');
    setWhFrom('');
    setWhTo('');
    setWhDesc('');
    setError('');
  };

  const handleRemoveWork = (idx) => {
    setWorkHistory(workHistory.filter((_, i) => i !== idx));
  };

  // Portfolio handlers
  const handleAddPortfolio = () => {
    if (!portTitle.trim()) {
      setError('Portfolio title is required.');
      return;
    }
    setPortfolio([
      ...portfolio,
      {
        title: portTitle.trim(),
        imageUrl: portImage.trim(),
        link: portLink.trim(),
        description: portDesc.trim(),
      },
    ]);
    setPortTitle('');
    setPortImage('');
    setPortLink('');
    setPortDesc('');
    setError('');
  };

  const handleRemovePortfolio = (idx) => {
    setPortfolio(portfolio.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: {
          city: city.trim() || undefined,
          address: address.trim() || undefined,
        },
        freelancerProfile: {
          headline: headline.trim(),
          bio: bio.trim(),
          hourlyRate: Number(hourlyRate),
          availability,
          skills,
          workHistory,
          portfolio,
        },
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">Edit Freelancer Profile</h2>
              <p className="text-xs text-slate-400">Update your professional portfolio and service offerings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 gap-2 bg-slate-950/40 font-mono text-xs">
          {[
            { id: 'general', label: 'Basic & Overview', icon: User },
            { id: 'skills', label: 'Skills & Rates', icon: Award },
            { id: 'work', label: 'Work History', icon: Briefcase },
            { id: 'portfolio', label: 'Portfolio', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-slate-400 hover:text-white">×</button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                  Professional Headline *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Senior Full Stack React & Node Engineer"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                  Professional Bio *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Describe your background, years of experience, key tools, and solutions delivered..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Address / State
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. California, USA"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS & RATES */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Hourly Rate ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500">$</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="available">🟢 Available for new work</option>
                    <option value="busy">🟡 Busy (Limited capacity)</option>
                    <option value="unavailable">🔴 Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Skills Manager */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-400">
                  Manage Skills (Min 1, Max 20)
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. TypeScript, React, Python"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200"
                    >
                      <span>{skill.name}</span>
                      <span className="text-[10px] uppercase text-emerald-400 font-mono">({skill.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="text-slate-500 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORK HISTORY */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Add Past Position</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Role Title (e.g. Frontend Lead)"
                    value={whTitle}
                    onChange={(e) => setWhTitle(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Company Name (e.g. Acme Corp)"
                    value={whCompany}
                    onChange={(e) => setWhCompany(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">From Date</label>
                    <input
                      type="date"
                      value={whFrom}
                      onChange={(e) => setWhFrom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">To Date (Leave blank if current)</label>
                    <input
                      type="date"
                      value={whTo}
                      onChange={(e) => setWhTo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <textarea
                  placeholder="Key accomplishments, technologies used..."
                  value={whDesc}
                  onChange={(e) => setWhDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 resize-none"
                />

                <button
                  type="button"
                  onClick={handleAddWork}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  + Add Experience Record
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                {workHistory.map((wh, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-slate-200">{wh.title}</h5>
                      <p className="text-xs text-emerald-400 font-medium">{wh.company}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(wh.from).toLocaleDateString()} - {wh.to ? new Date(wh.to).toLocaleDateString() : 'Present'}
                      </p>
                      {wh.description && <p className="text-xs text-slate-400 mt-2">{wh.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWork(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Add Portfolio Item</h4>
                <input
                  type="text"
                  placeholder="Project Title *"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={portImage}
                  onChange={(e) => setPortImage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Live Project / Github Link (optional)"
                  value={portLink}
                  onChange={(e) => setPortLink(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
                <textarea
                  placeholder="Project overview & technical highlights..."
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 resize-none"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  + Add Portfolio Item
                </button>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {portfolio.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-xl mb-2" />
                      )}
                      <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-400 underline">
                          View Link
                        </a>
                      ) : <span />}
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolio(idx)}
                        className="text-slate-500 hover:text-red-400 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Freelancer Profile
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
