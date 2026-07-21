import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';

export default function PostGig() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [budgetType, setBudgetType] = useState('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [isRemoteOk, setIsRemoteOk] = useState(true);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Milestone list
  const [milestones, setMilestones] = useState([
    { title: 'Initial Draft & Setup', amount: '', dueDate: '', status: 'pending' }
  ]);

  // Attachment list (Mock URLs)
  const [attachments, setAttachments] = useState([]);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Add skill tag
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillsInput.trim().replace(/,$/, '');
      if (val && !requiredSkills.includes(val)) {
        setRequiredSkills([...requiredSkills, val]);
      }
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
  };

  // Milestones manipulation
  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: '', amount: '', dueDate: '', status: 'pending' }]);
  };

  const handleRemoveMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleMilestoneChange = (idx, field, value) => {
    const updated = [...milestones];
    updated[idx][field] = value;
    setMilestones(updated);
  };

  // Attachments manipulation
  const handleAddAttachment = (e) => {
    e.preventDefault();
    if (attachmentName && attachmentUrl) {
      setAttachments([...attachments, { name: attachmentName, url: attachmentUrl }]);
      setAttachmentName('');
      setAttachmentUrl('');
    }
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Standard Mumbai coords mock if no custom city coordinates inputted
    const locationObj = isRemoteOk ? undefined : {
      coordinates: [72.8777, 19.0760], // default Mumbai
      city: city || 'Mumbai',
      address: address || 'Downtown',
    };

    const formattedMilestones = milestones.map(m => ({
      title: m.title,
      amount: Number(m.amount),
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      status: m.status,
    })).filter(m => m.title && m.amount > 0);

    const payload = {
      title,
      description,
      requiredSkills,
      budgetType,
      budgetMin: Number(budgetMin),
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      isRemoteOk,
      location: locationObj,
      milestones: formattedMilestones.length > 0 ? formattedMilestones : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    try {
      const res = await axios.post('http://localhost:5000/api/gigs', payload, { headers });
      if (res.data?.success) {
        navigate(`/gigs/${res.data.gig._id}`);
      }
    } catch (err) {
      console.error('Create gig error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.join(', ') || 
        'Failed to publish gig.'
      );
      setStep(1); // Go back to first step to fix fields if validation failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-black">Post a New Gig</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Setup your project details, milestone payouts, and find developers near you.</p>
        </div>

        {/* Progress Step Header */}
        <div className="flex justify-between items-center bg-slate-900/30 p-4 border border-slate-800 rounded-2xl backdrop-blur-sm">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : step > s
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-950 border border-slate-800 text-slate-600'
              }`}>
                {s}
              </div>
              <span className={`text-xs font-semibold hidden md:inline ${
                step === s ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                {s === 1 && 'Project Details'}
                {s === 2 && 'Milestones'}
                {s === 3 && 'Attachments'}
                {s === 4 && 'Review & Publish'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Wizard Form Panels */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm space-y-6">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Gig Title (Min 10 chars)</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Need senior React developer to implement map module"
                  className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Detailed Description (Min 30 chars)</label>
                <textarea
                  required
                  rows="6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a clear brief detailing tasks, technologies, and deadlines..."
                  className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-605 focus:outline-none focus:border-indigo-500 transition-colors"
                ></textarea>
              </div>

              {/* Tag Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Skills Required (Press Enter or comma to add)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="React, Express, Python..."
                  className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {requiredSkills.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-800 text-slate-350 border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(tag)}
                          className="hover:text-rose-450 font-bold text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Budget Type</label>
                  <select
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value)}
                    className="w-full text-sm bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Min Budget ($)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="100"
                    className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Max Budget ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="500"
                    className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Location details */}
              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-slate-200 block">Remote OK?</label>
                    <span className="text-[10px] text-slate-500 font-mono">Check if this gig is open to remote freelancers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRemoteOk}
                    onChange={(e) => setIsRemoteOk(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500 focus:ring-2"
                  />
                </div>

                {!isRemoteOk && (
                  <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">City</label>
                      <input
                        required
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                        className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Street Address</label>
                      <input
                        required
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Bandra West"
                        className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Milestones */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-md font-bold text-slate-200">Define Project Milestones</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Break down your project into deliverables. Sum of milestones must be ≤ Max Budget.</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg border border-indigo-500/20 transition-all"
                >
                  + Add Milestone
                </button>
              </div>

              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-3 relative group">
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-rose-500 text-xs font-mono"
                      >
                        Remove
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Milestone Title</label>
                        <input
                          required
                          type="text"
                          value={m.title}
                          onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Design Wireframes"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Payout Amount ($)</label>
                        <input
                          required
                          type="number"
                          min="1"
                          value={m.amount}
                          onChange={(e) => handleMilestoneChange(idx, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Due Date</label>
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => handleMilestoneChange(idx, 'dueDate', e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Attachments */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-slate-200">Project Attachments</h3>
                <span className="text-[10px] text-slate-500 font-mono">Link PDF briefs, layouts, or wireframe reference files.</span>
              </div>

              {/* Add attachment form */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Label</label>
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Brief PDF"
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Attachment URL</label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://example.com/brief.pdf"
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Added Attachments</span>
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-350">{att.name} ({att.url})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-rose-500 hover:text-rose-450 font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Publish */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-slate-200">Review & Publish Project</h3>
                <span className="text-[10px] text-slate-500 font-mono">Double check your details before opening the gig to applications.</span>
              </div>

              <div className="space-y-4 border border-slate-800 p-6 bg-slate-950/40 rounded-xl text-sm font-sans space-y-4">
                <div>
                  <strong className="text-slate-400 block font-mono text-xs uppercase">Title</strong>
                  <span className="text-slate-200 text-lg font-bold">{title}</span>
                </div>
                <div>
                  <strong className="text-slate-400 block font-mono text-xs uppercase">Description</strong>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed mt-1">{description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-slate-400 block font-mono text-xs uppercase">Budget Type</strong>
                    <span className="text-slate-200 uppercase font-semibold">{budgetType}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 block font-mono text-xs uppercase">Budget Range</strong>
                    <span className="text-indigo-400 font-bold">
                      ${Number(budgetMin).toLocaleString()}
                      {budgetMax ? ` - $${Number(budgetMax).toLocaleString()}` : '+'}
                    </span>
                  </div>
                </div>
                <div>
                  <strong className="text-slate-400 block font-mono text-xs uppercase">Required Skills</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {requiredSkills.map(tag => (
                      <span key={tag} className="text-xs bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded-md text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className="text-slate-400 block font-mono text-xs uppercase">Location Type</strong>
                  <span className="text-slate-200">
                    {isRemoteOk ? '🌐 Remote OK' : `📍 On-site (${city}, ${address})`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 1))}
              disabled={step === 1 || loading}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-30 text-xs font-bold py-2 px-5 rounded-xl border border-slate-700 transition-colors"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, 4))}
                disabled={step === 1 && (!title || !description || requiredSkills.length === 0 || !budgetMin)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 text-xs font-bold py-2 px-5 rounded-xl transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all"
              >
                {loading ? 'Publishing...' : 'Publish Gig'}
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
