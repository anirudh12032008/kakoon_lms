import type { ModuleContent } from "../model/curriculum";

/**
 * Module a16: Security for embedded and IoT.
 * Normal mode is complete on its own; `deep` holds detail.
 * ESP32 security features checked against Espressif's ESP-IDF documentation.
 * No long dashes.
 */
const lessons: ModuleContent = {
  "a16-threat-modelling-and-common-weaknesses": {
    id: "a16-threat-modelling-and-common-weaknesses",
    outcomes: [
      "Identify the assets, trust boundaries and attack surfaces of a connected device",
      "Apply STRIDE to each element of a data-flow diagram and draw an attack tree for one goal",
      "Recognise the common weaknesses in the OWASP IoT Top 10 and their fixes",
      "Summarise what the DPDP Act 2023, the EU Cyber Resilience Act and ETSI EN 303 645 expect of a connected product",
    ],
    blocks: [
      { t: "h", text: "Why assume the device will be attacked" },
      { t: "p", text: "A web server sits in a locked data centre. Your IoT node sits on a corridor wall, on a network shared with ten thousand students, for five years. Anyone can unscrew it, attach a USB to serial adapter, read the flash, and try what they find against your broker. Mirai, the 2016 botnet that took down major websites, needed no clever exploit: it logged in to hundreds of thousands of cameras and routers using about sixty factory default passwords. Most real IoT compromises are like that. They exploit an obvious weakness that nobody listed. **Threat modelling** is the discipline of listing them before an attacker does." },
      { t: "note", kind: "warn", text: "Ethics and law: test only devices, networks and accounts that you own or have written permission to test. Scanning or probing campus systems, other students' devices or a vendor's cloud without permission can breach the IT Act 2000 and institute rules, however good the intention. Everything in this module's practice is done on your own hardware and a broker you run." },

      { t: "h", text: "Four questions" },
      { t: "p", text: "A useful framing (from Adam Shostack's work on threat modelling) is four questions. **What are we working on?** Draw it. **What can go wrong?** List threats systematically. **What are we going to do about it?** Choose mitigations. **Did we do a good job?** Check and test. Start with the drawing: a **data-flow diagram** showing processes, data stores, external entities and the flows between them, with **trust boundaries** drawn wherever data crosses from something you control to something you do not." },
      { t: "diagram", text: String.raw`
   ┌──────────── physical boundary (anyone can touch) ─────────────┐
   │  [SHT40] ──I2C──► ( ESP32 firmware ) ──── [ NVS: Wi-Fi pw,    │
   │                       │      ▲  UART/JTAG     device key ]    │
   └───────────────────────┼──────┼────────────────────────────────┘
          ═══ network boundary (shared campus Wi-Fi) ═══
                           │ MQTT/TLS      ▲ OTA image, commands
                           ▼               │
                 ( broker ) ──► ( ingest ) ──► [ database ] ──► ( dashboard ) ◄── users
                 ═══ cloud boundary ═══                      ═══ internet ═══`, caption: "Data-flow diagram of a room node. Every line crossing a boundary is an attack surface." },
      { t: "p", text: "Then list **assets**, the things worth protecting: the device private key, the Wi-Fi password, the firmware (intellectual property and the integrity of what runs), the sensor data (integrity, and privacy if it reveals people), the actuators (a relay switching a heater is a safety asset), and availability of the service. List **attack surfaces**, the places an attacker can interact: radio (Wi-Fi, BLE provisioning), network services (any open port, the MQTT connection), physical interfaces (UART, JTAG, USB, the flash chip itself), the update path, the cloud APIs and dashboard, and the supply chain (libraries, the build machine)." },

      { t: "h", text: "STRIDE" },
      { t: "p", text: "STRIDE, developed at Microsoft, is a checklist of six threat types, each the violation of one security property. Walk every element and flow of your diagram and ask which apply." },
      { t: "table", head: ["Threat", "Property violated", "Example on a room node", "Typical mitigation"], rows: [
        ["Spoofing", "Authentication", "A laptop publishes as room-node-0042", "Per-device certificates, mutual TLS"],
        ["Tampering", "Integrity", "Modified firmware flashed over UART", "Secure boot, signed OTA"],
        ["Repudiation", "Non-repudiation", "Nobody can tell who sent the command that opened a valve", "Authenticated, logged commands with IDs"],
        ["Information disclosure", "Confidentiality", "Wi-Fi password read from flash", "Flash encryption, secure element"],
        ["Denial of service", "Availability", "Broker flooded, or Wi-Fi deauthenticated", "Rate limits, local fallback, 802.11w"],
        ["Elevation of privilege", "Authorisation", "A device certificate allowed to publish commands to all devices", "Least-privilege ACLs per device"],
      ], caption: "STRIDE turns \"think about security\" into a list you can finish." },
      { t: "p", text: "For each threat, rate it roughly (likelihood times impact, high, medium or low is enough), choose a mitigation or explicitly accept the risk, and record the decision. A threat model is a table of decisions, not a list of fears." },

      { t: "h", text: "Attack trees" },
      { t: "p", text: "STRIDE finds breadth. An **attack tree** gives depth on one goal. The root is the attacker's goal; children are ways to achieve it; an OR node needs any child, an AND node needs all. Annotate leaves with cost or difficulty and the cheapest path is the one to fix first." },
      { t: "diagram", text: String.raw`
 GOAL: publish fake readings as a campus node
 └─ OR
    ├─ obtain a valid device credential
    │  └─ OR
    │     ├─ read shared password from any one node's flash .......... cheap (esptool, 10 min)
    │     ├─ find hard-coded key in public git repo .................. cheap
    │     └─ extract key from encrypted flash + secure boot ......... very expensive
    ├─ broker accepts unauthenticated clients on 1883 .............. trivial
    └─ AND
       ├─ man-in-the-middle the Wi-Fi
       └─ device skips server certificate check ..................... cheap if true`, caption: "The cheap leaves are the design flaws. Fix them first; the expensive leaf is acceptable for a campus sensor." },

      { t: "h", text: "Common weaknesses and the OWASP IoT Top 10" },
      { t: "p", text: "The OWASP Internet of Things Top 10 (2018 edition, still the current list) summarises what goes wrong in real products. In order: weak, guessable or hard-coded passwords; insecure network services; insecure ecosystem interfaces (cloud APIs, mobile apps); lack of secure update mechanism; use of insecure or outdated components; insufficient privacy protection; insecure data transfer and storage; lack of device management; insecure default settings; lack of physical hardening. Five weaknesses deserve particular attention for student projects:" },
      { t: "list", items: [
        "**Default or shared credentials.** A web configuration page with `admin/admin`, or one MQTT password for the fleet. Fix: per-device credentials, and any user password set at first use.",
        "**Exposed debug ports.** The ESP32's UART0 lets anyone with a USB adapter read flash with `esptool.py read_flash`, and JTAG gives full debug control. Fix: flash encryption and secure boot (lesson 3), disable JTAG through eFuses in production, and do not print secrets to the serial log.",
        "**Unauthenticated MQTT.** A Mosquitto broker on port 1883 with `allow_anonymous true` lets anyone on the network subscribe to `#` and publish commands. Mosquitto 2.x refuses anonymous access by default; do not turn it back on. Fix: TLS on 8883, client certificates or per-device passwords, and ACLs.",
        "**Replay.** An attacker records a valid encrypted \"unlock\" command and sends it again later. Encryption does not stop this, because the replayed message is genuine. Fix: include a counter or timestamp in the authenticated part of every command and reject any value not newer than the last one seen.",
        "**Hard-coded keys in git.** A `secrets.h` committed once stays in the repository history forever, even after you delete it. Fix: keep secrets out of source (`.gitignore`, provisioning, NVS), scan with a tool such as gitleaks before pushing, and if one leaks, rotate it: deleting the commit is not enough.",
      ] },
      { t: "snippet", lang: "python", code: String.raw`import hmac, hashlib, struct

KEY = bytes.fromhex("8f3a" * 16)      # 32-byte per-device key (demo value only)

def make_cmd(counter: int, action: bytes) -> bytes:
    body = struct.pack(">I", counter) + action
    tag = hmac.new(KEY, body, hashlib.sha256).digest()[:16]
    return body + tag

class Device:
    def __init__(self):
        self.last = 0                       # persisted in NVS on a real device
    def accept(self, msg: bytes) -> bool:
        body, tag = msg[:-16], msg[-16:]
        good = hmac.new(KEY, body, hashlib.sha256).digest()[:16]
        if not hmac.compare_digest(tag, good):
            return False                    # forged or corrupted
        counter = struct.unpack(">I", body[:4])[0]
        if counter <= self.last:
            return False                    # replay or stale
        self.last = counter
        return True

d = Device()
m1 = make_cmd(1, b"relay=on")
print(d.accept(m1))                         # True: fresh and authentic
print(d.accept(m1))                         # False: same message replayed
forged = m1[:-1] + bytes([m1[-1] ^ 1])
print(d.accept(make_cmd(2, b"relay=off")), d.accept(forged))   # True False`, caption: "Replay protection with a monotonic counter inside an HMAC. Runs with the Python standard library." },
      { t: "p", text: "Check what happened: the first message is authentic and its counter 1 is newer than 0, so it is accepted. The identical message sent again has counter 1, not newer than the stored 1, so it is rejected even though its tag is valid. The forged message fails the tag check. Note `hmac.compare_digest`, a constant-time comparison: an ordinary `==` can return early at the first differing byte, which leaks timing information." },

      { t: "h", text: "Privacy and regulation in outline" },
      { t: "p", text: "Sensor data is often personal data. Occupancy, CO2 and even electricity use reveal when someone is in a room; BLE scans can track phones. Design for **data minimisation**: collect what the purpose needs, aggregate early (room counts, not device MAC addresses), keep it no longer than needed, and know who can see it." },
      { t: "list", items: [
        "**India: Digital Personal Data Protection Act 2023.** Applies to digital personal data processed in India. A data fiduciary (whoever decides why and how data is processed) needs a lawful basis, usually notice and consent, must use data only for the stated purpose, keep reasonable security safeguards, report breaches to the Data Protection Board and affected people, and erase data when the purpose is served. The DPDP Rules were notified in November 2025, with most obligations phased in over about 18 months. Penalties for failing to take security safeguards can reach INR 250 crore.",
        "**EU Cyber Resilience Act** (Regulation (EU) 2024/2847, in force from December 2024). Products with digital elements sold in the EU must meet essential cybersecurity requirements: secure by default configuration, protection against unauthorised access, a vulnerability handling process, security updates for the support period, and an SBOM (software bill of materials). Reporting of actively exploited vulnerabilities applies from September 2026 and the main obligations from December 2027. Indian manufacturers exporting to Europe are covered.",
        "**ETSI EN 303 645.** A European standard of baseline security provisions for consumer IoT, widely used as a checklist and the basis of several national schemes. Its first provisions are the ones in this lesson: no universal default passwords, a way to report vulnerabilities, keep software updated, store credentials securely, communicate securely, minimise exposed attack surfaces, and protect personal data.",
      ] },
      { t: "p", text: "This is an engineer's outline, not legal advice. The practical point is that the controls this module teaches (unique credentials, secure updates, encrypted storage and transport, vulnerability handling, minimal data) are what these frameworks ask for." },

      { t: "deep", title: "Scoring risk and keeping the threat model alive", blocks: [
        { t: "p", text: "Simple likelihood times impact on a three-point scale is enough for most projects. Formal schemes exist: **DREAD** (damage, reproducibility, exploitability, affected users, discoverability), now mostly abandoned as too subjective, and **CVSS** (Common Vulnerability Scoring System), used to score specific vulnerabilities from 0 to 10 once found. For design-time threats, consistent rough ranking matters more than precision." },
        { t: "p", text: "A threat model goes stale. Revisit it when you add an interface (a new BLE characteristic, a web page), change a dependency, or learn of a new attack. Store it in the repository next to the code, and in code review ask \"does this change cross a trust boundary?\" Tools such as the OWASP Threat Dragon or Microsoft Threat Modeling Tool draw the diagrams and generate STRIDE checklists, but a table in a Markdown file works." },
      ] },
      { t: "deep", title: "What an attacker actually does with a stolen ESP32", blocks: [
        { t: "p", text: "With physical access and no protections enabled, the attack is a few commands: hold BOOT, connect USB, `esptool.py read_flash 0 0x400000 dump.bin`, then `strings dump.bin | grep -i pass`, or parse the NVS partition with Espressif's NVS tools to list every stored key. Wi-Fi passwords and MQTT credentials come out in plain text. The attacker can then modify the image and write it back, because without secure boot the ROM bootloader runs anything." },
        { t: "p", text: "With flash encryption in release mode, the dump is ciphertext under a key held in eFuses that software cannot read, and UART download mode can be restricted to a secure mode that refuses to read flash. With secure boot, a modified image will not boot. Neither stops a well-funded lab using fault injection (voltage or electromagnetic glitching) on specific chip revisions; published research has demonstrated such attacks on the original ESP32. For high-value keys, a secure element raises the bar further. Match the defence to the value of what is protected." },
      ] },
    ],
    mistakes: [
      "**Treating encryption as protection against replay.** A replayed encrypted message is still authentic. Add a counter or timestamp inside the authenticated data.",
      "**Deleting a leaked secret from git and moving on.** It remains in history and in every clone. Rotate it.",
      "**Testing someone else's device or network.** Without written permission it is illegal and unethical, whatever the intent.",
      "**A threat model that lists threats but no decisions.** Each threat needs a mitigation or an explicit, recorded acceptance.",
      "**Comparing MACs with `==` or `memcmp`.** Use a constant-time comparison to avoid timing leaks.",
      "**Collecting device MAC addresses when a count would do.** Minimise personal data at the source.",
    ],
    practice: {
      kind: "bench",
      task: "Write a threat model for an earlier connected project of your own (for example the i10 or i11 MQTT node).",
      steps: [
        "Draw its data-flow diagram with trust boundaries, as in the lesson.",
        "List assets and attack surfaces, then fill a STRIDE table with at least one threat per letter, each with a likelihood, impact and mitigation or accepted risk.",
        "Draw an attack tree for the goal \"make the device do something its owner did not ask for\" and mark the cheapest path.",
        "On your own device, check for evidence: try `esptool.py read_flash` and search the dump for your Wi-Fi password; try subscribing to `#` on your broker without credentials. Record what succeeded.",
        "Search your project's git history for secrets with `git log -p | grep -i -E \"pass|key|secret\"` or gitleaks, and list what you would rotate.",
      ],
    },
    quiz: [
      {
        q: "An attacker records an authentic, encrypted \"unlock\" MQTT command and sends it again an hour later. Which STRIDE category and fix fit best?",
        options: ["Information disclosure; use stronger encryption", "Denial of service; add rate limits", "Repudiation; add more logging", "Spoofing (via replay); include a counter or timestamp in the authenticated data and reject old values"],
        answer: 3,
        why: "The replayed message passes authentication because it is genuine. Only freshness checking (counter or timestamp under the MAC) stops it.",
      },
      {
        q: "In an attack tree, an AND node has two children costing 10 and 1000 units. An OR node above it has another child costing 50. What is the cheapest attack?",
        options: ["50 units", "10 units", "1010 units", "1060 units"],
        answer: 0,
        why: "The AND branch needs both children: 10 + 1000 = 1010. The OR node takes the cheaper of 1010 and 50, so 50.",
      },
      {
        q: "A developer removes `secrets.h` from the repository in a new commit. Why is the problem not solved?",
        options: ["Git encrypts old commits", "The compiler still has a copy", "The secret remains in the history and in every existing clone, so it must be rotated", "It is solved; deleted files are gone"],
        answer: 2,
        why: "Git keeps every past version. Anyone with a clone or access to history can still read it. Rotation makes the leaked value useless.",
      },
      {
        q: "Which of these is the first and most common item in the OWASP IoT Top 10?",
        options: ["Lack of physical hardening", "Insecure default settings", "Lack of device management", "Weak, guessable or hard-coded passwords"],
        answer: 3,
        why: "Weak, guessable or hard-coded passwords is number one, and is how Mirai spread.",
      },
      {
        q: "A campus occupancy system needs room headcounts. Which design best follows data minimisation?",
        options: ["Log every phone MAC address seen, forever", "Count devices on the node and send only the count per room", "Send raw BLE scans to the cloud and filter there", "Store MAC addresses encrypted"],
        answer: 1,
        why: "Aggregating at the source means personal identifiers never leave the device. Encrypting stored MACs still collects data the purpose does not need.",
      },
    ],
  },

  "a16-cryptography-and-tls": {
    id: "a16-cryptography-and-tls",
    outcomes: [
      "Choose the right primitive (AES-GCM, SHA-256, HMAC, ECDSA or Ed25519, ECDH) for confidentiality, integrity, authentication and key agreement",
      "Explain why nonce reuse breaks AES-GCM and why you must not invent your own schemes",
      "Describe a TLS 1.2 and 1.3 handshake and what the device must check",
      "Configure TLS on an ESP32 with mbedTLS, choosing between a CA bundle and certificate pinning, and handle the time requirement",
    ],
    blocks: [
      { t: "h", text: "Why engineers need to know which tool does what" },
      { t: "p", text: "You will never implement AES yourself, and you should not. But you will choose between encrypting and signing, decide where a key lives, pick a nonce strategy, and configure a TLS client with a certificate check that either works or silently accepts anyone. Most real cryptographic failures are not broken algorithms; they are correct algorithms used for the wrong job. This lesson gives you the map." },

      { t: "h", text: "Four jobs, four kinds of tool" },
      { t: "table", head: ["Job", "Question it answers", "Primitive", "Key type"], rows: [
        ["Confidentiality", "Can others read it?", "AES (in an AEAD mode such as GCM), ChaCha20-Poly1305", "Shared secret key"],
        ["Integrity", "Was it changed?", "SHA-256 hash (alone, only against accidents)", "None"],
        ["Authentication of data", "Did someone with the key send it, unchanged?", "HMAC-SHA256, or the tag of an AEAD", "Shared secret key"],
        ["Signatures", "Did a specific party send it, provably to anyone?", "ECDSA P-256, Ed25519, RSA-PSS", "Private key signs, public key verifies"],
        ["Key agreement", "How do two parties get a shared key over an open link?", "ECDH (X25519, P-256)", "Each side's key pair"],
      ], caption: "Symmetric tools are fast and need a shared key. Asymmetric tools solve key distribution and give signatures, at higher cost." },

      { t: "h", text: "Symmetric encryption: AES-GCM" },
      { t: "p", text: "AES is a block cipher: a keyed permutation of 128-bit blocks, with 128-bit or 256-bit keys. On its own it encrypts one block; a **mode** turns it into a scheme for messages. Use an **AEAD** (authenticated encryption with associated data) mode, which gives confidentiality and integrity together. **AES-GCM** is the standard choice: it takes a key, a 96-bit **nonce** (number used once), the plaintext, and optional associated data (headers that must be authenticated but not hidden, such as a device ID), and outputs ciphertext of the same length plus a 16-byte tag. Decryption fails if any bit of the ciphertext, tag or associated data changed. The ESP32 has hardware AES and SHA accelerators that mbedTLS uses automatically." },
      { t: "note", kind: "warn", text: "**Never reuse a nonce with the same key in AES-GCM.** GCM is a stream cipher underneath: the keystream depends only on key and nonce. Two messages under the same pair XOR to the XOR of their plaintexts, and an attacker who knows one plaintext reads the other. Worse, nonce reuse leaks the authentication subkey, letting the attacker forge tags. A device that restarts its nonce counter at 0 after every reboot does exactly this. Use a counter stored in NVS with a boot counter, or let TLS handle it." },
      { t: "p", text: "Older modes to recognise and avoid: ECB (identical blocks give identical ciphertext, so patterns show), and CBC without a MAC (vulnerable to padding oracle attacks). If you see `AES/ECB` in a project, it is wrong." },

      { t: "h", text: "Hashes and HMAC" },
      { t: "p", text: "SHA-256 maps any input to a 32-byte digest such that finding two inputs with the same digest, or an input for a given digest, is infeasible. A hash alone detects accidental corruption (and is how a signature is computed over a large image), but it does not authenticate: an attacker who changes a firmware file simply recomputes its hash. **HMAC** mixes a secret key into the hash, `HMAC(K, m) = H((K ⊕ opad) ‖ H((K ⊕ ipad) ‖ m))`, so only someone holding the key can produce a valid tag. You saw it in the replay example. Do not build `SHA256(key ‖ message)` yourself: with SHA-256 that construction is vulnerable to length extension, which is exactly why HMAC's nested form exists." },

      { t: "h", text: "Asymmetric cryptography: signatures and key agreement" },
      { t: "p", text: "Elliptic-curve cryptography gives small keys and fast operations, which suits microcontrollers. A P-256 private key is 32 bytes; its public key 64 bytes (65 with a prefix). **ECDSA** signs a hash with the private key; anyone with the public key verifies. **Ed25519** is a newer signature scheme on Curve25519 that is deterministic (no per-signature random number, removing a classic failure: Sony's PlayStation 3 signing key was recovered in 2010 because ECDSA was used with a constant random value) and fast. **ECDH** lets two parties each combine their own private key with the other's public key to arrive at the same shared secret, which then feeds a key derivation function (HKDF) to produce AES keys. Signatures are what make secure boot and signed OTA possible: the device holds only a public key, so stealing it lets nobody sign firmware." },
      { t: "p", text: "**Do not roll your own.** Designing a protocol from these primitives is where experts go wrong: missing a nonce, authenticating the wrong fields, comparing tags in variable time, using a key for two purposes. Use an established protocol (TLS, DTLS, OSCORE for CoAP, Noise) through a maintained library (mbedTLS, wolfSSL, libsodium, PSA Crypto). If you must compose primitives, as in the replay example, keep it to a well-known pattern and have it reviewed." },

      { t: "h", text: "TLS in one picture" },
      { t: "diagram", text: String.raw`
 TLS 1.3 full handshake (1 round trip)
 device (client)                                    broker (server)
   │── ClientHello: versions, cipher suites,           │
   │   key_share (X25519 public key), SNI ───────────►│
   │                                                    │ choose suite, own key_share
   │◄── ServerHello + key_share ────────────────────────│ both sides now run ECDH
   │◄── {EncryptedExtensions, Certificate,              │ -> handshake keys
   │     CertificateVerify, Finished} ──────────────────│
   │ verify: chain to trusted CA, hostname, dates,      │
   │ signature in CertificateVerify                     │
   │── {Certificate, CertificateVerify} (mutual TLS) ──►│
   │── {Finished} ─────────────────────────────────────►│
   │◄═════════════ application data (AES-GCM) ═════════►│`, caption: "Braces mark encrypted messages. TLS 1.2 needs two round trips and sends the certificates in clear text." },
      { t: "p", text: "TLS 1.3 (RFC 8446, 2018) removed everything old: RSA key transport, CBC suites, renegotiation, and static key exchange. Every connection uses ephemeral ECDH, so recording traffic and stealing the server key later reveals nothing (forward secrecy). TLS 1.2 is still widely deployed and is acceptable with ECDHE and AEAD suites such as `TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256`. The certificate check is the step that makes it secure: without it, encryption protects you perfectly from everyone except the attacker in the middle." },

      { t: "h", text: "TLS on an ESP32" },
      { t: "p", text: "The ESP32's TLS stack is **mbedTLS** (via the `esp-tls` layer in ESP-IDF, and `WiFiClientSecure` / `NetworkClientSecure` in the Arduino core). Constrained-device concerns:" },
      { t: "list", items: [
        "**RAM.** A TLS session needs tens of kilobytes of heap: the handshake peaks highest, and the incoming record buffer defaults to 16 kB because TLS allows records up to 16 kB (ESP-IDF defaults the outgoing buffer to 4 kB). ESP-IDF's `CONFIG_MBEDTLS_DYNAMIC_BUFFER` frees buffers when idle, and the Maximum Fragment Length extension shrinks records when the server supports it. On an ESP32 with about 300 kB of free heap, one or two simultaneous TLS sessions is comfortable.",
        "**Trust anchors.** Choose between a **CA bundle** (ESP-IDF's `esp_crt_bundle` includes common public root CAs, so you can talk to any public server and survive the server changing its certificate) and **pinning** (trust only one specific CA or public key). Pinning your own private CA is the right choice for a fleet talking to your own broker; pinning a public server's leaf certificate is fragile, because it changes every few months and every device stops connecting. If you pin, pin a CA or public key and ship a backup pin.",
        "**Time.** Certificate validity checks need the current date. Get SNTP time before connecting. If time is unavailable, you can only skip date checks knowingly, and that choice belongs in the threat model.",
        "**Hostname.** Set the server name so the certificate's name is checked (and sent as SNI). Connecting by IP address with a certificate issued for a name fails, and the wrong fix is to turn verification off.",
      ] },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 Arduino core 3.x: MQTT over TLS to your own broker, CA pinned.
// Libraries: PubSubClient (MQTT 3.1.1). Board: ESP32 Dev Module.
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <PubSubClient.h>
#include <time.h>

static const char* CA_PEM = R"(-----BEGIN CERTIFICATE-----
...your lab CA certificate (ca.crt) here...
-----END CERTIFICATE-----
)";

NetworkClientSecure net;
PubSubClient mqtt(net);

void waitForTime() {
  configTime(0, 0, "pool.ntp.org");
  time_t now = 0;
  while ((now = time(nullptr)) < 1700000000) {   // before Nov 2023: not set yet
    delay(200);
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin();                 // credentials already stored by provisioning
  while (WiFi.status() != WL_CONNECTED) delay(200);
  waitForTime();                // certificates need a real date
  net.setCACert(CA_PEM);        // trust only our CA: never call setInsecure()
  mqtt.setServer("broker.lab.example", 8883);   // name must match the server cert
  if (mqtt.connect("room-node-0042")) {
    mqtt.publish("campus/b1/r101/room-node-0042/status", "online");
  } else {
    Serial.printf("MQTT connect failed, state %d\n", mqtt.state());
  }
}

void loop() { mqtt.loop(); }`, caption: "For mutual TLS add `net.setCertificate(dev_crt)` and `net.setPrivateKey(dev_key)`, loaded from NVS or a secure element rather than source." },
      { t: "note", kind: "warn", text: "`setInsecure()` in Arduino and `skip_cert_common_name_check` or a missing CA in ESP-IDF turn TLS into encryption to whoever answers. It works on the bench and is a man-in-the-middle hole in the field. Search your code for it before every release." },

      { t: "deep", title: "Why GCM nonce reuse is catastrophic, shown with XOR", blocks: [
        { t: "p", text: "GCM encrypts with counter mode: ciphertext C = P ⊕ KS, where the keystream KS = AES_K(nonce ‖ 2), AES_K(nonce ‖ 3), and so on. Two plaintexts under the same key and nonce give C1 ⊕ C2 = P1 ⊕ P2, with the keystream cancelled. If P1 is a known status message, P2 = C1 ⊕ C2 ⊕ P1." },
        { t: "formula", text: String.raw`C1 = P1 ⊕ KS
C2 = P2 ⊕ KS
C1 ⊕ C2 = P1 ⊕ P2          (KS cancels)
P2 = C1 ⊕ C2 ⊕ P1          (if P1 is known)`, caption: "The same applies to any stream cipher, including ChaCha20." },
        { t: "p", text: "The authentication tag is a polynomial in a secret value H = AES_K(0) evaluated over the ciphertext blocks. Two tags with the same nonce give an equation in H that can be solved, after which the attacker forges tags for any message. With random 96-bit nonces, collisions become likely around 2^48 messages by the birthday bound; NIST SP 800-38D therefore limits random-nonce use to 2^32 messages per key. A device counter is simpler and safe as long as it never repeats, including across reboots and firmware updates." },
      ] },
      { t: "deep", title: "Key sizes, security levels and cost on an ESP32", blocks: [
        { t: "p", text: "Security level is measured in bits of work. AES-128 and P-256 / X25519 both give about 128-bit security; RSA needs a 3072-bit key for the same level, which is why elliptic curves suit small devices. SHA-256 gives 128-bit collision resistance. For long-lived secrets some designers prefer AES-256 to keep a margin against future quantum attacks (Grover's algorithm halves symmetric security), while elliptic-curve and RSA schemes would be broken outright by a large quantum computer. Post-quantum algorithms (ML-KEM, ML-DSA, standardised by NIST in 2024) are arriving in TLS libraries but are large for microcontrollers today." },
        { t: "p", text: "Rough costs on an ESP32 at 240 MHz with mbedTLS: AES-GCM with the hardware accelerator runs at many megabytes per second, so bulk data is never the bottleneck. A P-256 ECDSA verify or ECDH takes on the order of tens of milliseconds in software (newer chips such as the ESP32-C6 and S3 have ECC or big-number accelerators that cut this). A full TLS handshake therefore costs roughly 0.3 to 1 s of CPU and network time, which is why session resumption matters for devices that reconnect often. Measure on your own board; numbers vary with chip, clock and library version." },
      ] },
    ],
    mistakes: [
      "**Using a plain hash to protect firmware.** Anyone who changes the file recomputes the hash. Use a signature or HMAC.",
      "**Resetting an AES-GCM nonce counter on reboot.** Reusing a nonce with the same key reveals plaintexts and allows forgery.",
      "**Calling `setInsecure()` to make TLS work.** It removes the server check, which is the point of TLS.",
      "**Pinning a public server's leaf certificate.** It rotates every few months and the whole fleet goes offline. Pin a CA or key, with a backup.",
      "**Connecting TLS before the clock is set.** Every certificate looks not yet valid. Wait for SNTP.",
      "**Inventing a protocol from primitives.** Use TLS, DTLS or OSCORE through a maintained library.",
    ],
    practice: {
      kind: "bench",
      task: "Prove that your ESP32 TLS client rejects an impostor broker.",
      steps: [
        "Run Mosquitto with TLS using a server certificate signed by your lab CA, and connect your ESP32 with the CA pinned as in the lesson. Confirm it works.",
        "Generate a second, unrelated CA and server certificate with the same hostname. Swap the broker to use it. Show that the ESP32 refuses to connect and capture the error.",
        "Temporarily replace `setCACert` with `setInsecure()` and show that the impostor is now accepted. Restore the pinned CA and note this result in your threat model.",
        "Boot the device with NTP blocked and record what happens. Decide and document how the firmware should behave when time is unavailable.",
        "Measure free heap (`ESP.getFreeHeap()`) before connecting, during the handshake and after, and record the TLS memory cost.",
      ],
    },
    quiz: [
      {
        q: "You need a firmware image that the device can verify came from you, while the device holds no secret. Which primitive?",
        options: ["AES-GCM encryption", "HMAC-SHA256", "An ECDSA or Ed25519 signature verified with a public key", "A SHA-256 hash"],
        answer: 2,
        why: "A signature is verified with a public key, so the device holds nothing secret. HMAC would require the device to hold the signing key.",
      },
      {
        q: "A device encrypts two messages with AES-GCM using the same key and the same nonce. An attacker knows the first plaintext. What can they do?",
        options: ["Nothing; GCM is authenticated", "Recover the second plaintext by XORing the two ciphertexts with the known plaintext", "Only learn the message lengths", "Recover the AES key directly"],
        answer: 1,
        why: "The keystream cancels: C1 ⊕ C2 = P1 ⊕ P2. Knowing P1 gives P2. Nonce reuse also lets the attacker forge tags.",
      },
      {
        q: "Why is pinning your own private CA reasonable for a campus fleet, but pinning a public website's leaf certificate risky?",
        options: ["Public certificates use weaker cryptography", "Leaf certificates of public servers change every few months, which would cut every device off", "Private CAs do not expire", "Pinning only works with TLS 1.2"],
        answer: 1,
        why: "Public servers rotate leaf certificates often. Your own CA changes only when you decide, so pinning it is stable.",
      },
      {
        q: "What gives TLS 1.3 forward secrecy?",
        options: ["Every handshake uses ephemeral ECDH keys that are discarded afterwards", "Longer RSA keys", "The server certificate is encrypted", "AES-256 is mandatory"],
        answer: 0,
        why: "Session keys come from ephemeral key shares. Stealing the server's long-term key later does not let anyone decrypt recorded sessions.",
      },
      {
        q: "Why should a tag be compared with a constant-time function rather than `memcmp`?",
        options: ["It is faster", "memcmp does not work on binary data", "Constant-time functions also decrypt", "memcmp can stop at the first different byte, leaking timing that helps an attacker guess the tag byte by byte"],
        answer: 3,
        why: "Timing differences reveal how many leading bytes matched, which turns a guess of the whole tag into a guess of one byte at a time.",
      },
    ],
  },

  "a16-secure-boot-flash-encryption-and-ota": {
    id: "a16-secure-boot-flash-encryption-and-ota",
    outcomes: [
      "Explain the chain of trust from ROM to application under ESP32 Secure Boot v2",
      "Describe what flash encryption protects, its development and release modes, and why eFuse changes are irreversible",
      "Decide when a secure element such as the ATECC608B is worth adding",
      "Design a secure OTA process with signed images, rollback and anti-rollback, and assemble evidence for a hardened device",
    ],
    blocks: [
      { t: "h", text: "Why the device must protect itself" },
      { t: "p", text: "The previous lessons protected the link. But the attack tree showed the cheapest path to a campus node is physical: read the flash, or write new firmware. Two hardware features close that path on the ESP32. **Secure boot** ensures only firmware you signed runs. **Flash encryption** ensures the contents of the external flash chip are unreadable without a key that never leaves the chip. Together with signed OTA, they make the device trustworthy for its whole life. They also involve one-time-programmable eFuses, so you must understand them before you touch them." },
      { t: "note", kind: "safety", text: "**eFuse changes are permanent.** Burning a secure boot key digest, enabling flash encryption in release mode, or disabling JTAG and download mode cannot be undone. A mistake (wrong key, lost signing key, release mode on a board you still need to debug) can leave a board that only runs one image or never boots again. Practise on a spare, cheap DevKit that you are prepared to lose, follow Espressif's documentation for your exact chip and ESP-IDF version, and keep the signing key backed up offline." },

      { t: "h", text: "Chain of trust and Secure Boot v2" },
      { t: "p", text: "Secure boot is a chain where each stage verifies the next before running it. The first link must be immutable, so it is the **ROM bootloader** inside the chip. It verifies the second-stage bootloader in flash; that bootloader verifies the application. If any signature fails, the chip refuses to run that stage." },
      { t: "diagram", text: String.raw`
 ┌─────────────┐ verifies  ┌──────────────────────┐ verifies  ┌──────────────────┐
 │ ROM (mask,  ├──────────►│ 2nd stage bootloader ├──────────►│ application      │
 │ immutable)  │ signature │ (flash, signed)      │ signature │ (flash, signed)  │
 └──────┬──────┘           └──────────────────────┘           └──────────────────┘
        │ trusts
 ┌──────┴──────────────────────────────┐
 │ eFuse: SHA-256 digest of the public │   the private key never touches the device;
 │ signing key (burned once)           │   it stays on your build machine or an HSM
 └─────────────────────────────────────┘`, caption: "Each image carries a signature block with the public key. The ROM checks that key against the digest in eFuse, then checks the signature." },
      { t: "p", text: "Espressif's **Secure Boot v2** signs images with **RSA-3072 (RSA-PSS)** on most chips; some newer chips (for example the ESP32-C6 and H2) also support **ECDSA** with P-256, and the ESP32-C2 supports only ECDSA. On the original ESP32 it requires chip **revision v3.0 or later**; earlier revisions only have the older, AES-based Secure Boot v1, which is not recommended. The ESP32-S2, S3, C3 and later support up to three key digests, so a compromised key can be revoked and replaced by another. You enable it in menuconfig (Security features), sign images with `espsecure.py` or let the build sign them with your key file, and the first boot burns the key digest into eFuse." },

      { t: "h", text: "Flash encryption" },
      { t: "p", text: "The ESP32's firmware and data live in an external SPI flash chip that can be desoldered or read over UART. **Flash encryption** encrypts its contents with a key stored in eFuse that is read-protected: software cannot read it, only the hardware decryption engine that sits between the CPU cache and the flash uses it. Reads through the cache are transparently decrypted, so code runs normally; a raw dump is ciphertext. The ESP32-S2, S3, C3 and later use **AES-XTS** (AES-128 or AES-256); the original ESP32 uses AES-256 with a per-block tweak of Espressif's own design. NVS needs its own encryption (the NVS encryption feature, with keys in an encrypted partition or derived from an HMAC eFuse key on newer chips), because NVS is written at runtime." },
      { t: "table", head: ["Mode", "What it allows", "Use for"], rows: [
        ["Development", "Reflashing plaintext images over UART a limited number of times, the bootloader encrypts them; UART download remains available", "Learning and testing on a spare board"],
        ["Release", "UART download mode restricted, eFuses write-protected; updates only by OTA of encrypted images", "Production devices"],
      ], caption: "On the original ESP32 the number of times flash encryption can be toggled in development mode is limited by a small eFuse counter. Read the documentation for your chip before experimenting." },
      { t: "p", text: "Use secure boot and flash encryption **together**. Flash encryption alone keeps secrets confidential, but an attacker could still write junk or a chosen ciphertext; secure boot alone stops tampered firmware, but leaves secrets readable. Espressif recommends enabling both for production, and disabling JTAG (eFuse) as part of that." },

      { t: "h", text: "Secure elements" },
      { t: "p", text: "A **secure element** is a small separate chip that stores private keys and performs cryptographic operations internally, so the key never appears on the bus or in the ESP32's memory. Microchip's **ATECC608B** (the earlier ATECC608A is not recommended for new designs) is a common example: an I2C device with 16 key slots, hardware P-256 ECDSA and ECDH, SHA-256 and HMAC, a hardware random number generator, monotonic counters, and protection against physical probing and fault attacks. Variants come pre-provisioned with keys and certificates (Microchip's Trust and Go and TrustFLEX), which fits the factory-provisioning model of a15. Espressif's ESP32-WROOM-32SE module integrates an ATECC608 secure element, and the `esp-cryptoauthlib` component connects it to mbedTLS so a TLS handshake signs with the secure element." },
      { t: "p", text: "Is it worth it? For a campus temperature sensor, flash encryption plus secure boot is sufficient. For a device whose key unlocks doors, authorises payments, or identifies a product you sell in thousands, a secure element is cheap insurance (around a dollar in volume) against key extraction by fault injection. Newer ESP32 chips also include a **Digital Signature peripheral** and HMAC peripheral that use eFuse keys without exposing them to software, a middle ground worth reading about." },

      { t: "h", text: "Secure OTA" },
      { t: "p", text: "In i11 you used OTA with two app partitions (`ota_0`, `ota_1`) and the `otadata` partition that chooses between them. Making it secure adds four things." },
      { t: "list", ordered: true, items: [
        "**Authenticated transport.** Download over HTTPS with the server certificate checked (`esp_https_ota`), so nobody can serve you an image. This alone is not enough, because the server could be compromised.",
        "**Signed images.** With secure boot v2 enabled, the OTA code verifies the new image's signature before marking it bootable, and the bootloader verifies it again at boot. Without secure boot, ESP-IDF can still check signatures on OTA images (`CONFIG_SECURE_SIGNED_APPS_NO_SECURE_BOOT`). Sign on a build machine that holds the key, never on a developer laptop that holds everything else.",
        "**Rollback.** With `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`, a new image boots in a pending-verify state. Your application runs a self-test (Wi-Fi joins, broker connects, sensor reads) and calls `esp_ota_mark_app_valid_cancel_rollback()`. If it crashes or resets before that, the bootloader returns to the previous image. This protects against bricking a fleet with a bad release.",
        "**Anti-rollback.** An attacker could install an old, validly signed image that has a known vulnerability. With `CONFIG_BOOTLOADER_APP_ANTI_ROLLBACK`, each image carries a `secure_version` number and the device records the highest accepted one in eFuse; the bootloader refuses images with a lower number. Increase `secure_version` only for releases that fix security issues, because the eFuse field has a limited number of bits.",
      ] },
      { t: "snippet", lang: "c", code: String.raw`// ESP-IDF 5.x: confirm a new OTA image only after it proves itself.
#include "esp_ota_ops.h"
#include "esp_log.h"

static const char *TAG = "ota_check";

bool self_test(void);   // your checks: Wi-Fi up, MQTT connected, sensor reads sane

void confirm_running_image(void)
{
    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_ota_img_states_t state;
    if (esp_ota_get_state_partition(running, &state) == ESP_OK &&
        state == ESP_OTA_IMG_PENDING_VERIFY) {
        if (self_test()) {
            ESP_LOGI(TAG, "self-test passed, keeping new image");
            esp_ota_mark_app_valid_cancel_rollback();
        } else {
            ESP_LOGE(TAG, "self-test failed, rolling back");
            esp_ota_mark_app_invalid_rollback_and_reboot();
        }
    }
}`, caption: "Call this early in `app_main` once networking is up. Needs CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE." },
      { t: "p", text: "Roll out in stages: a few devices first, then 10%, then everyone, with health metrics from a15 (reboot reason, version, last seen) watched between stages. A signed, staged, self-testing OTA with anti-rollback is what the CRA and ETSI EN 303 645 mean by a secure update mechanism." },

      { t: "h", text: "The exit project: threat model and hardening with evidence" },
      { t: "p", text: "Take an earlier connected project of yours. Deliver its threat model (lesson 1), then harden it and show evidence for every mitigation, because a claim without evidence is not a security control. Evidence looks like: a flash dump that is ciphertext (and the same dump before, showing your Wi-Fi password), a log of the device refusing an unsigned or modified image, a log of it refusing an impostor broker, broker logs showing a device denied publishing outside its topic, a replayed command rejected, an OTA rollback after a deliberately failing self-test, and a gitleaks report on your repository. Record residual risks you accepted and why." },

      { t: "deep", title: "Enabling secure boot v2 and flash encryption step by step (on a spare board)", blocks: [
        { t: "p", text: "This outline follows the ESP-IDF 5.x documentation for the ESP32-S3 and C3 and is for orientation only: read the Secure Boot v2 and Flash Encryption guides for your exact chip and IDF version before doing it, and use a board you can lose." },
        { t: "snippet", lang: "bash", code: String.raw`# 1. Generate and back up the signing key (keep it off the device and out of git)
espsecure.py generate_signing_key --version 2 --scheme rsa3072 secure_boot_signing_key.pem

# 2. In idf.py menuconfig  ->  Security features:
#      Enable hardware Secure Boot in bootloader (v2)
#      Sign binaries during build, key = secure_boot_signing_key.pem
#      Enable flash encryption on boot, mode = Development (first time)
#      Enable app rollback / anti-rollback in Bootloader config if wanted
idf.py menuconfig

# 3. Secure boot: the bootloader is flashed separately the first time
idf.py bootloader          # prints the exact esptool command to flash it
idf.py flash monitor       # first boot burns eFuses, encrypts flash, reboots

# 4. Check the eFuse state
espefuse.py summary`, caption: "Commands as documented for ESP-IDF 5.x. Release mode and JTAG disable are further, irreversible steps." },
        { t: "p", text: "After enabling, check: `espefuse.py summary` shows the key digest and the flash encryption counter; `esptool.py read_flash` returns data with no readable strings; an image signed with a different key is rejected by the bootloader with a signature error. Those three outputs are evidence for the exit project." },
      ] },
      { t: "deep", title: "What anti-rollback costs and how to number releases", blocks: [
        { t: "p", text: "The `secure_version` eFuse field is a thermometer code: each increment burns one more bit, so a field of 16 bits (the size differs by chip; on the original ESP32 it is up to 32 bits) allows only that many security-relevant increments in the device's lifetime. Keep two version numbers: the ordinary semantic version (1.4.2) that changes every release, and `secure_version`, which changes only when an older image must never run again. Most releases leave it unchanged." },
        { t: "p", text: "Order matters during OTA: the device should only burn the new `secure_version` after the new image has passed its self-test and been marked valid, otherwise a failed update could leave the device refusing both images. ESP-IDF performs this update at the point of marking the app valid. The same reasoning applies to secure element counters and to any monotonic counter used for replay protection: increment only after the new state is confirmed." },
      ] },
    ],
    mistakes: [
      "**Experimenting with eFuses on the only board you have.** The changes are permanent; use a spare.",
      "**Losing the secure boot signing key.** Devices will never accept another update. Back it up offline in more than one place.",
      "**Enabling flash encryption without secure boot.** Secrets are hidden, but tampered firmware can still be written. Use both.",
      "**Trusting HTTPS alone for OTA.** A compromised server can still serve a malicious image. Verify a signature on the device.",
      "**Marking a new image valid before testing it.** A broken release then cannot roll back. Self-test first.",
      "**Incrementing `secure_version` on every release.** The eFuse field runs out. Increment only for security fixes.",
    ],
    practice: {
      kind: "bench",
      task: "Harden your earlier connected project and collect evidence for each mitigation.",
      steps: [
        "Before changing anything, record the baseline: a flash dump with your Wi-Fi password visible, the broker accepting an unauthorised publish, and any secrets found in git.",
        "On a spare ESP32 board, enable secure boot v2 and flash encryption in development mode following Espressif's guide for your chip. Record `espefuse.py summary`.",
        "Show that a new flash dump contains no readable secrets and that an image signed with a different key is rejected.",
        "Enable OTA rollback, release a build whose self-test deliberately fails, and capture the device rolling back. Then release a good build and show it is kept.",
        "Combine the threat model, the before and after evidence, and a list of accepted residual risks into one report.",
      ],
    },
    quiz: [
      {
        q: "Why must the first link in a secure boot chain be the ROM?",
        options: ["It is immutable, so an attacker cannot replace the code that does the first verification", "ROM is the fastest memory", "ROM holds the private signing key", "Flash cannot store signatures"],
        answer: 0,
        why: "If the first verifier could be modified, an attacker would modify it to skip verification. Mask ROM cannot be changed.",
      },
      {
        q: "A board has flash encryption enabled but secure boot disabled. What can an attacker with UART access still do?",
        options: ["Read the Wi-Fi password in plain text", "Read the flash encryption key", "Write modified or junk firmware to flash", "Nothing"],
        answer: 2,
        why: "Encryption protects confidentiality, not which code runs. Without secure boot the device may still accept new images, which is why both are used together.",
      },
      {
        q: "An attacker installs last year's genuinely signed firmware, which has a known vulnerability. Which feature prevents this?",
        options: ["Rollback", "HTTPS download", "Flash encryption", "Anti-rollback with a secure_version in eFuse"],
        answer: 3,
        why: "The image's signature is valid, so only a version floor recorded in eFuse stops it. Rollback is the opposite feature: going back after a failed update.",
      },
      {
        q: "A new OTA image boots, but cannot connect to the broker, and the device resets before calling `esp_ota_mark_app_valid_cancel_rollback()`. With rollback enabled, what happens?",
        options: ["The device is bricked", "The bootloader returns to the previous image", "It keeps retrying the new image forever", "It erases both partitions"],
        answer: 1,
        why: "An image left in pending-verify state that resets is treated as failed, and the bootloader boots the previous valid image.",
      },
      {
        q: "What is the main advantage of an ATECC608B secure element over storing the device key in encrypted flash?",
        options: ["The private key is generated and used inside the chip and never appears in the ESP32's memory or on the bus", "It makes TLS faster than the ESP32 hardware", "It removes the need for certificates", "It provides Wi-Fi provisioning"],
        answer: 0,
        why: "With a secure element, signing happens inside the chip. Even a full compromise of the ESP32 software cannot copy the key out.",
      },
    ],
  },
};

export default lessons;
