# DRV8833 dual H-bridge motor driver for MicroPython
# Tested on ESP32-S3 with Kokoon robot board
# FR=front.a (PWM45/DIR46), FL=front.b (PWM15/DIR16)
# RR=rear.a  (PWM17/DIR18), RL=rear.b  (PWM37/DIR38)
from machine import Pin, PWM  # pyright: ignore[reportMissingImports]
from time import sleep


class DRV8833:
    MAX = 65535

    def __init__(self, a_pwm, a_dir, b_pwm, b_dir):
        self.ap = a_pwm
        self.ad = a_dir
        self.bp = b_pwm
        self.bd = b_dir

    def throttle_a(self, t):
        self._drv(self.ap, self.ad, t)

    def throttle_b(self, t):
        self._drv(self.bp, self.bd, t)

    def stop_a(self):
        self.ad.value(0)
        self.ap.duty_u16(0)

    def stop_b(self):
        self.bd.value(0)
        self.bp.duty_u16(0)

    def stop(self):
        self.stop_a()
        self.stop_b()

    def _drv(self, pwm, d, t):
        d.value(0 if t >= 0 else 1)
        duty = int(abs(t) * self.MAX)
        pwm.duty_u16(duty if t >= 0 else self.MAX - duty)


def _mp(pin):
    return PWM(Pin(pin, Pin.OUT), freq=40000)


def _dp(pin):
    return Pin(pin, Pin.OUT)


# Front motor driver
front = DRV8833(
    _mp(45), _dp(46),   # Motor A
    _mp(15), _dp(16)    # Motor B
)


# Rear motor driver
rear = DRV8833(
    _mp(17), _dp(18),   # Motor A
    _mp(37), _dp(38)    # Motor B
)


def test_motors():
    motors = [
        ("FR", front.throttle_a, front.stop_a),
        ("FL", front.throttle_b, front.stop_b),
        ("RR", rear.throttle_a, rear.stop_a),
        ("RL", rear.throttle_b, rear.stop_b),
    ]

    for name, run, stop in motors:
        print(name, "forward")
        run(1.0)
        sleep(1)
        stop()
        sleep(0.5)

        print(name, "reverse")
        run(-1.0)
        sleep(1)
        stop()
        sleep(0.5)

    print("Motor test complete")
