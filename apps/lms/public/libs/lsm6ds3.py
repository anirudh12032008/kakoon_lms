# LSM6DS3 6-axis IMU driver for MicroPython
# Onboard on Kakoon ESP32-S3 board: SoftI2C(scl=Pin(42), sda=Pin(41))
# Address: 0x6A (SA0=GND) or 0x6B (SA0=VDD)
import struct, math

_WHO_AM_I  = const(0x0F)
_CTRL1_XL  = const(0x10)   # Accel control
_CTRL2_G   = const(0x11)   # Gyro  control
_CTRL3_C   = const(0x12)   # IF_INC = 1 for auto-increment reads
_STATUS    = const(0x1E)
_OUT_TEMP  = const(0x20)
_OUTX_L_G  = const(0x22)   # Gyro  XYZ (6 bytes)
_OUTX_L_XL = const(0x28)   # Accel XYZ (6 bytes)

# Accel full-scale sensitivity (mg/LSB at 16-bit)
_ACCEL_FS = {0: 0.061, 1: 0.488, 2: 0.122, 3: 0.244}  # ±2g, ±16g, ±4g, ±8g
# Gyro  full-scale sensitivity (mdps/LSB at 16-bit)
_GYRO_FS  = {0: 8.75, 1: 17.5, 2: 35.0, 3: 70.0}  # 245, 500, 1000, 2000 dps


class LSM6DS3:
    def __init__(self, i2c, addr=0x6A, accel_fs=0, gyro_fs=0):
        self._i2c  = i2c
        self._addr = addr
        self._accel_scale = _ACCEL_FS[accel_fs] / 1000.0   # → g
        self._gyro_scale  = _GYRO_FS[gyro_fs]  / 1000.0    # → dps

        # Wake up & configure
        # CTRL3_C: BDU=1, IF_INC=1
        self._write(_CTRL3_C, 0x44)
        # CTRL1_XL: ODR=104 Hz, FS=±2g, AA-BW=400 Hz
        self._write(_CTRL1_XL, (0b0100 << 4) | (accel_fs << 2))
        # CTRL2_G:  ODR=104 Hz, FS=245 dps
        self._write(_CTRL2_G,  (0b0100 << 4) | (gyro_fs << 2))

    def _write(self, reg, val):
        self._i2c.writeto_mem(self._addr, reg, bytes([val]))

    def _read(self, reg, n):
        return self._i2c.readfrom_mem(self._addr, reg, n)

    def whoami(self):
        return self._read(_WHO_AM_I, 1)[0]   # should be 0x69

    def accel(self):
        """Return (ax, ay, az) in g."""
        raw = self._read(_OUTX_L_XL, 6)
        x, y, z = struct.unpack('<3h', raw)
        s = self._accel_scale
        return x * s, y * s, z * s

    def gyro(self):
        """Return (gx, gy, gz) in degrees/second."""
        raw = self._read(_OUTX_L_G, 6)
        x, y, z = struct.unpack('<3h', raw)
        s = self._gyro_scale
        return x * s, y * s, z * s

    def temperature(self):
        """Return temperature in °C."""
        raw = self._read(_OUT_TEMP, 2)
        t = struct.unpack('<h', raw)[0]
        return t / 256.0 + 25.0

    def euler(self):
        """Return (pitch, roll) in degrees computed from accel."""
        ax, ay, az = self.accel()
        pitch = math.atan2(ay, math.sqrt(ax * ax + az * az)) * 57.2958
        roll  = math.atan2(-ax, az) * 57.2958
        return pitch, roll
