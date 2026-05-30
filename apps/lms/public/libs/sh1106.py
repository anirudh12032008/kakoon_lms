# SH1106 OLED driver for MicroPython
# Supports 128x64 and 128x32 via I2C or SPI
import framebuf

SET_CONTRAST        = const(0x81)
SET_NORM_INV        = const(0xa6)
SET_DISP            = const(0xae)
SET_SCAN_DIR        = const(0xc0)
SET_SEG_REMAP       = const(0xa0)
SET_MUX_RATIO       = const(0xa8)
SET_DISP_OFFSET     = const(0xd3)
SET_COM_PIN_CFG     = const(0xda)
SET_DISP_CLK_DIV    = const(0xd5)
SET_PRECHARGE       = const(0xd9)
SET_VCOM_DESEL      = const(0xdb)
SET_CHARGE_PUMP     = const(0x8d)

class SH1106:
    def __init__(self, width, height, external_vcc=False):
        self.width = width
        self.height = height
        self.external_vcc = external_vcc
        self.pages = height // 8
        self.buffer = bytearray(self.pages * self.width)
        self.fb = framebuf.FrameBuffer(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
        self.init_display()

    def init_display(self):
        for cmd in (
            SET_DISP | 0x00,        # display off
            SET_MUX_RATIO, self.height - 1,
            SET_DISP_OFFSET, 0x00,
            0x40,                   # start line 0
            SET_SEG_REMAP | 0x01,  # column addr 127 mapped to SEG0
            SET_SCAN_DIR | 0x08,   # COM scan direction remapped
            SET_COM_PIN_CFG, 0x12 if self.height == 64 else 0x02,
            SET_CONTRAST, 0x7f,
            SET_NORM_INV,
            SET_DISP_CLK_DIV, 0x80,
            SET_PRECHARGE, 0x22 if self.external_vcc else 0xf1,
            SET_VCOM_DESEL, 0x30,  # 0.83*Vcc
            SET_CHARGE_PUMP, 0x10 if self.external_vcc else 0x14,
            SET_DISP | 0x01,       # display on
        ):
            self.write_cmd(cmd)
        self.fill(0)
        self.show()

    def poweroff(self): self.write_cmd(SET_DISP | 0x00)
    def poweron(self):  self.write_cmd(SET_DISP | 0x01)
    def contrast(self, contrast): self.write_cmd(SET_CONTRAST); self.write_cmd(contrast)
    def invert(self, invert):     self.write_cmd(SET_NORM_INV | (invert & 1))
    def rotate(self, rotate):
        self.write_cmd(SET_COM_PIN_CFG | (not rotate) & 1)
        self.write_cmd(SET_SEG_REMAP   | (    rotate) & 1)

    def fill(self, col):    self.fb.fill(col)
    def pixel(self, x, y, col): self.fb.pixel(x, y, col)
    def scroll(self, dx, dy):   self.fb.scroll(dx, dy)
    def text(self, string, x, y, col=1): self.fb.text(string, x, y, col)
    def blit(self, fbuf, x, y): self.fb.blit(fbuf, x, y)
    def rect(self, x, y, w, h, col): self.fb.rect(x, y, w, h, col)
    def fill_rect(self, x, y, w, h, col): self.fb.fill_rect(x, y, w, h, col)
    def line(self, x1, y1, x2, y2, col): self.fb.line(x1, y1, x2, y2, col)
    def hline(self, x, y, w, col): self.fb.hline(x, y, w, col)
    def vline(self, x, y, h, col): self.fb.vline(x, y, h, col)

    def show(self):
        x0 = 0
        x1 = self.width - 1
        for page in range(self.height // 8):
            self.write_cmd(0xb0 | page)
            col_lo = (x0 + 2) & 0x0f
            col_hi = ((x0 + 2) >> 4) & 0x0f
            self.write_cmd(0x00 | col_lo)
            self.write_cmd(0x10 | col_hi)
            self.write_data(self.buffer[x0 + page * self.width : x1 + page * self.width + 1])


class SH1106_I2C(SH1106):
    def __init__(self, width, height, i2c, addr=0x3c, external_vcc=False):
        self.i2c = i2c
        self.addr = addr
        self.temp = bytearray(2)
        super().__init__(width, height, external_vcc)

    def write_cmd(self, cmd):
        self.temp[0] = 0x80
        self.temp[1] = cmd
        self.i2c.writeto(self.addr, self.temp)

    def write_data(self, buf):
        write_buf = bytearray(len(buf) + 1)
        write_buf[0] = 0x40
        write_buf[1:] = buf
        self.i2c.writeto(self.addr, write_buf)


class SH1106_SPI(SH1106):
    def __init__(self, width, height, spi, dc, res, cs, external_vcc=False):
        import machine
        self.spi = spi
        self.dc = dc
        self.res = res
        self.cs = cs
        import time
        self.res(1)
        time.sleep_ms(1)
        self.res(0)
        time.sleep_ms(20)
        self.res(1)
        time.sleep_ms(20)
        super().__init__(width, height, external_vcc)

    def write_cmd(self, cmd):
        self.dc(0)
        self.cs(0)
        self.spi.write(bytearray([cmd]))
        self.cs(1)

    def write_data(self, buf):
        self.dc(1)
        self.cs(0)
        self.spi.write(buf)
        self.cs(1)
