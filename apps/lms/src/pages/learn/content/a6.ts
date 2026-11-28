import type { ModuleContent } from "../model/curriculum";

/**
 * Module a6: Embedded Linux and single-board computers.
 * Written against Raspberry Pi OS based on Debian 13 "Trixie" (the current
 * release in late 2026) on a Raspberry Pi 5 or 4. Code uses String.raw.
 */
const lessons: ModuleContent = {
  "a6-linux-essentials-headless-pi": {
    id: "a6-linux-essentials-headless-pi",
    outcomes: [
      "Explain when a robot needs a Linux computer as well as a microcontroller",
      "Set up a Raspberry Pi headless with Raspberry Pi Imager and log in over SSH",
      "Navigate the Linux file system, manage processes, permissions and packages from the shell",
      "Write a systemd service that starts your program at boot and restarts it if it crashes",
    ],
    blocks: [
      { t: "h", text: "When a microcontroller is not enough" },
      { t: "p", text: "An ESP32 is superb at reading a sensor every millisecond and driving a motor without missing a beat. It is poor at running a camera pipeline, a neural network, a web server with TLS, a database, or the ROS 2 software stack. Those jobs need hundreds of megabytes of RAM, a memory management unit, a real file system and a full network stack: in other words, an operating system. A **single-board computer** (SBC) such as the Raspberry Pi gives you that for the price of a few sensors. Nearly every serious robot, from a delivery robot to a drone, has both: a Linux computer for thinking and a microcontroller for timing." },
      { t: "table", head: ["", "ESP32 (microcontroller)", "Raspberry Pi 5 (SBC)"], rows: [
        ["CPU", "2 × Xtensa LX6, 240 MHz", "4 × Arm Cortex-A76, 2.4 GHz"],
        ["RAM", "520 KB SRAM", "1 GB to 16 GB LPDDR4X"],
        ["Storage", "4 MB flash", "microSD, USB or NVMe SSD"],
        ["Boot time", "under 1 s", "about 10 to 30 s"],
        ["Timing", "deterministic to microseconds", "milliseconds, with occasional longer stalls"],
        ["Power", "about 0.1 to 0.5 W", "about 3 to 12 W"],
      ], caption: "Typical figures. The point is the shape of the trade-off, not the exact numbers." },
      { t: "p", text: "This module uses the **Raspberry Pi 5** (the Pi 4 works for everything here except where noted) running **Raspberry Pi OS**, the official Debian-based distribution. As of late 2026 the current release is based on **Debian 13 \"Trixie\"**; the previous release was Debian 12 \"Bookworm\". Use the 64-bit Lite image for robots: it has no desktop, boots faster and leaves more RAM for your programs." },

      { t: "h", text: "Headless setup with Raspberry Pi Imager" },
      { t: "p", text: "**Headless** means no monitor or keyboard: you reach the Pi over the network. Raspberry Pi Imager (for Windows, macOS and Linux) writes the OS image to a microSD card and, crucially, lets you preconfigure it before first boot." },
      { t: "list", ordered: true, items: [
        "Choose the device (Raspberry Pi 5), the OS (Raspberry Pi OS Lite, 64-bit) and the storage (your card; it will be erased).",
        "In the customisation step, set a **hostname** (for example `robot01`), a **username and password**, your **Wi-Fi network and country**, and the time zone.",
        "Enable **SSH**, and preferably choose public-key authentication and paste your laptop's public key. Then no password ever crosses the network.",
        "Write the card, put it in the Pi, power it, and wait a minute. From your laptop on the same network, run `ssh you@robot01.local`.",
      ] },
      { t: "p", text: "The `.local` name works through **mDNS** (the `avahi-daemon` service on the Pi). Campus networks often block mDNS between clients, so if the name does not resolve, find the Pi's IP address from your router or hotspot's client list and use `ssh you@192.168.1.42` instead. A phone hotspot that both laptop and Pi join is the most reliable lab setup." },
      { t: "snippet", lang: "bash", code: String.raw`# On your laptop: create a key once (press Enter for the defaults)
ssh-keygen -t ed25519
# Copy it to the Pi if you did not paste it into Imager
ssh-copy-id you@robot01.local
# Log in; then copy files both ways
ssh you@robot01.local
scp sensor.py you@robot01.local:~/
scp you@robot01.local:~/log.csv .`, caption: "Key-based SSH and file copy." },

      { t: "h", text: "The shell and the file system" },
      { t: "p", text: "Once logged in you are talking to **bash**, a shell: a program that reads a command line, runs programs and connects their inputs and outputs. Everything in Linux is organised as one tree starting at `/`, the root. There are no drive letters; a USB stick appears as a directory under `/media` or wherever you mount it. The **Filesystem Hierarchy Standard** says what lives where, and knowing it saves you from searching:" },
      { t: "table", head: ["Path", "What lives there"], rows: [
        ["/home/you", "Your files; `~` is shorthand for it"],
        ["/etc", "System-wide configuration as text files"],
        ["/usr/bin, /usr/lib", "Installed programs and libraries (managed by apt)"],
        ["/usr/local", "Software you build and install yourself"],
        ["/opt", "Large self-contained add-on packages"],
        ["/var/log", "Log files; most logs now go to the systemd journal"],
        ["/dev", "Device files: /dev/i2c-1, /dev/ttyACM0, /dev/gpiochip0"],
        ["/sys, /proc", "Virtual files exposing kernel and process state"],
        ["/boot/firmware", "Boot partition: config.txt, cmdline.txt, device tree files"],
        ["/tmp", "Temporary files, cleared at boot"],
      ] },
      { t: "p", text: "The everyday commands: `pwd` (where am I), `ls -l` (list with details), `cd`, `mkdir -p`, `cp`, `mv`, `rm` (no recycle bin: deleted is gone), `cat` and `less` to read files, `nano` to edit them, `grep` to search text, `find` to search for files. The pipe `|` sends one program's output into the next: `dmesg | grep -i usb` shows only the kernel messages about USB. `>` writes output to a file and `>>` appends." },

      { t: "h", text: "Users, permissions and sudo" },
      { t: "p", text: "Every file has an owner, a group, and three sets of permissions: for the owner, the group, and everyone else. Each set says whether you may **r**ead, **w**rite or e**x**ecute. `ls -l` shows them as a string like `-rwxr-xr--`. The same permissions written in octal are 754: r = 4, w = 2, x = 1, added per set, so owner 4+2+1 = 7, group 4+1 = 5, others 4." },
      { t: "formula", text: String.raw`-rwxr-xr--   1 you  you   812  sensor.py
 │└┬┘└┬┘└┬┘
 │ │  │  └── others: r--  = 4
 │ │  └───── group:  r-x  = 4+1 = 5
 │ └──────── owner:  rwx  = 4+2+1 = 7
 └────────── file type (- file, d directory, c character device)`, caption: "chmod 754 sensor.py produces exactly this." },
      { t: "p", text: "Hardware access is controlled the same way. `/dev/i2c-1` belongs to group `i2c`, serial ports to `dialout`, GPIO chips to `gpio`, and cameras to `video`. The default user created by Imager is already in these groups, which is why your programs can use hardware without root. A new user needs `sudo usermod -aG dialout,i2c,gpio,video newuser` and a fresh login. `sudo` runs one command as root; use it for system changes, never as a reflex to make a permission error go away, because a program run as root that has a bug can damage the whole system." },

      { t: "h", text: "Processes" },
      { t: "p", text: "A running program is a **process** with a numeric **PID**. `ps aux` lists them all; `htop` shows them live with CPU and memory use; `pgrep -a python` finds yours. You stop one with `kill PID`, which sends the signal SIGTERM and lets the program tidy up; `kill -9 PID` sends SIGKILL, which cannot be caught. Press Ctrl+C to send SIGINT to the program in the foreground. A well-written robot program catches SIGTERM and SIGINT, stops the motors, and exits, because that is exactly what systemd sends at shutdown." },

      { t: "h", text: "Packages with apt" },
      { t: "p", text: "Software on Raspberry Pi OS comes as Debian packages from signed repositories. `sudo apt update` refreshes the list of what is available; `sudo apt full-upgrade` installs newer versions of everything; `sudo apt install i2c-tools python3-serial` installs packages and their dependencies. Prefer the apt package for a Python library (`python3-xyz`) when it exists. For anything else use a **virtual environment** (`python3 -m venv --system-site-packages ~/venv`), because Trixie, like Bookworm, refuses `pip install` into the system Python to stop pip and apt fighting over the same files." },

      { t: "h", text: "Networking essentials" },
      { t: "p", text: "Raspberry Pi OS manages networks with **NetworkManager**. `nmcli device status` lists interfaces (`wlan0`, `eth0`), `nmcli device wifi list` scans, and `sudo nmcli device wifi connect \"LabNet\" password \"...\"` joins a network and remembers it. `ip -br addr` shows addresses; `ping -c 3 8.8.8.8` tests reachability; `ss -tlnp` shows which programs are listening on which TCP ports. To find a device's IP from the Pi itself, `hostname -I`." },

      { t: "h", text: "Services with systemd" },
      { t: "p", text: "A robot must start its software by itself when powered, and restart it if it crashes. On modern Linux that is the job of **systemd**, the first process (PID 1). You describe your program in a **unit file**, and systemd does the rest: ordering, restarting and logging." },
      { t: "snippet", lang: "text", code: String.raw`# /etc/systemd/system/robot-bridge.service
[Unit]
Description=Robot serial bridge
After=network-online.target
Wants=network-online.target

[Service]
User=you
WorkingDirectory=/home/you/robot
ExecStart=/usr/bin/python3 /home/you/robot/link.py /dev/ttyACM0
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target`, caption: "A minimal service unit. Replace `you` with your username." },
      { t: "snippet", lang: "bash", code: String.raw`sudo systemctl daemon-reload              # re-read unit files after editing
sudo systemctl enable --now robot-bridge   # start now and at every boot
systemctl status robot-bridge              # running? last log lines
journalctl -u robot-bridge -f              # follow its output live
sudo systemctl restart robot-bridge
sudo systemctl disable robot-bridge        # stop starting at boot`, caption: "Managing the service." },
      { t: "p", text: "Anything your program prints to standard output lands in the **journal**, so `print()` is your logging until you need more. `Restart=on-failure` restarts the program if it exits with an error or is killed by a signal, after waiting `RestartSec` seconds." },
      { t: "note", kind: "tip", text: "Shut a Pi down with `sudo poweroff` and wait for the green activity LED to stop before pulling power. Cutting power during a write can corrupt the SD card; lesson 4 shows how to make the system survive it anyway." },

      { t: "deep", title: "What happens between power-on and your service starting", blocks: [
        { t: "p", text: "A Pi does not boot like a PC. On the Pi 4 and Pi 5, a bootloader stored in an on-board EEPROM runs first. It reads `config.txt` from the FAT boot partition (mounted at `/boot/firmware` once Linux is up), loads the kernel image and the **device tree blob** for the board, applies any overlays listed in `config.txt`, and jumps to the kernel with the command line from `cmdline.txt`." },
        { t: "p", text: "The kernel initialises drivers for the hardware the device tree describes, mounts the root file system (the ext4 partition on the card) and starts `/sbin/init`, which is systemd. systemd reads the unit files, builds a dependency graph, and starts units in parallel as their dependencies are satisfied, until it reaches `multi-user.target`. Your service, with `WantedBy=multi-user.target`, is started on the way there. `systemd-analyze blame` lists how long each unit took, and `systemd-analyze critical-chain robot-bridge.service` shows what your service waited for." },
        { t: "p", text: "`network-online.target` deserves care. It waits until the network is configured, which on Wi-Fi can take ten seconds or more, or never if there is no network. A robot that must drive without Wi-Fi should not depend on it; let the program retry its network connection itself instead." },
      ] },
      { t: "deep", title: "Hardening SSH on a robot that leaves the lab", blocks: [
        { t: "p", text: "A robot on a shared network with a guessable password is a computer anyone can take over. Once key login works, turn password login off: create `/etc/ssh/sshd_config.d/10-keys-only.conf` containing `PasswordAuthentication no`, then `sudo systemctl restart ssh`. Keep a second SSH session open while you do this, so a mistake does not lock you out." },
        { t: "p", text: "Keep the system patched with `sudo apt update && sudo apt full-upgrade` before demonstrations, not during them. Give each robot a distinct hostname so two Pis on one network do not both answer to `raspberrypi.local`. For fleets, professionals avoid logging into robots at all: the image is built reproducibly (lesson 4) and changes are deployed, never typed." },
      ] },
    ],
    mistakes: [
      "**Using a 32-bit image or the desktop image on a robot.** Use 64-bit Lite; ROS 2 and most modern libraries target 64-bit Arm.",
      "**Running everything with sudo.** It hides permission problems instead of fixing them. Add the user to the right group (`dialout`, `i2c`, `gpio`, `video`).",
      "**Forgetting `systemctl daemon-reload`** after editing a unit file, then wondering why the change has no effect.",
      "**Relying on `robot.local` on a campus network** that blocks mDNS. Have a fallback: the IP address, or a phone hotspot.",
      "**Pulling the power while the card is being written.** Use `sudo poweroff`, or make the root file system read-only.",
      "**Using `pip install` into the system Python** and fighting the externally-managed-environment error with `--break-system-packages`. Use apt packages or a venv.",
    ],
    practice: {
      kind: "bench",
      task: "Bring up a Pi headless and run a script as a service.",
      steps: [
        "Flash Raspberry Pi OS Lite 64-bit with Imager, setting hostname, user, Wi-Fi and SSH with your public key.",
        "Log in over SSH. Run `uname -a`, `cat /etc/os-release`, `free -h` and `df -h`, and note the kernel version, Debian release name, RAM and free space.",
        "Write a Python script that appends the CPU temperature (`vcgencmd measure_temp`, or read `/sys/class/thermal/thermal_zone0/temp` and divide by 1000) and the time to a CSV file every 5 seconds.",
        "Create a systemd unit for it, enable it, reboot with `sudo reboot`, and confirm with `systemctl status` and `journalctl -u` that it started by itself.",
        "Kill the process with `kill -9` and confirm systemd restarts it within RestartSec.",
      ],
    },
    quiz: [
      {
        q: "A file shows permissions `-rw-r-----`. What is the octal mode?",
        options: ["644", "640", "750", "600"],
        answer: 1,
        why: "Owner rw- = 4+2 = 6, group r-- = 4, others --- = 0, so 640.",
      },
      {
        q: "Your program can open `/dev/ttyACM0` with sudo but not without it. What is the correct fix?",
        options: [
          "Run the program as root from now on",
          "Change the device to mode 777 with chmod",
          "Add your user to the `dialout` group and log in again",
          "Reinstall pyserial",
        ],
        answer: 2,
        why: "Serial devices belong to group dialout. Group membership gives access without root, and it survives reboots; a chmod on /dev is lost at the next boot.",
      },
      {
        q: "Which unit file setting makes systemd start your service again after it crashes?",
        options: ["WantedBy=multi-user.target", "After=network-online.target", "ExecStart=", "Restart=on-failure"],
        answer: 3,
        why: "Restart=on-failure restarts the service when it exits with an error or is killed by a signal. WantedBy controls starting at boot.",
      },
      {
        q: "Which job should go to the microcontroller rather than the Raspberry Pi?",
        options: [
          "Generating a 20 kHz PWM signal and counting encoder pulses without ever missing one",
          "Running a camera-based object detector",
          "Serving a web dashboard",
          "Recording data to a database",
        ],
        answer: 0,
        why: "Linux scheduling gives millisecond timing with occasional longer stalls. Hard real-time work such as PWM and pulse counting belongs on a microcontroller.",
      },
      {
        q: "`ssh you@robot01.local` fails with 'could not resolve hostname', but the Pi's LED shows it booted. What is the most likely cause on a campus network?",
        options: [
          "SSH was not enabled",
          "mDNS traffic between clients is blocked, so the .local name cannot be resolved; use the IP address",
          "The SD card is corrupt",
          "The username is wrong",
        ],
        answer: 1,
        why: "'Could not resolve hostname' is a name lookup failure, before SSH is even tried. .local names rely on mDNS, which many managed networks block.",
      },
    ],
  },

  "a6-hardware-from-user-space": {
    id: "a6-hardware-from-user-space",
    outcomes: [
      "Drive GPIO on a Pi 5 or Pi 4 with gpiozero and libgpiod, and explain why RPi.GPIO and sysfs are obsolete",
      "Enable I2C, SPI, UART and a camera with raspi-config or config.txt overlays, and test each from the shell",
      "Describe what the device tree does and how an overlay changes it",
      "Write hardware programs in Python and C++ on Linux and outline how cross-compiling works",
    ],
    blocks: [
      { t: "h", text: "Why hardware on Linux feels different" },
      { t: "p", text: "On a microcontroller your program owns the chip: you write to a register and a pin changes. On Linux, the hardware belongs to the **kernel**. Your program runs in **user space**, with no direct access to registers, and asks the kernel to act through **device files** in `/dev` and system calls such as `open`, `read`, `write` and `ioctl`. This feels indirect, but it brings real benefits: several programs can share a bus safely, permissions control who may touch which pin, and a crash in your program cannot hang the I2C bus for everyone." },
      { t: "p", text: "The kernel learns what hardware exists from the **device tree**, a data structure loaded at boot that says, in effect, \"there is an I2C controller at this address, with these pins, at 100 kHz\". You rarely edit it directly. Instead you switch on **overlays**, small patches to the tree, from `config.txt` or with `raspi-config`." },

      { t: "h", text: "GPIO: the modern way" },
      { t: "p", text: "Many tutorials online use the `RPi.GPIO` library or write to files under `/sys/class/gpio`. Both are obsolete. The sysfs GPIO interface is deprecated in the Linux kernel, and RPi.GPIO pokes the processor's GPIO registers directly, which cannot work on the **Pi 5**: its 40-pin header is not wired to the main processor at all but to **RP1**, a separate input/output chip designed by Raspberry Pi and connected over PCI Express. The supported interface on every model is the kernel's **GPIO character device**, `/dev/gpiochipN`, used through **libgpiod** (version 2 on current Raspberry Pi OS)." },
      { t: "diagram", text: String.raw`
 Your program (Python / C++)
   │  gpiozero  ── high-level: LED, Button, Motor, PWMOutputDevice
   │     └── uses lgpio as its pin factory on Pi OS
   │  gpiod (libgpiod v2) ── low-level: request lines, set values, wait for edges
   ▼
 /dev/gpiochip0  (Pi 5: "pinctrl-rp1", the 40-pin header)
   ▼
 Linux kernel GPIO driver  ──►  RP1 (Pi 5)  or  BCM2711 GPIO block (Pi 4)`, caption: "The GPIO stack on current Raspberry Pi OS." },
      { t: "p", text: "Run `gpiodetect` (from the `gpiod` package) to list chips and `gpioinfo` to list every line with its name and current user. On a Pi 5 with current Raspberry Pi OS, the header is `gpiochip0`, labelled `pinctrl-rp1`; some older guides say `gpiochip4`, which was the numbering on early Pi 5 kernels and is kept as a compatibility link. On a Pi 4 the header is also `gpiochip0`. GPIO numbers in software are the **BCM numbers** (GPIO 17 is physical pin 11), not the physical pin positions." },
      { t: "snippet", lang: "python", code: String.raw`#!/usr/bin/env python3
"""Blink an LED on GPIO 17 and react to a button on GPIO 27 (BCM numbers)."""
from signal import pause
from gpiozero import LED, Button

led = LED(17)                      # LED + 330 ohm resistor from GPIO 17 to GND
button = Button(27, bounce_time=0.02)   # button from GPIO 27 to GND; internal pull-up on

button.when_pressed = led.toggle
led.blink(on_time=0.2, off_time=0.8, n=5)
pause()                            # keep running; callbacks do the work`, caption: "gpiozero: the shortest correct way. It is preinstalled on Raspberry Pi OS." },
      { t: "snippet", lang: "python", code: String.raw`#!/usr/bin/env python3
"""The same LED with libgpiod v2 Python bindings (apt install python3-libgpiod)."""
import time
import gpiod
from gpiod.line import Direction, Value

LINE = 17
settings = gpiod.LineSettings(direction=Direction.OUTPUT, output_value=Value.INACTIVE)

with gpiod.request_lines("/dev/gpiochip0", consumer="blink",
                         config={LINE: settings}) as request:
    for _ in range(10):
        request.set_value(LINE, Value.ACTIVE)
        time.sleep(0.25)
        request.set_value(LINE, Value.INACTIVE)
        time.sleep(0.25)`, caption: "libgpiod: lower level, the same model as in C and C++. While the request is held, `gpioinfo` shows line 17 in use by \"blink\"." },
      { t: "note", kind: "safety", text: "The Pi's GPIO pins are 3.3 V and are **not** 5 V tolerant. A 5 V signal from an Arduino Uno's TX pin or a 5 V sensor will damage the Pi. Use a level shifter or a resistor divider, or link the boards over USB. Each pin should supply no more than a few milliamps; drive motors and relays through a transistor or driver." },

      { t: "h", text: "Enabling buses: raspi-config and config.txt" },
      { t: "p", text: "I2C, SPI and the header UART are off by default. `sudo raspi-config`, under Interface Options, switches each on and writes the corresponding line to `/boot/firmware/config.txt`. You can also edit that file directly and reboot:" },
      { t: "snippet", lang: "text", code: String.raw`# /boot/firmware/config.txt (excerpt). Comments must be on their own lines.
# I2C1 on GPIO 2 (SDA) and GPIO 3 (SCL) -> /dev/i2c-1
dtparam=i2c_arm=on
# SPI0 on GPIO 10, 9, 11 with CE0 = GPIO 8, CE1 = GPIO 7 -> /dev/spidev0.0, 0.1
dtparam=spi=on
# Header UART on GPIO 14 (TX) and GPIO 15 (RX)
# Pi 4: enable_uart=1 -> /dev/serial0.  Pi 5: the line below -> /dev/ttyAMA0
dtparam=uart0=on
# example overlay: tell the kernel a DS3231 clock is on I2C
dtoverlay=i2c-rtc,ds3231
# camera_auto_detect=1 is on by default and finds official camera modules`, caption: "Lines beginning with dtparam and dtoverlay modify the device tree at boot." },
      { t: "p", text: "For the UART, raspi-config asks two questions: answer **No** to a login shell over serial and **Yes** to enabling the serial hardware, or the kernel console will chatter on the same pins your microcontroller is talking to. On a Pi 4, `/dev/serial0` is a stable alias for the header UART. On a Pi 5 it is not: `/dev/serial0` points at the separate three-pin debug UART connector (`/dev/ttyAMA10`), and the header UART on GPIO 14 and 15, enabled with `dtparam=uart0=on`, is `/dev/ttyAMA0`. Check with `pinctrl get 14-15`, which should show TXD0 and RXD0." },

      { t: "h", text: "Testing each bus from the shell" },
      { t: "p", text: "Always prove the hardware works with a known tool before you debug your own code. Install `i2c-tools` and run `i2cdetect -y 1`: it probes every 7-bit address on bus 1 and prints a grid. A BME280 shows up at `76` or `77`, an MPU-6050 at `68`, an SSD1306 display at `3c`. If the grid is empty, the problem is wiring or power, not software. `i2cget -y 1 0x76 0xd0` reads one register: on a BME280 the chip-ID register 0xD0 returns `0x60`." },
      { t: "snippet", lang: "bash", code: String.raw`sudo apt install i2c-tools python3-smbus2 python3-spidev python3-serial
i2cdetect -y 1                 # scan I2C bus 1
i2cget -y 1 0x76 0xd0          # BME280 chip id: expect 0x60
ls -l /dev/spidev* /dev/serial0 /dev/ttyAMA0
dmesg | tail                   # kernel messages when you plug things in
rpicam-hello --list-cameras    # camera detected?
rpicam-still -o test.jpg       # take a photo from the shell`, caption: "First checks for each interface. The camera tools were called libcamera-* in older releases." },
      { t: "snippet", lang: "python", code: String.raw`#!/usr/bin/env python3
"""Read a BME280's chip id over I2C, and do a loopback test over SPI."""
from smbus2 import SMBus
import spidev

with SMBus(1) as bus:                         # /dev/i2c-1
    chip_id = bus.read_byte_data(0x76, 0xD0)
    print(f"BME280 chip id: 0x{chip_id:02x} (expect 0x60)")

spi = spidev.SpiDev()
spi.open(0, 0)                                # bus 0, chip select 0 -> /dev/spidev0.0
spi.max_speed_hz = 1_000_000
spi.mode = 0
reply = spi.xfer2([0xA5, 0x5A, 0x00])         # with MOSI wired to MISO, reply == sent
print("SPI loopback:", [hex(b) for b in reply])
spi.close()`, caption: "smbus2 for I2C registers, spidev for full-duplex SPI transfers." },
      { t: "p", text: "Cameras use **libcamera** underneath and **Picamera2** from Python. Picamera2 hands you frames as NumPy arrays, ready for OpenCV in the perception module." },
      { t: "snippet", lang: "python", code: String.raw`#!/usr/bin/env python3
from picamera2 import Picamera2

picam2 = Picamera2()
picam2.configure(picam2.create_still_configuration(main={"size": (1280, 720)}))
picam2.start()
frame = picam2.capture_array()      # NumPy array, height x width x channels
print("frame shape:", frame.shape)
picam2.capture_file("snap.jpg")
picam2.stop()`, caption: "Picamera2 is preinstalled on Raspberry Pi OS (package python3-picamera2)." },

      { t: "h", text: "Python and C++ on Linux" },
      { t: "p", text: "Python is the right first choice for glue: protocol bridges, logging, web dashboards, prototypes. It is slow per instruction, but most robot programs spend their time waiting for I/O, and libraries like NumPy and OpenCV do heavy work in compiled code. Reach for **C++** when a loop must run fast in your own code (image processing per pixel, a 1 kHz control loop), when memory is tight, or when you write ROS 2 components that must be efficient. On the Pi you compile natively: `sudo apt install build-essential cmake` and then `g++ -O2 -o app app.cpp`, or a CMake project as in the deep section. The kernel interfaces are the same from both languages; Python libraries are thin wrappers over the same `open` and `ioctl` calls shown below." },
      { t: "snippet", lang: "cpp", code: String.raw`// read_bme280_id.cpp: g++ -O2 -o read_id read_bme280_id.cpp
#include <cstdio>
#include <cstdint>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>

int main() {
  int fd = open("/dev/i2c-1", O_RDWR);
  if (fd < 0) { perror("open /dev/i2c-1"); return 1; }
  if (ioctl(fd, I2C_SLAVE, 0x76) < 0) { perror("I2C_SLAVE"); return 1; }
  uint8_t reg = 0xD0, id = 0;
  if (write(fd, &reg, 1) != 1 || read(fd, &id, 1) != 1) { perror("i2c transfer"); return 1; }
  std::printf("chip id 0x%02x\n", id);
  close(fd);
  return 0;
}`, caption: "The raw Linux I2C interface from C++: open the device, select the target address with ioctl, write the register number, read the value." },

      { t: "h", text: "Cross-compiling in outline" },
      { t: "p", text: "Compiling a large C++ project such as a ROS 2 workspace on a Pi takes many minutes and can run out of RAM. **Cross-compiling** means building on a fast x86 laptop for the Pi's 64-bit Arm architecture (`aarch64`). You need three things: a cross toolchain (`sudo apt install g++-aarch64-linux-gnu` on Ubuntu gives `aarch64-linux-gnu-g++`), a **sysroot** (a copy of the Pi's `/usr/include` and `/usr/lib`, so you link against exactly the library versions the Pi has), and a CMake toolchain file that points at both. The result is copied over with `scp` and runs natively. A simpler route that avoids sysroots is to build inside an Arm64 Docker container on the laptop (lesson 4), which emulates Arm with QEMU: slower than a true cross-compiler, but the output is guaranteed to match the target's libraries." },

      { t: "deep", title: "The device tree and overlays, from the inside", blocks: [
        { t: "p", text: "A PC discovers its hardware by asking: PCI and USB devices announce themselves. Most hardware in an SoC cannot be discovered, so the kernel must be told. The device tree source (`.dts`) is a tree of **nodes** with **properties**; it is compiled to a binary blob (`.dtb`) that the bootloader hands to the kernel. A driver declares which `compatible` strings it handles, and the kernel binds it to matching nodes." },
        { t: "snippet", lang: "text", code: String.raw`/dts-v1/;
/plugin/;
/ {
    compatible = "brcm,bcm2712";
    fragment@0 {
        target = <&i2c_arm>;
        __overlay__ {
            #address-cells = <1>;
            #size-cells = <0>;
            status = "okay";
            bme280@76 {
                compatible = "bosch,bme280";
                reg = <0x76>;
            };
        };
    };
};`, caption: "An overlay that tells the kernel a BME280 is at 0x76 on I2C1. The kernel's bmp280 driver then exposes it under /sys/bus/iio/devices." },
        { t: "p", text: "Compile with `dtc -@ -I dts -O dtb -o bme280.dtbo bme280.dts`, copy it to `/boot/firmware/overlays/` and add `dtoverlay=bme280` to config.txt. After reboot the kernel driver owns the chip: you read temperature from a file such as `in_temp_input` instead of speaking I2C yourself. This is the difference between **user-space drivers** (your code talks to the bus) and **kernel drivers** (the kernel talks to the chip and gives you values). Kernel drivers suit production; user-space access is quicker to develop and is what you will use most in this course. Note that once a kernel driver claims address 0x76, `i2cdetect` shows `UU` there and your user-space code can no longer use it." },
        { t: "p", text: "Ready-made overlays for dozens of chips already exist; `/boot/firmware/overlays/README` lists them with their parameters." },
      ] },
      { t: "deep", title: "A CMake cross-compilation toolchain file", blocks: [
        { t: "snippet", lang: "text", code: String.raw`# toolchain-aarch64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_C_COMPILER   aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
set(CMAKE_SYSROOT /home/you/pi-sysroot)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)   # run build tools from the host
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)    # but link only target libraries
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)`, caption: "Use with: cmake -B build -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake && cmake --build build" },
        { t: "p", text: "Fill the sysroot from the Pi with `rsync -aR you@robot01.local:/usr/include :/usr/lib ~/pi-sysroot/` (`-R` keeps the full paths, and on current Debian `/lib` is only a link into `/usr/lib`, so these two are usually enough). Symbolic links inside it that point to absolute paths must be made relative, or the linker follows them into your laptop's own libraries; the `symlinks -rc` tool fixes this. The most common failure is a library that exists on the laptop but not in the sysroot, which links fine and then fails on the Pi with a missing `.so` error. `file build/app` should report `ELF 64-bit LSB ... ARM aarch64`." },
      ] },
    ],
    mistakes: [
      "**Following an old tutorial that uses RPi.GPIO or /sys/class/gpio.** Neither works on a Pi 5. Use gpiozero or libgpiod.",
      "**Using physical pin numbers in code.** Software uses BCM GPIO numbers: physical pin 11 is GPIO 17.",
      "**Connecting a 5 V Arduino TX straight to the Pi's RX.** The Pi is 3.3 V only. Level-shift, or use USB.",
      "**Leaving the serial login console on the header UART**, so the kernel's messages corrupt your protocol.",
      "**Debugging your code before running `i2cdetect`.** If the device is not in the scan, no code will reach it.",
      "**Forgetting the reboot after changing config.txt.** Overlays are applied by the bootloader, only at boot.",
    ],
    practice: {
      kind: "bench",
      task: "Bring up GPIO, I2C and (if you have one) the camera on a Pi, first from the shell, then from Python.",
      steps: [
        "Run `gpiodetect` and `gpioinfo | head -40`. Write down which chip carries the header and what GPIO 17 is called.",
        "Wire an LED with a 330 Ω resistor to GPIO 17 (physical pin 11) and GND, and run both blink programs from the lesson. While the libgpiod one runs, check `gpioinfo` in a second SSH session.",
        "Enable I2C with raspi-config, reboot, connect an I2C sensor to 3.3 V, GND, GPIO 2 and GPIO 3, and confirm its address with `i2cdetect -y 1`.",
        "Read the sensor's ID register with `i2cget`, then with the Python smbus2 program, then compile and run the C++ program. All three must agree.",
        "If you have a camera, take a photo with `rpicam-still` and capture a frame with Picamera2, printing its shape.",
      ],
    },
    quiz: [
      {
        q: "Why does the RPi.GPIO library not work on a Raspberry Pi 5?",
        options: [
          "Because Python 3 is not supported on the Pi 5",
          "Because the Pi 5's header GPIO is on the RP1 chip, not the main processor's GPIO registers that RPi.GPIO writes to directly",
          "Because the Pi 5 has no GPIO pins",
          "Because the Pi 5 needs a 5 V supply",
        ],
        answer: 1,
        why: "RPi.GPIO accesses SoC registers directly. On the Pi 5 the header is driven by RP1 over PCIe, so only the kernel's GPIO character device (libgpiod, and gpiozero on top of lgpio) works.",
      },
      {
        q: "`i2cdetect -y 1` shows an empty grid with your sensor connected. What should you do first?",
        options: [
          "Rewrite your Python code with a different library",
          "Check power, ground and the SDA/SCL wiring, and that I2C is enabled",
          "Increase the I2C speed",
          "Install a kernel driver",
        ],
        answer: 1,
        why: "i2cdetect probes every address. If nothing answers, the fault is below your software: wiring, power or the interface being disabled.",
      },
      {
        q: "What is a device tree overlay?",
        options: [
          "A Python library for GPIO",
          "A patch to the hardware description the kernel reads at boot, enabling or describing hardware such as a bus or a chip",
          "A graphical layer drawn over the desktop",
          "A backup of the SD card",
        ],
        answer: 1,
        why: "The device tree tells the kernel what non-discoverable hardware exists. Overlays, listed in config.txt, modify it at boot.",
      },
      {
        q: "You want an Arduino Uno to talk to the Pi's header UART on GPIO 14 and 15. What is essential?",
        options: [
          "Nothing; connect TX to RX directly",
          "A level shifter or divider on the Uno's 5 V TX line into the Pi's 3.3 V RX, plus a common ground",
          "An I2C pull-up resistor",
          "A 12 V supply",
        ],
        answer: 1,
        why: "The Pi's pins are not 5 V tolerant, and serial needs a shared ground reference. Alternatively, link over USB and avoid the problem entirely.",
      },
      {
        q: "What does a sysroot provide when cross-compiling for the Pi?",
        options: [
          "A faster compiler",
          "Copies of the Pi's headers and libraries, so the program is compiled and linked against exactly what the Pi has",
          "Root access on the Pi",
          "An emulator for running Arm code",
        ],
        answer: 1,
        why: "The cross compiler produces Arm code, but it must link against the target's library versions, not the laptop's. The sysroot supplies them.",
      },
    ],
  },

  "a6-microcontroller-coprocessor-protocol": {
    id: "a6-microcontroller-coprocessor-protocol",
    outcomes: [
      "Divide a robot's work between a Linux computer and a real-time microcontroller",
      "Design a framed binary protocol with COBS framing, message types, sequence numbers and a CRC",
      "Implement both ends: Arduino C++ on the Uno or ESP32 and Python with pyserial on the Pi",
      "Describe SocketCAN and when CAN is the better link",
    ],
    blocks: [
      { t: "h", text: "Two computers, one robot" },
      { t: "p", text: "The previous lessons showed what Linux is good at. It is not good at time. The scheduler may pause your process for several milliseconds to run something else, a USB hiccup may delay a read, and garbage collection in Python can stall a loop. For a motor's PWM, an encoder's pulses or a balance controller at 500 Hz, that jitter is unacceptable. The standard architecture is a split: the **microcontroller** does everything with hard timing (PWM, encoders, the inner speed loop, emergency stop, watchdog) and the **Linux computer** does everything with heavy computation (planning, vision, networking, logging), and they talk over a serial link. The microcontroller must also be **safe on its own**: if the Pi stops sending commands, it stops the motors." },
      { t: "diagram", text: String.raw`
 ┌──────────── Raspberry Pi (Linux) ───────────┐        ┌──── ESP32 / Uno ────┐
 │ planner, vision, ROS 2, logging, web        │  UART  │ PWM, encoders,      │
 │   link.py: encode commands, decode reports  │◄──────►│ PID loop, e-stop,   │
 └─────────────────────────────────────────────┘  USB   │ command timeout     │
                                                         └─────────────────────┘
   commands down: set speed, set LED, ...          reports up: sensors, status, acks`, caption: "The usual split. The link carries small structured messages, not text." },

      { t: "h", text: "Why not just send text?" },
      { t: "p", text: "Beginners send lines like `L:1\\n` and parse them with string functions. That works on the bench and fails in the field, for four reasons. Text is **wasteful** (the number 1023 takes four bytes as text and two in binary). It is **ambiguous** to parse (what if a value contains the separator?). There is **no error detection**: a motor's electrical noise can flip a bit, turning `S:100` into `S:900`, and your robot obeys. And there is **no resynchronisation**: if you start listening mid-message, or a byte is lost, you may never find the start of the next one reliably. A proper protocol solves each of these with three parts: **framing**, a **message layout**, and an **integrity check**." },

      { t: "h", text: "Framing with COBS" },
      { t: "p", text: "Framing means marking where each message starts and ends in a continuous byte stream. The simplest marker is a special byte, 0x00, at the end of each frame. The problem is that 0x00 also appears in binary data (the number 256 is the bytes 0x00 0x01). **COBS** (Consistent Overhead Byte Stuffing) removes every zero from the data so that 0x00 can only ever mean \"end of frame\". It replaces each zero with a count: the distance to the next zero. The first byte of the encoded frame says how far it is to the first replaced zero." },
      { t: "formula", text: String.raw`raw:      11 22 00 33
split at zeros into blocks:   [11 22] 00 [33]
each block becomes: (length + 1) followed by its bytes
encoded:  03 11 22 02 33  then the delimiter 00

decode:   03 → copy 2 bytes (11 22), then insert a 00
          02 → copy 1 byte (33); end of data, so no 00 is added
result:   11 22 00 33   ✓`, caption: "COBS by hand. Overhead is at most one byte per 254 bytes of data, plus the delimiter." },
      { t: "p", text: "The receiver's job becomes trivial: collect bytes until 0x00, then decode what it collected. If it starts listening mid-frame, the first decode fails its check and is dropped, and the next 0x00 puts it back in step. **SLIP** (RFC 1055) is the older alternative: it ends frames with 0xC0 and **escapes** any 0xC0 or 0xDB in the data as two-byte sequences (0xDB 0xDC or 0xDB 0xDD). SLIP is simpler to write but its overhead depends on the data and can double a frame's size in the worst case; COBS's overhead is small and fixed. Either is fine; this lesson uses COBS." },

      { t: "h", text: "Message layout" },
      { t: "p", text: "Inside the frame, put a fixed header and then the payload. A good minimal layout is one byte of **message type**, one byte of **sequence number**, the payload, and two bytes of **CRC**." },
      { t: "diagram", text: String.raw`
 before COBS:  ┌──────┬─────┬──────────────────┬────────┬────────┐
               │ type │ seq │ payload (0..N)   │ crc lo │ crc hi │
               └──────┴─────┴──────────────────┴────────┴────────┘
 on the wire:  COBS( all of the above ) 00

 MSG_SENSOR 0x01  MCU→Pi   payload: uint16 adc, uint32 millis   (6 bytes, little-endian)
 MSG_LED    0x10  Pi→MCU   payload: uint8 on/off                (1 byte)
 MSG_ACK    0x7F  MCU→Pi   payload: none; seq echoes the command`, caption: "The protocol used in this lesson's code." },
      { t: "p", text: "The **type** lets one link carry many kinds of message. The **sequence number** counts up by one per frame (wrapping at 255): the receiver can detect lost frames from gaps, and an acknowledgement can say which command it confirms. Multi-byte numbers need an agreed **byte order**; both the AVR and the Pi's Arm cores are little-endian, and saying so explicitly in the protocol (and packing bytes one by one, as the code does) keeps it correct on any machine. Python's `struct.unpack(\"<HI\", ...)` reads a little-endian uint16 then uint32." },

      { t: "h", text: "Integrity with a CRC" },
      { t: "p", text: "A **cyclic redundancy check** treats the frame's bits as a polynomial and divides it by a fixed generator polynomial; the remainder is the CRC. The sender appends it; the receiver recomputes it over the received bytes and drops the frame if they differ. This lesson uses **CRC-16/CCITT-FALSE**: polynomial 0x1021, initial value 0xFFFF. A 16-bit CRC detects every single-bit and double-bit error, every odd number of bit errors, and every burst of errors up to 16 bits long, and lets through only about 1 in 65 536 random corruptions. A simple sum of bytes, by contrast, misses two bytes swapped and many common errors." },
      { t: "p", text: "Check value: every CRC variant has a published result for the ASCII string `123456789`. For CRC-16/CCITT-FALSE it is **0x29B1**. Test your implementation against it before you trust it; the Python program below does so in its self-test." },

      { t: "h", text: "The microcontroller end" },
      { t: "p", text: "This sketch compiles for the Arduino Uno (arduino:avr:uno) and the ESP32 DevKit with the Arduino core 3.x. It reports the analogue reading on A0 at 10 Hz (on the ESP32, A0 is GPIO 36, an input-only ADC pin; keep its input under 3.3 V) and obeys LED commands, acknowledging each. On the Uno the LED is the on-board one on D13; on an ESP32 DevKit, connect an LED and resistor to GPIO 13." },
      { t: "snippet", lang: "cpp", code: String.raw`// Arduino Uno (AVR) or ESP32 (Arduino core): framed binary link to a Raspberry Pi.
// Frame on the wire: COBS( type | seq | payload... | crc16_lo | crc16_hi ) 0x00
#include <Arduino.h>

const uint8_t MSG_SENSOR = 0x01;   // MCU -> Pi: uint16 adc, uint32 millis
const uint8_t MSG_LED    = 0x10;   // Pi -> MCU: uint8 on/off
const uint8_t MSG_ACK    = 0x7F;   // MCU -> Pi: echoes seq of a command
const int LED_PIN = 13;            // D13 on the Uno (on-board LED); GPIO 13 on an ESP32 DevKit (add an LED)
const size_t MAX_RAW = 32;         // largest unencoded frame we accept

uint16_t crc16_ccitt(const uint8_t *d, size_t n) {   // poly 0x1021, init 0xFFFF
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < n; i++) {
    crc ^= (uint16_t)d[i] << 8;
    for (uint8_t b = 0; b < 8; b++)
      crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
  }
  return crc;
}

// COBS encode n bytes from in to out (out needs n + n/254 + 1 bytes). Returns length.
size_t cobs_encode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t code_i = 0, o = 1;
  uint8_t code = 1;
  for (size_t i = 0; i < n; i++) {
    if (in[i] == 0) { out[code_i] = code; code_i = o++; code = 1; }
    else {
      out[o++] = in[i]; code++;
      if (code == 0xFF) { out[code_i] = code; code_i = o++; code = 1; }
    }
  }
  out[code_i] = code;
  return o;
}

// COBS decode. Returns decoded length, or 0 on a malformed frame.
size_t cobs_decode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t i = 0, o = 0;
  while (i < n) {
    uint8_t code = in[i++];
    if (code == 0 || i + code - 1 > n) return 0;
    for (uint8_t k = 1; k < code; k++) out[o++] = in[i++];
    if (code < 0xFF && i < n) out[o++] = 0;
  }
  return o;
}

void send_frame(uint8_t type, uint8_t seq, const uint8_t *payload, size_t len) {
  uint8_t raw[MAX_RAW], enc[MAX_RAW + 2];
  raw[0] = type; raw[1] = seq;
  memcpy(raw + 2, payload, len);
  uint16_t crc = crc16_ccitt(raw, len + 2);
  raw[len + 2] = crc & 0xFF; raw[len + 3] = crc >> 8;
  size_t n = cobs_encode(raw, len + 4, enc);
  Serial.write(enc, n);
  Serial.write((uint8_t)0x00);
}

void handle_frame(const uint8_t *f, size_t n) {
  if (n < 4) return;
  uint16_t got = f[n - 2] | ((uint16_t)f[n - 1] << 8);
  if (crc16_ccitt(f, n - 2) != got) return;            // corrupted: drop it
  if (f[0] == MSG_LED && n == 5) {
    digitalWrite(LED_PIN, f[2] ? HIGH : LOW);
    send_frame(MSG_ACK, f[1], nullptr, 0);
  }
}

uint8_t rx[MAX_RAW + 2];
size_t rx_len = 0;
bool rx_overflow = false;
uint8_t tx_seq = 0;
unsigned long last_send = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  while (Serial.available()) {
    uint8_t b = Serial.read();
    if (b == 0x00) {                                   // end of frame
      uint8_t dec[sizeof(rx)];                         // decoded is never longer than encoded
      size_t n = rx_overflow ? 0 : cobs_decode(rx, rx_len, dec);
      if (n) handle_frame(dec, n);
      rx_len = 0; rx_overflow = false;
    } else if (rx_len < sizeof(rx)) {
      rx[rx_len++] = b;
    } else {
      rx_overflow = true;                              // too long: discard until next 0x00
    }
  }
  if (millis() - last_send >= 100) {                   // 10 Hz sensor report
    last_send = millis();
    uint16_t adc = analogRead(A0);
    uint32_t t = millis();
    uint8_t p[6] = { (uint8_t)adc, (uint8_t)(adc >> 8),
                     (uint8_t)t, (uint8_t)(t >> 8), (uint8_t)(t >> 16), (uint8_t)(t >> 24) };
    send_frame(MSG_SENSOR, tx_seq++, p, sizeof(p));
  }
}`, caption: "coproc.ino: COBS framing, CRC-16 check, a command handler and a 10 Hz report. The receive buffer is bounded, so a stream of garbage cannot overflow it." },
      { t: "p", text: "Note the receive logic. Bytes accumulate until 0x00 arrives. If the buffer fills first, the frame is marked as overflowed and discarded at the next delimiter, which is exactly how the link recovers from noise. A frame that decodes but fails the CRC is silently dropped; the sender's lack of an acknowledgement tells it to resend." },

      { t: "h", text: "The Raspberry Pi end" },
      { t: "p", text: "Connect the board over USB. An Uno appears as `/dev/ttyACM0`; most ESP32 DevKits, with a CP2102 or CH340 USB bridge, appear as `/dev/ttyUSB0`. `ls /dev/serial/by-id/` gives a name that does not change when you plug in a second device, which is the one to put in a systemd unit. Install pyserial with `sudo apt install python3-serial`." },
      { t: "snippet", lang: "python", code: String.raw`#!/usr/bin/env python3
"""Raspberry Pi side of the COBS + CRC-16 link. Needs: sudo apt install python3-serial"""
import struct
import sys
import time

MSG_SENSOR, MSG_LED, MSG_ACK = 0x01, 0x10, 0x7F


def crc16_ccitt(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if crc & 0x8000 else (crc << 1)
            crc &= 0xFFFF
    return crc


def cobs_encode(data: bytes) -> bytes:
    out, block = bytearray(), bytearray()
    for byte in data:
        if byte == 0:
            out += bytes([len(block) + 1]) + block
            block.clear()
        else:
            block.append(byte)
            if len(block) == 254:
                out += b"\xff" + block
                block.clear()
    return bytes(out + bytes([len(block) + 1]) + block)


def cobs_decode(data: bytes) -> bytes:
    out, i = bytearray(), 0
    while i < len(data):
        code = data[i]
        if code == 0 or i + code > len(data):
            raise ValueError("bad COBS frame")
        out += data[i + 1:i + code]
        i += code
        if code < 0xFF and i < len(data):
            out.append(0)
    return bytes(out)


def make_frame(msg_type: int, seq: int, payload: bytes = b"") -> bytes:
    raw = bytes([msg_type, seq & 0xFF]) + payload
    return cobs_encode(raw + struct.pack("<H", crc16_ccitt(raw))) + b"\x00"


def parse_frame(encoded: bytes):
    """Returns (type, seq, payload) or None if the frame is damaged."""
    try:
        raw = cobs_decode(encoded)
    except ValueError:
        return None
    if len(raw) < 4 or crc16_ccitt(raw[:-2]) != struct.unpack("<H", raw[-2:])[0]:
        return None
    return raw[0], raw[1], raw[2:-2]


def self_test():
    assert crc16_ccitt(b"123456789") == 0x29B1          # CRC-16/CCITT-FALSE check value
    assert cobs_encode(b"\x11\x22\x00\x33") == b"\x03\x11\x22\x02\x33"
    for sample in (b"", b"\x00", b"\x00\x00", bytes(range(256)) * 2):
        assert cobs_decode(cobs_encode(sample)) == sample
    frame = make_frame(MSG_LED, 7, b"\x01")
    assert b"\x00" not in frame[:-1]
    assert parse_frame(frame[:-1]) == (MSG_LED, 7, b"\x01")
    damaged = bytearray(frame[:-1]); damaged[2] ^= 0x04
    assert parse_frame(bytes(damaged)) is None
    print("self-test ok")


def main(port: str):
    import serial                                       # pyserial
    with serial.Serial(port, 115200, timeout=0.1) as ser:
        time.sleep(2)                                   # the Uno resets when the port opens
        buf, seq, led, last_cmd = bytearray(), 0, 0, time.monotonic()
        while True:
            buf += ser.read(ser.in_waiting or 1)
            while b"\x00" in buf:
                encoded, _, buf = bytes(buf).partition(b"\x00")
                buf = bytearray(buf)
                msg = parse_frame(encoded)
                if msg is None:
                    print("dropped a damaged frame")
                elif msg[0] == MSG_SENSOR:
                    adc, t_ms = struct.unpack("<HI", msg[2])
                    print(f"seq {msg[1]:3d}  adc {adc:4d}  mcu time {t_ms} ms")
                elif msg[0] == MSG_ACK:
                    print(f"ack for command {msg[1]}")
            if time.monotonic() - last_cmd > 1.0:       # toggle the LED once a second
                led ^= 1
                ser.write(make_frame(MSG_LED, seq, bytes([led])))
                seq, last_cmd = (seq + 1) & 0xFF, time.monotonic()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        self_test()`, caption: "link.py: run with no argument for the self-test, or with a port name to talk to the board." },
      { t: "p", text: "Run `python3 link.py` first: it checks the CRC against 0x29B1, checks the COBS example above byte for byte, round-trips awkward data (empty, all zeros, 512 bytes covering every value) and confirms that a single flipped bit is rejected. Then `python3 link.py /dev/ttyACM0` prints sensor reports and toggles the LED every second, with an `ack` line for each command. The two-second pause after opening the port is needed on the Uno, which resets whenever the port is opened." },
      { t: "note", kind: "warn", text: "Build in a **command timeout** on the microcontroller for anything that moves: if no valid command has arrived for, say, 300 ms, stop the motors. A crashed Python program, a pulled cable or a rebooting Pi must not leave a robot driving." },

      { t: "h", text: "CAN and SocketCAN, in outline" },
      { t: "p", text: "A UART joins exactly two devices. When a robot has many controllers (one per wheel, a battery management system, an arm), the usual link is **CAN**: a two-wire differential bus, robust to motor noise, with hardware arbitration, built-in CRC and automatic retransmission, carrying short frames (8 data bytes in classic CAN, 64 in CAN FD) at up to 1 Mbit/s. Linux supports CAN as a network interface through **SocketCAN**. With a CAN adapter (an MCP2515 SPI board enabled with a device tree overlay, or a USB adapter), you bring the interface up and test it with `can-utils`:" },
      { t: "snippet", lang: "bash", code: String.raw`# config.txt for an MCP2515 board with a 16 MHz crystal, interrupt on GPIO 25:
#   dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25
sudo apt install can-utils
sudo ip link set can0 up type can bitrate 500000
candump can0                    # print every frame on the bus
cansend can0 123#DEADBEEF       # send ID 0x123 with 4 data bytes`, caption: "SocketCAN: CAN appears as a network interface. The ESP32's built-in TWAI controller plus a transceiver such as the SN65HVD230 joins the same bus." },
      { t: "p", text: "From Python, the `python-can` library opens `can0` as a socket. Because CAN already frames, checks and arbitrates, you skip COBS and CRC entirely and assign each message type a CAN identifier instead; lower identifiers win arbitration, so give safety messages the lowest." },

      { t: "deep", title: "How a CRC is computed, bit by bit", blocks: [
        { t: "p", text: "The CRC is the remainder of polynomial division in arithmetic modulo 2, where addition and subtraction are both XOR and there are no carries. The generator 0x1021 means x¹⁶ + x¹² + x⁵ + 1 (bits 12, 5 and 0 set, plus the implied x¹⁶). The loop in the code is long division done one bit at a time: shift the register left; if the bit shifted out was 1, the divisor \"goes into\" the current value, so subtract (XOR) it." },
        { t: "formula", text: String.raw`for each byte b:
    crc = crc XOR (b << 8)          bring the next 8 dividend bits into the top
    repeat 8 times:
        if top bit of crc is 1:  crc = (crc << 1) XOR 0x1021
        else:                    crc = crc << 1
        keep the low 16 bits`, caption: "The bitwise CRC-16/CCITT-FALSE algorithm used on both ends." },
        { t: "p", text: "Why it catches bursts: an error pattern E(x) goes undetected only if the generator divides it exactly. Any burst of length 16 or less is x^k times a polynomial of degree below 16, which a degree-16 generator with a non-zero constant term cannot divide. Faster implementations use a 256-entry table indexed by the top byte, trading 512 bytes of flash for about eight times the speed; on an Uno at 10 frames a second the bitwise loop costs well under a millisecond per frame, so it is not worth it here." },
        { t: "p", text: "The initial value 0xFFFF matters: with an initial value of 0, a frame with extra leading zero bytes would have the same CRC as without them. Starting from all ones makes leading zeros count." },
      ] },
      { t: "deep", title: "Reliability on top of framing: acks, retries and flow control", blocks: [
        { t: "p", text: "Framing and a CRC turn noise into lost frames; they do not recover them. For periodic data such as sensor reports, recovery is unnecessary: the next report arrives in 100 ms. For commands that must arrive, the sender keeps the last unacknowledged command and resends it if no ACK with the same sequence number arrives within a timeout (for example 50 ms), up to a few tries. The receiver must then cope with **duplicates**, because the ACK itself may have been lost: it remembers the sequence number of the last command it executed and ignores a repeat, or the commands are designed to be **idempotent** (\"set LED on\" is safe to repeat; \"toggle LED\" is not)." },
        { t: "p", text: "Throughput: at 115 200 baud with 8N1 framing each byte takes 10 bits, so the link carries 11 520 bytes per second. A sensor frame here is 10 raw bytes, 11 after COBS, 12 with the delimiter, so 10 Hz uses 120 bytes per second, about 1% of capacity. That headroom matters: the Uno's receive buffer is only 64 bytes, and a Pi that sends a burst of long commands while the sketch is busy can overflow it. Keep frames short, or add a simple flow control rule such as never having more than one unacknowledged command outstanding." },
        { t: "p", text: "Professional systems formalise all this. MAVLink (drones) uses a start byte, length, sequence, system and component IDs, message ID and a CRC with a per-message seed; micro-ROS (next module) uses the XRCE-DDS protocol with its own framing over serial. Designing your own once teaches you what those protocols are doing for you." },
      ] },
    ],
    mistakes: [
      "**Sending human-readable text and parsing it with string functions.** It has no error detection and resynchronises poorly. Use framed binary messages.",
      "**Forgetting the byte order of multi-byte values.** State little-endian in the protocol and pack bytes explicitly, or use `struct` with `<`.",
      "**Unbounded receive buffers on the microcontroller.** Noise without a 0x00 will overflow them. Bound the buffer and discard on overflow.",
      "**Not testing the CRC against its check value.** A CRC with the wrong initial value or bit order still produces numbers; only the check value proves it matches the other end.",
      "**No command timeout.** If the Pi dies, the motors must stop by themselves.",
      "**Opening the Uno's port and sending immediately.** The Uno resets on port open and misses the first second of data.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project for this module: a Pi and a microcontroller exchanging sensor data and commands over the framed protocol.",
      steps: [
        "Upload coproc.ino to an Uno or ESP32. Connect a potentiometer to A0 (Uno, 5 V across it) or GPIO 36 (ESP32, 3.3 V across it).",
        "On the Pi, run `python3 link.py` and confirm the self-test passes. Then run it with the board's port and watch reports change as you turn the potentiometer, and the LED toggle with acks.",
        "Add a second command type, MSG_PWM 0x11 with a uint8 duty, that dims an LED on a PWM pin (D9 on the Uno; GPIO 25 on the ESP32 with analogWrite). Extend both ends.",
        "Prove the CRC works: in Python, flip one bit of an outgoing frame before sending and confirm the board ignores it (no ack).",
        "Add a 300 ms command timeout on the board that turns the LED off, then stop link.py and confirm the LED goes out.",
        "Run link.py as a systemd service using the /dev/serial/by-id/ name, and confirm it survives unplugging and replugging the board (it should exit with an error and be restarted).",
      ],
    },
    quiz: [
      {
        q: "COBS-encode the 3 bytes `05 00 07`. What goes on the wire, including the delimiter?",
        options: ["05 00 07 00", "02 05 02 07 00", "03 05 07 00", "01 05 00 07 00"],
        answer: 1,
        why: "Split at the zero: [05] and [07]. Each block becomes length+1 then its bytes: 02 05 and 02 07. Then the 00 delimiter.",
      },
      {
        q: "Why does the protocol put a sequence number in every frame?",
        options: [
          "To make the frame longer so the CRC works",
          "So the receiver can detect lost frames and an acknowledgement can name the command it confirms",
          "Because COBS requires it",
          "To set the baud rate",
        ],
        answer: 1,
        why: "Gaps in the sequence reveal lost frames, and echoing a command's sequence number in the ACK ties the two together.",
      },
      {
        q: "A frame arrives, decodes correctly, but its CRC does not match. What should the receiver do?",
        options: [
          "Act on it anyway, since it decoded",
          "Drop it silently; the sender's retry or the next periodic frame recovers",
          "Reset the microcontroller",
          "Ask the user",
        ],
        answer: 1,
        why: "A CRC mismatch means the content is corrupt. Never act on it. Periodic data is replaced by the next frame; commands are resent when no ACK arrives.",
      },
      {
        q: "At 115 200 baud with 8N1 framing, how many bytes per second can the link carry?",
        options: ["115 200", "14 400", "11 520", "1 152"],
        answer: 2,
        why: "Each byte costs 10 bits on the wire (start, 8 data, stop), so 115 200 / 10 = 11 520 bytes per second.",
      },
      {
        q: "When is CAN with SocketCAN a better choice than a UART link?",
        options: [
          "When there is only one microcontroller on a desk",
          "When several controllers must share one noise-robust bus with built-in arbitration and error checking",
          "When you need to send large images",
          "When the Pi has no USB ports",
        ],
        answer: 1,
        why: "CAN is a multi-drop differential bus with hardware CRC, arbitration and retransmission, made for many nodes in electrically noisy machines.",
      },
      {
        q: "The Python program reads a 6-byte payload with `struct.unpack(\"<HI\", payload)`. What does that mean?",
        options: [
          "Big-endian 16-bit then 32-bit unsigned integers",
          "Little-endian unsigned 16-bit then unsigned 32-bit integers",
          "Two signed 32-bit integers",
          "A string of 6 characters",
        ],
        answer: 1,
        why: "`<` is little-endian with no padding, H is uint16 (2 bytes) and I is uint32 (4 bytes), matching the sketch's byte packing.",
      },
    ],
  },

  "a6-deployment-reliability-power": {
    id: "a6-deployment-reliability-power",
    outcomes: [
      "Package a robot program in a Docker container so it runs the same on every Pi",
      "Measure and reduce boot time",
      "Explain SD card wear and protect a robot with a read-only root file system",
      "Size a power supply for a Pi 5 and recognise undervoltage",
    ],
    blocks: [
      { t: "h", text: "From a working demo to a robot that keeps working" },
      { t: "p", text: "A program that runs once on your desk has proved very little. A robot must start the same way on every unit, survive being switched off at the wall, boot quickly enough that nobody waits, and never brown out when the motors start. These are not glamorous problems, but they are what separate a project from a product, and they are what fail at demonstrations. This lesson covers the four that matter most on a Raspberry Pi: reproducible deployment, boot time, storage reliability, and power." },

      { t: "h", text: "Containers for reproducible deployment" },
      { t: "p", text: "\"It works on my Pi\" happens because each Pi accumulates different packages, versions and edits over time. A **container** packages your program together with its exact user-space environment (libraries, Python version, configuration) into an **image** built from a text recipe, the **Dockerfile**. A container shares the host's kernel, so it starts in under a second and costs almost nothing in performance, unlike a virtual machine. Two Pis running the same image run the same software, whatever else is installed on them." },
      { t: "snippet", lang: "text", code: String.raw`# Dockerfile
FROM python:3.13-slim
RUN pip install --no-cache-dir pyserial==3.5
WORKDIR /app
COPY link.py .
CMD ["python3", "link.py", "/dev/ttyACM0"]`, caption: "A small image for the serial bridge from the last lesson. Pinning the pyserial version makes the build repeatable." },
      { t: "snippet", lang: "bash", code: String.raw`# Install Docker on the Pi (official convenience script), then allow your user to run it
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker you          # log out and in again

docker build -t robot-bridge:1.0 .
docker run -d --name bridge --restart unless-stopped \
    --device /dev/ttyACM0 robot-bridge:1.0
docker logs -f bridge
docker ps`, caption: "Build and run. `--device` passes exactly one serial port into the container; `--restart unless-stopped` gives systemd-like restarts and starts it at boot." },
      { t: "p", text: "Three points about containers on robots. First, containers are isolated from hardware by default, so you pass in what they need explicitly: `--device /dev/ttyACM0`, `--device /dev/i2c-1`, `--device /dev/gpiochip0`. Avoid `--privileged`, which gives the container full access to the host and throws away the isolation. Second, architecture matters: an image built on an x86 laptop will not run on the Pi's Arm cores. Build on the Pi, or on the laptop with `docker buildx build --platform linux/arm64`. Third, a container is the same as any other process to the CPU: it does not make anything real-time. For several cooperating containers, a `compose.yaml` file describes them all and `docker compose up -d` starts them together; ROS 2 projects commonly ship this way, using official `ros` base images." },

      { t: "h", text: "Boot time" },
      { t: "p", text: "A robot that takes a minute to boot gets switched on late and switched off without being shut down. Measure before you optimise: `systemd-analyze` prints the time spent in firmware, the kernel and user space, and `systemd-analyze blame` lists the slowest units. A Lite image on a Pi 5 typically reaches `multi-user.target` in roughly 10 to 20 seconds from an SD card." },
      { t: "list", items: [
        "**Use the Lite image**: no desktop, far fewer services.",
        "**Disable services you do not need**, for example `sudo systemctl disable bluetooth` on a robot that uses no Bluetooth. Check what is running with `systemctl list-units --type=service --state=running`.",
        "**Do not wait for the network** unless you must. A service with `After=network-online.target` waits for Wi-Fi, which can add ten seconds.",
        "**Boot from faster storage**: a USB SSD or, on the Pi 5, an NVMe SSD on an M.2 HAT reads many times faster than a microSD card.",
        "**Start the safety-critical part on the microcontroller**, which boots in under a second, so the robot is safe long before Linux is up.",
      ] },

      { t: "h", text: "SD cards wear out" },
      { t: "p", text: "A microSD card is flash memory with a simple controller. Flash is written in pages and erased in much larger blocks, and each block survives a limited number of erase cycles (a few thousand for the consumer TLC flash in cheap cards). The controller spreads writes around (wear levelling), but small, frequent writes such as logging a line every 100 ms cause **write amplification**: a 50-byte write can force the card to rewrite a whole erase block of hundreds of kilobytes. Cards in robots also face sudden power loss, which can corrupt the file system or the card's own internal mapping tables." },
      { t: "p", text: "Defences, in order of effort: use a good-quality, high-endurance card (sold for dashcams and surveillance cameras); log to RAM and write to the card in batches; mount `/tmp` as RAM (`tmpfs`); and, for a robot whose software is fixed, make the root file system **read-only**." },

      { t: "h", text: "Read-only root with the overlay file system" },
      { t: "p", text: "Raspberry Pi OS has this built in. In `sudo raspi-config`, under Performance Options, choose **Overlay File System**, enable it, and choose to make the boot partition read-only as well. After a reboot, the card is mounted read-only underneath, and an **overlay** in RAM sits on top: programs can still write files, but the writes go to RAM and vanish at the next boot. The card itself is never written, so pulling the power cannot corrupt it." },
      { t: "diagram", text: String.raw`
  what programs see:   /  (read-write)
                        │
            ┌───────────┴────────────┐
            │ upper layer: tmpfs     │  ← all writes land here, in RAM, lost at reboot
            ├────────────────────────┤
            │ lower layer: SD card   │  ← mounted read-only, never written
            └────────────────────────┘`, caption: "overlayfs merges a read-only lower layer with a writable upper layer." },
      { t: "p", text: "Two consequences. To update software you must turn the overlay off in raspi-config, reboot, make changes, and turn it on again. And data you actually want to keep (logs, maps, recordings) must go somewhere writable on purpose: a separate partition, a USB stick mounted with care, or sent over the network. Docker images live under `/var/lib/docker`, so with the overlay on, image updates are lost at reboot too; pull and test updates with the overlay off. Docker's storage driver also cannot sit on top of an overlay root, so on a robot that uses both, give `/var/lib/docker` its own writable ext4 partition (or a USB SSD) and accept that this one area is written." },

      { t: "h", text: "Power" },
      { t: "p", text: "The most common cause of a Pi that crashes, reboots or corrupts its card is not software: it is the power supply. The **Raspberry Pi 5** is specified for a **5 V, 5 A** USB-C supply (27 W, such as the official one, which negotiates 5 A over USB Power Delivery). With a 5 V 3 A supply it still runs, but it limits the total current available to its USB ports to 600 mA instead of 1.6 A, and it warns you at boot. The **Pi 4** needs 5 V 3 A. Both draw more under load: a Pi 5 running all four cores flat out draws several watts more than at idle, before any USB devices." },
      { t: "p", text: "The Pi watches its own input voltage. If it falls below about 4.63 V it flags **undervoltage**, slows the CPU and may become unstable. Check with `vcgencmd get_throttled`: `0x0` means everything is fine. Bit 0 (value 0x1) means undervoltage right now, and bit 16 (0x10000) means undervoltage has occurred since boot. The kernel also logs `Undervoltage detected!` in `dmesg`." },
      { t: "formula", text: String.raw`vcgencmd get_throttled  →  throttled=0x50005
0x50005 = 0x40000 + 0x10000 + 0x4 + 0x1
  0x1      bit 0   undervoltage now
  0x4      bit 2   currently throttled
  0x10000  bit 16  undervoltage has occurred since boot
  0x40000  bit 18  throttling has occurred since boot`, caption: "Decoding the throttled flags. Any non-zero value on a robot is a bug to fix." },
      { t: "p", text: "On a battery-powered robot, the Pi needs its own **regulated 5 V supply** that can deliver the full current, for example a 5 V 5 A buck converter from the battery. Do not take it from the same small regulator that powers servos or motor drivers: when a motor starts, the current surge and the voltage dip reset or corrupt the Pi. Use short, thick wires, because a thin 1 m USB cable can drop several tenths of a volt at 3 A." },
      { t: "formula", text: String.raw`Worked example: cable drop
Cable resistance (both conductors) = 0.15 Ω,  current = 3 A
V_drop = I × R = 3 × 0.15 = 0.45 V
5.10 V supply → 5.10 - 0.45 = 4.65 V at the Pi, just above the 4.63 V warning`, caption: "Check: 0.45 V is 9% of 5 V. A better cable at 0.05 Ω drops 0.15 V, leaving 4.95 V." },
      { t: "note", kind: "safety", text: "Lithium batteries used to power robots can deliver hundreds of amps into a short circuit. Fuse the battery lead close to the battery, keep the Pi's 5 V converter on its own fused branch, and never back-feed the Pi through its GPIO 5 V pins from an unregulated source." },

      { t: "deep", title: "Inside the overlay file system and when to roll your own", blocks: [
        { t: "p", text: "The raspi-config option uses the kernel's **overlayfs**, set up early in boot by a script in the initramfs. A file read checks the upper layer first, then the lower. A write to a file that exists only in the lower layer triggers a **copy-up**: the whole file is copied to the upper layer and modified there. A deletion leaves a \"whiteout\" marker in the upper layer. Because the upper layer is tmpfs, a program that writes a lot (a log that grows by 1 MB a minute) slowly eats RAM; at that rate a 2 GB Pi would lose a quarter of its memory in about eight hours, and the out-of-memory killer eventually ends something. Rotate or ship logs off the device." },
        { t: "p", text: "Docker uses the same idea for image layers: each Dockerfile instruction makes a read-only layer, and a running container gets a thin writable layer on top, which is discarded when the container is removed. That is why persistent container data goes in a **volume** (`-v /data/logs:/app/logs`)." },
        { t: "p", text: "Fleets usually go further, with **A/B partitioning**: two root partitions, one running and one receiving the next update, with a bootloader switch and automatic fallback if the new one fails to boot. Tools such as RAUC, Mender and SWUpdate implement it. Yocto and Buildroot build a minimal custom Linux image from source, which can boot in a few seconds; that is how commercial products usually do it." },
      ] },
      { t: "deep", title: "Where the watts go: a Pi 5 power budget", blocks: [
        { t: "p", text: "Budget on paper before you buy a regulator. Take the worst case, not the average, because it is the worst case that resets the board." },
        { t: "table", head: ["Load", "Typical worst case"], rows: [
          ["Pi 5 board, all cores busy", "about 2 A at 5 V (10 W)"],
          ["USB camera or LiDAR", "0.5 A"],
          ["Microcontroller board over USB", "0.1 to 0.25 A"],
          ["NVMe SSD on an M.2 HAT", "0.5 to 1 A at peak"],
          ["Total", "about 3.1 to 3.75 A"],
        ], caption: "Rough figures; measure your own with a USB power meter." },
        { t: "p", text: "Adding up: 2 + 0.5 + 0.25 + 1 = 3.75 A at most, or 18.75 W. With a 20% margin that is 4.5 A, so a 5 A converter is the right choice and a 3 A one is not. Efficiency matters too: if a buck converter is 90% efficient, 18.75 W out costs 18.75 / 0.9 ≈ 20.8 W from the battery, or about 1.7 A from a 12 V pack. If you power the Pi 5 through its GPIO 5 V pins or a non-PD supply, the firmware cannot know the supply can deliver 5 A; setting `usb_max_current_enable=1` in config.txt tells it so, which is only safe if it is true." },
      ] },
    ],
    mistakes: [
      "**Using a phone charger or a thin cable for a Pi 5.** Undervoltage causes crashes that look like software bugs. Check `vcgencmd get_throttled`.",
      "**Powering the Pi from the motor regulator.** Motor surges reset it. Give it its own 5 V supply.",
      "**Running containers with `--privileged`** for convenience. Pass only the devices the container needs.",
      "**Building an image on an x86 laptop and expecting it to run on the Pi.** Build for linux/arm64.",
      "**Enabling the read-only overlay and then wondering why changes disappear.** All writes go to RAM; turn the overlay off to update.",
      "**Logging every sensor reading straight to the SD card.** Batch writes or log to RAM to avoid wearing out the card.",
    ],
    practice: {
      kind: "bench",
      task: "Make the serial bridge from the last lesson deployable and robust.",
      steps: [
        "Run `systemd-analyze` and `systemd-analyze blame`. Record the boot time, disable two services your robot does not need, and measure again.",
        "Write the Dockerfile from the lesson, build it on the Pi, run it with `--device`, and confirm it talks to the microcontroller.",
        "Check `vcgencmd get_throttled` while running a CPU stress test (`sudo apt install stress-ng`, then `stress-ng --cpu 4 --timeout 60`) with your normal supply. If it is not 0x0, find out why.",
        "Enable the overlay file system, reboot, create a file in your home directory, reboot again, and confirm it is gone.",
        "With the overlay on and the container running, pull the power plug ten times in a row. The robot should come back every time.",
      ],
    },
    quiz: [
      {
        q: "A Pi 5 runs from a 5 V 3 A supply. What changes compared with a 5 V 5 A supply?",
        options: [
          "Nothing at all",
          "It refuses to boot",
          "It runs, but limits the total USB port current to 600 mA instead of 1.6 A",
          "It runs the CPU at half speed permanently",
        ],
        answer: 2,
        why: "The Pi 5 is specified for 5 V 5 A. With a supply it cannot confirm as 5 A capable, it restricts downstream USB current to 600 mA.",
      },
      {
        q: "`vcgencmd get_throttled` returns `0x10000`. What does it mean?",
        options: [
          "Everything is fine",
          "Undervoltage is happening right now",
          "Undervoltage occurred at some point since boot, but not at this moment",
          "The CPU is too hot right now",
        ],
        answer: 2,
        why: "Bit 16 (0x10000) is the sticky 'undervoltage has occurred' flag. Bit 0 (0x1) would mean undervoltage now.",
      },
      {
        q: "A 1 m cable with 0.2 Ω total resistance carries 3 A to a Pi from a 5.1 V supply. What voltage reaches the Pi?",
        options: ["4.5 V", "5.1 V", "4.9 V", "4.7 V"],
        answer: 0,
        why: "V_drop = 3 × 0.2 = 0.6 V, so 5.1 - 0.6 = 4.5 V, below the 4.63 V undervoltage threshold.",
      },
      {
        q: "With the overlay file system enabled, what happens to a file your program writes?",
        options: [
          "It is written to the SD card as usual",
          "It is held in RAM and lost at the next reboot",
          "The write fails with a permission error",
          "It is written to the boot partition",
        ],
        answer: 1,
        why: "Writes go to the tmpfs upper layer; the SD card underneath is read-only. That protects the card but means you must save important data elsewhere on purpose.",
      },
      {
        q: "Why use `--device /dev/ttyACM0` rather than `--privileged` when running a container?",
        options: [
          "It is faster",
          "It gives the container only the one device it needs, keeping the rest of the host isolated",
          "--privileged does not work on Arm",
          "--device also installs drivers",
        ],
        answer: 1,
        why: "--privileged gives the container almost full control of the host. Passing individual devices keeps the benefits of isolation.",
      },
    ],
  },
};

export default lessons;
