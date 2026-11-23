import React, { useState, useEffect } from 'react';
import { Activity, Power, Zap, History } from 'lucide-react';
import { estimateRealPower } from '../utils/power';

export default function DeviceCard({ device, onToggleRelay, onViewHistory }) {
  const { floor, meter, current, power, relayOn, lastSeen } = device;
  const [isPressing, setIsPressing] = useState(false);
  const [, setTick] = useState(false);

  // Re-evaluate isLive every 5 seconds so stale devices flip to Offline automatically
  useEffect(() => {
    const id = setInterval(() => setTick((t) => !t), 5000);
    return () => clearInterval(id);
  }, []);

  const isLive = lastSeen !== null && Date.now() - lastSeen < 15000;

  // Identifier formatted as "Floor - {X} Room #{Y}"
  const formattedId = `Floor - ${floor} Room #${meter}`;
  const controlTopic = `${floor}/${meter}c`;

  const handleToggle = () => {
    setIsPressing(true);
    onToggleRelay(floor, meter);
    setTimeout(() => setIsPressing(false), 300);
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between ${
        relayOn
          ? 'bg-slate-900/90 border-slate-700/80 shadow-md shadow-emerald-950/20'
          : 'bg-slate-950/60 border-slate-800/80 opacity-90'
      } ${isPressing ? 'scale-[0.98] ring-2 ring-cyan-500/50' : 'hover:border-slate-600'}`}
    >
      {/* Top Header: Device Identifier, Badges, & History Button */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-white text-base tracking-tight">
              {formattedId}
            </h3>
            {/* Connected / Offline badge */}
            <span
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isLive
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'bg-slate-700/40 text-slate-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
              {isLive ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Usage Report Button */}
            <button
              onClick={() => onViewHistory && onViewHistory(device)}
              title="View energy usage and history"
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 active:scale-95 shadow-xs transition-all duration-150 text-[11px] font-semibold"
            >
              <History className="w-3.5 h-3.5" />
              <span>Usage</span>
            </button>

            {/* Relay Status Badge: Green "ON" or Red "OFF" */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                relayOn
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  relayOn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              {relayOn ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Telemetry Metrics: Current & Apparent Power */}
        <div className="grid grid-cols-2 gap-3 my-4">
          {/* Real-Time Current: formatted to 2 decimal places with "A" unit */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {(current || 0).toFixed(2)} A
            </div>
          </div>

          {/* Power: formatted to 1 decimal place with "W" unit (estimated real power) */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Power</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {estimateRealPower(power).toFixed(1)} W
            </div>
          </div>
        </div>
      </div>

      {/* Control Action: Interactive Toggle Button publishing "ON" or "OFF" to X/Yc */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Relay Control</span>
        <button
          onClick={handleToggle}
          disabled={!isLive}
          title={!isLive ? 'Device is offline' : relayOn ? 'Turn relay OFF' : 'Turn relay ON'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border ${
            !isLive
              ? 'bg-slate-800/40 border-slate-700/40 text-slate-600 cursor-not-allowed'
              : relayOn
              ? 'cursor-pointer bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white active:scale-95'
              : 'cursor-pointer bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white active:scale-95'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>Switch {relayOn ? 'OFF' : 'ON'}</span>
        </button>
      </div>
    </div>
  );
}
