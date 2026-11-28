import type { ModuleContent } from "../model/curriculum";

/**
 * Module i10: Wireless and networking.
 * The Arduino Uno has no radio, so every sketch here is for the ESP32 DevKit,
 * Arduino-ESP32 core 3.3.10 (ESP-IDF 5.5). Libraries: ArduinoJson 7.4,
 * PubSubClient 2.8, and the core's own WiFi, HTTPClient, WebServer, BLE and esp_now.
 */
const lessons: ModuleContent = {
  "i10-networking-and-wifi": {
    id: "i10-networking-and-wifi",
    outcomes: [
      "Explain IP addresses, subnets, ports, DNS and NAT as far as a device needs them",
      "Choose TCP or UDP for a job and say what each one guarantees",
      "Connect an ESP32 to Wi-Fi as a station, run it as an access point, and recover from dropped connections",
      "Describe how a device is provisioned with Wi-Fi credentials without hard-coding them",
    ],
    blocks: [
      { t: "h", text: "Why a device engineer needs networking" },
      { t: "p", text: "A sensor that cannot report is only half a product. The moment your project talks to a phone, a server or another board, you depend on a stack of protocols that were designed for computers, not microcontrollers. You do not need to be a network administrator, but you do need to know why a device can reach the internet but not your laptop, why a hostname fails to resolve, and why a message sent over UDP sometimes vanishes. This lesson gives you the minimum model that makes those failures understandable." },
      { t: "note", kind: "warn", text: "The Arduino Uno has no radio. Everything in this module uses the ESP32 DevKit, whose chip includes 2.4 GHz Wi-Fi (802.11 b/g/n) and Bluetooth (Classic and Low Energy). An Uno can join a network only through an add-on such as an Ethernet shield or an ESP module acting as a modem." },

      { t: "h", text: "The layers" },
      { t: "p", text: "Networking is built in layers, each using the one below without caring how it works. The practical four-layer model (the TCP/IP model) is enough:" },
      { t: "table", head: ["Layer", "Job", "Examples on an ESP32"], rows: [
        ["Link", "Move a frame between two devices on the same local network", "Wi-Fi (802.11), Ethernet, with MAC addresses"],
        ["Internet", "Move a packet across networks to any IP address", "IPv4, IPv6, ICMP (ping)"],
        ["Transport", "Deliver data to the right program, reliably or not", "TCP, UDP, with port numbers"],
        ["Application", "The meaning of the data", "HTTP, MQTT, DNS, NTP, WebSocket"],
      ], caption: "Each layer wraps the one above in its own header." },
      { t: "p", text: "When your ESP32 publishes an MQTT message, the MQTT bytes are put in a TCP segment (with source and destination ports), that segment goes into an IP packet (with source and destination addresses), and the packet goes into a Wi-Fi frame addressed to the access point's MAC address. Each hop unwraps and rewraps the lower layers; the application data arrives unchanged." },

      { t: "h", text: "IP addresses, subnets and the gateway" },
      { t: "p", text: "An IPv4 address is 32 bits written as four decimal bytes, such as 192.168.1.37. A **subnet mask** such as 255.255.255.0 (written /24) says which part is the network: here, the first 24 bits (192.168.1) identify the network and the last 8 bits identify the host, so the subnet holds addresses 192.168.1.1 to 192.168.1.254 (0 is the network itself and 255 is broadcast). Two devices on the same subnet talk directly. To reach any other address, a device sends the packet to its **default gateway**, the router, which forwards it." },
      { t: "p", text: "Your ESP32 normally gets its address, mask, gateway and DNS server automatically from the router by **DHCP**. Print them after connecting; they are the first thing to check when something cannot be reached." },
      { t: "p", text: "Home and campus networks use **private** ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) that are not routable on the internet. The router performs **NAT** (network address translation): it rewrites outgoing packets to use its own public address and remembers which internal device each connection belongs to. Two consequences matter for IoT. A device behind NAT can open connections outward (to a broker or server) easily, but nothing on the internet can open a connection inward to it. That is the main reason IoT devices connect *out* to a broker rather than running servers that the world connects to. And on many campus networks, devices on Wi-Fi are isolated from each other (client isolation), so your laptop may not reach your ESP32 even on the same network name." },

      { t: "h", text: "Ports, TCP and UDP" },
      { t: "p", text: "An IP address finds the device; a **port number** (0 to 65535) finds the program on it. Well-known services have fixed ports: HTTP 80, HTTPS 443, DNS 53, NTP 123, MQTT 1883 (8883 with TLS). A connection is identified by four numbers: source IP, source port, destination IP, destination port." },
      { t: "table", head: ["", "TCP", "UDP"], rows: [
        ["Connection", "Set up with a three-way handshake (SYN, SYN-ACK, ACK)", "None: just send a datagram"],
        ["Delivery", "Reliable, in order; lost segments are retransmitted", "Best effort; packets may be lost, duplicated or reordered"],
        ["Unit", "A byte stream with no message boundaries", "Individual datagrams, each delivered whole or not at all"],
        ["Overhead", "20-byte header plus handshake, ACKs, retransmissions", "8-byte header"],
        ["Used by", "HTTP, MQTT, WebSocket", "DNS, NTP, video streaming, CoAP"],
      ], caption: "Pick by what you need guaranteed, not by speed alone." },
      { t: "p", text: "Two consequences of TCP being a **byte stream** catch people out. A message you send in one `write()` may arrive in two reads, and two messages may arrive in one; every protocol on top of TCP must mark where messages begin and end (HTTP uses headers and Content-Length, MQTT a length field). And reliability has a cost in time: a lost segment is resent after a timeout, which can stall the stream for hundreds of milliseconds. For a sensor reading sent every second where only the latest value matters, UDP is often the better fit." },

      { t: "h", text: "DNS" },
      { t: "p", text: "People and code use names such as `broker.example.com`; packets need addresses. The **Domain Name System** translates. The ESP32 sends a small UDP query to port 53 of its DNS server (given by DHCP), which answers with an address and a time-to-live saying how long the answer may be cached. If DNS fails, every name-based connection fails, even though the network is fine. When debugging, try connecting by IP address: if that works and the name does not, the problem is DNS. On a local network without a DNS server, the ESP32 can advertise a name such as `node1.local` with **mDNS** (the core's ESPmDNS library), which laptops and phones on the same subnet resolve by multicast." },

      { t: "h", text: "Wi-Fi station and access point modes" },
      { t: "p", text: "The ESP32 can be a **station** (STA), joining an existing network like a phone does, an **access point** (AP), creating its own network that phones join, or both at once (AP+STA). Station mode is what you want for anything that reaches the internet. AP mode is used for setup screens and for field devices with no router nearby. In AP mode the ESP32 is the gateway and DHCP server, at 192.168.4.1 by default, and up to about 10 clients (4 by default) can join." },
      { t: "p", text: "Joining a network takes time and can fail: scanning, authentication, association, then DHCP. Real deployments lose Wi-Fi regularly (router reboots, interference, a student unplugging the access point). A robust device does three things: it never blocks forever waiting to connect, it reacts to disconnection events, and it keeps working on local tasks while offline. The sketch below uses the Arduino-ESP32 core 3.x event API." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Station mode with event-driven reconnect.
// Credentials come from NVS (Preferences), stored once by a provisioning step,
// so they are not written into the source code.
#include <WiFi.h>
#include <Preferences.h>

Preferences prefs;
volatile bool online = false;

void onWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      online = true;
      Serial.print("Got IP ");      Serial.print(WiFi.localIP());
      Serial.print(" gateway ");    Serial.print(WiFi.gatewayIP());
      Serial.print(" DNS ");        Serial.println(WiFi.dnsIP());
      break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      online = false;
      Serial.printf("Disconnected, reason %d\n", info.wifi_sta_disconnected.reason);
      break;  // auto-reconnect (below) will try again
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  prefs.begin("wifi", true);                 // read-only namespace "wifi"
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");
  prefs.end();

  if (ssid.isEmpty()) {
    Serial.println("No credentials stored: start provisioning (see lesson)");
    WiFi.softAP("node-setup", "setup1234");  // AP mode, password at least 8 chars
    Serial.print("Setup AP at ");
    Serial.println(WiFi.softAPIP());           // 192.168.4.1
    return;
  }
  WiFi.onEvent(onWiFiEvent);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid.c_str(), pass.c_str());
}

void loop() {
  static uint32_t last = 0;
  if (millis() - last >= 5000) {
    last = millis();
    if (online) Serial.printf("Online, RSSI %d dBm\n", WiFi.RSSI());
    else        Serial.println("Offline: still sampling sensors locally");
  }
}`, caption: "The loop never waits for Wi-Fi; the event handler tracks the state." },
      { t: "p", text: "**RSSI** (received signal strength) is in dBm. Around -50 dBm is excellent, -67 dBm is a common target for reliable links, and below about -80 dBm you will see drops. The disconnect **reason** code tells you why: 15 or 204 usually mean a wrong password, 201 means the network was not found, 2 means authentication expired. The full list is the `WIFI_REASON_*` enum in ESP-IDF's `esp_wifi_types` header. Print it." },

      { t: "h", text: "Provisioning: getting credentials onto a device" },
      { t: "p", text: "Writing your network name and password into the sketch works for one board on your desk. It fails for a class of sixty boards, leaks the password to anyone who reads your code (or your Git repository), and means reflashing whenever the password changes. **Provisioning** is the process of giving a device its credentials after it is built. Common approaches:" },
      { t: "list", items: [
        "**SoftAP portal**: with no stored credentials, the device starts an access point and a small web page; you join it from a phone, type the network details, and the device stores them in flash (NVS, through the Preferences library) and restarts in station mode. Libraries such as WiFiManager package this, including a captive portal that pops up the page automatically.",
        "**BLE provisioning**: the device advertises over Bluetooth and a phone app sends the credentials. Espressif's unified provisioning (the core's WiFiProv library, with the ESP BLE Prov phone app) supports both BLE and SoftAP transports, with encryption of the credentials in transit.",
        "**Serial or factory provisioning**: a script writes credentials over USB on the production line or lab bench.",
      ] },
      { t: "p", text: "Whatever the method, store credentials in NVS, not in code, and provide a way to clear them (for example holding the BOOT button, GPIO 0 on the DevKit, for five seconds at startup) so a device can be moved to a new network." },

      { t: "deep", title: "Subnet arithmetic and why two devices cannot see each other", blocks: [
        { t: "p", text: "A device decides whether a destination is local by ANDing both addresses with its mask and comparing. If the results match, it sends directly (first using ARP to find the destination's MAC address); otherwise it sends to the gateway." },
        { t: "formula", text: String.raw`ESP32:   192.168.1.37   = 11000000.10101000.00000001.00100101
Mask:    255.255.255.0  = 11111111.11111111.11111111.00000000
Network: 192.168.1.0

Laptop:  192.168.0.20 AND 255.255.255.0 = 192.168.0.0   (different network)
→ the ESP32 sends to its gateway, which may or may not route between the two.`, caption: "Same router name, different subnets: a common cause of \"I can ping the internet but not my board\"." },
        { t: "p", text: "A /22 mask (255.255.252.0) covers four /24 blocks, 1022 usable hosts; campus networks often use large subnets like this, or many small ones with routing and firewalls in between. Hosts per subnet is 2^(32 - prefix) - 2: for /24, 256 - 2 = 254; for /22, 1024 - 2 = 1022." },
        { t: "p", text: "IPv6 avoids NAT by giving every device a globally unique 128-bit address, and the ESP32 core supports it (`WiFi.enableIPv6()`). In practice most Indian campus and home networks still route IoT traffic over IPv4 with NAT, so design for outbound connections either way." },
      ] },
      { t: "deep", title: "What happens during a Wi-Fi connection", blocks: [
        { t: "list", ordered: true, items: [
          "**Scan**: the station listens for beacons (sent by access points about ten times a second) or sends probe requests on each channel. 2.4 GHz has channels 1 to 13 in India; only 1, 6 and 11 do not overlap.",
          "**Authentication and association**: an open exchange, after which the station is attached to the access point.",
          "**WPA2/WPA3 key handshake**: four messages derive per-session encryption keys from the password without sending the password itself. A wrong password fails here (reason 15, 4-way handshake timeout).",
          "**DHCP**: discover, offer, request, acknowledge, usually under a second. Only now does `GOT_IP` fire.",
        ] },
        { t: "p", text: "Enterprise networks (WPA2-Enterprise, eduroam, many campus networks) require a username and password checked by a RADIUS server, often with a certificate. The ESP32 supports this through its esp_eap_client API, but configuration is fiddly and some campus networks also require a browser login page (a captive portal) that a microcontroller cannot complete. For lab work, a dedicated access point or a phone hotspot (WPA2-Personal) is far simpler." },
        { t: "p", text: "The ESP32 has one radio, so in AP+STA mode both interfaces must use the same channel; when the station joins a router on channel 11, the soft AP moves to channel 11 too, briefly disconnecting its clients." },
      ] },
    ],
    mistakes: [
      "**Trying to use Wi-Fi on an Uno.** It has no radio; use the ESP32.",
      "**Hard-coding the Wi-Fi password and committing it to Git.** Use provisioning and NVS, or at least a secrets file excluded by .gitignore.",
      "**`while (WiFi.status() != WL_CONNECTED) delay(500);` with no timeout.** The device hangs forever when the router is off; use events or a timeout.",
      "**Expecting a device behind NAT to accept connections from the internet.** Connect outward to a broker or server instead.",
      "**Blaming code for a DNS failure.** Try the IP address directly to separate DNS problems from connection problems.",
      "**Assuming UDP delivery.** UDP packets can be lost without any error; add sequence numbers if you care.",
    ],
    practice: {
      kind: "bench",
      task: "Bring an ESP32 online, inspect its network settings, and test recovery.",
      steps: [
        "Write a one-off sketch that stores your hotspot's SSID and password in the Preferences namespace \"wifi\" (keys \"ssid\" and \"pass\"), run it once, then remove the credentials from the source.",
        "Upload the lesson sketch. Record the IP address, gateway, DNS server and RSSI it prints.",
        "Turn the hotspot off for 30 seconds, then on. Confirm the board reports offline, keeps running, and reconnects without a reset. Note the disconnect reason code.",
        "From a laptop on the same network, run `ping` with the ESP32's IP. If it fails, check whether the laptop is on the same subnet (compare masks) or whether client isolation is on.",
        "Change the stored password to a wrong one and record the reason code you get.",
      ],
    },
    quiz: [
      {
        q: "An ESP32 at 192.168.1.37/24 wants to reach 192.168.1.80. Where does it send the packet?",
        options: [
          "To the default gateway",
          "Directly to 192.168.1.80, since both are on the 192.168.1.0/24 subnet",
          "To the DNS server",
          "It cannot reach it without NAT",
        ],
        answer: 1,
        why: "With a /24 mask, both addresses share the network 192.168.1.0, so the packet goes straight to the destination on the local link.",
      },
      {
        q: "Your ESP32 sits behind a home router with NAT. Which design lets a phone on mobile data receive its readings?",
        options: [
          "Run a web server on the ESP32 and have the phone connect to its 192.168 address",
          "Use UDP instead of TCP",
          "Have the ESP32 connect outward to a broker or server on the internet, and have the phone connect to the same broker",
          "Give the ESP32 a static private IP",
        ],
        answer: 2,
        why: "NAT allows outbound connections but blocks unsolicited inbound ones. Both device and phone connect out to a shared server.",
      },
      {
        q: "You send two 20-byte messages over a TCP connection one after the other. What might the receiver get?",
        options: [
          "Always two separate 20-byte reads",
          "One 40-byte read, or any other split, because TCP is a byte stream without message boundaries",
          "Only the second message",
          "The messages in reverse order",
        ],
        answer: 1,
        why: "TCP guarantees order and delivery of bytes, not message boundaries. Protocols on top must frame their own messages.",
      },
      {
        q: "Connecting to `broker.local-lab.in` fails, but connecting to its IP address works. What is the problem?",
        options: ["Name resolution (DNS)", "The TCP port is blocked", "Wi-Fi signal strength", "The broker is down"],
        answer: 0,
        why: "If the IP works, the network path and the broker are fine. Only translating the name to an address failed.",
      },
      {
        q: "Which job suits UDP better than TCP?",
        options: [
          "Uploading a firmware image",
          "Sending an HTTP request to a REST API",
          "Broadcasting the latest sensor value ten times a second, where an occasional lost reading does not matter",
          "Downloading a configuration file",
        ],
        answer: 2,
        why: "UDP avoids connection setup and retransmission delays. Losing one of many frequent, latest-value readings is harmless; losing part of a file is not.",
      },
    ],
  },

  "i10-http-json-and-web-servers": {
    id: "i10-http-json-and-web-servers",
    outcomes: [
      "Read and write an HTTP request and response, including method, status code and headers",
      "Call a REST API from an ESP32 and parse the JSON reply with ArduinoJson 7",
      "Serve a status page and a JSON endpoint from the ESP32",
      "Explain how a WebSocket differs from repeated HTTP requests and when to use one",
    ],
    blocks: [
      { t: "h", text: "Why HTTP and JSON" },
      { t: "p", text: "Almost every web service, cloud platform and phone app speaks HTTP, and most of them exchange data as JSON. A device that can make an HTTP request can fetch the weather, push a reading to a database, or trigger an alert; a device that can answer one can be controlled from any browser without an app. Both are a few dozen lines on an ESP32, but only if you understand what is actually on the wire." },

      { t: "h", text: "An HTTP exchange" },
      { t: "p", text: "HTTP/1.1 is text over a TCP connection (port 80, or 443 for HTTPS, where the same text travels inside TLS encryption). The client sends a **request**: a request line with method, path and version, header lines, a blank line, and an optional body. The server replies with a **response**: a status line, headers, a blank line, and a body." },
      { t: "snippet", lang: "text", code: String.raw`POST /api/readings HTTP/1.1
Host: lab-server.local:8080
Content-Type: application/json
Content-Length: 44

{"device":"node-07","temp_c":27.4,"rh":61.2}

HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 21

{"id":5821,"ok":true}`, caption: "A request and its response. Each header line ends with CR LF; the blank line separates headers from body." },
      { t: "p", text: "Check the Content-Length: the body `{\"device\":\"node-07\",\"temp_c\":27.4,\"rh\":61.2}` has 44 characters, and the reply body `{\"id\":5821,\"ok\":true}` has 21; count them yourself. A wrong Content-Length makes a server hang waiting for bytes that never come, or cut the body short, which is why you let a library compute it rather than typing it." },
      { t: "table", head: ["Method", "Meaning in a REST API", "Safe to repeat?"], rows: [
        ["GET", "Read a resource", "Yes, no side effects"],
        ["POST", "Create a resource or trigger an action", "No: two POSTs may create two records"],
        ["PUT", "Replace a resource with the body", "Yes: same result each time"],
        ["PATCH", "Change part of a resource", "Depends on the change"],
        ["DELETE", "Remove a resource", "Yes"],
      ], caption: "\"Safe to repeat\" (idempotent) matters when a device retries after a timeout." },
      { t: "p", text: "**Status codes** come in classes: 2xx success (200 OK, 201 Created, 204 No Content), 3xx redirection (301, 302: go elsewhere), 4xx your fault (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests), 5xx the server's fault (500, 503). A device should treat 4xx as \"do not retry the same request\" and 5xx or a timeout as \"retry later with a growing delay\"." },
      { t: "p", text: "**REST** (representational state transfer) is a style rather than a protocol: resources are named by URLs (`/api/devices/node-07/readings`), the method says what to do with them, and each request carries everything needed (no hidden session state). Most IoT platforms offer a REST API for configuration and bulk data, alongside MQTT for live data." },

      { t: "h", text: "JSON and ArduinoJson 7" },
      { t: "p", text: "JSON (JavaScript Object Notation) has six kinds of value: objects `{\"key\": value}`, arrays `[1, 2]`, strings, numbers, `true`/`false`, and `null`. It is text, easy to read and debug, and every language parses it. It is also verbose, which the next module's data formats lesson quantifies." },
      { t: "p", text: "On microcontrollers the standard library is Benoît Blanchon's **ArduinoJson**. Version 7 (this lesson uses 7.4) changed the API from version 6: there is now a single `JsonDocument` type that grows as needed, replacing `StaticJsonDocument<N>` and `DynamicJsonDocument(N)`, and `containsKey()` is replaced by checking `doc[\"key\"].is<T>()`. Old examples on the web mostly use version 6 syntax; if you see `StaticJsonDocument`, translate it." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x, ArduinoJson 7.4.
// GET the current temperature in Bhopal from the free Open-Meteo API
// and POST a reading to your own server as JSON.
#include <WiFi.h>
#include <HTTPClient.h>
#include <NetworkClientSecure.h>
#include <ArduinoJson.h>
#include "secrets.h"   // defines WIFI_SSID, WIFI_PASS, SERVER_URL; not committed to Git

float fetchOutsideTemp() {
  NetworkClientSecure tls;
  tls.setInsecure();   // demo only: encrypts but does not verify the server. Module i11 shows setCACert().
  HTTPClient http;
  http.begin(tls, "https://api.open-meteo.com/v1/forecast?latitude=23.26&longitude=77.41&current=temperature_2m");
  http.setTimeout(5000);
  int code = http.GET();
  float t = NAN;
  if (code == HTTP_CODE_OK) {
    JsonDocument filter;                              // keep only the field we need
    filter["current"]["temperature_2m"] = true;
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, http.getStream(),
                                               DeserializationOption::Filter(filter));
    if (!err && doc["current"]["temperature_2m"].is<float>()) {
      t = doc["current"]["temperature_2m"].as<float>();
    } else {
      Serial.printf("JSON error: %s\n", err.c_str());
    }
  } else {
    Serial.printf("GET failed: %d\n", code);         // negative = connection error
  }
  http.end();
  return t;
}

bool postReading(float tempC, float rh) {
  JsonDocument doc;
  doc["device"] = "node-07";
  doc["temp_c"] = tempC;
  doc["rh"] = rh;
  String body;
  serializeJson(doc, body);                          // library computes the length

  HTTPClient http;
  http.begin(SERVER_URL);                            // e.g. http://192.168.1.10:8080/api/readings
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);  // 10 s limit
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float outside = fetchOutsideTemp();
    Serial.printf("Outside: %.1f C\n", outside);
    Serial.println(postReading(27.4, 61.2) ? "POST ok" : "POST failed");
  }
  delay(60000);
}`, caption: "secrets.h lives next to the sketch and is listed in .gitignore." },
      { t: "p", text: "Points to notice: the **filter** document tells ArduinoJson to discard everything except the one field, so a large API response does not exhaust memory; `is<float>()` checks the field exists and has the right type before you use it; a negative HTTP code means the connection itself failed (no Wi-Fi, DNS failure, timeout) rather than the server returning an error; and the timeout stops the device hanging on a slow server." },

      { t: "h", text: "The ESP32 as a web server" },
      { t: "p", text: "Turn the direction round: the ESP32 listens on port 80, and a browser on the same network sends it requests. The core's synchronous `WebServer` library maps paths to handler functions. A good pattern is to serve one HTML page that uses JavaScript to fetch a JSON endpoint every couple of seconds, so the page updates without reloading." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x. Status page plus JSON API plus LED control.
// Browse to http://node1.local/ (mDNS) or the printed IP address.
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include "secrets.h"

const int LED_PIN = 2;          // on-board LED on most ESP32 DevKits
WebServer server(80);

const char PAGE[] = R"HTML(<!doctype html><meta name=viewport content="width=device-width">
<h1>Node 1</h1><p>Uptime: <span id=u>?</span> s, RSSI: <span id=r>?</span> dBm</p>
<button onclick="fetch('/api/led?on=1',{method:'POST'})">LED on</button>
<button onclick="fetch('/api/led?on=0',{method:'POST'})">LED off</button>
<script>
setInterval(async()=>{const j=await (await fetch('/api/status')).json();
u.textContent=j.uptime_s; r.textContent=j.rssi;},2000);
</script>)HTML";

void handleStatus() {
  JsonDocument doc;
  doc["uptime_s"] = millis() / 1000;
  doc["rssi"] = WiFi.RSSI();
  doc["led"] = digitalRead(LED_PIN) == HIGH;
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleLed() {
  if (!server.hasArg("on")) { server.send(400, "text/plain", "missing on=0|1"); return; }
  digitalWrite(LED_PIN, server.arg("on") == "1" ? HIGH : LOW);
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);
  Serial.println(WiFi.localIP());
  MDNS.begin("node1");
  server.on("/", HTTP_GET, [] { server.send(200, "text/html", PAGE); });
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/led", HTTP_POST, handleLed);
  server.onNotFound([] { server.send(404, "text/plain", "not found"); });
  server.begin();
}

void loop() {
  server.handleClient();        // must be called often; never block in loop()
}`, caption: "The LED changes state only on POST: a GET must not have side effects." },
      { t: "note", kind: "warn", text: "This server has no authentication. Anyone on the same network can switch the LED. That is acceptable for a lab bench, not for a door lock or a heater. Never forward a port on a router to a device like this." },

      { t: "h", text: "WebSockets: when polling is not enough" },
      { t: "p", text: "The page above polls every 2 seconds. Each poll is a new HTTP request with several hundred bytes of headers, and an event that happens just after a poll waits up to 2 seconds to be seen. For a live chart or a remote-control joystick that is too slow and too wasteful. A **WebSocket** keeps one TCP connection open and lets either side send a message at any time." },
      { t: "list", ordered: true, items: [
        "The browser sends an ordinary HTTP GET with the headers `Upgrade: websocket`, `Connection: Upgrade` and a random `Sec-WebSocket-Key`.",
        "The server replies `101 Switching Protocols` with a `Sec-WebSocket-Accept` header computed from the key, proving it understood.",
        "From then on, the connection carries small **frames**: a 2-byte header (with opcode for text, binary, ping, pong or close, and the length) plus payload. Frames from the browser are masked with a 4-byte key; frames from the server are not.",
      ] },
      { t: "p", text: "A 20-byte sensor update then costs about 22 bytes on the wire instead of a full HTTP request and response, and it arrives within milliseconds. On the ESP32 the commonly used libraries are **WebSockets** by Markus Sattler (arduinoWebSockets) and the WebSocket support in **ESPAsyncWebServer** (maintained by the ESP32Async organisation). The browser side is the built-in `new WebSocket(\"ws://node1.local:81/\")` with an `onmessage` handler. Use WebSockets for a page that talks to one device on the local network; for many devices and many viewers, a broker (next lesson) scales better." },

      { t: "deep", title: "Inside HTTPS: what TLS adds and costs on a microcontroller", blocks: [
        { t: "p", text: "HTTPS is HTTP inside TLS. During the TLS handshake, the server sends its certificate chain; the client checks that the chain ends in a root certificate it trusts, that the name matches, and that the dates are valid (so the device needs the correct time, see module i11); then both sides agree on session keys with an elliptic-curve exchange." },
        { t: "list", items: [
          "**Memory**: a TLS session on the ESP32 (mbedTLS) needs roughly 40 to 50 kB of heap during the handshake. Check `ESP.getFreeHeap()` before opening two at once.",
          "**Time**: a full handshake takes from a few hundred milliseconds to over a second on the ESP32, mostly public-key arithmetic. Reuse connections (HTTP keep-alive) instead of reconnecting for every reading.",
          "**setInsecure()** keeps encryption but skips verification, so a man in the middle can impersonate the server. It is acceptable only for a throwaway demo.",
        ] },
        { t: "p", text: "The secure version calls `setCACert()` with the PEM text of the root certificate that signed the server's chain. Roots expire and are occasionally replaced, so a product needs a way to update them, usually with the firmware itself." },
      ] },
      { t: "deep", title: "Retry, backoff and idempotency for devices", blocks: [
        { t: "p", text: "A device that retries a failed request immediately, forever, can turn a short server outage into a self-inflicted denial of service when a hundred devices do the same. Use **exponential backoff with jitter**: wait a base delay, double it after each failure up to a cap, and add a random fraction so devices do not retry in lockstep." },
        { t: "formula", text: String.raw`delay(n) = min(cap, base × 2^n) × (0.5 + random(0, 0.5))

base = 2 s, cap = 300 s:
n = 0: 1 to 2 s     n = 3: 8 to 16 s     n = 7: min(300, 256) → 128 to 256 s
n = 8: min(300, 512) = 300 → 150 to 300 s`, caption: "After about eight failures the device settles on retrying every few minutes." },
        { t: "p", text: "If the device times out on a POST, it cannot know whether the server stored the reading. Retrying might store it twice. The fix is an **idempotency key**: include a unique reading id (device id plus sequence number) and have the server ignore a reading it has already stored. The store-and-forward lesson in module i11 relies on exactly this." },
      ] },
    ],
    mistakes: [
      "**Copying ArduinoJson 6 examples into a version 7 project.** Replace StaticJsonDocument and DynamicJsonDocument with JsonDocument.",
      "**Using the value of a missing JSON field.** Check `doc[\"x\"].is<T>()` first, or you silently get 0.",
      "**Changing state on a GET request.** Browsers, previews and crawlers repeat GETs; use POST for actions.",
      "**Blocking in loop() of a web server sketch.** A `delay(5000)` makes every page load wait five seconds.",
      "**No timeout on HTTP requests.** A slow server freezes the whole device.",
      "**Using setInsecure() in a deployed device.** It disables server verification; use a CA certificate.",
    ],
    practice: {
      kind: "bench",
      task: "Build a device web page and a REST client on the same ESP32.",
      steps: [
        "Install ArduinoJson 7 from the Library Manager. Create secrets.h with your hotspot details and add it to .gitignore if the sketch is in a repository.",
        "Upload the web server sketch. Open http://node1.local/ on a laptop (or the IP on a phone, since some Android versions do not resolve .local names) and toggle the LED.",
        "Open the browser's developer tools, Network tab, and look at one /api/status request: note the request headers, status code and the size of request plus response.",
        "From a laptop terminal, run `curl -i http://<ip>/api/status` and `curl -i -X POST \"http://<ip>/api/led?on=1\"`. Then try `curl -i -X POST http://<ip>/api/led` and confirm you get 400.",
        "Add the fetchOutsideTemp() function to the server and show the outside temperature on the page.",
      ],
    },
    quiz: [
      {
        q: "A device POSTs a reading and the server replies 503. What should the device do?",
        options: [
          "Give up and delete the reading",
          "Retry immediately in a tight loop",
          "Change the request and retry at once",
          "Keep the reading and retry later, waiting longer after each failure",
        ],
        answer: 3,
        why: "5xx means the server has a problem, possibly temporary. Retry with backoff. A 4xx would mean the request itself is wrong.",
      },
      {
        q: "In ArduinoJson 7, how do you safely read an integer field `count` that might be missing?",
        options: [
          "Check `doc[\"count\"].is<int>()` and then use `doc[\"count\"].as<int>()`",
          "Use `doc.containsKey(\"count\")` with StaticJsonDocument<200>",
          "Read it directly: missing fields throw an exception",
          "Use `deserializeJson` a second time",
        ],
        answer: 0,
        why: "Version 7 replaces containsKey() with is<T>(), which also checks the type. Reading a missing field gives a default value, not an error.",
      },
      {
        q: "Why should the LED be switched with a POST request rather than a GET?",
        options: [
          "GET requests cannot carry parameters",
          "POST is faster",
          "GET is meant to have no side effects, and browsers, link previews and crawlers may repeat it",
          "The WebServer library only supports POST",
        ],
        answer: 2,
        why: "Clients assume GET is safe to repeat or prefetch. Actions with side effects belong in POST (or PUT).",
      },
      {
        q: "A dashboard polls a device every second with HTTP. What does switching to a WebSocket mainly gain?",
        options: [
          "Encryption",
          "Updates pushed as soon as they happen over one open connection, with a few bytes of overhead instead of a full request and response",
          "Longer range",
          "It no longer needs TCP",
        ],
        answer: 1,
        why: "A WebSocket upgrades one HTTP connection to a persistent, two-way message channel, cutting latency and header overhead.",
      },
      {
        q: "HTTPClient's GET() returns -1. What does that tell you?",
        options: [
          "The server returned a client error",
          "The JSON was invalid",
          "The resource was not found",
          "The request never completed at the connection level, for example no network, DNS failure or timeout",
        ],
        answer: 3,
        why: "Negative codes are library errors before or during the connection. HTTP status codes from a server are always 100 or more.",
      },
    ],
  },

  "i10-mqtt": {
    id: "i10-mqtt",
    outcomes: [
      "Design a topic hierarchy and use + and # wildcards",
      "Choose a QoS level and explain the message flow of QoS 0, 1 and 2",
      "Use retained messages and a last will to show device status",
      "Run a Mosquitto broker and connect an ESP32 with PubSubClient",
    ],
    blocks: [
      { t: "h", text: "Why MQTT dominates IoT" },
      { t: "p", text: "With HTTP, each device must know every server that wants its data, and servers cannot push to devices behind NAT. MQTT (originally MQ Telemetry Transport, now an OASIS standard) solves both with a **broker**: a server that every device and app connects out to. Devices **publish** messages to named **topics**; anything that has **subscribed** to a topic receives them. Publishers and subscribers never talk directly and need not know each other exist. A temperature node publishes once, and a dashboard, a database writer and an alarm all receive it. The protocol is binary and compact: the smallest message is 2 bytes plus topic and payload." },
      { t: "diagram", text: String.raw`  ┌──────────┐ publish lab/101/temp ┌──────────────┐ deliver ┌─────────────┐
  │ ESP32 #1 │─────────────────────►│              │────────►│ dashboard   │
  └──────────┘                      │    broker    │         └─────────────┘
  ┌──────────┐ publish lab/102/temp │  (Mosquitto) │ deliver ┌─────────────┐
  │ ESP32 #2 │─────────────────────►│              │────────►│ DB writer   │
  └──────────┘◄─────────────────────│              │         └─────────────┘
       subscribed to lab/102/cmd    └──────────────┘
  Every client opens one outbound TCP connection to the broker (port 1883).`, caption: "Publish and subscribe through a broker." },

      { t: "h", text: "Topics and wildcards" },
      { t: "p", text: "A topic is a UTF-8 string with levels separated by `/`, such as `nitb/iotlab/bench07/temperature`. Topics are created simply by publishing to them. Subscribers can use two wildcards: `+` matches exactly one level, and `#` matches any number of levels and must come last." },
      { t: "table", head: ["Subscription", "Matches", "Does not match"], rows: [
        ["nitb/iotlab/+/temperature", "nitb/iotlab/bench07/temperature", "nitb/iotlab/bench07/air/temperature"],
        ["nitb/iotlab/bench07/#", "nitb/iotlab/bench07/temperature, nitb/iotlab/bench07/status", "nitb/iotlab/bench08/temperature"],
        ["nitb/#", "everything under nitb", "other/nitb/x"],
      ], caption: "Wildcards are only for subscribing, never for publishing." },
      { t: "p", text: "Good topic design: start broad and narrow down (organisation, site, device, measurement), put the device id in the topic so it is easy to subscribe per device, keep commands separate from telemetry (`.../bench07/cmd/led` versus `.../bench07/temperature`), avoid leading slashes and spaces, and never use `#` alone on a busy broker in production code." },

      { t: "h", text: "Quality of service" },
      { t: "p", text: "QoS is agreed separately for each hop: from publisher to broker, and from broker to each subscriber (at the lower of the publish QoS and the subscription QoS)." },
      { t: "diagram", text: String.raw`QoS 0, at most once         QoS 1, at least once        QoS 2, exactly once
client        broker         client        broker        client          broker
  │──PUBLISH────►│             │──PUBLISH───►│             │──PUBLISH id=7──►│
  │  (no reply)  │             │◄──PUBACK────│             │◄──PUBREC 7──────│
                               │ resend with  │             │──PUBREL 7──────►│
                               │ DUP if no ACK│             │◄──PUBCOMP 7─────│`, caption: "QoS 1 may deliver duplicates; QoS 2 uses a four-step handshake to prevent them." },
      { t: "list", items: [
        "**QoS 0**: fire and forget. Lost if the connection drops at the wrong moment. Fine for frequent sensor readings where the next value replaces the last.",
        "**QoS 1**: the sender stores the message until it gets PUBACK and resends if needed. The receiver may get duplicates, so give messages an id or make handling idempotent. The usual choice for important events and commands.",
        "**QoS 2**: exactly once, at the cost of two round trips per message. Use it rarely, for example for billing counters, and only if every hop supports it.",
      ] },
      { t: "p", text: "QoS protects against a dropped TCP connection while the client and broker sessions survive. It does not store messages while your device is off and has never connected; that is the job of persistent sessions (clean session false) or, on the device side, the store-and-forward technique in module i11." },

      { t: "h", text: "Retained messages and the last will" },
      { t: "p", text: "Normally a subscriber only receives messages published after it subscribes. If a dashboard starts up and the device publishes its temperature every ten minutes, the dashboard shows nothing for up to ten minutes. A **retained** message solves this: the broker keeps the last retained message on each topic and sends it immediately to every new subscriber. Publish slowly changing state (configuration, latest reading, online status) as retained. Clear a retained message by publishing an empty retained payload to the topic." },
      { t: "p", text: "A **last will and testament** (LWT) is a message the client gives the broker when it connects: \"if I disappear without disconnecting properly, publish this for me\". The broker detects disappearance when no packet arrives within 1.5 times the **keep-alive** interval. The standard status pattern combines both features:" },
      { t: "list", ordered: true, items: [
        "Connect with will topic `.../bench07/status`, will payload `offline`, will retain true.",
        "Immediately after connecting, publish `online` to the same topic with retain true.",
        "If the device loses power or Wi-Fi, the broker publishes the retained `offline` about 1.5 × keep-alive later. Any dashboard, even one opened later, sees the correct status.",
      ] },
      { t: "formula", text: String.raw`keep-alive = 15 s (PubSubClient default)
broker declares the client dead after 1.5 × 15 = 22.5 s of silence
PubSubClient sends PINGREQ when nothing else has been sent for 15 s`, caption: "Shorter keep-alive detects failures sooner but costs more traffic and battery." },

      { t: "h", text: "Brokers" },
      { t: "p", text: "**Eclipse Mosquitto** is the standard small broker, written in C, available for Linux, Windows, macOS and Raspberry Pi. In version 2.x, a fresh install only accepts connections from the same machine; to accept your ESP32 you must add a listener and choose an authentication policy in `mosquitto.conf`:" },
      { t: "snippet", lang: "text", code: String.raw`# /etc/mosquitto/conf.d/lab.conf  (Mosquitto 2.x)
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# create a user:   sudo mosquitto_passwd -c /etc/mosquitto/passwd bench07
# test from a laptop:
#   mosquitto_sub -h 192.168.1.10 -u bench07 -P <pw> -t 'nitb/iotlab/#' -v
#   mosquitto_pub -h 192.168.1.10 -u bench07 -P <pw> -t nitb/iotlab/bench07/cmd/led -m 1`, caption: "mosquitto_sub -v prints the topic with each message, the single most useful debugging tool in this lesson." },
      { t: "p", text: "Public test brokers such as `test.mosquitto.org` and `broker.hivemq.com` are useful for a first experiment, but treat them as a public noticeboard: anyone can subscribe to `#` and read your messages, anyone can publish to your command topics, there is no guaranteed uptime, and they may rate-limit you. Never send personal data or control anything real through them. For coursework, run Mosquitto on a laptop or Raspberry Pi on the lab network, or use a managed broker with accounts." },

      { t: "h", text: "An ESP32 MQTT node with PubSubClient" },
      { t: "p", text: "Nick O'Leary's **PubSubClient** (version 2.8) is the most widely used Arduino MQTT client. Know its limits: it speaks MQTT 3.1.1, publishes at QoS 0 only (it can subscribe at QoS 0 or 1), and its default packet buffer is 256 bytes including topic and headers, so larger payloads silently fail to publish unless you call `setBufferSize()`. It is synchronous: you must call `client.loop()` often." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x, PubSubClient 2.8, ArduinoJson 7.4.
// Publishes JSON telemetry, keeps a retained online/offline status with a last will,
// and obeys LED commands.
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"   // WIFI_SSID, WIFI_PASS, MQTT_HOST, MQTT_USER, MQTT_PASS

const char *DEVICE   = "bench07";
const char *T_STATUS = "nitb/iotlab/bench07/status";
const char *T_TELEM  = "nitb/iotlab/bench07/telemetry";
const char *T_CMD    = "nitb/iotlab/bench07/cmd/led";
const int LED_PIN = 2;

WiFiClient net;
PubSubClient mqtt(net);
uint32_t seq = 0;

void onMessage(char *topic, byte *payload, unsigned int len) {
  if (strcmp(topic, T_CMD) == 0 && len > 0) {
    digitalWrite(LED_PIN, payload[0] == '1' ? HIGH : LOW);
  }
}

bool connectMqtt() {
  // id, user, pass, willTopic, willQos, willRetain, willMessage
  if (!mqtt.connect(DEVICE, MQTT_USER, MQTT_PASS, T_STATUS, 1, true, "offline")) return false;
  mqtt.publish(T_STATUS, "online", true);            // retained
  mqtt.subscribe(T_CMD, 1);
  return true;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setCallback(onMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(15);
}

void loop() {
  static uint32_t lastTry = 0, lastPub = 0;
  if (WiFi.status() == WL_CONNECTED && !mqtt.connected() && millis() - lastTry > 5000) {
    lastTry = millis();                               // retry at most every 5 s, never block
    Serial.println(connectMqtt() ? "MQTT connected" : "MQTT connect failed");
  }
  mqtt.loop();                                        // receive, keep-alive pings

  if (mqtt.connected() && millis() - lastPub >= 10000) {
    lastPub = millis();
    JsonDocument doc;
    doc["seq"] = seq++;
    doc["temp_c"] = temperatureRead();                // ESP32 internal sensor: rough, for demo only
    doc["rssi"] = WiFi.RSSI();
    doc["uptime_s"] = millis() / 1000;
    char buf[160];
    size_t n = serializeJson(doc, buf);
    mqtt.publish(T_TELEM, (const uint8_t *)buf, n, false);
  }
}`, caption: "This is the skeleton of the module's exit project." },
      { t: "p", text: "Check the buffer: the telemetry topic is 29 characters, and a payload like `{\"seq\":123,\"temp_c\":41.5,\"rssi\":-61,\"uptime_s\":3600}` is 52 characters. Add 2 bytes of topic length and a 2-byte fixed header: 29 + 52 + 2 + 2 = 85 bytes, inside the default 256. A payload with a dozen fields and long names would not be, which is why the sketch raises the buffer to 512." },
      { t: "p", text: "For the dashboard half of the exit project, three easy routes: the free **IoT MQTT Panel** or **MQTT Dash** style phone apps (enter the broker address, add a gauge on the telemetry topic and a switch publishing to the command topic); **Node-RED** with its dashboard nodes on a laptop or Raspberry Pi (module i11); or a web page using an MQTT-over-WebSocket client, which needs a second Mosquitto listener with `protocol websockets`." },

      { t: "deep", title: "MQTT on the wire: the fixed header and remaining length", blocks: [
        { t: "p", text: "Every MQTT packet starts with a fixed header: one byte holding the packet type in the top four bits (3 = PUBLISH, 4 = PUBACK, 12 = PINGREQ and so on) and flags in the bottom four (for PUBLISH: DUP, two QoS bits, RETAIN), then the **remaining length** in a variable-length encoding of 1 to 4 bytes. Each length byte carries 7 bits of the number, and its top bit says whether another byte follows." },
        { t: "formula", text: String.raw`Remaining length 321:
321 = 2 × 128 + 65
first byte  = 65 + 128 (continuation) = 193 = 0xC1
second byte = 2                        = 0x02
decode: 65 + 2 × 128 = 321  ✓

PUBLISH, QoS 1, retain:  type 3 → 0011, flags QoS=01, RETAIN=1 → 0011 0011 = 0x33`, caption: "1 byte covers 0 to 127, 2 bytes up to 16 383, 4 bytes up to about 268 MB." },
        { t: "p", text: "A QoS 0 PUBLISH of 5 bytes to a 10-character topic is therefore 1 (type) + 1 (length) + 2 (topic length) + 10 (topic) + 5 (payload) = 19 bytes. Compare the hundreds of bytes of an HTTP request, and you see why MQTT suits slow and metered links." },
        { t: "p", text: "MQTT 5 (2019) adds properties to almost every packet: reason codes on acknowledgements, message expiry, topic aliases that replace a long topic with a 2-byte number, user properties, shared subscriptions for load balancing, and request and response topics. Mosquitto 2.x supports MQTT 5; PubSubClient does not, so for those features on an ESP32 use ESP-IDF's esp-mqtt client, which supports MQTT 5 and QoS 1 and 2 publishing." },
      ] },
      { t: "deep", title: "Sessions, offline queues and security", blocks: [
        { t: "p", text: "When a client connects with **clean session = false** (MQTT 3.1.1) and a fixed client id, the broker keeps its subscriptions and queues QoS 1 and 2 messages for it while it is offline, delivering them on reconnection. Client ids must therefore be unique: two devices using the same id will repeatedly kick each other off the broker, a classic bug when sixty students flash the same sketch. Build the id from the chip's MAC address, for example with `ESP.getEfuseMac()`." },
        { t: "p", text: "Security has three layers: **authentication** (username and password, or client certificates), **authorisation** (an ACL file in Mosquitto, such as letting user bench07 write only to `nitb/iotlab/bench07/#`), and **encryption** (TLS on port 8883, or else passwords travel in plain text). On a closed lab network, passwords plus ACLs are a reasonable start; anything on the internet needs TLS as well." },
      ] },
    ],
    mistakes: [
      "**Using a public test broker for anything real.** Anyone can read and publish on it.",
      "**Two devices with the same client id.** They disconnect each other in a loop; derive the id from the MAC address.",
      "**Forgetting `mqtt.loop()` or blocking for seconds in loop().** The keep-alive lapses, the broker drops you and publishes your will.",
      "**Payloads larger than PubSubClient's buffer.** publish() returns false and nothing is sent; call setBufferSize().",
      "**Publishing with a wildcard in the topic.** Wildcards are only valid in subscriptions.",
      "**Not making the status retained.** A dashboard opened later shows nothing until the next publish.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: a sensor node reporting to your own Mosquitto broker with a phone or web dashboard.",
      steps: [
        "Install Mosquitto 2.x on a laptop or Raspberry Pi, add the lab.conf listener and a password file, and restart it.",
        "Run `mosquitto_sub -v -t 'nitb/iotlab/#'` with your user and leave it open.",
        "Install PubSubClient 2.8, fill in secrets.h, upload the node sketch, and watch telemetry and the retained `online` status arrive.",
        "Replace temperatureRead() with a real sensor from an earlier module (the BMP280 driver from i7 works well).",
        "Build a dashboard: a phone MQTT app or Node-RED showing the temperature and a switch publishing 1 or 0 to the cmd/led topic.",
        "Pull the ESP32's USB cable and time how long until `offline` appears. Compare with 1.5 × keep-alive.",
      ],
    },
    quiz: [
      {
        q: "Which subscription receives `nitb/lab/b07/temp` and `nitb/lab/b12/temp` but not `nitb/lab/b07/air/temp`?",
        options: ["nitb/lab/#", "nitb/#/temp", "nitb/lab/*/temp", "nitb/lab/+/temp"],
        answer: 3,
        why: "+ matches exactly one level. # would match all three, # may only appear last, and * is not an MQTT wildcard.",
      },
      {
        q: "A device publishes commands at QoS 1. What must the receiver be prepared for?",
        options: [
          "Never receiving the message",
          "Receiving the same message more than once",
          "Messages arriving encrypted",
          "Having to send PUBREL",
        ],
        answer: 1,
        why: "QoS 1 is at-least-once: if the PUBACK is lost, the sender resends with the DUP flag, so duplicates are possible.",
      },
      {
        q: "A dashboard opens and immediately shows that bench07 is offline, although the device died an hour ago. Which two features made this work?",
        options: [
          "QoS 2 and a persistent session",
          "WebSockets and keep-alive",
          "A retained status topic and a last will that publishes offline with retain set",
          "Wildcards and DNS",
        ],
        answer: 2,
        why: "The broker published the will when the device vanished, and because it was retained, every later subscriber gets it at once.",
      },
      {
        q: "With a keep-alive of 20 s, roughly how long after a device loses power does the broker publish its will?",
        options: ["Immediately", "About 30 s", "About 20 minutes", "Never, unless the device sends DISCONNECT"],
        answer: 1,
        why: "The broker allows 1.5 × keep-alive of silence: 1.5 × 20 = 30 s.",
      },
      {
        q: "Why do IoT devices connect to a broker rather than each running a server?",
        options: [
          "Devices behind NAT can make outbound connections, and the broker decouples publishers from any number of subscribers",
          "Brokers are faster than TCP",
          "MQTT cannot run on a device",
          "Servers need IPv6",
        ],
        answer: 0,
        why: "Outbound connections pass through NAT, and publish/subscribe means a device publishes once whoever is listening.",
      },
    ],
  },

  "i10-bluetooth-low-energy": {
    id: "i10-bluetooth-low-energy",
    outcomes: [
      "Explain BLE roles in GAP: advertiser, scanner, peripheral and central",
      "Describe the GATT hierarchy of services, characteristics and descriptors, with 16-bit and 128-bit UUIDs",
      "Design a small GATT service and implement it on the ESP32 with notifications",
      "Estimate how advertising and connection intervals affect power and latency",
    ],
    blocks: [
      { t: "h", text: "Why BLE" },
      { t: "p", text: "Every phone has Bluetooth Low Energy, and no router or internet connection is needed. That makes BLE the natural link between a device and the person holding it: fitness bands, smart locks, medical sensors, tags, and the setup screens of countless products. It is designed for small, infrequent amounts of data at very low power; a coin cell can run a BLE beacon for a year or more. It is not Classic Bluetooth (used for audio and the old serial port profile); the two share the 2.4 GHz band but are different protocols. The ESP32 DevKit supports both; BLE is what you want for sensors." },

      { t: "h", text: "GAP: how devices find each other" },
      { t: "p", text: "The **Generic Access Profile** defines roles and discovery. A **peripheral** (your ESP32 sensor) **advertises**: it broadcasts a short packet, up to 31 bytes of payload in legacy advertising, on three dedicated channels (37, 38, 39) every advertising interval, typically 100 ms to a few seconds. A **central** (the phone) **scans** for advertisements and may then open a **connection**. A device can also stay connectionless, putting data straight into its advertisements (a **beacon**), so any number of phones can read it without connecting." },
      { t: "p", text: "Advertising data is a list of small fields: flags, the device name, a list of service UUIDs, transmit power, or manufacturer-specific data. 31 bytes fill quickly: a 128-bit service UUID alone takes 18 of them. A second packet, the **scan response**, gives another 31 bytes to scanners that ask." },
      { t: "h", text: "GATT: how data is organised" },
      { t: "p", text: "Once connected, data is exchanged with the **Generic Attribute Profile**. The peripheral is the GATT **server**: it holds a table of **attributes**. The central is the **client** and reads, writes or subscribes to them. Attributes are grouped in a hierarchy:" },
      { t: "diagram", text: String.raw`GATT server (ESP32)
├── Service 0x181A  Environmental Sensing
│   ├── Characteristic 0x2A6E  Temperature        [Read, Notify]
│   │   ├── Value: sint16, units of 0.01 °C       e.g. 0x0AF0 = 2800 → 28.00 °C
│   │   └── Descriptor 0x2902  CCCD               (client writes 0x0001 to enable notify)
│   └── Characteristic 0x2A6F  Humidity           [Read, Notify]
│       └── Value: uint16, units of 0.01 %
└── Service 3f2a9c10-7d4e-4b8a-9e21-5c6d0f8a1b00  (custom, random 128-bit UUID)
    └── Characteristic 3f2a9c11-7d4e-...  LED command  [Write]`, caption: "A service groups characteristics; each characteristic has a value, properties, and optional descriptors." },
      { t: "list", items: [
        "A **service** is a group of related data, such as Environmental Sensing or Battery Service (0x180F).",
        "A **characteristic** is one data item, with a value and **properties** saying what a client may do: Read, Write, Write Without Response, Notify, Indicate.",
        "A **descriptor** adds information about a characteristic. The most important is the **Client Characteristic Configuration Descriptor** (CCCD, 0x2902): a client writes 1 to it to enable notifications, 2 for indications.",
      ] },
      { t: "p", text: "**Notify** lets the server push a new value whenever it changes, without the client polling, and without acknowledgement. **Indicate** is the same but acknowledged by the client, slower and more reliable. For sensor readings, notify is the norm." },

      { t: "h", text: "UUIDs" },
      { t: "p", text: "Every service, characteristic and descriptor has a UUID. The Bluetooth SIG has assigned **16-bit UUIDs** to standard ones, which are shorthand for a full 128-bit UUID built on the Bluetooth base UUID:" },
      { t: "formula", text: String.raw`0000xxxx-0000-1000-8000-00805F9B34FB
0x181A  →  0000181A-0000-1000-8000-00805F9B34FB   (Environmental Sensing)
0x2A6E  →  00002A6E-0000-1000-8000-00805F9B34FB   (Temperature)`, caption: "The SIG's Assigned Numbers document lists all the 16-bit values." },
      { t: "p", text: "For your own services, generate a random **128-bit UUID** (for example with `uuidgen` on Linux or macOS, or `python3 -c \"import uuid; print(uuid.uuid4())\"`) and use it as the base for your characteristics, changing a few digits for each. Never invent a 16-bit UUID; those are reserved. Using standard services where they exist (temperature, battery, heart rate) means generic apps such as nRF Connect display your data with the right units automatically." },
      { t: "p", text: "The values themselves are raw bytes, **little-endian**, in whatever format the characteristic defines. The standard Temperature characteristic is a signed 16-bit integer in hundredths of a degree: 28.00 °C is 2800 = 0x0AF0, sent as the bytes F0 0A. A temperature of -5.25 °C is -525, which as a 16-bit two's complement is 65536 - 525 = 65011 = 0xFDF3, sent as F3 FD." },

      { t: "h", text: "Which BLE library on the ESP32" },
      { t: "p", text: "The Arduino-ESP32 core (3.3.x) ships its own **BLE** library, with `BLEDevice`, `BLEServer` and friends. On the original ESP32 it is built on Espressif's Bluedroid stack (the core's prebuilt configuration enables Bluedroid and not NimBLE for the ESP32); since core 3.3 the same library can also run on the lighter NimBLE stack on chips configured for it. The popular alternative is h2zero's **NimBLE-Arduino** library (version 2.x), which uses the NimBLE stack directly and typically saves 100 kB or more of flash and a large amount of RAM, with a very similar API. For a first project the built-in library is fine and needs no installation; switch to NimBLE-Arduino when you also need Wi-Fi, TLS and a lot of RAM at once. Avoid mixing examples written for the old (pre-3.0) core, whose callbacks differed slightly." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x, built-in BLE library (Bluedroid on ESP32).
// Environmental Sensing service with a notifying Temperature characteristic.
// Test with the nRF Connect app: connect, enable notifications on 0x2A6E.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

BLECharacteristic *tempChar;
bool clientConnected = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { clientConnected = true; }
  void onDisconnect(BLEServer *server) override {
    clientConnected = false;
    server->startAdvertising();          // advertise again so the phone can reconnect
  }
};

void setup() {
  Serial.begin(115200);
  BLEDevice::init("NITB-Env-07");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *ess = server->createService(BLEUUID((uint16_t)0x181A));
  tempChar = ess->createCharacteristic(BLEUUID((uint16_t)0x2A6E),
               BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  tempChar->addDescriptor(new BLE2902());   // CCCD so the client can enable notify
  ess->start();

  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(BLEUUID((uint16_t)0x181A));
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("Advertising");
}

void loop() {
  static uint32_t last = 0;
  if (millis() - last >= 2000) {
    last = millis();
    float c = temperatureRead();            // stand-in for a real sensor
    int16_t v = (int16_t)lroundf(c * 100.0f);
    uint8_t bytes[2] = { (uint8_t)(v & 0xFF), (uint8_t)((v >> 8) & 0xFF) };  // little-endian
    tempChar->setValue(bytes, 2);
    if (clientConnected) tempChar->notify();
  }
}`, caption: "Standard UUIDs let nRF Connect show the value as a temperature in °C." },

      { t: "h", text: "Connections, intervals and power" },
      { t: "p", text: "In a connection, the central and peripheral wake up together once every **connection interval** (7.5 ms to 4 s, negotiated) to exchange packets, and sleep in between. The **peripheral latency** lets the peripheral skip a number of those events when it has nothing to send. Short intervals give low latency and high throughput but more power; long ones save power. Phones usually choose 15 ms to 50 ms and may refuse very short requests. Advertising has the same trade-off." },
      { t: "formula", text: String.raw`Average current ≈ (event charge / interval) + sleep current

Example: each advertising event draws 8 mA for 3 ms (all three channels)
charge per event = 8 mA × 3 ms = 24 µC
interval 100 ms:  24 µC / 0.1 s = 240 µA  + sleep
interval 1 s:     24 µC / 1 s   = 24 µA   + sleep

CR2032 (≈ 220 mAh) at 24 µA + 2 µA sleep = 26 µA:
220 mAh / 0.026 mA ≈ 8460 h ≈ 350 days`, caption: "Illustrative numbers for a dedicated low-power BLE chip. Check every figure against your chip's datasheet." },
      { t: "p", text: "Check the arithmetic: 8 × 3 = 24 µC; 24 / 0.1 = 240 µA; 220 / 0.026 = 8462 h, and 8462 / 24 ≈ 353 days. These numbers are for a chip designed around BLE, such as an nRF52. The ESP32 draws far more (around 100 mA with the radio on and tens of milliamps idle with BLE active unless you use its light-sleep modes carefully), so an ESP32 BLE sensor is a mains or large-battery device. For coin-cell products, engineers choose a dedicated BLE microcontroller." },

      { t: "deep", title: "Throughput: how much data BLE can really move", blocks: [
        { t: "p", text: "Each GATT notification carries up to ATT_MTU - 3 bytes. The default ATT_MTU is 23 bytes, so 20 bytes of payload. Both sides can negotiate a larger MTU (up to 517), and with Data Length Extension (BLE 4.2+) a link-layer packet can carry up to 251 bytes. Several packets can be sent per connection event." },
        { t: "formula", text: String.raw`Default MTU, 1 notification per 30 ms interval:
20 bytes / 0.030 s = 667 bytes/s

MTU 247 (244-byte payload), 4 notifications per 15 ms event:
4 × 244 / 0.015 s = 65 067 bytes/s ≈ 520 kbit/s (on a 1M PHY, near the practical limit)`, caption: "Real throughput depends heavily on what the phone allows." },
        { t: "p", text: "The 2M PHY (BLE 5) doubles the air data rate for shorter range, and the Coded PHY trades speed for about four times the range. The original ESP32 supports BLE 4.2 only; the ESP32-S3 and ESP32-C3/C6 support BLE 5 features including 2M and Coded PHY." },
      ] },
      { t: "deep", title: "Pairing, bonding and BLE security", blocks: [
        { t: "p", text: "By default the characteristic above can be read by any phone in range. **Pairing** creates encryption keys for a connection, and **bonding** stores them so the devices recognise each other later. The method depends on the devices' input and output capabilities: Just Works (no protection against an active attacker), Passkey Entry (a 6-digit code shown on one side and typed on the other), Numeric Comparison (both show a code and the user confirms), or Out of Band (for example NFC). LE Secure Connections (BLE 4.2) uses elliptic-curve Diffie-Hellman and is much stronger than the older Legacy Pairing." },
        { t: "p", text: "For a device that controls anything (a lock, a motor, a heater), require an encrypted, authenticated connection for the write characteristics, which in the ESP32 BLE library means setting access permissions on the characteristic and configuring `BLESecurity`. Also remember that advertisements are public: never put secrets or personal data in them, and consider that a fixed MAC address lets anyone track the device; BLE privacy uses random resolvable addresses that change periodically." },
      ] },
    ],
    mistakes: [
      "**Inventing a 16-bit UUID for a custom service.** Use a random 128-bit UUID; 16-bit values are assigned by the Bluetooth SIG.",
      "**Sending a value as text or big-endian when the characteristic defines little-endian binary.** Generic apps then show nonsense.",
      "**Forgetting to restart advertising after a disconnect.** The phone can never find the device again until reset.",
      "**Notifying before the client has enabled notifications.** Without the CCCD set, the value is not sent; add the 0x2902 descriptor.",
      "**Expecting an ESP32 BLE sensor to run for months on a coin cell.** Its radio and core draw far too much; use a dedicated BLE chip for that.",
      "**Mixing examples for the pre-3.0 core, the 3.x core library and NimBLE-Arduino.** Their includes and callback signatures differ; pick one.",
    ],
    practice: {
      kind: "bench",
      task: "Build and inspect a BLE environmental sensor.",
      steps: [
        "Upload the lesson sketch to an ESP32 DevKit.",
        "Install nRF Connect on a phone. Scan, find NITB-Env-07, and read the advertising data: identify the flags, name and service UUID fields.",
        "Connect, expand the Environmental Sensing service, and enable notifications on Temperature. Confirm it updates every 2 seconds with a value in °C.",
        "Replace temperatureRead() with a real sensor, and add the Humidity characteristic (0x2A6F, uint16 in 0.01 %).",
        "Add a custom 128-bit service with a writable characteristic that switches the on-board LED (GPIO 2), and test it from nRF Connect by writing 01 and 00.",
      ],
    },
    quiz: [
      {
        q: "In a BLE connection between a phone app and an ESP32 sensor, which is usually the GATT server?",
        options: [
          "The phone, because it starts the connection",
          "The ESP32, which holds the services and characteristics the phone reads",
          "Neither: BLE has no server",
          "Whichever has the larger battery",
        ],
        answer: 1,
        why: "The GATT server holds the attribute table. The sensor is the server; the phone is the client (and the GAP central).",
      },
      {
        q: "The standard Temperature characteristic (sint16, 0.01 °C) carries the bytes 2C 01. What temperature is it?",
        options: ["3.00 °C", "112.65 °C", "1.12 °C", "11.26 °C"],
        answer: 0,
        why: "Little-endian: 0x012C = 300. 300 × 0.01 = 3.00 °C.",
      },
      {
        q: "What must a client do before it receives notifications from a characteristic?",
        options: [
          "Pair with a passkey",
          "Increase the MTU",
          "Write 0x0001 to the characteristic's CCCD (descriptor 0x2902)",
          "Read the characteristic every second",
        ],
        answer: 2,
        why: "Notifications are enabled per client by writing to the Client Characteristic Configuration Descriptor.",
      },
      {
        q: "Each advertising event costs 30 µC. Roughly what average current does advertising add at a 500 ms interval?",
        options: ["15 µA", "60 µA", "600 µA", "6 µA"],
        answer: 1,
        why: "30 µC every 0.5 s is 60 µC per second, which is 60 µA.",
      },
      {
        q: "You are designing a custom BLE service for a robot. What UUIDs should it use?",
        options: [
          "Any unused 16-bit value such as 0xABCD",
          "The Environmental Sensing UUID 0x181A",
          "A randomly generated 128-bit UUID, with related ones for its characteristics",
          "The device's MAC address",
        ],
        answer: 2,
        why: "16-bit UUIDs are reserved for SIG-assigned services. Custom services use random 128-bit UUIDs to avoid clashes.",
      },
    ],
  },

  "i10-long-range-radio-and-link-budget": {
    id: "i10-long-range-radio-and-link-budget",
    outcomes: [
      "Compare Wi-Fi, BLE, ESP-NOW, Zigbee, LoRa and NB-IoT by range, data rate, power, topology and cost",
      "Work in dBm and dB and calculate a simple link budget",
      "Explain how antenna gain, frequency and obstacles affect range",
      "Send data between two ESP32s with ESP-NOW without a router",
    ],
    blocks: [
      { t: "h", text: "No single radio fits every job" },
      { t: "p", text: "Wi-Fi is fast but needs a router and lots of power. BLE is low power but short range. A soil sensor 2 km from the nearest building, a hundred light switches in a hostel, and a water meter in a basement each need something else. Choosing the radio is one of the first and most expensive decisions in an IoT design, because it fixes the battery, the antenna, the infrastructure and the running cost. This lesson compares the main options and gives you the tool engineers use to reason about range: the link budget." },

      { t: "h", text: "The options compared" },
      { t: "table", head: ["", "Wi-Fi", "BLE", "ESP-NOW", "Zigbee", "LoRa / LoRaWAN", "NB-IoT"], rows: [
        ["Band", "2.4 GHz (5 GHz on some chips)", "2.4 GHz", "2.4 GHz (Wi-Fi radio)", "2.4 GHz (802.15.4)", "Sub-GHz: 865 to 867 MHz in India", "Licensed LTE bands"],
        ["Typical range", "30 to 100 m indoors", "10 to 50 m", "100 to 200 m line of sight", "10 to 100 m per hop, mesh", "2 to 15 km rural, 1 to 3 km urban", "Cellular coverage, deep indoor"],
        ["Data rate", "Mbit/s", "125 kbit/s to 2 Mbit/s", "1 Mbit/s default", "250 kbit/s", "About 0.3 to 5.5 kbit/s (SF12 to SF7)", "Tens of kbit/s"],
        ["Power", "High (about 100 mA active)", "Very low", "Moderate, short bursts", "Low", "Very low", "Low, with sleep modes"],
        ["Topology", "Star via access point", "Point to point, broadcast", "Peer to peer, no router", "Mesh with routers", "Star of stars via gateways", "Direct to operator network"],
        ["Infrastructure", "Router", "Phone or gateway", "None", "Coordinator, usually a hub", "Gateway (own or network)", "SIM and operator plan"],
        ["On the ESP32 DevKit", "Built in", "Built in", "Built in", "Needs ESP32-C6 or H2", "Add an SX1276 or SX1262 module (SPI)", "Add a modem such as a SIM7020 or BC95"],
      ], caption: "Typical figures; real range depends on antennas, obstacles and settings." },
      { t: "p", text: "A few clarifications. **ESP-NOW** is Espressif's own connectionless protocol that sends short frames (up to 250 bytes in its original version) directly between ESP chips by MAC address, using the Wi-Fi radio but no access point. It is ideal for a handful of ESP32s on a farm or across a building talking to one gateway ESP32. **Zigbee** is a low-power mesh network for home automation (bulbs, switches, sensors); mains-powered devices relay messages for battery ones. The ESP32-C6 and ESP32-H2 have the 802.15.4 radio it needs, and the Arduino-ESP32 core 3.x includes a Zigbee library for them; the original ESP32 does not. **LoRa** is a physical-layer modulation (chirp spread spectrum, from Semtech) giving very long range at very low data rates; **LoRaWAN** is the network protocol on top, with gateways forwarding packets to a network server. **NB-IoT** is a cellular standard: you need a SIM and a data plan from an operator that supports it, but no infrastructure of your own." },
      { t: "p", text: "A quick way to choose: if the device has mains power and Wi-Fi coverage, use Wi-Fi. If a phone is the user interface, BLE. If several ESP32s within a couple of hundred metres must talk without infrastructure, ESP-NOW. For many battery devices in a building, Zigbee or Thread. For a few bytes a few times an hour over kilometres, LoRa. For a device anywhere in the country with no gateway, NB-IoT or LTE-M." },

      { t: "h", text: "Decibels: the language of radio" },
      { t: "p", text: "Radio powers span an enormous range: a transmitter sends 0.1 W and a receiver can decode a signal of 0.000 000 000 000 1 W. Engineers therefore use logarithms. A ratio in **decibels** is 10 × log10(P2/P1). Power relative to one milliwatt is written **dBm**." },
      { t: "formula", text: String.raw`P(dBm) = 10 × log10( P / 1 mW )

100 mW = 20 dBm      10 mW = 10 dBm      1 mW = 0 dBm
0.001 mW = -30 dBm   1e-10 mW = -100 dBm

+3 dB ≈ double the power      +10 dB = ten times
-3 dB ≈ half the power        -10 dB = one tenth`, caption: "Gains and losses in dB simply add and subtract." },
      { t: "p", text: "The benefit is that a whole radio link becomes addition. Transmit power in dBm, plus antenna gains in dBi, minus losses in dB, gives the received power in dBm. Compare it with the receiver's **sensitivity** (the weakest signal it can decode at a given data rate, from the datasheet) and the difference is your **margin**." },

      { t: "h", text: "The link budget" },
      { t: "formula", text: String.raw`P_rx = P_tx + G_tx - L_tx_cable - L_path + G_rx - L_rx_cable
Margin = P_rx - Sensitivity`, caption: "All terms in dB or dBm." },
      { t: "p", text: "The biggest loss is the path itself. Even in empty space, power spreads over a growing sphere, giving the **free-space path loss**, which grows with both distance and frequency:" },
      { t: "formula", text: String.raw`FSPL(dB) = 20 log10(d in km) + 20 log10(f in MHz) + 32.44`, caption: "Doubling the distance adds 6 dB; doubling the frequency also adds 6 dB." },
      { t: "p", text: "Worked example: two ESP32s 100 m apart in an open field, at 2440 MHz (the middle of the 2.4 GHz band), each transmitting 20 dBm with a 2 dBi PCB antenna." },
      { t: "formula", text: String.raw`FSPL = 20 log10(0.1) + 20 log10(2440) + 32.44
     = -20 + 67.75 + 32.44
     = 80.19 dB

P_rx = 20 + 2 - 80.19 + 2 = -56.2 dBm`, caption: "No cable losses with on-board antennas." },
      { t: "p", text: "The ESP32 datasheet gives a receive sensitivity of about -73 dBm for the fastest 802.11n rate (MCS7) and about -98 dBm for the slowest 802.11b rate (1 Mbit/s). So the margin is -56.2 - (-73) = 16.8 dB at full speed and 41.8 dB at the slowest rate. Check: -56.2 + 73 = 16.8, and -56.2 + 98 = 41.8. (Strictly, the same datasheet gives the ESP32's transmit power as about 20 dBm only at 802.11b rates and about 14 dBm at MCS7, so the real full-speed margin is nearer 11 dB.) Two brick walls (very roughly 5 to 10 dB each) and a person's body (3 dB or more) can eat the 16.8 dB margin, and Wi-Fi then falls back to slower rates rather than failing outright. Engineers aim for a **fade margin** of 10 to 20 dB to cover such losses and fading." },

      { t: "h", text: "Antennas and real-world range" },
      { t: "list", items: [
        "**Antenna gain** (dBi) is not extra power: it is focusing. A 6 dBi antenna sends more power in some directions and less in others. A dipole is about 2.15 dBi; ESP32 PCB antennas are around 2 dBi at best and very sensitive to what is near them.",
        "**Keep metal and hands away from the antenna.** On the ESP32 DevKit, the antenna is the wavy trace at the end of the module; a ground plane, a metal case or a breadboard under it can cost 10 dB or more. Modules with a u.FL connector (ESP32-WROOM-32U) allow an external antenna.",
        "**Lower frequencies go further** for the same antenna size class and penetrate walls and foliage better, which is a large part of why LoRa uses sub-GHz bands: 866 MHz has about 9 dB less free-space loss than 2440 MHz at the same distance (20 log10(2440/866) ≈ 9.0 dB).",
        "**Height matters** because the ground and obstacles block the Fresnel zone, the football-shaped region around the line of sight that must be mostly clear. Raising a LoRa antenna from 1 m to 10 m can multiply range several times.",
        "**Slower is further**: every radio's sensitivity improves as data rate falls. LoRa's spreading factor (SF7 to SF12) trades data rate for sensitivity, each step roughly halving the rate and gaining about 2.5 dB.",
      ] },

      { t: "h", text: "ESP-NOW in practice" },
      { t: "p", text: "ESP-NOW uses the ESP-IDF API (`esp_now.h`), which the Arduino-ESP32 core 3.3 includes; the core also has a C++ wrapper library (ESP_NOW), but the IDF calls below are the stable, documented base. Both boards must be on the same Wi-Fi channel. Sending to the broadcast address FF:FF:FF:FF:FF:FF reaches every ESP-NOW device in range on that channel, which avoids needing to know MAC addresses for a first test." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP32 DevKit, Arduino-ESP32 core 3.3.x (ESP-IDF 5.5 esp_now API).
// Flash the same sketch to two boards: each broadcasts a reading once a second
// and prints whatever it receives. No router needed.
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

struct __attribute__((packed)) Reading {
  uint32_t seq;
  int16_t temp_centi_c;
};

const uint8_t BROADCAST[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
uint32_t seq = 0;

void onReceive(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len != sizeof(Reading)) return;            // ignore anything unexpected
  Reading r;
  memcpy(&r, data, sizeof r);
  const uint8_t *m = info->src_addr;
  Serial.printf("from %02X:%02X:%02X:%02X:%02X:%02X  seq %lu  %.2f C  RSSI %d\n",
                m[0], m[1], m[2], m[3], m[4], m[5], (unsigned long)r.seq,
                r.temp_centi_c / 100.0, info->rx_ctrl->rssi);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);                           // radio on, not connected to any AP
  esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);  // both boards on channel 1
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    while (true) delay(1000);
  }
  esp_now_register_recv_cb(onReceive);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, BROADCAST, 6);
  peer.channel = 1;
  peer.encrypt = false;                          // broadcast frames cannot be encrypted
  esp_now_add_peer(&peer);
  Serial.print("My MAC: ");
  Serial.println(WiFi.macAddress());
}

void loop() {
  Reading r = { seq++, (int16_t)lroundf(temperatureRead() * 100) };
  esp_now_send(BROADCAST, (const uint8_t *)&r, sizeof r);
  delay(1000);
}`, caption: "A packed struct keeps the 6-byte layout identical on both boards." },
      { t: "p", text: "If the receiving board is also connected to a Wi-Fi router (to act as a gateway forwarding to MQTT), it must use the router's channel, and the sensor nodes must transmit on that same channel. Unicast ESP-NOW (to a known MAC address) is acknowledged at the link layer and can be encrypted with a shared key; broadcast is neither." },

      { t: "deep", title: "Worked example: how far can a LoRa link reach?", blocks: [
        { t: "p", text: "Take an SX1276-based LoRa module at 866 MHz, transmitting 14 dBm, with 2 dBi antennas at both ends and no cable loss. At SF12 with 125 kHz bandwidth, Semtech's datasheet gives a sensitivity of about -137 dBm. Allow a 20 dB fade margin." },
        { t: "formula", text: String.raw`Maximum path loss = P_tx + G_tx + G_rx - Sensitivity - Margin
                  = 14 + 2 + 2 - (-137) - 20
                  = 135 dB

Free space: 20 log10(d) = 135 - 32.44 - 20 log10(866)
                        = 135 - 32.44 - 58.75
                        = 43.81
            d = 10^(43.81 / 20) km = 10^2.19 ≈ 155 km`, caption: "The free-space answer is an upper bound, not a prediction." },
        { t: "p", text: "Real LoRa links over flat ground with antennas a couple of metres up reach a few kilometres to perhaps 15 km, far less than 155 km. The reason is that near the ground, the direct and ground-reflected waves partly cancel, and loss grows with the **fourth** power of distance (40 dB per decade) beyond a breakpoint distance, rather than the square (20 dB per decade). Buildings and trees add more. Record-breaking LoRa links of hundreds of kilometres use balloons or mountain tops, where the free-space model holds." },
        { t: "p", text: "The same budget explains the data-rate trade. At SF7 the sensitivity is about -123 dBm, 14 dB worse than SF12, so the maximum path loss is 121 dB; in free space that is 14 dB, or a factor of 10^(14/20) ≈ 5 in distance, shorter. In return SF7 sends a packet about 20 to 30 times faster, so it uses far less airtime and battery. LoRaWAN's adaptive data rate picks the fastest SF that still reaches a gateway." },
      ] },
      { t: "deep", title: "Duty cycle, airtime and why LoRa sends so little", blocks: [
        { t: "p", text: "A LoRa symbol lasts 2^SF / BW seconds. At SF12 and 125 kHz: 4096 / 125 000 = 32.8 ms per symbol, carrying 12 bits of spread information before coding. A 20-byte payload at SF12 takes roughly 1.3 s on air (Semtech's airtime calculator gives about 1318 ms with an 8-symbol preamble, CR 4/5, explicit header, CRC and low data rate optimisation); at SF7 it takes about 56 ms." },
        { t: "p", text: "Regional rules and network fair-use policies limit airtime. In Europe the 868 MHz band has a 1% duty cycle limit: after a 1.3 s transmission, a device must stay silent for about 130 s. India's licence-exempt 865 to 867 MHz band (WPC notification GSR 1048(E), 2005, as amended) differs: it limits transmitter power to 1 W (4 W ERP) and channel bandwidth to 200 kHz, and sets no duty-cycle limit; check the current WPC notification before a product, but public LoRaWAN networks such as The Things Network apply their own fair-use limits, typically 30 seconds of uplink airtime per device per day. At 1.3 s per message that is about 22 messages a day at SF12 (30 / 1.32 ≈ 22.7, and a partial message does not count). Design LoRa devices to send small binary payloads (module i11 shows how) a few times an hour." },
      ] },
    ],
    mistakes: [
      "**Adding milliwatts and decibels.** Convert everything to dB and dBm, then add and subtract.",
      "**Treating antenna gain as free power.** Gain in one direction comes from loss in others; a high-gain antenna must be aimed.",
      "**Using the free-space range as a prediction.** Ground reflections and obstacles cut real range drastically; keep a 10 to 20 dB margin.",
      "**Mounting an ESP32 DevKit with its antenna over a metal plate or inside a metal box.** Range collapses.",
      "**ESP-NOW boards on different Wi-Fi channels.** They never hear each other; a gateway connected to a router forces its channel.",
      "**Choosing LoRa for streaming data.** It moves bytes per second, not kilobytes.",
    ],
    practice: {
      kind: "bench",
      task: "Measure a link budget against reality with ESP-NOW.",
      steps: [
        "Flash the ESP-NOW sketch to two ESP32 DevKits and confirm each prints the other's readings with RSSI.",
        "Calculate the expected RSSI at 1 m, 10 m and 30 m in free space using the lesson's figures (assume about 20 dBm transmit and 2 dBi antennas).",
        "Measure the RSSI at those distances in a corridor or open ground, averaging ten readings at each.",
        "Repeat at 10 m with a wall in between, and with your hand wrapped around one module's antenna. Record the loss in dB for each.",
        "Walk away until packets start to drop (watch for gaps in seq). Note the distance and the last RSSI, and compare with the ESP32's datasheet sensitivity.",
      ],
    },
    quiz: [
      {
        q: "What is 50 mW in dBm?",
        options: ["About 17 dBm", "About 50 dBm", "About 5 dBm", "About 27 dBm"],
        answer: 0,
        why: "10 × log10(50) = 10 × 1.699 ≈ 17 dBm. (100 mW would be 20 dBm; half of that is 3 dB less.)",
      },
      {
        q: "Free-space path loss at 2.4 GHz is 80 dB at 100 m. Roughly what is it at 400 m?",
        options: ["86 dB", "92 dB", "320 dB", "84 dB"],
        answer: 1,
        why: "Each doubling of distance adds 6 dB. 100 m to 400 m is two doublings, so 80 + 12 = 92 dB.",
      },
      {
        q: "Transmit 20 dBm, both antennas 2 dBi, path loss 95 dB, receiver sensitivity -90 dBm. What is the margin?",
        options: ["-71 dB", "19 dB", "29 dB", "15 dB"],
        answer: 1,
        why: "P_rx = 20 + 2 + 2 - 95 = -71 dBm. Margin = -71 - (-90) = 19 dB.",
      },
      {
        q: "Several battery ESP32 nodes 150 m apart on a farm must send readings to one gateway ESP32 with no router. Which link fits best?",
        options: ["NB-IoT", "Wi-Fi station mode", "BLE through a phone", "ESP-NOW"],
        answer: 3,
        why: "ESP-NOW sends short frames directly between ESP32s by MAC address, needs no access point, and reaches a couple of hundred metres in the open.",
      },
      {
        q: "Why does LoRa use a sub-GHz band and very low data rates?",
        options: [
          "Lower frequencies suffer less path loss and penetrate obstacles better, and lower data rates improve receiver sensitivity, both extending range",
          "Because 2.4 GHz is illegal in India",
          "To reach higher throughput",
          "Because LoRa needs a SIM card",
        ],
        answer: 0,
        why: "Path loss rises with frequency, and sensitivity improves as data rate falls. LoRa trades speed for range on both counts.",
      },
    ],
  },
};

export default lessons;
