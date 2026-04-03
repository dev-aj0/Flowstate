/**
 * Simple vibration test — Seeed XIAO nRF52840 Plus
 *
 * 1. Upload this sketch.
 * 2. Tools → Serial Monitor → set baud to 115200, line ending "Newline" or "Both NL & CR".
 * 3. Click in the input box and press SPACE, then Send (or Enter).
 *    The motor runs for 2 seconds on D1.
 *
 * On reset, onboard LED blinks 3× = firmware is running.
 * Same wiring as Flowstate: NPN + D1 (pin 1), motor, 3V3, common GND.
 */

const int MOTOR_PIN = 1; // D1 — if no buzz but Serial says Buzzing, try pin 2 and move the base wire
const unsigned long TEST_MS = 2000;

void setup() {
  Serial.begin(115200);

#ifdef LED_BUILTIN
  pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(120);
    digitalWrite(LED_BUILTIN, LOW);
    delay(120);
  }
#endif

  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
  Serial.println("Ready — press SPACE in Serial Monitor to buzz 2 seconds.");
}

void loop() {
  if (Serial.available() <= 0) {
    return;
  }

  int c = Serial.read();
  // Space bar = ASCII 32; also accept 'v' for quick test
  if (c == ' ' || c == 'v' || c == 'V') {
    Serial.println("Buzzing...");
    digitalWrite(MOTOR_PIN, HIGH);
    delay(TEST_MS);
    digitalWrite(MOTOR_PIN, LOW);
    Serial.println("Done.");
  } else if (c == '\n' || c == '\r') {
    // ignore lone newlines
  } else {
    Serial.print("Send SPACE (or v), got char code: ");
    Serial.println(c);
  }

  // Drain any extra bytes in buffer (e.g. CR after space)
  while (Serial.available() > 0) {
    Serial.read();
  }
}
