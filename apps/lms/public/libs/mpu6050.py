# MPU6050 6-axis IMU driver for MicroPython
# SCL=42, SDA=41 for Kokoon ESP32-S3 board
import struct, math

class MPU6050:
    WHO_AM_I = 0x75
    PWR_MGMT_1 = 0x6B
    ACCEL_XOUT_H = 0x3B

    def __init__(self, i2c, addr=0x68):
        self.i2c = i2c
        self.addr = addr
        # Wake up
        i2c.writeto_mem(addr, self.PWR_MGMT_1, b'\x00')

    def _read_raw(self):
        raw = self.i2c.readfrom_mem(self.addr, self.ACCEL_XOUT_H, 14)
        ax, ay, az, _, gx, gy, gz = struct.unpack('>7h', raw)
        return ax, ay, az, gx, gy, gz

    def get_accel(self):
        ax, ay, az, _, _, _ = self._read_raw()
        return ax / 16384.0, ay / 16384.0, az / 16384.0

    def get_gyro(self):
        _, _, _, gx, gy, gz = self._read_raw()
        return gx / 131.0, gy / 131.0, gz / 131.0

    def get_all(self):
        ax, ay, az, gx, gy, gz = self._read_raw()
        ax /= 16384.0; ay /= 16384.0; az /= 16384.0
        gx /= 131.0;   gy /= 131.0;   gz /= 131.0
        pitch = math.atan2(ay, math.sqrt(ax*ax + az*az)) * 57.2958
        roll  = math.atan2(-ax, az) * 57.2958
        return ax, ay, az, gx, gy, gz, pitch, roll

    def temperature(self):
        raw = self.i2c.readfrom_mem(self.addr, 0x41, 2)
        t = struct.unpack('>h', raw)[0]
        return t / 340.0 + 36.53
