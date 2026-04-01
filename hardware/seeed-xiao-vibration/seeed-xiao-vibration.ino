/**
 * Seeed XIAO nRF52840 Plus — wrist vibration motor for Flowstate.
 *
 * Board setup (Arduino IDE 2.x):
 *   1. File → Preferences → Additional boards URLs:
 *      https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
 *   2. Tools → Board → Boards Manager → search "seeed nrf52" → install
 *      "Seeed nRF52 mbed-enabled Boards" (recommended; Serial works without extra libs)
 *   3. Tools → Board → Seeed nRF52 mbed-enabled Boards → Seeed XIAO nRF52840 Plus
 *   4. Tools → Port → pick the XIAO (often "Seeed XIAO nRF52840" on COMx)
 *
 * Wiring — NPN low-side switch (example): motor (+) → 3V3, motor (−) → collector,
 *   emitter → GND, base → ~220Ω → D1. Tie XIAO GND to the same ground as the emitter.
 *   Add a flyback diode across the motor (cathode at 3V3 side) if the motor is inductive.
 * Code uses D1 = P0.03 = Arduino digital pin 1.
 *
 * Serial: 115200 baud over USB. The app sends a line "V" to trigger one ~250 ms pulse.
 */

const int MOTOR_PIN = 1; // D1 (P0.03) on XIAO nRF52840 / Plus
const unsigned long PULSE_MS = 250;

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(100); // ms — applies to readStringUntil (default 1000 is sluggish)
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
}

void loop() {
  if (Serial.available() <= 0) {
    return;
  }
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.equalsIgnoreCase("V")) {
    digitalWrite(MOTOR_PIN, HIGH);
    delay(PULSE_MS);
    digitalWrite(MOTOR_PIN, LOW);
  }
}
