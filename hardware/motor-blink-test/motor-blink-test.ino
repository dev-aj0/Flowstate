/**
 * Motor on/off test — 1 second ON, 1 second OFF, forever.
 * Seeed XIAO nRF52840 Plus, D1 drives NPN base (same wiring as Flowstate).
 *
 * Power path when transistor is ON: 3V3 → motor+ → motor− → collector → emitter → GND
 * Upload, then unplug USB Serial if you use Flowstate (one program per COM port).
 */

const int MOTOR_PIN = 1; // D1
const unsigned long ON_MS = 1000;
const unsigned long OFF_MS = 1000;

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
}

void loop() {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(ON_MS);
  digitalWrite(MOTOR_PIN, LOW);
  delay(OFF_MS);
}
