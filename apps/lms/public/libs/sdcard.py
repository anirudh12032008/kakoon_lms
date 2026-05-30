# SD card SPI driver for MicroPython
import os, time

_CMD_TIMEOUT = const(100)
_R1_IDLE_STATE = const(1 << 0)
_R1_ILLEGAL_COMMAND = const(1 << 2)
_TOKEN_CMD25 = const(0xFC)
_TOKEN_STOP_TRAN = const(0xFD)
_TOKEN_DATA = const(0xFE)


class SDCard:
    def __init__(self, spi, cs, baudrate=1320000):
        self.spi = spi
        self.cs = cs
        self.cmdbuf = bytearray(6)
        self.dummybuf = bytearray(512)
        self.tokenbuf = bytearray(1)
        for i in range(512):
            self.dummybuf[i] = 0xFF
        self.dummybuf_memoryview = memoryview(self.dummybuf)
        self.cs.init(self.cs.OUT, value=1)
        self.init_card(baudrate)

    def init_spi(self, baudrate):
        try:
            master = self.spi.MASTER
        except AttributeError:
            self.spi.init(baudrate=baudrate, phase=0, polarity=0)
        else:
            self.spi.init(master, baudrate=baudrate, phase=0, polarity=0)

    def init_card(self, baudrate):
        self.init_spi(100000)
        for i in range(10):
            self.spi.write(self.dummybuf_memoryview[:1])
        self.cs(0)
        for i in range(10):
            self.spi.write(self.dummybuf_memoryview[:1])
        self.cs(1)
        if self.cmd(0, 0, 0x95) != _R1_IDLE_STATE:
            raise OSError("No SD card")
        for i in range(_CMD_TIMEOUT):
            if self.cmd(8, 0x01AA, 0x87, 4) == 1:
                self.sdhc = True
                break
            time.sleep_ms(10)
        else:
            self.sdhc = False
        for i in range(_CMD_TIMEOUT):
            if self.acmd(41, 0x40000000 if self.sdhc else 0) == 0:
                break
            time.sleep_ms(10)
        else:
            raise OSError("Timeout waiting for SD card")
        if self.sdhc:
            if self.cmd(58, 0, 0, 4) != 0:
                raise OSError("SD init failed (CMD58)")
        if self.cmd(16, 512, 0) != 0:
            raise OSError("SD set block size failed")
        self.init_spi(baudrate)

    def cmd(self, cmd, arg, crc, final=0, release=True, skip1=False):
        self.cs(0)
        buf = self.cmdbuf
        buf[0] = 0x40 | cmd
        buf[1] = arg >> 24
        buf[2] = arg >> 16
        buf[3] = arg >> 8
        buf[4] = arg
        buf[5] = crc
        self.spi.write(buf)
        if skip1:
            self.spi.readinto(self.tokenbuf, 0xFF)
        for i in range(_CMD_TIMEOUT):
            self.spi.readinto(self.tokenbuf, 0xFF)
            response = self.tokenbuf[0]
            if not (response & 0x80):
                for j in range(final):
                    self.spi.write(self.dummybuf_memoryview[:1])
                if release:
                    self.cs(1)
                    self.spi.write(self.dummybuf_memoryview[:1])
                return response
        self.cs(1)
        self.spi.write(self.dummybuf_memoryview[:1])
        return -1

    def acmd(self, cmd, arg):
        self.cmd(55, 0, 0)
        return self.cmd(cmd, arg, 0)

    def readblocks(self, block_num, buf):
        nblocks = len(buf) // 512
        assert nblocks and not len(buf) % 512
        if nblocks == 1:
            if self.cmd(17, block_num if self.sdhc else block_num << 9, 0, release=False) != 0:
                self.cs(1)
                raise OSError(5)
            self.readinto(buf)
        else:
            if self.cmd(18, block_num if self.sdhc else block_num << 9, 0, release=False) != 0:
                self.cs(1)
                raise OSError(5)
            offset = 0
            mv = memoryview(buf)
            while nblocks:
                self.readinto(mv[offset:offset + 512])
                offset += 512
                nblocks -= 1
            if self.cmd(12, 0, 0xFF, skip1=True) != 0:
                raise OSError(6)

    def readinto(self, buf):
        self.cs(0)
        for i in range(_CMD_TIMEOUT):
            self.spi.readinto(self.tokenbuf, 0xFF)
            if self.tokenbuf[0] == _TOKEN_DATA:
                self.spi.readinto(buf, 0xFF)
                self.spi.write(self.dummybuf_memoryview[:2])
                break
        else:
            self.cs(1)
            raise OSError(6)
        self.cs(1)

    def writeblocks(self, block_num, buf):
        nblocks, err = divmod(len(buf), 512)
        assert nblocks and not err
        if nblocks == 1:
            if self.cmd(24, block_num if self.sdhc else block_num << 9, 0, release=False) != 0:
                self.cs(1)
                raise OSError(5)
            self.write(buf, _TOKEN_DATA)
        else:
            if self.acmd(23, nblocks) or self.cmd(25, block_num if self.sdhc else block_num << 9, 0, release=False) != 0:
                self.cs(1)
                raise OSError(5)
            offset = 0
            mv = memoryview(buf)
            while nblocks:
                self.write(mv[offset:offset + 512], _TOKEN_CMD25)
                offset += 512
                nblocks -= 1
            self.write_token(_TOKEN_STOP_TRAN)

    def write(self, buf, token):
        self.cs(0)
        self.spi.read(1, token)
        self.spi.write(buf)
        self.spi.write(self.dummybuf_memoryview[:2])
        if self.spi.read(1, 0xFF)[0] & 0x1F != 0x05:
            self.cs(1)
            raise OSError(5)
        while self.spi.read(1, 0xFF)[0] == 0:
            pass
        self.cs(1)

    def write_token(self, token):
        self.cs(0)
        self.spi.read(1, token)
        self.spi.write(self.dummybuf_memoryview[:2])
        self.cs(1)
        time.sleep_ms(1)

    def ioctl(self, op, arg):
        if op == 4:
            return None
