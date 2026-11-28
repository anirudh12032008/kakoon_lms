import type { ModuleContent } from "../model/curriculum";

/**
 * Module a13: Localisation, mapping and navigation.
 * ROS 2 material targets Lyrical Luth (2026 LTS, Nav2 1.5) and was checked
 * against the Jazzy and Lyrical nav2_params.yaml defaults. Python examples run
 * on plain Python 3.
 */
const lessons: ModuleContent = {
  "a13-occupancy-grids-and-monte-carlo-localisation": {
    id: "a13-occupancy-grids-and-monte-carlo-localisation",
    outcomes: [
      "Represent a map as an occupancy grid and update it with the log-odds rule",
      "Explain Monte Carlo localisation as a particle filter: motion model, sensor model and resampling",
      "Implement a low-variance resampler and a working 1D particle filter",
      "Explain why particle filters handle global localisation and the kidnapped robot problem where a Kalman filter cannot",
    ],
    blocks: [
      { t: "h", text: "The two questions every mobile robot must answer" },
      { t: "p", text: "\"Where am I?\" and \"what is around me?\" sound simple. Wheel odometry answers the first for a few metres, then drifts: a 1% error in wheel diameter becomes 10 cm after 10 m, and a small heading error grows into a large position error. The answer is to compare what the sensors see with a **map**. That needs a map format suited to noisy range sensors, and an estimator that can hold several hypotheses about where the robot might be. This lesson builds both: the **occupancy grid** and **Monte Carlo localisation** (MCL). Together they are what Nav2's `map_server` and AMCL nodes do on your robot." },

      { t: "h", text: "Occupancy grids" },
      { t: "p", text: "Divide the floor into square cells, typically 5 cm on a side. Each cell stores the probability that it is occupied. A 10 m × 10 m room at 5 cm resolution is 200 × 200 = 40 000 cells, tiny by computer standards. ROS publishes such maps as `nav_msgs/OccupancyGrid`, with values 0 (free) to 100 (occupied) and -1 for unknown, and saves them as a PGM image plus a YAML file giving the resolution and origin." },
      { t: "p", text: "How do you fill the grid from a LiDAR? Each beam says two things: the cell where it ended probably contains an obstacle, and every cell it passed through on the way is probably free. You trace the ray (Bresenham's line algorithm), lower the occupancy belief of the cells along it, and raise the belief of the end cell. Repeated over thousands of scans, noise averages out." },

      { t: "h", text: "The log-odds update" },
      { t: "p", text: "Multiplying probabilities scan after scan is clumsy and numerically fragile near 0 and 1. Instead store each cell's **log-odds**, l = log(p / (1 - p)). p = 0.5 (unknown) is l = 0; very likely occupied is large positive; very likely free is large negative. The Bayes update then becomes an addition:" },
      { t: "formula", text: String.raw`l_t = l_{t-1} + log( p(occ | z_t) / (1 - p(occ | z_t)) ) - l_0

p = 1 - 1 / (1 + e^l)`, caption: "Add the log-odds of the inverse sensor model; subtract the prior l_0 (zero for a 0.5 prior)." },
      { t: "p", text: "Here p(occ | z) is the **inverse sensor model**: how likely the cell is occupied given this one reading. Typical values: 0.7 for the cell at the beam's end, 0.4 for cells the beam passed through. Worked example with l_0 = 0: the hit increment is log(0.7 / 0.3) = 0.847 and the miss increment is log(0.4 / 0.6) = -0.405. A cell hit by three scans in a row reaches l = 3 × 0.847 = 2.542, or p = 1 - 1 / (1 + e^2.542) = 0.927. If a fourth beam then passes through it (a person walked away), l = 2.542 - 0.405 = 2.136 and p = 0.894. Check: e^2.136 ≈ 8.47, so p = 8.47 / 9.47 = 0.894." },
      { t: "p", text: "Two practical details. **Clamp** l between limits (say ±3.5) so a cell that was occupied for a minute can still become free when the door opens. And because the miss increment is smaller in magnitude than the hit, a cell needs several clear passes to undo one hit; this deliberately favours keeping obstacles, which is the safer error." },

      { t: "h", text: "Localisation as a filtering problem" },
      { t: "p", text: "With a map in hand, localisation means estimating the pose x = (x, y, θ) from controls u (odometry) and measurements z (scans). The Bayes filter you met in a9 does it in two steps every cycle: **predict** with a motion model p(x_t | x_{t-1}, u_t), then **correct** with a sensor model p(z_t | x_t, map). The Kalman filter implements this with a single Gaussian. That fails here because the belief is often not one blob. In a corridor with identical doors, the robot genuinely could be at any of several places, and only later readings can decide. A representation that can hold several peaks is needed." },

      { t: "h", text: "Particles" },
      { t: "p", text: "A particle filter represents the belief by a set of N samples, **particles**, each a guess of the pose. Where particles are dense, the robot probably is. The algorithm per cycle:" },
      { t: "list", ordered: true, items: [
        "**Motion update**: move every particle by the odometry reading plus random noise drawn from the motion model. Noise matters: it spreads particles to cover the uncertainty that odometry adds.",
        "**Sensor update**: give each particle a weight w = p(z | particle pose, map): how well the real scan matches the scan you would expect from that pose.",
        "**Resample**: draw N new particles with probability proportional to weight. Good guesses multiply; bad ones die out.",
        "**Estimate**: report the mean (or the densest cluster) of the particles, and their spread as the uncertainty.",
      ] },
      { t: "p", text: "For a 2D LiDAR, the usual sensor model is the **likelihood field** (Nav2 AMCL's default `laser_model_type: likelihood_field`). Precompute, for every map cell, the distance to the nearest obstacle. For a particle, project each beam endpoint into the map and look up that distance d; the beam's likelihood is a Gaussian in d plus a small constant for random readings, and the particle's weight is the product over beams. It is fast because it never traces rays at run time." },

      { t: "h", text: "Resampling without losing diversity" },
      { t: "p", text: "Naive resampling draws N independent random numbers. That adds needless randomness: even with equal weights, some particles get copied twice and others vanish. The **low-variance resampler** (also called systematic resampling) draws one random number r in [0, W/N), where W is the total weight, then picks particles at r, r + W/N, r + 2W/N and so on, walking along the cumulative weights. With equal weights it returns exactly the original set, and it runs in O(N)." },
      { t: "snippet", lang: "python", code: String.raw`import math
import random

# A 1D corridor 10 m long. Doors the robot's side sensor can see.
DOORS = [2.0, 3.0, 7.0]
LENGTH = 10.0

def sees_door(x):
    return any(abs(x - d) < 0.3 for d in DOORS)

def motion_update(particles, u, sigma=0.1):
    """Move each particle by the commanded distance u plus Gaussian noise."""
    return [min(max(x + u + random.gauss(0, sigma), 0.0), LENGTH) for x in particles]

def sensor_weights(particles, z, p_hit=0.8, p_false=0.1):
    """p(z | x) for a door detector that is right 80% of the time at a door
    and gives a false alarm 10% of the time elsewhere."""
    w = []
    for x in particles:
        expected = sees_door(x)
        if z:
            w.append(p_hit if expected else p_false)
        else:
            w.append(1 - p_hit if expected else 1 - p_false)
    return w

def low_variance_resample(particles, weights):
    """One random number, N evenly spaced pointers along the cumulative weights."""
    n = len(particles)
    step = sum(weights) / n
    r = random.uniform(0, step)
    out, c, i = [], weights[0], 0
    for m in range(n):
        u = r + m * step
        while u > c:
            i += 1
            c += weights[i]
        out.append(particles[i])
    return out

def estimate(particles):
    mean = sum(particles) / len(particles)
    sd = math.sqrt(sum((x - mean) ** 2 for x in particles) / len(particles))
    return mean, sd

if __name__ == "__main__":
    random.seed(4)
    true_x = 0.5
    particles = [random.uniform(0, LENGTH) for _ in range(1000)]   # no idea where we are
    for step in range(16):
        u = 0.5
        true_x += u + random.gauss(0, 0.05)
        z = sees_door(true_x) if random.random() > 0.05 else not sees_door(true_x)
        particles = motion_update(particles, u)
        particles = low_variance_resample(particles, sensor_weights(particles, z))
        mean, sd = estimate(particles)
        print(f"step {step:2d}  true {true_x:5.2f}  door {int(z)}  est {mean:5.2f} ± {sd:4.2f}")
    assert abs(mean - true_x) < 0.5, "filter failed to converge"`, caption: "Monte Carlo localisation in one dimension. Runs in plain Python." },
      { t: "p", text: "Running it shows the behaviour that makes particle filters worth learning. For the first ten steps the spread stays around 2 to 3 m: seeing the doors at 2 m and 3 m is consistent with several places, so the belief stays multi-peaked. At step 12 the robot sees the door at 7 m after a long blank stretch, a pattern only one place in the corridor fits, and the spread collapses from 1.71 m to 0.87 m. By step 15 the estimate is 8.67 m against a true 8.44 m, with spread 0.49 m. A Kalman filter started with no idea of position could not have represented the first ten steps at all." },

      { t: "h", text: "Global localisation and the kidnapped robot" },
      { t: "p", text: "Starting with particles spread over the whole map, as above, is **global localisation**. A harder case is the **kidnapped robot**: the robot is picked up and moved, and every particle is now in the wrong place. Pure resampling can never recover, because particles only multiply where particles already are. AMCL's fix is to inject a few random particles whenever the average weight drops sharply compared with its long-term average (its `recovery_alpha_slow` and `recovery_alpha_fast` parameters, which default to off). In practice on Nav2 you usually give the robot an initial pose estimate in RViz with \"2D Pose Estimate\" instead." },
      { t: "note", kind: "tip", text: "AMCL is **adaptive** (the A): it uses KLD sampling to vary the particle count, from many when uncertain to few when converged, between `min_particles` and `max_particles`." },

      { t: "deep", title: "Deriving the log-odds occupancy update", blocks: [
        { t: "p", text: "Let m be the event that a cell is occupied, and z_1..t the measurements. Bayes' rule, with the assumption that measurements are independent given the cell state, gives" },
        { t: "formula", text: String.raw`p(m | z_1:t) = p(z_t | m) p(m | z_1:t-1) / p(z_t | z_1:t-1)

Apply Bayes again to p(z_t | m) = p(m | z_t) p(z_t) / p(m):
p(m | z_1:t) = p(m | z_t) p(z_t) p(m | z_1:t-1) / ( p(m) p(z_t | z_1:t-1) )

Write the same for ¬m and divide the two; the awkward terms cancel:
p(m | z_1:t) / p(¬m | z_1:t)
   = [p(m | z_t) / p(¬m | z_t)] · [p(m | z_1:t-1) / p(¬m | z_1:t-1)] · [p(¬m) / p(m)]

Take logs:
l_t = log-odds(m | z_t) + l_{t-1} - l_0`, caption: "The odds ratio turns the product into a sum, and the normalising constant disappears." },
        { t: "p", text: "The quantity that appears, p(m | z_t), is the inverse sensor model: the probability of occupancy given one reading, which is easy to specify by hand. The independence assumption is false for a moving person (successive readings are correlated), which is why clamping and time decay are used in practice." },
      ] },
      { t: "deep", title: "The odometry motion model used by AMCL", blocks: [
        { t: "p", text: "AMCL's `nav2_amcl::DifferentialMotionModel` decomposes the odometry change between two poses into a first rotation δrot1, a translation δtrans and a second rotation δrot2. Each particle applies the same decomposition with noise whose variance grows with the motion:" },
        { t: "formula", text: String.raw`δtrans = √((x' - x)² + (y' - y)²)
δrot1  = atan2(y' - y, x' - x) - θ
δrot2  = θ' - θ - δrot1

σ²(rot1)  = α1 · δrot1² + α2 · δtrans²
σ²(trans) = α3 · δtrans² + α4 · (δrot1² + δrot2²)
σ²(rot2)  = α1 · δrot2² + α2 · δtrans²`, caption: "From Thrun, Burgard and Fox, Probabilistic Robotics, chapter 5." },
        { t: "p", text: "α1 is rotation noise from rotation, α2 rotation noise from translation, α3 translation noise from translation, α4 translation noise from rotation; these are AMCL's `alpha1` to `alpha4` parameters (`alpha5` is for omnidirectional robots). If AMCL's particle cloud lags behind the robot when it turns, raise alpha1; if it is too tight and the estimate jumps, your alphas are too small for your wheels." },
      ] },
    ],
    mistakes: [
      "**Forgetting the free-space update.** Marking only beam endpoints leaves the map full of ghost obstacles from people who walked through.",
      "**Not clamping log-odds.** Unclamped cells become so confident they take hundreds of scans to change when a door opens.",
      "**Too little motion noise.** Particles collapse to a tight cluster that cannot follow real wheel slip, and the filter loses track.",
      "**Using naive multinomial resampling every step.** It throws away diversity; use the low-variance resampler, and resample only when the weights become uneven.",
      "**Expecting MCL to recover from a kidnap on its own.** Without random particle injection it cannot. Re-initialise the pose.",
    ],
    practice: {
      kind: "bench",
      task: "Experiment with the 1D particle filter until you can predict its behaviour.",
      steps: [
        "Run the MCL program and note the step at which the spread falls below 1 m.",
        "Move the third door from 7.0 m to 4.0 m. Predict whether convergence will be faster or slower, then run it and explain.",
        "Reduce the particle count to 50 and run with five different seeds. Record how often the assert fails.",
        "Set the motion noise sigma to 0.0 and observe what happens to the particle diversity over 16 steps.",
        "Kidnap the robot: at step 8 add 3 m to true_x. Then add random injection (replace 5% of particles with uniform ones each step) and show that it recovers.",
      ],
    },
    quiz: [
      {
        q: "With l_0 = 0 and a hit increment of log(0.7/0.3) ≈ 0.85, what is a cell's occupancy probability after two hits?",
        options: ["0.70", "0.85", "0.84", "0.49"],
        answer: 2,
        why: "l = 1.69, e^1.69 ≈ 5.44, so p = 5.44 / 6.44 ≈ 0.84.",
      },
      {
        q: "Why does a particle filter suit localisation in a corridor of identical doors better than a Kalman filter?",
        options: [
          "It uses less memory",
          "It can represent a belief with several separate peaks until later readings decide between them",
          "It does not need a motion model",
          "It is always more accurate",
        ],
        answer: 1,
        why: "A Kalman filter's belief is one Gaussian. Particles can sit at several candidate places at once.",
      },
      {
        q: "Four particles have weights 0.1, 0.1, 0.1, 0.7. In low-variance resampling with r = 0.2 and step 0.25, which particles are chosen?",
        options: ["1, 2, 3, 4", "2, 4, 4, 4", "4, 4, 4, 4", "1, 4, 4, 4"],
        answer: 1,
        why: "Pointers at 0.2, 0.45, 0.70, 0.95. Cumulative weights are 0.1, 0.2, 0.3, 1.0. 0.2 is not greater than 0.2 so it lands on particle 2; the rest land on particle 4.",
      },
      {
        q: "What is the purpose of the motion update's random noise?",
        options: [
          "To make the program run faster",
          "To spread particles to cover the uncertainty that odometry adds",
          "To remove the need for resampling",
          "To make the map more accurate",
        ],
        answer: 1,
        why: "Odometry is imperfect; without noise every copy of a particle would move identically and the cloud could not track the real error.",
      },
      {
        q: "Why is free space along a beam lowered in log-odds as well as the endpoint raised?",
        options: [
          "To save memory",
          "Because the beam passing through a cell is evidence that the cell is empty, which clears transient obstacles",
          "Because ROS requires it",
          "To make the map look smoother",
        ],
        answer: 1,
        why: "A beam could not have passed through an occupied cell, so cells along it are probably free.",
      },
    ],
  },

  "a13-slam-scan-matching-and-slam-toolbox": {
    id: "a13-slam-scan-matching-and-slam-toolbox",
    outcomes: [
      "State the SLAM problem and explain why mapping and localisation must be solved together",
      "Describe ICP scan matching and its failure modes",
      "Explain graph-based SLAM: pose nodes, odometry and loop closure constraints, and optimisation",
      "Build and save a map of a room with slam_toolbox in ROS 2",
    ],
    blocks: [
      { t: "h", text: "The chicken and egg problem" },
      { t: "p", text: "The previous lesson assumed a map to localise in. Building the map with log-odds assumed known poses. In a new building you have neither. **SLAM**, simultaneous localisation and mapping, estimates both together: the robot's trajectory x_1..t and the map m, from odometry u_1..t and measurements z_1..t. The key insight that makes it solvable is that errors are correlated: if the robot's pose estimate is 10 cm off, everything it maps from there is 10 cm off in the same way. When it later recognises a place it has seen before, that one recognition corrects the whole chain of poses and the map with them." },
      { t: "formula", text: String.raw`Full SLAM:    p(x_1:t, m | z_1:t, u_1:t)
Online SLAM:  p(x_t, m | z_1:t, u_1:t)`, caption: "Full SLAM estimates the whole trajectory; online SLAM only the current pose." },

      { t: "h", text: "Scan matching" },
      { t: "p", text: "The first ingredient is **scan matching**: given two LiDAR scans taken from nearby poses, find the rigid motion (rotation θ, translation t) that best aligns them. This gives far better relative motion than wheel odometry, because walls do not slip. The classic algorithm is **ICP**, iterative closest point:" },
      { t: "list", ordered: true, items: [
        "Start from an initial guess of the motion, usually from odometry.",
        "Transform the new scan's points by the current guess.",
        "For each point, find the closest point in the reference scan (a k-d tree makes this fast).",
        "Reject pairs farther apart than a threshold; they are probably not the same surface.",
        "Solve for the rotation and translation that minimise the summed squared distances of the remaining pairs. For point pairs this has a closed form using the SVD of their cross covariance.",
        "Repeat from step 2 until the motion stops changing.",
      ] },
      { t: "p", text: "ICP converges to a local minimum, so it needs a decent initial guess; odometry within about 20 cm and 10° is usually enough. It fails in **degenerate** places: in a long featureless corridor, sliding along the corridor does not change the alignment, so translation along it is unconstrained. Variants matter in practice: **point-to-line** ICP (distance to the line through neighbouring reference points) converges much faster on walls, and **correlative scan matching**, used by slam_toolbox and Cartographer, brute-force searches a window of poses on a precomputed lookup grid, which is robust to a poor initial guess." },

      { t: "h", text: "Graph-based SLAM" },
      { t: "p", text: "Modern 2D SLAM is almost always **graph-based**. Build a graph in which each **node** is a robot pose at which a scan was kept (a keyframe, say every 0.5 m or 0.5 rad). Each **edge** is a measured relative transform between two poses, with an uncertainty:" },
      { t: "list", items: [
        "**Odometry edges** join consecutive poses, from wheel odometry refined by scan matching.",
        "**Loop closure edges** join a new pose to an old one when the robot recognises a place it visited before, again found by scan matching the new scan against old ones nearby.",
      ] },
      { t: "diagram", text: String.raw`  x1 ──── x2 ──── x3 ──── x4
  │                        │
  │      odometry edges    │
  │                        │
  x8 ──── x7 ──── x6 ──── x5
  ┆
  └┄┄┄┄┄┄ loop closure: x8 matches x1`, caption: "Driving round a room. Odometry alone lets x8 drift away from x1; the loop closure edge pulls them together." },
      { t: "p", text: "The **back end** then finds the set of poses that best agrees with all the edges at once. Each edge says \"pose j relative to pose i should be z_ij\"; the error e_ij is the difference between that and what the current poses imply. Optimisation minimises the sum of squared errors, each weighted by its information matrix Ω (the inverse covariance), so confident edges count more:" },
      { t: "formula", text: String.raw`x* = argmin over x of  Σ e_ijᵀ Ω_ij e_ij
e_ij = z_ij ⊖ (x_j ⊖ x_i)`, caption: "Nonlinear least squares, solved with Gauss Newton or Levenberg Marquardt. ⊖ is relative pose." },
      { t: "p", text: "When a loop closes, the error on that edge is large, and the optimiser spreads the correction smoothly along every pose in the loop rather than dumping it at the end. The map is then simply re-rendered from the corrected poses and their stored scans. Because each pose connects only to a few others, the system is sparse and solves in milliseconds even with thousands of nodes. The **front end** (scan matching and loop detection) produces the graph; the **back end** optimises it. A wrong loop closure (two similar rooms matched) is catastrophic, so front ends demand strong scan match scores before adding one." },

      { t: "h", text: "slam_toolbox in ROS 2" },
      { t: "p", text: "**slam_toolbox** is the standard 2D LiDAR SLAM package for ROS 2 and Nav2. It uses correlative scan matching for the front end, a sparse pose graph solved with Ceres for the back end, and has modes for mapping, continuing a saved map (lifelong mapping) and pure localisation. It needs three things from your robot: a `sensor_msgs/LaserScan` on `/scan`, a TF transform `odom` to `base_link` from odometry, and a static `base_link` to laser frame transform. It publishes `/map` and the `map` to `odom` transform." },
      { t: "diagram", text: String.raw`  map ──(slam_toolbox or AMCL)──▶ odom ──(odometry / EKF)──▶ base_link ──(URDF)──▶ laser`, caption: "The ROS TF chain (REP 105). map to odom jumps when corrected; odom to base_link is smooth but drifts." },
      { t: "p", text: "This split is worth understanding. The `odom` frame is continuous: the robot's pose in it never jumps, which is what a controller needs, but it drifts. The `map` frame is globally correct but jumps whenever SLAM or AMCL corrects it. Instead of moving the robot in `map`, the localiser publishes the correction as the `map` to `odom` transform." },
      { t: "snippet", lang: "bash", code: String.raw`# Install (Lyrical shown; replace lyrical with jazzy on Jazzy)
sudo apt install ros-lyrical-slam-toolbox ros-lyrical-nav2-map-server

# Terminal 1: robot drivers (base with odometry + TF, LiDAR on /scan)
# Terminal 2: start mapping
ros2 launch slam_toolbox online_async_launch.py use_sim_time:=false

# Terminal 3: drive slowly round the room
ros2 run teleop_twist_keyboard teleop_twist_keyboard

# When the map looks complete in RViz (add a Map display on /map):
ros2 run nav2_map_server map_saver_cli -f ~/maps/lab
# writes lab.pgm and lab.yaml`, caption: "Mapping a room. online_async processes scans as fast as it can and drops some if it falls behind." },
      { t: "list", items: [
        "Drive slowly, about 0.2 m/s and gentle turns, so scans overlap well and motion distortion stays small.",
        "Close loops deliberately: come back to where you started and drive past the same area again, so slam_toolbox can add loop closures.",
        "Avoid starting in a featureless corridor or facing a glass wall; LiDAR beams pass through glass and reflect off mirrors.",
        "Check `resolution` (default 0.05 m) and `max_laser_range` in the slam_toolbox parameters match your LiDAR.",
      ] },

      { t: "deep", title: "Closed-form rigid alignment inside ICP", blocks: [
        { t: "p", text: "Given matched pairs (p_i in the new scan, q_i in the reference), find R and t minimising Σ |R p_i + t - q_i|². The solution (Arun et al., 1987) is:" },
        { t: "formula", text: String.raw`p̄ = mean(p_i),  q̄ = mean(q_i)
H = Σ (p_i - p̄)(q_i - q̄)ᵀ          (2 × 2 for planar scans)
H = U S Vᵀ                          (singular value decomposition)
R = V Uᵀ        (if det(R) < 0, flip the sign of V's last column)
t = q̄ - R p̄`, caption: "Centre both point sets, align their cross covariance, then fix the translation." },
        { t: "p", text: "In 2D you can also write it directly: θ = atan2(Σ (p'x q'y - p'y q'x), Σ (p'x q'x + p'y q'y)) using the centred points. The determinant check prevents a reflection, which can otherwise appear with noisy, nearly collinear data." },
      ] },
      { t: "deep", title: "Particle filter SLAM and why graphs won", blocks: [
        { t: "p", text: "Before pose graphs, the popular 2D approach was **Rao-Blackwellised particle filter SLAM** (FastSLAM, and GMapping in ROS 1): each particle carries its own trajectory and its own occupancy map. It works, but memory grows with particles times map size, and loop closure only works if some particle happened to stay close to the truth; long loops need many particles." },
        { t: "p", text: "Graph SLAM keeps one trajectory, corrects it optimally when a loop closes, and can re-optimise the whole history at any time. It also extends naturally to 3D LiDAR, visual features (ORB-SLAM3) and multiple robots. Tools you will meet: g2o, GTSAM (factor graphs, iSAM2 incremental solving), Ceres. Cartographer (Google) is another graph-based 2D/3D SLAM system available in ROS 2." },
      ] },
    ],
    mistakes: [
      "**Missing or wrong TF.** slam_toolbox silently drops scans if it cannot look up `odom` to `base_link` or `base_link` to the laser frame at the scan's time stamp. Check with `ros2 run tf2_tools view_frames`.",
      "**Driving fast and spinning on the spot.** Scans then barely overlap and are motion distorted, and scan matching slips.",
      "**Never closing a loop.** Without returning to known places, drift is never corrected and long walls come out curved.",
      "**Publishing odom to base_link twice.** If both the wheel driver and an EKF publish it, TF flickers between them and maps smear.",
      "**Accepting a wrong loop closure.** Two similar rooms can be merged; if the map suddenly folds, discard it and remap with more distinct start points.",
    ],
    practice: {
      kind: "bench",
      task: "Map a room or corridor with slam_toolbox and assess the map's accuracy.",
      steps: [
        "Bring up your robot (or a simulated TurtleBot in Gazebo) and confirm /scan and the odom to base_link TF.",
        "Launch slam_toolbox online_async and RViz. Teleoperate slowly round the room, closing at least one loop.",
        "Save the map with map_saver_cli. Open the PGM and YAML and note the resolution and origin.",
        "Measure two wall lengths with a tape and in the map image (pixels × resolution). Compute the percentage error.",
        "Repeat the mapping run deliberately fast with no loop closure and compare the two maps.",
      ],
    },
    quiz: [
      {
        q: "Why can't you build the map first and localise afterwards in an unknown building?",
        options: [
          "Maps are too large to store",
          "Building the map needs the poses, and estimating the poses needs the map",
          "LiDARs cannot see walls",
          "ROS does not allow it",
        ],
        answer: 1,
        why: "Each problem depends on the other's answer, so SLAM solves them together.",
      },
      {
        q: "In which place is ICP scan matching most likely to fail?",
        options: [
          "A cluttered lab with furniture",
          "A long straight featureless corridor",
          "A room with many corners",
          "An L-shaped hallway",
        ],
        answer: 1,
        why: "Sliding along the corridor gives the same alignment, so translation along it is unconstrained.",
      },
      {
        q: "What does a loop closure edge do in graph SLAM?",
        options: [
          "Adds a new LiDAR",
          "Constrains a new pose relative to an old one, so optimisation corrects the accumulated drift around the loop",
          "Deletes old poses",
          "Increases map resolution",
        ],
        answer: 1,
        why: "The optimiser spreads the correction implied by the closure along the whole loop.",
      },
      {
        q: "Which transform does slam_toolbox publish?",
        options: ["odom to base_link", "base_link to laser", "map to odom", "map to base_link directly"],
        answer: 2,
        why: "Odometry provides odom to base_link; the localiser publishes the correction as map to odom, so the odom frame stays continuous.",
      },
      {
        q: "A map has resolution 0.05 m. A wall spans 84 pixels. How long is it in the map?",
        options: ["0.42 m", "4.2 m", "8.4 m", "1.68 m"],
        answer: 1,
        why: "84 × 0.05 = 4.2 m.",
      },
    ],
  },

  "a13-global-and-local-planning": {
    id: "a13-global-and-local-planning",
    outcomes: [
      "Run Dijkstra and A* on a grid by hand and in code, and prove when an A* heuristic is admissible",
      "Explain when sampling-based planners (PRM, RRT, RRT*) are preferred",
      "Describe the dynamic window approach and its scoring",
      "Derive the pure pursuit curvature law and explain what regulated pure pursuit adds",
    ],
    blocks: [
      { t: "h", text: "Two levels of planning" },
      { t: "p", text: "Navigation splits into two jobs running at different rates. The **global planner** finds a route through the known map from start to goal, perhaps once a second: which doors, which side of the table. The **local planner** or **controller** runs at 10 to 50 Hz and turns that route into wheel velocities, while avoiding obstacles that are not on the map, such as a person stepping in front. This lesson covers the algorithms behind both; the next shows them as Nav2 plugins." },

      { t: "h", text: "Grids as graphs" },
      { t: "p", text: "An occupancy grid is a graph: each free cell is a node, joined to its 4 neighbours (up, down, left, right, cost 1) or 8 neighbours (diagonals cost √2 ≈ 1.414). The shortest path in the graph is a shortest path for the robot, provided obstacles have been grown by the robot's radius so the robot can be treated as a point (that is what costmap inflation does)." },

      { t: "h", text: "Dijkstra's algorithm" },
      { t: "p", text: "Dijkstra keeps, for every node, the best known cost g from the start, and a priority queue of nodes to expand ordered by g. Repeatedly pop the cheapest node, and for each neighbour, if g(node) + edge cost beats the neighbour's current g, update it and record the node as its parent. When the goal is popped, its g is optimal and following parents back gives the path. It works because edge costs are non-negative: once a node is popped, no later route can reach it more cheaply. Its weakness is that it expands in all directions equally, like a ripple, exploring cells behind the robot as eagerly as those towards the goal." },

      { t: "h", text: "A*: Dijkstra with a sense of direction" },
      { t: "p", text: "A* orders the queue by f = g + h, where h(n) is a **heuristic** estimate of the remaining cost from n to the goal. Nodes that look closer to the goal are expanded first, so far fewer nodes are explored. A* still returns the optimal path provided h is **admissible**: it never overestimates the true remaining cost. (If h is also **consistent**, h(n) ≤ cost(n, n') + h(n') for every edge, each node needs expanding only once.)" },
      { t: "table", head: ["Moves allowed", "Admissible heuristic", "Why"], rows: [
        ["4-connected, cost 1", "Manhattan: |dx| + |dy|", "Each move changes x or y by one, so at least |dx| + |dy| moves are needed"],
        ["8-connected, costs 1 and √2", "Octile: max(dx, dy) + (√2 - 1) · min(dx, dy)", "Exact cost with no obstacles: min(dx, dy) diagonals then straight moves"],
        ["Any direction", "Euclidean: √(dx² + dy²)", "A straight line is the shortest possible path"],
      ], caption: "h = 0 is admissible too: A* then becomes Dijkstra." },
      { t: "p", text: "Using Manhattan distance on an 8-connected grid is a classic error: going diagonally one cell costs 1.414, but Manhattan says 2, an overestimate, so A* may return a path that is not shortest." },
      { t: "snippet", lang: "python", code: String.raw`import heapq
import math

def astar(grid, start, goal, diagonal=True):
    """A* on a grid (list of strings, '#' = occupied). Returns a list of cells or None."""
    rows, cols = len(grid), len(grid[0])
    if diagonal:
        moves = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1),
                 (1, 1, math.sqrt(2)), (1, -1, math.sqrt(2)),
                 (-1, 1, math.sqrt(2)), (-1, -1, math.sqrt(2))]
        def h(a, b):  # octile distance: admissible for 8-connected moves
            dx, dy = abs(a[0] - b[0]), abs(a[1] - b[1])
            return max(dx, dy) + (math.sqrt(2) - 1) * min(dx, dy)
    else:
        moves = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1)]
        def h(a, b):  # Manhattan distance: admissible for 4-connected moves
            return abs(a[0] - b[0]) + abs(a[1] - b[1])

    g = {start: 0.0}
    parent = {start: None}
    open_heap = [(h(start, goal), 0.0, start)]
    closed = set()
    while open_heap:
        f, gc, cell = heapq.heappop(open_heap)
        if cell in closed:
            continue          # stale entry; a cheaper copy was already expanded
        if cell == goal:
            path = []
            while cell is not None:
                path.append(cell)
                cell = parent[cell]
            return path[::-1]
        closed.add(cell)
        r, c = cell
        for dr, dc, cost in moves:
            nr, nc = r + dr, c + dc
            if not (0 <= nr < rows and 0 <= nc < cols) or grid[nr][nc] == "#":
                continue
            if dr and dc and (grid[r + dr][c] == "#" or grid[r][c + dc] == "#"):
                continue      # no cutting corners past an obstacle
            ng = gc + cost
            if ng < g.get((nr, nc), math.inf):
                g[(nr, nc)] = ng
                parent[(nr, nc)] = cell
                heapq.heappush(open_heap, (ng + h((nr, nc), goal), ng, (nr, nc)))
    return None

if __name__ == "__main__":
    grid = [
        "..........",
        "..######..",
        "..#....#..",
        "..#.##.#..",
        "....#.....",
        "....#.###.",
        "..........",
    ]
    start, goal = (0, 0), (4, 5)
    path = astar(grid, start, goal)
    length = sum(math.dist(a, b) for a, b in zip(path, path[1:]))
    print("path:", path)
    print(f"cells: {len(path)}, length: {length:.3f}")
    for r, row in enumerate(grid):
        print("".join("*" if (r, c) in path else ch for c, ch in enumerate(row)))`, caption: "Grid A* with octile heuristic and no corner cutting. Cells are (row, column)." },
      { t: "p", text: "The goal sits inside a pocket open only at the bottom, so the path must go down the left side, along the bottom row and up into the pocket. The run gives 11 cells and length 11.243. Check: the path has 3 diagonal steps and 7 straight steps, so 3 × 1.414 + 7 = 4.243 + 7 = 11.243. The heuristic at the start was octile((0,0), (4,5)) = 5 + 0.414 × 4 = 6.657, below the true 11.243, as admissibility requires." },
      { t: "widget", id: "astar-grid" },
      { t: "note", kind: "tip", text: "Grid paths zigzag at 45° steps. Real planners smooth the result, or plan on a costmap where cost rises near obstacles so the path keeps to the middle of corridors." },

      { t: "h", text: "Sampling-based planners" },
      { t: "p", text: "Grids explode in high dimensions: a robot arm with 6 joints at 100 steps per joint has 10¹² cells. **Sampling-based** planners avoid building the grid. A **PRM** (probabilistic roadmap) samples random collision-free configurations, joins nearby pairs with collision-free straight lines, and searches the resulting graph. An **RRT** (rapidly exploring random tree) grows a tree from the start: sample a random point, find the nearest tree node, step towards the sample, add the new node if collision free. It explores large spaces quickly and handles kinematic constraints. **RRT*** rewires the tree as it grows, so the path converges to optimal as samples increase. They are **probabilistically complete**: if a path exists, the chance of finding it tends to one. For a 2D indoor robot grid search is usually better; sampling planners dominate in arm motion planning (MoveIt uses OMPL)." },

      { t: "h", text: "Local planning: the dynamic window approach" },
      { t: "p", text: "The **dynamic window approach** (DWA) chooses velocities directly. Each control cycle:" },
      { t: "list", ordered: true, items: [
        "Form the **dynamic window**: the (v, ω) pairs reachable in the next cycle given acceleration limits. With current v = 0.2 m/s, maximum acceleration 0.5 m/s² and a 0.2 s cycle, v can be anything from 0.1 to 0.3 m/s.",
        "Keep only **admissible** velocities: those from which the robot can still stop before the nearest obstacle on that arc, v ≤ √(2 · d_obstacle · a_brake). With 0.25 m clear and 0.5 m/s² braking, v must be at most √0.25 = 0.5 m/s.",
        "Simulate each candidate forward for 1 to 2 s as a circular arc and score it: G = α · heading + β · clearance + γ · speed (how well it points to the goal or path, distance to obstacles, and how fast).",
        "Send the best (v, ω) and repeat next cycle.",
      ] },
      { t: "p", text: "DWA respects the robot's dynamics and reacts to new obstacles immediately. Its weakness is short sightedness: scores are local, so it can get stuck in a U-shaped trap; the global path in the heading term prevents that. Nav2's **DWB** controller is a configurable descendant, with each scoring term a \"critic\" plugin." },

      { t: "h", text: "Pure pursuit" },
      { t: "p", text: "**Pure pursuit** is the simplest path follower that works well. Pick a **lookahead point** on the path a distance L ahead of the robot, and drive along the circular arc that passes through the robot's position, tangent to its heading, and through that point. Only one such arc exists, and its curvature has a neat formula. Put the lookahead point at (x, y) in the robot's frame (x forward, y left), with x² + y² = L²:" },
      { t: "formula", text: String.raw`κ = 2y / L²
ω = v · κ`, caption: "Pure pursuit curvature, derived in the Go deeper section." },
      { t: "p", text: "Worked example: lookahead point at (0.8, 0.3) m. L = √(0.64 + 0.09) = √0.73 = 0.854 m. κ = 2 × 0.3 / 0.73 = 0.822 m⁻¹, a turn radius of 1 / 0.822 = 1.217 m. At v = 0.5 m/s, ω = 0.5 × 0.822 = 0.411 rad/s to the left. Check: a point straight ahead (y = 0) gives κ = 0, drive straight; a point to the left gives positive κ, turn left. The lookahead L is the tuning knob: short L tracks tightly but oscillates; long L is smooth but cuts corners. A common rule is L proportional to speed." },

      { t: "h", text: "Regulated pure pursuit" },
      { t: "p", text: "Plain pure pursuit drives at constant speed into tight bends and right up to obstacles. **Regulated pure pursuit** (RPP, Macenski et al. 2023, the Nav2 controller of that name) adds speed regulation: it slows down when curvature is high (below a minimum turn radius, speed scales with R / r_min), slows when the costmap shows obstacles close to the path, slows on approach to the goal, and uses an adaptive lookahead L = v · t_lookahead clamped between limits. It can also rotate in place to face the path before setting off. It is a very good default for differential drive robots in tight indoor spaces." },

      { t: "deep", title: "Deriving the pure pursuit curvature", blocks: [
        { t: "p", text: "The arc starts at the robot, tangent to its heading (the x axis), so its centre lies on the y axis at (0, R), where R is the signed turn radius. The lookahead point (x, y) is on the circle, so its distance from the centre is R:" },
        { t: "formula", text: String.raw`x² + (y - R)² = R²
x² + y² - 2yR + R² = R²
x² + y² = 2yR
L² = 2yR
R = L² / (2y)
κ = 1 / R = 2y / L²`, caption: "Using x² + y² = L²." },
        { t: "p", text: "Writing y = L sin α, where α is the angle to the lookahead point, gives κ = 2 sin α / L, the form often quoted for car-like robots, where steering angle δ = atan(wheelbase · κ). The derivation also shows pure pursuit's limit: it guarantees the arc reaches the lookahead point, not that the path between is followed, which is why it cuts inside corners." },
      ] },
      { t: "deep", title: "Proof that A* with an admissible heuristic is optimal", blocks: [
        { t: "p", text: "Suppose A* pops the goal with cost g(G) greater than the optimal cost C*. Take the optimal path; some node n on it is still in the open set (the start was, and the goal on that path has not been popped by the optimal route). Because n is on an optimal path and all its predecessors were expanded optimally, g(n) equals the optimal cost to n, and admissibility gives f(n) = g(n) + h(n) ≤ C*." },
        { t: "p", text: "But A* pops the smallest f first, and it popped the goal with f(G) = g(G) + 0 > C* ≥ f(n). That contradicts the queue ordering, so g(G) = C*. The proof uses h only through h(n) ≤ true cost, which is why overestimating heuristics (\"weighted A*\", f = g + w·h with w > 1) return faster but possibly suboptimal paths, at most w times the optimal cost." },
      ] },
    ],
    mistakes: [
      "**Using Manhattan distance with diagonal moves.** It overestimates diagonal moves, so A* can return a longer path.",
      "**Planning for a point robot on an uninflated map.** The path then grazes walls the real robot cannot pass. Inflate obstacles by at least the robot radius.",
      "**Allowing diagonal moves that cut corners.** A diagonal between two occupied cells squeezes through a gap of zero width.",
      "**Too short a pure pursuit lookahead.** The robot weaves about the path. Increase L or make it scale with speed.",
      "**Getting the sign of y wrong.** In ROS y is to the left, so positive y gives positive κ and a left turn.",
    ],
    practice: {
      kind: "bench",
      task: "Experiment with A* and pure pursuit until their behaviour is predictable.",
      steps: [
        "Run the A* program. Add a counter for expanded nodes and compare with Dijkstra (make h return 0).",
        "Change to 4-connected moves with Manhattan distance and compare path length and expansions.",
        "Deliberately use Manhattan distance with 8-connected moves and find a grid where it returns a longer path.",
        "Write a pure pursuit simulator: a unicycle robot following the A* path converted to metres (0.05 m cells), with v = 0.3 m/s and Δt = 0.05 s. Plot the trajectory for L = 0.1, 0.3 and 0.6 m.",
        "Add RPP-style curvature regulation (scale v by R / r_min when R < r_min = 0.5 m) and compare the tracking error on the bends.",
      ],
    },
    quiz: [
      {
        q: "On an 8-connected grid with diagonal cost √2, what is the octile heuristic from (0, 0) to (3, 7)?",
        options: ["10", "7.62", "8.24", "7.0"],
        answer: 2,
        why: "max(3, 7) + (√2 - 1) × min(3, 7) = 7 + 0.414 × 3 = 8.24.",
      },
      {
        q: "Which heuristic is NOT admissible for an 8-connected grid with diagonal cost √2?",
        options: ["Euclidean distance", "Octile distance", "Zero", "Manhattan distance"],
        answer: 3,
        why: "One diagonal step costs 1.414 but Manhattan says 2, an overestimate.",
      },
      {
        q: "A pure pursuit lookahead point is at (1.0, 0.5) m in the robot frame. What is the curvature?",
        options: ["0.5 m⁻¹", "0.8 m⁻¹", "1.0 m⁻¹", "1.25 m⁻¹"],
        answer: 1,
        why: "L² = 1.0 + 0.25 = 1.25. κ = 2 × 0.5 / 1.25 = 0.8 m⁻¹.",
      },
      {
        q: "A robot moves at 0.4 m/s with acceleration limit 0.5 m/s² and a 0.2 s cycle. What is the linear velocity range of its dynamic window?",
        options: ["0 to 0.5 m/s", "0.3 to 0.5 m/s", "0.35 to 0.45 m/s", "0.4 m/s only"],
        answer: 1,
        why: "Δv = 0.5 × 0.2 = 0.1 m/s, so 0.3 to 0.5 m/s.",
      },
      {
        q: "What does regulated pure pursuit add to pure pursuit?",
        options: [
          "A global path planner",
          "Speed reduction on tight curves, near obstacles and near the goal, and adaptive lookahead",
          "A particle filter",
          "Obstacle inflation in the map",
        ],
        answer: 1,
        why: "RPP keeps the same geometry but regulates linear speed for safety and tracking.",
      },
      {
        q: "Why are sampling-based planners preferred for a 6-joint arm?",
        options: [
          "They always find the shortest path",
          "A grid over 6 dimensions has far too many cells; random sampling avoids building it",
          "Arms do not have obstacles",
          "They need no collision checking",
        ],
        answer: 1,
        why: "Grid size grows exponentially with dimension. Sampling planners only check the configurations they sample.",
      },
    ],
  },

  "a13-nav2-and-sensor-fusion-project": {
    id: "a13-nav2-and-sensor-fusion-project",
    outcomes: [
      "Explain the Nav2 architecture: lifecycle nodes, BT navigator, planner, controller and behaviour servers",
      "Configure global and local costmaps with static, obstacle and inflation layers, and compute an inflation cost",
      "Choose between NavFn, Smac, DWB, RPP and MPPI plugins for a given robot",
      "Fuse wheel odometry and IMU with robot_localization's EKF, and bring up a robot that maps and navigates",
    ],
    blocks: [
      { t: "h", text: "From algorithms to a working robot" },
      { t: "p", text: "You now know every algorithm a navigation stack needs. Writing them all yourself, with recovery from failures, would take months. **Nav2**, the ROS 2 navigation stack, packages them as configurable plugins, and it is what most indoor robots in industry run. This lesson uses **ROS 2 Lyrical Luth**, the 2026 LTS (supported to 2031), with Nav2 1.5; Jazzy (the 2024 LTS) has the same structure and almost the same parameters. The skill is no longer writing A*; it is understanding the configuration well enough to tune it and to debug it when the robot will not move." },

      { t: "h", text: "The architecture" },
      { t: "diagram", text: String.raw`        goal (RViz "Nav2 Goal" or NavigateToPose action)
                         │
                         ▼
               ┌───────────────────┐
               │   bt_navigator    │  runs a behaviour tree
               └───────┬───────────┘
        ┌──────────────┼─────────────────┐
        ▼              ▼                 ▼
 ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
 │planner_srv  │ │controller_srv│ │behavior_server│
 │global path  │ │cmd_vel 20 Hz │ │spin, backup,  │
 │global cost- │ │local costmap │ │wait, drive on │
 │map          │ │              │ │heading        │
 └──────┬──────┘ └──────┬───────┘ └───────────────┘
        │               │
   map_server + AMCL (or slam_toolbox), odometry, /scan, TF`, caption: "Nav2 servers. Each is a lifecycle node holding plugins." },
      { t: "p", text: "Each server exposes ROS 2 **actions** (ComputePathToPose, FollowPath, Spin and so on). The **BT navigator** strings them together with a **behaviour tree**. The default tree for NavigateToPose replans the path at about 1 Hz, follows it with the controller, and if something fails, runs a recovery sequence (clear the costmaps, spin, wait, back up) and tries again a few times before reporting failure. Behaviour trees are XML; you can add your own nodes, for example \"stop and wait at a door\"." },
      { t: "p", text: "All Nav2 servers are **lifecycle nodes**. A lifecycle node starts **unconfigured**; `configure` makes it read parameters and allocate resources (**inactive**); `activate` starts it publishing and processing (**active**); `deactivate` and `cleanup` reverse this. The `lifecycle_manager` brings the servers up in order and keeps a heartbeat (bond) with each; if one dies, it brings the system down safely rather than leaving a controller driving with a dead planner. When Nav2 \"does nothing\", the first check is whether every server reached active." },

      { t: "h", text: "Costmaps and layers" },
      { t: "p", text: "Nav2 plans on **costmaps**: grids where each cell has a cost from 0 (free) to 254 (lethal: the robot centre in that cell means collision), with 253 meaning inscribed (the robot's footprint would touch an obstacle) and 255 unknown. A costmap is built by stacking **layers**:" },
      { t: "list", items: [
        "**StaticLayer** (`nav2_costmap_2d::StaticLayer`): the saved map from map_server or SLAM.",
        "**ObstacleLayer**: marks obstacles from live LiDAR scans and clears free space by ray tracing, the log-odds idea simplified. **VoxelLayer** does the same in 3D for depth cameras.",
        "**InflationLayer**: spreads cost outwards from every obstacle so paths keep a margin.",
      ] },
      { t: "p", text: "There are two costmaps. The **global costmap** covers the whole map (static, obstacle and inflation layers in the default configuration) for the planner. The **local costmap** is a small rolling window, for example 3 m × 3 m centred on the robot, updated fast from sensors (voxel and inflation layers by default) for the controller." },
      { t: "formula", text: String.raw`cost(d) = 252 · e^(-k · (d - r_inscribed))     for r_inscribed < d ≤ inflation_radius

k = cost_scaling_factor = 3.0, r_inscribed = 0.22 m:
d = 0.50 m:  252 · e^(-0.84) = 252 × 0.432 ≈ 109
d = 0.70 m:  252 · e^(-1.44) = 252 × 0.237 ≈ 60`, caption: "Inflation cost as a function of distance d from the nearest obstacle. Beyond inflation_radius cost is 0." },
      { t: "p", text: "The defaults shipped in `nav2_params.yaml` are `inflation_radius: 0.7` and `cost_scaling_factor: 3.0` with `robot_radius: 0.22` (a TurtleBot). Set `robot_radius`, or a `footprint` polygon, to your robot. A higher cost_scaling_factor makes cost fall off faster, letting the robot pass closer to walls; a lower one keeps it centred in corridors. If the robot refuses to go through a doorway, the inflated costs on both sides have probably met in the middle: inflation radius too large or scaling factor too small for that door." },

      { t: "h", text: "Choosing planners and controllers" },
      { t: "table", head: ["Plugin", "Kind", "Use it when"], rows: [
        ["`nav2_navfn_planner::NavfnPlanner`", "Global: Dijkstra or A* on the costmap", "Circular differential drive robot; the default"],
        ["`nav2_smac_planner::SmacPlanner2D`", "Global: A* on a 2D grid", "Like NavFn but more tunable, with smoother paths"],
        ["`nav2_smac_planner::SmacPlannerHybrid`", "Global: Hybrid A* with Dubins or Reeds-Shepp motions", "Car-like robots that cannot turn in place"],
        ["`dwb_core::DWBLocalPlanner`", "Controller: DWA with critic plugins", "When you want full control over scoring terms"],
        ["`nav2_regulated_pure_pursuit_controller::RegulatedPurePursuitController`", "Controller: regulated pure pursuit", "Simple, predictable path following indoors"],
        ["`nav2_mppi_controller::MPPIController`", "Controller: model predictive path integral", "The default in current releases; smooth, handles dynamics, needs more CPU"],
      ], caption: "Plugin names as in the Jazzy and Lyrical nav2_params.yaml." },
      { t: "p", text: "**MPPI** samples thousands of noisy control sequences over a short horizon, simulates each with a motion model, scores them with critics (path following, obstacle cost, goal) and takes a cost-weighted average. It runs comfortably on a Pi 5 class computer at modest settings. On a slow single-board computer, RPP is a lighter alternative." },

      { t: "h", text: "Localisation in Nav2" },
      { t: "p", text: "For navigation in a saved map, launch `map_server` (serves the PGM and YAML on `/map`) and **AMCL** (the particle filter from lesson 1, `robot_model_type: nav2_amcl::DifferentialMotionModel`, `laser_model_type: likelihood_field`). AMCL publishes `map` to `odom`. Set the initial pose in RViz with \"2D Pose Estimate\" and watch the particle cloud (`/particle_cloud`) shrink as the robot moves. Alternatively run slam_toolbox in mapping mode alongside Nav2 and navigate while you map." },

      { t: "h", text: "Better odometry: fusing wheels and IMU" },
      { t: "p", text: "Everything above assumes the `odom` to `base_link` transform is decent. Wheel odometry alone is poor at heading: wheel slip on a turn or an uneven floor gives heading errors that ruin AMCL and SLAM. A cheap gyroscope measures yaw rate directly and does not slip. The **robot_localization** package's `ekf_node` fuses them with an extended Kalman filter (a9) over a 15 dimensional state: position, orientation, linear and angular velocity, linear acceleration. You choose, per sensor, which of those 15 quantities it measures with a boolean vector, in the fixed order x, y, z, roll, pitch, yaw, vx, vy, vz, vroll, vpitch, vyaw, ax, ay, az." },
      { t: "snippet", lang: "yaml", code: String.raw`ekf_filter_node:
  ros__parameters:
    frequency: 30.0
    two_d_mode: true              # planar robot: ignore z, roll, pitch
    publish_tf: true              # publish odom -> base_link
    map_frame: map
    odom_frame: odom
    base_link_frame: base_link
    world_frame: odom             # this EKF produces continuous odometry

    # Wheel odometry: trust forward velocity and yaw rate, not integrated pose.
    odom0: /wheel/odometry
    odom0_config: [false, false, false,
                   false, false, false,
                   true,  true,  false,
                   false, false, true,
                   false, false, false]
    odom0_differential: false

    # IMU: yaw rate from the gyro. Indoors the magnetometer is unreliable,
    # so absolute yaw is not fused.
    imu0: /imu/data
    imu0_config: [false, false, false,
                  false, false, false,
                  false, false, false,
                  false, false, true,
                  false, false, false]
    imu0_remove_gravitational_acceleration: true`, caption: "robot_localization EKF fusing wheel odometry (vx, vy, vyaw) and IMU (vyaw). vy is fused as a zero for a non-holonomic robot." },
      { t: "p", text: "Fusing velocities rather than poses is deliberate. Two sensors that each integrate their own position disagree more and more over time, and the filter would see them as contradicting each other. Velocities are independent measurements that the EKF integrates once. Because the EKF now publishes `odom` to `base_link`, you must turn off the TF your wheel driver publishes (for ros2_control's diff_drive_controller, `enable_odom_tf: false`), or two nodes fight over one transform. Also make sure each message's covariance fields are filled with realistic numbers: the EKF weighs sensors by them, and a covariance of zero tells it a sensor is perfect." },
      { t: "p", text: "Worked check of why the gyro helps: wheel odometry heading error from slip might be 2% of rotation, so after ten full turns (62.8 rad) heading is off by about 1.26 rad, 72°. A MEMS gyro with a bias of 0.01 °/s after calibration drifts 0.6° per minute. Over a five minute mapping run that is 3°, much better. The magnetometer could correct the remaining drift outdoors, but steel in buildings and motor currents distort it." },

      { t: "h", text: "Exit project: map a room and navigate between goals" },
      { t: "snippet", lang: "bash", code: String.raw`# 1. Robot bring-up: base driver, LiDAR, IMU, robot_state_publisher (URDF)
ros2 launch my_robot bringup.launch.py

# 2. Sensor fusion
ros2 run robot_localization ekf_node --ros-args --params-file ekf.yaml

# 3a. First run: map while navigating
ros2 launch nav2_bringup navigation_launch.py params_file:=nav2_params.yaml
ros2 launch slam_toolbox online_async_launch.py
ros2 run nav2_map_server map_saver_cli -f ~/maps/lab

# 3b. Later runs: localise in the saved map
ros2 launch nav2_bringup bringup_launch.py map:=$HOME/maps/lab.yaml params_file:=nav2_params.yaml

# 4. RViz with the Nav2 panel: set "2D Pose Estimate", then "Nav2 Goal"
ros2 launch nav2_bringup rviz_launch.py`, caption: "The bring-up sequence. Copy nav2_params.yaml from nav2_bringup/params and edit robot_radius, speeds and frames." },
      { t: "p", text: "To visit several goals in turn, use the `nav2_simple_commander` Python API (`BasicNavigator`, with `goThroughPoses` or `followWaypoints`) or the waypoint follower server. Test in Gazebo with a TurtleBot model first; the same parameter file then needs only your robot's footprint, speed limits and topic names. One version detail: from Kilted onwards (so on Lyrical) Nav2 publishes `cmd_vel` as `geometry_msgs/TwistStamped` by default (`enable_stamped_cmd_vel: true`), which is what ros2_control's diff_drive_controller expects; on Jazzy the default is plain `Twist`, so a base driver that subscribes to `Twist` needs that parameter set to false." },
      { t: "note", kind: "safety", text: "Set conservative speed limits (for example 0.25 m/s and 1.0 rad/s in the controller) for the first runs, keep people out of the test area, and have a physical emergency stop that cuts motor power independently of the computer." },

      { t: "deep", title: "Inside the default navigation behaviour tree", blocks: [
        { t: "p", text: "A behaviour tree ticks from the root many times a second. **Sequence** nodes run children left to right and fail if one fails; **Fallback** nodes try children until one succeeds; **Decorators** such as RateController limit how often a child runs; **Recovery** nodes retry a child after running a recovery branch, up to a count." },
        { t: "snippet", lang: "xml", code: String.raw`<root BTCPP_format="4" main_tree_to_execute="MainTree">
  <BehaviorTree ID="MainTree">
    <RecoveryNode number_of_retries="6" name="NavigateRecovery">
      <PipelineSequence name="NavigateWithReplanning">
        <RateController hz="1.0">
          <ComputePathToPose goal="{goal}" path="{path}" planner_id="GridBased"/>
        </RateController>
        <FollowPath path="{path}" controller_id="FollowPath"/>
      </PipelineSequence>
      <Sequence name="RecoveryActions">
        <ClearEntireCostmap service_name="local_costmap/clear_entirely_local_costmap"/>
        <Spin spin_dist="1.57"/>
        <Wait wait_duration="5.0"/>
        <BackUp backup_dist="0.30" backup_speed="0.05"/>
      </Sequence>
    </RecoveryNode>
  </BehaviorTree>
</root>`, caption: "A simplified version of navigate_to_pose_w_replanning_and_recovery.xml. Values such as {goal} live on the shared blackboard." },
        { t: "p", text: "PipelineSequence keeps earlier children ticking while later ones run, so replanning continues while the controller follows the latest path. The real default tree also has contextual recoveries (clear only the costmap of the failing server first) and a round-robin through recovery actions." },
      ] },
      { t: "deep", title: "Covariance tuning and the two-EKF pattern", blocks: [
        { t: "p", text: "The EKF's process noise covariance (`process_noise_covariance`, 15 × 15) says how much the state can change unpredictably between updates. Too small and the filter ignores measurements and lags; too large and it follows noise. Tune the diagonal for vx and vyaw first while watching the fused odometry track a known motion (drive 2 m straight, turn 360°)." },
        { t: "p", text: "Robots with GPS outdoors use **two** EKFs: one with `world_frame: odom` fusing only continuous sensors (wheels, IMU), publishing `odom` to `base_link`; and one with `world_frame: map` that also fuses GPS (through `navsat_transform_node`), publishing `map` to `odom`. This mirrors the AMCL arrangement indoors: the odom frame stays smooth for control, and the map frame absorbs the jumps from absolute corrections." },
      ] },
    ],
    mistakes: [
      "**Not all lifecycle nodes active.** If one server fails to configure (often a bad parameter or missing TF), Nav2 never starts. Read the lifecycle_manager log first.",
      "**Wrong robot_radius or footprint.** Too small and the robot scrapes walls; too large and it refuses doorways.",
      "**Two publishers of odom to base_link.** When the EKF publishes TF, disable the wheel driver's TF.",
      "**Zero covariances on sensor messages.** The EKF then treats the sensor as perfect and the fusion misbehaves.",
      "**Fusing absolute yaw from a magnetometer indoors.** Steel and motor currents distort it; fuse gyro yaw rate instead.",
      "**Forgetting the initial pose.** AMCL starts at the origin unless you set it, and the robot plans from the wrong place.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: an autonomous indoor robot that maps a room and navigates between goals.",
      steps: [
        "Bring up the robot with LiDAR, wheel odometry and IMU. Configure robot_localization with the YAML above and verify with `ros2 run tf2_tools view_frames` that exactly one node publishes odom to base_link.",
        "Drive a 2 m square with teleop and compare wheel-only and fused odometry against tape marks on the floor.",
        "Map the room with slam_toolbox and save it.",
        "Launch Nav2 with your saved map, set robot_radius and speed limits, and set the initial pose. Send single goals from RViz and note any failures and which recovery ran.",
        "Write a nav2_simple_commander script that visits three waypoints in a loop five times. Record success rate and average time per lap, then tune inflation and the controller to improve one of them.",
      ],
    },
    quiz: [
      {
        q: "With cost_scaling_factor 3.0 and inscribed radius 0.22 m, what is the inflation cost 0.32 m from an obstacle?",
        options: ["About 252", "About 187", "About 109", "0"],
        answer: 1,
        why: "252 × e^(-3 × 0.10) = 252 × 0.741 ≈ 187.",
      },
      {
        q: "Your robot will not drive through a doorway that is physically wide enough. What is the most likely configuration cause?",
        options: [
          "The AMCL particle count is too low",
          "Inflation from both sides of the door has filled the gap with high cost",
          "The behaviour tree is missing a Spin node",
          "The EKF frequency is too high",
        ],
        answer: 1,
        why: "Too large an inflation radius or too small a scaling factor makes the doorway's cost too high for the planner.",
      },
      {
        q: "In a robot_localization config vector, which position is vyaw (yaw rate)?",
        options: ["6th", "9th", "12th", "15th"],
        answer: 2,
        why: "Order: x, y, z, roll, pitch, yaw, vx, vy, vz, vroll, vpitch, vyaw, ax, ay, az. vyaw is 12th.",
      },
      {
        q: "Why fuse the wheel odometry's velocities rather than its integrated pose together with the IMU?",
        options: [
          "Velocities are smaller numbers",
          "Integrated poses from different sensors drift apart and appear to contradict each other; velocities are independent measurements the EKF integrates once",
          "The EKF cannot accept poses",
          "Poses are not published by wheel drivers",
        ],
        answer: 1,
        why: "Each integrated pose carries its own accumulated drift, so fusing velocities gives consistent updates.",
      },
      {
        q: "What does the Nav2 lifecycle manager do if a server it manages dies?",
        options: [
          "Ignores it",
          "Restarts the robot's computer",
          "Detects the broken bond and brings the system down safely",
          "Switches to a different map",
        ],
        answer: 2,
        why: "It keeps a heartbeat bond with each server so a dead server stops navigation rather than leaving parts running.",
      },
      {
        q: "Which controller would you choose for a car-like robot that cannot turn in place, paired with which planner?",
        options: [
          "RPP with NavFn",
          "MPPI with SmacPlannerHybrid",
          "DWB with SmacPlanner2D",
          "Any controller with NavFn",
        ],
        answer: 1,
        why: "Hybrid A* plans paths a car can drive; MPPI can follow them with an Ackermann motion model.",
      },
    ],
  },
};

export default lessons;
