import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

const BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || 'wss://broker.hivemq.com:8884/mqtt';

// Pre-populate 90 devices (3 floors x 30 rooms)
const initializeDevices = () => {
  const initial = {};
  for (let floor = 1; floor <= 3; floor++) {
    for (let meter = 1; meter <= 30; meter++) {
      const topic = `${floor}/${meter}`;
      initial[topic] = {
        floor,
        meter,
        current: 0.0,
        power: 0.0,
        relayOn: false,
        lastSeen: null,
      };
    }
  }
  return initial;
};

export function useMqtt() {
  const [status, setStatus] = useState('Connecting');
  const [devices, setDevices] = useState(initializeDevices);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL);
    clientRef.current = client;

    client.on('connect', () => {
      setStatus('Connected');
      // Subscribing to all 3 floors (1/1 to 3/30)
      client.subscribe(['1/+', '2/+', '3/+']);
    });

    client.on('reconnect', () => setStatus('Connecting'));
    client.on('close', () => setStatus('Disconnected'));
    client.on('error', () => setStatus('Error'));

    // Handle incoming telemetry
    client.on('message', (topic, message) => {
      // Ignore control topics (e.g., 1/1c)
      if (topic.endsWith('c')) return;

      try {
        const data = JSON.parse(message.toString());
        const [floorStr, meterStr] = topic.split('/');
        const floor = parseInt(floorStr, 10);
        const meter = parseInt(meterStr, 10);

        if (floor >= 1 && floor <= 3 && meter >= 1 && meter <= 30) {
          setDevices((prev) => ({
            ...prev,
            [topic]: {
              floor,
              meter,
              current: Number(data.current) || 0,
              power: Number(data.power) || 0,
              relayOn:
                data.relayOn === true ||
                String(data.relayOn).toUpperCase() === 'ON' ||
                String(data.relayOn) === 'true',
              lastSeen: Date.now(),
            },
          }));
        }
      } catch {
        // Ignore non-JSON messages
      }
    });

    return () => {
      if (client) client.end(true);
    };
  }, []);

  // Publish ON/OFF command to X/Yc
  const toggleRelay = (floor, meter) => {
    const topic = `${floor}/${meter}`;
    const controlTopic = `${floor}/${meter}c`;
    const currentDevice = devices[topic];
    const nextState = !currentDevice?.relayOn;
    const command = nextState ? 'ON' : 'OFF';

    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(controlTopic, command);
    }

    // Optimistic local update for instantaneous UI feedback
    setDevices((prev) => ({
      ...prev,
      [topic]: {
        ...(prev[topic] || { floor, meter, current: 0, power: 0 }),
        relayOn: nextState,
      },
    }));
  };

  return {
    brokerUrl: BROKER_URL,
    status,
    devices,
    toggleRelay,
  };
}
