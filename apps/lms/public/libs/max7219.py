# MAX7219 8x8 LED Matrix driver for MicroPython
import framebuf

_NOOP      = const(0)
_DIGIT0    = const(1)
_DECODEMODE= const(9)
_INTENSITY = const(10)
_SCANLIMIT = const(11)
_SHUTDOWN  = const(12)
_DISPLAYTEST=const(15)

class Matrix8x8:
    def __init__(self, spi, cs, num=1):
        self.spi = spi
        self.cs = cs
        self.num = num
        self.buffer = bytearray(8 * num)
        self.fb = framebuf.FrameBuffer(self.buffer, 8 * num, 8, framebuf.MONO_HLSB)
        self.cs.init(self.cs.OUT, value=1)
        self.init()

    def _write(self, cmd, data):
        self.cs(0)
        for _ in range(self.num):
            self.spi.write(bytearray([cmd, data]))
        self.cs(1)

    def init(self):
        for cmd, data in (
            (_SHUTDOWN,    0),
            (_DISPLAYTEST, 0),
            (_SCANLIMIT,   7),
            (_DECODEMODE,  0),
            (_SHUTDOWN,    1),
        ):
            self._write(cmd, data)

    def brightness(self, value):
        if not 0 <= value <= 15:
            raise ValueError("Brightness out of range")
        self._write(_INTENSITY, value)

    def fill(self, v): self.fb.fill(v)
    def pixel(self, x, y, v=None):
        if v is None: return self.fb.pixel(x, y)
        self.fb.pixel(x, y, v)
    def text(self, s, x, y, c=1): self.fb.text(s, x, y, c)
    def hline(self, x, y, w, c):  self.fb.hline(x, y, w, c)
    def vline(self, x, y, h, c):  self.fb.vline(x, y, h, c)
    def line(self, x1, y1, x2, y2, c): self.fb.line(x1, y1, x2, y2, c)
    def rect(self, x, y, w, h, c): self.fb.rect(x, y, w, h, c)
    def fill_rect(self, x, y, w, h, c): self.fb.fill_rect(x, y, w, h, c)

    def show(self):
        for y in range(8):
            self.cs(0)
            for m in range(self.num - 1, -1, -1):
                self.spi.write(bytearray([_DIGIT0 + y, self.buffer[y * self.num + m]]))
            self.cs(1)

    def scroll(self, dx, dy): self.fb.scroll(dx, dy)
