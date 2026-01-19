export interface AssemblyStep {
  id: string;
  title: string;
  summary: string;
  parts: string[];
  tools: string[];
  checks: string[];
  timeMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'advanced';
  microSteps?: string[];
  kidSteps?: string[];
  safety?: string[];
  tips?: string[];
  hotspots?: string[];
  focus?: AssemblyFocus;
  subassemblyId?: string;
  layerId?: string;
}

export interface ExplodedLayer {
  id: string;
  label: string;
  description: string;
  color: string;
}

export interface PinMapItem {
  id: string;
  signal: string;
  from: string;
  to: string;
  notes: string;
}

export interface AssemblyFocus {
  cameraOrbit: string;
  cameraTarget: string;
}

export interface AssemblyHotspot {
  id: string;
  label: string;
  description: string;
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
}

export interface AssemblySubassembly {
  id: string;
  title: string;
  summary: string;
  parts: string[];
  steps: string[];
  hotspots: string[];
  focus?: AssemblyFocus;
}

export const EXPLODED_LAYERS: ExplodedLayer[] = [
  {
    id: 'top-cap',
    label: 'Top cover + diffuser',
    description: 'Protects electronics and spreads LED glow.',
    color: 'bg-slate-900/90'
  },
  {
    id: 'led',
    label: 'RGB status LED',
    description: 'Blinker and state indicator.',
    color: 'bg-emerald-400/90'
  },
  {
    id: 'pcb',
    label: 'Main PCB + MCU',
    description: 'ESP32-S3 DevKitC mounted to board.',
    color: 'bg-amber-400/90'
  },
  {
    id: 'gnss',
    label: 'GNSS module',
    description: 'MAX-M10S module with antenna on top side.',
    color: 'bg-sky-400/90'
  },
  {
    id: 'haptics',
    label: 'Haptic motor + driver',
    description: 'DRV2605L + 10mm coin motor.',
    color: 'bg-rose-400/90'
  },
  {
    id: 'battery',
    label: 'LiPo battery',
    description: '500mAh battery with protection board.',
    color: 'bg-lime-400/90'
  },
  {
    id: 'charger',
    label: 'USB-C charger + switch',
    description: 'Charging board and power switch.',
    color: 'bg-purple-300/90'
  },
  {
    id: 'base',
    label: 'Enclosure base',
    description: '3D printed base with standoffs.',
    color: 'bg-slate-200'
  }
];

