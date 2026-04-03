/**
 * Flowstate wrist — BLE (Nordic UART Service). Seeed XIAO nRF52840 Plus, motor on D2 (pin 2).
 *
 * Library: ArduinoBLE (Board Manager: Seeed nRF52, then Sketch → Include Library → ArduinoBLE)
 *
 * SELF-TEST: On reset the motor buzzes THREE short times.
 * Web app writes "V" to the NUS RX characteristic (same command as USB serial firmware).
 */

#include <ArduinoBLE.h>

const int MOTOR_PIN = 0;
const unsigned long PULSE_MS = 800;

/** Nordic UART Service — same UUIDs as Web Bluetooth / Nordic standard */
BLEService uartService("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
BLECharacteristic rxCharacteristic("6E400002-B5A3-F393-E0A9-E50E24DCCA9E", BLEWrite, 32);

void pulseMs(unsigned long ms) {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(ms);
  digitalWrite(MOTOR_PIN, LOW);
}

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  delay(200);
  for (int i = 0; i < 3; i++) {
    pulseMs(120);
    delay(180);
  }

  if (!BLE.begin()) {
    while (1) {
      delay(500);
    }
  }

  BLE.setLocalName("FlowstateXIAO");
  BLE.setAdvertisedService(uartService);
  uartService.addCharacteristic(rxCharacteristic);
  BLE.addService(uartService);
  BLE.setConnectionInterval(8, 12);
  BLE.advertise();
}

void loop() {
  BLE.poll();

  if (rxCharacteristic.written()) {
    const uint8_t *data = rxCharacteristic.value();
    int len = rxCharacteristic.valueLength();
    for (int i = 0; i < len; i++) {
      char c = (char)data[i];
      if (c == 'V' || c == 'v') {
        pulseMs(PULSE_MS);
        break;
      }
    }
  }
}
