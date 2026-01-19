export interface HardwareBomItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  supplier: string;
  purpose: string;
  perDeviceQty: number;
  reorderPoint: number;
  unitCost: number;
  leadTimeDays: number;
  notes: string[];
  required: boolean;
}

export interface ConnectivityOption {
  id: string;
  title: string;
  summary: string;
  recommended: boolean;
  bestFor: string[];
  tradeoffs: string[];
  components: string[];
}

export interface WiringCheatItem {
  id: string;
  title: string;
  notes: string[];
}

export const CONNECTIVITY_OPTIONS: ConnectivityOption[] = [
  {
    id: 'ble-mobile',
    title: 'BLE to mobile app (recommended v1)',
    summary: 'Bracelet pairs over BLE; mobile app relays location and events to Firebase.',
    recommended: true,
    bestFor: ['Lowest cost BOM', 'Best battery life', 'Fast to ship'],
    tradeoffs: ['Requires the user phone nearby', 'No standalone tracking'],
    components: ['BLE-capable MCU', 'Mobile app gateway', 'Firebase']
  },
  {
    id: 'wifi-direct',
    title: 'Wi-Fi direct',
    summary: 'Device connects to Wi-Fi networks and publishes events directly.',
    recommended: false,
    bestFor: ['Fixed-location devices', 'Community center installs'],
    tradeoffs: ['Needs Wi-Fi credentials', 'Higher power draw'],
    components: ['Wi-Fi MCU', 'Provisioning flow', 'Firebase']
  },
  {
    id: 'cellular',
    title: 'Cellular + GNSS',
    summary: 'Device connects via LTE and publishes location/events independently.',
    recommended: false,
    bestFor: ['Standalone tracking', 'No phone dependency'],
    tradeoffs: ['Higher BOM cost', 'SIM management', 'Higher power'],
    components: ['LTE module', 'SIM + data plan', 'Power budget']
  }
];

