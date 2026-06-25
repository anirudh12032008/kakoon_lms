import time
from ustruct import unpack

ADS1115_ADDR     = const(0x48)  # ADDR pin -> GND

# Config register
_REG_CONV        = const(0x00)
_REG_CONFIG      = const(0x01)

# PGA (gain) -> full-scale voltage
_PGA_FS = {
    0: 6.144,   # ±6.144 V
    1: 4.096,   # ±4.096 V
    2: 2.048,   # ±2.048 V  (default)
    3: 1.024,
    4: 0.512,
    5: 0.256,
}

# Single-ended MUX codes for A0..A3
_MUX_SINGLE = [0x04, 0x05, 0x06, 0x07]


class ADS1115:
    def __init__(self, i2c, address=ADS1115_ADDR, gain=2, data_rate=4):
        """
        gain      : 0-5 (see _PGA_FS above); 2 = ±2.048 V covers 3.3 V rails
        data_rate : 0-7  (8/16/32/64/128/250/475/860 SPS); 4 = 128 SPS
        """
        self._i2c      = i2c
        self._addr     = address
        self._gain     = gain & 0x07
        self._dr       = data_rate & 0x07
        self._fs       = _PGA_FS.get(gain, 2.048)
        self._buf      = bytearray(3)

    def _read_channel(self, ch):
        mux = _MUX_SINGLE[ch]

        # Build config word
        # Bit 15   : OS=1  (start single conversion)
        # Bits 14-12: MUX
        # Bits 11-9 : PGA
        # Bit 8    : MODE=1 (single-shot)
        # Bits 7-5  : DR
        # Bits 4-0  : comparator defaults (disabled)
        config = (
            (1 << 15)         |   # start conversion
            (mux << 12)       |
            (self._gain << 9) |
            (1 << 8)          |   # single-shot mode
            (self._dr << 5)   |
            0x0003                # disable comparator
        )

        self._buf[0] = _REG_CONFIG
        self._buf[1] = (config >> 8) & 0xFF
        self._buf[2] = config & 0xFF
        self._i2c.writeto(self._addr, self._buf)

        # Wait for conversion (OS bit goes high when done)
        while True:
            time.sleep_ms(1)
            self._i2c.writeto(self._addr, bytes([_REG_CONFIG]))
            data = self._i2c.readfrom(self._addr, 2)
            if data[0] & 0x80:  # OS bit set -> result ready
                break

        # Read conversion register
        self._i2c.writeto(self._addr, bytes([_REG_CONV]))
        data = self._i2c.readfrom(self._addr, 2)
        raw = unpack('>h', data)[0]          # signed 16-bit big-endian
        return raw

    def read_raw(self, ch):
        """Raw signed 16-bit value (-32768..32767) for channel 0-3."""
        return self._read_channel(ch & 0x03)

    def read_voltage(self, ch):
        """Voltage in volts for channel 0-3."""
        raw = self._read_channel(ch & 0x03)
        return raw * self._fs / 32767.0

    def read_percent(self, ch, v_ref=3.3):
        """0.0-100.0 % of v_ref for channel 0-3 (useful for potentiometers)."""
        v = self.read_voltage(ch)
        v = max(0.0, min(v_ref, v))
        return v / v_ref * 100.0

    def read_all_raw(self):
        """Read all 4 channels, return list of raw values."""
        return [self._read_channel(ch) for ch in range(4)]

    def read_all_voltage(self):
        """Read all 4 channels, return list of voltages."""
        return [self.read_voltage(ch) for ch in range(4)]

    def read_all_percent(self, v_ref=3.3):
        """Read all 4 channels, return list of 0-100 % values."""
        return [self.read_percent(ch, v_ref) for ch in range(4)]
