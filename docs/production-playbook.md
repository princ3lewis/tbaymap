# Production Playbook

This playbook is the step-by-step guide for building, encoding, and shipping devices.
It is written so non-engineers can follow the process consistently.

If you are unsure about any step, stop and ask a lead before continuing.

## Device identity rules

- Device ID: generated in the admin console (UUID or `device_XXXX`).
- Serial: printed label on the casing (format: `TB-YYMMDD-XXXX`).
- Key ID: generated in the admin console (placeholder for key management).

Do not reuse device IDs, serials, or key IDs.

## Work order + parts kit

1. Open the admin console and create/select a batch.
2. Print the work order label and attach it to the tray.
3. Pull parts from inventory using the BOM.
4. Confirm counts match the target quantity.
5. Record shortages in Inventory and notify the lead.

## Enclosure fabrication

1. Load the approved enclosure file for the device type.
2. Print or machine the enclosure with the approved material.
3. Inspect for warping, cracks, or sharp edges.
4. Finish the enclosure and clean debris.
5. Dry-fit the electronics before final assembly.

## Electronics assembly

1. Assemble or receive the PCB and verify components.
2. Install the compute module (Raspberry Pi or Arduino) per the build guide.
3. Connect the GPS module and sensor suite to the harness.
4. Install connectors, battery leads, and wiring harnesses.
5. Mount sensors and modules using approved fixtures.
6. Check polarity and continuity with a multimeter.
7. Document any substitutions or rework.

## Firmware flash

1. Open Firmware Releases in the admin console.
2. Select the approved firmware version for this batch.
3. Flash firmware using the standard tool for the board.
4. Verify the firmware version after flashing.
5. Record the version in the device record.

## Device encoding

1. Open Device Registry > Encoding station.
2. Select the device record or scan the device ID.
3. Generate or enter a Key ID.
4. Copy the manifest into the encoder tool.
5. Program the device and verify it reports back the same ID.
6. Click "Mark encoded" to log the stage updates.

## Sensor calibration

1. Run calibration routines for sensors.
2. Verify GPS fix and BLE advertisement.
3. Log calibration notes in the device record.
4. Update the stage status to pass.

## QA and burn-in

1. Run the full functional checklist.
2. Verify vibration, lights, audio, and sensors.
3. Place the device into burn-in for the required duration.
4. Log a QA report in the admin console.

## Pack and ship

1. Package the device with accessories and documentation.
2. Create a shipment in the admin console.
3. Attach labels and hand off to the carrier.
4. Update shipment status when delivered.

## Activation and support

1. Confirm device pairing with the mobile app.
2. Verify the device appears in the user account.
3. Mark the Activation stage as complete.
4. Log support notes if needed.
