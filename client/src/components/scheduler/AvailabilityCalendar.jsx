import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newDay, setNewDay] = useState('Monday');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');

  // Fetch slots
  const { data: slotsRes, isLoading } = useQuery({
    queryKey: ['freelancerAvailability'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/freelancer/availability`, { headers });
      return res.data;
    },
    enabled: user?.role === 'freelancer',
  });

  const slots = slotsRes?.availabilitySlots || [];

  // Update slots mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSlots) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`http://localhost:5000/api/freelancer/availability`, { availabilitySlots: updatedSlots }, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['freelancerAvailability']);
    },
  });

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (newStartTime >= newEndTime) {
      alert('End time must be after start time.');
      return;
    }
    const updatedSlots = [...slots, { day: newDay, startTime: newStartTime, endTime: newEndTime }];
    updateMutation.mutate(updatedSlots);
  };

  const handleRemoveSlot = (indexToRemove) => {
    const updatedSlots = slots.filter((_, idx) => idx !== indexToRemove);
    updateMutation.mutate(updatedSlots);
  };

  if (isLoading) {
    return <div className="text-xs text-slate-500 font-mono animate-pulse">Loading availability...</div>;
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-6">
      <div>
        <h2 className="text-md font-bold text-slate-100">Weekly Availability Schedule</h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Manage your active hours for client consultations and kickoff calls.</p>
      </div>

      {/* Add Slot Form */}
      <form onSubmit={handleAddSlot} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-950/50 border border-slate-850 p-4 rounded-2xl">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Day</label>
          <select
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1 w-full">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Start Time</label>
          <input
            type="time"
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div className="flex-1 space-y-1 w-full">
          <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">End Time</label>
          <input
            type="time"
            value={newEndTime}
            onChange={(e) => setNewEndTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={updateMutation.isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all disabled:opacity-50 w-full sm:w-auto h-9"
        >
          {updateMutation.isLoading ? 'Saving...' : 'Add Slot'}
        </button>
      </form>

      {/* Slots List */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);
          if (daySlots.length === 0) return null;

          return (
            <div key={day} className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-24 font-bold text-slate-300 text-sm">{day}</div>
              <div className="flex flex-wrap gap-2 flex-1">
                {daySlots.map((slot, idx) => {
                  const globalIdx = slots.indexOf(slot);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
                      <span className="text-xs font-mono text-indigo-400">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        onClick={() => handleRemoveSlot(globalIdx)}
                        className="text-slate-500 hover:text-red-400 transition-colors ml-2 font-bold"
                        title="Remove slot"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {slots.length === 0 && (
          <div className="text-center py-8 bg-slate-950/30 border border-slate-900 rounded-2xl text-slate-500 text-xs font-mono">
            No availability slots configured. You are currently marked as unavailable for direct calls.
          </div>
        )}
      </div>
    </div>
  );
}
