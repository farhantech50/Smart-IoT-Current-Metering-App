# IoT Real-Time Monitoring & Control Dashboard

A high-performance real-time IoT monitoring and control dashboard built in React (using Vite and Tailwind CSS) that connects to an MQTT broker over WebSockets using the `mqtt` npm package.

## 🚀 Features

- **Direct MQTT over WebSockets**: Connects using `mqtt` v5 to WebSocket endpoints (default: HiveMQ public broker).
- **Multi-Device State Management**: Dynamically tracks 90 smart meters split across 3 floors (30 devices per floor: `1/1` to `3/30`).
- **Wildcard Subscription**: Automatically subscribes to `+/+` to ingest telemetry streams from all 90 devices simultaneously.
- **Bi-Directional Relay Control**: Toggling a meter's relay switch publishes `"ON"` or `"OFF"` commands to the device's dedicated control topic (`X/Yc`).
- **Telemetry Display**:
  - Device identifier: Strictly formatted as `Floor {X} - Meter #{Y}`
  - Real-Time Current: Formatted to 2 decimal places with `A` unit (e.g. `12.45 A`)
  - Apparent Power: Formatted to 1 decimal place with `VA` unit (e.g. `2739.0 VA`)
  - Relay Status Badge: Green `ON` or Red `OFF`
- **Floor Navigation**: Clean tabbed interface to switch between Floor 1, Floor 2, and Floor 3 with aggregated KPI metrics.
- **Tailwind CSS Dark Theme**: Modern, responsive dashboard with smooth transitions and tactile visual feedback.

---

## ⚙️ Environment Variables

All MQTT connection parameters are configured via `.env`:

```env
# MQTT WebSocket Broker URL
VITE_MQTT_BROKER_URL=ws://broker.hivemq.com:8000/mqtt

# MQTT Wildcard Subscription Topic
VITE_MQTT_TOPIC_WILDCARD=+/+
```

---

## 📡 MQTT Topic & Payload Specifications

### 1. Topic Structure (90 Devices, 3 Floors)
- **Floor 1**:
  - Telemetry: `1/1` to `1/30`
  - Control: `1/1c` to `1/30c`
- **Floor 2**:
  - Telemetry: `2/1` to `2/30`
  - Control: `2/1c` to `2/30c`
- **Floor 3**:
  - Telemetry: `3/1` to `3/30`
  - Control: `3/1c` to `3/30c`

### 2. Telemetry Ingest (`+/+`)
Each device publishes telemetry as a JSON payload:
```json
{
  "current": 12.45,
  "power": 2739.0,
  "relayOn": true
}
```

### 3. Relay Control (`X/Yc`)
When the user clicks the toggle switch for device `X/Y`, the client publishes a text payload (`"ON"` or `"OFF"`) to `X/Yc`:
- Device `1/1` $\rightarrow$ publishes to `1/1c`
- Device `2/15` $\rightarrow$ publishes to `2/15c`
- Device `3/30` $\rightarrow$ publishes to `3/30c`

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
