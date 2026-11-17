import React from 'react';
import { Zap } from 'lucide-react';

export default function Header({ brokerUrl, status }) {
  const statusStyle = {
    Connected:    { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', label: 'Connected' },
    Connecting:   { dot: 'bg-amber-400 animate-ping',   text: 'text-amber-400',   label: 'Connecting' },
    Disconnected: { dot: 'bg-rose-400',                  text: 'text-rose-400',    label: 'Disconnected' },
    Error:        { dot: 'bg-rose-400',                  text: 'text-rose-400',    label: 'Error' },
  }[status] ?? { dot: 'bg-slate-500', text: 'text-slate-400', label: status };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-linear-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 shrink-0">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            IoT Monitoring <span className="text-cyan-400">&</span> Control
          </h1>
        </div>

        {/* Right side: Broker + Status */}
        <div className="flex items-center gap-2">
          {/* Broker URL — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono">
            <span className="text-slate-500">broker</span>
            <span className="text-cyan-300 truncate max-w-65">{brokerUrl}</span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />
            <span className={statusStyle.text}>{statusStyle.label}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