export const HARDWARE_BOM: HardwareBomItem[] = [
  {
    id: 'mcu-esp32',
    name: 'ESP32-S3 DevKitC-1 (N16R8)',
    category: 'Compute + Radio',
    sku: 'ESP32-S3-DEVKITC-1-N16R8',
    supplier: 'Espressif / Digi-Key',
    purpose: 'Main MCU for BLE, sensor control, and event signaling.',
    perDeviceQty: 1,
    reorderPoint: 15,
    unitCost: 15,
    leadTimeDays: 14,
    notes: ['BLE to mobile app baseline.', 'Swap for custom PCB later if needed.'],
    required: true
  },
  {
    id: 'mcu-alt-arduino',
    name: 'Arduino Nano 33 BLE Sense Rev2',
    category: 'Compute + Radio',
    sku: 'ABX00069',
    supplier: 'Arduino',
    purpose: 'Optional dev board for sensor prototyping.',
    perDeviceQty: 1,
    reorderPoint: 3,
    unitCost: 35,
    leadTimeDays: 14,
    notes: ['Use for rapid sensor testing or teaching builds.'],
    required: false
  },
  {
    id: 'mcu-alt-pi',
    name: 'Raspberry Pi Zero 2 W',
    category: 'Compute + Radio',
    sku: 'SC0510',
    supplier: 'Raspberry Pi / CanaKit',
    purpose: 'Alternate compute for advanced prototypes.',
    perDeviceQty: 1,
    reorderPoint: 2,
    unitCost: 18,
    leadTimeDays: 21,
    notes: ['Higher power draw; not recommended for v1 wearable.'],
    required: false
  },
  {
    id: 'gnss',
    name: 'SparkFun GNSS Breakout - MAX-M10S',
    category: 'Location',
    sku: 'GPS-18026',
    supplier: 'SparkFun',
    purpose: 'Provides GPS location fixes.',
    perDeviceQty: 1,
    reorderPoint: 15,
    unitCost: 24.95,
    leadTimeDays: 14,
    notes: ['3.3V logic; includes patch antenna.'],
    required: true
  },
  {
    id: 'imu',
    name: 'Adafruit BNO085 9-DOF IMU',
    category: 'Sensors',
    sku: 'ADA-4754',
    supplier: 'Adafruit',
    purpose: 'Motion sensing for safety and activity context.',
    perDeviceQty: 1,
    reorderPoint: 10,
    unitCost: 19.95,
    leadTimeDays: 10,
    notes: ['I2C interface; requires calibration.'],
    required: false
  },
  {
    id: 'haptic',
    name: 'Precision Microdrives 10mm coin motor',
    category: 'Haptics',
    sku: '310-103',
    supplier: 'Precision Microdrives / Digi-Key',
    purpose: 'Vibration alerts for events.',
    perDeviceQty: 1,
    reorderPoint: 20,
    unitCost: 2.2,
    leadTimeDays: 14,
    notes: ['Use with a haptic driver.'],
    required: true
  },
  {
    id: 'haptic-driver',
    name: 'DRV2605L haptic driver breakout',
    category: 'Haptics',
    sku: 'ADA-2305',
    supplier: 'Adafruit',
    purpose: 'Drives the vibration motor safely.',
    perDeviceQty: 1,
    reorderPoint: 15,
    unitCost: 7.95,
    leadTimeDays: 10,
    notes: ['Required unless using a transistor driver circuit.'],
    required: true
  },
  {
    id: 'audio-amp',
    name: 'MAX98357A I2S amp breakout',
    category: 'Audio',
    sku: 'ADA-3006',
    supplier: 'Adafruit',
    purpose: 'Audio amplifier for speaker alerts.',
    perDeviceQty: 1,
    reorderPoint: 10,
    unitCost: 7.95,
    leadTimeDays: 10,
    notes: ['Pairs with 8-ohm speaker.'],
    required: false
  },
  {
    id: 'audio-speaker',
    name: '8 ohm 1W mini speaker',
    category: 'Audio',
    sku: 'ADA-3923',
    supplier: 'Adafruit',
    purpose: 'Speaker output for alerts.',
    perDeviceQty: 1,
    reorderPoint: 10,
    unitCost: 2.95,
    leadTimeDays: 10,
    notes: ['Mount away from GNSS antenna.'],
    required: false
  },
  {
    id: 'led',
    name: 'SK6812 mini RGB LED',
    category: 'Indicators',
    sku: 'SK6812MINI-E',
    supplier: 'BTF-LIGHTING',
    purpose: 'Blinker and status indicator.',
    perDeviceQty: 1,
    reorderPoint: 25,
    unitCost: 0.5,
    leadTimeDays: 7,
    notes: ['Add resistor on data line.'],
    required: true
  },
  {
    id: 'battery',
    name: 'LiPo battery 500mAh 3.7V',
    category: 'Power',
    sku: 'ADA-1578',
    supplier: 'Adafruit',
    purpose: 'Primary power source.',
    perDeviceQty: 1,
    reorderPoint: 20,
    unitCost: 7.95,
    leadTimeDays: 10,
    notes: ['Capacity depends on target battery life.'],
    required: true
  },
  {
    id: 'charger',
    name: 'USB-C LiPo charger + protection',
    category: 'Power',
    sku: 'ADA-4410',
    supplier: 'Adafruit',
    purpose: 'Charging and protection circuit.',
    perDeviceQty: 1,
    reorderPoint: 20,
    unitCost: 7.5,
    leadTimeDays: 10,
    notes: ['Includes USB-C port.'],
    required: true
  },
  {
    id: 'power-switch',
    name: 'Slide power switch',
    category: 'Power',
    sku: 'JS102011SAQN',
    supplier: 'C&K / Digi-Key',
    purpose: 'Main power switch.',
    perDeviceQty: 1,
    reorderPoint: 25,
    unitCost: 0.6,
    leadTimeDays: 10,
    notes: ['Mount on enclosure edge for access.'],
    required: true
  },
  {
    id: 'pcb',
    name: 'Tbay main PCB v1',
    category: 'PCB',
    sku: 'TBAY-PCB-V1',
    supplier: 'JLCPCB',
    purpose: 'Mounts MCU, power, and connectors.',
    perDeviceQty: 1,
    reorderPoint: 10,
    unitCost: 6,
    leadTimeDays: 10,
    notes: ['Include solder stencil in each order.'],
    required: true
  },
  {
    id: 'enclosure',
    name: '3D printed enclosure kit',
    category: 'Enclosure',
    sku: 'ENCLOSURE-V1',
    supplier: 'In-house',
    purpose: 'Holds electronics and wearable form factor.',
    perDeviceQty: 1,
    reorderPoint: 10,
    unitCost: 3,
    leadTimeDays: 2,
    notes: ['Track prints per batch.'],
    required: true
  },
  {
    id: 'fasteners',
    name: 'Screws + standoffs',
    category: 'Enclosure',
    sku: 'M2-KIT',
    supplier: 'Generic',
    purpose: 'Secure PCB and enclosure.',
    perDeviceQty: 1,
    reorderPoint: 30,
    unitCost: 0.8,
    leadTimeDays: 7,
    notes: ['Include spares.'],
    required: true
  }
];

export const WIRING_CHEAT_SHEET: WiringCheatItem[] = [
  {
    id: 'power',
    title: 'Power safety',
    notes: [
      'Use 3.3V logic for sensors and MCU.',
      'Do not connect 5V to 3.3V-only modules.',
      'Verify polarity before powering up.'
    ]
  },
  {
    id: 'ble-antenna',
    title: 'BLE antenna placement',
    notes: [
      'Keep antenna area free of metal and battery.',
      'Avoid routing high-current traces near the antenna.',
      'Verify BLE RSSI during QA.'
    ]
  },
  {
    id: 'gps',
    title: 'GNSS module wiring',
    notes: [
      'Connect GNSS TX to MCU RX, GNSS RX to MCU TX.',
      'Connect 3.3V and GND.',
      'Secure the antenna away from metal.'
    ]
  },
  {
    id: 'imu',
    title: 'IMU sensor wiring',
    notes: [
      'Use I2C (SDA/SCL) with pull-up resistors.',
      'Keep wires short to reduce noise.'
    ]
  },
  {
    id: 'haptics',
    title: 'Haptic motor',
    notes: [
      'Use a transistor or haptic driver IC.',
      'Do not drive the motor directly from the MCU pin.'
    ]
  },
  {
    id: 'audio',
    title: 'Audio output',
    notes: [
      'Use an amplifier module for the speaker.',
      'Route audio away from the GNSS antenna.'
    ]
  }
];
