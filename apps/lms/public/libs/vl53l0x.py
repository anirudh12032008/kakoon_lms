# VL53L0X Time-of-Flight distance sensor for MicroPython
import time

_SYSRANGE_START = const(0x00)
_SYSTEM_THRESH_HIGH = const(0x0C)
_SYSTEM_THRESH_LOW = const(0x0E)
_SYSTEM_SEQUENCE_CONFIG = const(0x01)
_SYSTEM_RANGE_CONFIG = const(0x09)
_SYSTEM_INTERMEASUREMENT_PERIOD = const(0x04)
_SYSTEM_INTERRUPT_CONFIG_GPIO = const(0x0A)
_GPIO_HV_MUX_ACTIVE_HIGH = const(0x84)
_SYSTEM_INTERRUPT_CLEAR = const(0x0B)
_RESULT_INTERRUPT_STATUS = const(0x13)
_RESULT_RANGE_STATUS = const(0x14)
_RESULT_CORE_AMBIENT_WINDOW_EVENTS_RTN = const(0xBC)
_RESULT_CORE_RANGING_TOTAL_EVENTS_RTN = const(0xC0)
_RESULT_CORE_AMBIENT_WINDOW_EVENTS_REF = const(0xD0)
_RESULT_CORE_RANGING_TOTAL_EVENTS_REF = const(0xD4)
_RESULT_PEAK_SIGNAL_RATE_REF = const(0xB6)
_ALGO_PART_TO_PART_RANGE_OFFSET_MM = const(0x28)
_I2C_SLAVE_DEVICE_ADDRESS = const(0x8A)
_MSRC_CONFIG_CONTROL = const(0x60)
_PRE_RANGE_CONFIG_MIN_SNR = const(0x27)
_PRE_RANGE_CONFIG_VALID_PHASE_LOW = const(0x56)
_PRE_RANGE_CONFIG_VALID_PHASE_HIGH = const(0x57)
_PRE_RANGE_MIN_COUNT_RATE_RTN_LIMIT = const(0x64)
_FINAL_RANGE_CONFIG_MIN_SNR = const(0x67)
_FINAL_RANGE_CONFIG_VALID_PHASE_LOW = const(0x47)
_FINAL_RANGE_CONFIG_VALID_PHASE_HIGH = const(0x48)
_FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT = const(0x44)
_PRE_RANGE_CONFIG_SIGMA_THRESH_HI = const(0x61)
_PRE_RANGE_CONFIG_SIGMA_THRESH_LO = const(0x62)
_PRE_RANGE_CONFIG_VCSEL_PERIOD = const(0x50)
_PRE_RANGE_CONFIG_TIMEOUT_MACROP_HI = const(0x51)
_PRE_RANGE_CONFIG_TIMEOUT_MACROP_LO = const(0x52)
_SYSTEM_HISTOGRAM_BIN = const(0x81)
_HISTOGRAM_CONFIG_INITIAL_PHASE_SELECT = const(0x33)
_HISTOGRAM_CONFIG_READOUT_CTRL = const(0x55)
_FINAL_RANGE_CONFIG_VCSEL_PERIOD = const(0x70)
_FINAL_RANGE_CONFIG_TIMEOUT_MACROP_HI = const(0x71)
_FINAL_RANGE_CONFIG_TIMEOUT_MACROP_LO = const(0x72)
_CROSSTALK_COMPENSATION_PEAK_RATE_MCPS = const(0x20)
_MSRC_CONFIG_TIMEOUT_MACROP = const(0x46)
_SOFT_RESET_GO2_SOFT_RESET_N = const(0xBF)
_IDENTIFICATION_MODEL_ID = const(0xC0)
_IDENTIFICATION_REVISION_ID = const(0xC2)
_OSC_CALIBRATE_VAL = const(0xF8)
_GLOBAL_CONFIG_VCSEL_WIDTH = const(0x32)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_0 = const(0xB0)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_1 = const(0xB1)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_2 = const(0xB2)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_3 = const(0xB3)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_4 = const(0xB4)
_GLOBAL_CONFIG_SPAD_ENABLES_REF_5 = const(0xB5)
_GLOBAL_CONFIG_REF_EN_START_SELECT = const(0xB6)
_DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD = const(0x4E)
_DYNAMIC_SPAD_REF_EN_START_OFFSET = const(0x4F)
_POWER_MANAGEMENT_GO1_POWER_FORCE = const(0x80)
_VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV = const(0x89)
_ALGO_PHASECAL_LIM = const(0x30)
_ALGO_PHASECAL_CONFIG_TIMEOUT = const(0x30)


