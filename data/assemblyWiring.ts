export interface WiringHotspot {
  id: string;
  label: string;
  description: string;
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  category: 'power' | 'data' | 'feedback' | 'mechanical';
}

export interface WiringStep {
  id: string;
  title: string;
  summary: string;
  from: string;
  to: string;
  wireColor: string;
  wireGauge: string;
  connector: string;
  route: string[];
  tools: string[];
  checks: string[];
  timeMinutes: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  microSteps: string[];
  kidSteps: string[];
  safety: string[];
  hotspots: string[];
  focus?: { cameraOrbit: string; cameraTarget: string };
}

export interface WireLegendItem {
  id: string;
  label: string;
  color: string;
  usage: string;
}

export interface StitchGuide {
  title: string;
  summary: string;
  steps: string[];
  checks: string[];
  hotspots: string[];
}

export const WIRE_LEGEND: WireLegendItem[] = [
  { id: 'power', label: 'Power', color: 'bg-rose-500', usage: 'Battery, charger, switch.' },
  { id: 'data', label: 'Data', color: 'bg-sky-500', usage: 'UART + I2C buses.' },
  { id: 'led', label: 'LED', color: 'bg-emerald-500', usage: 'Status LED data line.' },
  { id: 'haptic', label: 'Haptic', color: 'bg-amber-500', usage: 'Motor driver + motor.' },
  { id: 'audio', label: 'Audio', color: 'bg-indigo-500', usage: 'Speaker amp.' }
];

