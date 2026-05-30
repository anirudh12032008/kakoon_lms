# BME280 Temperature, Humidity, Pressure sensor driver for MicroPython
import time
from ustruct import unpack, unpack_from
from array import array

# BME280 default address
BME280_I2C_ADDR_PRIM = const(0x76)
BME280_I2C_ADDR_SEC  = const(0x77)

BME280_OSAMPLE_1  = const(1)
BME280_OSAMPLE_2  = const(2)
BME280_OSAMPLE_4  = const(3)
BME280_OSAMPLE_8  = const(4)
BME280_OSAMPLE_16 = const(5)

BME280_REGISTER_CONTROL_HUM  = const(0xF2)
BME280_REGISTER_STATUS       = const(0xF3)
BME280_REGISTER_CONTROL      = const(0xF4)
BME280_REGISTER_CONFIG       = const(0xF5)
BME280_REGISTER_DATA         = const(0xF7)
BME280_REGISTER_DIG_T1       = const(0x88)
BME280_REGISTER_DIG_H1       = const(0xA1)
BME280_REGISTER_DIG_H2       = const(0xE1)


class BME280:
    def __init__(self, mode=BME280_OSAMPLE_1, address=BME280_I2C_ADDR_PRIM, i2c=None):
        assert i2c is not None, "An I2C object is required."
        self._mode = mode
        self.address = address
        self._device = i2c
        self.__sealevel = 101325

        # Read trimming parameters
        self._T1, self._T2, self._T3 = unpack('<Hhh', self._device.readfrom_mem(self.address, BME280_REGISTER_DIG_T1, 6))
        self._P1, self._P2, self._P3, self._P4, self._P5, self._P6, self._P7, self._P8, self._P9 = unpack('<Hhhhhhhh', self._device.readfrom_mem(self.address, 0x8E, 18))
        self._H1 = self._device.readfrom_mem(self.address, BME280_REGISTER_DIG_H1, 1)[0]
        h = self._device.readfrom_mem(self.address, BME280_REGISTER_DIG_H2, 7)
        self._H2, self._H3 = unpack('<hB', h[:3])
        e4, e5, e6 = unpack('BBb', h[3:6])
        self._H4 = (e4 << 4) | (e5 & 0xF)
        self._H5 = (e5 >> 4) | (e6 << 4)
        self._H6 = h[6]

        self._device.writeto_mem(self.address, BME280_REGISTER_CONTROL_HUM, bytes([mode]))
        self._device.writeto_mem(self.address, BME280_REGISTER_CONTROL, bytes([mode << 5 | mode << 2 | 3]))

    def read_raw_data(self):
        d = self._device.readfrom_mem(self.address, BME280_REGISTER_DATA, 8)
        self._raw_temp  = ((d[3] << 16) | (d[4] << 8) | d[5]) >> 4
        self._raw_press = ((d[0] << 16) | (d[1] << 8) | d[2]) >> 4
        self._raw_hum   = (d[6] << 8) | d[7]

    def read_compensated_data(self):
        self.read_raw_data()
        # Temperature
        var1 = (self._raw_temp / 16384.0 - self._T1 / 1024.0) * self._T2
        var2 = (self._raw_temp / 131072.0 - self._T1 / 8192.0) ** 2 * self._T3
        t_fine = int(var1 + var2)
        temp = (var1 + var2) / 5120.0
        # Pressure
        var1 = t_fine / 2.0 - 64000.0
        var2 = var1 * var1 * self._P6 / 32768.0
        var2 = var2 + var1 * self._P5 * 2.0
        var2 = var2 / 4.0 + self._P4 * 65536.0
        var1 = (self._P3 * var1 * var1 / 524288.0 + self._P2 * var1) / 524288.0
        var1 = (1.0 + var1 / 32768.0) * self._P1
        pressure = 1048576.0 - self._raw_press
        if var1 != 0:
            pressure = (pressure - var2 / 4096.0) * 6250.0 / var1
            var1 = self._P9 * pressure * pressure / 2147483648.0
            var2 = pressure * self._P8 / 32768.0
            pressure += (var1 + var2 + self._P7) / 16.0
        # Humidity
        x = t_fine - 76800.0
        if x != 0:
            x = (self._raw_hum - (self._H4 * 64.0 + (self._H5 / 16384.0) * x)) * \
                (self._H2 / 65536.0 * (1.0 + self._H6 / 67108864.0 * x * (1.0 + self._H3 / 67108864.0 * x)))
            x = x * (1.0 - self._H1 * x / 524288.0)
            x = max(0.0, min(x, 100.0))
        humidity = x
        return temp, pressure, humidity

    @property
    def values(self):
        t, p, h = self.read_compensated_data()
        return ('{:.2f}C'.format(t), '{:.2f}hPa'.format(p / 100),
                '{:.2f}%'.format(h))

    @property
    def temperature(self): return self.read_compensated_data()[0]
    @property
    def pressure(self):    return self.read_compensated_data()[1] / 100
    @property
    def humidity(self):    return self.read_compensated_data()[2]
