# Hardware Setup Guide

This guide links the physical build to the software system. It is written for
non-engineers and should be followed in order. If a step is unclear, stop and
ask a lead.

## 1) Choose the connectivity path

Recommended for v1: BLE to mobile app (selected).

Why: lowest cost, best battery life, fastest to ship.

Other options (use only if required):
- Wi-Fi direct: for fixed installs.
- Cellular: standalone devices, higher cost.

## 2) Purchase list (baseline)

Use the "Hardware + assembly blueprint" in the admin console to seed the BOM.
Confirm vendors and replace placeholder SKUs before ordering.

Minimum baseline parts:
- MCU with BLE/Wi-Fi (ESP32-S3 DevKitC-1, `ESP32-S3-DEVKITC-1-N16R8`).
- GNSS module (SparkFun MAX-M10S, `GPS-18026`).
- Battery + charger/protection circuit (Adafruit `ADA-1578` + `ADA-4410`).
- Haptic motor + driver (Precision Microdrives `310-103` + Adafruit `ADA-2305`).
- RGB indicator LED (`SK6812MINI-E`).
- Enclosure + fasteners (in-house).

## 3) Assembly stations and handoffs

Each station should complete its steps and mark the stage in the admin console.

Stations:
1. Enclosure fabrication
2. Electronics assembly
3. Firmware flash
4. Device encoding
5. Sensor calibration
6. QA + burn-in
7. Pack + ship

## 4) Wiring checklist (baseline)

Always check voltage levels before connecting parts.

- GNSS: TX -> MCU RX, RX -> MCU TX, 3.3V, GND.
- IMU (if used): I2C SDA/SCL, 3.3V, GND.
- Haptic motor: use driver transistor or haptic driver IC.
- Audio: use amplifier board, do not drive speaker directly.
- LED: add a resistor on data line if using WS2812B.

## 5) Firmware + encoding workflow

1. Flash the approved firmware release.
2. Open the Encoding station in the admin console.
3. Select the device, generate a Key ID, and copy the manifest.
4. Program the device with the manifest data.
5. Click "Mark encoded" to update stages.

## 6) Functional test checklist

Minimum checks:
- Device powers on and boots.
- BLE advertises and can pair.
- GNSS receives a fix.
- Haptic motor vibrates.
- LED blinks to confirm status.

Log failures in QA reports and do not ship until resolved.

## 7) Field activation

1. Pair the device with the mobile app.
2. Confirm the device appears in the user account.
3. Mark the Activation stage complete.
