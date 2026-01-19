export interface PlaybookSection {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  outputs: string[];
  tools?: string[];
  qualityChecks?: string[];
}

export const PRODUCTION_PLAYBOOK: PlaybookSection[] = [
  {
    id: 'work-order',
    title: 'Work order + parts kit',
    summary: 'Create a work order, gather parts, and verify the bill of materials.',
    tools: ['Admin console', 'ESD mat + wrist strap', 'Parts bins', 'Labels + marker'],
    steps: [
      'Open the admin console and create or select a batch.',
      'Print the work order label and attach it to the build tray.',
      'Pull the parts listed in the BOM and place them in the tray.',
      'Check quantities against the batch target count.',
      'Record any shortages in Inventory and notify the lead.'
    ],
    outputs: ['Parts kit complete', 'Work order labeled']
  },
  {
    id: 'enclosure',
    title: 'Enclosure fabrication',
    summary: 'Print or assemble the outer casing and verify fit.',
    tools: ['3D printer or CNC', 'Finishing tools', 'Calipers', 'Clean cloth'],
    steps: [
      'Load the approved enclosure file for the device type.',
      'Print or machine the enclosure with the approved material.',
      'Inspect for warping, cracks, or sharp edges.',
      'Finish the enclosure and clean debris before assembly.',
      'Dry fit the electronics to confirm clearances.'
    ],
    outputs: ['Enclosure ready for assembly'],
    qualityChecks: ['No sharp edges', 'Electronics fit without pressure']
  },
  {
    id: 'electronics',
    title: 'Electronics assembly',
    summary: 'Assemble the PCB, wiring harness, and power system.',
    tools: ['Soldering station', 'Magnifier', 'Multimeter', 'ESD protection'],
    steps: [
      'Assemble or receive the PCB and verify component placement.',
      'Install the compute module (Raspberry Pi or Arduino) per the build guide.',
      'Connect the GPS module and sensor suite to the harness.',
      'Install connectors, battery leads, and any harness wiring.',
      'Secure sensors and modules using approved mounts.',
      'Check polarity and continuity with a multimeter.',
      'Document any substitutions or rework.'
    ],
    outputs: ['Electronics sub-assembly complete'],
    qualityChecks: ['Continuity verified', 'No loose connections']
  },
  {
    id: 'firmware',
    title: 'Firmware flash',
    summary: 'Flash the approved firmware release to the device.',
    tools: ['USB cable or programmer', 'Firmware tool', 'Approved firmware release'],
    steps: [
      'Open the Firmware Releases panel in the admin console.',
      'Select the approved firmware version for this batch.',
      'Flash the firmware using the standard tool for the board.',
      'Verify the firmware version after flashing.',
      'Record the version in the device record.'
    ],
    outputs: ['Firmware flashed'],
    qualityChecks: ['Firmware version matches release notes']
  },
  {
    id: 'encoding',
    title: 'Device encoding',
    summary: 'Assign device identity, keys, and provisioning details.',
    tools: ['Admin console', 'QR scanner (optional)', 'Label printer'],
    steps: [
      'Open Device Registry > Encoding station in the admin console.',
      'Select the device record or scan the device ID.',
      'Generate or enter the device key ID.',
      'Create the provisioning manifest and copy it into the encoder tool.',
      'Mark the device as encoded once the device confirms receipt.'
    ],
    outputs: ['Device ID and keys encoded', 'Provisioning manifest stored'],
    qualityChecks: ['Device reports correct ID and firmware']
  },
  {
    id: 'calibration',
    title: 'Sensor calibration',
    summary: 'Calibrate sensors and verify basic signal quality.',
    tools: ['Calibration jig', 'Test app', 'Quiet workspace'],
    steps: [
      'Run the calibration routine for each sensor.',
      'Verify GPS fix and BLE advertisement.',
      'Record calibration notes in the device record.',
      'Update the stage status once complete.'
    ],
    outputs: ['Calibration complete'],
    qualityChecks: ['Sensors within tolerance']
  },
  {
    id: 'qa',
    title: 'QA and burn-in',
    summary: 'Perform full functional testing and stability checks.',
    tools: ['Test plan', 'Charging station', 'Burn-in rack'],
    steps: [
      'Run the full functional test checklist.',
      'Verify haptics, audio, lights, and sensors.',
      'Place the device into burn-in for the required duration.',
      'Log a QA report in the admin console.'
    ],
    outputs: ['QA report created', 'Device cleared for shipment'],
    qualityChecks: ['No critical failures during burn-in']
  },
  {
    id: 'fulfillment',
    title: 'Pack and ship',
    summary: 'Package devices with documentation and ship.',
    tools: ['Packaging materials', 'Shipping labels', 'Inventory system'],
    steps: [
      'Place the device and accessories into approved packaging.',
      'Add user guides and warranty information.',
      'Create a shipment record in the admin console.',
      'Attach the shipping label and hand off to carrier.'
    ],
    outputs: ['Shipment created', 'Package handed off']
  },
  {
    id: 'activation',
    title: 'Activation and support',
    summary: 'Confirm device activation and support handoff.',
    tools: ['Mobile app', 'Support checklist'],
    steps: [
      'Confirm the device can pair with the mobile app.',
      'Verify the device appears in the user account.',
      'Update the Activation stage once confirmed.',
      'Log any support notes or follow-up tasks.'
    ],
    outputs: ['Device activated', 'Support notes logged']
  }
];
