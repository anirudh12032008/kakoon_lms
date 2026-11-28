import type { ModuleContent } from "../model/curriculum";

/**
 * Module a11: ROS 2 fundamentals.
 * Written for ROS 2 Lyrical Luth (LTS, released May 2026, supported to May 2031)
 * on Ubuntu 26.04, with Gazebo Jetty. Code uses String.raw; where a snippet needs
 * a dollar-brace sequence (CMake, xacro) it is joined from plain strings.
 */
const lessons: ModuleContent = {
  "a11-ros2-concepts-and-communication": {
    id: "a11-ros2-concepts-and-communication",
    outcomes: [
      "Explain what ROS 2 is and why robots are built from many small communicating nodes",
      "Choose between topics, services, actions and parameters for a given job",
      "Set quality of service policies and diagnose the classic best-effort versus reliable mismatch",
      "Inspect a running system with the ros2 command-line tools",
    ],
    blocks: [
      { t: "h", text: "Why robots need a framework" },
      { t: "p", text: "A mobile robot that can drive to a point on a map needs drivers for its LiDAR, camera, IMU and motors, a localisation algorithm, a mapper, a path planner, a controller that follows the path, a safety monitor and a user interface. Written as one program, that is unmaintainable: a bug in the camera driver crashes the planner, and nothing can be reused on the next robot. **ROS 2** (Robot Operating System 2, which is a set of libraries and tools rather than an operating system) splits the robot into many small programs called **nodes** that exchange typed messages. A LiDAR driver written in Germany and a planner written in India work together because they agree on the message type `sensor_msgs/msg/LaserScan`." },
      { t: "p", text: "This module uses **ROS 2 Lyrical Luth**, the long-term support (LTS) release of May 2026, supported until May 2031. Its primary platform is **Ubuntu 26.04 LTS**, on amd64 or arm64 (so it runs natively on a laptop or a Raspberry Pi 5 with Ubuntu). The previous LTS, Jazzy Jalisco (2024, on Ubuntu 24.04), is still supported until 2029 and almost everything here applies to it unchanged; where they differ, it is noted. ROS 2 releases come every May, alternating LTS (even years) and short-lived releases; always state your distribution when asking for help." },
      { t: "snippet", lang: "bash", code: String.raw`# After adding the ROS 2 apt repository as described on docs.ros.org for Lyrical:
sudo apt install ros-lyrical-desktop ros-dev-tools
echo "source /opt/ros/lyrical/setup.bash" >> ~/.bashrc
source ~/.bashrc
ros2 run demo_nodes_cpp talker        # terminal 1
ros2 run demo_nodes_py listener       # terminal 2: a C++ node and a Python node talking`, caption: "Install and a first test. Every new terminal must source a setup file before ros2 commands work." },

      { t: "h", text: "The ROS 2 graph" },
      { t: "p", text: "Underneath, ROS 2 uses **DDS** (Data Distribution Service), an industrial publish/subscribe middleware, through a layer called the **RMW** (ROS middleware interface). Nodes on the same network **discover** each other automatically; there is no central master as in ROS 1. The set of nodes and the connections between them is called the **graph**. Nodes are grouped into logical networks by `ROS_DOMAIN_ID` (an integer, 0 by default): nodes only see others with the same ID. In a lab with twenty students on one Wi-Fi network, give each student a different ID, or everyone's robots will hear everyone's commands." },
      { t: "p", text: "There are four ways for nodes to communicate. Choosing the right one is the most important design decision in a ROS system." },
      { t: "table", head: ["Mechanism", "Pattern", "Use it for", "Example"], rows: [
        ["Topic", "Publish/subscribe, many to many, continuous", "Data streams", "/scan, /odom, /cmd_vel, /camera/image_raw"],
        ["Service", "Request/response, one call, short", "Quick queries and commands", "/spawn, /reset, get a map"],
        ["Action", "Goal, feedback, result, cancellable", "Long-running tasks", "navigate to a pose, rotate to an angle"],
        ["Parameter", "Named setting on a node", "Configuration", "max_speed, wheel_radius, use_sim_time"],
      ] },

      { t: "h", text: "Topics" },
      { t: "p", text: "A **topic** is a named channel with one message type. Publishers send messages to it without knowing who listens; subscribers receive every message without knowing who sent it. This decoupling is the heart of ROS: you can replace a real LiDAR driver with a simulator, or a recorded file, and nothing downstream notices. Messages are defined in `.msg` files, such as `geometry_msgs/msg/Twist` (a linear and an angular 3D vector, the standard velocity command) or `TwistStamped` (the same with a header carrying a timestamp and frame)." },
      { t: "snippet", lang: "bash", code: String.raw`ros2 run turtlesim turtlesim_node                 # a 2D simulated turtle
ros2 node list                                     # /turtlesim
ros2 topic list -t                                 # topics with their types
ros2 topic echo /turtle1/pose                      # watch messages
ros2 topic hz /turtle1/pose                        # measure publish rate
ros2 topic info -v /turtle1/cmd_vel                # publishers, subscribers, QoS
ros2 interface show geometry_msgs/msg/Twist        # message definition
ros2 topic pub --rate 1 /turtle1/cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 2.0}, angular: {z: 1.8}}"         # drive in a circle`, caption: "Exploring topics with turtlesim. In Jazzy and Lyrical turtlesim's own interfaces live in the turtlesim_msgs package." },

      { t: "h", text: "Services, actions and parameters" },
      { t: "p", text: "A **service** is a function call across the network: the client sends a request and waits for one response. It suits short operations. Do not use a service for something that takes seconds, because the caller blocks and cannot be told about progress or cancel. An **action** is built for exactly that: the client sends a **goal**, the server sends periodic **feedback** and finally a **result**, and the client may **cancel** at any time. Navigation in Nav2 is an action. A **parameter** is a typed value (bool, int, double, string or arrays) owned by a node, which can be set at startup from a YAML file and changed at runtime." },
      { t: "snippet", lang: "bash", code: String.raw`ros2 service list
ros2 service call /spawn turtlesim_msgs/srv/Spawn "{x: 2.0, y: 2.0, theta: 0.0, name: 't2'}"
ros2 action list -t
ros2 action send_goal --feedback /turtle1/rotate_absolute \
  turtlesim_msgs/action/RotateAbsolute "{theta: 1.57}"
ros2 param list /turtlesim
ros2 param set /turtlesim background_r 150
ros2 param dump /turtlesim > turtlesim.yaml        # save all parameters to a file`, caption: "A service call, an action goal with feedback, and parameters." },

      { t: "h", text: "Quality of service" },
      { t: "p", text: "Over Wi-Fi, packets are lost. Should a lost message be resent? For a velocity command, no: by the time it arrives a newer one exists. For a map that is sent once, yes. ROS 2 lets each publisher and subscriber choose **quality of service** (QoS) policies. The three you must know:" },
      { t: "list", items: [
        "**Reliability**: `RELIABLE` resends lost messages until acknowledged (like TCP); `BEST_EFFORT` sends once and accepts loss (like UDP). Sensor drivers usually publish best effort, because a stale scan is worthless and retransmission would add latency and congest the link.",
        "**Durability**: `VOLATILE` gives a subscriber only messages published after it joined; `TRANSIENT_LOCAL` makes the publisher keep its last messages and deliver them to late joiners. `/robot_description` and `/map` use transient local, so a tool started later still receives them.",
        "**History and depth**: `KEEP_LAST` with depth N keeps the N newest messages in the queue (the `10` in `create_publisher(..., 10)` is this depth); `KEEP_ALL` keeps everything, limited by resources.",
      ] },
      { t: "p", text: "Publisher and subscriber policies must be **compatible**, or they do not connect, and the default behaviour is silence. The rule is that the publisher must offer at least what the subscriber requests. A reliable publisher can serve a best-effort subscriber, but a **best-effort publisher cannot serve a reliable subscriber**. Likewise a volatile publisher cannot serve a transient-local subscriber." },
      { t: "table", head: ["Publisher offers", "Subscriber requests", "Connects?"], rows: [
        ["RELIABLE", "RELIABLE", "yes"],
        ["RELIABLE", "BEST_EFFORT", "yes"],
        ["BEST_EFFORT", "BEST_EFFORT", "yes"],
        ["BEST_EFFORT", "RELIABLE", "no: no messages, a warning about incompatible QoS"],
        ["TRANSIENT_LOCAL", "VOLATILE", "yes"],
        ["VOLATILE", "TRANSIENT_LOCAL", "no"],
      ], caption: "Request versus offer: the subscriber cannot ask for more than the publisher provides." },
      { t: "p", text: "This produces **the classic sensor-data mismatch**. A camera or LiDAR driver publishes with the sensor-data profile (best effort). You write a subscriber with the default profile (reliable, depth 10). The topic shows in `ros2 topic list`, `ros2 topic echo` (which adapts its QoS) prints messages, yet your node's callback never runs. `ros2 topic info -v /scan` reveals the reliability of each endpoint, and the node logs a warning about an incompatible QoS policy. The fix is to subscribe with the sensor-data profile:" },
      { t: "snippet", lang: "python", code: String.raw`import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan


class ScanWatcher(Node):
    def __init__(self):
        super().__init__("scan_watcher")
        # Best effort, keep last 5, volatile: compatible with any sensor driver.
        self.create_subscription(LaserScan, "scan", self.on_scan, qos_profile_sensor_data)

    def on_scan(self, msg: LaserScan):
        valid = [r for r in msg.ranges if msg.range_min < r < msg.range_max]
        if valid:
            self.get_logger().info(f"nearest obstacle {min(valid):.2f} m")


def main():
    rclpy.init()
    node = ScanWatcher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()`, caption: "Subscribing to a sensor topic with qos_profile_sensor_data (best effort, keep last 5)." },
      { t: "note", kind: "tip", text: "When a subscriber receives nothing, check three things in order: the topic name (`ros2 topic list`), the message type (`ros2 topic info`), and the QoS (`ros2 topic info -v`). Then check `ROS_DOMAIN_ID` on both machines." },

      { t: "deep", title: "How discovery and DDS actually work", blocks: [
        { t: "p", text: "Each DDS participant (roughly, each process) periodically multicasts announcements on UDP: \"I exist, I publish /scan of type LaserScan with these QoS\". Every other participant matches publishers and subscribers by topic name, type and QoS, then sends data directly between them, by unicast UDP or shared memory on the same machine. The domain ID selects the UDP port numbers (port = 7400 + 250 × domain + offset in the standard mapping), which is why different domains do not see each other." },
        { t: "p", text: "Multicast is often blocked on campus and enterprise Wi-Fi, which makes nodes on two machines invisible to each other while each works alone. Fixes include `ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST` to keep a robot's traffic on one machine, `ROS_STATIC_PEERS` to list peer IP addresses explicitly, a Fast DDS discovery server, or switching RMW. Lyrical ships several RMW implementations, selected with `RMW_IMPLEMENTATION`: `rmw_fastrtps_cpp` (the default), `rmw_cyclonedds_cpp`, and `rmw_zenoh_cpp`, which uses the Zenoh protocol with a router (`ros2 run rmw_zenoh_cpp rmw_zenohd`) instead of multicast discovery and copes much better with Wi-Fi and the internet. All nodes in a system should use the same RMW." },
        { t: "p", text: "Some QoS policies beyond the big three: **deadline** (the publisher promises a message at least every period), **liveliness** and **lease duration** (how a subscriber learns that a publisher died), and **lifespan** (messages older than this are discarded). They are useful for safety monitoring: a motor controller can set a deadline on `/cmd_vel` and stop when it is missed." },
      ] },
      { t: "deep", title: "Topic or service or action: harder cases", blocks: [
        { t: "p", text: "\"Turn the lights on\" is a service if you need confirmation, or a topic if a stream of desired states is natural (the latest state always wins, and a missed message is corrected by the next). Desired-state topics are more robust than one-off commands, which is why `/cmd_vel` is a stream: the base stops if the stream stops." },
        { t: "p", text: "Never call a service and wait for it from inside a callback of the same single-threaded node: the response can only be processed by the executor that is blocked waiting, so the node deadlocks. In rclpy use `call_async` and handle the future, use a separate callback group with a multi-threaded executor, or, new in Lyrical, write the node with `AsyncNode` and `await client.call(request)` on asyncio." },
      ] },
    ],
    mistakes: [
      "**Forgetting to source the setup file** in a new terminal, so `ros2` is not found or your package is unknown.",
      "**Subscribing to a sensor topic with default (reliable) QoS** when the driver publishes best effort. The callback never fires. Use `qos_profile_sensor_data`.",
      "**Using a service for a long task** such as driving to a point. Use an action so there is feedback and cancellation.",
      "**Twenty robots on one network with the same ROS_DOMAIN_ID.** Everyone's nodes see everyone else's topics.",
      "**Mixing distributions** (a Jazzy machine and a Lyrical machine). Messages can differ between releases; use the same distribution everywhere.",
    ],
    practice: {
      kind: "bench",
      task: "Explore the ROS 2 graph and provoke a QoS mismatch on purpose.",
      steps: [
        "Install Lyrical on Ubuntu 26.04 (native, a VM, or a Pi 5 with Ubuntu) and run the demo talker and listener.",
        "Run turtlesim and teleop (`ros2 run turtlesim turtle_teleop_key`). Open `rqt_graph` and identify each node and topic.",
        "Call the spawn service, send a rotate action goal with feedback, and change the background colour parameter.",
        "In one terminal publish best effort: `ros2 topic pub --qos-reliability best_effort /test std_msgs/msg/String \"{data: hi}\"`. In another, echo with `--qos-reliability reliable`. Observe the incompatibility warning, then echo with best_effort and see the data.",
        "Set `export ROS_DOMAIN_ID=42` in one terminal only and confirm that its nodes can no longer see the others.",
      ],
    },
    quiz: [
      {
        q: "A LiDAR driver publishes /scan with BEST_EFFORT reliability. Your node subscribes with the default RELIABLE profile. What happens?",
        options: [
          "Your node receives every message, with retransmissions",
          "Your node receives nothing, because a best-effort publisher cannot satisfy a reliable subscriber",
          "The driver switches to reliable automatically",
          "Your node receives half the messages",
        ],
        answer: 1,
        why: "QoS is request versus offer. The subscriber requests reliable; the publisher only offers best effort, so they are incompatible and do not connect.",
      },
      {
        q: "Which mechanism suits 'drive to the charging dock', which takes 40 seconds and might need cancelling?",
        options: ["A topic", "A service", "A parameter", "An action"],
        answer: 3,
        why: "Actions are for long-running, cancellable goals with feedback. A service would block the caller with no progress or cancel.",
      },
      {
        q: "A visualisation tool started after the robot description was published still shows the robot model. Which QoS policy makes that possible?",
        options: [
          "Reliability RELIABLE",
          "History KEEP_LAST with depth 1",
          "Durability TRANSIENT_LOCAL",
          "Best effort",
        ],
        answer: 2,
        why: "Transient local durability makes the publisher keep its last messages and deliver them to subscribers that join later.",
      },
      {
        q: "Two students' robots on the same Wi-Fi respond to each other's teleop commands. What is the simplest fix?",
        options: [
          "Use different ROS_DOMAIN_ID values",
          "Rename all topics",
          "Switch to services",
          "Turn off QoS",
        ],
        answer: 0,
        why: "Nodes only discover others in the same domain. Different domain IDs separate the two systems without changing any code.",
      },
      {
        q: "In `create_publisher(String, \"chatter\", 10)`, what is the 10?",
        options: [
          "The publish rate in hertz",
          "The history depth: the queue keeps the 10 newest messages",
          "The domain ID",
          "The maximum message size in kilobytes",
        ],
        answer: 1,
        why: "An integer in place of a QoS profile means KEEP_LAST history with that depth, and otherwise default policies.",
      },
    ],
  },

  "a11-workspaces-packages-and-nodes": {
    id: "a11-workspaces-packages-and-nodes",
    outcomes: [
      "Create a colcon workspace with ament_python and ament_cmake packages",
      "Write a minimal publisher and subscriber in Python (rclpy) and C++ (rclcpp)",
      "Declare and use parameters in a node",
      "Start a multi-node system with a Python launch file",
    ],
    blocks: [
      { t: "h", text: "From commands to your own code" },
      { t: "p", text: "The command-line tools let you poke at a running system. Building a robot means writing your own nodes, packaging them so that others can build and reuse them, and starting dozens of them with the right parameters in one command. ROS 2 gives a standard way to do each: **packages** to hold code, **colcon** to build a **workspace** of packages, and **launch files** to start them. Following these conventions is not bureaucracy: it is what lets you install someone else's driver with one `git clone` and one build command." },

      { t: "h", text: "Workspaces and colcon" },
      { t: "p", text: "A **workspace** is a directory with a `src` folder containing packages. **colcon** builds every package in `src`, in dependency order, into `build/`, and installs the results into `install/`. Sourcing `install/setup.bash` then **overlays** your workspace on top of the ROS installation in `/opt/ros/lyrical` (the **underlay**): your packages are found first, and everything else comes from the installation." },
      { t: "diagram", text: String.raw`
 ~/ros2_ws/
 ├── src/                  ← your packages (in git)
 │   ├── my_py_pkg/        ament_python: package.xml, setup.py, my_py_pkg/*.py
 │   └── my_cpp_pkg/       ament_cmake: package.xml, CMakeLists.txt, src/*.cpp
 ├── build/                ← intermediate files (not in git)
 ├── install/              ← results; source install/setup.bash
 └── log/                  ← build logs`, caption: "Workspace layout. Only src belongs in version control." },
      { t: "snippet", lang: "bash", code: String.raw`mkdir -p ~/ros2_ws/src && cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python --dependencies rclpy std_msgs my_py_pkg
ros2 pkg create --build-type ament_cmake  --dependencies rclcpp std_msgs my_cpp_pkg
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -y     # install dependencies named in package.xml
colcon build --symlink-install                      # build everything
source install/setup.bash                           # overlay this workspace
colcon build --packages-select my_py_pkg            # rebuild just one package`, caption: "Create, build and source. --symlink-install links Python files instead of copying them, so edits take effect without rebuilding." },
      { t: "p", text: "Every package has a `package.xml` (its name, version, licence and dependencies, used by colcon to order the build and by `rosdep` to install system dependencies) and a build file. **ament_python** packages use `setup.py`, and each executable is an **entry point** that names a Python function. **ament_cmake** packages use `CMakeLists.txt`, which compiles executables and installs them into `lib/<package>` where `ros2 run` looks for them." },
      { t: "note", kind: "warn", text: "Never build in a terminal where you have already sourced the same workspace's install/setup.bash, if you have renamed or removed packages, and never source two different workspaces' setups in a confusing order. When things behave strangely, open a fresh terminal, source only /opt/ros/lyrical/setup.bash, and rebuild." },

      { t: "h", text: "A publisher and subscriber in Python" },
      { t: "p", text: "A node is a class derived from `rclpy.node.Node`. In the constructor you create publishers, subscriptions, timers and parameters; then `rclpy.spin` hands control to an **executor**, which waits for events and calls your callbacks. Nothing in a callback should block for long, because while it runs no other callback of that node can." },
      { t: "snippet", lang: "python", code: String.raw`import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class Talker(Node):
    def __init__(self):
        super().__init__("talker")
        self.declare_parameter("rate_hz", 2.0)
        rate = self.get_parameter("rate_hz").value
        self.pub = self.create_publisher(String, "chatter", 10)
        self.timer = self.create_timer(1.0 / rate, self.tick)
        self.count = 0

    def tick(self):
        msg = String()
        msg.data = f"hello {self.count}"
        self.pub.publish(msg)
        self.get_logger().info(f"published: {msg.data}")
        self.count += 1


def main():
    rclpy.init()
    node = Talker()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()`, caption: "my_py_pkg/my_py_pkg/talker.py: a timer callback publishes a String at a rate set by a parameter." },
      { t: "snippet", lang: "python", code: String.raw`import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class Listener(Node):
    def __init__(self):
        super().__init__("listener")
        self.sub = self.create_subscription(String, "chatter", self.on_msg, 10)

    def on_msg(self, msg: String):
        self.get_logger().info(f"heard: {msg.data}")


def main():
    rclpy.init()
    node = Listener()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()`, caption: "my_py_pkg/my_py_pkg/listener.py." },
      { t: "snippet", lang: "python", code: String.raw`from setuptools import find_packages, setup

package_name = "my_py_pkg"

setup(
    name=package_name,
    version="0.1.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="you",
    maintainer_email="you@example.com",
    description="Talker and listener",
    license="Apache-2.0",
    entry_points={
        "console_scripts": [
            "talker = my_py_pkg.talker:main",
            "listener = my_py_pkg.listener:main",
        ],
    },
)`, caption: "my_py_pkg/setup.py: the entry_points section makes `ros2 run my_py_pkg talker` work." },
      { t: "p", text: "The talker shows the parameter pattern: `declare_parameter(name, default)` then `get_parameter(name).value`. Set it at run time with `ros2 run my_py_pkg talker --ros-args -p rate_hz:=5.0`. A node may only use parameters it has declared, which catches spelling mistakes in YAML files." },

      { t: "h", text: "The same pair in C++" },
      { t: "p", text: "rclcpp mirrors rclpy closely: derive from `rclcpp::Node`, create a publisher with a message type as a template argument, and use a lambda for the callback. Shared pointers (`SharedPtr`) are used everywhere because the executor and the node share ownership of these objects." },
      { t: "snippet", lang: "cpp", code: String.raw`// src/talker.cpp in package my_cpp_pkg
#include <chrono>
#include <memory>
#include <string>
#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"

using namespace std::chrono_literals;

class Talker : public rclcpp::Node {
public:
  Talker() : Node("talker") {
    pub_ = create_publisher<std_msgs::msg::String>("chatter", 10);
    timer_ = create_wall_timer(500ms, [this]() {
      std_msgs::msg::String msg;
      msg.data = "hello " + std::to_string(count_++);
      RCLCPP_INFO(get_logger(), "published: %s", msg.data.c_str());
      pub_->publish(msg);
    });
  }

private:
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr pub_;
  rclcpp::TimerBase::SharedPtr timer_;
  size_t count_ = 0;
};

int main(int argc, char ** argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<Talker>());
  rclcpp::shutdown();
  return 0;
}`, caption: "my_cpp_pkg/src/talker.cpp." },
      { t: "snippet", lang: "cpp", code: String.raw`// src/listener.cpp in package my_cpp_pkg
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"

class Listener : public rclcpp::Node {
public:
  Listener() : Node("listener") {
    sub_ = create_subscription<std_msgs::msg::String>(
      "chatter", 10,
      [this](const std_msgs::msg::String & msg) {
        RCLCPP_INFO(get_logger(), "heard: %s", msg.data.c_str());
      });
  }

private:
  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr sub_;
};

int main(int argc, char ** argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<Listener>());
  rclcpp::shutdown();
  return 0;
}`, caption: "my_cpp_pkg/src/listener.cpp." },
      { t: "snippet", lang: "text", code: String.raw`cmake_minimum_required(VERSION 3.20)
project(my_cpp_pkg)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(std_msgs REQUIRED)

add_executable(talker src/talker.cpp)
target_link_libraries(talker PUBLIC rclcpp::rclcpp ` + "${" + String.raw`std_msgs_TARGETS})

add_executable(listener src/listener.cpp)
target_link_libraries(listener PUBLIC rclcpp::rclcpp ` + "${" + String.raw`std_msgs_TARGETS})

install(TARGETS talker listener DESTINATION lib/` + "${" + String.raw`PROJECT_NAME})

ament_package()`, caption: "my_cpp_pkg/CMakeLists.txt. Since Kilted, ament_target_dependencies is deprecated; link targets with target_link_libraries as shown." },
      { t: "p", text: "Build with `colcon build`, source, and run `ros2 run my_cpp_pkg listener` alongside `ros2 run my_py_pkg talker`. The C++ listener prints what the Python talker sends: the languages share the same message definitions, generated into both languages at build time." },

      { t: "h", text: "Choosing Python or C++" },
      { t: "p", text: "Use **Python** for tools, glue nodes, prototypes, and anything that runs at tens of hertz with modest computation. Use **C++** for drivers, controllers at hundreds of hertz, image and point cloud processing, and anything you will load as a component into a shared process (C++ nodes can be composed into one process to pass messages by pointer, without copying). Many teams prototype in Python and port the hot nodes to C++ later; because the interfaces are messages, the rest of the system does not change." },

      { t: "h", text: "Launch files" },
      { t: "p", text: "A real robot starts twenty or more nodes. A **launch file** describes them, with their parameters, remappings and namespaces, so that one command starts the whole system. ROS 2 supports launch files in Python, XML and YAML; Python is the most flexible and the most common in packages you will read." },
      { t: "snippet", lang: "python", code: String.raw`from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    rate = LaunchConfiguration("rate_hz")
    return LaunchDescription([
        DeclareLaunchArgument("rate_hz", default_value="2.0"),
        Node(package="my_py_pkg", executable="talker", name="talker",
             parameters=[{"rate_hz": rate}]),
        Node(package="my_cpp_pkg", executable="listener", name="listener", output="screen"),
    ])`, caption: "my_py_pkg/launch/chatter.launch.py: starts the Python talker and the C++ listener, with a launch argument for the rate." },
      { t: "p", text: "Install the `launch` folder by adding it to `data_files` in setup.py: `(\"share/\" + package_name + \"/launch\", [\"launch/chatter.launch.py\"])`, and add `<exec_depend>ros2launch</exec_depend>` to package.xml. Then `ros2 launch my_py_pkg chatter.launch.py rate_hz:=10.0`. Each `Node` action can also take `namespace=\"robot1\"`, which prefixes all its relative topic names, and `remappings=[(\"chatter\", \"talk\")]`, which renames a topic without touching code. Remapping is how you plug a node written by someone else into your system." },
      { t: "p", text: "Parameters for many nodes usually live in a YAML file passed as `parameters=[\"/path/params.yaml\"]` (find the path with `FindPackageShare`). The file is keyed by node name, then `ros__parameters`:" },
      { t: "snippet", lang: "yaml", code: String.raw`talker:
  ros__parameters:
    rate_hz: 5.0`, caption: "A parameter file. The double underscore in ros__parameters is required." },

      { t: "deep", title: "Executors, callback groups and why your callback is not running", blocks: [
        { t: "p", text: "`rclpy.spin(node)` creates a **single-threaded executor**: one thread, one callback at a time, in the order events arrive. If a timer callback sleeps for one second, subscriptions on that node queue up meanwhile, and with history depth 10, messages beyond the tenth are dropped. The fix is almost never a bigger queue; it is doing less in the callback, or moving slow work to a separate thread or node." },
        { t: "p", text: "A **multi-threaded executor** runs callbacks on several threads, controlled by **callback groups**: callbacks in one **mutually exclusive** group never run concurrently (the default), while those in a **reentrant** group may. To call a service from inside a timer callback and wait for the reply, put the client in a different callback group from the timer and use a multi-threaded executor; otherwise the reply can never be processed. In rclcpp, Lyrical adds an events-based executor (`EventsCBGExecutor`) that uses noticeably less CPU than the classic executors, which matters on a Pi." },
        { t: "p", text: "Time is the other subtlety. Nodes use the **ROS clock**, which in simulation is driven by the simulator through the `/clock` topic when the parameter `use_sim_time` is true. Timers created with `create_timer` follow that clock, so they pause when the simulation pauses. `time.sleep()` in Python follows the wall clock and does not; avoid it in nodes." },
      ] },
      { t: "deep", title: "Composition: many nodes in one process", blocks: [
        { t: "p", text: "Each Python or C++ executable is normally its own process, and messages between processes are serialised and copied through the middleware. For a camera pipeline at 30 frames per second of 1920 × 1080 × 3 bytes, about 6.2 MB per frame, that is about 187 MB per second of copying per link. C++ nodes written as **components** (a class registered with `RCLCPP_COMPONENTS_REGISTER_NODE`) can be loaded into one **component container** process, and with intra-process communication enabled a published `std::unique_ptr` message is handed to the subscriber without copying." },
        { t: "p", text: "Check the arithmetic: 1920 × 1080 = 2 073 600 pixels, × 3 bytes = 6 220 800 bytes, × 30 = 186 624 000 bytes per second. Launch files load components with `ComposableNodeContainer` and `ComposableNode` from `launch_ros.actions` and `launch_ros.descriptions`." },
      ] },
    ],
    mistakes: [
      "**Editing a Python node and wondering why nothing changed**, after building without `--symlink-install`. Rebuild, or use symlink install.",
      "**Forgetting the entry point in setup.py** or the `install(TARGETS ...)` line in CMakeLists.txt. The build succeeds but `ros2 run` cannot find the executable.",
      "**Blocking in a callback** with `time.sleep()` or a synchronous service call. Other callbacks stall and messages are dropped.",
      "**Using a parameter without declaring it.** rclpy raises an error; declare every parameter with a default.",
      "**Not listing dependencies in package.xml.** It builds on your machine and fails on everyone else's; rosdep cannot install what is not declared.",
      "**Committing build/, install/ and log/ to git.** Only src belongs in version control.",
    ],
    practice: {
      kind: "bench",
      task: "Build a two-language workspace and launch it.",
      steps: [
        "Create ~/ros2_ws with my_py_pkg and my_cpp_pkg using the commands in the lesson.",
        "Add the Python talker and listener, register entry points, build with --symlink-install and run them.",
        "Add the C++ talker and listener with the CMakeLists.txt shown, build, and run the C++ listener against the Python talker.",
        "Write chatter.launch.py, install it, and launch with rate_hz:=10. Confirm the rate with `ros2 topic hz /chatter`.",
        "Move rate_hz into a YAML parameter file, load it from the launch file, and change it at runtime with `ros2 param set /talker rate_hz 1.0`. Note that the timer does not change: explain why, and fix it by adding a parameter callback (`add_on_set_parameters_callback`) that recreates the timer.",
      ],
    },
    quiz: [
      {
        q: "You edit talker.py, run it again, and see the old behaviour. You built with plain `colcon build`. Why?",
        options: [
          "Python caches the old file forever",
          "Without --symlink-install the file was copied into install/, so the copy is still the old version until you rebuild",
          "ROS 2 does not support Python edits",
          "The parameter overrides the code",
        ],
        answer: 1,
        why: "A plain build copies Python files into the install space. --symlink-install links them, so edits in src take effect immediately.",
      },
      {
        q: "What does sourcing ~/ros2_ws/install/setup.bash do?",
        options: [
          "Builds the workspace",
          "Overlays your workspace's packages on the ROS installation so ros2 can find them",
          "Installs ROS 2",
          "Deletes the build folder",
        ],
        answer: 1,
        why: "Sourcing sets environment paths so packages in your install space are found first, on top of the underlay in /opt/ros/lyrical.",
      },
      {
        q: "A timer callback in your Python node takes 2 seconds to run. What happens to a subscription on the same node with the default single-threaded executor?",
        options: [
          "It runs in parallel on another core",
          "Its callbacks wait until the timer callback returns, and messages beyond the queue depth are dropped",
          "It is unsubscribed",
          "Nothing; ROS 2 is real-time",
        ],
        answer: 1,
        why: "A single-threaded executor runs one callback at a time. Others queue, and with KEEP_LAST history the oldest messages are discarded once the depth is exceeded.",
      },
      {
        q: "In a launch file, how do you make a node that publishes on `chatter` publish on `talk` instead, without changing its code?",
        options: [
          "Set a parameter called chatter",
          "Add remappings=[(\"chatter\", \"talk\")] to its Node action",
          "Change its QoS",
          "Run it in a different domain",
        ],
        answer: 1,
        why: "Remapping renames topics (and services) at startup. It is the standard way to connect nodes written independently.",
      },
      {
        q: "Which build type would you choose for a package containing a C++ motor driver node?",
        options: ["ament_python", "ament_cmake", "Either; colcon guesses", "catkin"],
        answer: 1,
        why: "C++ packages use ament_cmake with a CMakeLists.txt. ament_python is for pure Python packages; catkin is ROS 1.",
      },
    ],
  },

  "a11-tf2-urdf-and-tools": {
    id: "a11-tf2-urdf-and-tools",
    outcomes: [
      "Explain coordinate frames and the map, odom and base_link conventions of REP 105",
      "Publish and query transforms with tf2",
      "Describe a differential-drive robot in URDF and xacro and publish it with robot_state_publisher",
      "Use RViz2, rqt and ros2 bag to visualise, debug and record a system",
    ],
    blocks: [
      { t: "h", text: "Every number lives in a frame" },
      { t: "p", text: "A LiDAR reports an obstacle 1.2 m away at 30 degrees. Away from what? From the LiDAR, which sits 10 cm in front of the robot's centre and 15 cm up, on a robot that is itself somewhere on the map. To plan a path around the obstacle you need its position on the map, which means chaining three transformations. Getting this wrong is the single most common source of robot bugs, and ROS solves it once with **tf2**: every piece of data carries the name of its **frame**, and tf2 keeps a tree of transforms between frames, over time, so any node can ask \"where was point P in frame A expressed in frame B at time t?\"" },
      { t: "p", text: "A **transform** between two frames is a translation (x, y, z) and a rotation, stored as a **quaternion** (x, y, z, w). For a robot moving on a floor, the rotation is just a yaw angle θ about the vertical axis, and the quaternion is (0, 0, sin(θ/2), cos(θ/2)). ROS conventions (REP 103) are: lengths in metres, angles in radians, and for a body frame **x forward, y left, z up**, with positive rotation counter-clockwise when viewed from above." },
      { t: "formula", text: String.raw`2D transform of a point from frame B into frame A,
where B is at (tx, ty) in A and rotated by θ:

x_A = tx + x_B cos θ - y_B sin θ
y_A = ty + x_B sin θ + y_B cos θ

Example: laser frame at (0.10, 0) on base_link, θ = 0.
Point 1.2 m away at 30° in the laser frame: (1.2 cos 30°, 1.2 sin 30°) = (1.039, 0.600)
In base_link: (0.10 + 1.039, 0 + 0.600) = (1.139, 0.600)

Robot (base_link) at (2.0, 1.0) in odom, θ = 90°:
x_odom = 2.0 + 1.139 × 0 - 0.600 × 1 = 1.400
y_odom = 1.0 + 1.139 × 1 + 0.600 × 0 = 2.139`, caption: "Chaining two transforms by hand. tf2 does this for every message." },
      { t: "p", text: "Check: the robot faces +y in odom (θ = 90°), so the obstacle, 1.139 m ahead and 0.6 m to its left, should be 1.139 m further along +y and 0.6 m towards −x. From (2.0, 1.0) that gives (1.4, 2.139), as computed." },

      { t: "h", text: "The standard frames: REP 105" },
      { t: "p", text: "ROS Enhancement Proposal 105 fixes the names and meanings of the frames on a mobile robot, so that every navigation package can work with every robot." },
      { t: "diagram", text: String.raw`
  map ──► odom ──► base_footprint ──► base_link ──► laser
   │        │                              ├──► left_wheel, right_wheel
   │        │                              └──► camera_link
   │        └─ published by odometry (wheel encoders, IMU): smooth, drifts
   └─ published by localisation (AMCL, SLAM): corrects drift, may jump`, caption: "The REP 105 tree. Each arrow is a transform published by exactly one node." },
      { t: "list", items: [
        "**base_link** is attached rigidly to the robot, usually at the centre of the drive axle. **base_footprint** is its projection onto the floor, used by many 2D packages.",
        "**odom** is a world-fixed frame in which the robot's pose is **continuous**: it never jumps, so it is right for short-term control, but it **drifts** without bound as wheel slip accumulates.",
        "**map** is a world-fixed frame in which the pose is **accurate** in the long term, but it can **jump** when localisation corrects itself.",
        "Localisation publishes **map → odom**, not map → base_link, so that each frame has exactly one parent. The correction it publishes is exactly the accumulated odometry drift.",
      ] },
      { t: "p", text: "Transforms that never change (laser to base_link) are **static** and published once with transient-local QoS on `/tf_static`. Those that change are published continuously on `/tf`. Tools:" },
      { t: "snippet", lang: "bash", code: String.raw`# Publish a static transform: laser 0.10 m forward, 0.15 m up from base_link
ros2 run tf2_ros static_transform_publisher --x 0.10 --y 0 --z 0.15 \
  --yaw 0 --pitch 0 --roll 0 --frame-id base_link --child-frame-id laser
ros2 run tf2_ros tf2_echo base_link laser      # print the transform
ros2 run tf2_tools view_frames                 # writes frames.pdf showing the tree`, caption: "tf2 from the command line." },

      { t: "h", text: "Describing the robot: URDF and xacro" },
      { t: "p", text: "The fixed transforms within the robot come from its **URDF** (Unified Robot Description Format), an XML file listing **links** (rigid bodies, with visual shape, collision shape and inertia) and **joints** (how a child link moves relative to its parent: `fixed`, `continuous` for a wheel, `revolute` with limits for an arm joint, `prismatic` for a slider). URDF files are repetitive, so they are written in **xacro**, XML macros with properties and arithmetic, and expanded by the `xacro` tool. Here is a complete compact differential-drive robot: a 20 × 15 × 6 cm box, two wheels of radius 33 mm, 160 mm apart, and a frictionless caster. The `ros2_control` and `gazebo` sections at the end are used in the next lesson." },
      { t: "snippet", lang: "xml", code: String.raw`<?xml version="1.0"?>
<robot name="my_bot" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <xacro:property name="wheel_radius" value="0.033"/>
  <xacro:property name="wheel_width" value="0.025"/>
  <xacro:property name="wheel_separation" value="0.16"/>
  <xacro:property name="base_height_above_ground" value="0.05"/>

  <link name="base_footprint"/>
  <joint name="base_footprint_joint" type="fixed">
    <parent link="base_footprint"/>
    <child link="base_link"/>
    <origin xyz="0 0 ` + "${" + String.raw`base_height_above_ground}"/>
  </joint>

  <link name="base_link">
    <visual><geometry><box size="0.20 0.15 0.06"/></geometry></visual>
    <collision><geometry><box size="0.20 0.15 0.06"/></geometry></collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.002175" iyy="0.003633" izz="0.005208" ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <xacro:macro name="wheel" params="side y">
    <link name="` + "${" + String.raw`side}_wheel">
      <visual>
        <origin rpy="` + "${" + String.raw`-pi/2} 0 0"/>
        <geometry><cylinder radius="` + "${" + String.raw`wheel_radius}" length="` + "${" + String.raw`wheel_width}"/></geometry>
      </visual>
      <collision>
        <origin rpy="` + "${" + String.raw`-pi/2} 0 0"/>
        <geometry><cylinder radius="` + "${" + String.raw`wheel_radius}" length="` + "${" + String.raw`wheel_width}"/></geometry>
      </collision>
      <inertial>
        <mass value="0.1"/>
        <inertia ixx="0.0000324" iyy="0.0000545" izz="0.0000324" ixy="0" ixz="0" iyz="0"/>
      </inertial>
    </link>
    <joint name="` + "${" + String.raw`side}_wheel_joint" type="continuous">
      <parent link="base_link"/>
      <child link="` + "${" + String.raw`side}_wheel"/>
      <origin xyz="0.04 ` + "${" + String.raw`y} ` + "${" + String.raw`wheel_radius - base_height_above_ground}"/>
      <axis xyz="0 1 0"/>
    </joint>
  </xacro:macro>

  <xacro:wheel side="left" y="` + "${" + String.raw`wheel_separation/2}"/>
  <xacro:wheel side="right" y="` + "${" + String.raw`-wheel_separation/2}"/>

  <link name="caster">
    <visual><geometry><sphere radius="0.016"/></geometry></visual>
    <collision><geometry><sphere radius="0.016"/></geometry></collision>
    <inertial>
      <mass value="0.05"/>
      <inertia ixx="0.0000051" iyy="0.0000051" izz="0.0000051" ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>
  <joint name="caster_joint" type="fixed">
    <parent link="base_link"/>
    <child link="caster"/>
    <origin xyz="-0.07 0 ` + "${" + String.raw`0.016 - base_height_above_ground}"/>
  </joint>
  <gazebo reference="caster">
    <mu1>0.0</mu1>
    <mu2>0.0</mu2>
  </gazebo>

  <ros2_control name="my_bot_sim" type="system">
    <hardware>
      <plugin>gz_ros2_control/GazeboSimSystem</plugin>
    </hardware>
    <joint name="left_wheel_joint">
      <command_interface name="velocity"/>
      <state_interface name="position"/>
      <state_interface name="velocity"/>
    </joint>
    <joint name="right_wheel_joint">
      <command_interface name="velocity"/>
      <state_interface name="position"/>
      <state_interface name="velocity"/>
    </joint>
  </ros2_control>

  <gazebo>
    <plugin filename="gz_ros2_control-system" name="gz_ros2_control::GazeboSimROS2ControlPlugin">
      <parameters>$(find my_bot)/config/controllers.yaml</parameters>
    </plugin>
  </gazebo>
</robot>`, caption: "my_bot/urdf/my_bot.urdf.xacro. The wheel macro is used twice; every length is in metres." },
      { t: "p", text: "Read it carefully once. The wheel cylinder's axis is z by default, so it is rotated by −π/2 about x to lie along y; the joint axis is `0 1 0` (y, to the robot's left), so a positive wheel velocity rolls the robot forward. The wheel joint's z offset is wheel radius minus base height, 0.033 − 0.05 = −0.017 m, which puts the wheel's bottom exactly on the floor. Every link has an `inertial` block, because a physics simulator needs mass and inertia; the base's values come from the box formula I_xx = m(y² + z²)/12 = 1.0 × (0.15² + 0.06²)/12 = 0.002175 kg·m². Validate with `check_urdf <(xacro my_bot.urdf.xacro)` (from the `liburdfdom-tools` package)." },

      { t: "h", text: "robot_state_publisher and RViz2" },
      { t: "p", text: "**robot_state_publisher** reads the URDF from its `robot_description` parameter, publishes the fixed joints on `/tf_static`, republishes the description on the `/robot_description` topic (transient local), and for every moving joint listens to `/joint_states` (`sensor_msgs/msg/JointState`) and publishes the corresponding transform on `/tf`. Something must publish joint states: on the real robot, the motor controller; for testing, `joint_state_publisher_gui`, which gives you a slider per joint." },
      { t: "snippet", lang: "bash", code: String.raw`sudo apt install ros-lyrical-xacro ros-lyrical-joint-state-publisher-gui
ros2 run robot_state_publisher robot_state_publisher \
  --ros-args -p robot_description:="$(xacro my_bot.urdf.xacro)"
ros2 run joint_state_publisher_gui joint_state_publisher_gui
rviz2      # Fixed Frame: base_footprint; Add > RobotModel (topic /robot_description) and TF`, caption: "Visualise the model. Move the wheel sliders and watch the wheel frames turn." },
      { t: "p", text: "**RViz2** is the 3D visualiser: it subscribes to topics and draws them in a chosen **fixed frame**, looking up transforms with tf2. Displays include RobotModel, TF, LaserScan, PointCloud2, Image, Odometry, Path and Map. If RViz shows \"No transform from [laser] to [odom]\", a link in the tf tree is missing: check it with `view_frames`. Save your display setup with File > Save Config and load it from a launch file with `arguments=[\"-d\", path]`." },

      { t: "h", text: "rqt and ros2 bag" },
      { t: "p", text: "**rqt** is a set of Qt plugins: `rqt_graph` draws nodes and topics, Plot graphs numeric fields over time (for example `/odom/twist/twist/linear/x`, ideal for tuning controllers), Console filters log messages by node and severity, and the TF Tree plugin shows the frame tree live. Start it with `rqt` and choose plugins from the menu." },
      { t: "p", text: "**ros2 bag** records topics to a file and plays them back with the original timing. It is how you debug a problem that happened once in the field, develop a perception node at your desk with real sensor data, and write regression tests. The default storage format is **MCAP**, which tools such as Foxglove can open directly." },
      { t: "snippet", lang: "bash", code: String.raw`ros2 bag record -o corridor_run /scan /odom /tf /tf_static /cmd_vel
ros2 bag info corridor_run              # duration, message counts per topic
ros2 bag play corridor_run --rate 0.5   # play back at half speed
ros2 bag play corridor_run --loop`, caption: "Record /tf_static too, or played-back data cannot be transformed." },

      { t: "deep", title: "Quaternions without fear", blocks: [
        { t: "p", text: "A rotation by angle α about a unit axis (ax, ay, az) is the quaternion q = (ax sin(α/2), ay sin(α/2), az sin(α/2), cos(α/2)). Quaternions avoid the gimbal lock of Euler angles and compose by multiplication. For yaw only, the axis is (0, 0, 1) and q = (0, 0, sin(θ/2), cos(θ/2)). For θ = 90° = π/2: sin(π/4) = cos(π/4) ≈ 0.7071, so q ≈ (0, 0, 0.7071, 0.7071). Check: the norm is √(0.7071² + 0.7071²) = √1.0 = 1, as every rotation quaternion must be." },
        { t: "formula", text: String.raw`yaw from a quaternion (x, y, z, w):
θ = atan2( 2(w z + x y), 1 - 2(y² + z²) )

for (0, 0, 0.7071, 0.7071):
θ = atan2( 2 × 0.7071 × 0.7071, 1 - 2 × 0.5 ) = atan2(1.0, 0) = π/2   ✓`, caption: "Extracting yaw. In code, use tf_transformations or tf2's own conversion functions rather than writing this yourself." },
        { t: "p", text: "Two classic errors: forgetting that ROS orders quaternions (x, y, z, w) while some libraries use (w, x, y, z), and publishing an all-zero quaternion, which is not a valid rotation and makes RViz and tf2 complain." },
      ] },
      { t: "deep", title: "Looking up transforms in code, and time", blocks: [
        { t: "p", text: "A node uses a `tf2_ros.Buffer` and `TransformListener` to receive the tree, then `buffer.lookup_transform(target, source, time)`. The time argument matters: a scan stamped 50 ms ago should be transformed using the robot's pose 50 ms ago, which tf2 can interpolate because it keeps about 10 seconds of history. Asking for `rclpy.time.Time()` (time zero) means \"the latest available\", which is fine for slow data and wrong for fast-moving robots." },
        { t: "p", text: "The common error \"Lookup would require extrapolation into the future\" means you asked for a time newer than the latest transform received, typically because the odometry transform is published a few milliseconds after the scan. Pass a timeout to `lookup_transform`, or use a `tf2_ros.MessageFilter`, which holds each message until its transform is available. In simulation, every node must have `use_sim_time` set to true, or stamps from the simulator clock and the wall clock will be decades apart." },
      ] },
    ],
    mistakes: [
      "**Publishing map → base_link from localisation.** base_link already has a parent (odom). Publish map → odom.",
      "**Using degrees in a URDF or a message.** ROS uses radians and metres everywhere.",
      "**Leaving out inertial blocks** in a URDF for simulation. Gazebo ignores or misbehaves with massless links.",
      "**Getting the wheel joint axis wrong**, so commanding forward drives backwards or spins in place. Check with joint_state_publisher_gui.",
      "**Recording a bag without /tf_static**, then finding the data cannot be transformed on playback.",
      "**Choosing a Fixed Frame in RViz that nobody publishes**, giving a blank view with transform errors.",
    ],
    practice: {
      kind: "bench",
      task: "Model the course's differential-drive robot and inspect it with the standard tools.",
      steps: [
        "Create an ament_cmake package `my_bot` with `urdf/` and `config/` folders installed to share/ (add `install(DIRECTORY urdf config launch DESTINATION share/${PROJECT_NAME})` to CMakeLists.txt).",
        "Write my_bot.urdf.xacro, measuring your own chassis if you have one and changing the properties. Expand it with xacro and run check_urdf.",
        "Run robot_state_publisher and joint_state_publisher_gui, and show RobotModel and TF in RViz2. Turn the wheels with the sliders.",
        "Add a laser link 0.10 m forward and 0.15 m up with a fixed joint. Confirm the transform with `tf2_echo base_link laser` and view the tree with view_frames.",
        "Record /tf, /tf_static and /joint_states for 20 s with ros2 bag while moving sliders, then close everything, play the bag back and watch RViz move with no sliders running.",
      ],
    },
    quiz: [
      {
        q: "Which node publishes the map → odom transform?",
        options: [
          "robot_state_publisher",
          "The localisation node (for example AMCL or SLAM), as a correction for odometry drift",
          "The wheel odometry node",
          "RViz2",
        ],
        answer: 1,
        why: "REP 105: odometry publishes odom → base_link (continuous, drifting), localisation publishes map → odom (the drift correction), so every frame has one parent.",
      },
      {
        q: "A laser frame sits at (0.2, 0) on base_link with no rotation. It sees a point at (1.0, 0.5) in its own frame. Where is the point in base_link?",
        options: ["(1.0, 0.5)", "(0.8, 0.5)", "(1.2, 0.5)", "(1.2, 0.7)"],
        answer: 2,
        why: "With θ = 0 the transform is a pure translation: x = 0.2 + 1.0 = 1.2, y = 0 + 0.5 = 0.5.",
      },
      {
        q: "Why should short-term motion control use the odom frame rather than the map frame?",
        options: [
          "odom is more accurate in the long run",
          "The robot's pose in odom is continuous and never jumps, whereas in map it can jump when localisation corrects",
          "map is not supported by tf2",
          "odom is published faster by RViz",
        ],
        answer: 1,
        why: "A controller fed a pose that suddenly jumps would make a sudden correction. odom is smooth; its drift only matters over long distances.",
      },
      {
        q: "What does robot_state_publisher need in order to publish the transform of a wheel joint?",
        options: [
          "Nothing but the URDF",
          "The URDF and the joint's position on /joint_states",
          "A LiDAR scan",
          "A map",
        ],
        answer: 1,
        why: "Fixed joints come from the URDF alone. Moving joints need their current position, which arrives as sensor_msgs/JointState messages.",
      },
      {
        q: "You record a bag of /scan and /odom only. On playback, RViz cannot display the scan in the odom frame. Why?",
        options: [
          "Bags do not store laser scans",
          "The transforms (/tf and /tf_static) were not recorded, so the scan's frame cannot be related to odom",
          "Playback is too fast",
          "RViz needs a map",
        ],
        answer: 1,
        why: "Displaying data in another frame requires the transform tree. Without /tf and /tf_static in the bag there is no path from laser to odom.",
      },
    ],
  },

  "a11-gazebo-and-ros2-control": {
    id: "a11-gazebo-and-ros2-control",
    outcomes: [
      "Simulate the differential-drive robot in Gazebo Jetty and connect it to ROS 2 with ros_gz",
      "Explain the ros2_control architecture: controller manager, controllers and hardware interfaces",
      "Configure and run diff_drive_controller, and derive its wheel kinematics",
      "Describe how a hardware interface lets the same controllers drive a real robot",
    ],
    blocks: [
      { t: "h", text: "Why simulate, and why ros2_control" },
      { t: "p", text: "Hardware is slow to iterate on, breaks, has flat batteries, and is shared by a whole lab. A physics simulator lets you test navigation, controllers and whole launch files on a laptop, a hundred times a day, without risk. The trap is that simulated robots are often driven by a simulator-specific plugin, so the code you tested is not the code that runs on the real robot. **ros2_control** removes that trap: the same controllers (and the same topics) work in simulation and on hardware, and only a small **hardware interface** plugin changes. That is exactly the exit project of this module." },

      { t: "h", text: "Gazebo and the ros_gz bridge" },
      { t: "p", text: "**Gazebo** (formerly Ignition Gazebo; the old Gazebo Classic is end of life) is the simulator maintained alongside ROS. The release paired with ROS 2 Lyrical is **Gazebo Jetty**, installed with `sudo apt install ros-lyrical-ros-gz` (Jazzy pairs with Gazebo Harmonic). Gazebo has its own transport and message types, so the **ros_gz** packages connect the two worlds: `ros_gz_sim` starts the simulator and spawns models, and `ros_gz_bridge` translates topics between `gz.msgs` and ROS messages." },
      { t: "snippet", lang: "bash", code: String.raw`sudo apt install ros-lyrical-ros-gz ros-lyrical-gz-ros2-control \
  ros-lyrical-ros2-control ros-lyrical-ros2-controllers ros-lyrical-teleop-twist-keyboard
ros2 launch ros_gz_sim gz_sim.launch.py gz_args:="-r empty.sdf"     # empty world, running
ros2 run ros_gz_sim create -topic robot_description -name my_bot     # spawn from the topic
# Bridge syntax: /topic@ros_type[gz_type  ([ = Gazebo to ROS, ] = ROS to Gazebo, @ = both ways)
ros2 run ros_gz_bridge parameter_bridge /clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock`, caption: "Starting Gazebo, spawning the URDF, and bridging the simulation clock into ROS." },
      { t: "p", text: "The `/clock` bridge is essential: with it, every node started with `use_sim_time:=true` follows simulated time, so that pausing or slowing the simulation does not confuse timers, tf2 or controllers. Sensors (a `gpu_lidar` or `camera` sensor added to the URDF inside `<gazebo>` tags) are bridged the same way, for example `/scan@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan`." },

      { t: "h", text: "The ros2_control architecture" },
      { t: "diagram", text: String.raw`
  /cmd_vel (TwistStamped)                       /odom, /tf, /joint_states
        │                                                ▲
        ▼                                                │
 ┌──────────────────── controller_manager (update loop at update_rate) ─────────┐
 │  diff_drive_controller            joint_state_broadcaster                      │
 │     writes wheel velocity           reads wheel position/velocity              │
 │     command interfaces              state interfaces                           │
 │            │                                ▲                                  │
 │            ▼                                │                                  │
 │   hardware interface plugin:  write() ──► motors     sensors ──► read()        │
 │   (GazeboSimSystem in simulation, your own plugin on the real robot)           │
 └───────────────────────────────────────────────────────────────────────────────┘`, caption: "Each cycle the controller manager calls read() on the hardware, update() on every active controller, then write()." },
      { t: "list", items: [
        "The **controller manager** runs a loop at a fixed rate. Each cycle: `read()` from the hardware into **state interfaces**, `update()` every active controller, `write()` the **command interfaces** to the hardware.",
        "A **hardware interface** (system, actuator or sensor component) is a plugin declared in the URDF's `<ros2_control>` tag. It lists, per joint, the command interfaces (here `velocity`) and state interfaces (`position`, `velocity`) it provides. In simulation the plugin is `gz_ros2_control/GazeboSimSystem`.",
        "**Controllers** are plugins too, loaded by name and configured from YAML. `diff_drive_controller` turns body velocity commands into wheel velocity commands and wheel states into odometry; `joint_state_broadcaster` publishes the wheel states on `/joint_states` for robot_state_publisher.",
      ] },

      { t: "h", text: "Configuring diff_drive_controller" },
      { t: "snippet", lang: "yaml", code: String.raw`controller_manager:
  ros__parameters:
    update_rate: 50
    use_sim_time: true
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster
    diff_drive_controller:
      type: diff_drive_controller/DiffDriveController

diff_drive_controller:
  ros__parameters:
    left_wheel_names: ["left_wheel_joint"]
    right_wheel_names: ["right_wheel_joint"]
    wheel_separation: 0.16
    wheel_radius: 0.033
    base_frame_id: base_footprint
    odom_frame_id: odom
    enable_odom_tf: true
    cmd_vel_timeout: 0.5
    linear.x.max_velocity: 0.5
    angular.z.max_velocity: 3.0`, caption: "my_bot/config/controllers.yaml. The wheel names must match the URDF joints; the geometry must match the real robot." },
      { t: "p", text: "Two version notes. Since Jazzy, the controller subscribes to `~/cmd_vel` (that is, `/diff_drive_controller/cmd_vel`) with message type **`geometry_msgs/msg/TwistStamped`**; the unstamped `Twist` input of older releases is gone, so teleop tools must publish stamped messages. In Lyrical the old `publish_rate` parameter has been removed (odometry is published every update cycle) and `tf_frame_prefix_enable` has been removed (set `tf_frame_prefix` to an empty string instead). `cmd_vel_timeout` is the safety net: if no command arrives for 0.5 s, the wheels are commanded to zero." },

      { t: "h", text: "The kinematics inside the controller" },
      { t: "p", text: "A differential-drive robot has two independently driven wheels on one axle. Given a forward speed v (m/s) and turn rate ω (rad/s, counter-clockwise positive), each wheel's ground speed is the body speed plus or minus the rotation's contribution at half the wheel separation L. Dividing by the wheel radius r gives the wheel's angular velocity." },
      { t: "formula", text: String.raw`v_left  = v - ω × L/2          ω_left  = v_left  / r
v_right = v + ω × L/2          ω_right = v_right / r

Odometry (inverse):  v = (v_right + v_left)/2      ω = (v_right - v_left)/L

Example: v = 0.20 m/s, ω = 1.0 rad/s, L = 0.16 m, r = 0.033 m
v_left  = 0.20 - 1.0 × 0.08 = 0.12 m/s   →  ω_left  = 0.12/0.033 ≈ 3.64 rad/s
v_right = 0.20 + 1.0 × 0.08 = 0.28 m/s   →  ω_right = 0.28/0.033 ≈ 8.48 rad/s
Check:  (0.28 + 0.12)/2 = 0.20 m/s ✓     (0.28 - 0.12)/0.16 = 1.0 rad/s ✓`, caption: "Differential-drive kinematics, as implemented by diff_drive_controller and by the micro-ROS base in the next lesson." },
      { t: "p", text: "The turning radius is v/ω = 0.2 m here. At 3.64 rad/s the left wheel turns 3.64 / 2π ≈ 0.58 revolutions per second, about 35 rpm; the right about 81 rpm. Compare these with your motor's rated speed before choosing gear ratios. If wheel_separation or wheel_radius in the YAML is wrong by 10%, the odometry is wrong by about 10%: a robot commanded to turn 90° will measure that it has, while actually turning about 81° or 99°. Calibrate both on the real robot by driving a measured straight line and a measured number of turns." },

      { t: "h", text: "Bringing it together in one launch file" },
      { t: "snippet", lang: "python", code: String.raw`from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    pkg = FindPackageShare("my_bot")
    xacro_file = PathJoinSubstitution([pkg, "urdf", "my_bot.urdf.xacro"])
    robot_description = ParameterValue(Command(["xacro ", xacro_file]), value_type=str)

    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution([FindPackageShare("ros_gz_sim"), "launch", "gz_sim.launch.py"])),
        launch_arguments={"gz_args": "-r empty.sdf"}.items(),
    )
    state_publisher = Node(
        package="robot_state_publisher", executable="robot_state_publisher",
        parameters=[{"robot_description": robot_description, "use_sim_time": True}],
    )
    spawn = Node(
        package="ros_gz_sim", executable="create",
        arguments=["-topic", "robot_description", "-name", "my_bot", "-z", "0.01"],
    )
    clock_bridge = Node(
        package="ros_gz_bridge", executable="parameter_bridge",
        arguments=["/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock"],
    )
    joint_broadcaster = Node(
        package="controller_manager", executable="spawner",
        arguments=["joint_state_broadcaster"],
    )
    drive_controller = Node(
        package="controller_manager", executable="spawner",
        arguments=["diff_drive_controller", "--controller-ros-args",
                   "--ros-args -r /diff_drive_controller/cmd_vel:=/cmd_vel"],
    )
    return LaunchDescription([gazebo, state_publisher, spawn, clock_bridge,
                              joint_broadcaster, drive_controller])`, caption: "my_bot/launch/sim.launch.py: Gazebo, robot description, spawn, clock bridge, and the two controllers. The drive controller's input is remapped to /cmd_vel." },
      { t: "snippet", lang: "bash", code: String.raw`ros2 launch my_bot sim.launch.py
ros2 control list_controllers              # both should be 'active'
ros2 control list_hardware_interfaces      # velocity commands claimed by the controller
ros2 run teleop_twist_keyboard teleop_twist_keyboard --ros-args -p stamped:=true
ros2 topic echo /diff_drive_controller/odom --field twist.twist`, caption: "Drive the simulated robot with the keyboard and watch odometry." },

      { t: "h", text: "The real robot: a hardware interface" },
      { t: "p", text: "On the real robot, the URDF's `<ros2_control>` block names a different plugin, your own class derived from `hardware_interface::SystemInterface`. Its lifecycle methods open the serial port on configure and enable motors on activate; `read()` copies the wheel positions and velocities reported by the microcontroller into the state interfaces; `write()` sends the commanded wheel velocities down. The framed COBS link from module a6 is ideal for this. A common practice is a xacro argument, `use_sim`, that selects the plugin, so one robot description serves both worlds." },
      { t: "snippet", lang: "cpp", code: String.raw`// Fragment of a ros2_control SystemInterface plugin for the real base.
// It reuses the framed serial link from module a6: write() sends wheel velocity
// commands to the microcontroller; read() stores the wheel states it reported.
hardware_interface::return_type MyBotHardware::read(
    const rclcpp::Time &, const rclcpp::Duration &) {
  WheelReport r;
  while (link_.poll(r)) {                         // decode any frames that arrived
    left_pos_ = r.left_rad;   left_vel_ = r.left_rad_s;
    right_pos_ = r.right_rad; right_vel_ = r.right_rad_s;
  }
  set_state("left_wheel_joint/position", left_pos_);
  set_state("left_wheel_joint/velocity", left_vel_);
  set_state("right_wheel_joint/position", right_pos_);
  set_state("right_wheel_joint/velocity", right_vel_);
  return hardware_interface::return_type::OK;
}

hardware_interface::return_type MyBotHardware::write(
    const rclcpp::Time &, const rclcpp::Duration &) {
  link_.send_wheel_command(get_command<double>("left_wheel_joint/velocity"),
                           get_command<double>("right_wheel_joint/velocity"));
  return hardware_interface::return_type::OK;
}`, caption: "The two methods that do the work, written against the Lyrical handle API (set_state and get_command<double>). Lyrical removed export_state_interfaces and export_command_interfaces: the framework now creates the interfaces from the URDF's ros2_control tag. Start from the ros2_control_demos diffbot example for your distribution for the full class and plugin export." },
      { t: "note", kind: "safety", text: "Test real motors with the wheels off the ground first, with a hand on the power switch. Set conservative `linear.x.max_velocity` limits and keep `cmd_vel_timeout`, and keep the microcontroller's own command timeout from module a6 as a second, independent safety layer." },

      { t: "deep", title: "Why the controller manager is a real-time loop", blocks: [
        { t: "p", text: "ros2_control was designed for arms running at 1 kHz, where the time between reading an encoder and writing a torque must be short and regular. The controller manager's loop therefore avoids memory allocation and locks in `read`, `update` and `write`, and controllers exchange data through the shared interface handles rather than ROS topics. ROS messages (the `/cmd_vel` input, the odometry output) are passed across to the loop through lock-free real-time buffers." },
        { t: "p", text: "On a standard Linux kernel the loop achieves a few hundred microseconds of jitter on a quiet system and occasional multi-millisecond stalls. That is adequate for a diff-drive base at 50 Hz, especially when, as here, the actual wheel speed loops run on the microcontroller. For arms at 1 kHz, use a PREEMPT_RT kernel (Ubuntu offers a real-time kernel through Ubuntu Pro, and Raspberry Pi kernels can be built with it), give the controller manager real-time scheduling priority, and isolate a CPU core." },
        { t: "p", text: "Chaining: some controllers export **reference interfaces** that another controller can write to, so a path-following controller can feed diff_drive_controller directly inside the loop, without a topic in between. In Lyrical, chainable controllers implement `on_export_state_interfaces_list()` and `on_export_reference_interfaces_list()`." },
      ] },
      { t: "deep", title: "Making simulation honest", blocks: [
        { t: "p", text: "Default simulated wheels have perfect grip, motors that reach any commanded speed instantly, and sensors with no noise. A controller tuned against that is tuned for a robot that does not exist. Add realism in layers: set wheel friction (`mu1`, `mu2`) and the caster's low friction in `<gazebo reference>` tags; set acceleration limits in diff_drive_controller (`linear.x.max_acceleration`) matching the real motors; add Gaussian noise to simulated LiDAR and IMU sensors; and set realistic inertias." },
        { t: "p", text: "The practical test of a simulation is a **sim-to-real comparison**: drive the same command sequence (from a bag file) on both and compare odometry traces in rqt Plot or Foxglove. If the simulated robot reaches 0.3 m/s in 0.1 s and the real one takes 0.6 s, fix the model before trusting any tuning done in simulation." },
      ] },
    ],
    mistakes: [
      "**Forgetting the /clock bridge or use_sim_time.** Timers, tf2 and controllers then mix wall time and simulated time, with confusing errors about old or future data.",
      "**Publishing Twist to diff_drive_controller on Jazzy or Lyrical.** It expects TwistStamped; use `stamped:=true` on teleop_twist_keyboard.",
      "**Joint names in controllers.yaml that do not match the URDF.** The controller fails to activate; check with `ros2 control list_hardware_interfaces`.",
      "**Wrong wheel_separation or wheel_radius.** Odometry is wrong by the same proportion. Measure and calibrate.",
      "**Tuning only in simulation with ideal motors.** Add acceleration limits and friction before trusting the result.",
      "**Different code paths for sim and real.** Keep one launch structure and switch only the hardware plugin.",
    ],
    practice: {
      kind: "bench",
      task: "Drive the URDF robot from the previous lesson in Gazebo with ros2_control.",
      steps: [
        "Add controllers.yaml and sim.launch.py to my_bot, install config/ and launch/, build and launch.",
        "Confirm both controllers are active and the hardware interfaces are claimed. Fix any name mismatches.",
        "Drive with teleop_twist_keyboard (stamped). In RViz with Fixed Frame `odom`, watch the RobotModel and TF move.",
        "Publish v = 0.2 m/s, ω = 1.0 rad/s with `ros2 topic pub`, and verify with `ros2 topic echo /joint_states` that the wheel velocities are about 3.64 and 8.48 rad/s.",
        "Change wheel_radius in the YAML (only) by 10%, relaunch, drive a 1 m straight line, and compare the odometry distance with the true distance from Gazebo. Explain the difference.",
      ],
    },
    quiz: [
      {
        q: "A diff-drive robot has L = 0.20 m and r = 0.05 m. It is commanded v = 0 m/s, ω = 2.0 rad/s. What are the wheel angular velocities?",
        options: [
          "Left +4 rad/s, right −4 rad/s",
          "Left −4 rad/s, right +4 rad/s",
          "Both 2 rad/s",
          "Left −2 rad/s, right +2 rad/s",
        ],
        answer: 1,
        why: "v_left = 0 − 2.0 × 0.1 = −0.2 m/s and v_right = +0.2 m/s. Dividing by r = 0.05 gives −4 and +4 rad/s: spinning on the spot, counter-clockwise.",
      },
      {
        q: "In ros2_control, what does the hardware interface's write() method do each cycle?",
        options: [
          "Publishes odometry",
          "Sends the command interface values (for example wheel velocities set by the controller) to the actuators",
          "Reads encoders",
          "Loads controllers",
        ],
        answer: 1,
        why: "The cycle is read (hardware to state interfaces), update (controllers), write (command interfaces to hardware).",
      },
      {
        q: "What makes it possible for the same diff_drive_controller to drive both the Gazebo robot and the real robot?",
        options: [
          "Gazebo copies the real robot's firmware",
          "Only the hardware interface plugin in the URDF's ros2_control tag changes; controllers and topics stay the same",
          "The controller detects simulation automatically",
          "ros_gz_bridge forwards motor PWM",
        ],
        answer: 1,
        why: "Controllers talk only to command and state interfaces. GazeboSimSystem provides them in simulation; your own plugin provides them on hardware.",
      },
      {
        q: "Your nodes in simulation log errors about transforms from the future and old data. What have you most likely forgotten?",
        options: [
          "To bridge /clock and set use_sim_time to true",
          "To install RViz",
          "To set the QoS to best effort",
          "To source /opt/ros",
        ],
        answer: 0,
        why: "Without the clock bridge and use_sim_time, some nodes stamp data with wall time and others with simulated time, which differ enormously.",
      },
      {
        q: "wheel_radius in the YAML is set 10% larger than the true radius. What happens to odometry when the robot drives a true 1.0 m?",
        options: [
          "It reports about 0.9 m",
          "It reports exactly 1.0 m",
          "It reports about 1.1 m",
          "It reports nothing",
        ],
        answer: 2,
        why: "Odometry converts wheel rotation to distance by multiplying by the radius. The true rotation for 1.0 m, times a radius 10% too large, gives about 1.1 m.",
      },
    ],
  },

  "a11-micro-ros-and-the-real-robot": {
    id: "a11-micro-ros-and-the-real-robot",
    outcomes: [
      "Explain how micro-ROS lets a microcontroller act as a ROS 2 node through an agent",
      "Build a micro-ROS base controller on an ESP32 with ESP-IDF for ROS 2 Lyrical",
      "Run the micro-ROS agent and verify the ESP32's topics from ROS 2",
      "Assemble the exit project: one set of ROS 2 nodes driving a simulated and a real diff-drive robot",
    ],
    blocks: [
      { t: "h", text: "The last link: the microcontroller" },
      { t: "p", text: "Module a6 established that motors, encoders and safety timeouts belong on a microcontroller. There are two standard ways to connect it to ROS 2. The first you saw in the last lesson: a **ros2_control hardware interface** on the Linux computer speaks your own serial protocol to the microcontroller, which knows nothing about ROS. The second is **micro-ROS**: the microcontroller itself becomes a ROS 2 node, publishing and subscribing to real ROS 2 topics. micro-ROS is quicker to start with, lets you see the microcontroller's topics with ordinary ros2 tools, and suits sensors and small actuators. The ros2_control route is the more common choice for a drive base that will run Nav2, because the odometry and controller logic live in tested, standard code. This lesson builds the micro-ROS base, then shows how both fit the exit project." },

      { t: "h", text: "How micro-ROS works" },
      { t: "diagram", text: String.raw`
 ┌───────── ESP32 ─────────┐   Wi-Fi UDP or     ┌──── Linux computer ─────┐
 │ your code (rclc API)    │   serial UART      │ micro_ros_agent          │──► ROS 2 graph (DDS)
 │ rcl + rmw_microxrcedds  │◄──────────────────►│ (XRCE-DDS server)        │   /cmd_vel, /base/heartbeat
 │ Micro XRCE-DDS client   │  XRCE-DDS protocol │                          │
 │ FreeRTOS                │                    └──────────────────────────┘
 └─────────────────────────┘`, caption: "The microcontroller runs a small client; the agent on the Linux computer represents it on the DDS network." },
      { t: "p", text: "A full DDS implementation needs far more RAM than an ESP32 has. micro-ROS instead runs a **Micro XRCE-DDS client** (eXtremely Resource Constrained Environments) on the microcontroller, which talks a compact protocol over serial, UDP or other transports to a **micro-ROS agent** on a Linux computer. The agent creates real DDS publishers and subscribers on the microcontroller's behalf. From the rest of the system's point of view, the ESP32 is simply a node called `base_controller`. Your code uses **rclc**, a C API layered on the same `rcl` library that rclpy and rclcpp use, with an executor designed for static memory: everything is allocated at startup, nothing during operation." },

      { t: "h", text: "Which micro-ROS for Lyrical" },
      { t: "p", text: "The micro-ROS client, the agent and the ROS 2 distribution must match. For ROS 2 Lyrical on the ESP32, use **micro_ros_espidf_component** with ESP-IDF (v5.2 or newer). Its registry versions follow the distribution: 22.x is Humble, 24.x Jazzy, 25.x Kilted. **Check before you start:** as of November 2026 the component has no `lyrical` branch and no Lyrical release in the IDF registry (its branches stop at `kilted`, plus `rolling`), while the agent side, `micro_ros_setup`, does have a `lyrical` branch. Until a Lyrical release appears, clone the component's `rolling` branch (Lyrical was branched from Rolling, so its messages match) into your project's `components/` folder and test it against the Lyrical agent; switch to the `lyrical` branch as soon as it is published. The Arduino library **micro_ros_arduino** is convenient but lags behind: at the time of writing its newest branch targets Kilted and its prebuilt ESP32 support is tied to an old Arduino-ESP32 core, so it is not used here. If you must stay on Arduino, use Jazzy or Kilted for the whole system rather than mixing distributions." },
      { t: "snippet", lang: "bash", code: String.raw`# ESP-IDF project for the ESP32 DevKit
. ~/esp/esp-idf/export.sh
idf.py create-project base_controller && cd base_controller
mkdir -p components && git clone -b rolling \
  https://github.com/micro-ROS/micro_ros_espidf_component.git components/micro_ros_espidf_component
# use -b lyrical once that branch exists (git ls-remote --heads <repo> to check)
idf.py set-target esp32
idf.py menuconfig        # micro-ROS Settings: Wi-Fi SSID and password, agent IP and port 8888
idf.py build flash monitor`, caption: "Creating and building the firmware. The first build compiles the micro-ROS libraries and takes several minutes." },

      { t: "h", text: "The base controller firmware" },
      { t: "p", text: "The firmware below subscribes to `/cmd_vel` as `geometry_msgs/msg/TwistStamped` (the same type diff_drive_controller uses, so the same teleop and navigation nodes can drive it), converts it to wheel speeds with the kinematics from the last lesson, and publishes a heartbeat counter on `/base/heartbeat` at 20 Hz. A 0.5 s command timeout stops the wheels if commands stop arriving." },
      { t: "snippet", lang: "c", code: String.raw`// ESP32 DevKit, ESP-IDF with micro_ros_espidf_component, UDP transport over Wi-Fi.
// Set Wi-Fi credentials, agent IP and port in idf.py menuconfig > micro-ROS Settings.
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_timer.h"
#include <rcl/rcl.h>
#include <rcl/error_handling.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <rmw_microros/rmw_microros.h>
#include <uros_network_interfaces.h>
#include <geometry_msgs/msg/twist_stamped.h>
#include <std_msgs/msg/int32.h>

#define RCCHECK(fn) { rcl_ret_t rc = fn; if (rc != RCL_RET_OK) { \
  printf("micro-ROS error %d at line %d\n", (int)rc, __LINE__); vTaskDelete(NULL); } }
#define RCSOFTCHECK(fn) { rcl_ret_t rc = fn; (void)rc; }

static const float WHEEL_SEPARATION = 0.16f;   // m, same as the URDF
static const float WHEEL_RADIUS = 0.033f;      // m
static const int64_t CMD_TIMEOUT_US = 500000;  // stop if no command for 0.5 s

static rcl_publisher_t heartbeat_pub;
static std_msgs__msg__Int32 heartbeat;
static rcl_subscription_t cmd_sub;
static geometry_msgs__msg__TwistStamped cmd;
static char frame_id_buf[32];                  // storage for the incoming header.frame_id
static int64_t last_cmd_us = 0;

// Replace with your motor driver and wheel PID code from the motor control module.
static void set_wheel_speeds(float left_rad_s, float right_rad_s) {
  printf("wheel targets L %.2f R %.2f rad/s\n", left_rad_s, right_rad_s);
}

static void cmd_callback(const void *msgin) {
  const geometry_msgs__msg__TwistStamped *m = (const geometry_msgs__msg__TwistStamped *)msgin;
  float v = (float)m->twist.linear.x;           // m/s forward
  float w = (float)m->twist.angular.z;          // rad/s, counter-clockwise positive
  set_wheel_speeds((v - w * WHEEL_SEPARATION / 2) / WHEEL_RADIUS,
                   (v + w * WHEEL_SEPARATION / 2) / WHEEL_RADIUS);
  last_cmd_us = esp_timer_get_time();
}

static void timer_callback(rcl_timer_t *timer, int64_t last_call_time) {
  (void)last_call_time;
  if (timer == NULL) return;
  if (last_cmd_us != 0 && esp_timer_get_time() - last_cmd_us > CMD_TIMEOUT_US) {
    set_wheel_speeds(0, 0);                     // safety: commands stopped arriving
    last_cmd_us = 0;
  }
  RCSOFTCHECK(rcl_publish(&heartbeat_pub, &heartbeat, NULL));
  heartbeat.data++;
}

static void micro_ros_task(void *arg) {
  rcl_allocator_t allocator = rcl_get_default_allocator();
  rcl_init_options_t init_options = rcl_get_zero_initialized_init_options();
  RCCHECK(rcl_init_options_init(&init_options, allocator));
  rmw_init_options_t *rmw_options = rcl_init_options_get_rmw_init_options(&init_options);
  RCCHECK(rmw_uros_options_set_udp_address(CONFIG_MICRO_ROS_AGENT_IP, CONFIG_MICRO_ROS_AGENT_PORT, rmw_options));

  rclc_support_t support;
  RCCHECK(rclc_support_init_with_options(&support, 0, NULL, &init_options, &allocator));
  rcl_node_t node;
  RCCHECK(rclc_node_init_default(&node, "base_controller", "", &support));

  RCCHECK(rclc_publisher_init_best_effort(&heartbeat_pub, &node,
          ROSIDL_GET_MSG_TYPE_SUPPORT(std_msgs, msg, Int32), "base/heartbeat"));
  cmd.header.frame_id.data = frame_id_buf;
  cmd.header.frame_id.capacity = sizeof(frame_id_buf);
  cmd.header.frame_id.size = 0;
  RCCHECK(rclc_subscription_init_default(&cmd_sub, &node,
          ROSIDL_GET_MSG_TYPE_SUPPORT(geometry_msgs, msg, TwistStamped), "cmd_vel"));

  rcl_timer_t timer;
  RCCHECK(rclc_timer_init_default2(&timer, &support, RCL_MS_TO_NS(50), timer_callback, true));

  rclc_executor_t executor = rclc_executor_get_zero_initialized_executor();
  RCCHECK(rclc_executor_init(&executor, &support.context, 2, &allocator));
  RCCHECK(rclc_executor_add_timer(&executor, &timer));
  RCCHECK(rclc_executor_add_subscription(&executor, &cmd_sub, &cmd, &cmd_callback, ON_NEW_DATA));

  while (1) {
    rclc_executor_spin_some(&executor, RCL_MS_TO_NS(10));
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

void app_main(void) {
  ESP_ERROR_CHECK(uros_network_interface_initialize());   // joins Wi-Fi from menuconfig
  xTaskCreate(micro_ros_task, "uros_task", 16000, NULL, 5, NULL);
}`, caption: "main/main.c (ESP-IDF, C). The default transport is UDP over Wi-Fi; a serial transport is selected through the component's custom transport option." },
      { t: "p", text: "Points to notice. The incoming message contains a string (`header.frame_id`), and micro-ROS does not allocate memory when a message arrives, so you must give the string a buffer and capacity before subscribing; forget this and the subscription silently receives nothing, or the frame is rejected. The heartbeat uses a **best-effort** publisher, which is cheaper on a lossy link; remember the QoS rule from lesson 1 when you subscribe to it. The executor is created with room for exactly two handles (one timer and one subscription); add more and you must raise that number. On the real robot `set_wheel_speeds` sets targets for per-wheel PID loops running from encoder interrupts, as in the motor control module, and those loops run regardless of the network." },

      { t: "h", text: "Running the agent" },
      { t: "p", text: "The agent runs on the Raspberry Pi or laptop. Build it from source in a workspace with the `micro_ros_setup` package for Lyrical, or use the Docker image whose tag matches your distribution. Then start it on the transport your firmware uses:" },
      { t: "snippet", lang: "bash", code: String.raw`# Option A: from source (once)
cd ~/uros_ws && git clone -b lyrical https://github.com/micro-ROS/micro_ros_setup.git src/micro_ros_setup
rosdep install --from-paths src --ignore-src -y && colcon build && source install/setup.bash
ros2 run micro_ros_setup create_agent_ws.sh && ros2 run micro_ros_setup build_agent.sh
source install/setup.bash

# Run it: UDP for Wi-Fi firmware, or serial for a USB/UART link
ros2 run micro_ros_agent micro_ros_agent udp4 --port 8888
ros2 run micro_ros_agent micro_ros_agent serial --dev /dev/ttyUSB0 -b 115200

# Check from any terminal
ros2 node list                         # /base_controller appears
ros2 topic echo /base/heartbeat --qos-reliability best_effort
ros2 run teleop_twist_keyboard teleop_twist_keyboard --ros-args -p stamped:=true`, caption: "Reset the ESP32 after starting the agent if the node does not appear; the client creates its entities when it first connects." },

      { t: "h", text: "The exit project: one system, two robots" },
      { t: "p", text: "The goal is that the nodes you write and test in simulation drive the real robot unchanged. The contract between them is a set of **topics and frames**: velocity commands on `/cmd_vel` (TwistStamped), odometry on `/odom` with the transform odom → base_footprint, the robot model from robot_state_publisher, and later `/scan` from a LiDAR. Anything that honours the contract can be swapped in underneath." },
      { t: "table", head: ["Layer", "Simulation", "Real robot"], rows: [
        ["Your nodes (teleop, a square-driving node, later Nav2)", "same", "same"],
        ["/cmd_vel interface", "diff_drive_controller (remapped to /cmd_vel)", "micro-ROS base_controller, or diff_drive_controller with your hardware plugin"],
        ["Wheel control", "GazeboSimSystem", "ESP32 PID loops and motor driver"],
        ["Odometry and TF", "diff_drive_controller", "diff_drive_controller (ros2_control route) or an odometry node fed by encoder ticks (micro-ROS route)"],
        ["Clock", "/clock from Gazebo, use_sim_time true", "system clock, use_sim_time false"],
      ], caption: "What changes between simulation and hardware. Only the bottom layers do." },
      { t: "p", text: "Write one launch file with a `use_sim` argument. When true it includes the Gazebo pieces from the last lesson; when false it starts robot_state_publisher with the real hardware variant of the URDF and either the micro-ROS agent or the ros2_control stack with your hardware plugin. A test node that drives a 1 m square (publish v = 0.2 m/s for 5 s, then ω = 0.5 rad/s for π/2 / 0.5 ≈ 3.14 s, four times) should then run identically against both. Comparing the odometry traces of the two runs in rqt Plot is the final check, and the differences you see are your calibration list." },
      { t: "note", kind: "safety", text: "The ESP32 is 3.3 V: drive the motor driver's logic inputs from it directly only if the driver accepts 3.3 V logic, and never feed encoder outputs powered at 5 V into its pins without a divider or level shifter. Fuse the battery, and keep the robot on a stand for the first runs." },

      { t: "deep", title: "Inside micro-ROS: memory, entities and reconnection", blocks: [
        { t: "p", text: "The client library is configured at build time with fixed maximums: number of nodes, publishers, subscriptions, services and the size of the transport buffers (`colcon.meta` in the component). This is what makes micro-ROS predictable on a microcontroller, and also why adding a sixth publisher to firmware configured for five fails at runtime with an error code rather than at compile time. Large messages such as images do not fit; micro-ROS is for small, frequent messages." },
        { t: "p", text: "The agent may restart, or Wi-Fi may drop. Production firmware uses a small state machine: WAITING_AGENT (ping the agent with `rmw_uros_ping_agent` every 500 ms), AGENT_AVAILABLE (create entities), AGENT_CONNECTED (spin the executor, pinging periodically), AGENT_DISCONNECTED (destroy entities, stop the motors, go back to waiting). The micro-ROS examples include this as the \"reconnection\" example; add it before trusting a robot outdoors. Time is also not shared automatically: `rmw_uros_sync_session` synchronises the microcontroller's clock with the agent so that message stamps make sense." },
      ] },
      { t: "deep", title: "Odometry from encoder ticks", blocks: [
        { t: "p", text: "On the micro-ROS route, the base reports wheel encoder counts and something must integrate them into a pose. Per update interval, convert each wheel's tick change to distance: d = Δticks × 2πr / ticks_per_rev. Then integrate the body motion." },
        { t: "formula", text: String.raw`d = (d_right + d_left)/2        Δθ = (d_right - d_left)/L
x ← x + d cos(θ + Δθ/2)
y ← y + d sin(θ + Δθ/2)
θ ← θ + Δθ

Example: 1 interval, ticks_per_rev = 1320, r = 0.033 m, L = 0.16 m
Δticks_left = 100, Δticks_right = 140
d_left  = 100 × 2π × 0.033 / 1320 ≈ 0.01571 m
d_right = 140 × 2π × 0.033 / 1320 ≈ 0.02199 m
d  = (0.02199 + 0.01571)/2 ≈ 0.01885 m
Δθ = (0.02199 - 0.01571)/0.16 ≈ 0.0393 rad (2.25°)`, caption: "Midpoint integration of differential-drive odometry. 2π × 0.033 / 1320 ≈ 0.000157 m per tick." },
        { t: "p", text: "The odometry node publishes `nav_msgs/msg/Odometry` on `/odom` and broadcasts odom → base_footprint with a `tf2_ros.TransformBroadcaster`, using a yaw quaternion (0, 0, sin(θ/2), cos(θ/2)). This is exactly what diff_drive_controller does internally, which is the argument for the ros2_control route: it is already written and tested." },
      ] },
    ],
    mistakes: [
      "**Mixing micro-ROS and ROS 2 distributions** (a Kilted client with a Lyrical agent and system). Match the component version, the agent and the ROS distribution.",
      "**Not giving the subscription message's strings a buffer.** micro-ROS does not allocate on receive; header.frame_id needs memory set up before subscribing.",
      "**Subscribing to a best-effort micro-ROS topic with a reliable subscriber.** Nothing arrives; match the QoS.",
      "**Forgetting the executor handle count** when adding a subscription or timer, so the new callback never runs.",
      "**No command timeout on the base.** If Wi-Fi drops mid-command, the robot keeps driving.",
      "**Testing on the floor first.** Put the robot on a stand until direction, speed and timeout have all been checked.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: drive a simulated and a real differential-drive robot with the same ROS 2 nodes.",
      steps: [
        "Build and flash the base_controller firmware to an ESP32 DevKit with your Wi-Fi and agent settings. Start the agent on the Pi or laptop and confirm /base_controller appears and the heartbeat arrives at 20 Hz (`ros2 topic hz`).",
        "With the wheels off the ground, drive with teleop_twist_keyboard (stamped) and check in the serial monitor that the wheel targets match the kinematics formula, and that they drop to zero 0.5 s after you stop pressing keys.",
        "Connect the motor driver and wheel PID loops from the motor control module in place of set_wheel_speeds, and confirm the wheels turn in the right directions.",
        "Write a Python node `square_driver` that publishes TwistStamped on /cmd_vel to drive a 1 m square. Run it against the Gazebo robot from the last lesson.",
        "Run the same node, unchanged, against the real robot. Measure how far the real robot ends from its start point, and list the causes (wheel radius, separation, slip, motor response).",
        "Optional extension: replace micro-ROS with a ros2_control hardware plugin that speaks the a6 COBS protocol, so the real robot also uses diff_drive_controller for odometry.",
      ],
    },
    quiz: [
      {
        q: "What is the role of the micro-ROS agent?",
        options: [
          "It runs on the Linux computer and represents the microcontroller on the DDS network, translating XRCE-DDS from the client",
          "It compiles the firmware",
          "It is a motor driver",
          "It replaces the ROS 2 installation",
        ],
        answer: 0,
        why: "The microcontroller runs a lightweight XRCE-DDS client. The agent creates real DDS entities on its behalf, so other nodes see an ordinary ROS 2 node.",
      },
      {
        q: "For a system on ROS 2 Lyrical with an ESP32, which micro-ROS route does the lesson recommend?",
        options: [
          "micro_ros_arduino, whatever its branch",
          "micro_ros_espidf_component with ESP-IDF, on the branch matching Lyrical (Rolling until a lyrical branch is published)",
          "Any micro-ROS version; they are all compatible",
          "ROS 1 rosserial",
        ],
        answer: 1,
        why: "Client, agent and distribution must match. The ESP-IDF component is branched per distribution (Rolling stands in until a Lyrical branch exists); micro_ros_arduino lags further behind, with Kilted as its newest branch.",
      },
      {
        q: "The base firmware stops the wheels when no command has arrived for 0.5 s. Why is this needed even though diff_drive_controller also has a timeout?",
        options: [
          "It is not needed",
          "On the micro-ROS route there is no diff_drive_controller, and in any case a dropped Wi-Fi link or crashed computer must not leave the motors running: the last line of defence is on the microcontroller",
          "To save battery",
          "Because micro-ROS requires it",
        ],
        answer: 1,
        why: "Safety must not depend on the link or the computer. The microcontroller is the only part guaranteed to keep running when they fail.",
      },
      {
        q: "A test node drives a 1 m square at 0.5 rad/s for each turn. How long should each 90° turn last?",
        options: ["about 1.57 s", "about 3.14 s", "about 0.5 s", "about 6.28 s"],
        answer: 1,
        why: "Time = angle / rate = (π/2) / 0.5 = π ≈ 3.14 s.",
      },
      {
        q: "What is the contract that lets the same nodes drive the simulated and the real robot?",
        options: [
          "The same Python version",
          "The same Wi-Fi network",
          "The same physics engine",
          "The same topics, message types and frames: /cmd_vel as TwistStamped, /odom with odom → base_footprint, and the robot description",
        ],
        answer: 3,
        why: "Nodes depend only on topics, types and frames. Whatever provides them underneath, Gazebo or hardware, can be swapped without changing the nodes.",
      },
    ],
  },
};

export default lessons;
