# TM1637 7-segment display driver for MicroPython
# Supports 4-digit display with colon
import time
from machine import Pin

TM1637_CMD1 = const(0x40)  # Data command
TM1637_CMD2 = const(0xC0)  # Address command
TM1637_CMD3 = const(0x88)  # Display control
TM1637_DSP_ON = const(0x08)
TM1637_DELAY = const(10)

_SEGMENTS = bytearray(b'\x3F\x06\x5B\x4F\x66\x6D\x7D\x07\x7F\x6F\x77\x7C\x39\x5E\x79\x71')

class TM1637:
    def __init__(self, clk, dio, brightness=7):
        self.clk = clk
        self.dio = dio
        if not 0 <= brightness <= 7:
            raise ValueError("Brightness out of range")
        self._brightness = brightness
        self.clk.init(Pin.OUT, value=0)
        self.dio.init(Pin.OUT, value=0)
        time.sleep_us(TM1637_DELAY)
        self._write_data_cmd()
        self._write_dsp_ctrl()

    def _start(self):
        self.dio(0)
        time.sleep_us(TM1637_DELAY)
        self.clk(0)
        time.sleep_us(TM1637_DELAY)

    def _stop(self):
        self.dio(0)
        time.sleep_us(TM1637_DELAY)
        self.clk(1)
        time.sleep_us(TM1637_DELAY)
        self.dio(1)

    def _write_byte(self, b):
        for i in range(8):
            self.dio((b >> i) & 1)
            time.sleep_us(TM1637_DELAY)
            self.clk(1)
            time.sleep_us(TM1637_DELAY)
            self.clk(0)
            time.sleep_us(TM1637_DELAY)
        self.clk(0)
        time.sleep_us(TM1637_DELAY)
        self.clk(1)
        time.sleep_us(TM1637_DELAY)
        self.clk(0)
        time.sleep_us(TM1637_DELAY)

    def _write_data_cmd(self):
        self._start()
        self._write_byte(TM1637_CMD1)
        self._stop()

    def _write_dsp_ctrl(self):
        self._start()
        self._write_byte(TM1637_CMD3 | TM1637_DSP_ON | self._brightness)
        self._stop()

    def brightness(self, val=None):
        if val is None: return self._brightness
        if not 0 <= val <= 7: raise ValueError("Brightness out of range")
        self._brightness = val
        self._write_data_cmd()
        self._write_dsp_ctrl()

    def write(self, segments, pos=0):
        if not 0 <= pos <= 5: raise ValueError("Position out of range")
        self._write_data_cmd()
        self._start()
        self._write_byte(TM1637_CMD2 | pos)
        for seg in segments:
            self._write_byte(seg)
        self._stop()
        self._write_dsp_ctrl()

    def encode_digit(self, digit):
        return _SEGMENTS[digit & 0x0f]

    def encode_string(self, s):
        segments = bytearray(len(s))
        for i, c in enumerate(s):
            if c == ' ':
                segments[i] = 0x00
            elif c == '-':
                segments[i] = 0x40
            elif c.isdigit():
                segments[i] = _SEGMENTS[int(c)]
            elif c.isalpha():
                segments[i] = _SEGMENTS[int(c, 16)] if c.lower() in 'abcdef' else 0x00
        return segments

    def hex(self, val):
        string = '{:04x}'.format(val & 0xffff)
        self.write(self.encode_string(string))

    def number(self, num):
        num = max(-999, min(num, 9999))
        if num < 0:
            negative = True
            num = -num
        else:
            negative = False
        string = '{:04d}'.format(num)
        if negative:
            string = '-' + string[1:]
        self.write(self.encode_string(string))

    def numbers(self, num1, num2, colon=True):
        num1 = max(-9, min(num1, 99))
        num2 = max(-9, min(num2, 99))
        segments = self.encode_string('{:02d}{:02d}'.format(num1, num2))
        if colon:
            segments[1] |= 0x80
        self.write(segments)

    def temperature(self, num):
        if num < -9:
            self.show('----')
        elif num < 0:
            self.write([0x40, _SEGMENTS[-num], 0x63, 0x00])
        else:
            self.write([_SEGMENTS[num // 10] if num > 9 else 0x00,
                        _SEGMENTS[num % 10], 0x63, 0x00])

    def show(self, string, colon=False):
        segments = self.encode_string(string)
        if len(segments) > 1 and colon:
            segments[1] |= 128
        self.write(segments[:4])

    def scroll(self, string, delay=250):
        segments = string if isinstance(string, list) else self.encode_string(string)
        data = [0] * 8 + list(segments) + [0] * 8
        for i in range(len(data) - 3):
            self.write(data[i:i + 4])
            time.sleep_ms(delay)
