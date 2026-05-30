# HC-SR04 ultrasonic distance sensor for MicroPython
import machine, time

class HCSR04:
    """
    HC-SR04 ultrasonic distance sensor.
    trig and echo should be GPIO pin numbers.
    """
    def __init__(self, trigger_pin, echo_pin, echo_timeout_us=500*2*30):
        self.echo_timeout_us = echo_timeout_us
        self.trigger = machine.Pin(trigger_pin, mode=machine.Pin.OUT, pull=None)
        self.trigger.value(0)
        self.echo = machine.Pin(echo_pin, mode=machine.Pin.IN, pull=None)

    def _send_pulse_and_wait(self):
        self.trigger.value(0)
        time.sleep_us(5)
        self.trigger.value(1)
        time.sleep_us(10)
        self.trigger.value(0)
        try:
            pulse_time = machine.time_pulse_us(self.echo, 1, self.echo_timeout_us)
            return pulse_time
        except OSError as ex:
            if ex.args[0] == 110:
                raise OSError('Out of range')
            raise ex

    def distance_mm(self):
        pulse_time = self._send_pulse_and_wait()
        mm = pulse_time * 100 // 582
        return mm

    def distance_cm(self):
        pulse_time = self._send_pulse_and_wait()
        cms = (pulse_time / 2) / 29.1
        return cms