export const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    id: 'prep',
    title: 'Prep enclosure + parts kit',
    summary: 'Verify all parts are in the tray and the enclosure is clean.',
    parts: ['Enclosure base', 'Fasteners', 'PCB', 'ESP32-S3 DevKitC'],
    tools: ['ESD mat', 'Isopropyl wipe', 'Calipers'],
    checks: ['No print defects', 'All parts in tray'],
    timeMinutes: 8,
    difficulty: 'easy',
    microSteps: [
      'Lay down the ESD mat and connect the wrist strap.',
      'Open the parts kit and compare every item to the checklist.',
      'Inspect the enclosure for cracks or sharp edges.',
      'Wipe the enclosure with isopropyl alcohol and let it dry.',
      'Arrange parts in the order they will be used.'
    ],
    kidSteps: [
      'Put down the mat and keep your hands clean.',
      'Count the parts and make sure none are missing.',
      'Look for cracks on the case.',
      'Wipe the case with a little alcohol and wait for it to dry.',
      'Line up parts in the order you will use them.'
    ],
    safety: ['Ask an adult before using sharp tools.', 'Keep the workspace tidy.'],
    tips: ['Use a small tray so screws do not roll away.'],
    hotspots: ['enclosure-base', 'strap', 'top-cover'],
    focus: { cameraOrbit: '25deg 70deg 6m', cameraTarget: '0m 0m 0m' },
    subassemblyId: 'enclosure',
    layerId: 'base'
  },
  {
    id: 'pcb-mount',
    title: 'Mount PCB + MCU',
    summary: 'Secure the PCB and MCU to the enclosure standoffs.',
    parts: ['Tbay PCB v1', 'ESP32-S3 DevKitC', 'M2 screws'],
    tools: ['Precision screwdriver'],
    checks: ['Board flush', 'No pinched wires'],
    timeMinutes: 10,
    difficulty: 'medium',
    microSteps: [
      'Place the PCB on the standoffs and align the USB-C cutout.',
      'Insert screws by hand and tighten in a cross pattern.',
      'Seat the ESP32-S3 module on the headers.',
      'Check that no wires are trapped under the board.',
      'Confirm the board sits flat with no wobble.'
    ],
    kidSteps: [
      'Set the board on the posts so it lines up with the hole.',
      'Start the tiny screws with your fingers.',
      'Use the screwdriver to tighten a little at a time.',
      'Make sure no wires are stuck under the board.',
      'Gently tap the board to be sure it is flat.'
    ],
    safety: ['Do not overtighten screws.'],
    tips: ['If a screw feels tight early, back it out and try again.'],
    hotspots: ['pcb', 'mcu'],
    focus: { cameraOrbit: '50deg 70deg 4m', cameraTarget: '0m -0.05m 0m' },
    subassemblyId: 'core-electronics',
    layerId: 'pcb'
  },
  {
    id: 'gnss',
    title: 'Install GNSS module',
    summary: 'Mount the GNSS module with antenna facing outward.',
    parts: ['SparkFun MAX-M10S GNSS'],
    tools: ['Adhesive pad', 'Tweezers'],
    checks: ['Antenna clear of metal'],
    timeMinutes: 6,
    difficulty: 'easy',
    microSteps: [
      'Peel the adhesive pad and place it on the GNSS module base.',
      'Align the antenna face upward toward the cover.',
      'Press the module into its cavity for 5 seconds.',
      'Route the cable along the side of the enclosure.',
      'Check that the antenna is not under metal.'
    ],
    kidSteps: [
      'Put the sticky pad on the GNSS part.',
      'Keep the gold antenna facing up.',
      'Press down gently so it sticks.',
      'Tuck the wire along the side.',
      'Make sure no metal blocks the antenna.'
    ],
    safety: ['Handle the antenna gently.'],
    tips: ['Keep the GNSS module away from battery leads.'],
    hotspots: ['gnss', 'antenna'],
    focus: { cameraOrbit: '10deg 70deg 4.2m', cameraTarget: '-0.4m 0.05m -0.15m' },
    subassemblyId: 'core-electronics',
    layerId: 'gnss'
  },
  {
    id: 'haptics',
    title: 'Install haptic driver + motor',
    summary: 'Place motor in the cavity and connect DRV2605L.',
    parts: ['DRV2605L breakout', '10mm coin motor'],
    tools: ['Hot glue (low temp)'],
    checks: ['Motor firmly seated'],
    timeMinutes: 8,
    difficulty: 'medium',
    microSteps: [
      'Dry-fit the motor into the cavity to check depth.',
      'Apply a small dot of low-temp hot glue.',
      'Seat the motor and hold until cool.',
      'Connect the driver board to the harness.',
      'Ensure the motor cable has slack.'
    ],
    kidSteps: [
      'Test that the round motor fits in the hole.',
      'Ask for help with the hot glue.',
      'Hold the motor still until the glue hardens.',
      'Plug the small board into the cable.',
      'Make sure the wire is not stretched.'
    ],
    safety: ['Hot glue is hot. Ask an adult for help.'],
    tips: ['Do not cover the motor with glue; only tack the edge.'],
    hotspots: ['haptic', 'speaker'],
    focus: { cameraOrbit: '320deg 70deg 4.5m', cameraTarget: '-0.6m -0.1m -0.1m' },
    subassemblyId: 'feedback-stack',
    layerId: 'haptics'
  },
  {
    id: 'indicators',
    title: 'Install LED + light pipe',
    summary: 'Position the RGB LED under the diffuser.',
    parts: ['SK6812 Mini LED', 'Diffuser lens'],
    tools: ['Soldering station', 'Flux'],
    checks: ['LED aligned to diffuser'],
    timeMinutes: 12,
    difficulty: 'advanced',
    microSteps: [
      'Tin the LED pads and the cable leads.',
      'Solder LED data, 3.3V, and ground.',
      'Place the diffuser directly above the LED.',
      'Verify the LED is centered under the window.',
      'Inspect solder joints for bridges.'
    ],
    kidSteps: [
      'Ask an adult to solder the LED wires.',
      'Place the clear diffuser on top of the LED.',
      'Make sure the light will shine in the middle.'
    ],
    safety: ['Soldering iron is hot. Wear eye protection.'],
    tips: ['Use flux to keep solder clean and shiny.'],
    hotspots: ['status-led', 'diffuser'],
    focus: { cameraOrbit: '45deg 65deg 4m', cameraTarget: '0m 0.48m 0m' },
    subassemblyId: 'feedback-stack',
    layerId: 'top-cap'
  },
  {
    id: 'power',
    title: 'Wire power stack',
    summary: 'Install battery, charger, and power switch.',
    parts: ['LiPo battery', 'USB-C charger board', 'Power switch'],
    tools: ['Multimeter'],
    checks: ['Correct polarity', 'Switch toggles power'],
    timeMinutes: 12,
    difficulty: 'medium',
    microSteps: [
      'Place the battery in the base and add foam tape.',
      'Connect the battery to the charger board.',
      'Mount the USB-C board with the port aligned.',
      'Connect the power switch in series.',
      'Use a multimeter to confirm voltage.'
    ],
    kidSteps: [
      'Set the battery in the case with tape.',
      'Plug the battery into the charging board.',
      'Line up the USB-C hole with the board.',
      'Flip the switch to be sure it clicks.',
      'Ask an adult to check the voltage.'
    ],
    safety: ['Never puncture or bend the battery.', 'Disconnect power before soldering.'],
    tips: ['Route wires away from screw holes.'],
    hotspots: ['battery', 'usb-c', 'charging-contacts', 'side-button'],
    focus: { cameraOrbit: '80deg 70deg 4.6m', cameraTarget: '0m -0.18m 0.4m' },
    subassemblyId: 'power-stack',
    layerId: 'battery'
  },
  {
    id: 'wire',
    title: 'Wire harness + strain relief',
    summary: 'Connect GNSS, haptics, LED, and power lines.',
    parts: ['Wire harness', 'Connectors'],
    tools: ['Heat shrink', 'Cable ties'],
    checks: ['No loose wires', 'Cable strain relieved'],
    timeMinutes: 12,
    difficulty: 'medium',
    microSteps: [
      'Plug each connector into the labeled header.',
      'Route wires along the side rails.',
      'Bundle extra slack with a cable tie.',
      'Add heat shrink to protect joins.',
      'Gently tug to verify strain relief.'
    ],
    kidSteps: [
      'Match each plug to the same label.',
      'Lay the wires along the sides.',
      'Use a small tie to hold extra wire.',
      'Make sure wires do not stick up.'
    ],
    safety: ['Keep wires away from sharp edges.'],
    tips: ['Leave a little slack so the cover can close.'],
    hotspots: ['flex-cable', 'sensor-window'],
    focus: { cameraOrbit: '120deg 70deg 4.8m', cameraTarget: '0.1m -0.05m -0.2m' },
    subassemblyId: 'core-electronics',
    layerId: 'pcb'
  },
  {
    id: 'close',
    title: 'Close enclosure + label',
    summary: 'Fit top cover, tighten screws, add serial label.',
    parts: ['Top cover', 'Label'],
    tools: ['Torque driver'],
    checks: ['No gaps', 'Label legible'],
    timeMinutes: 8,
    difficulty: 'easy',
    microSteps: [
      'Place the diffuser and top cover carefully.',
      'Tighten screws in a cross pattern.',
      'Press the strap into its clips.',
      'Apply the serial label straight.',
      'Wipe fingerprints from the cover.'
    ],
    kidSteps: [
      'Set the lid on top gently.',
      'Tighten screws a little at a time.',
      'Snap the strap into place.',
      'Stick the label on straight.',
      'Wipe the top with a clean cloth.'
    ],
    safety: ['Do not overtighten screws.'],
    tips: ['If the cover does not sit flat, check wires before forcing it.'],
    hotspots: ['top-cover', 'screws', 'strap'],
    focus: { cameraOrbit: '45deg 70deg 6m', cameraTarget: '0m 0.3m 0m' },
    subassemblyId: 'enclosure',
    layerId: 'top-cap'
  }
];

