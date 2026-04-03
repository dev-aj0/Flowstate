/**
 * D10 held HIGH continuously (3.3 V logic on the pin).
 *
 * Use with a transistor: D10 → resistor → NPN base; motor on 3V3/collector path.
 * Do not hang a motor directly on D10 + GND for long — it can damage the pin.
 */

const int MOTOR_PIN = 0; // D10

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, HIGH);
}

void loop() {
  digitalWrite(MOTOR_PIN, HIGH);
}
