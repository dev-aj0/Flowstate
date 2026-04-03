/**
 * Seeed XIAO nRF52840 — approximate LiPo % over USB Serial.
 *
 * Serial Monitor: 115200, Newline. Type V + Send.
 *
 * If you always see ~0%: (1) A LiPo must be on BAT / GND (USB-only often reads ~0 raw).
 * (2) Try ADC_USE_12BIT = 0 below. (3) Tune DIVIDER_RATIO / VREF_VOLTS using the printed "raw".
 */

const int PIN_VBAT_SENSE = A0;

/** nRF mbed cores often use 12-bit analogRead (0–4095). Set 0 if raw looks stuck high (~1023). */
#define ADC_USE_12BIT 1
#if ADC_USE_12BIT
const int ADC_MAX = 4095;
#else
const int ADC_MAX = 1023;
#endif

/** After the resistor divider: VBAT ≈ Vadc × DIVIDER_RATIO (Seeed is often ~2×). */
const float DIVIDER_RATIO = 2.0f;

/** Full-scale voltage at the ADC pin (internal ref on nRF mbed is often 0.6 V × 6 = 3.6 V — try 3.3 if volts look off). */
const float VREF_VOLTS = 3.6f;

/** Multiply final VBAT if your multimeter says higher (e.g. 1.15 if we read 10% low). */
const float VBAT_CALIBRATION = 1.0f;

/** Rough LiPo endpoints (linear guess — not a fuel gauge). */
const float VBAT_EMPTY = 3.0f;
const float VBAT_FULL = 4.2f;

int readRawAveraged() {
  long sum = 0;
  const int n = 16;
  for (int i = 0; i < n; i++) {
    sum += analogRead(PIN_VBAT_SENSE);
    delay(2);
  }
  return (int)(sum / n);
}

float rawToVbat(int raw) {
  float vAdc = (float)raw / (float)ADC_MAX * VREF_VOLTS;
  return vAdc * DIVIDER_RATIO * VBAT_CALIBRATION;
}

int estimatePercent(float vbat) {
  if (vbat <= VBAT_EMPTY) return 0;
  if (vbat >= VBAT_FULL) return 100;
  return (int)((vbat - VBAT_EMPTY) / (VBAT_FULL - VBAT_EMPTY) * 100.0f + 0.5f);
}

void setup() {
  pinMode(PIN_VBAT_SENSE, INPUT);
  Serial.begin(115200);
#if ADC_USE_12BIT
  analogReadResolution(12);
#endif
  delay(300);
  analogRead(PIN_VBAT_SENSE); /* discard */
  Serial.println("Ready — type V + Enter for battery %");
  Serial.println("(If raw~0: connect a LiPo to BAT/GND; USB-only often reads 0.)");
}

void loop() {
  if (!Serial.available()) {
    return;
  }
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) {
    return;
  }
  char first = line.charAt(0);
  if (first != 'V' && first != 'v') {
    return;
  }

  int raw = readRawAveraged();
  float vbat = rawToVbat(raw);
  int pct = estimatePercent(vbat);

  Serial.print("raw=");
  Serial.print(raw);
  Serial.print("  |  VBAT ~ ");
  Serial.print(vbat, 2);
  Serial.print(" V  |  ~");
  Serial.print(pct);
  Serial.println(" %");
}
