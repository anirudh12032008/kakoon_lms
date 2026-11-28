import type { ModuleContent } from "../model/curriculum";

/**
 * Module a14: Manipulation and motion planning.
 * ROS material targets ROS 2 Lyrical Luth (2026 LTS, Ubuntu 26.04) with MoveIt 2
 * (2.15.x binaries released for Lyrical); the same steps work on Jazzy.
 */
const lessons: ModuleContent = {
  "a14-configuration-space-collision": {
    id: "a14-configuration-space-collision",
    outcomes: [
      "Define configuration space and explain why planning happens there, not in the workspace",
      "Map a workspace obstacle into C-space obstacles for a simple arm",
      "Describe how collision checking works: geometry, broad phase, narrow phase, padding",
      "Check a path segment for collisions at a resolution you can justify",
    ],
    blocks: [
      { t: "h", text: "Why plan in configuration space" },
      { t: "p", text: "An arm that solves IK for a grasp pose still has to get there without hitting the table, the box next to the part, or itself. In the workspace (the 3D room) that question is awkward: the arm is a chain of oddly shaped links, and \"move from here to there\" is not a single point moving. The trick that makes motion planning tractable is to change spaces. Describe the whole robot by its joint vector q. Every q is a single point in **configuration space (C-space)**, and the arm moving is that point tracing a curve. Planning becomes: find a curve for a point from q_start to q_goal that stays in the free region." },
      { t: "p", text: "C-space has as many dimensions as the robot has DOF. A 2R arm lives in 2D (θ1, θ2), and because angles wrap, that space is really a torus: θ = 180° and θ = -180° are the same place. A 6-DOF arm lives in 6D, a differential-drive robot in 3D (x, y, θ). The set of configurations where the robot touches an obstacle or itself is **C_obs**; the rest is **C_free**." },

      { t: "h", text: "Building a C-space obstacle by hand" },
      { t: "p", text: "Take a planar 2R arm with L1 = L2 = 1 and a small round post at (1.2, 0.8). For each (θ1, θ2) on a grid, compute where both links are (FK) and ask: does either link segment pass within the post's radius? Mark the cell black if so. The result is a strange blob in the (θ1, θ2) square, nothing like the round post. Two lessons from doing this once:" },
      { t: "list", items: [
        "**Simple workspace obstacles become complicated C-space shapes**, so nobody computes C_obs explicitly in more than 2 or 3 dimensions. Instead planners ask a yes/no question, \"is this q free?\", one sample at a time. That question is the collision checker.",
        "**Self-collision is part of C_obs too**: some (θ1, θ2) fold link 2 back through link 1 or the base. A desktop arm with servos stacked on links has self-collision regions near θ3 = ±150°.",
      ] },
      { t: "diagram", text: String.raw`
 θ2 (deg)
 180 ┤ . . . . . . . . . . . . . . . .
     ┤ . . . . . . . . ### . . . . . .
  90 ┤ . . . . . . . ####### . . . . .
     ┤ . . . . . . . ######## . . . .
   0 ┤ . . . . . . . . ##### . . . . .     # = arm touches post
     ┤ . . . . . . . . . ## . . . . . .     . = free
 -90 ┤ . . . . . . . . . . . . . . . .
     ┤ . . . . . . . . . . . . . . . .
-180 ┼────────────────────────────────────
    -180        -90     0     90       180   θ1 (deg)`, caption: "Sketch of a C-space obstacle for a 2R arm and one round post. Real shapes are computed point by point." },

      { t: "h", text: "How a collision checker works" },
      { t: "p", text: "A collision checker takes a configuration, runs FK to place every link's geometry in the world, and tests every relevant pair of shapes for overlap. Doing this fast is an engineering subject of its own; MoveIt uses the Flexible Collision Library (FCL) by default. The pieces:" },
      { t: "list", ordered: true, items: [
        "**Geometry**: each link has a collision shape, separate from its visual mesh. Simple primitives (box, cylinder, sphere, capsule) are fastest; convex hulls next; raw triangle meshes slowest. Good robot descriptions use primitives or simplified convex meshes for collision.",
        "**Broad phase**: cheap bounding volumes (axis-aligned boxes or spheres around each shape) quickly discard pairs that are far apart. Most pairs end here.",
        "**Narrow phase**: an exact test on the remaining pairs, such as the GJK algorithm for convex shapes, which can also return the distance between them.",
        "**Allowed collision matrix (ACM)**: pairs that can never collide, or always touch (adjacent links at the joint), are skipped. MoveIt Setup Assistant generates this by sampling random configurations: pairs that collide in every sample are adjacent or always touching; pairs that never collide can be disabled.",
        "**Padding**: inflate shapes by a few millimetres (MoveIt's default link padding is configurable) so that model error and servo backlash do not turn a near miss into a hit.",
      ] },

      { t: "h", text: "Checking a path, not just a point" },
      { t: "p", text: "A planner connects configurations with straight segments in C-space (joint-space interpolation). Checking the two endpoints is not enough: the segment could sweep through a thin obstacle. The usual method is to check intermediate configurations at a fixed resolution. How fine? Fine enough that no point on the robot moves farther than the smallest obstacle or padding between checks." },
      { t: "formula", text: String.raw`max tip displacement per check  ≤  Σ_i (r_i · |Δθ_i|)

r_i = distance from joint i to the farthest point of the arm beyond it

Example: 4-servo arm, r = (0.30, 0.30, 0.18, 0.06) m for joints 1 to 4.
Want ≤ 5 mm per check with all joints moving equally:
Δθ ≤ 0.005 / (0.30 + 0.30 + 0.18 + 0.06) = 0.005 / 0.84 = 0.00595 rad ≈ 0.34°`, caption: "A conservative bound: each joint's motion moves the far points of the arm by at most r × Δθ." },
      { t: "p", text: "So a segment where the largest joint change is 60° needs about 60 / 0.34 ≈ 176 checks. Check: 176 × 0.34° = 59.8°, close to 60°, so round up to 177. MoveIt exposes this as `longest_valid_segment_fraction` in OMPL's configuration, a fraction of the C-space extent, so that one number controls the resolution for every segment. Making it coarser speeds up planning but risks clipping thin objects; making it finer is safe but slow." },
      { t: "p", text: "Order of checks matters for speed: test the segment's midpoint first, then the quarter points, and so on (bisection order). A colliding segment is usually caught in the first few checks, and you do not waste time walking from one end." },

      { t: "h", text: "Where obstacles come from" },
      { t: "p", text: "Obstacles reach the checker in two ways. **Known geometry**: the table, walls and fixtures you measured, added as primitives in the robot's frame. **Sensed geometry**: a depth camera's point cloud, turned into an occupancy map (MoveIt uses an OctoMap of small voxels). Sensed geometry is noisy and includes the robot itself, so a self-filter removes points that fall on the robot's own links before building the map. For a small teaching arm, known geometry is usually enough: the table, a box for the camera stand, and the objects you will pick." },

      { t: "deep", title: "C-space obstacles for a point robot: the Minkowski sum", blocks: [
        { t: "p", text: "For a robot that only translates (a disc or polygon moving in the plane), C_obs has a clean description: it is the obstacle grown by the robot's shape reflected through its reference point, the Minkowski sum O ⊕ (-A). A disc robot of radius r turns every obstacle into the obstacle inflated by r, which is exactly what costmap inflation does in Nav2. For convex polygons the sum is a convex polygon computable in linear time by merging edge lists sorted by angle." },
        { t: "p", text: "Rotation breaks this simplicity: a polygonal robot that can also rotate has a 3D C-space, and each slice at fixed θ is a different Minkowski sum. With joints, link shapes sweep along curves and no closed form exists. That is the historical reason sampling-based planners, which never build C_obs, took over in the late 1990s." },
      ] },
      { t: "deep", title: "Distance queries and continuous collision checking", blocks: [
        { t: "p", text: "Discrete checking at a resolution can still miss thin, fast-crossing contacts. Two refinements are used. **Distance-based stepping**: FCL can return the minimum distance d between the robot and the world. If no point of the arm can move more than d before the next check, you can safely jump ahead by that much, taking big steps in open space and small ones near obstacles." },
        { t: "p", text: "**Continuous collision detection (CCD)** treats the motion between two configurations as a swept volume and tests it directly, giving an exact answer for linear motion of convex shapes. It is standard in physics engines and is available in FCL, but for articulated arms the swept shapes are not convex and it is approximated, so most motion planners stick with dense discrete checks plus padding." },
      ] },
    ],
    mistakes: [
      "**Planning in the workspace** with a single point for the gripper and forgetting the rest of the arm can hit things.",
      "**Using detailed visual meshes for collision.** Checking is then slow and planning times out. Use primitives or convex hulls.",
      "**Only checking the endpoints of a segment.** A thin obstacle between them is missed. Check intermediate points at a justified resolution.",
      "**Zero padding.** Calibration and backlash errors of a few millimetres turn planned near misses into real collisions.",
      "**Forgetting angle wrap-around.** In C-space θ = 179° and θ = -179° are 2° apart, not 358°, unless a joint limit forbids passing through 180°.",
    ],
    practice: {
      kind: "bench",
      task: "Compute and draw the C-space of a 2R arm with one obstacle.",
      steps: [
        "In Python, write FK for a 2R arm with L1 = L2 = 1 and a function that returns the distance from a point to a line segment.",
        "Sweep θ1 and θ2 from -180° to 180° in 2° steps and mark each configuration as colliding if either link comes within 0.2 of a post at (1.2, 0.8). Print the grid as characters, or plot it.",
        "Pick two free configurations on opposite sides of the blob. Check the straight joint-space segment between them at 1° resolution and report whether it collides.",
        "Move the post to (0.3, 0.2) and explain why the C-space obstacle grows so much larger.",
      ],
    },
    quiz: [
      {
        q: "What is a point in the configuration space of a 4-DOF arm?",
        options: [
          "A position of the gripper in 3D",
          "A complete set of four joint values, which fixes where every part of the arm is",
          "A single link's orientation",
          "An obstacle's position",
        ],
        answer: 1,
        why: "C-space coordinates are the joint values. One point specifies the whole arm.",
      },
      {
        q: "Why do practical planners not compute the C-space obstacle region explicitly for a 6-DOF arm?",
        options: [
          "Because 6-DOF arms cannot collide",
          "Because C-space is always 2D",
          "Because in 6 dimensions the region's shape is far too complex; planners instead query a collision checker at sampled configurations",
          "Because obstacles do not exist in C-space",
        ],
        answer: 2,
        why: "Even a round post becomes a complex blob in a 2D C-space; in 6D explicit construction is hopeless. Sampling plus a yes/no checker avoids it.",
      },
      {
        q: "What does the broad phase of a collision checker do?",
        options: [
          "Discards pairs of shapes whose cheap bounding volumes do not overlap, before exact tests",
          "Computes the exact contact point",
          "Generates the robot's URDF",
          "Removes the robot from the point cloud",
        ],
        answer: 0,
        why: "Bounding-volume tests are cheap and rule out most pairs; only the survivors go to the exact narrow-phase test.",
      },
      {
        q: "All joints of an arm move equally between checks. The farthest point beyond each joint is (0.4, 0.3, 0.1) m from joints 1 to 3. What joint step keeps motion under 4 mm per check?",
        options: ["0.05 rad", "0.0005 rad", "0.04 rad", "0.005 rad"],
        answer: 3,
        why: "Δθ ≤ 0.004 / (0.4 + 0.3 + 0.1) = 0.004 / 0.8 = 0.005 rad.",
      },
      {
        q: "Why is the allowed collision matrix useful?",
        options: [
          "It lets the arm pass through obstacles",
          "It skips checks for pairs that are always in contact (adjacent links) or can never collide, saving time and avoiding false collisions",
          "It stores the obstacle positions",
          "It sets the planning time limit",
        ],
        answer: 1,
        why: "Adjacent links touch at their joint in every configuration. Without the ACM every configuration would report a collision.",
      },
    ],
  },

  "a14-sampling-based-planning": {
    id: "a14-sampling-based-planning",
    outcomes: [
      "Explain why sampling-based planners suit high-dimensional C-spaces",
      "Write pseudocode for RRT, RRT-Connect and PRM, and say when each is the right choice",
      "Run and modify a small pure-Python RRT in 2D",
      "Explain probabilistic completeness, why raw RRT paths are poor, and how shortcutting and RRT* fix that",
    ],
    blocks: [
      { t: "h", text: "Why sample" },
      { t: "p", text: "Grid search (A* over a discretised C-space) is complete and optimal at its resolution, and it is what mobile robots use on a 2D map. For an arm it collapses: 6 joints at 1° resolution is 360⁶ ≈ 2 × 10¹⁵ cells. Sampling-based planners never build that grid. They pick random configurations, keep the ones the collision checker says are free, and connect them with short checked segments. They give up guaranteed optimality and exact completeness in exchange for working in 6 or 7 dimensions in a fraction of a second, which is why every MoveIt planner you use by default is one of them." },
      { t: "p", text: "Their guarantee is **probabilistic completeness**: if a solution exists, the probability of finding it approaches 1 as the number of samples grows. They cannot prove that no path exists; if planning fails after the time limit, the goal may be blocked or the passage may just be narrow." },

      { t: "h", text: "RRT: the rapidly-exploring random tree" },
      { t: "snippet", lang: "text", code: String.raw`RRT(q_start, q_goal):
    tree = {q_start}
    repeat N times:
        q_rand = goal with probability p_goal, else a uniform random sample
        q_near = nearest node in tree to q_rand
        q_new  = step from q_near towards q_rand by at most STEP
        if segment(q_near, q_new) is collision free:
            add q_new to tree with parent q_near
            if q_new is within STEP of q_goal and segment(q_new, q_goal) is free:
                return path from q_start to q_goal by following parents
    return failure`, caption: "RRT pseudocode." },
      { t: "p", text: "The key property is the **Voronoi bias**: a random sample is most likely to land in a large empty region, and the node nearest to it is on the frontier facing that region. So the tree is pulled outwards into unexplored space rapidly, instead of thickening around the start. The small **goal bias** (5% of samples are the goal itself) makes it try to finish whenever it can, without becoming a greedy planner that gets stuck behind obstacles." },
      { t: "p", text: "Here is a complete RRT for a disc robot of radius 0.2 among three round obstacles in a 10 by 10 square. It is pure Python and deterministic (fixed seed), so you get the same answer as below:" },
      { t: "snippet", lang: "python", code: String.raw`import math, random

OBSTACLES = [(5.0, 5.0, 1.5), (3.0, 7.5, 1.0), (7.5, 2.5, 1.0)]  # (cx, cy, radius)
BOUNDS = (0.0, 10.0)
STEP = 0.5          # how far the tree grows per iteration
GOAL_BIAS = 0.05    # fraction of samples that are the goal itself
ROBOT_R = 0.2       # point robot inflated to a disc

def free(p):
    return all(math.dist(p, (cx, cy)) > r + ROBOT_R for cx, cy, r in OBSTACLES)

def edge_free(a, b, res=0.05):
    n = max(1, int(math.dist(a, b) / res))
    return all(free((a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n))
               for i in range(n + 1))

def steer(a, b):
    d = math.dist(a, b)
    if d <= STEP:
        return b
    return (a[0] + (b[0] - a[0]) * STEP / d, a[1] + (b[1] - a[1]) * STEP / d)

def rrt(start, goal, iters=5000, seed=1):
    rng = random.Random(seed)
    nodes, parent = [start], {0: None}
    for _ in range(iters):
        sample = goal if rng.random() < GOAL_BIAS else (rng.uniform(*BOUNDS), rng.uniform(*BOUNDS))
        i_near = min(range(len(nodes)), key=lambda i: math.dist(nodes[i], sample))  # O(n) scan; use a k-d tree for big trees
        new = steer(nodes[i_near], sample)
        if not edge_free(nodes[i_near], new):
            continue
        nodes.append(new)
        parent[len(nodes) - 1] = i_near
        if math.dist(new, goal) < STEP and edge_free(new, goal):
            nodes.append(goal)
            parent[len(nodes) - 1] = len(nodes) - 2
            path, i = [], len(nodes) - 1
            while i is not None:
                path.append(nodes[i])
                i = parent[i]
            return path[::-1], len(nodes)
    return None, len(nodes)

if __name__ == "__main__":
    path, n = rrt((1.0, 1.0), (9.0, 9.0))
    assert path, "no path found"
    assert all(edge_free(a, b) for a, b in zip(path, path[1:]))
    length = sum(math.dist(a, b) for a, b in zip(path, path[1:]))
    print(f"tree nodes: {n}, path waypoints: {len(path)}, length: {length:.2f}")
    print(f"straight-line distance: {math.dist((1, 1), (9, 9)):.2f}")
# tree nodes: 61, path waypoints: 28, length: 13.22
# straight-line distance: 11.31`, caption: "Run with python3. The final assert re-checks every path segment independently of the planner." },
      { t: "p", text: "The path is 13.22 long against 11.31 for the straight line, 17% longer, and it zigzags: 28 waypoints for a route that needs about three. That is typical. RRT finds a path, not a good path. The exact numbers depend on the random seed; change it and you get a different tree and a different path. For an arm, replace the 2D point with a joint vector, `math.dist` with a joint-space distance (with angle wrap-around), and `free` with the arm's collision checker. Nothing else changes, which is the elegance of the method." },

      { t: "h", text: "RRT-Connect" },
      { t: "p", text: "**RRT-Connect** (Kuffner and LaValle, 2000) grows two trees, one from the start and one from the goal. Each iteration extends one tree towards a random sample, then tries to **connect** the other tree to the new node by stepping greedily towards it until it is reached or blocked. Then the trees swap roles. In open spaces the trees meet within a few iterations, and it is usually an order of magnitude faster than single-tree RRT. It is the default planner in MoveIt's OMPL configuration (`RRTConnectkConfigDefault`) for exactly that reason." },
      { t: "snippet", lang: "text", code: String.raw`RRT-Connect(q_start, q_goal):
    Ta = {q_start};  Tb = {q_goal}
    repeat N times:
        q_new = EXTEND(Ta, random sample)               # one step, as in RRT
        if q_new was added:
            if CONNECT(Tb, q_new) reaches q_new:         # step repeatedly while free
                return path(Ta root → q_new) + path(q_new → Tb root)
        swap(Ta, Tb)
    return failure`, caption: "Two trees and a greedy connect step." },

      { t: "h", text: "PRM: the probabilistic roadmap" },
      { t: "p", text: "**PRM** (Kavraki and others, 1996) splits planning in two. In a **learning phase**, sample many free configurations and connect each to its k nearest neighbours with collision-checked segments, building a graph (the roadmap). In a **query phase**, connect the start and goal to the roadmap and run Dijkstra or A* over it. The expensive part is done once and reused, so PRM suits a fixed workcell where the arm makes many queries among the same obstacles. When the environment changes (a box is moved), affected edges must be rechecked, which is why single-query tree planners are preferred for changing scenes." },
      { t: "snippet", lang: "text", code: String.raw`PRM build(n, k):
    V = n random free configurations
    for each q in V:
        for each q' among the k nearest neighbours of q:
            if segment(q, q') is free: add edge (q, q') with cost |q - q'|
PRM query(q_start, q_goal):
    connect q_start and q_goal to nearby roadmap nodes by free segments
    return shortest path in graph (Dijkstra or A*)`, caption: "Multi-query planning." },
      { t: "table", head: ["Planner", "Queries", "Strength", "Weakness"], rows: [
        ["RRT", "single", "simple, handles constraints and dynamics", "slow to finish, jagged paths"],
        ["RRT-Connect", "single", "very fast for start-to-goal arm moves", "jagged paths, needs smoothing"],
        ["PRM", "multiple", "reuse a roadmap in a fixed workcell", "slow to build, stale if the scene changes"],
        ["RRT* / PRM*", "single / multiple", "asymptotically optimal: path cost improves with time", "slower; uses the whole time budget"],
      ], caption: "Choosing a sampling planner." },

      { t: "h", text: "Making paths usable: shortcutting and smoothing" },
      { t: "p", text: "Raw sampled paths are always post-processed. **Shortcutting**: pick two random waypoints on the path; if the straight segment between them is collision-free, delete everything in between. A few hundred tries removes most of the zigzag. Then **time parameterisation** turns the geometric path into a trajectory obeying joint velocity and acceleration limits (MoveIt uses time-optimal trajectory generation, TOTG, by default). OMPL in MoveIt runs a path simplifier automatically after planning." },
      { t: "note", kind: "tip", text: "Narrow passages are the classic weak spot: a gap only slightly wider than the gripper occupies a tiny fraction of C-space, so uniform samples rarely land in it. If planning into a box keeps failing, plan to a pre-grasp pose outside the box first, then do a short straight-line approach. That is exactly the approach/retreat pattern of pick and place." },

      { t: "deep", title: "RRT* and why it converges to the optimum", blocks: [
        { t: "p", text: "RRT* (Karaman and Frazzoli, 2011) adds two steps to RRT. When adding q_new, instead of using the nearest node as parent, consider all nodes within a radius r(n) and choose the one giving the lowest cost-from-start through a free segment. Then **rewire**: for each node in that radius, if going through q_new would make its cost lower, change its parent to q_new. The radius shrinks as r(n) = γ·(log n / n)^(1/d), large enough that the tree keeps improving but small enough to stay efficient." },
        { t: "p", text: "With that radius, the path cost converges almost surely to the optimum as n → ∞ (asymptotic optimality), which plain RRT provably does not: RRT converges to a suboptimal path with probability one. Informed RRT* additionally restricts sampling, once a path of cost c is known, to the ellipse with foci at start and goal and major axis c, since no better path can leave it. In MoveIt, select `RRTstarkConfigDefault` and give it a fixed time budget; it uses all of it." },
      ] },
      { t: "deep", title: "Nearest neighbour search and sampling strategies", blocks: [
        { t: "p", text: "The O(n) nearest scan in the example is fine for hundreds of nodes. OMPL uses a GNAT (geometric near-neighbour access tree) structure, giving roughly logarithmic queries. In joint space the distance metric matters: weight joints by how far they move the arm (the shoulder moves the tip more than the wrist), otherwise the tree spreads wastefully in wrist directions." },
        { t: "p", text: "Uniform sampling is not the only choice. Gaussian sampling keeps samples near obstacle boundaries; bridge-test sampling keeps the midpoint of two colliding samples when it is free, which concentrates samples in narrow passages. Lazy PRM skips edge checks while building and checks only the edges of the candidate shortest path, rechecking if one fails, which can save most of the collision checks." },
      ] },
    ],
    mistakes: [
      "**Expecting optimal paths from RRT or RRT-Connect.** They return the first path found. Always shortcut and time-parameterise.",
      "**Too large a STEP.** Big steps skip over gaps and fail near obstacles; too small makes the tree grow slowly.",
      "**Too much goal bias.** Above about 20% the planner charges at the goal and gets stuck behind obstacles.",
      "**Using Euclidean distance on angles without wrap-around**, which makes the tree think 179° and -179° are far apart.",
      "**Treating a planning failure as proof the goal is unreachable.** Sampling planners are only probabilistically complete; increase time or rethink the approach pose.",
    ],
    practice: {
      kind: "bench",
      task: "Experiment with the RRT and add a shortcutting pass.",
      steps: [
        "Run the RRT with seeds 1 to 20 and tabulate nodes and path length for each. Compute the mean and spread.",
        "Add a `shortcut(path, tries=200)` function that picks two random indices and replaces the middle with a straight segment when `edge_free` allows. Report the length improvement for each seed.",
        "Add a narrow passage: two obstacles leaving a gap of 0.5 for the 0.4-wide robot. Measure how the number of nodes needed changes.",
        "Convert the planner to a 2R arm: sample (θ1, θ2), use the C-space checker from the previous lesson as `free`, and plan between two configurations on either side of the post.",
      ],
    },
    quiz: [
      {
        q: "Why is grid search impractical for a 6-DOF arm?",
        options: [
          "Grids cannot represent angles",
          "At useful resolution the number of cells grows exponentially with dimension, around 10¹⁵ cells at 1° for 6 joints",
          "A* is not optimal",
          "Arms have no obstacles",
        ],
        answer: 1,
        why: "360⁶ ≈ 2 × 10¹⁵. Sampling planners avoid building that grid.",
      },
      {
        q: "What does 'probabilistically complete' mean for RRT?",
        options: [
          "It always finds the shortest path",
          "It finds a path within a fixed time",
          "If a path exists, the probability of finding it tends to 1 as samples increase",
          "It can prove that no path exists",
        ],
        answer: 2,
        why: "Sampling planners cannot prove infeasibility; they only become ever more likely to succeed with more samples.",
      },
      {
        q: "Why does RRT-Connect usually beat RRT on arm planning problems?",
        options: [
          "It grows trees from both start and goal and greedily tries to join them, which meets quickly in open space",
          "It computes an optimal path",
          "It does not need collision checking",
          "It uses a grid",
        ],
        answer: 0,
        why: "The bidirectional search and greedy connect step finish in far fewer iterations than one tree waiting to hit the goal.",
      },
      {
        q: "When is a PRM a better choice than RRT-Connect?",
        options: [
          "When obstacles move every second",
          "When there is only one query",
          "When the robot has one joint",
          "When the arm works in a fixed workcell and plans many queries among the same obstacles",
        ],
        answer: 3,
        why: "The roadmap is built once and reused across queries. A changing scene would invalidate edges.",
      },
      {
        q: "The RRT in the lesson returns a path 17% longer than the straight line with 28 waypoints. What is the standard fix?",
        options: [
          "Lower the goal bias to zero",
          "Shortcut the path by replacing sections with collision-free straight segments, then time-parameterise it",
          "Use a bigger robot radius",
          "Run FK on every waypoint",
        ],
        answer: 1,
        why: "Shortcutting removes the zigzags; time parameterisation adds velocity and acceleration limits so the arm can execute it.",
      },
    ],
  },

  "a14-moveit2": {
    id: "a14-moveit2",
    outcomes: [
      "Describe the MoveIt 2 architecture: move_group, planning scene, planning pipelines, controllers",
      "Generate a MoveIt configuration package for a small arm with the Setup Assistant",
      "Plan and execute motions from Python (MoveItPy) and C++ (MoveGroupInterface)",
      "Connect MoveIt to a ros2_control JointTrajectoryController in simulation and on hardware",
    ],
    blocks: [
      { t: "h", text: "Why use MoveIt" },
      { t: "p", text: "You could hand-build everything from the last two lessons: a URDF, a collision checker, an RRT, IK, smoothing, time parameterisation and a trajectory follower. MoveIt 2 is the ROS 2 framework that already does all of it, tested on hundreds of robots. This lesson uses **ROS 2 Lyrical Luth** (the 2026 LTS, on Ubuntu 26.04) and its MoveIt 2 packages (the 2.15 series is released as Lyrical binaries); Jazzy (the 2024 LTS on Ubuntu 24.04) works the same way for everything shown here. The MoveIt docs site at moveit.picknik.ai tracks Rolling; check the tutorials against your release, as Python and C++ signatures change between releases." },

      { t: "h", text: "The architecture" },
      { t: "diagram", text: String.raw`
  your node (MoveItPy / MoveGroupInterface / RViz plugin)
            │  goal: pose or joint target
            ▼
  ┌──────────────────── move_group ─────────────────────┐
  │ Planning scene ── robot model (URDF + SRDF)          │
  │   │                current joint states  ◀── /joint_states
  │   │                world objects, octomap ◀── sensors
  │ Planning pipeline:  OMPL (RRTConnect...) ─ request/response adapters
  │ Kinematics plugin:  KDL (default) or TRAC-IK ...     │
  │ Trajectory execution manager ── controller manager plugin
  └──────────────────────────────┬───────────────────────┘
                                 │ FollowJointTrajectory action
                                 ▼
  ros2_control: JointTrajectoryController ── hardware interface ── servos / sim`, caption: "MoveIt 2 at a glance." },
      { t: "list", items: [
        "**Robot model**: the URDF (links, joints, collision geometry, limits) plus the **SRDF** (semantic description: planning groups such as `arm` and `gripper`, named poses such as `home`, end effectors, and the disabled-collision pairs of the allowed collision matrix).",
        "**Planning scene**: the live world model: the robot's current state, attached objects (a box in the gripper), and collision objects (the table, obstacles). The **planning scene monitor** keeps it up to date from `/joint_states`, from scene messages and from sensors.",
        "**Planning pipeline**: a planner plugin (OMPL by default; also Pilz industrial motion planner for straight lines and arcs, and CHOMP/STOMP optimisers) wrapped in adapters that fix up the start state before planning and add time parameterisation after.",
        "**Kinematics plugin**: IK per planning group. KDL is the default numerical solver. For a 4-DOF arm, numerical 6D IK fails because the pose is over-constrained; set position-only IK or use a custom analytic plugin like the one you wrote in a10.",
        "**Trajectory execution**: sends the planned trajectory to controllers through the `FollowJointTrajectory` action and monitors it.",
      ] },

      { t: "h", text: "Building a configuration package" },
      { t: "p", text: "Start from a good URDF (or xacro) of your arm, with simple collision geometry and correct joint limits. Then run the Setup Assistant, which writes a `<robot>_moveit_config` package:" },
      { t: "snippet", lang: "bash", code: String.raw`sudo apt install ros-lyrical-moveit   # Jazzy: ros-jazzy-moveit
source /opt/ros/lyrical/setup.bash
ros2 launch moveit_setup_assistant setup_assistant.launch.py`, caption: "Install MoveIt for Lyrical (replace lyrical with jazzy on Jazzy) and start the Setup Assistant." },
      { t: "list", ordered: true, items: [
        "**Load** the URDF/xacro.",
        "**Self-collisions**: generate the collision matrix by sampling (use a high sample density).",
        "**Planning groups**: `arm` as a chain from base_link to the wrist or tool link, `gripper` with the finger joints. Pick the kinematics solver for `arm`.",
        "**Robot poses**: add `home` and `ready`; MoveIt can plan to these by name.",
        "**End effector**: declare the gripper group, attached to the arm's last link.",
        "**ros2_control and controllers**: let it generate a JointTrajectoryController for the arm and a controller for the gripper.",
        "**Generate** the package, build with colcon, and run `ros2 launch <robot>_moveit_config demo.launch.py` to drag the interactive marker in RViz and plan with mock hardware.",
      ] },

      { t: "h", text: "Controllers via ros2_control" },
      { t: "p", text: "MoveIt does not drive motors. It hands a trajectory (a list of timed joint positions and velocities) to a controller. The standard is the `joint_trajectory_controller/JointTrajectoryController` from ros2_controllers, which interpolates between points and tracks them through a hardware interface. Two configuration files tie this together: the ros2_control controllers file (controller types, joints, command and state interfaces) and MoveIt's `moveit_controllers.yaml` (which action each MoveIt controller talks to)." },
      { t: "snippet", lang: "yaml", code: String.raw`# moveit_controllers.yaml
moveit_controller_manager: moveit_simple_controller_manager/MoveItSimpleControllerManager
moveit_simple_controller_manager:
  controller_names:
    - arm_controller
    - gripper_controller
  arm_controller:
    type: FollowJointTrajectory
    action_ns: follow_joint_trajectory
    default: true
    joints: [joint1, joint2, joint3, joint4]
  gripper_controller:
    type: FollowJointTrajectory
    action_ns: follow_joint_trajectory
    default: true
    joints: [gripper_joint]`, caption: "MoveIt side: which action server executes which joints." },
      { t: "snippet", lang: "yaml", code: String.raw`# ros2_controllers.yaml
controller_manager:
  ros__parameters:
    update_rate: 50  # Hz
    arm_controller:
      type: joint_trajectory_controller/JointTrajectoryController
    gripper_controller:
      type: joint_trajectory_controller/JointTrajectoryController
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster

arm_controller:
  ros__parameters:
    joints: [joint1, joint2, joint3, joint4]
    command_interfaces: [position]
    state_interfaces: [position]`, caption: "ros2_control side. Hobby servos accept position only, so command and state are both position." },
      { t: "p", text: "The **hardware interface** is the only part that changes between simulation and the real arm. With `mock_components/GenericSystem` (what demo.launch.py uses) the commanded positions are simply echoed back as states. In Gazebo you use the gz_ros2_control plugin. For a hobby arm you write a small `hardware_interface::SystemInterface` plugin, or a bridge node, that sends joint angles over serial to an ESP32 or Uno driving the servos and reports back the last commanded (or measured) angles. Hobby servos have no position feedback, so the state is open-loop; the trajectory still has to respect speed limits you measured." },

      { t: "h", text: "Planning from Python with MoveItPy" },
      { t: "p", text: "MoveItPy is MoveIt 2's Python API. It needs its parameters (robot description, planning pipelines, kinematics) loaded at startup, usually by a launch file that builds them with `MoveItConfigsBuilder`. The core calls, as in the official motion planning Python tutorial:" },
      { t: "snippet", lang: "python", code: String.raw`import rclpy
from geometry_msgs.msg import PoseStamped
from moveit.planning import MoveItPy

def plan_and_execute(robot, component):
    plan_result = component.plan()
    if plan_result:
        robot.execute(plan_result.trajectory, controllers=[])
    else:
        print("planning failed")

def main():
    rclpy.init()
    arm_robot = MoveItPy(node_name="moveit_py")
    arm = arm_robot.get_planning_component("arm")

    # 1. Named pose from the SRDF
    arm.set_start_state_to_current_state()
    arm.set_goal_state(configuration_name="ready")
    plan_and_execute(arm_robot, arm)

    # 2. Pose goal for the tool link
    goal = PoseStamped()
    goal.header.frame_id = "base_link"
    goal.pose.position.x, goal.pose.position.y, goal.pose.position.z = 0.20, 0.05, 0.15
    goal.pose.orientation.w = 1.0
    arm.set_start_state_to_current_state()
    arm.set_goal_state(pose_stamped_msg=goal, pose_link="tool_link")
    plan_and_execute(arm_robot, arm)

    rclpy.shutdown()

if __name__ == "__main__":
    main()`, caption: "MoveItPy: plan to a named pose, then to a pose. `controllers=[]` lets MoveIt pick the default controllers." },
      { t: "p", text: "Adding a collision object goes through the planning scene monitor, with a read-write lock so the scene does not change underneath the planner:" },
      { t: "snippet", lang: "python", code: String.raw`from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive
from geometry_msgs.msg import Pose

def add_table(robot):
    psm = robot.get_planning_scene_monitor()
    with psm.read_write() as scene:
        obj = CollisionObject()
        obj.header.frame_id = "base_link"
        obj.id = "table"
        box = SolidPrimitive()
        box.type = SolidPrimitive.BOX
        box.dimensions = [0.60, 0.60, 0.02]
        pose = Pose()
        pose.position.z = -0.011     # top surface 1 mm below the base
        pose.orientation.w = 1.0
        obj.primitives.append(box)
        obj.primitive_poses.append(pose)
        obj.operation = CollisionObject.ADD
        scene.apply_collision_object(obj)
        scene.current_state.update()`, caption: "Every planned motion now avoids the table." },

      { t: "h", text: "Planning from C++ with MoveGroupInterface" },
      { t: "p", text: "The C++ client talks to the `move_group` node through ROS interfaces, so it needs only a node handle and the group name. This follows the \"Your first C++ MoveIt project\" tutorial:" },
      { t: "snippet", lang: "cpp", code: String.raw`#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/pose.hpp>
#include <moveit/move_group_interface/move_group_interface.hpp>

int main(int argc, char* argv[])
{
  rclcpp::init(argc, argv);
  auto const node = std::make_shared<rclcpp::Node>(
      "pick_demo",
      rclcpp::NodeOptions().automatically_declare_parameters_from_overrides(true));
  auto const logger = rclcpp::get_logger("pick_demo");

  using moveit::planning_interface::MoveGroupInterface;
  auto move_group_interface = MoveGroupInterface(node, "arm");

  geometry_msgs::msg::Pose target;
  target.orientation.w = 1.0;
  target.position.x = 0.20;
  target.position.y = 0.05;
  target.position.z = 0.15;
  move_group_interface.setPoseTarget(target);

  auto const [success, plan] = [&move_group_interface] {
    MoveGroupInterface::Plan msg;
    auto const ok = static_cast<bool>(move_group_interface.plan(msg));
    return std::make_pair(ok, msg);
  }();

  if (success) {
    move_group_interface.execute(plan);
  } else {
    RCLCPP_ERROR(logger, "Planning failed");
  }
  rclcpp::shutdown();
  return 0;
}`, caption: "Plan then execute. Note the .hpp header used in current MoveIt 2 releases." },
      { t: "p", text: "Choosing a planner is one call: `setPlannerId(\"RRTConnectkConfigDefault\")` in C++, or the `planner_id` field of the OMPL parameters in MoveItPy. Give it `setPlanningTime(5.0)`; RRTConnect usually finishes in tens of milliseconds for a small arm, while RRT* uses the whole budget to improve the path." },

      { t: "deep", title: "Making KDL work for a 4-DOF arm", blocks: [
        { t: "p", text: "KDL solves full 6D pose IK by default. A 4-DOF arm cannot match an arbitrary orientation, so almost every pose goal fails with \"no IK solution\". Three remedies, in increasing effort. First, in `kinematics.yaml` set `position_only_ik: True` for the arm group (supported by the KDL plugin), and give orientation through a pitch you choose in the goal; MoveIt then matches only position. Second, use a pose goal with generous orientation tolerances (`set_goal_orientation_tolerance` in C++). Third, and best for small arms, write an IK plugin wrapping your analytic solver from a10; the plugin interface is `kinematics::KinematicsBase` and your solver returns all branches instantly." },
        { t: "p", text: "Alternatively plan in joint space directly: compute IK yourself, then call `set_goal_state(robot_state=...)` in MoveItPy or `setJointValueTarget(...)` in C++. The planner then only has to find a collision-free joint path, which is the most robust approach for a hobby arm." },
      ] },
      { t: "deep", title: "Writing a serial hardware interface for hobby servos", blocks: [
        { t: "p", text: "A ros2_control `SystemInterface` implements `on_init` (read joint names and parameters from the URDF `<ros2_control>` tag), `export_state_interfaces` and `export_command_interfaces` (one position interface per joint), `read` and `write`. In `write`, convert each commanded angle in radians to the servo's microseconds using your calibrated offset and sign, and send a compact line such as `J,1500,1620,1410,1800\\n` over serial at the controller rate (50 Hz is right for hobby servos, whose PWM frame is 20 ms). In `read`, copy the commanded values into the state, since the servo cannot report its angle." },
        { t: "p", text: "On the board side (ESP32 DevKit with the ESP32Servo library on GPIOs 18, 19, 21 and 22, or an Uno with a PCA9685 over I2C), parse lines and write pulse widths. Add a watchdog: if no command arrives for 200 ms, hold position, so a crashed PC does not leave a trajectory half-played. If you need real feedback, use smart bus servos (Dynamixel, or serial bus servos that report position), and read their positions in `read`." },
      ] },
    ],
    mistakes: [
      "**Detailed visual meshes as collision geometry**, giving planning times in seconds instead of milliseconds.",
      "**Sending 6D pose goals to a 4-DOF arm** with default KDL settings. Use position-only IK, tolerances, or joint-space goals from your own IK.",
      "**Joint names that differ** between the URDF, the SRDF, the ros2_control file and moveit_controllers.yaml. Execution then fails with \"no controller for joints\".",
      "**Missing joint_state_broadcaster.** Without /joint_states the planning scene's current state is stale or empty.",
      "**Copying API calls from a different distro's tutorial.** MoveItPy and C++ headers have changed between releases; use the docs for your distro.",
    ],
    practice: {
      kind: "bench",
      task: "Bring up MoveIt 2 for a small arm in simulation, then on hardware.",
      steps: [
        "Write a URDF for your 4-servo arm from the a10 DH table, with cylinder collision shapes and joint limits from your calibration. Check it in RViz with `joint_state_publisher_gui`.",
        "Run the Setup Assistant, generate the config package, and plan to `ready` and back with demo.launch.py using mock hardware.",
        "Add a table and a box obstacle with the MoveItPy code and confirm planned paths go around the box.",
        "Write the serial hardware interface (or a bridge node) and an ESP32 or Uno sketch; execute the same plans on the real arm at reduced velocity scaling (0.2).",
      ],
    },
    quiz: [
      {
        q: "What does the SRDF add to the URDF?",
        options: [
          "Link masses and inertias",
          "Planning groups, named poses, end effectors and disabled collision pairs",
          "Mesh files for visualisation",
          "The controller update rate",
        ],
        answer: 1,
        why: "The URDF is physical; the SRDF is semantic information MoveIt needs for planning.",
      },
      {
        q: "How does MoveIt send a planned arm motion to the robot?",
        options: [
          "It writes PWM values to the servos directly",
          "It publishes cmd_vel",
          "It calls a FollowJointTrajectory action on a controller such as JointTrajectoryController",
          "It writes a file that the robot reads",
        ],
        answer: 2,
        why: "Execution goes through the trajectory execution manager to a controller's FollowJointTrajectory action; ros2_control drives the hardware.",
      },
      {
        q: "Your 4-DOF arm fails every pose goal with 'no IK solution' using default KDL. What is the most likely reason?",
        options: [
          "The arm is too short",
          "KDL is trying to match a full 6D pose that a 4-DOF arm cannot reach in general",
          "OMPL is not installed",
          "The table collision object is missing",
        ],
        answer: 1,
        why: "Four joints cannot satisfy six pose constraints. Use position-only IK, tolerances or joint-space goals.",
      },
      {
        q: "Which part changes when you move from simulation to the real arm with ros2_control?",
        options: [
          "Only the hardware interface plugin",
          "The planner",
          "The SRDF",
          "The MoveItPy code",
        ],
        answer: 0,
        why: "Controllers, MoveIt and your code stay the same. Only the hardware interface (mock, Gazebo, or your serial plugin) is swapped.",
      },
      {
        q: "Why does adding a collision object use `with psm.read_write() as scene:`?",
        options: [
          "To save the scene to disk",
          "To lock the planning scene while it is modified so the planner never sees a half-updated world",
          "To reset the robot's joints",
          "Because Python requires it for all ROS calls",
        ],
        answer: 1,
        why: "The planning scene monitor is shared with planning threads. A read-write lock keeps modifications atomic.",
      },
    ],
  },

  "a14-grasping-and-pick-place": {
    id: "a14-grasping-and-pick-place",
    outcomes: [
      "Choose an end effector (parallel jaw, suction, soft or compliant) for a given object",
      "Check a parallel-jaw grasp against friction and grip-force requirements",
      "Explain impedance control and why compliance makes contact tasks robust",
      "Build pick and place as a pipeline: perception pose, grasp pose, approach, grasp, retreat, place, and deliver the exit project",
    ],
    blocks: [
      { t: "h", text: "Why grasping is the hard last centimetre" },
      { t: "p", text: "Planning gets the gripper near the object. The grasp itself is where most pick-and-place systems fail: the object slips, the fingers knock it over on approach, or a pose error of 5 mm turns a centred grasp into a pinch on an edge. This lesson covers end effector choice, the physics of a stable grasp, compliance (letting the arm give a little instead of fighting contact), and then assembles the full pipeline." },

      { t: "h", text: "End effectors" },
      { t: "table", head: ["Type", "How it holds", "Good for", "Limits"], rows: [
        ["Parallel jaw", "two fingers squeeze; friction", "boxes, cylinders, most rigid parts", "needs clearance either side; fragile items"],
        ["Suction cup", "pressure difference over the cup area", "flat, smooth, non-porous tops; bin picking", "porous or curved surfaces leak; needs a pump"],
        ["Soft / fin-ray fingers", "fingers deform round the object", "fruit, irregular shapes", "low precision, lower force"],
        ["Electromagnet / needle", "magnetic or piercing", "steel sheet; textiles", "very narrow use"],
      ], caption: "Common end effectors for small arms." },
      { t: "p", text: "A hobby arm usually has a servo-driven parallel gripper: one servo turns gears or a linkage that moves both fingers. Its grip force is set by the servo torque divided by the linkage lever arm, and it is not controlled; the servo pushes as hard as it can until it reaches the commanded angle or stalls. Commanding a closed angle slightly beyond the object's width gives a repeatable squeeze, but a stalled servo heats up, so choose the command angle deliberately." },

      { t: "h", text: "Will the grasp hold? Friction and force" },
      { t: "p", text: "With a parallel jaw holding an object by friction, each finger presses with normal force N. Coulomb friction lets each contact resist up to μN tangentially. Two fingers holding against gravity (and any acceleration a of the arm):" },
      { t: "formula", text: String.raw`2·μ·N ≥ m·(g + a)·SF            SF = safety factor, typically 2

Example: m = 0.05 kg, μ = 0.4 (rubber pads on cardboard), a = 2 m/s², SF = 2
N ≥ 0.05 × (9.81 + 2) × 2 / (2 × 0.4) = 1.181 / 0.8 = 1.48 N per finger`, caption: "Each finger squeezes with N; friction on both faces carries the weight." },
      { t: "p", text: "Check: 2 × 0.4 × 1.48 = 1.18 N of friction against a weight-plus-inertia load of 0.05 × 11.81 = 0.59 N, a margin of exactly 2. If the gripper servo is SG90-class (about 1.8 kg·cm = 0.18 N·m) driving fingers through a 2 cm effective lever, each finger can push up to about 0.18 / 0.02 = 9 N at stall, far more than needed. In practice you limit it so you do not crush the object. Rubber finger pads matter more than force: bare plastic on plastic has μ around 0.2 to 0.3, which doubles the needed squeeze compared with rubber at μ ≈ 0.6 or more." },
      { t: "p", text: "Two more rules. **Grasp through the centre of mass**: if the fingers grip off-centre by distance e, gravity produces a torque m·g·e that friction must also resist, and the object swings. **Use form closure where you can**: fingers shaped to wrap around a cylinder resist slipping by geometry, not only friction. For suction, holding force is ΔP × A: a 20 mm cup (A = 3.14 × 10⁻⁴ m²) at a vacuum of 50 kPa gives 15.7 N before any safety factor, but only on a sealed, flat surface." },

      { t: "h", text: "Compliance and impedance control in outline" },
      { t: "p", text: "A stiff, position-controlled arm that touches the table 3 mm earlier than its model expected tries to drive through it: forces spike, the servo stalls, the object is crushed or the arm is damaged. Real contact always has position error, so robust manipulation adds **compliance**: the arm deliberately behaves like a spring-damper around its target." },
      { t: "formula", text: String.raw`Impedance control (desired behaviour of the tip):
F = K·(x_d - x) + D·(ẋ_d - ẋ)                   tip acts as spring K and damper D around x_d

Joint torques to produce it (plus gravity compensation):
τ = Jᵀ(q)·[K·(x_d - x) + D·(ẋ_d - ẋ)] + g(q)

Example: K = 200 N/m, contact 3 mm early  →  F = 200 × 0.003 = 0.6 N   (instead of a stall)`, caption: "Impedance control sets a relation between position error and force, rather than forcing position." },
      { t: "p", text: "Choosing K chooses behaviour: high stiffness for accurate free motion, low stiffness along the direction where contact is expected (pushing a peg into a hole, placing a box onto a shelf). The damping D prevents bouncing; a common choice is critical damping, D = 2√(K·m) for effective mass m. This needs torque-controlled joints (brushless motors with current control, or series elastic actuators), which hobby servos are not. With hobby servos you get compliance **passively**: rubber pads, a sprung finger, a spring-loaded wrist, or a suction cup with a bellows, and you plan the place pose a few millimetres above the surface and let it drop or settle." },
      { t: "note", kind: "safety", text: "A position-controlled arm does not know it has hit something, including a hand. Run first tests at low speed with velocity scaling around 0.1 to 0.2, keep hands out of the workspace, and have a physical switch that cuts servo power." },

      { t: "h", text: "Pick and place as a pipeline" },
      { t: "diagram", text: String.raw`
 camera ─▶ detect object ─▶ object pose in camera frame  ᶜT_O
                                    │  tf2:  ᴮT_O = ᴮT_C · ᶜT_O
                                    ▼
            grasp pose  ᴮT_G = ᴮT_O · ᴼT_G        (grasp relative to object)
                                    │
          pre-grasp = ᴮT_G offset 6 cm back along the gripper approach axis
                                    ▼
   plan (OMPL) to pre-grasp ─▶ open gripper ─▶ straight approach 6 cm
   ─▶ close gripper ─▶ attach object to robot in planning scene
   ─▶ straight retreat 6 cm up ─▶ plan to pre-place ─▶ straight descent
   ─▶ open gripper ─▶ detach object ─▶ retreat ─▶ home`, caption: "Each arrow is a step that can fail and must be checked." },
      { t: "list", ordered: true, items: [
        "**Perception pose**: detect the object (an ArUco marker on it is the reliable starting point; colour blob plus depth next) and get its pose in the camera frame, then transform to the base frame with the camera's calibrated extrinsics ᴮT_C. Errors here dominate everything downstream, so calibrate the camera to the robot (hand-eye calibration) and measure your error.",
        "**Grasp pose**: a grasp defined relative to the object, ᴼT_G (for a box: fingers on the two narrow faces, gripper pointing down, centred on the top). Compose it with the object pose. For a symmetric object, try several grasps (rotations of 90° or 180°) and keep the first with a reachable, collision-free IK solution.",
        "**Approach and retreat**: a pre-grasp pose some centimetres back along the approach direction. Plan freely (sampling planner) only to the pre-grasp; the final approach is a short straight-line Cartesian move so the fingers do not sweep into the object. Retreat the same way after closing.",
        "**Attach the object**: once grasped, tell the planning scene the object is attached to the gripper link, so that subsequent plans treat it as part of the robot (it must not hit the table) and the fingers are allowed to touch it.",
        "**Place**: the reverse, with a pre-place above the target, a straight descent, open, detach, retreat.",
        "**Verify each step**: after closing, check the gripper angle (if it closed fully, it missed); after the move, re-detect to confirm the place. Retry or abort on failure rather than ploughing on.",
      ] },
      { t: "p", text: "Worked example of the pose chain. The camera sees the marker at (0.02, -0.05, 0.40) m in its own frame; its calibrated pose is a downward-looking camera at (0.25, 0, 0.55) in the base frame (rotation that maps camera z to base -z, camera x to base -y, and camera y to base -x). Then the object is at x = 0.25 - (-0.05) = 0.30, y = 0 - 0.02 = -0.02, z = 0.55 - 0.40 = 0.15 m in the base frame. With a grasp centred on the top, pointing down, the grasp pose is (0.30, -0.02, 0.15) with pitch -90°, the pre-grasp is (0.30, -0.02, 0.21). Check reach with the a10 IK: r = 0.3007 m and the wrist centre for pitch -90° is at r_w = 0.3007 m, z_w = 0.21 - 0.10 + 0.06 = 0.17 m, a distance of 0.345 m from the shoulder, which exceeds a2 + a3 = 0.24 m. So this object is out of reach for the small arm: move the object closer or choose a tilted grasp. Doing this check before you plan is exactly the kind of feasibility test the pipeline needs." },

      { t: "h", text: "Exit project: pick and place in simulation and on hardware" },
      { t: "list", ordered: true, items: [
        "**Simulation**: in RViz (mock hardware) or Gazebo, add a table and a 3 cm cube as collision objects, implement the full pipeline from a known object pose with MoveItPy or C++, including attach/detach and straight-line approach. Run it 10 times from different object positions and record success.",
        "**Perception**: replace the known pose with an ArUco marker detected by a USB camera (OpenCV `cv2.aruco`), transformed to the base frame with your measured extrinsics. Report pose error against a ruler.",
        "**Hardware**: execute on the real arm through your ros2_control interface at reduced speed, with rubber finger pads and a gripper close angle chosen from the cube width.",
        "**Report**: success rate over 20 trials, the failure modes you saw (perception error, slip, collision, IK unreachable), and one change that improved the rate.",
      ] },

      { t: "deep", title: "Friction cones and force closure", blocks: [
        { t: "p", text: "At a contact with friction coefficient μ, the set of forces the contact can apply without slipping is a cone around the surface normal with half-angle atan(μ): about 21.8° for μ = 0.4. A grasp has **force closure** if the contacts' cones together can resist any external force and torque on the object. For two point contacts in the plane, force closure holds when the line joining the contacts lies inside both friction cones. That is why fingers must press nearly opposite each other: grip a box across a diagonal corner-to-corner and the line between contacts leaves the cones, so it slips however hard you squeeze." },
        { t: "p", text: "Grasp planners (GraspIt, Dex-Net, GPD for point clouds) sample candidate grasps on a mesh or point cloud and score them with force-closure metrics such as the Ferrari-Canny epsilon quality: the radius of the largest wrench ball the grasp can resist for unit total contact force. Learning-based planners predict that score directly from depth images." },
      ] },
      { t: "deep", title: "Admittance control: compliance for position-controlled arms", blocks: [
        { t: "p", text: "Impedance control needs torque control. **Admittance control** is the dual for stiff, position-controlled arms with a force/torque sensor at the wrist: measure the contact force F, and move the position set-point according to a virtual mass-spring-damper, M·ẍ + D·ẋ + K·(x - x_d) = F. The arm then yields to contact by moving its target. Industrial arms use this for hand guiding and assembly. ROS 2 has an `admittance_controller` in ros2_controllers that chains in front of a trajectory controller." },
        { t: "p", text: "Even without a force sensor, the servo's supply current is a crude force signal. Monitoring it on the ESP32 with a shunt resistor and an ADC pin lets you detect contact (current rising above the free-motion level) and stop the descent: guarded moves, the simplest form of force-aware placing." },
      ] },
    ],
    mistakes: [
      "**Planning straight to the grasp pose.** The planner may approach from the side and knock the object; always plan to a pre-grasp and finish with a straight approach.",
      "**Forgetting to attach the object** after grasping, so the next plan drags it through the table.",
      "**Grasping off the centre of mass**, so the object swings or rotates out of the fingers.",
      "**Trusting the camera pose without calibration.** A few degrees of extrinsic error moves the grasp by centimetres at arm's length.",
      "**Squeezing with a stalled servo for long periods.** It overheats; choose a close angle just inside the object's width and use grippy pads.",
      "**No failure checks.** Check that the gripper did not close fully (missed) and re-detect after placing.",
    ],
    practice: {
      kind: "bench",
      task: "Build and test the grasp and the perception-to-grasp chain on the bench.",
      steps: [
        "Weigh three objects, estimate μ for your finger pads by tilting a pad on each object until it slips (μ = tan of the slip angle), and compute the needed grip force with a safety factor of 2.",
        "Calibrate your gripper servo: record the command angle at which the fingers just touch a 3 cm cube, and use 5° beyond it as the close command.",
        "Print an ArUco marker, detect it with OpenCV from a fixed USB camera, and convert its pose to the robot base frame with measured extrinsics. Compare with a ruler at five positions.",
        "Run the complete pick and place pipeline in simulation with the detected pose, then on hardware at velocity scaling 0.2. Log 20 trials.",
      ],
    },
    quiz: [
      {
        q: "A 0.1 kg object is held by a parallel gripper with μ = 0.5. Ignoring acceleration and with a safety factor of 2, what normal force does each finger need?",
        options: ["0.98 N", "1.96 N", "0.49 N", "3.92 N"],
        answer: 1,
        why: "2μN ≥ m·g·SF gives N ≥ 0.1 × 9.81 × 2 / (2 × 0.5) = 1.962 / 1 = 1.96 N.",
      },
      {
        q: "Which end effector suits picking flat cardboard boxes from the top in a bin?",
        options: ["A soft fin-ray gripper", "A needle gripper", "A suction cup", "An electromagnet"],
        answer: 2,
        why: "Flat, accessible tops suit suction, and no clearance is needed beside the box.",
      },
      {
        q: "Why does a pick pipeline plan to a pre-grasp pose and then move in a straight line?",
        options: [
          "Because the planner cannot reach the grasp pose",
          "To save planning time only",
          "Because MoveIt forbids pose goals",
          "So the final approach is along the gripper axis and the fingers do not sweep into the object",
        ],
        answer: 3,
        why: "A sampling planner's path to the grasp could come from any direction. The straight approach controls the last centimetres.",
      },
      {
        q: "An impedance controller has K = 300 N/m along z. The surface is 4 mm higher than expected. What contact force results at steady state?",
        options: ["1.2 N", "0.075 N", "75 N", "12 N"],
        answer: 0,
        why: "F = K × Δx = 300 × 0.004 = 1.2 N. The arm acts like a spring instead of driving through the surface.",
      },
      {
        q: "Why attach the grasped object to the gripper in the planning scene?",
        options: [
          "To make the gripper close harder",
          "So later plans treat the object as part of the robot and keep it clear of obstacles",
          "To delete it from perception",
          "To speed up IK",
        ],
        answer: 1,
        why: "Once held, the object moves with the arm. If the scene still thinks it sits on the table, plans may drag it through obstacles.",
      },
    ],
  },
};

export default lessons;
