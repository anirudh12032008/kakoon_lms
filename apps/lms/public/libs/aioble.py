# aioble - Async BLE for MicroPython (simplified stub)
# Full version: https://github.com/micropython/micropython-lib/tree/master/micropython/bluetooth/aioble
import bluetooth
import asyncio

_IRQ_CENTRAL_CONNECT    = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE        = const(3)
_IRQ_GATTS_READ_REQUEST = const(4)

_FLAG_READ  = const(0x0002)
_FLAG_WRITE = const(0x0008)
_FLAG_NOTIFY= const(0x0010)
_FLAG_INDICATE=const(0x0020)

ble = bluetooth.BLE()

class Service:
    def __init__(self, uuid):
        self.uuid = bluetooth.UUID(uuid) if isinstance(uuid, (str, int)) else uuid
        self.characteristics = []

class Characteristic:
    def __init__(self, uuid, flags=_FLAG_READ|_FLAG_WRITE):
        self.uuid = bluetooth.UUID(uuid) if isinstance(uuid, (str, int)) else uuid
        self.flags = flags
        self._handle = None

    def write(self, data, send_update=False):
        if self._handle:
            ble.gatts_write(self._handle, data)
            if send_update:
                ble.gatts_notify(0, self._handle)

    def read(self):
        if self._handle:
            return ble.gatts_read(self._handle)
        return b""

class Device:
    def __init__(self, addr_type, addr):
        self.addr_type = addr_type
        self.addr = addr

_connections = set()
_connected_event = asyncio.Event()
_disconnected_event = asyncio.Event()

def _irq_handler(event, data):
    if event == _IRQ_CENTRAL_CONNECT:
        conn_handle, addr_type, addr = data
        _connections.add(conn_handle)
        _connected_event.set()
    elif event == _IRQ_CENTRAL_DISCONNECT:
        conn_handle, addr_type, addr = data
        _connections.discard(conn_handle)
        _disconnected_event.set()

ble.irq(_irq_handler)

async def advertise(interval_us=500000, name=None, services=None, appearance=0, manufacturer=None):
    ble.active(True)
    payload = bytearray()
    if name:
        n = name.encode()
        payload += bytes([len(n) + 1, 0x09]) + n
    ble.gap_advertise(interval_us, adv_data=bytes(payload))
    _connected_event.clear()
    await _connected_event.wait()

async def sleep_ms(ms):
    await asyncio.sleep_ms(ms)

def register_services(*services):
    svc_list = []
    for svc in services:
        chars = []
        for ch in svc.characteristics:
            chars.append((ch.uuid, ch.flags))
        svc_list.append((svc.uuid, chars))
    handles = ble.gatts_register_services(svc_list)
    idx = 0
    for svc in services:
        for ch in svc.characteristics:
            ch._handle = handles[idx][0]
            idx += 1
