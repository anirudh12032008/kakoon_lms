import type { ModuleContent } from "../model/curriculum";

/**
 * Module a15: IoT systems at scale.
 * Normal mode is complete on its own; `deep` holds derivations and detail.
 * Numbers in worked examples were checked with Python. No long dashes.
 */
const lessons: ModuleContent = {
  "a15-architecture-and-protocol-choice": {
    id: "a15-architecture-and-protocol-choice",
    outcomes: [
      "Assign responsibilities to the device, edge, gateway and cloud tiers of an IoT system and justify each choice",
      "Draw a reference architecture for a sensing network and name the interface between every pair of tiers",
      "Choose between MQTT 3.1.1, MQTT 5, CoAP, HTTP and LwM2M for a given device and traffic pattern",
      "Explain which MQTT 5 features solve real fleet problems that 3.1.1 could not",
    ],
    blocks: [
      { t: "h", text: "Why one working device is not a system" },
      { t: "p", text: "In the intermediate tier you connected an ESP32 to Wi-Fi, published readings over MQTT and drew them on a dashboard. That is one device you can see, reset and reflash by hand. A campus sensing network has five hundred of them in rooms you cannot get into after 6 pm, on a Wi-Fi network you do not run, reporting to software that must stay up while you sleep. Everything that was a convenience on the bench (a hard-coded password, a serial log, a reflash over USB) becomes a failure mode at scale. This module is about the decisions that make the difference: who does what, which protocol carries it, how devices get identities, what happens when the network goes away, and what it all costs." },
      { t: "p", text: "Start with responsibilities. An IoT system has four kinds of place where computation can happen, and good designs put each job in the place that suits it." },

      { t: "h", text: "The four tiers" },
      { t: "list", items: [
        "**Device (end node).** The microcontroller with the sensor or actuator. It is cheap, numerous, power-limited and physically exposed. Its jobs: sample correctly, timestamp, do the minimum local processing that saves energy or bandwidth (averaging, thresholds, compression), buffer when offline, and accept configuration and firmware updates. It should not hold business logic that changes often.",
        "**Gateway.** A bridge between a local network the device speaks (BLE, LoRa, Zigbee, Modbus RS-485, Thread) and IP. A LoRaWAN gateway forwards radio packets; a Modbus gateway polls meters and publishes over MQTT. Gateways translate protocols and usually hold no long-term state.",
        "**Edge.** A more capable computer close to the devices (a Raspberry Pi, an industrial PC, a server in the department) that runs real software: a local broker, rules that must act within milliseconds or keep working when the internet link is down, data reduction before upload, and sometimes ML inference on data too big to send. Gateway and edge are often the same box, but the roles differ: translation versus computation.",
        "**Cloud (or central server).** Long-term storage, fleet management, analytics across all devices, dashboards, user accounts and integration with other systems. It has effectively unlimited compute but is far away in latency and depends on the link.",
      ] },
      { t: "p", text: "A useful test for placing a function is to ask three questions. **Latency:** must it react faster than a round trip to the cloud (typically 50 to 300 ms, and unbounded when the link is down)? Then it belongs at the device or edge. **Scope:** does it need data from many devices (a building-wide average, anomaly detection across a fleet)? Then it belongs at the edge or cloud. **Change rate:** will the logic change monthly? Then keep it off the device, where every change costs an OTA update to hundreds of units." },

      { t: "h", text: "A reference architecture" },
      { t: "diagram", text: String.raw`
 DEVICES                 GATEWAY / EDGE                    CLOUD (or campus server)
 ┌──────────────┐ Wi-Fi  ┌──────────────────────┐  MQTT/TLS ┌─────────────────────────┐
 │ ESP32 + SHT40├───────►│                      ├──────────►│ Broker / IoT hub        │
 │ (room node)  │ MQTT   │  Local MQTT broker   │  bridge   │   │                     │
 └──────────────┘ TLS    │  Rules (alarms)      │           │   ▼                     │
 ┌──────────────┐ BLE    │  Buffer when offline │           │ Ingest + validation     │
 │ BLE tag      ├───────►│  Protocol adapters   │           │   │                     │
 └──────────────┘        │                      │           │   ├─► Time-series DB    │
 ┌──────────────┐ RS-485 │                      │           │   ├─► Object store (raw)│
 │ Energy meter ├───────►│  Modbus RTU poller   │           │   └─► Rules / alerts    │
 └──────────────┘ Modbus └──────────────────────┘           │ Fleet mgmt: identity,   │
                                                            │ config, OTA, health     │
                                       ◄── config, OTA ─────┤ Dashboards, API         │
                                                            └─────────────────────────┘`, caption: "A campus sensing network. Each arrow is an interface you must specify: transport, payload format, security, and what happens when it fails." },
      { t: "p", text: "The value of drawing this is the arrows, not the boxes. For each arrow, an architecture document states the protocol, the payload schema, how the two ends authenticate each other, the expected message rate, and the behaviour when the link fails. You will write exactly that for the exit project." },

      { t: "h", text: "Choosing a protocol" },
      { t: "p", text: "You already know MQTT (publish and subscribe through a broker over TCP) and HTTP (request and response). Two more matter at scale. **CoAP** (Constrained Application Protocol, RFC 7252) is REST over UDP: it has GET, PUT, POST and DELETE like HTTP, but with a 4-byte binary header, optional reliability through confirmable messages, and the Observe extension (RFC 7641) for server-pushed updates. It is designed for devices that sleep and for lossy networks such as Thread and 6LoWPAN. **LwM2M** (Lightweight M2M, from OMA SpecWorks) is not a transport but a device-management standard that usually runs over CoAP. It defines a standard object model (Device, Firmware Update, Connectivity Monitoring, and IPSO sensor objects such as Temperature, object 3303) so a generic server can read, configure and update any compliant device without custom code." },
      { t: "table", head: ["Property", "MQTT 3.1.1", "MQTT 5", "CoAP", "HTTP/1.1", "LwM2M"], rows: [
        ["Transport", "TCP (TLS)", "TCP (TLS)", "UDP (DTLS)", "TCP (TLS)", "CoAP over UDP/DTLS (also TCP, SMS)"],
        ["Pattern", "Pub/sub via broker", "Pub/sub via broker", "Request/response plus Observe", "Request/response", "Client/server management"],
        ["Minimum header", "2 bytes", "2 bytes plus properties", "4 bytes", "Text headers, often 200+ bytes", "CoAP header"],
        ["Delivery guarantee", "QoS 0, 1, 2", "QoS 0, 1, 2 plus reason codes", "Confirmable or not", "TCP plus app retry", "Via CoAP"],
        ["Sleepy devices", "Poor: needs a live TCP session", "Better: session expiry", "Good", "Poor", "Good, with queue mode"],
        ["Device management built in", "No", "No", "No", "No", "Yes: standard objects, FOTA"],
        ["Best fit", "Simple telemetry, wide tooling", "Fleets needing errors, expiry, shared subs", "Battery nodes on lossy links", "Occasional uploads, existing web APIs", "Large heterogeneous fleets, cellular"],
      ], caption: "No protocol wins everywhere. Choose from traffic pattern, power budget and the management you need." },
      { t: "p", text: "A practical rule: use **MQTT** for mains-powered or frequently waking Wi-Fi devices sending telemetry, because the ecosystem is huge and every cloud speaks it. Use **CoAP or LwM2M** for battery devices on NB-IoT, LTE-M or Thread, where keeping a TCP session alive costs too much energy and UDP round trips are cheaper. Use **HTTP** when a device uploads a file a few times a day, or when it must call an existing web API. Do not pick a protocol because a tutorial used it." },

      { t: "h", text: "What MQTT 5 adds and why fleets need it" },
      { t: "p", text: "MQTT 3.1.1 (2014) works, but it is silent when things go wrong: a rejected publish just disappears. MQTT 5 (2019) fixes the problems that appear with many devices:" },
      { t: "list", items: [
        "**Reason codes on every acknowledgement.** A device learns that a publish failed because of a quota or a bad topic, rather than guessing.",
        "**Session expiry interval.** In 3.1.1 a persistent session lasts forever or not at all; with 5 the broker drops a dead device's queued messages after, say, one day, which stops the broker filling with messages for devices that were scrapped.",
        "**Message expiry.** A command such as \"open valve\" can expire after 30 s so a device that reconnects an hour later does not act on it.",
        "**Shared subscriptions** (`$share/group/topic`). Several backend workers split the stream for load balancing. Without them, every worker gets every message.",
        "**Topic aliases** replace long topic strings with a 2-byte number after first use, saving bandwidth on small payloads.",
        "**User properties and content type**, so you can carry a schema version or trace ID without changing the payload.",
        "**Request/response** properties (response topic, correlation data) for commands that need replies.",
      ] },
      { t: "note", kind: "tip", text: "Most brokers (Mosquitto, EMQX, HiveMQ, and the managed cloud services) accept both versions at once, so a fleet can migrate device by device. Check what your device library supports: PubSubClient on Arduino is 3.1.1 only, while ESP-IDF's `esp-mqtt` client supports MQTT 5 when enabled in menuconfig." },

      { t: "h", text: "Topic and payload design" },
      { t: "p", text: "Topic structure is architecture. A good scheme puts the most general part first and the device identity in a fixed position, so access rules and subscriptions can use wildcards: `campus/<building>/<room>/<deviceId>/telemetry`, with sibling topics `.../status`, `.../cmd` and `.../cmd/resp`. Put the device ID in the topic, not only in the payload, so the broker can enforce \"device X may only publish under its own ID\". Version the payload (`\"v\": 2` or an MQTT 5 user property), always include a device timestamp and sequence number, and use SI units in field names (`temp_c`, `rh_pct`). The next lessons rely on these fields." },

      { t: "deep", title: "Counting bytes: MQTT versus CoAP versus HTTP for one reading", blocks: [
        { t: "p", text: "Take a 40-byte JSON payload sent once. MQTT 3.1.1 PUBLISH at QoS 0: 1 byte of fixed header, 1 byte remaining length, 2 bytes of topic length, a 40-byte topic, and the 40-byte payload, so 84 bytes. With an MQTT 5 topic alias after the first message, the topic shrinks to zero length plus a 3-byte alias property, so about 47 bytes. CoAP non-confirmable POST to `/t`: 4-byte header, a token of up to 8 bytes (say 2), a 2-byte Uri-Path option, 1-byte payload marker and the payload, so about 49 bytes over UDP." },
        { t: "p", text: "Now the transport. TCP and IPv4 add 40 bytes per segment, UDP and IPv4 add 28. TLS 1.2 adds a 5-byte record header plus about 24 bytes for AES-GCM (8-byte explicit nonce and 16-byte tag), DTLS 1.2 adds 13 bytes of header and the same 24. But the real difference is session cost: MQTT keeps a TCP connection open, which needs keepalive PINGREQ packets (2 bytes plus 40 bytes of TCP/IP plus TLS overhead) and a full TLS handshake of several kilobytes after every reconnect. A device that sleeps for ten minutes and reconnects each time can spend more energy on the handshake than on all its data. That is the real reason battery devices prefer CoAP over DTLS with session resumption, or LwM2M queue mode." },
        { t: "p", text: "HTTP is worst for small messages: a minimal POST with Host, Content-Type and Content-Length headers is about 120 bytes of headers before the payload, plus the response. It is fine when the payload is 50 kB." },
      ] },
      { t: "deep", title: "Where LwM2M objects come from", blocks: [
        { t: "p", text: "LwM2M addresses everything with a path `/object/instance/resource`. Object 3 is Device (resource 0 manufacturer, 3 firmware version, 4 reboot). Object 5 is Firmware Update: the server writes a package URI to resource 1, executes resource 2 to apply it, and watches resource 3 (state) and 5 (result). Object 3303 is an IPSO Temperature sensor, resource 5700 being the current value. Because these numbers are registered with OMA, a server such as Eclipse Leshan, or a commercial device-management platform, can manage devices it has never seen before." },
        { t: "p", text: "The cost is complexity on the device: an LwM2M client (Eclipse Wakaama, Anjay, or the Zephyr RTOS LwM2M stack) is far bigger than an MQTT client. For a single-vendor Wi-Fi fleet, MQTT plus your own management topics is usually simpler. For a cellular fleet from several vendors, LwM2M saves you writing and maintaining that layer." },
      ] },
    ],
    mistakes: [
      "**Putting business logic on the device.** A threshold that facilities staff want to change monthly should live in the cloud or edge, not in firmware that needs an OTA update to change.",
      "**Choosing MQTT for a battery device that sleeps for minutes.** Reconnecting TCP and TLS every wake can dominate the energy budget; CoAP or LwM2M with DTLS session resumption is often far cheaper.",
      "**Device identity only inside the payload.** The broker cannot then enforce per-device publish permissions. Put the ID in the topic.",
      "**No payload version field.** The first schema change breaks every consumer at once. Add `v` from day one.",
      "**Drawing boxes but not specifying arrows.** An architecture without protocol, auth, rate and failure behaviour per interface is a picture, not a design.",
    ],
    practice: {
      kind: "bench",
      task: "Write the first page of your campus sensing network architecture document.",
      steps: [
        "List the sensors you will deploy (for example, temperature and humidity in 20 rooms, CO2 in 5, an energy meter on one distribution board) with sample rate and payload size for each.",
        "Draw the tier diagram for your design in the style of the lesson. Mark which device talks to which gateway or broker.",
        "For every arrow, fill a table row: protocol and version, payload format and schema version, authentication method, message rate, and behaviour when the link fails.",
        "Write your topic scheme, with one example topic per message type (telemetry, status, command, command response).",
        "Justify, in two sentences each, the tier where you placed (a) the over-temperature alarm and (b) the monthly energy report.",
      ],
    },
    quiz: [
      {
        q: "A lab's fume-hood airflow alarm must sound within 200 ms of the flow dropping, even if the campus internet link is down. Where should the alarm logic run?",
        options: ["In the cloud, because it has the most compute", "At the device or the local edge", "In the dashboard, because users see it there", "In the time-series database as a trigger"],
        answer: 1,
        why: "The latency requirement and the need to work without the internet link both point to the device or edge. A cloud round trip is slow and disappears when the link does.",
      },
      {
        q: "Which MQTT 5 feature stops a broker from keeping queued messages forever for a device that has been scrapped?",
        options: ["Topic aliases", "Shared subscriptions", "Session expiry interval", "User properties"],
        answer: 2,
        why: "Session expiry tells the broker how long to keep a disconnected client's session and queued messages. In 3.1.1 a persistent session never expires.",
      },
      {
        q: "A battery-powered NB-IoT water meter wakes every 15 minutes to send 20 bytes. Which protocol fits best?",
        options: ["HTTP/1.1 POST over TLS", "MQTT 3.1.1 with a persistent TCP connection", "CoAP or LwM2M over UDP with DTLS", "MQTT 5 with QoS 2"],
        answer: 2,
        why: "Holding a TCP session open or re-handshaking TLS every wake costs energy. CoAP and LwM2M run over UDP and suit sleepy cellular devices; LwM2M also gives standard firmware update objects.",
      },
      {
        q: "Why should the device ID appear in the MQTT topic and not only in the payload?",
        options: ["It makes the payload smaller", "The broker can enforce access rules per device using the topic, which it can see without parsing payloads", "MQTT requires it", "It improves QoS"],
        answer: 1,
        why: "Broker ACLs match on topics. With the ID in a fixed topic position, a rule can say a device may only publish under its own ID.",
      },
      {
        q: "Four backend workers each subscribe to `campus/+/+/+/telemetry` under MQTT 3.1.1. What happens to each message?",
        options: ["It goes to one worker chosen at random", "It goes to all four workers, so work is duplicated", "It is dropped because of the conflict", "It goes to the first worker that subscribed"],
        answer: 1,
        why: "In plain pub/sub every subscriber receives every matching message. Load sharing needs MQTT 5 shared subscriptions (`$share/group/...`).",
      },
    ],
  },

  "a15-identity-provisioning-and-fleets": {
    id: "a15-identity-provisioning-and-fleets",
    outcomes: [
      "Explain why every device needs its own identity and how per-device X.509 certificates provide it",
      "Compare factory provisioning, claim certificates and just-in-time registration",
      "Describe how an ESP32 receives Wi-Fi credentials in the field without hard-coding them",
      "List the functions of a fleet management system and evaluate managed and self-hosted options without lock-in",
    ],
    blocks: [
      { t: "h", text: "Why shared secrets fail at scale" },
      { t: "p", text: "The quickest way to connect fifty devices is to flash them all with the same MQTT username and password. It works until one device is stolen from a corridor. Its flash can be read out in minutes, and now an attacker can publish as every device on campus. You cannot revoke the credential without reflashing the other forty-nine. You also cannot tell, from the broker logs, which device sent what. **Identity** means each device has a credential that is unique to it, that the backend can individually authorise, rate-limit and revoke, and that ideally never leaves the device." },

      { t: "h", text: "Per-device X.509 certificates" },
      { t: "p", text: "The standard answer is mutual TLS with a certificate per device. Each device has a private key (an ECDSA P-256 key is typical: 32 bytes) and a certificate: a document, signed by a certificate authority (CA) you control, that binds the matching public key to a name such as `CN=room-node-0042`. During the TLS handshake the broker proves itself to the device with its server certificate, and the device proves itself by signing handshake data with its private key and presenting its certificate. The broker checks the certificate chains to your CA and then maps the common name to permissions. Lesson a16 covers the cryptography; here, care about the operations it enables:" },
      { t: "list", items: [
        "**Authorise per device.** The broker policy can say `room-node-0042` may publish only to `campus/+/+/room-node-0042/#`.",
        "**Revoke per device.** Mark one certificate as revoked in the registry; the others are untouched.",
        "**No secret travels.** Only the public certificate is sent. Ideally the private key is generated on the device and never exported, or lives in a secure element.",
      ] },
      { t: "p", text: "Where does the key come from? Best practice is that the device generates its own key pair, produces a **certificate signing request** (CSR) containing the public key, and your CA signs it. The private key never exists anywhere else. Worse but common: a script on a PC generates key and certificate together and flashes both, which means the private keys existed on that PC." },

      { t: "h", text: "Three provisioning models" },
      { t: "table", head: ["Model", "How it works", "Good for", "Weakness"], rows: [
        ["Factory provisioning", "Each device gets its unique key and certificate on the production line, before shipping", "Large runs with a controlled factory", "Needs a secure process at the factory; certificates are fixed early"],
        ["Claim certificate (fleet provisioning)", "All devices ship with one shared, low-privilege claim certificate that can only call a provisioning API; on first boot the device generates a key, sends a CSR, and receives its own certificate", "Small teams; devices flashed by a generic image", "The claim credential is shared, so it must be tightly limited and rotated"],
        ["Just-in-time registration", "Devices carry certificates signed by your own CA; the cloud registers each new certificate automatically on first connection after checking the CA", "Fleets where you run your own CA", "You must protect the CA key very carefully"],
      ], caption: "Names vary by vendor: AWS IoT Core calls the second model fleet provisioning by claim, Azure uses the Device Provisioning Service with enrollment groups." },
      { t: "p", text: "For a campus project, the claim model is realistic. One firmware image is flashed to every board. On first boot each board creates its key, calls the provisioning topic with a CSR and its MAC-derived serial number, and the backend checks the serial against an allow-list of boards you actually bought before signing. The claim credential can do nothing else." },

      { t: "h", text: "Getting Wi-Fi credentials into the device" },
      { t: "p", text: "Hard-coding the SSID and password in source has two problems: it ends up in git, and it ties the firmware to one network. Field provisioning solves both. On first boot (or when a button is held), the device enters a provisioning mode, a phone app connects to it over BLE or a temporary soft access point, and sends the network credentials over an encrypted, authenticated session. The device stores them in NVS (non-volatile storage) and reboots into normal mode." },
      { t: "p", text: "Espressif provides this as a ready-made component with matching Android and iOS apps (ESP BLE Prov and ESP SoftAP Prov). In ESP-IDF 5.x it is the built-in `wifi_provisioning` component. In **ESP-IDF 6.0 it was removed from the framework** and now lives in the separate managed component `espressif/network_provisioning`, with the APIs renamed from `wifi_prov_*` to `network_prov_*`. The Arduino-ESP32 core wraps the older API as the `WiFiProv` library. Use **security version 2**, which runs SRP6a so that a proof-of-possession code printed on the device (or a username and password) authenticates the phone; security 0 sends the password in plain text and is for debugging only. In IDF 6.0, versions 0 and 1 are disabled by default for that reason." },
      { t: "snippet", lang: "text", code: String.raw`First boot sequence for a campus node
1. Boot. NVS has no Wi-Fi credentials  ->  start BLE provisioning, name "PROV_0042",
   proof-of-possession code from the label on the case (security 2).
2. Technician's phone app connects, sends SSID and password over the SRP6a session.
3. Device stores credentials in NVS, joins Wi-Fi, gets time over SNTP.
4. No device certificate in NVS  ->  generate P-256 key pair, build CSR with CN=serial.
5. Connect with the claim certificate, publish CSR to the provisioning topic.
6. Backend checks the serial is on the purchase allow-list, signs, returns certificate.
7. Device stores certificate, disconnects, reconnects with its own identity.
8. Normal operation. The claim credential is never used again.`, caption: "Wi-Fi provisioning and certificate provisioning are separate steps. Steps 4 to 7 need correct time (step 3) to validate certificates." },
      { t: "note", kind: "warn", text: "Campus Wi-Fi is often WPA2-Enterprise (802.1X with a username per person). An ESP32 can join such networks (`esp_eap_client` in ESP-IDF 5.x), but using a student's personal campus login in a device is both a policy breach and a security problem. Ask the network administrators for a separate IoT SSID or a device account." },

      { t: "h", text: "Fleet management" },
      { t: "p", text: "Once devices have identities, a **registry** records each one: ID, certificate fingerprint, hardware revision, location, owner, firmware version and last-seen time. On top of the registry, a fleet management system provides:" },
      { t: "list", items: [
        "**Desired and reported state** (AWS calls it a device shadow, Azure a device twin, ThingsBoard shared and client attributes). The backend writes `desired: {interval_s: 60}`; the device applies it when next online and reports `reported: {interval_s: 60}`. The difference tells you which devices have not caught up.",
        "**Jobs** that run across groups of devices: OTA update to version 1.4.2 for all nodes in building B, 10% first.",
        "**Health monitoring**: last seen, reboot count and reason, free heap, RSSI, battery voltage, published on a status topic.",
        "**Grouping and tags**, so you can address \"all CO2 sensors in hostels\" without listing IDs.",
        "**Revocation and decommissioning**.",
      ] },
      { t: "p", text: "You can buy this or run it. Managed services include **AWS IoT Core** (with Device Shadow, Jobs and fleet provisioning) and **Azure IoT Hub** (with device twins and the Device Provisioning Service; Microsoft has announced the retirement of the higher-level Azure IoT Central product, so check the current status before building on it). Self-hosted options include **ThingsBoard** (open-source community edition: device registry, attributes, rules, dashboards), **Eclipse Mosquitto** (a small, open-source broker with no fleet features), **EMQX** (a high-capacity broker; note that from version 5.9 it moved to the Business Source License, which is source-available but restricts some commercial uses, while earlier versions remain Apache 2.0), and **Eclipse Hono** or **Leshan** for device connectivity and LwM2M. Licences and product lines change, so check them when you start a project." },
      { t: "p", text: "The engineering point is to keep your options open. Use standard protocols (MQTT, TLS with X.509, LwM2M) on the device, so the firmware does not depend on a vendor SDK. Keep vendor-specific glue (shadow topic names, provisioning APIs) in one small module. Keep your raw data in an open format you can export. Then moving from a campus Mosquitto plus ThingsBoard prototype to a managed service, or back, is a backend change and not a firmware recall." },

      { t: "deep", title: "What is actually inside a device certificate", blocks: [
        { t: "p", text: "An X.509 v3 certificate holds a serial number, the issuer name, a validity period (not before, not after), the subject name, the subject public key, extensions, and the issuer's signature over all of that. Extensions that matter for devices: **Basic Constraints** `CA:FALSE` (this certificate cannot sign others), **Key Usage** `digitalSignature`, and **Extended Key Usage** `clientAuth`. A P-256 device certificate in DER form is typically 400 to 600 bytes, which fits easily in NVS." },
        { t: "snippet", lang: "bash", code: String.raw`# A tiny private CA for a lab fleet (OpenSSL 3). Keep ca.key offline.
openssl ecparam -name prime256v1 -genkey -noout -out ca.key
openssl req -x509 -new -key ca.key -sha256 -days 3650 -subj "/CN=Campus IoT Lab CA" -out ca.crt

# On a real fleet the device makes the key and CSR; here we simulate one device.
openssl ecparam -name prime256v1 -genkey -noout -out node0042.key
openssl req -new -key node0042.key -subj "/CN=room-node-0042" -out node0042.csr

printf "basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\nextendedKeyUsage=clientAuth\n" > dev.ext
openssl x509 -req -in node0042.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -extfile dev.ext -out node0042.crt
openssl x509 -in node0042.crt -noout -subject -issuer -dates -ext extendedKeyUsage`, caption: "Run this on a PC to see the pieces. In Mosquitto, `require_certificate true` and `use_identity_as_username true` turn the CN into the MQTT username for ACLs." },
        { t: "p", text: "Validity period is a design choice. Short-lived certificates (months) limit the damage of a leaked key but need automated renewal over the air. Long-lived ones (years) are simpler but rely on revocation, and constrained devices rarely check revocation lists. Many fleets choose one to two years with automated rotation through the same CSR path used at first boot." },
      ] },
      { t: "deep", title: "Desired versus reported state as a reconciliation loop", blocks: [
        { t: "p", text: "The shadow or twin pattern is the same idea as Kubernetes controllers: the backend stores intent, the device stores reality, and a loop drives reality towards intent. Each document carries a version number. The device subscribes to a delta topic, which contains only the fields where desired and reported differ. On reconnect it fetches the full document rather than trusting that it saw every delta, which makes the scheme robust to missed messages." },
        { t: "p", text: "Two rules keep it sane. First, the device is always the authority on reported state; the backend never writes it. Second, desired state must be idempotent: applying `interval_s: 60` twice is harmless. Commands that are not idempotent (\"reboot now\") belong in jobs or command topics with their own IDs, not in desired state, or every reconnect would reboot the device again." },
      ] },
    ],
    mistakes: [
      "**One shared credential for the whole fleet.** One stolen device compromises all of them and you cannot revoke selectively.",
      "**Generating device keys on a laptop and emailing them.** The private key should be created on the device, or at least in a controlled, logged process, and never sent around.",
      "**Wi-Fi password in source code.** It reaches git, and it locks firmware to one network. Use field provisioning and NVS.",
      "**Provisioning with security 0 because it is easier.** The Wi-Fi password then crosses BLE in clear text.",
      "**Forgetting time.** Certificate validation fails if the device thinks it is 1970. Get SNTP time before the TLS connection, or handle the failure explicitly.",
      "**Writing vendor shadow topics all through the firmware.** It turns a backend migration into a firmware recall. Isolate vendor glue in one module.",
    ],
    practice: {
      kind: "bench",
      task: "Set up per-device certificate authentication for two ESP32 nodes on a local Mosquitto broker.",
      steps: [
        "On a PC, create the lab CA and two device certificates with the OpenSSL commands from the Go deeper section, with CNs `room-node-0001` and `room-node-0002`.",
        "Configure Mosquitto with a TLS listener on port 8883, `require_certificate true`, `use_identity_as_username true` and an ACL file allowing each CN to write only under its own topic.",
        "Load each certificate and key onto its ESP32 (for a lab, embed them as files; note in your report why that is not acceptable for production) and connect with mutual TLS.",
        "Show that node 0001 cannot publish under node 0002's topic: capture the broker log line.",
        "Revoke node 0002 by removing it from the ACL (or using a CRL) and show that node 0001 still works.",
      ],
    },
    quiz: [
      {
        q: "Fifty devices share one MQTT password and one is stolen. What is the main operational problem?",
        options: ["The broker will run out of connections", "MQTT does not allow shared passwords", "The stolen device will stop working", "You cannot revoke the stolen device without changing the credential on all fifty"],
        answer: 3,
        why: "A shared secret cannot be revoked for one device. Per-device identity lets you revoke just the stolen unit.",
      },
      {
        q: "In the claim certificate model, what is the claim certificate allowed to do?",
        options: ["Only call the provisioning API to obtain a device's own certificate", "Publish telemetry for any device", "Sign other devices' certificates", "Update firmware"],
        answer: 0,
        why: "The claim credential is shared across the fleet, so it is limited to the single action of requesting a per-device certificate.",
      },
      {
        q: "Why is the device-generated CSR approach better than generating key and certificate on a PC?",
        options: ["It is faster", "The private key never leaves the device, so no copy exists elsewhere", "CSRs do not need a CA", "It avoids needing TLS"],
        answer: 1,
        why: "A CSR carries only the public key. The CA signs it, and the private key stays where it was generated.",
      },
      {
        q: "A device's reported `interval_s` is 300 but desired is 60. What does this tell you?",
        options: ["The device has applied the new setting", "The cloud has an error", "The device has not yet received or applied the change", "The device is in provisioning mode"],
        answer: 2,
        why: "Desired is the backend's intent, reported is the device's reality. A difference means the device has not caught up yet.",
      },
      {
        q: "An ESP32 fails every TLS connection right after power-on, but works a minute later. What is the most likely cause?",
        options: ["The broker is overloaded at power-on", "The device has not yet obtained correct time, so certificate validity checks fail", "Wi-Fi signal is weak at power-on", "The CA certificate is expired"],
        answer: 1,
        why: "Certificates have validity periods. Until SNTP sets the clock, the device thinks it is 1970 and every certificate looks not yet valid.",
      },
    ],
  },

  "a15-pipelines-offline-and-integrity": {
    id: "a15-pipelines-offline-and-integrity",
    outcomes: [
      "Design an ingestion pipeline from broker to storage with validation and a raw archive",
      "Choose a storage model for time-series sensor data and estimate its size",
      "Make devices behave correctly offline using buffering, sequence numbers and idempotent writes",
      "Detect duplicates, gaps and reordering in received data",
    ],
    blocks: [
      { t: "h", text: "Why data integrity is an architecture problem" },
      { t: "p", text: "A dashboard showing a sensible line hides a lot. Behind it, some readings arrived twice because a QoS 1 acknowledgement was lost, some arrived three hours late from a node that lost Wi-Fi, some never arrived, and one device has had its clock wrong since a brownout. If a researcher later computes the average classroom temperature from that data, every one of those faults biases the answer. You cannot fix integrity at the dashboard. It has to be designed into the device, the payload and the pipeline together." },

      { t: "h", text: "The ingestion pipeline" },
      { t: "diagram", text: String.raw`
 broker ──► ingest worker ──┬──► raw archive (append-only, every message as received)
 (MQTT)     1 parse         │
            2 validate      ├──► time-series DB (clean, deduplicated, typed)
            3 enrich        │        │
            4 dedup         │        ├──► downsampled tables (1 min, 1 h, 1 day)
            5 route         │        └──► dashboards, API, analytics notebooks
                            └──► dead-letter queue (messages that failed validation)`, caption: "Keep the raw archive. When a bug in steps 1 to 5 is found next month, you can replay history through the fixed code." },
      { t: "list", ordered: true, items: [
        "**Parse** the payload (JSON, CBOR or Protocol Buffers) and reject anything that fails.",
        "**Validate** against the schema version: required fields present, types right, values physically plausible (relative humidity between 0 and 100, temperature between -40 and 85 for an SHT40). Implausible values are flagged, not silently dropped.",
        "**Enrich** with metadata from the registry: room, building, sensor type, calibration offset. Devices should not carry this; it changes when someone moves a sensor.",
        "**Deduplicate** using the device ID and sequence number (below).",
        "**Route** clean rows to the time-series store, everything to the raw archive, and failures to a dead-letter queue that someone actually reviews.",
      ] },
      { t: "p", text: "Between broker and workers you can put a durable queue or log (Apache Kafka, Redpanda, NATS JetStream, or a managed equivalent) so that a slow database or a deploy of the ingest worker does not lose messages. For a campus project, MQTT persistent sessions with QoS 1 into a single worker are often enough; add a log when you have several consumers or need replay at volume." },

      { t: "h", text: "Storage for time series" },
      { t: "p", text: "Sensor data is append-heavy, queried by time range and device, and rarely updated. Three common choices: a relational database with time-series extensions (**PostgreSQL with TimescaleDB**, which keeps SQL and joins with your registry tables), a dedicated time-series database (**InfluxDB**, **VictoriaMetrics**, **QuestDB**), or columnar files in object storage (**Parquet** on S3-compatible storage, queried with DuckDB or Spark) for cheap long-term archives. A good shape for one row is `(time, device_id, metric, value, seq, quality_flag)`, or one column per metric when every device has the same sensors." },
      { t: "p", text: "Plan **retention and downsampling** up front: keep raw 1-minute data for 90 days, 1-hour aggregates (min, max, mean, count) for 5 years. The `count` column matters: a mean computed from 12 of 60 samples is not as trustworthy as one from 60, and you can only know that if you stored the count." },
      { t: "formula", text: String.raw`rows per year  = devices × samples per day × 365
               = 500 × 1440 × 365
               = 262,800,000 rows
size (≈ 30 bytes per row after compression)  ≈ 7.9 GB per year`, caption: "500 devices at one sample per minute. Compression ratios vary widely; treat 30 bytes as an order-of-magnitude estimate." },

      { t: "h", text: "Offline behaviour: store and forward" },
      { t: "p", text: "From i11 you know the basic store-and-forward pattern: when the link is down, write readings to a ring buffer in flash or RTC memory and upload them when it returns. At scale, three more rules make it correct." },
      { t: "list", items: [
        "**Timestamp at the source.** Each reading carries the device's time of measurement, not the time it reached the cloud. A three-hour-old reading stored with arrival time puts a night-time value at noon.",
        "**Number every reading.** A per-device **sequence number** that increases by one for every reading, stored in NVS so it survives reboots (or combined with a boot counter: `(boot_id, seq)`).",
        "**Make uploads idempotent.** Sending the same reading twice must have the same effect as sending it once. This is what lets the device retry freely.",
      ] },
      { t: "p", text: "Why are duplicates unavoidable? With MQTT QoS 1, the broker acknowledges with PUBACK. If the Wi-Fi drops after the broker received the message but before the PUBACK arrived, the device cannot tell the difference from a lost message and must resend. So QoS 1 means **at least once**. QoS 2 gives exactly once between client and broker, but only on that hop, and only while the session survives; it does not protect the path from broker to database. End-to-end exactly-once is achieved by at-least-once delivery plus idempotent storage, never by a protocol flag alone." },

      { t: "h", text: "Idempotency and deduplication in practice" },
      { t: "p", text: "Make `(device_id, boot_id, seq)` the primary key, or a unique index, in the store. Then an insert of a duplicate does nothing: in PostgreSQL, `INSERT ... ON CONFLICT DO NOTHING`. The same key lets you **detect gaps**: if device 42 delivered sequence numbers 100, 101, 104, then 102 and 103 are missing, and you know exactly how much data was lost rather than guessing from timestamps. Out-of-order arrival is normal after an outage (new readings may arrive while the backlog is still uploading), so sort by device time or sequence, never by arrival." },
      { t: "snippet", lang: "python", code: String.raw`from collections import defaultdict

def ingest(messages):
    """Deduplicate on (device, boot, seq) and report gaps per device and boot."""
    seen = set()
    stored = []
    seqs = defaultdict(set)
    for m in messages:
        key = (m["dev"], m["boot"], m["seq"])
        if key in seen:
            continue                      # duplicate: idempotent, no effect
        seen.add(key)
        stored.append(m)
        seqs[(m["dev"], m["boot"])].add(m["seq"])
    gaps = {}
    for k, s in seqs.items():
        missing = sorted(set(range(min(s), max(s) + 1)) - s)
        if missing:
            gaps[k] = missing
    stored.sort(key=lambda m: (m["dev"], m["boot"], m["seq"]))
    return stored, gaps

arrived = [  # as received: a retry duplicate, a reorder, and a gap
    {"dev": 42, "boot": 7, "seq": 100, "t_c": 24.1},
    {"dev": 42, "boot": 7, "seq": 101, "t_c": 24.2},
    {"dev": 42, "boot": 7, "seq": 101, "t_c": 24.2},
    {"dev": 42, "boot": 7, "seq": 105, "t_c": 24.6},
    {"dev": 42, "boot": 7, "seq": 104, "t_c": 24.5},
]
rows, gaps = ingest(arrived)
print(len(rows), "stored;", "gaps:", gaps)   # 4 stored; gaps: {(42, 7): [102, 103]}
assert len(rows) == 4 and gaps == {(42, 7): [102, 103]}`, caption: "The same logic a database unique key gives you, written out so you can see it. Five messages arrive, four are stored, and two missing readings are reported." },
      { t: "p", text: "Check the output by hand: five messages arrived, one (seq 101) is a duplicate, so four are stored. The range for boot 7 is 100 to 105, which is six numbers; 100, 101, 104 and 105 are present, so 102 and 103 are missing. That matches." },

      { t: "h", text: "Synchronising configuration and clocks" },
      { t: "p", text: "Data flows up; configuration flows down. Use the desired and reported state pattern from the previous lesson so a device that was offline for a week catches up on reconnect. For clocks, a device that loses time after a power cut should report readings with a quality flag (or hold them) until SNTP succeeds, rather than stamping them 1970. The pipeline should reject or flag any device timestamp more than a few minutes in the future, and record both device time and arrival time so you can spot drifting clocks." },

      { t: "deep", title: "Why exactly-once delivery is impossible, and what to do instead", blocks: [
        { t: "p", text: "The two generals problem shows that two parties communicating over an unreliable channel can never both be certain that the last message arrived: every acknowledgement itself needs acknowledging. So a sender after a timeout has two options. Resend, and risk a duplicate (at least once). Or do not resend, and risk a loss (at most once). No protocol escapes this; MQTT QoS 2 uses a four-packet handshake and stored packet identifiers to make the broker's side idempotent for the duration of a session, which is the same trick applied on one hop." },
        { t: "p", text: "The general pattern is: at-least-once delivery, plus a unique ID on each message, plus a receiver that remembers which IDs it has applied. Payment systems use idempotency keys for exactly this reason. For sensor data the remembered-ID set is the database's unique index, which is persistent and costs almost nothing." },
      ] },
      { t: "deep", title: "Sizing the offline buffer and choosing a payload format", blocks: [
        { t: "p", text: "How long must a device survive offline? Suppose the campus Wi-Fi has planned maintenance windows of up to 48 hours. At one reading per minute that is 2880 readings. A compact binary record (4-byte time, 4-byte seq, two 2-byte scaled values, 2-byte CRC) is 14 bytes, so 2880 × 14 = 40,320 bytes, about 40 kB. The ESP32 DevKit's 4 MB flash can hold a 64 kB or larger partition for this easily. As JSON (about 70 bytes each) the same backlog is about 200 kB, still possible, but five times the flash wear and upload time." },
        { t: "p", text: "Flash wear: NOR flash sectors endure roughly 100,000 erase cycles. Writing one 14-byte record per minute into a ring buffer of 16 sectors of 4 kB means each sector fills after about 292 records (4096 / 14) and is erased once per full lap of 16 × 292 = 4672 minutes, about 3.2 days. At 100,000 cycles that is many centuries, so wear is not the constraint here; it would be if you rewrote a single sector every minute." },
        { t: "p", text: "When the backlog uploads, rate-limit it (for example 20 messages per second) and batch several readings into one message. Five hundred devices all returning from the same outage and flushing at full speed is a self-inflicted denial of service on your broker, known as a thundering herd. Add random jitter of a few seconds to reconnect and flush times." },
      ] },
    ],
    mistakes: [
      "**Using arrival time as the reading's time.** Backlogged readings end up at the wrong time of day. Timestamp at the source.",
      "**Assuming QoS 1 means each message arrives once.** It means at least once. Duplicates are normal; dedupe on a unique key.",
      "**Resetting the sequence number to zero on every reboot without a boot ID.** Old and new readings then collide on the same key.",
      "**Dropping implausible values silently.** Flag them and keep them in the raw archive, or a failing sensor looks like a quiet room.",
      "**No raw archive.** A bug in the cleaning step then destroys data permanently.",
      "**All devices flushing their backlog at once after an outage.** Add jitter and rate limits.",
    ],
    practice: {
      kind: "bench",
      task: "Make your node and pipeline survive a Wi-Fi outage without loss or duplication.",
      steps: [
        "Add `boot_id` (incremented in NVS on each boot) and `seq` (incremented per reading) to your ESP32 payload, plus a device timestamp from SNTP.",
        "Implement a flash ring buffer that holds at least 6 hours of readings and uploads them, in order, at no more than 10 messages per second after reconnecting.",
        "On the PC side, store messages in SQLite or PostgreSQL with a unique index on `(device_id, boot_id, seq)` and insert with conflict ignored.",
        "Turn off the access point for 30 minutes, then restore it. Run a gap query and show that the number of stored rows equals the number of readings taken.",
        "Force a duplicate (resend the last 10 messages) and show the row count does not change.",
      ],
    },
    quiz: [
      {
        q: "A device publishes at QoS 1, the broker receives the message, but the PUBACK is lost. What happens and what is the consequence?",
        options: ["The device resends, so the broker may receive the message twice", "Nothing; the broker resends the PUBACK", "The message is lost", "The connection is closed permanently"],
        answer: 0,
        why: "The device cannot distinguish a lost PUBACK from a lost message, so it resends. QoS 1 is at-least-once delivery, and duplicates must be handled downstream.",
      },
      {
        q: "Device 7 delivers sequence numbers 10, 11, 11, 14, 13 in one boot. How many readings are missing?",
        options: ["0", "1", "2", "3"],
        answer: 1,
        why: "After removing the duplicate 11, the set is 10, 11, 13, 14. The range 10 to 14 has five numbers, so only 12 is missing.",
      },
      {
        q: "Why store `count` alongside hourly mean values?",
        options: ["To save storage", "Because time-series databases require it", "To compute the median later", "So you know how many samples each mean was computed from, and can spot hours with missing data"],
        answer: 3,
        why: "A mean from 12 of 60 samples is less trustworthy than one from 60. Without the count you cannot tell them apart.",
      },
      {
        q: "500 devices send one reading per minute. Roughly how many rows per year is that?",
        options: ["2.6 million", "26 million", "263 million", "2.6 billion"],
        answer: 2,
        why: "500 × 1440 readings per day × 365 days = 262,800,000 rows, about 263 million.",
      },
      {
        q: "Which combination gives effectively exactly-once storage of sensor readings?",
        options: ["MQTT QoS 2 alone", "QoS 0 with fast Wi-Fi", "At-least-once delivery plus a unique key on (device, boot, seq) in the database", "Sending each message three times"],
        answer: 2,
        why: "No protocol gives end-to-end exactly-once. Retrying until acknowledged, combined with an idempotent insert keyed on a unique ID, gives the same result.",
      },
    ],
  },

  "a15-industrial-iot-and-cost": {
    id: "a15-industrial-iot-and-cost",
    outcomes: [
      "Build and check a Modbus RTU request and response frame, including its CRC",
      "Explain how Modbus TCP, OPC UA and common fieldbuses differ and where each is used",
      "Estimate messages per day, bandwidth, broker connections, storage and cloud cost for a fleet",
      "Assemble an architecture document and working slice for a campus sensing network",
    ],
    blocks: [
      { t: "h", text: "Why industrial protocols still matter" },
      { t: "p", text: "Most sensors worth measuring on a campus are not ESP32s you built. The energy meters on the distribution boards, the chillers, the solar inverters, the water pumps and the diesel generator controllers already exist, and they speak industrial protocols that are decades old. An IoT system that cannot read a Modbus energy meter misses the most valuable data in the building. Industrial devices also expect a different culture: they run for twenty years, they are polled rather than pushing data, and a wrong write can switch off a pump." },

      { t: "h", text: "Modbus in one page" },
      { t: "p", text: "Modbus (1979, now maintained by the Modbus Organization) is a master and slave protocol, now usually called client and server. A client sends a request to one server address; the server answers. Servers never speak unprompted. Data is organised as four tables: **coils** (1-bit, read and write), **discrete inputs** (1-bit, read only), **input registers** (16-bit, read only) and **holding registers** (16-bit, read and write). Each meter's manual has a register map saying, for example, that holding register 0 is temperature in tenths of a degree." },
      { t: "p", text: "**Modbus RTU** runs over RS-485 serial lines: a twisted pair shared by up to 32 standard loads, at 9600 or 19200 baud typically, up to about 1200 m. Each frame is the server address (1 to 247), a function code, data, and a 16-bit CRC. Frames are separated by at least 3.5 character times of silence. **Modbus TCP** carries the same function code and data inside TCP on port 502, replacing the address and CRC with a 7-byte MBAP header (transaction ID, protocol ID 0, length, unit ID); TCP's own checksum covers integrity." },
      { t: "table", head: ["Code", "Function", "Typical use"], rows: [
        ["0x01", "Read coils", "Relay states"],
        ["0x03", "Read holding registers", "Most meter readings and settings"],
        ["0x04", "Read input registers", "Measured values on some devices"],
        ["0x05", "Write single coil", "Switch a relay"],
        ["0x06", "Write single register", "Change one setpoint"],
        ["0x10", "Write multiple registers", "Write a block of settings"],
      ], caption: "The six function codes you will use most. An error response sets the top bit of the function code (0x83 for a failed 0x03) and adds an exception code." },

      { t: "h", text: "Worked frame: read one register with CRC" },
      { t: "p", text: "Read holding register 0 from server address 1. The request is address `01`, function `03`, starting address `00 00` (big-endian), quantity `00 01`. Then the CRC-16/MODBUS of those six bytes, sent **low byte first**." },
      { t: "formula", text: String.raw`Request  : 01 03 00 00 00 01 | CRC = 0x0A84 → sent as 84 0A
Frame    : 01 03 00 00 00 01 84 0A
Response : 01 03 02 01 07    | CRC = 0x16F8 → sent as F8 16
Frame    : 01 03 02 01 07 F8 16
Value    : 0x0107 = 263  →  26.3 °C if the map says "tenths of °C"`, caption: "Response: address 1, function 3, byte count 2, register value 0x0107, CRC." },
      { t: "p", text: "The CRC is computed like this: start with 0xFFFF. For each byte, XOR it into the low byte of the CRC, then repeat eight times: if the lowest bit is 1, shift right by one and XOR with 0xA001; otherwise just shift right. 0xA001 is the bit-reversed form of the polynomial 0x8005. **Check step:** the receiver runs the same algorithm over the entire frame including the two CRC bytes; a correct frame gives 0x0000. The program below does exactly that check for both frames." },
      { t: "snippet", lang: "python", code: String.raw`def crc16_modbus(data: bytes) -> int:
    crc = 0xFFFF
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
    return crc

def frame(body: bytes) -> bytes:
    c = crc16_modbus(body)
    return body + bytes([c & 0xFF, c >> 8])     # low byte first

req = frame(bytes([0x01, 0x03, 0x00, 0x00, 0x00, 0x01]))
rsp = frame(bytes([0x01, 0x03, 0x02, 0x01, 0x07]))
print(req.hex(" "))                  # 01 03 00 00 00 01 84 0a
print(rsp.hex(" "))                  # 01 03 02 01 07 f8 16
assert crc16_modbus(req) == 0 and crc16_modbus(rsp) == 0   # receiver check
value = int.from_bytes(rsp[3:5], "big")
print(value / 10, "degC")            # 26.3 degC`, caption: "Pure Python, runs as is. Use it to check frames captured from a USB to RS-485 adapter." },
      { t: "note", kind: "safety", text: "Never write (function 0x05, 0x06 or 0x10) to a building's real meters, inverters or controllers without the facility owner's permission and a register map you trust. Modbus has no authentication: a wrong write is obeyed. Read-only polling of a meter you have been allowed to access is the right scope for a student project." },
      { t: "p", text: "To read RS-485 from an ESP32, use a transceiver module (MAX3485 or similar, powered at 3.3 V; a 5 V MAX485 module's receiver output can drive an ESP32 pin above 3.3 V) on a UART, with one GPIO driving the driver-enable pin. ESP-IDF's UART driver has an RS-485 half-duplex mode that toggles RTS automatically, and Espressif publishes an `esp-modbus` component for both RTU and TCP." },

      { t: "h", text: "OPC UA and fieldbuses in outline" },
      { t: "p", text: "Modbus moves numbered registers and leaves meaning to a PDF manual. **OPC UA** (IEC 62541) moves meaning too. A server exposes an address space of typed, named nodes (`Boiler1/Temperature`, unit degrees Celsius, range, quality, timestamp), browsable by a client that has never seen it. It has built-in security (X.509 application certificates, signing and encryption), subscriptions so values are pushed on change, and companion specifications that standardise models for whole industries (machine tools, packaging, robotics). It is heavier than Modbus; on the IoT side it is typically spoken by the edge, which then publishes to MQTT. OPC UA also defines a PubSub mode that can run over MQTT." },
      { t: "p", text: "**Fieldbuses** are the networks inside machines and plants. **PROFIBUS** and **PROFINET** (Siemens heritage, PROFINET being Ethernet-based), **EtherNet/IP** (Rockwell heritage, carries CIP), **EtherCAT** (very low latency motion control, processes frames on the fly), **CAN and CANopen** (vehicles and machines; you met CAN in the intermediate tier), **BACnet** (building automation: HVAC, lighting; likely on your campus chillers), and **IO-Link** (point-to-point link to smart sensors). You do not need their details now; you need to recognise them and know that the usual integration point is a gateway or PLC that exposes data over Modbus TCP, OPC UA or MQTT." },

      { t: "h", text: "Estimating cost and scale" },
      { t: "p", text: "Before choosing a broker or signing up to a service, do the arithmetic. It decides whether a free tier, a Raspberry Pi or a cluster is needed, and it is a required section of your architecture document. The example: **500 nodes, one message per minute, 120-byte JSON payload**." },
      { t: "formula", text: String.raw`Messages per day   = 500 × 1440                = 720,000
Messages per month = 720,000 × 30              = 21,600,000
Bytes on the wire per message
   payload 120 + MQTT header and 30-byte topic ≈ 152
   + TCP/IPv4 40 + TLS record ≈ 29             ≈ 220 bytes
Daily traffic      = 720,000 × 220 B           ≈ 158 MB per day
Average bit rate   = 158.4e6 × 8 / 86,400 s    ≈ 14.7 kbit/s
Broker connections = 500 concurrent TLS sessions`, caption: "Keepalive packets and reconnect handshakes add more; include them if devices sleep or reconnect often." },
      { t: "p", text: "**Check the scale:** 14.7 kbit/s is nothing for any network, and 500 TLS connections is small for a broker. A single Mosquitto instance on a Raspberry Pi 4 can typically handle thousands of mostly idle connections; the limit you meet first is usually memory per TLS session and the database's write rate (here 720,000 / 86,400 ≈ 8.3 inserts per second on average, trivial for PostgreSQL). Peaks matter more than averages: after a campus-wide power cut, all 500 nodes reconnect and flush backlogs at once, which is why the jitter and rate limits of the previous lesson exist." },
      { t: "p", text: "**Cloud cost, order of magnitude, clearly an estimate.** Managed IoT services typically charge per message (often metered in 5 kB increments) and per connection-minute. At list prices seen at the time of writing in a US region, roughly USD 1 per million messages and USD 0.08 per million connection-minutes, the example costs about 21.6 × 1 ≈ USD 22 per month for messages and 500 × 43,200 minutes = 21.6 million connection-minutes ≈ USD 1.7 per month for connectivity, before rules, storage and data transfer. Prices differ by region, tier and year, and change; always check the provider's current pricing page and run its calculator. The lesson from the arithmetic is the shape: cost scales with **messages**, so batching ten readings into one message cuts the messaging bill by about ten, while storage of about 8 GB per year is cheap anywhere." },
      { t: "table", head: ["Lever", "Effect on messages", "Cost"], rows: [
        ["Send every 5 min instead of 1 min", "÷ 5", "Lower time resolution"],
        ["Batch 10 readings per message", "÷ 10", "Up to 10 min more latency"],
        ["Report on change (deadband 0.2 °C)", "Often ÷ 3 to ÷ 10 indoors", "Needs a heartbeat to prove the device is alive"],
        ["Edge aggregation (send 1-min stats from a gateway)", "÷ devices per gateway", "Edge box to run and maintain"],
      ], caption: "Most scaling problems are solved by sending less, not by buying a bigger broker." },

      { t: "h", text: "The exit project: architecture document and working slice" },
      { t: "p", text: "Your deliverable has two parts. The **document** covers: requirements (what is measured, where, how often, who uses it, how fresh it must be), the tier diagram, an interface table (one row per arrow as in lesson 1), identity and provisioning plan, topic and payload schema with version, offline and integrity design (buffer size, sequence numbers, dedup key), storage and retention plan with size estimate, and the cost and scale estimate above for your own numbers. The **working slice** is the thinnest end-to-end path that proves the design: two or three ESP32 nodes with per-device certificates, a broker, an ingest worker that validates and dedupes into a database, one dashboard, and one industrial input (a Modbus RTU device such as a cheap RS-485 temperature sensor or an energy meter you are allowed to read)." },

      { t: "deep", title: "Modbus RTU timing and the 3.5 character gap", blocks: [
        { t: "p", text: "RTU has no start or end byte; frames are delimited by silence. At 9600 baud with 11 bits per character (start, 8 data, parity or second stop, stop), one character takes 11 / 9600 = 1.146 ms, so the inter-frame gap of 3.5 characters is about 4.01 ms. Within a frame, gaps above 1.5 characters (about 1.72 ms) are an error. Above 19200 baud the specification fixes the gaps at 1.75 ms and 0.75 ms. A microcontroller that pauses mid-frame (for a Wi-Fi interrupt, say) can therefore split a frame; on the ESP32 use the UART hardware FIFO and the driver's RS-485 mode rather than writing bytes one by one in a loop." },
        { t: "p", text: "Registers are 16-bit and big-endian on the wire, but 32-bit values (energy in Wh, floats) span two registers, and vendors disagree on which register holds the high word. If a meter reads 1.2 × 10^9 kWh on a hostel floor, try swapping the word order before blaming the meter." },
      ] },
      { t: "deep", title: "Estimating broker and database capacity from first principles", blocks: [
        { t: "p", text: "Memory per connection: a TLS session in a typical broker costs tens of kilobytes (record buffers plus session state); 500 × 50 kB = 25 MB, which a Raspberry Pi with 4 GB handles easily, while 100,000 connections would need several gigabytes and point to a clustered broker. Message throughput: brokers handle tens of thousands of small QoS 0 messages per second per core; QoS 1 roughly halves that because of acknowledgements and persistence. At 8.3 messages per second you are four orders of magnitude below concern." },
        { t: "p", text: "The database sees the same rate, but indexes and the unique key on (device, boot, seq) cost a little per insert. Batch inserts from the ingest worker (for example, every second or every 500 rows) to keep transaction overhead low. Do the same estimate for a bigger case, such as 50,000 devices at one message per 10 s: 5000 messages per second sustained, which is where Kafka-style logs, sharded databases and the managed services start to earn their price." },
      ] },
    ],
    mistakes: [
      "**Sending the Modbus CRC high byte first.** Modbus RTU sends the CRC low byte first, unlike the big-endian register data.",
      "**Using a 5 V RS-485 module directly on ESP32 pins.** Its receiver output can exceed 3.3 V. Use a 3.3 V transceiver or level shifting.",
      "**Writing to building equipment without permission.** Modbus has no authentication and obeys any write.",
      "**Estimating from averages only.** The reconnect storm after a power cut, not the steady state, sizes the broker.",
      "**Quoting a cloud cost without date, region and assumptions.** Prices change; an estimate must show its inputs so it can be redone.",
      "**Swapped word order on 32-bit Modbus values.** Absurd readings often mean the two registers are in the opposite order.",
    ],
    practice: {
      kind: "bench",
      task: "Build the working slice of your campus sensing network and complete the architecture document.",
      steps: [
        "Wire a MAX3485 (3.3 V) RS-485 transceiver to an ESP32 DevKit UART and read one holding register from an RS-485 Modbus temperature sensor. Log the raw frames and check their CRCs with the Python program.",
        "Publish the Modbus reading and your SHT40 room readings from two or three nodes, each with its own certificate, following your topic scheme.",
        "Run the ingest worker with validation, enrichment from a small registry table, and dedup on (device, boot, seq). Show one dashboard panel per metric.",
        "Run the outage test from the previous lesson on the slice and record the gap report.",
        "Complete the cost and scale section for your real numbers, including peak reconnect rate, and state the date and source of any prices.",
      ],
    },
    quiz: [
      {
        q: "A Modbus RTU frame body is `01 03 00 00 00 01` and its CRC is 0x0A84. Which bytes go on the wire?",
        options: ["01 03 00 00 00 01 0A 84", "84 0A 01 03 00 00 00 01", "01 03 00 00 00 01 84 0A", "01 03 00 00 00 01 A0 48"],
        answer: 2,
        why: "Modbus RTU sends the CRC low byte first: 0x84 then 0x0A.",
      },
      {
        q: "A response is `01 03 02 00 FA` plus CRC, and the register map says tenths of a degree. What is the temperature?",
        options: ["2.5 °C", "25.0 °C", "250 °C", "0.25 °C"],
        answer: 1,
        why: "Byte count 2, value 0x00FA = 250. In tenths of a degree that is 25.0 °C.",
      },
      {
        q: "What does OPC UA provide that Modbus does not?",
        options: ["Faster serial communication", "Lower cost hardware", "Support for RS-485", "A self-describing, typed and browsable data model with built-in security"],
        answer: 3,
        why: "Modbus moves numbered registers with no meaning or security. OPC UA exposes named, typed nodes with metadata and has certificates, signing and encryption built in.",
      },
      {
        q: "1000 devices each send one message every 30 s. How many messages per day?",
        options: ["48,000", "1,440,000", "2,880,000", "86,400,000"],
        answer: 2,
        why: "Each device sends 86,400 / 30 = 2880 per day; 1000 devices send 2,880,000.",
      },
      {
        q: "A managed service charges per message. Which change cuts the bill most for a 1-minute temperature fleet that can tolerate 10 minutes of latency?",
        options: ["Switching from QoS 1 to QoS 0", "Shortening the topic name", "Batching ten readings into each message", "Using a bigger broker instance"],
        answer: 2,
        why: "Cost scales with message count. Ten readings per message divides the count, and the bill, by about ten; the others barely change the count.",
      },
    ],
  },
};

export default lessons;