export const ASSEMBLY_HOTSPOTS: AssemblyHotspot[] = [
  {
    id: 'top-cover',
    label: 'Top cover',
    description: 'Protective lid and diffuser stack.',
    position: { x: 0, y: 0.55, z: 0 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'diffuser',
    label: 'Diffuser',
    description: 'Spreads LED glow.',
    position: { x: 0, y: 0.52, z: 0 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'status-led',
    label: 'Status LED',
    description: 'RGB status indicator.',
    position: { x: 0.35, y: 0.46, z: 0 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'pcb',
    label: 'Main PCB',
    description: 'Core board with MCU.',
    position: { x: 0, y: -0.03, z: 0 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'mcu',
    label: 'ESP32-S3',
    description: 'BLE + system control module.',
    position: { x: 0.55, y: 0.06, z: 0.25 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'gnss',
    label: 'GNSS module',
    description: 'MAX-M10S with antenna.',
    position: { x: -0.6, y: 0.05, z: -0.25 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'antenna',
    label: 'Antenna',
    description: 'Top-side GNSS antenna strip.',
    position: { x: 0, y: 0.16, z: 0.68 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'battery',
    label: 'Battery',
    description: '500mAh LiPo cell.',
    position: { x: 0, y: -0.18, z: 0 },
    normal: { x: 0, y: -1, z: 0 }
  },
  {
    id: 'usb-c',
    label: 'USB-C charger',
    description: 'Charge board + port.',
    position: { x: 0, y: -0.05, z: 0.95 },
    normal: { x: 0, y: 0, z: 1 }
  },
  {
    id: 'charging-contacts',
    label: 'Charging pads',
    description: 'Docking contacts.',
    position: { x: 0.4, y: -0.34, z: 0.05 },
    normal: { x: 0, y: -1, z: 0 }
  },
  {
    id: 'side-button',
    label: 'Side button',
    description: 'Power / status toggle.',
    position: { x: 1.5, y: 0.05, z: 0 },
    normal: { x: 1, y: 0, z: 0 }
  },
  {
    id: 'haptic',
    label: 'Haptic motor',
    description: 'Vibration alert motor.',
    position: { x: -0.9, y: -0.1, z: -0.2 },
    normal: { x: 0, y: -1, z: 0 }
  },
  {
    id: 'speaker',
    label: 'Speaker',
    description: 'Audio alert.',
    position: { x: 0.9, y: -0.1, z: 0.2 },
    normal: { x: 0, y: -1, z: 0 }
  },
  {
    id: 'enclosure-base',
    label: 'Enclosure base',
    description: '3D printed base shell.',
    position: { x: 0, y: -0.2, z: -0.6 },
    normal: { x: 0, y: -1, z: 0 }
  },
  {
    id: 'strap',
    label: 'Strap',
    description: 'Flexible comfort strap.',
    position: { x: 0, y: -1.15, z: 0.7 },
    normal: { x: 0, y: 0, z: 1 }
  },
  {
    id: 'screws',
    label: 'Fasteners',
    description: 'Standoffs + screws.',
    position: { x: 1.1, y: 0.32, z: 0.6 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'sensor-window',
    label: 'Sensor window',
    description: 'Optical sensor aperture.',
    position: { x: -0.45, y: 0.46, z: 0.3 },
    normal: { x: 0, y: 1, z: 0 }
  },
  {
    id: 'flex-cable',
    label: 'Flex cable',
    description: 'Harness routing.',
    position: { x: 0.15, y: -0.08, z: -0.15 },
    normal: { x: 0, y: 1, z: 0 }
  }
];

export const ASSEMBLY_SUBASSEMBLIES: AssemblySubassembly[] = [
  {
    id: 'core-electronics',
    title: 'Core electronics',
    summary: 'PCB, MCU, GNSS, and sensor pack seating.',
    parts: ['Main PCB', 'ESP32-S3', 'GNSS module', 'IMU', 'Antenna'],
    steps: ['pcb-mount', 'gnss', 'wire'],
    hotspots: ['pcb', 'mcu', 'gnss', 'antenna', 'sensor-window', 'flex-cable'],
    focus: { cameraOrbit: '40deg 70deg 4.8m', cameraTarget: '0m 0m 0m' }
  },
  {
    id: 'power-stack',
    title: 'Power + IO',
    summary: 'Battery, charging, and power hardware fit.',
    parts: ['LiPo battery', 'USB-C charger', 'Charging pads', 'Side button'],
    steps: ['power'],
    hotspots: ['battery', 'usb-c', 'charging-contacts', 'side-button'],
    focus: { cameraOrbit: '90deg 70deg 5m', cameraTarget: '0m -0.2m 0.3m' }
  },
  {
    id: 'feedback-stack',
    title: 'Haptics + feedback',
    summary: 'Haptic, speaker, and LED alignment.',
    parts: ['Haptic motor', 'Speaker', 'Status LED', 'Diffuser'],
    steps: ['haptics', 'indicators'],
    hotspots: ['haptic', 'speaker', 'status-led', 'diffuser'],
    focus: { cameraOrbit: '320deg 70deg 5m', cameraTarget: '0m 0.2m 0m' }
  },
  {
    id: 'enclosure',
    title: 'Enclosure + strap',
    summary: 'Shell, rails, strap, and closure fit.',
    parts: ['Enclosure base', 'Top cover', 'Strap', 'Fasteners'],
    steps: ['prep', 'close'],
    hotspots: ['enclosure-base', 'top-cover', 'strap', 'screws'],
    focus: { cameraOrbit: '20deg 70deg 6.5m', cameraTarget: '0m 0m 0m' }
  }
];

export const PIN_MAP: PinMapItem[] = [
  {
    id: 'gnss-uart',
    signal: 'GNSS UART',
    from: 'GNSS TX/RX',
    to: 'MCU RX/TX (UART1)',
    notes: 'Cross TX/RX, 3.3V logic'
  },
  {
    id: 'i2c-imu',
    signal: 'IMU I2C',
    from: 'IMU SDA/SCL',
    to: 'MCU SDA/SCL',
    notes: 'Use pull-ups, keep wires short'
  },
  {
    id: 'i2c-haptics',
    signal: 'Haptic driver I2C',
    from: 'DRV2605L SDA/SCL',
    to: 'MCU SDA/SCL',
    notes: 'Shared I2C bus with IMU'
  },
  {
    id: 'led-data',
    signal: 'LED data',
    from: 'MCU GPIO',
    to: 'LED DIN',
    notes: 'Add series resistor on data line'
  },
  {
    id: 'battery',
    signal: 'Battery',
    from: 'LiPo battery',
    to: 'Charger board',
    notes: 'Verify polarity before powering'
  }
];