export const WIRING_HOTSPOTS: WiringHotspot[] = [
  {
    id: 'battery-conn',
    label: 'Battery connector',
    description: 'LiPo JST connector.',
    position: { x: 0.2, y: -0.2, z: 0.2 },
    normal: { x: 0, y: -1, z: 0 },
    category: 'power'
  },
  {
    id: 'charger-board',
    label: 'USB-C charger',
    description: 'Charge board + port.',
    position: { x: 0, y: -0.05, z: 0.92 },
    normal: { x: 0, y: 0, z: 1 },
    category: 'power'
  },
  {
    id: 'switch-inline',
    label: 'Power switch',
    description: 'Inline switch on the right rail.',
    position: { x: 1.5, y: 0.05, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    category: 'power'
  },
  {
    id: 'pcb-power',
    label: 'PCB power header',
    description: 'Main power input to PCB.',
    position: { x: 0.6, y: -0.02, z: -0.1 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'power'
  },
  {
    id: 'uart-gnss',
    label: 'GNSS UART pins',
    description: 'UART TX/RX on MCU.',
    position: { x: -0.45, y: 0.08, z: -0.2 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'data'
  },
  {
    id: 'gnss-module',
    label: 'GNSS module',
    description: 'MAX-M10S connector pads.',
    position: { x: -0.6, y: 0.05, z: -0.25 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'data'
  },
  {
    id: 'i2c-hub',
    label: 'I2C hub',
    description: 'Shared I2C header for sensors.',
    position: { x: 0.05, y: 0.02, z: -0.1 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'data'
  },
  {
    id: 'haptic-driver',
    label: 'Haptic driver',
    description: 'DRV2605L board.',
    position: { x: -0.75, y: -0.05, z: -0.15 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'haptic-motor',
    label: 'Haptic motor',
    description: 'Coin motor pocket.',
    position: { x: -0.9, y: -0.1, z: -0.2 },
    normal: { x: 0, y: -1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'speaker-amp',
    label: 'Speaker amp',
    description: 'MAX98357A board.',
    position: { x: 0.8, y: -0.05, z: 0.25 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'speaker',
    label: 'Speaker',
    description: 'Mini speaker capsule.',
    position: { x: 0.9, y: -0.1, z: 0.2 },
    normal: { x: 0, y: -1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'led-data',
    label: 'LED data pad',
    description: 'RGB data on PCB.',
    position: { x: 0.3, y: 0.18, z: 0.2 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'status-led',
    label: 'Status LED',
    description: 'RGB LED under diffuser.',
    position: { x: 0.35, y: 0.46, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    category: 'feedback'
  },
  {
    id: 'strain-relief-left',
    label: 'Strain relief (left)',
    description: 'Left rail tie point.',
    position: { x: -1.25, y: 0.1, z: -0.2 },
    normal: { x: -1, y: 0, z: 0 },
    category: 'mechanical'
  },
  {
    id: 'strain-relief-right',
    label: 'Strain relief (right)',
    description: 'Right rail tie point.',
    position: { x: 1.25, y: 0.1, z: 0.2 },
    normal: { x: 1, y: 0, z: 0 },
    category: 'mechanical'
  },
  {
    id: 'strap-stitch',
    label: 'Strap stitch',
    description: 'Stitch line for fabric strap.',
    position: { x: 0, y: -1.2, z: 0.7 },
    normal: { x: 0, y: 0, z: 1 },
    category: 'mechanical'
  }
];

export const WIRING_STEPS: WiringStep[] = [
  {
    id: 'battery-to-charger',
    title: 'Battery to charger',
    summary: 'Connect LiPo battery to the USB-C charger board.',
    from: 'Battery JST',
    to: 'Charger BAT+ / BAT-',
    wireColor: 'Red/Black',
    wireGauge: '26 AWG',
    connector: 'JST-PH',
    route: ['Run along right rail.', 'Keep wire flat under PCB edge.', 'Leave slack for cover.'],
    tools: ['JST crimper', 'Tweezers'],
    checks: ['Battery polarity correct', 'Connector fully seated'],
    timeMinutes: 6,
    difficulty: 'easy',
    microSteps: [
      'Check the red wire is on BAT+ and black on BAT-.',
      'Push the JST connector until it clicks.',
      'Tuck wires along the right rail.',
      'Tape the wire down with Kapton if needed.'
    ],
    kidSteps: [
      'Match red to + and black to -.',
      'Push the plug in until it clicks.',
      'Lay the wire along the side.'
    ],
    safety: ['Never force a JST connector.', 'Keep battery leads away from metal.'],
    hotspots: ['battery-conn', 'charger-board'],
    focus: { cameraOrbit: '80deg 70deg 5m', cameraTarget: '0m -0.2m 0.4m' }
  },
  {
    id: 'charger-to-pcb',
    title: 'Charger output to PCB',
    summary: 'Bring regulated power from charger to PCB input.',
    from: 'Charger OUT',
    to: 'PCB power header',
    wireColor: 'Red/Black',
    wireGauge: '28 AWG',
    connector: '2-pin JST',
    route: ['Follow right rail.', 'Cross under PCB corner.', 'Secure at tie point.'],
    tools: ['Crimper', 'Multimeter'],
    checks: ['3.7-4.2V at PCB input', 'No exposed copper'],
    timeMinutes: 8,
    difficulty: 'medium',
    microSteps: [
      'Crimp the 2-pin connector.',
      'Check voltage at charger output before connecting.',
      'Plug into PCB header.',
      'Secure the cable with a tie.'
    ],
    kidSteps: [
      'Ask for help to crimp the plug.',
      'Use the meter to check power.',
      'Plug into the board and tie the cable.'
    ],
    safety: ['Do not short the power pins.'],
    hotspots: ['charger-board', 'pcb-power', 'strain-relief-right'],
    focus: { cameraOrbit: '70deg 70deg 5m', cameraTarget: '0.5m 0m -0.1m' }
  },
  {
    id: 'switch-inline',
    title: 'Insert the power switch',
    summary: 'Place the switch inline between charger and PCB.',
    from: 'Charger OUT +',
    to: 'Switch → PCB power',
    wireColor: 'Red',
    wireGauge: '28 AWG',
    connector: 'Inline switch',
    route: ['Mount switch in the side slot.', 'Run wire through right rail channel.'],
    tools: ['Small pliers'],
    checks: ['Switch clicks', 'Voltage off when switched'],
    timeMinutes: 6,
    difficulty: 'easy',
    microSteps: [
      'Slide the switch into the side slot.',
      'Connect the red wire in and out.',
      'Toggle to confirm power breaks.'
    ],
    kidSteps: [
      'Push the switch into its slot.',
      'Connect the red wire through it.',
      'Flip the switch to test.'
    ],
    safety: ['Switch power off before continuing.'],
    hotspots: ['switch-inline', 'pcb-power'],
    focus: { cameraOrbit: '120deg 70deg 5m', cameraTarget: '1.2m 0m 0m' }
  },
  {
    id: 'gnss-uart',
    title: 'GNSS UART wiring',
    summary: 'Connect GNSS TX/RX to MCU UART pins.',
    from: 'GNSS module',
    to: 'MCU UART1',
    wireColor: 'Yellow/Green',
    wireGauge: '30 AWG',
    connector: '4-pin JST',
    route: ['Run along left rail.', 'Cross above PCB edge.', 'Secure at left tie point.'],
    tools: ['Tweezers', 'Kapton tape'],
    checks: ['TX ↔ RX crossed', 'No sharp bends'],
    timeMinutes: 10,
    difficulty: 'medium',
    microSteps: [
      'Identify TX/RX labels on both boards.',
      'Cross TX to RX and RX to TX.',
      'Tape the bundle along the left rail.',
      'Leave a gentle service loop.'
    ],
    kidSteps: [
      'Match the labels TX and RX.',
      'Cross the two wires.',
      'Tape the wire to the side.'
    ],
    safety: ['Keep wires away from the antenna face.'],
    hotspots: ['gnss-module', 'uart-gnss', 'strain-relief-left'],
    focus: { cameraOrbit: '320deg 70deg 5m', cameraTarget: '-0.5m 0m -0.2m' }
  },
  {
    id: 'i2c-bus',
    title: 'I2C bus harness',
    summary: 'Share SDA/SCL to the IMU + haptic driver.',
    from: 'MCU I2C header',
    to: 'IMU + DRV2605L',
    wireColor: 'Blue/White',
    wireGauge: '30 AWG',
    connector: '4-pin JST',
    route: ['Keep twisted pair tight.', 'Route under PCB edge.', 'Branch to haptic driver.'],
    tools: ['Heat shrink'],
    checks: ['Pull-ups present', 'No loose strands'],
    timeMinutes: 10,
    difficulty: 'medium',
    microSteps: [
      'Twist SDA/SCL wires together.',
      'Connect to I2C header on PCB.',
      'Branch the harness to the haptic driver.',
      'Heat-shrink the splice.'
    ],
    kidSteps: [
      'Keep the blue and white wires together.',
      'Plug them into the I2C port.',
      'Connect the other end to the small haptic board.'
    ],
    safety: ['Keep the splice insulated.'],
    hotspots: ['i2c-hub', 'haptic-driver'],
    focus: { cameraOrbit: '40deg 70deg 4.8m', cameraTarget: '-0.2m 0m -0.1m' }
  },
  {
    id: 'led-data',
    title: 'LED data + power',
    summary: 'Connect the LED data line and 3.3V power.',
    from: 'PCB LED pad',
    to: 'RGB LED',
    wireColor: 'Purple/Black',
    wireGauge: '30 AWG',
    connector: 'Solder pads',
    route: ['Route upward to diffuser pocket.', 'Leave slack for cover.'],
    tools: ['Soldering iron', 'Flux'],
    checks: ['Data line resistor installed', 'LED faces diffuser'],
    timeMinutes: 12,
    difficulty: 'advanced',
    microSteps: [
      'Solder data, 3.3V, and GND.',
      'Add a 220Ω resistor on data line.',
      'Tape the wire to keep it flat.',
      'Test LED after power-on.'
    ],
    kidSteps: [
      'Ask an adult to solder the LED wires.',
      'Make sure the LED sits under the clear window.'
    ],
    safety: ['Soldering iron is hot.'],
    hotspots: ['led-data', 'status-led'],
    focus: { cameraOrbit: '45deg 65deg 4m', cameraTarget: '0.35m 0.4m 0m' }
  },
  {
    id: 'speaker-wiring',
    title: 'Speaker wiring',
    summary: 'Connect the speaker amp to the speaker capsule.',
    from: 'Speaker amp',
    to: 'Speaker',
    wireColor: 'Orange/Black',
    wireGauge: '30 AWG',
    connector: '2-pin JST',
    route: ['Follow right rail.', 'Anchor near grill.'],
    tools: ['Tweezers'],
    checks: ['No rattling wire', 'Speaker faces grill'],
    timeMinutes: 6,
    difficulty: 'easy',
    microSteps: [
      'Connect amp output to speaker.',
      'Place speaker in cavity.',
      'Anchor wire with tape.'
    ],
    kidSteps: [
      'Plug the speaker wire in.',
      'Place the speaker in the hole.',
      'Tape the wire so it stays flat.'
    ],
    safety: ['Do not press on the speaker cone.'],
    hotspots: ['speaker-amp', 'speaker'],
    focus: { cameraOrbit: '70deg 70deg 5m', cameraTarget: '0.9m -0.1m 0.2m' }
  },
  {
    id: 'haptic-motor-wiring',
    title: 'Haptic motor wiring',
    summary: 'Connect driver output to the coin motor.',
    from: 'Haptic driver',
    to: 'Coin motor',
    wireColor: 'Gray/Black',
    wireGauge: '30 AWG',
    connector: '2-pin JST',
    route: ['Keep wire short.', 'Tape down next to motor cavity.'],
    tools: ['Tweezers'],
    checks: ['Motor spins freely', 'No wire rubbing'],
    timeMinutes: 5,
    difficulty: 'easy',
    microSteps: [
      'Plug motor into driver board.',
      'Lay wire flat.',
      'Tape to prevent rattle.'
    ],
    kidSteps: [
      'Plug the motor wire into the small board.',
      'Tape the wire so it stays flat.'
    ],
    safety: ['Do not glue the motor cable.'],
    hotspots: ['haptic-driver', 'haptic-motor'],
    focus: { cameraOrbit: '320deg 70deg 5m', cameraTarget: '-0.9m -0.1m -0.2m' }
  }
];

export const STRAP_STITCH_GUIDE: StitchGuide = {
  title: 'Strap stitching + strain relief',
  summary: 'Secure the harness and stitch the strap so wires stay protected.',
  steps: [
    'Route the main harness along the side rails.',
    'Use the left and right strain relief points to tie down the bundle.',
    'Stitch the strap through the anchor slot (3 passes).',
    'Double-knot the thread and trim the excess.',
    'Check that the strap flexes without pulling the wires.'
  ],
  checks: ['Harness does not move when tugged', 'Strap sits flush and smooth'],
  hotspots: ['strain-relief-left', 'strain-relief-right', 'strap-stitch']
};