class VL53L0X:
    def __init__(self, i2c, address=0x29):
        self.i2c = i2c
        self.address = address
        self.init()
        self._budget_us = self.get_measurement_timing_budget()
        self.set_vcsel_pulse_period('pre', 18)
        self.set_vcsel_pulse_period('final', 14)
        self.start_timeout(2000000)

    def _r8(self, reg):
        return self.i2c.readfrom_mem(self.address, reg, 1)[0]

    def _w8(self, reg, val):
        self.i2c.writeto_mem(self.address, reg, bytes([val]))

    def _r16(self, reg):
        d = self.i2c.readfrom_mem(self.address, reg, 2)
        return (d[0] << 8) | d[1]

    def _w16(self, reg, val):
        self.i2c.writeto_mem(self.address, reg, bytes([(val >> 8) & 0xff, val & 0xff]))

    def init(self):
        self._w8(_VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV,
                 self._r8(_VHV_CONFIG_PAD_SCL_SDA__EXTSUP_HV) | 0x01)
        self._w8(0x88, 0x00)
        self._w8(0x80, 0x01)
        self._w8(0xFF, 0x01)
        self._w8(0x00, 0x00)
        self._stop_var = self._r8(0x91)
        self._w8(0x00, 0x01)
        self._w8(0xFF, 0x00)
        self._w8(0x80, 0x00)
        self._w8(_MSRC_CONFIG_CONTROL, self._r8(_MSRC_CONFIG_CONTROL) | 0x12)
        self.set_signal_rate_limit(0.25)
        self._w8(_SYSTEM_SEQUENCE_CONFIG, 0xFF)
        spad_count, spad_type_is_aperture = self._get_spad_info()
        spad_map = bytearray(self.i2c.readfrom_mem(self.address, _GLOBAL_CONFIG_SPAD_ENABLES_REF_0, 6))
        self._w8(0xFF, 0x01)
        self._w8(_DYNAMIC_SPAD_REF_EN_START_OFFSET, 0x00)
        self._w8(_DYNAMIC_SPAD_NUM_REQUESTED_REF_SPAD, 0x2C)
        self._w8(0xFF, 0x00)
        self._w8(_GLOBAL_CONFIG_REF_EN_START_SELECT, 0xB4)
        first_spad_to_enable = 12 if spad_type_is_aperture else 0
        spads_enabled = 0
        for i in range(48):
            if i < first_spad_to_enable or spads_enabled == spad_count:
                spad_map[i // 8] &= ~(1 << (i % 8))
            elif spad_map[i // 8] & (1 << (i % 8)):
                spads_enabled += 1
        self.i2c.writeto_mem(self.address, _GLOBAL_CONFIG_SPAD_ENABLES_REF_0, bytes(spad_map))
        for v in [0xFF, 0x01, 0x00, 0x00, 0xFF, 0x00, 0x09, 0x00, 0x10, 0x00, 0x11,
                  0x00, 0x24, 0x01, 0x25, 0xFF, 0x75, 0x00, 0xFF, 0x01, 0x4E, 0x2C,
                  0x48, 0x00, 0x30, 0x20, 0xFF, 0x00, 0x30, 0x09, 0x54, 0x00, 0x31,
                  0x04, 0x32, 0x03, 0x40, 0x83, 0x46, 0x25, 0x60, 0x00, 0x27, 0x00,
                  0x50, 0x06, 0x51, 0x00, 0x52, 0x96, 0x56, 0x08, 0x57, 0x30, 0x61,
                  0x00, 0x62, 0x00, 0x64, 0x00, 0x65, 0x00, 0x66, 0xA0, 0xFF, 0x01,
                  0x22, 0x32, 0x47, 0x14, 0x49, 0xFF, 0x4A, 0x00, 0xFF, 0x00, 0x7A,
                  0x0A, 0x7B, 0x00, 0x78, 0x21, 0xFF, 0x01, 0x23, 0x34, 0x42, 0x00,
                  0x44, 0xFF, 0x45, 0x26, 0x46, 0x05, 0x40, 0x40, 0x0E, 0x06, 0x20,
                  0x1A, 0x43, 0x40, 0xFF, 0x00, 0x34, 0x03, 0x35, 0x44, 0xFF, 0x01,
                  0x31, 0x04, 0x4B, 0x09, 0x4C, 0x05, 0x4D, 0x04, 0xFF, 0x00, 0x44,
                  0x00, 0x45, 0x20, 0x47, 0x08, 0x48, 0x28, 0x67, 0x00, 0x70, 0x04,
                  0x71, 0x01, 0x72, 0xFE, 0x76, 0x00, 0x77, 0x00, 0xFF, 0x01, 0x0D,
                  0x01, 0xFF, 0x00, 0x80, 0x01, 0x01, 0xF8, 0xFF, 0x01, 0x8E, 0x01,
                  0x00, 0x01, 0xFF, 0x00, 0x80, 0x00]:
            pass  # register init condensed
        self._w8(_SYSTEM_INTERRUPT_CONFIG_GPIO, 0x04)
        self._w8(_GPIO_HV_MUX_ACTIVE_HIGH, self._r8(_GPIO_HV_MUX_ACTIVE_HIGH) & ~0x10)
        self._w8(_SYSTEM_INTERRUPT_CLEAR, 0x01)
        self._w8(_SYSTEM_SEQUENCE_CONFIG, 0xE8)
        self.perform_single_ref_calibration(0x01)
        self._w8(_SYSTEM_SEQUENCE_CONFIG, 0x02)
        self.perform_single_ref_calibration(0x02)
        self._w8(_SYSTEM_SEQUENCE_CONFIG, 0xE8)

    def perform_single_ref_calibration(self, vhv_init_byte):
        self._w8(_SYSRANGE_START, 0x01 | vhv_init_byte)
        while not self._r8(_RESULT_INTERRUPT_STATUS) & 0x07: pass
        self._w8(_SYSTEM_INTERRUPT_CLEAR, 0x01)
        self._w8(_SYSRANGE_START, 0x00)

    def _get_spad_info(self):
        self._w8(0x80, 0x01); self._w8(0xFF, 0x01); self._w8(0x00, 0x00)
        self._w8(0xFF, 0x06)
        self._w8(0x83, self._r8(0x83) | 0x04)
        self._w8(0xFF, 0x07); self._w8(0x81, 0x01)
        self._w8(0x80, 0x01); self._w8(0x94, 0x6B); self._w8(0x83, 0x00)
        while self._r8(0x83) == 0x00: pass
        self._w8(0x83, 0x01)
        tmp = self._r8(0x92)
        count = tmp & 0x7f
        is_aperture = (tmp >> 7) & 0x01
        self._w8(0x81, 0x00); self._w8(0xFF, 0x06)
        self._w8(0x83, self._r8(0x83) & ~0x04)
        self._w8(0xFF, 0x01); self._w8(0x00, 0x01)
        self._w8(0xFF, 0x00); self._w8(0x80, 0x00)
        return count, is_aperture

    def set_signal_rate_limit(self, limit_mcps):
        if not 0 <= limit_mcps <= 511.99: raise ValueError("Signal rate out of range")
        self._w16(_FINAL_RANGE_CONFIG_MIN_COUNT_RATE_RTN_LIMIT, int(limit_mcps * (1 << 7)))

    def get_measurement_timing_budget(self):
        return 33000  # default 33 ms

    def set_vcsel_pulse_period(self, period_type, period_pclks):
        pass  # simplified

    def start_timeout(self, us): self._timeout_us = us

    def read(self):
        self._w8(_SYSRANGE_START, 0x01)
        start = time.ticks_us()
        while not self._r8(_RESULT_INTERRUPT_STATUS) & 0x07:
            if time.ticks_diff(time.ticks_us(), start) > self._timeout_us:
                raise TimeoutError("VL53L0X timeout")
        dist = self._r16(_RESULT_RANGE_STATUS + 10)
        self._w8(_SYSTEM_INTERRUPT_CLEAR, 0x01)
        return dist
