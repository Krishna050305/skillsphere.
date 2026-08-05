import React, { useState } from 'react';
import { X, Check, Building2, Globe, Users, FileText, MapPin, Phone } from 'lucide-react';

export default function EditClientProfileModal({ user, onClose, onSave }) {
  // Basic info
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.location?.city || '');
  const [address, setAddress] = useState(user.location?.address || '');

  // Client profile info
  const cp = user.clientProfile || {};
  const [companyName, setCompanyName] = useState(cp.companyName || '');
  const [tagline, setTagline] = useState(cp.tagline || '');
  const [industry, setIndustry] = useState(cp.industry || '');
  const [website, setWebsite] = useState(cp.website || '');
  const [companySize, setCompanySize] = useState(cp.companySize || '1-10');
  const [about, setAbout] = useState(cp.about || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Company Name is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: {
          city: city.trim() || undefined,
          address: address.trim() || undefined,
        },
        clientProfile: {
          companyName: companyName.trim(),
          tagline: tagline.trim() || undefined,
          industry: industry.trim() || undefined,
          website: website.trim() || undefined,
          companySize,
          about: about.trim() || undefined,
        },
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update company profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">Edit Client Company Profile</h2>
              <p className="text-xs text-slate-400">Update company identity, industry domain & contact details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-slate-400 hover:text-white">×</button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Company / Organization Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Acme Tech Solutions"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Primary Account Representative Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
              Company Tagline / Mission
            </label>
            <input
              type="text"
              maxLength={150}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Building Next-Generation Enterprise SaaS Products"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Industry Category
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Software & Tech"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Company Size
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="1-10">1 - 10 Employees</option>
                <option value="11-50">11 - 50 Employees</option>
                <option value="51-200">51 - 200 Employees</option>
                <option value="201-500">201 - 500 Employees</option>
                <option value="500+">500+ Employees</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
              About Company / Overview Description
            </label>
            <textarea
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Describe your company, main products, and the projects you hire freelancers for..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                Phone Contact
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="+1 555-0188"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. New York"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. NY, USA"
              />
            </div>
          </div>

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
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Client Profile
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
