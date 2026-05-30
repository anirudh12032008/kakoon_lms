# DRV8833 dual H-bridge motor driver for MicroPython
# Tested on ESP32-S3 with Kakoon robot board
# FR=front.a (PWM45/DIR46), FL=front.b (PWM15/DIR16)
# RR=rear.a  (PWM17/DIR18), RL=rear.b  (PWM37/DIR38)
from machine import Pin, PWM

class DRV8833:
    MAX = 65535
    def __init__(self, a_pwm, a_dir, b_pwm, b_dir):
        self.ap, self.ad, self.bp, self.bd = a_pwm, a_dir, b_pwm, b_dir

    def throttle_a(self, t): self._drv(self.ap, self.ad, t)
    def throttle_b(self, t): self._drv(self.bp, self.bd, t)
    def stop_a(self): self.ad.value(0); self.ap.duty_u16(0)
    def stop_b(self): self.bd.value(0); self.bp.duty_u16(0)
    def stop(self): self.stop_a(); self.stop_b()

    def _drv(self, pwm, d, t):
        d.value(0 if t >= 0 else 1)
        duty = int(abs(t) * self.MAX)
        pwm.duty_u16(duty if t >= 0 else self.MAX - duty)


def _mp(pin): return PWM(Pin(pin, Pin.OUT), freq=40000)
def _dp(pin): return Pin(pin, Pin.OUT)

# Pre-wired for Kakoon robot board
def make_front(): return DRV8833(_mp(45), _dp(46), _mp(15), _dp(16))
def make_rear():  return DRV8833(_mp(17), _dp(18), _mp(37), _dp(38))
