import React, { useState, useEffect } from 'react';
import { useMqtt } from './hooks/useMqtt';
import Header from './components/Header';
import FloorSelector from './components/FloorSelector';
import DeviceCard from './components/DeviceCard';
import HistoryView from './components/HistoryView';
import { Activity, Zap, Layers, Wifi } from 'lucide-react';
import { estimateRealPower } from './utils/power';

export default function App() {
  const { brokerUrl, status, devices, toggleRelay } = useMqtt();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [historyDevice, setHistoryDevice] = useState(null);
  const [, setTick] = useState(false);

  // Re-evaluate connected devices every 5 seconds (same threshold as DeviceCard)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => !t), 5000);
    return () => clearInterval(id);
  }, []);

  // Extract the 30 devices for the currently selected floor (Meters 1 to 30)
  const floorDevices = [];
  for (let meter = 1; meter <= 30; meter++) {
    const topic = `${selectedFloor}/${meter}`;
    if (devices[topic]) {
      floorDevices.push(devices[topic]);
    }
  }

  // Calculate totals for the selected floor (estimated real power)
  const totalFloorPower = floorDevices.reduce((sum, d) => sum + estimateRealPower(d.power), 0);
  const totalFloorCurrent = floorDevices.reduce((sum, d) => sum + (d.current || 0), 0);
  const activeCount = floorDevices.filter(
    (d) => d.relayOn && d.lastSeen !== null && Date.now() - d.lastSeen < 15000
  ).length;
  const connectedCount = floorDevices.filter(
    (d) => d.lastSeen !== null && Date.now() - d.lastSeen < 15000
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header: Displays MQTT Connection Status Indicator & Broker URL */}
      <Header
        brokerUrl={brokerUrl}
        status={status}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {historyDevice ? (
          /* Dedicated Energy History & Analytics View */
          <HistoryView
            device={historyDevice}
            onBack={() => setHistoryDevice(null)}
          />
        ) : (
          /* Live Monitoring Dashboard */
          <>
            {/* Navigation / Floor Selector */}
            <div className="flex items-center">
              <FloorSelector
                selectedFloor={selectedFloor}
                onSelectFloor={setSelectedFloor}
              />
            </div>

            {/* Selected Floor Real-Time Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Floor {selectedFloor} Total Power</p>
                  <p className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                    {totalFloorPower.toFixed(1)} W
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Floor {selectedFloor} Current Draw</p>
                  <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    {totalFloorCurrent.toFixed(2)} A
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Connected</p>
                  <p className="text-2xl font-bold font-mono text-sky-300 mt-1">
                    {connectedCount} / 30
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Wifi className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Active Relays</p>
                  <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {activeCount} / 30
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 30 Device Cards Grid for Selected Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {floorDevices.map((device) => (
                <DeviceCard
                  key={`${device.floor}/${device.meter}`}
                  device={device}
                  onToggleRelay={toggleRelay}
                  onViewHistory={setHistoryDevice}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
