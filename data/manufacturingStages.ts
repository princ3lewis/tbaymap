export type ManufacturingStageStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'pass'
  | 'fail'
  | 'skipped';

export interface ManufacturingStageDefinition {
  id: string;
  label: string;
  phase: string;
  description?: string;
}

export interface DeviceStage {
  status: ManufacturingStageStatus;
  updatedAt?: Date | null;
  updatedBy?: string;
  notes?: string;
}

export type DeviceStageMap = Record<string, DeviceStage>;

export const MANUFACTURING_STAGES: ManufacturingStageDefinition[] = [
  {
    id: 'bom_locked',
    label: 'BOM locked',
    phase: 'Procurement',
    description: 'Final bill of materials approved.'
  },
  {
    id: 'parts_ordered',
    label: 'Parts ordered',
    phase: 'Procurement',
    description: 'Orders placed with suppliers.'
  },
  {
    id: 'parts_received',
    label: 'Parts received',
    phase: 'Procurement',
    description: 'Incoming inspection complete.'
  },
  {
    id: 'enclosure_printed',
    label: '3D print enclosure',
    phase: 'Fabrication',
    description: 'Print or mill housing.'
  },
  {
    id: 'enclosure_finish',
    label: 'Post-process + finish',
    phase: 'Fabrication',
    description: 'Sanding, sealing, and finishing.'
  },
  {
    id: 'pcb_assembly',
    label: 'PCB assembly',
    phase: 'Electronics',
    description: 'Board assembly and inspection.'
  },
  {
    id: 'wiring',
    label: 'Wiring + solder',
    phase: 'Electronics',
    description: 'Final wiring harness and soldering.'
  },
  {
    id: 'sensor_install',
    label: 'Sensor install',
    phase: 'Electronics',
    description: 'Install GPS, haptics, and sensors.'
  },
  {
    id: 'battery_install',
    label: 'Battery install',
    phase: 'Electronics',
    description: 'Battery fit and safety checks.'
  },
  {
    id: 'firmware_flash',
    label: 'Flash firmware',
    phase: 'Firmware',
    description: 'Load the latest approved firmware.'
  },
  {
    id: 'device_encode',
    label: 'Encode device ID',
    phase: 'Firmware',
    description: 'Write IDs + keys onto device.'
  },
  {
    id: 'ble_verify',
    label: 'BLE verification',
    phase: 'Firmware',
    description: 'Verify BLE advertising + pairing.'
  },
  {
    id: 'sensor_calibration',
    label: 'Sensor calibration',
    phase: 'QA',
    description: 'Calibrate sensors to baseline.'
  },
  {
    id: 'functional_test',
    label: 'Functional test',
    phase: 'QA',
    description: 'Test vibration, lights, and audio.'
  },
  {
    id: 'burn_in',
    label: 'Burn-in',
    phase: 'QA',
    description: 'Stress test and stability check.'
  },
  {
    id: 'qa_pass',
    label: 'QA pass',
    phase: 'QA',
    description: 'QA sign-off for shipment.'
  },
  {
    id: 'packaged',
    label: 'Pack + label',
    phase: 'Fulfillment',
    description: 'Box, label, and seal device.'
  },
  {
    id: 'shipped',
    label: 'Ship',
    phase: 'Fulfillment',
    description: 'Carrier pickup complete.'
  },
  {
    id: 'activated',
    label: 'Activation',
    phase: 'Fulfillment',
    description: 'Device activated in the field.'
  }
];

export const buildStageMap = (): DeviceStageMap => {
  const stages: DeviceStageMap = {};
  MANUFACTURING_STAGES.forEach((stage) => {
    stages[stage.id] = { status: 'not_started' };
  });
  return stages;
};
