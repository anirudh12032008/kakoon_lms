# MFRC522 RFID reader driver for MicroPython (software SPI, any GPIO pins).
# Reads the UID of MIFARE cards / key fobs:
#
#   rdr = MFRC522(sck, mosi, miso, rst, cs)
#   stat, _ = rdr.request(rdr.REQIDL)
#   if stat == rdr.OK:
#       stat, uid = rdr.anticoll()      # uid = [b0, b1, b2, b3, checksum]
#
# The module runs on 3.3 V only.
import time
from machine import Pin, SoftSPI


class MFRC522:
    OK = 0
    NOTAGERR = 1
    ERR = 2

    REQIDL = 0x26  # REQA: cards that are not halted
    REQALL = 0x52  # WUPA: every card in the field

    # Registers
    _COMMAND = 0x01
    _COM_IEN = 0x02
    _COM_IRQ = 0x04
    _ERROR = 0x06
    _FIFO_DATA = 0x09
    _FIFO_LEVEL = 0x0A
    _CONTROL = 0x0C
    _BIT_FRAMING = 0x0D
    _MODE = 0x11
    _TX_CONTROL = 0x14
    _TX_ASK = 0x15
    _T_MODE = 0x2A
    _T_PRESCALER = 0x2B
    _T_RELOAD_H = 0x2C
    _T_RELOAD_L = 0x2D

    # Commands
    _IDLE = 0x00
    _TRANSCEIVE = 0x0C
    _SOFT_RESET = 0x0F

    def __init__(self, sck, mosi, miso, rst, cs):
        self.rst = Pin(rst, Pin.OUT)
        self.cs = Pin(cs, Pin.OUT)
        self.rst.value(0)
        self.cs.value(1)
        self.spi = SoftSPI(baudrate=100000, polarity=0, phase=0,
                           sck=Pin(sck), mosi=Pin(mosi), miso=Pin(miso))
        self.rst.value(1)
        time.sleep_ms(50)
        self.init()

    # Address byte: bit 7 = read, bits 6..1 = register, bit 0 = 0.
    def _wreg(self, reg, val):
        self.cs.value(0)
        self.spi.write(bytes([(reg << 1) & 0x7E, val & 0xFF]))
        self.cs.value(1)

    def _rreg(self, reg):
        self.cs.value(0)
        self.spi.write(bytes([((reg << 1) & 0x7E) | 0x80]))
        val = self.spi.read(1)
        self.cs.value(1)
        return val[0]

    def _sflags(self, reg, mask):
        self._wreg(reg, self._rreg(reg) | mask)

    def _cflags(self, reg, mask):
        self._wreg(reg, self._rreg(reg) & (~mask & 0xFF))

    def _tocard(self, send):
        """Send bytes to the card, return (status, received bytes, received bit count)."""
        recv = []
        bits = 0
        self._wreg(self._COM_IEN, 0x77 | 0x80)
        self._cflags(self._COM_IRQ, 0x80)      # clear pending interrupt flags
        self._sflags(self._FIFO_LEVEL, 0x80)   # flush the FIFO
        self._wreg(self._COMMAND, self._IDLE)
        for b in send:
            self._wreg(self._FIFO_DATA, b)
        self._wreg(self._COMMAND, self._TRANSCEIVE)
        self._sflags(self._BIT_FRAMING, 0x80)  # StartSend

        irq = 0
        for _ in range(2000):
            irq = self._rreg(self._COM_IRQ)
            if irq & 0x31:                     # RxIRq, IdleIRq or TimerIRq (15 ms timeout)
                break
        self._cflags(self._BIT_FRAMING, 0x80)

        if not irq & 0x31:
            return self.ERR, recv, bits
        if self._rreg(self._ERROR) & 0x1B:     # buffer overflow, collision, parity, protocol
            return self.ERR, recv, bits
        if irq & 0x01 and not irq & 0x30:      # timer ran out: no card answered
            return self.NOTAGERR, recv, bits

        n = self._rreg(self._FIFO_LEVEL)
        last_bits = self._rreg(self._CONTROL) & 0x07
        bits = (n - 1) * 8 + last_bits if last_bits else n * 8
        for _ in range(max(1, min(n, 16))):
            recv.append(self._rreg(self._FIFO_DATA))
        return self.OK, recv, bits

    def init(self):
        self.reset()
        self._wreg(self._T_MODE, 0x8D)         # timer starts automatically after each transmission
        self._wreg(self._T_PRESCALER, 0x3E)    # about 2 kHz timer clock
        self._wreg(self._T_RELOAD_L, 30)       # about 15 ms timeout
        self._wreg(self._T_RELOAD_H, 0)
        self._wreg(self._TX_ASK, 0x40)         # 100 % ASK modulation
        self._wreg(self._MODE, 0x3D)           # CRC preset 0x6363 (ISO 14443-3)
        self.antenna_on()

    def reset(self):
        self._wreg(self._COMMAND, self._SOFT_RESET)
        time.sleep_ms(50)

    def antenna_on(self, on=True):
        if on:
            self._sflags(self._TX_CONTROL, 0x03)
        else:
            self._cflags(self._TX_CONTROL, 0x03)

    def request(self, mode):
        """Ask for a card. Returns (status, bits); status is OK when a card answered."""
        self._wreg(self._BIT_FRAMING, 0x07)    # REQA / WUPA are 7-bit frames
        stat, recv, bits = self._tocard([mode])
        if stat == self.OK and bits != 16:     # the answer (ATQA) is always 2 bytes
            stat = self.ERR
        return stat, bits

    def anticoll(self):
        """Read the card serial number. Returns (status, [4 UID bytes + checksum])."""
        self._wreg(self._BIT_FRAMING, 0x00)
        stat, recv, bits = self._tocard([0x93, 0x20])
        if stat == self.OK:
            if len(recv) == 5 and recv[0] ^ recv[1] ^ recv[2] ^ recv[3] == recv[4]:
                return self.OK, recv
            stat = self.ERR
        return stat, recv
