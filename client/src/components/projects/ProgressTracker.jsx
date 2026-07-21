import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth.js';

export default function ProgressTracker({ gig, milestone }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAssignedFreelancer = user?.role === 'freelancer' && gig.assignedFreelancer?._id === user?._id;
  const isClient = user?.role === 'client' && gig.client?._id === user?._id;

  const [progressVal, setProgressVal] = useState(milestone.progressPercent || 0);
  const [logNote, setLogNote] = useState('');
  const [logFile, setLogFile] = useState(null);
  const [logLoading, setLogLoading] = useState(false);

  const updateProgressMutation = useMutation({
    mutationFn: async (newPercent) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(
        `http://localhost:5000/api/gigs/${gig._id}/milestones/${milestone._id}/progress`,
        { progressPercent: newPercent },
        { headers }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gig', gig._id]);
    },
  });

  const handleProgressChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setProgressVal(val);
  };

  const handleProgressSave = () => {
    if (progressVal !== milestone.progressPercent) {
      updateProgressMutation.mutate(progressVal);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logNote.trim()) return;

    try {
      setLogLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      const formData = new FormData();
      formData.append('note', logNote);
      if (logFile) {
        formData.append('file', logFile);
      }

      await axios.post(
        `http://localhost:5000/api/gigs/${gig._id}/milestones/${milestone._id}/logs`,
        formData,
        { headers }
      );

      setLogNote('');
      setLogFile(null);
      queryClient.invalidateQueries(['gig', gig._id]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add progress log.');
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-6 mt-4">
      <div className="border-b border-slate-850 pb-4">
        <h3 className="text-sm font-bold text-slate-200">Work Progress: {milestone.title}</h3>
        <p className="text-[10px] text-slate-500 font-mono mt-1">Track deliverables and execution status distinct from the financial escrow state.</p>
      </div>

      {/* Progress Bar Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-slate-400">Execution Progress</span>
          <span className="text-indigo-400">{progressVal}%</span>
        </div>

        <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressVal}%` }}
          ></div>
        </div>

        {isAssignedFreelancer && (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressVal}
              onChange={handleProgressChange}
              onMouseUp={handleProgressSave}
              onTouchEnd={handleProgressSave}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            {updateProgressMutation.isLoading && <span className="text-[10px] text-slate-500 font-mono animate-pulse">Saving...</span>}
          </div>
        )}
      </div>

      {/* Progress Logs Feed */}
      <div className="space-y-4 pt-4 border-t border-slate-850">
        <h4 className="text-xs font-bold text-slate-350 font-mono uppercase tracking-widest">Update Logs</h4>

        {(milestone.progressLogs || []).length === 0 ? (
          <p className="text-xs text-slate-500 font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            No progress logs submitted yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {(milestone.progressLogs || []).slice().reverse().map((log, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-2 relative before:absolute before:-left-[1px] before:top-4 before:bottom-4 before:w-1 before:bg-indigo-500 before:rounded-r-md">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-xs text-slate-300 font-sans leading-relaxed flex-1">{log.note}</p>
                  <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {log.fileUrl && (
                  <div className="pt-2">
                    {log.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                      <img src={log.fileUrl} alt="Log Attachment" className="w-full max-h-32 object-cover rounded-xl border border-slate-800" />
                    ) : (
                      <a href={log.fileUrl} target="_blank" rel="noreferrer" className="inline-block px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-indigo-400 font-mono transition-colors">
                        📎 View Attached File
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Log Form (Freelancer Only) */}
      {isAssignedFreelancer && (
        <form onSubmit={handleAddLog} className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl space-y-3">
          <textarea
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="Write a brief progress update for the client..."
            className="w-full h-16 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
            required
          />
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              onChange={(e) => setLogFile(e.target.files[0])}
              className="flex-1 text-[10px] text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 transition-colors w-full cursor-pointer"
            />
            <button
              type="submit"
              disabled={logLoading || !logNote.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto shrink-0"
            >
              {logLoading ? 'Posting...' : 'Post Log'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
