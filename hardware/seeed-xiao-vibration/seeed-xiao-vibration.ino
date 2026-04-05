/**
 * Flowstate wrist — Seeed XIAO nRF52840 Plus, 115200 baud, motor on D2 (pin 2).
 *
 * SELF-TEST: On reset/upload the motor should buzz THREE short times BEFORE you
 * open Serial Monitor. If you never get those three chirps, the problem is
 * wiring or the pin — not the serial command.
 *
 * Serial Monitor: 115200, line ending "Newline". Type V and Send.
 */

const int MOTOR_PIN = 0; // silkscreen D2
const unsigned long PULSE_MS = 800;

void pulseMs(unsigned long ms) {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(ms);
  digitalWrite(MOTOR_PIN, LOW);
}

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  // Proof the pin + transistor + motor work — no USB input required
  delay(200);
  for (int i = 0; i < 3; i++) {
    pulseMs(120);
    delay(180);
  }

  Serial.begin(115200);
  Serial.setTimeout(150);
  delay(200);
  Serial.println("ready — send V + newline");
}

void loop() {
  if (!Serial.available()) {
    return;
  }

  // Whole line from Serial Monitor ("V" or "V\r") or Flowstate ("V\r\n")
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) {
    return;
  }

  char first = line.charAt(0);
  if (first == 'V' || first == 'v') {
    pulseMs(PULSE_MS);
  }
}
