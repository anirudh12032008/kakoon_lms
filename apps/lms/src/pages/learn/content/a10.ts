import type { ModuleContent } from "../model/curriculum";

/**
 * Module a10: Robot kinematics and dynamics.
 * Python snippets are pure Python (no numpy) so they run anywhere; every printed
 * number in the prose was produced by running them.
 */
const lessons: ModuleContent = {
  "a10-frames-rotations-transforms": {
    id: "a10-frames-rotations-transforms",
    outcomes: [
      "Describe the position and orientation of one frame relative to another",
      "Build rotation matrices about x, y and z and use their properties (orthogonal, determinant 1, inverse is the transpose)",
      "Compose rotations correctly about fixed axes and about moving axes",
      "Build, chain and invert 4 by 4 homogeneous transforms and use them to move a point between frames",
    ],
    blocks: [
      { t: "h", text: "Why robots need frames" },
      { t: "p", text: "A robot arm is a chain of rigid bodies. A camera sees a part, the gripper must reach it, and the base is bolted to a table. Each of these things has its own natural set of axes: the camera measures in its own coordinates, the gripper closes along its own axis, and the table is where you measured the obstacles. Almost every bug in a manipulation system is a point expressed in the wrong frame. This lesson gives you the algebra that removes that class of bug: rotation matrices for orientation and homogeneous transforms for full pose (position plus orientation)." },
      { t: "p", text: "A **frame** is an origin plus three mutually perpendicular unit axes x, y, z, arranged right-handed (curl the fingers of your right hand from x to y and your thumb points along z). The **pose** of frame B relative to frame A is two things: where B's origin is, measured in A, and how B's axes are tilted relative to A's. We write a point p expressed in frame A as `ᴬp`." },

      { t: "h", text: "Rotation matrices" },
      { t: "p", text: "Put B's three unit axes, each written in A's coordinates, as the columns of a 3 by 3 matrix. That matrix is the rotation `ᴬR_B`. It does two jobs at once: it describes B's orientation in A, and it converts coordinates, because `ᴬp = ᴬR_B · ᴮp` for any point p measured from a shared origin." },
      { t: "formula", text: String.raw`        | 1    0     0  |          |  cθ  0  sθ |          | cθ  -sθ  0 |
Rx(θ) = | 0   cθ   -sθ |  Ry(θ) = |  0   1   0 |  Rz(θ) = | sθ   cθ  0 |
        | 0   sθ    cθ |          | -sθ  0  cθ |          |  0    0  1 |

cθ = cos θ,  sθ = sin θ`, caption: "The three elementary rotations. Note the sign of sin θ moves in Ry because the cyclic order is z, x, y." },
      { t: "p", text: "Every rotation matrix obeys three facts you will use constantly. Its columns are unit length and mutually perpendicular, so `Rᵀ R = I`. That makes the **inverse equal to the transpose**, `R⁻¹ = Rᵀ`, which is cheap and exact. Its determinant is +1 (a determinant of -1 would be a mirror, not a rotation). And it preserves lengths and angles, so rotating a vector never stretches it. Nine numbers, but only three degrees of freedom: the six orthonormality constraints use up the rest." },
      { t: "p", text: "A quick check of Rz(90°): the new x axis is column 1, (0, 1, 0), which is the old y axis. Rotating by 90 degrees about z turns x into y. Correct." },

      { t: "h", text: "Composition order: fixed axes versus moving axes" },
      { t: "p", text: "Matrix multiplication does not commute, and rotations show it plainly. There are two ways to describe a sequence of rotations, and they give opposite multiplication orders." },
      { t: "list", items: [
        "**Moving (body, current) frame**: each new rotation is about the axes of the frame as it now stands. You **post-multiply**: first Rz(α), then about the new x by β gives `R = Rz(α) · Rx(β)`.",
        "**Fixed (world, space) frame**: each new rotation is about the original, unmoving axes. You **pre-multiply**: first Rz(α), then about the world x by β gives `R = Rx(β) · Rz(α)`.",
      ] },
      { t: "p", text: "Worked example with α = β = 90°. Computing both products (the multiplication was checked in Python):" },
      { t: "formula", text: String.raw`Rz(90°)·Rx(90°) = | 0  0  1 |        Rx(90°)·Rz(90°) = | 0  -1   0 |
                  | 1  0  0 |                          | 0   0  -1 |
                  | 0  1  0 |                          | 1   0   0 |`, caption: "Same two rotations, different order, different final orientation." },
      { t: "p", text: "Read the left result column by column: the body's x axis ends along world y, its y along world z, its z along world x. Physically: yaw 90° so x points along world y, then roll about that new x axis; the body z axis tips over towards world x. Pick up your phone and do it; the result matches. This is the single most common source of wrong orientations in robot code, so always write down which convention a library uses. Denavit-Hartenberg chains, in the next lesson, are moving-frame products." },

      { t: "h", text: "Homogeneous transforms" },
      { t: "p", text: "Orientation alone is not enough; frames are also displaced. The pose of B in A is a rotation R and a translation t (B's origin in A). A point converts as `ᴬp = R · ᴮp + t`. Packing this into one 4 by 4 matrix lets you chain poses by plain multiplication:" },
      { t: "formula", text: String.raw`        | R    t |        | ᴬp |   | R  t |   | ᴮp |
ᴬT_B =  |        |        |    | = |      | × |    |
        | 0 0 0 1|        |  1 |   | 0  1 |   |  1 |

Chain:    ᴬT_C = ᴬT_B · ᴮT_C
Inverse:  ᴮT_A = (ᴬT_B)⁻¹ = | Rᵀ   -Rᵀ t |
                            | 0      1   |`, caption: "A point gets a 1 appended (a direction vector gets a 0, so translation does not affect it)." },
      { t: "p", text: "The subscripts cancel like fractions: A_B times B_C gives A_C. If your subscripts do not line up, the multiplication is wrong. Note that the inverse is **not** just transposing the whole 4 by 4 matrix; the translation part becomes -Rᵀ t." },

      { t: "h", text: "Worked example: a camera on a table" },
      { t: "p", text: "A camera is mounted at (0.5, 0, 0.4) m in the robot base frame, rotated 90° about the base z axis, so its x axis points along base y. It sees a part at (0.1, 0.2, 0) m in camera coordinates. Where is the part in the base frame?" },
      { t: "formula", text: String.raw`ᴮT_C = | 0  -1  0  0.5 |      ᶜp = | 0.1 |
       | 1   0  0  0   |           | 0.2 |
       | 0   0  1  0.4 |           | 0   |
       | 0   0  0  1   |           | 1   |

ᴮp = ᴮT_C · ᶜp = (0·0.1 - 1·0.2 + 0.5,  1·0.1 + 0,  0.4,  1) = (0.3, 0.1, 0.4)`, caption: "Rotation part is Rz(90°), translation part is the camera's position." },
      { t: "p", text: "Check by intuition: the camera's x axis points along base +y, so 0.1 m along camera x is 0.1 m along base y. Camera y points along base -x, so 0.2 m along camera y moves 0.2 m in base -x, from 0.5 to 0.3. Height is the camera height, 0.4 m. All three agree. Now check the inverse: Rᵀ t for t = (0.5, 0, 0.4) is (0, -0.5, 0.4), so -Rᵀ t = (0, 0.5, -0.4); applying ᶜT_B to (0.3, 0.1, 0.4) gives (0.1, -0.3 + 0.5, 0.4 - 0.4) = (0.1, 0.2, 0). Back where we started." },
      { t: "note", kind: "tip", text: "In ROS 2 the `tf2` library keeps a tree of exactly these transforms. When you call `lookup_transform(\"base_link\", \"camera_link\", ...)` you are asking for ᴮT_C. The target frame comes first." },

      { t: "h", text: "Other ways to write orientation" },
      { t: "p", text: "Nine numbers is wasteful for storage and awkward for people, so you will meet three alternatives. **Euler or roll-pitch-yaw angles** use three numbers; easy to read, but they have a singularity (gimbal lock) when the middle rotation reaches ±90°, and there are twelve conventions. **Axis-angle** is a unit axis and an angle about it; natural for small corrections. **Unit quaternions** use four numbers (x, y, z, w) with no singularity and cheap interpolation; ROS messages such as `geometry_msgs/Pose` use them. Convert to a matrix whenever you need to transform points." },

      { t: "deep", title: "Proving R⁻¹ = Rᵀ and why det R = +1", blocks: [
        { t: "p", text: "Let the columns of R be the unit vectors x̂, ŷ, ẑ of frame B written in A. Entry (i, j) of RᵀR is the dot product of column i with column j. Unit length makes the diagonal 1 and perpendicularity makes the rest 0, so RᵀR = I and therefore R⁻¹ = Rᵀ. Taking determinants, det(Rᵀ)·det(R) = det(R)² = 1, so det R = ±1. Right-handedness, ẑ = x̂ × ŷ, picks +1, because det R = x̂ · (ŷ × ẑ), the scalar triple product, which equals +1 for a right-handed set." },
        { t: "p", text: "In code, repeatedly multiplying rotations accumulates floating-point error, and the matrix slowly stops being orthonormal: lengths drift. Professionals re-orthonormalise from time to time (Gram-Schmidt on the columns, or convert to a quaternion and normalise it). If a simulation shows links slowly growing, this is the cause." },
      ] },
      { t: "deep", title: "Roll-pitch-yaw, gimbal lock, and the quaternion fix", blocks: [
        { t: "formula", text: String.raw`R = Rz(yaw) · Ry(pitch) · Rx(roll)        (ROS REP 103 convention, fixed axes x then y then z)

At pitch = 90°:  R depends only on (yaw - roll)`, caption: "Two angles collapse into one degree of freedom." },
        { t: "p", text: "At pitch ±90°, rotating by roll and by yaw spin about the same physical axis, so one degree of freedom vanishes and the inverse map (matrix to angles) is not unique. Any controller that differentiates Euler angles misbehaves near that point. A unit quaternion q = (cos(θ/2), sin(θ/2)·û) represents a rotation by θ about axis û with no such singularity. Note that q and -q represent the same rotation (double cover), so when interpolating with slerp always take the shorter way by flipping the sign if the dot product is negative." },
      ] },
    ],
    mistakes: [
      "**Multiplying in the wrong order.** Rotations about the moving frame post-multiply; about fixed axes pre-multiply. Write the convention next to the code.",
      "**Inverting a homogeneous transform by transposing the whole 4 by 4.** Only the rotation block transposes; the translation becomes -Rᵀ t.",
      "**Mixing degrees and radians.** `math.cos(90)` is cos of 90 radians. Convert once at the boundary.",
      "**Confusing \"pose of B in A\" with \"transform from A to B\".** ᴬT_B maps points written in B into A. Check that subscripts cancel.",
      "**Appending 1 to a direction vector.** Velocities and axes take a 0 as fourth component so translation does not shift them.",
    ],
    practice: {
      kind: "bench",
      task: "Measure frames on a real desk setup and verify a transform chain.",
      steps: [
        "Tape a base frame on your desk (origin at a corner, x and y along the edges, z up). Place a phone or webcam somewhere and measure its position and yaw with a ruler and protractor.",
        "Write ᴮT_C by hand, then put a coin at a measured spot. Express the coin in camera coordinates using the inverse transform.",
        "Code `Rz`, `Rx`, matrix multiply and transform-inverse in plain Python. Check numerically that R·Rᵀ = I and det R = 1 for a few random angles.",
        "Reproduce the Rz(90°)Rx(90°) versus Rx(90°)Rz(90°) result, then demonstrate it with a book in your hand.",
      ],
    },
    quiz: [
      {
        q: "R is a valid rotation matrix. What is R⁻¹?",
        options: ["-R", "Rᵀ", "1/det(R) times R", "R itself"],
        answer: 1,
        why: "The columns are orthonormal, so RᵀR = I. The inverse is the transpose.",
      },
      {
        q: "A body yaws by α about z, then rotates by β about its own new x axis. Which product gives its orientation?",
        options: ["Rx(β)·Rz(α)", "Rz(α) + Rx(β)", "Rz(α)·Rx(β)", "Rx(α)·Rz(β)"],
        answer: 2,
        why: "Rotations about the moving (current) frame post-multiply, so the first rotation is on the left.",
      },
      {
        q: "A camera sits at (0.5, 0, 0.4) in the base frame, yawed 90° about base z. A point is at (0.1, 0.2, 0) in camera coordinates. Where is it in the base frame?",
        options: ["(0.6, 0.2, 0.4)", "(0.3, 0.1, 0.4)", "(0.7, -0.1, 0.4)", "(0.4, 0.2, 0.4)"],
        answer: 1,
        why: "Camera x is base y and camera y is base -x. So x = 0.5 - 0.2 = 0.3, y = 0 + 0.1 = 0.1, z = 0.4.",
      },
      {
        q: "What is the translation part of the inverse of a transform with rotation R and translation t?",
        options: ["-t", "Rᵀ t", "-Rᵀ t", "t"],
        answer: 2,
        why: "Solving p_A = R p_B + t for p_B gives p_B = Rᵀ p_A - Rᵀ t.",
      },
      {
        q: "Why does a direction vector get a 0 as its fourth homogeneous component?",
        options: [
          "So that the translation part of T does not move it, only the rotation",
          "To make the matrix square",
          "Because directions are always zero length",
          "So that it is normalised",
        ],
        answer: 0,
        why: "Multiplying by T adds t times the fourth component. A direction must rotate but not shift.",
      },
      {
        q: "How many independent numbers does a 3 by 3 rotation matrix really contain?",
        options: ["9", "6", "4", "3"],
        answer: 3,
        why: "Nine entries minus six orthonormality constraints (three unit lengths, three perpendicularities) leaves three.",
      },
    ],
  },

  "a10-forward-kinematics-dh": {
    id: "a10-forward-kinematics-dh",
    outcomes: [
      "Write the forward kinematics of a planar 2R arm by geometry",
      "Assign standard Denavit-Hartenberg frames and fill a DH table for a 4-DOF desktop arm",
      "Compute the gripper pose from joint angles by chaining DH transforms in Python",
      "Explain the difference between standard and modified (Craig) DH",
    ],
    blocks: [
      { t: "h", text: "What forward kinematics answers" },
      { t: "p", text: "Forward kinematics (FK) answers: given the joint angles, where is the end effector and how is it oriented? It is the easy direction, always has exactly one answer, and is the foundation for everything else: inverse kinematics inverts it, the Jacobian differentiates it, and a planner calls it thousands of times to check collisions. You need it exact, and you need it tested." },
      { t: "p", text: "The joint variables together form the **configuration** q. For revolute joints they are angles θ; for prismatic joints, lengths d. The number of independent joint variables is the robot's **degrees of freedom (DOF)**. A pose in 3D space needs 6 numbers, so a 4-DOF desktop arm can reach positions but only some orientations; a 6-DOF industrial arm can reach general poses inside its workspace." },

      { t: "h", text: "The planar 2R arm" },
      { t: "p", text: "Two links of lengths L1 and L2, two revolute joints with parallel axes, moving in a plane. θ1 is measured from the base x axis to link 1, and θ2 from link 1 to link 2 (a relative angle, which is what a motor on the joint actually sets)." },
      { t: "diagram", text: String.raw`
  y
  │            ● tip (x, y)
  │           /
  │      L2  /  θ2 measured from the line of link 1
  │         /
  │        ● elbow
  │   L1  /
  │      /  θ1
  ●─────────────── x
 base`, caption: "Planar 2R arm." },
      { t: "formula", text: String.raw`x = L1·cos θ1 + L2·cos(θ1 + θ2)
y = L1·sin θ1 + L2·sin(θ1 + θ2)
φ = θ1 + θ2            (orientation of the last link)`, caption: "Each link adds its vector; link 2's absolute angle is the sum of the joint angles." },
      { t: "p", text: "Example: L1 = 0.3 m, L2 = 0.2 m, θ1 = 11.13°, θ2 = 62.72°. Then θ1 + θ2 = 73.85°. x = 0.3 × 0.9812 + 0.2 × 0.2782 = 0.2944 + 0.0556 = 0.350 m and y = 0.3 × 0.1930 + 0.2 × 0.9606 = 0.0579 + 0.1921 = 0.250 m. We will meet this point, (0.35, 0.25), again when we solve IK." },
      { t: "p", text: "The **workspace** of the 2R arm is an annulus: the tip can be anywhere with |L1 - L2| ≤ distance ≤ L1 + L2, here from 0.1 m to 0.5 m from the base, assuming the joints can turn fully. Real joint limits cut pieces out of it." },

      { t: "h", text: "Why a convention: Denavit-Hartenberg" },
      { t: "p", text: "Geometry works for two planar links but becomes error-prone in 3D. The **Denavit-Hartenberg (DH) convention** reduces each link to four numbers by placing frames in a disciplined way, then each joint contributes one transform of the same form. This lesson uses **standard (distal) DH**, as in Spong, Hutchinson and Vidyasagar. The frame i is attached to the far end of link i, and its z axis is the axis of joint i+1." },
      { t: "list", ordered: true, items: [
        "**z_(i-1)** lies along the axis of joint i (the axis it rotates about or slides along).",
        "**x_i** lies along the common perpendicular from z_(i-1) to z_i, pointing away from z_(i-1). If the axes intersect, x_i is perpendicular to both; if parallel, pick any common perpendicular (usually along the link).",
        "**y_i** completes a right-handed frame.",
      ] },
      { t: "p", text: "Then each link has four parameters, and the transform from frame i-1 to frame i is a rotation about z by θ, a slide along z by d, a slide along the new x by a, and a twist about that x by α:" },
      { t: "table", head: ["Parameter", "Meaning", "Measured along / about"], rows: [
        ["θ_i (joint angle)", "angle from x_(i-1) to x_i", "about z_(i-1)"],
        ["d_i (link offset)", "distance from x_(i-1) to x_i", "along z_(i-1)"],
        ["a_i (link length)", "distance from z_(i-1) to z_i", "along x_i"],
        ["α_i (link twist)", "angle from z_(i-1) to z_i", "about x_i"],
      ], caption: "Standard DH. For a revolute joint θ_i is the variable; for a prismatic joint d_i is." },
      { t: "formula", text: String.raw`ⁱ⁻¹T_i = Rz(θ)·Tz(d)·Tx(a)·Rx(α)

        | cθ   -sθ·cα    sθ·sα   a·cθ |
      = | sθ    cθ·cα   -cθ·sα   a·sθ |
        | 0     sα       cα      d    |
        | 0     0        0       1    |

⁰T_n = ⁰T_1 · ¹T_2 · ... · ⁿ⁻¹T_n`, caption: "One matrix shape for every joint. FK is the product, a moving-frame composition." },

      { t: "h", text: "DH for a 4-servo desktop arm" },
      { t: "p", text: "The typical hobby arm (MeArm style or a 4-servo aluminium kit) has a base yaw servo, then shoulder, elbow and wrist-pitch servos whose axes are all horizontal and parallel, then a gripper. Our example dimensions: shoulder axis 0.10 m above the table, upper arm 0.12 m, forearm 0.12 m, wrist to fingertip centre 0.06 m." },
      { t: "diagram", text: String.raw`
               a3 = 0.12          a4 = 0.06
       elbow ●──────────────● wrist ────▶ tip
            /
  a2 = 0.12/
          /
 shoulder ●   (joints 2, 3, 4 all pitch about parallel horizontal axes)
          │
 d1 = 0.10│  joint 1: yaw about vertical z0
     ═════●═════ table`, caption: "Side view in the arm's vertical plane." },
      { t: "table", head: ["i", "θ_i", "d_i (m)", "a_i (m)", "α_i"], rows: [
        ["1", "θ1", "0.10", "0", "+90°"],
        ["2", "θ2", "0", "0.12", "0"],
        ["3", "θ3", "0", "0.12", "0"],
        ["4", "θ4", "0", "0.06", "0"],
      ], caption: "Standard DH table. z0 is vertical; α1 = 90° tips z1 horizontal to become the shoulder axis; joints 2 to 4 are parallel so α = 0." },
      { t: "p", text: "Multiplying out, the yaw splits off neatly. Let r be the horizontal reach in the arm's plane:" },
      { t: "formula", text: String.raw`r = a2·cos θ2 + a3·cos(θ2 + θ3) + a4·cos(θ2 + θ3 + θ4)
z = d1 + a2·sin θ2 + a3·sin(θ2 + θ3) + a4·sin(θ2 + θ3 + θ4)
x = r·cos θ1,   y = r·sin θ1
pitch of the gripper  φ = θ2 + θ3 + θ4`, caption: "A 3R planar arm on a turntable." },
      { t: "p", text: "Worked example: θ = (30°, 45°, -60°, -30°). The absolute link angles in the vertical plane are 45°, -15° and -45°. r = 0.12 × 0.7071 + 0.12 × 0.9659 + 0.06 × 0.7071 = 0.0849 + 0.1159 + 0.0424 = 0.2432 m. z = 0.10 + 0.0849 - 0.0311 - 0.0424 = 0.1114 m. x = 0.2432 × cos 30° = 0.2106 m and y = 0.2432 × 0.5 = 0.1216 m. The Python below multiplies the full DH matrices and prints the same (0.2106, 0.1216, 0.1114), which is the check that the table and the closed form agree. A second sanity check costs nothing: at all-zero angles the arm lies flat along x, so the tip should be at (0.30, 0, 0.10), and it is." },
      { t: "snippet", lang: "python", code: String.raw`import math

# Standard DH table for a 4-servo desktop arm: (d, a, alpha); theta is the joint variable.
D1, A2, A3, A4 = 0.10, 0.12, 0.12, 0.06   # metres
DH = [(D1, 0.0, math.pi / 2), (0.0, A2, 0.0), (0.0, A3, 0.0), (0.0, A4, 0.0)]

def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(4)) for j in range(4)] for i in range(4)]

def dh(theta, d, a, alpha):
    ct, st, ca, sa = math.cos(theta), math.sin(theta), math.cos(alpha), math.sin(alpha)
    return [[ct, -st * ca,  st * sa, a * ct],
            [st,  ct * ca, -ct * sa, a * st],
            [0.0,      sa,       ca,      d],
            [0.0,     0.0,      0.0,    1.0]]

def fk(q):
    T = [[1.0 if i == j else 0.0 for j in range(4)] for i in range(4)]
    for qi, (d, a, alpha) in zip(q, DH):
        T = matmul(T, dh(qi, d, a, alpha))
    return T  # base -> gripper tip

if __name__ == "__main__":
    T = fk([math.radians(v) for v in (30, 45, -60, -30)])
    print("tip:", [round(T[i][3], 4) for i in range(3)])   # [0.2106, 0.1216, 0.1114]
    T0 = fk([0, 0, 0, 0])
    assert all(abs(T0[i][3] - v) < 1e-12 for i, v in enumerate((0.30, 0.0, 0.10)))`, caption: "Pure-Python FK from the DH table. Run it; the assert is the zero-pose test." },
      { t: "note", kind: "warn", text: "DH zero angles are rarely servo zero angles. A hobby servo commanded to 90° might correspond to θ2 = 0 in your table, and it may turn the opposite way. Keep a per-joint `offset` and `sign` and calibrate them by commanding known poses. This is where most hardware FK errors live." },

      { t: "h", text: "Standard versus modified DH" },
      { t: "p", text: "Craig's **modified (proximal) DH** attaches frame i at the near end of link i, with z_i along joint i itself, and orders the operations as Rx(α_(i-1))·Tx(a_(i-1))·Rz(θ_i)·Tz(d_i). The parameters shift index by one, so a table written for one convention gives garbage in the other. Both describe the same robot. Always state which you use; many datasheets and textbooks (for example, Peter Corke's Robotics Toolbox has separate `RevoluteDH` and `RevoluteMDH` link classes) differ. ROS does not use DH at all: URDF describes each joint with an arbitrary origin transform and an axis, which is more flexible." },

      { t: "deep", title: "Modified DH table for the same arm, and a URDF equivalent", blocks: [
        { t: "table", head: ["i", "α_(i-1)", "a_(i-1) (m)", "θ_i", "d_i (m)"], rows: [
          ["1", "0", "0", "θ1", "0.10"],
          ["2", "+90°", "0", "θ2", "0"],
          ["3", "0", "0.12", "θ3", "0"],
          ["4", "0", "0.12", "θ4", "0"],
          ["tool", "0", "0.06", "0", "0"],
        ], caption: "Modified DH needs an extra fixed tool row to reach the fingertip, because each row places the frame at a joint, not at the end of a link." },
        { t: "p", text: "In URDF, each `<joint>` has an `<origin xyz rpy>` from the parent link frame to the joint frame and an `<axis>`. Our shoulder would be origin xyz=\"0 0 0.10\" with axis \"0 -1 0\" (so positive angles lift the arm, matching DH where z1 = -y0 at θ1 = 0). The elbow would be origin xyz=\"0.12 0 0\" with the same axis. URDF frames can be placed wherever is convenient, so you lose DH's compactness but gain freedom to match CAD." },
      ] },
      { t: "deep", title: "Product of exponentials: the modern alternative", blocks: [
        { t: "p", text: "Lynch and Park's Modern Robotics uses the **product of exponentials (PoE)** formula. Pick only the base frame and the tool pose M at zero configuration. Each joint is described by a screw axis S_i (its direction and a point on it) in the base frame. Then T(θ) = e^([S1]θ1) · e^([S2]θ2) · ... · M. There are no per-link frames to assign, no special cases for parallel axes, and the Jacobian falls out directly." },
        { t: "formula", text: String.raw`For our arm at zero pose, tip M at (0.30, 0, 0.10):
S1: ω = (0, 0, 1),  through origin
S2: ω = (0, -1, 0), through (0, 0, 0.10)
S3: ω = (0, -1, 0), through (0.12, 0, 0.10)
S4: ω = (0, -1, 0), through (0.24, 0, 0.10)`, caption: "Screw axes read straight off the zero-pose drawing." },
      ] },
    ],
    mistakes: [
      "**Using absolute angles where the formula wants relative ones.** In the 2R formula θ2 is measured from link 1, so link 2's absolute angle is θ1 + θ2.",
      "**Mixing standard and modified DH parameters** from different sources in one table.",
      "**Forgetting the servo offset and direction** between DH zero and the servo's own zero.",
      "**Not testing the zero pose.** At all-zero angles the drawing tells you where the tip must be. Assert it.",
      "**Putting the twist α on the wrong row.** In standard DH α_i is the angle from z_(i-1) to z_i, so the shoulder's 90° tilt belongs to row 1.",
    ],
    practice: {
      kind: "bench",
      task: "Write and validate FK for your own small arm (or the example dimensions if you have none).",
      steps: [
        "Measure your arm's link lengths with vernier calipers, axis centre to axis centre.",
        "Draw the zero pose, assign standard DH frames and fill the table.",
        "Code FK as in the lesson and assert the zero-pose tip position.",
        "Command three poses to the servos (with offsets and signs calibrated), measure the fingertip position with a ruler from a marked base origin, and compare with FK. Record the errors; expect a few millimetres from servo backlash.",
      ],
    },
    quiz: [
      {
        q: "A planar 2R arm has L1 = 0.3 m, L2 = 0.2 m, θ1 = 90°, θ2 = -90°. Where is the tip?",
        options: ["(0.2, 0.3)", "(0.3, 0.2)", "(0, 0.5)", "(0.2, 0.1)"],
        answer: 0,
        why: "Link 1 points straight up to (0, 0.3). Link 2's absolute angle is 90 - 90 = 0°, so it adds (0.2, 0). Tip at (0.2, 0.3).",
      },
      {
        q: "In standard DH, which parameter is the variable for a revolute joint?",
        options: ["a_i", "α_i", "θ_i", "d_i"],
        answer: 2,
        why: "A revolute joint rotates about z_(i-1), which is θ_i. For a prismatic joint d_i would vary.",
      },
      {
        q: "For the 4-servo arm in the lesson, what is the tip position when all joint angles are zero?",
        options: ["(0.24, 0, 0.10)", "(0, 0, 0.40)", "(0.30, 0, 0)", "(0.30, 0, 0.10)"],
        answer: 3,
        why: "All links lie horizontal along x at the shoulder height: reach 0.12 + 0.12 + 0.06 = 0.30 m, height d1 = 0.10 m.",
      },
      {
        q: "What is the reachable distance range from the base for a 2R arm with L1 = 0.3 m and L2 = 0.2 m, ignoring joint limits?",
        options: ["0 to 0.5 m", "0.1 m to 0.5 m", "0.2 m to 0.3 m", "0.3 m to 0.5 m"],
        answer: 1,
        why: "Fully folded gives |L1 - L2| = 0.1 m; fully stretched gives L1 + L2 = 0.5 m.",
      },
      {
        q: "Why does row 1 of the desktop arm's DH table have α1 = 90°?",
        options: [
          "Because the base servo has a 90° range",
          "Because the shoulder axis z1 is horizontal while the base axis z0 is vertical, a 90° twist about x1",
          "Because the upper arm starts pointing up",
          "It is a convention that every first row has 90°",
        ],
        answer: 1,
        why: "α_i is the twist from z_(i-1) to z_i. The yaw axis is vertical and the shoulder axis horizontal, so they are 90° apart.",
      },
    ],
  },

  "a10-inverse-kinematics": {
    id: "a10-inverse-kinematics",
    outcomes: [
      "Solve 2R inverse kinematics in closed form and pick elbow-up or elbow-down",
      "Solve position plus pitch IK for a 4-DOF arm by decoupling the wrist",
      "Detect unreachable targets and handle joint limits",
      "Implement numerical IK with the Jacobian transpose and damped least squares",
    ],
    blocks: [
      { t: "h", text: "Why IK is the hard direction" },
      { t: "p", text: "You almost never know the joint angles you want. You know where the part is (from a camera, in the base frame) and how the gripper should approach it. **Inverse kinematics (IK)** turns that desired pose into joint angles. Unlike FK, IK may have no solution (the target is out of reach), several (elbow up or down), or infinitely many (a redundant arm). A good IK solver tells you which case you are in." },
      { t: "p", text: "There are two families. **Analytic (closed-form) IK** uses geometry to write the angles as formulas; it is exact, fast and lists every solution, but only exists for suitable geometries. **Numerical IK** iterates using the Jacobian from an initial guess; it works for any arm but finds one solution near the guess, and can fail to converge. Small arms with parallel pitch joints, like ours, always have a closed form. Use it." },

      { t: "h", text: "Closed-form IK for the 2R arm" },
      { t: "p", text: "Given the target (x, y), the distance from base to tip fixes the elbow angle by the law of cosines. Then the shoulder angle is the direction to the target minus the angle the forearm adds." },
      { t: "formula", text: String.raw`cos θ2 = (x² + y² - L1² - L2²) / (2·L1·L2)          must lie in [-1, 1], else unreachable
θ2 = atan2(±√(1 - cos²θ2), cos θ2)                   + and - give the two branches
θ1 = atan2(y, x) - atan2(L2·sin θ2, L1 + L2·cos θ2)`, caption: "Use atan2, never acos alone or atan of a ratio: atan2 gets the quadrant right." },
      { t: "p", text: "Worked example: L1 = 0.3 m, L2 = 0.2 m, target (0.35, 0.25). x² + y² = 0.1225 + 0.0625 = 0.185. cos θ2 = (0.185 - 0.09 - 0.04) / (2 × 0.3 × 0.2) = 0.055 / 0.12 = 0.4583. So θ2 = ±62.72°." },
      { t: "list", items: [
        "**θ2 = +62.72°**: θ1 = atan2(0.25, 0.35) - atan2(0.2 × 0.8889, 0.3 + 0.2 × 0.4583) = 35.54° - 24.41° = **11.13°**. The elbow is below the line from base to tip: **elbow down**.",
        "**θ2 = -62.72°**: θ1 = 35.54° + 24.41° = **59.95°**. The elbow is above the line: **elbow up**.",
      ] },
      { t: "p", text: "Check one branch by FK: the previous lesson computed exactly this case, θ = (11.13°, 62.72°), and got (0.350, 0.250). For the other branch: θ1 + θ2 = -2.77°, x = 0.3 × cos 59.95° + 0.2 × cos(-2.77°) = 0.1502 + 0.1998 = 0.350 and y = 0.3 × 0.8656 + 0.2 × (-0.0483) = 0.2597 - 0.0097 = 0.250. Both reach the target. Which one to use is a design choice: elbow up usually keeps the forearm clear of the table and is what desktop arms prefer, but joint limits and obstacles decide in the end." },
      { t: "widget", id: "two-link-arm" },

      { t: "h", text: "IK for the 4-servo arm: decouple the wrist" },
      { t: "p", text: "The 4-DOF desktop arm can set four things: tip x, y, z, and the gripper pitch φ (how steeply the gripper points down). It cannot set gripper roll or an arbitrary yaw separate from the base. The trick is **kinematic decoupling**: if you know the tip and the pitch, the wrist joint's position is fixed, a4 back along the gripper. That reduces the problem to a turntable plus a 2R arm." },
      { t: "list", ordered: true, items: [
        "**Base**: θ1 = atan2(y, x). The arm's vertical plane must contain the target. (θ1 + 180° with the arm reaching back over itself is a second solution if the joints allow it.)",
        "**Wrist centre** in that plane: r = √(x² + y²), r_w = r - a4·cos φ, z_w = z - d1 - a4·sin φ.",
        "**Shoulder and elbow**: solve 2R IK for (r_w, z_w) with L1 = a2, L2 = a3. Pick elbow up (θ3 negative here) or down.",
        "**Wrist**: θ4 = φ - θ2 - θ3, because the pitches add.",
      ] },
      { t: "p", text: "Worked example: tip at (0.20, 0.05, 0.15) m with the gripper pitched 45° down, φ = -45°. θ1 = atan2(0.05, 0.20) = 14.04°. r = 0.2062 m. r_w = 0.2062 - 0.06 × 0.7071 = 0.1637 m; z_w = 0.15 - 0.10 + 0.0424 = 0.0924 m. cos θ3 = (0.1637² + 0.0924² - 2 × 0.0144) / (2 × 0.0144) = (0.02681 + 0.00854 - 0.0288) / 0.0288 = 0.2275, so θ3 = ±76.85°. Running the solver gives elbow up θ = (14.04°, 67.87°, -76.85°, -36.02°) and elbow down θ = (14.04°, -8.98°, 76.85°, -112.87°). Both are fed back through FK in the code and land on the target to better than 10⁻⁹ m. That FK round trip is your test; always keep it." },
      { t: "snippet", lang: "python", code: String.raw`import math
# uses D1, A2, A3, A4 and fk() from the FK lesson

def ik(x, y, z, pitch, elbow_up=True):
    """Gripper tip at (x, y, z) with tool pitch (rad, 0 = horizontal, negative = pointing down)."""
    t1 = math.atan2(y, x)
    r = math.hypot(x, y)
    rw = r - A4 * math.cos(pitch)          # wrist centre in the arm's vertical plane
    zw = z - D1 - A4 * math.sin(pitch)
    c3 = (rw * rw + zw * zw - A2 * A2 - A3 * A3) / (2 * A2 * A3)
    if abs(c3) > 1:
        raise ValueError("target out of reach")
    s3 = -math.sqrt(1 - c3 * c3) if elbow_up else math.sqrt(1 - c3 * c3)
    t3 = math.atan2(s3, c3)
    t2 = math.atan2(zw, rw) - math.atan2(A3 * s3, A2 + A3 * c3)
    return [t1, t2, t3, pitch - t2 - t3]

if __name__ == "__main__":
    for up in (True, False):
        q = ik(0.20, 0.05, 0.15, math.radians(-45), up)
        T = fk(q)
        assert all(abs(T[i][3] - t) < 1e-9 for i, t in enumerate((0.20, 0.05, 0.15)))
        print("elbow up" if up else "elbow down", [round(math.degrees(v), 2) for v in q])
# elbow up [14.04, 67.87, -76.85, -36.02]
# elbow down [14.04, -8.98, 76.85, -112.87]`, caption: "Closed-form IK with an FK round-trip test. Paste below the FK code from the previous lesson." },
      { t: "p", text: "After IK, check **joint limits**. Hobby servos turn about 0° to 180°, and after your offsets that might be θ2 from 0° to 180° and θ3 from -150° to +30°, say. The elbow-down solution above needs θ4 = -112.87°, which most wrist servos cannot reach once their offset is applied; the elbow-up one is the practical choice. Your IK function should return all branches and let the caller reject those outside limits." },

      { t: "h", text: "Numerical IK" },
      { t: "p", text: "When the geometry has no closed form (a 6-DOF arm with an offset wrist, or a 7-DOF redundant arm), iterate. Let e = x_target - f(q) be the task-space error. The Jacobian J (next lesson) relates small joint changes to small tip motions, Δx ≈ J Δq. Three update rules:" },
      { t: "formula", text: String.raw`Jacobian transpose:      Δq = α · Jᵀ e                          simple, slow, never divides by zero
Pseudoinverse:           Δq = J⁺ e,  J⁺ = Jᵀ (J Jᵀ)⁻¹            fast, but explodes near singularities
Damped least squares:    Δq = Jᵀ (J Jᵀ + λ² I)⁻¹ e              fast and stable; λ trades accuracy for safety`, caption: "Repeat: compute e, update q, until |e| is below tolerance." },
      { t: "p", text: "**Damped least squares (DLS, Levenberg-Marquardt)** is what most practical solvers use. Far from singularities λ² is negligible and it behaves like the pseudoinverse; near a singularity J Jᵀ becomes nearly singular, and the λ² term caps how large Δq can get, so the arm moves slowly towards the target instead of whipping a joint round. Typical λ is 0.01 to 0.1 in the units of the task (metres here). The code solves position IK for the planar 3R chain inside our arm (shoulder, elbow, wrist) to reach (0.15, 0.15) and converges in 5 iterations." },
      { t: "snippet", lang: "python", code: String.raw`import math

L = [0.12, 0.12, 0.06]   # planar 3R: shoulder, elbow, wrist pitch links (m)

def fk(q):
    x = y = ang = 0.0
    for l, qi in zip(L, q):
        ang += qi
        x += l * math.cos(ang)
        y += l * math.sin(ang)
    return x, y

def jacobian(q):
    J = [[0.0] * 3, [0.0] * 3]
    for j in range(3):
        for k in range(j, 3):          # joint j moves every link from j outwards
            ang = sum(q[:k + 1])
            J[0][j] -= L[k] * math.sin(ang)
            J[1][j] += L[k] * math.cos(ang)
    return J

def ik_dls(target, q, lam=0.01, tol=1e-6, max_iter=200):
    for it in range(max_iter):
        x, y = fk(q)
        e = (target[0] - x, target[1] - y)
        if math.hypot(*e) < tol:
            return q, it
        J = jacobian(q)
        # A = J J^T + lam^2 I (2x2), solve A w = e, then dq = J^T w
        a = sum(v * v for v in J[0]) + lam * lam
        b = sum(u * v for u, v in zip(J[0], J[1]))
        d = sum(v * v for v in J[1]) + lam * lam
        det = a * d - b * b
        w = ((d * e[0] - b * e[1]) / det, (-b * e[0] + a * e[1]) / det)
        q = [qk + J[0][k] * w[0] + J[1][k] * w[1] for k, qk in enumerate(q)]
    raise RuntimeError("did not converge")

if __name__ == "__main__":
    q, it = ik_dls((0.15, 0.15), [0.3, 0.3, 0.3])
    print(f"converged in {it} iterations, q = {[round(math.degrees(v), 2) for v in q]} deg")
    print("reached:", [round(v, 6) for v in fk(q)])
# converged in 5 iterations, q = [-4.16, 65.47, 55.74] deg
# reached: [0.15, 0.15]`, caption: "Damped least squares, pure Python. The chain is redundant for a 2D target (3 joints, 2 constraints), so the answer depends on the start guess." },
      { t: "p", text: "Notice the answer is one of infinitely many: three joints for two coordinates leaves a free degree of freedom. Start from a different guess and you get a different, equally valid, configuration. That is why closed form, when it exists, is better for a small arm: you choose the branch deliberately instead of inheriting it from the initial guess." },

      { t: "deep", title: "Why DLS is stable: the singular value view", blocks: [
        { t: "p", text: "Write J = U Σ Vᵀ (singular value decomposition) with singular values σ_i. The pseudoinverse scales each task direction by 1/σ_i, which goes to infinity as σ_i → 0 near a singularity. DLS instead scales by σ_i / (σ_i² + λ²). For σ ≫ λ that is ≈ 1/σ, unchanged. For σ ≪ λ it is ≈ σ/λ², which goes to zero: the solver simply stops trying to move in directions the arm cannot move. The largest possible gain is 1/(2λ), reached at σ = λ, so λ directly bounds joint speed per unit error." },
        { t: "p", text: "Production solvers add more: adaptive λ that grows only near singularities, joint-limit handling by clamping or by weighting joints near their limits, and for redundant arms a null-space term (I - J⁺J)·z that moves the arm without moving the tip, for example to stay away from limits. MoveIt's default solver, KDL, is a Newton-Raphson pseudoinverse method; TRAC-IK runs a pseudoinverse solver and an SQP optimiser in parallel and takes whichever finishes first, which is why it fails far less often." },
      ] },
      { t: "deep", title: "How many IK solutions can an arm have?", blocks: [
        { t: "p", text: "A planar 2R arm has at most 2. Our 4-DOF arm has up to 4 for a given (x, y, z, φ): two elbow branches, times the base facing the target or turned 180° with the shoulder reaching back overhead. A general 6R industrial arm with a spherical wrist (three wrist axes meeting at a point) has up to 8: shoulder left/right, elbow up/down, wrist flip/no flip. Pieper showed in 1968 that a spherical wrist is exactly what makes closed-form decoupling possible, which is why nearly every industrial arm is built that way. A general 6R arm without that structure can have up to 16 solutions and needs a degree-16 polynomial." },
        { t: "p", text: "Singular targets are on the boundary between branches: at full stretch (cos θ2 = 1) the two elbow solutions merge into one. Numerically, √(1 - c²) for c slightly above 1 from rounding gives a math domain error; clamp c to [-1, 1] when it exceeds 1 by less than about 1e-9, and raise otherwise." },
      ] },
    ],
    mistakes: [
      "**Using acos or atan(y/x) instead of atan2.** They lose the quadrant, and you get a mirror-image arm.",
      "**Not checking |cos θ2| ≤ 1.** Unreachable targets then crash with a domain error deep in the code, or worse, wrap silently in another language.",
      "**Skipping the FK round trip.** Feed every IK answer through FK and assert the error is tiny. It catches sign and offset bugs instantly.",
      "**Ignoring joint limits.** A mathematically valid branch the servo cannot reach will slam into the end stop.",
      "**Using a plain pseudoinverse near singularities.** Joint velocities explode; use damped least squares.",
      "**Forgetting the wrist offset when decoupling.** The 2R problem must target the wrist centre, not the fingertip.",
    ],
    practice: {
      kind: "bench",
      task: "Make the arm touch marked points on paper using your IK.",
      steps: [
        "Print a grid on A4 paper and tape it in front of the arm with a measured origin in the base frame.",
        "Pick six points at table height plus 1 cm, with pitch -90° (gripper vertical). Solve IK, keep only branches inside joint limits, and print the chosen angles.",
        "Command the servos with calibrated offsets and signs and measure where a pen in the gripper lands. Tabulate the errors.",
        "Try a point just beyond reach and confirm your code reports it rather than moving.",
        "Run the DLS solver from two different initial guesses on the same target and explain why the joint answers differ.",
      ],
    },
    quiz: [
      {
        q: "For a 2R arm with L1 = 0.3 m and L2 = 0.2 m, what is cos θ2 for the target (0.4, 0.3)?",
        options: ["0.25", "0.5", "1.0", "0.75"],
        answer: 2,
        why: "x² + y² = 0.16 + 0.09 = 0.25, so cos θ2 = (0.25 - 0.09 - 0.04) / 0.12 = 1.0. The target is 0.5 m away, exactly L1 + L2: the arm is fully stretched (a singular, single-solution case).",
      },
      {
        q: "IK computes cos θ2 = 1.3. What does that mean?",
        options: [
          "The elbow must bend by 1.3 radians",
          "The target is farther than L1 + L2 (or nearer than |L1 - L2|), so it is unreachable",
          "Choose the elbow-down branch",
          "The arm is at a singularity but the target is reachable",
        ],
        answer: 1,
        why: "A cosine outside [-1, 1] means no triangle exists with those sides: the point is outside the workspace.",
      },
      {
        q: "When decoupling the 4-DOF arm's IK, why do we first subtract a4 along the gripper direction?",
        options: [
          "To find the wrist joint position, which turns the rest into a 2R problem",
          "Because a4 is always zero in DH",
          "To convert from degrees to radians",
          "To find the base yaw angle",
        ],
        answer: 0,
        why: "With tip and pitch known, the wrist joint lies a4 back along the gripper. The shoulder and elbow then just have to reach that point.",
      },
      {
        q: "Why is damped least squares preferred over the plain pseudoinverse for numerical IK?",
        options: [
          "It always finds the elbow-up solution",
          "It needs no Jacobian",
          "The λ² term keeps joint steps bounded near singularities, where the pseudoinverse blows up",
          "It is exact in one step",
        ],
        answer: 2,
        why: "J Jᵀ becomes nearly singular near a singularity. Adding λ² I keeps the inverse well conditioned and limits Δq.",
      },
      {
        q: "A 4-DOF arm solves θ2, θ3 for its wrist centre and wants gripper pitch φ = -90°. With θ2 = 60° and θ3 = -70°, what is θ4?",
        options: ["-80°", "-100°", "-20°", "+80°"],
        answer: 0,
        why: "Pitches add: θ4 = φ - θ2 - θ3 = -90 - 60 + 70 = -80°.",
      },
    ],
  },

  "a10-jacobian-and-mobile-robots": {
    id: "a10-jacobian-and-mobile-robots",
    outcomes: [
      "Derive the Jacobian of a planar arm and use it to map joint speeds to tip velocity",
      "Find singularities from det J and explain what the arm physically loses there",
      "Relate joint torques to tip forces with τ = Jᵀ F",
      "Write the kinematic models of differential drive, Ackermann (bicycle) and mecanum robots",
    ],
    blocks: [
      { t: "h", text: "Velocity kinematics" },
      { t: "p", text: "FK maps angles to positions. Differentiate it and you get the map from joint velocities q̇ to the end effector's velocity ẋ. That linear map, a matrix that depends on the configuration, is the **Jacobian** J(q). It drives numerical IK, resolved-rate (Cartesian velocity) control, force control, and it tells you where the arm is weak or stuck. Then we turn to wheeled robots, whose kinematics are also velocity relations but with a twist: the wheels constrain velocity, not position." },
      { t: "formula", text: String.raw`ẋ = J(q) · q̇          J_ij = ∂x_i / ∂q_j

Planar 2R:
J = | -L1·s1 - L2·s12    -L2·s12 |        s1 = sin θ1,  s12 = sin(θ1 + θ2)
    |  L1·c1 + L2·c12     L2·c12 |        c1 = cos θ1,  c12 = cos(θ1 + θ2)`, caption: "Column j is the tip velocity produced by joint j alone moving at 1 rad/s." },
      { t: "p", text: "The columns have a geometric meaning you can draw: a revolute joint moving at 1 rad/s makes the tip move perpendicular to the line from that joint to the tip, at a speed equal to that distance. Column 2 is just link 2 swinging; column 1 is the whole arm swinging about the base." },
      { t: "p", text: "Worked example: L1 = 0.3 m, L2 = 0.2 m, θ1 = 0°, θ2 = 90°. Then s1 = 0, c1 = 1, s12 = 1, c12 = 0. J = |-0.2 -0.2; 0.3 0|. If q̇ = (0.5, 1.0) rad/s, ẋ = -0.2 × 0.5 - 0.2 × 1.0 = -0.30 m/s and ẏ = 0.3 × 0.5 + 0 = 0.15 m/s. Check by picture: the tip is at (0.3, 0.2). Joint 2 alone at 1 rad/s swings the 0.2 m link (pointing along +y) towards -x at 0.2 m/s; joint 1 at 0.5 rad/s swings the whole arm about the origin, moving the tip perpendicular to (0.3, 0.2) at 0.5 × 0.36 = 0.18 m/s, i.e. velocity (-0.1, 0.15). Sum: (-0.3, 0.15). It agrees." },

      { t: "h", text: "Singularities" },
      { t: "p", text: "A **singular configuration** is one where J loses rank: some direction of tip motion cannot be produced by any joint velocity. For a square J, det J = 0. For the 2R arm:" },
      { t: "formula", text: String.raw`det J = L1·L2·sin θ2

det J = 0  ⇔  θ2 = 0° (fully stretched)  or  θ2 = 180° (fully folded)`, caption: "The 2R arm is singular only at the workspace boundaries." },
      { t: "p", text: "Physically, at full stretch both columns of J point the same way (perpendicular to the arm); the tip cannot move radially, outward or inward, at that instant. The consequences are practical and serious:" },
      { t: "list", items: [
        "**Infinite joint speeds**: asking for a small radial tip velocity near the singularity needs joint velocities proportional to 1 / sin θ2. A Cartesian straight-line move passing near the boundary will whip the joints and hit velocity limits.",
        "**Infinite force capacity** in the lost direction: the arm can resist a radial push with no joint torque, because the links are aligned and take it as compression (think of locking your elbow to push a door).",
        "**IK branches merge**: elbow up and elbow down become the same solution, so a planner crossing the singularity has to choose.",
        "**Wrist singularities** on 6-DOF arms: when two wrist axes align (wrist pitch at 0°), roll and yaw become the same motion. Industrial controllers warn and stop for this.",
      ] },
      { t: "p", text: "A useful scalar is **manipulability** w = √det(J Jᵀ), which for the square 2R case is |det J|. It is largest at θ2 = ±90° and zero at singularities. Designers pick a home pose and task area where w is comfortably large." },

      { t: "h", text: "Forces through the Jacobian" },
      { t: "p", text: "By conservation of power (joint power τ · q̇ equals tip power F · ẋ = F · J q̇, for all q̇), the same Jacobian maps a force F at the tip back to the joint torques needed to hold it:" },
      { t: "formula", text: String.raw`τ = Jᵀ · F

Example: θ = (0°, 90°), F = (0, -2) N  (2 N downward weight at the tip)
τ1 = -0.2·0 + 0.3·(-2) = -0.6 N·m
τ2 = -0.2·0 + 0·(-2)   =  0   N·m`, caption: "Joint 2 needs no torque because link 2 points straight up through the load line." },
      { t: "p", text: "Sanity check: the tip is at x = 0.3 m, so the base must resist 2 N × 0.3 m = 0.6 N·m. Link 2 is vertical and the load passes through joint 2's axis, so joint 2 carries nothing. The minus sign means the torque is clockwise, holding the weight up. This relation is the basis of motor sizing in the next lesson and of force control in the manipulation module." },

      { t: "h", text: "Mobile robot kinematics" },
      { t: "p", text: "A wheeled robot's pose in the plane is (x, y, θ). Its wheels do not slip sideways, so it cannot move in every direction instantaneously: a car cannot slide sideways into a parking space, yet it can get there by manoeuvring. Such velocity constraints that cannot be integrated into position constraints are called **nonholonomic**. Each drive type gives a different relation between wheel speeds and body velocity." },
      { t: "h", text: "Differential drive" },
      { t: "p", text: "Two independently driven wheels of radius r on one axle, separated by track width L (plus casters). Each wheel's rim speed is r·ω. The body's forward speed is their average and its turn rate is their difference over L:" },
      { t: "formula", text: String.raw`v = r·(ω_R + ω_L) / 2          ω = r·(ω_R - ω_L) / L

ẋ = v·cos θ,   ẏ = v·sin θ,   θ̇ = ω          (the robot can never have sideways velocity)

Inverse:  ω_R = (v + ω·L/2) / r,   ω_L = (v - ω·L/2) / r`, caption: "Unicycle model of a differential-drive robot." },
      { t: "p", text: "Worked example: r = 33 mm, L = 160 mm (a typical small robot chassis), ω_R = 10 rad/s, ω_L = 8 rad/s. v = 0.033 × 18 / 2 = 0.297 m/s; ω = 0.033 × 2 / 0.16 = 0.4125 rad/s. The turning radius is v / ω = 0.72 m. Check: the right wheel is at 0.72 + 0.08 = 0.80 m from the centre of the turn and moves at 0.80 × 0.4125 = 0.330 m/s = 10 × 0.033. Correct." },
      { t: "h", text: "Ackermann steering and the bicycle model" },
      { t: "p", text: "Cars steer the front wheels. Ackermann geometry turns the inner wheel more than the outer so both roll around the same centre without scrubbing. For planning and control we lump the two front wheels into one and the two rear into one: the **kinematic bicycle model**, with wheelbase L and steering angle δ, referenced to the rear axle:" },
      { t: "formula", text: String.raw`ẋ = v·cos θ,   ẏ = v·sin θ,   θ̇ = v·tan δ / L

Turning radius  R = L / tan δ                     (minimum R at maximum δ)
Example: L = 2.6 m, δ = 20°  →  R = 2.6 / 0.364 = 7.14 m;  at v = 5 m/s, θ̇ = 0.70 rad/s`, caption: "Kinematic bicycle model, valid at low speed where tyres do not slip." },
      { t: "p", text: "Unlike a differential drive, an Ackermann vehicle cannot turn on the spot: it has a minimum turning radius. Planners for such vehicles must respect it (Reeds-Shepp or Dubins curves). For a small RC-car platform with L = 0.26 m and δ_max = 25°, R_min = 0.26 / 0.466 = 0.56 m." },
      { t: "h", text: "Omnidirectional: mecanum wheels" },
      { t: "p", text: "A mecanum wheel has free rollers at 45° around its rim, so it pushes the body diagonally. With four of them (rollers forming an X when viewed from above), the robot can move in x, y and rotate independently: it is **holonomic** in the plane. Let l_x and l_y be half the wheelbase and half the track, and number wheels front-left 1, front-right 2, rear-left 3, rear-right 4:" },
      { t: "formula", text: String.raw`ω1 = (v_x - v_y - (l_x + l_y)·ω_z) / r          front left
ω2 = (v_x + v_y + (l_x + l_y)·ω_z) / r          front right
ω3 = (v_x + v_y - (l_x + l_y)·ω_z) / r          rear left
ω4 = (v_x - v_y + (l_x + l_y)·ω_z) / r          rear right

Forward:  v_x = r(ω1+ω2+ω3+ω4)/4,  v_y = r(-ω1+ω2+ω3-ω4)/4,  ω_z = r(-ω1+ω2-ω3+ω4) / (4(l_x+l_y))`, caption: "x forward, y left, z up. Swap signs if your rollers are mounted in the other (O) pattern." },
      { t: "p", text: "Worked example: r = 0.04 m, l_x + l_y = 0.27 m, command v_x = 0.3 m/s, v_y = 0.2 m/s, ω_z = 0.5 rad/s. ω1 = (0.3 - 0.2 - 0.135) / 0.04 = -0.875 rad/s, ω2 = 15.875, ω3 = 9.125, ω4 = 5.875 rad/s. Feeding these back through the forward equations returns exactly (0.3, 0.2, 0.5), which was checked in Python. Mecanum robots slip more than plain wheels, so odometry from wheel encoders drifts faster; pair them with an IMU." },

      { t: "deep", title: "The geometric Jacobian for a 3D arm", blocks: [
        { t: "p", text: "For spatial arms we want both linear velocity v and angular velocity ω of the end effector, a 6 by n matrix. Column i for a revolute joint with axis z_(i-1) (a unit vector in the base frame) and origin o_(i-1) is built from the FK frames you already compute:" },
        { t: "formula", text: String.raw`revolute i:   J_v,i = z_(i-1) × (o_n - o_(i-1))      J_ω,i = z_(i-1)
prismatic i:  J_v,i = z_(i-1)                        J_ω,i = 0`, caption: "Everything comes from the columns of ⁰T_(i-1): z is column 3, o is column 4." },
        { t: "p", text: "For our 4-DOF arm, J is 6 by 4, so it has rank at most 4: the arm can never produce arbitrary 6D velocities. Its position sub-Jacobian is 3 by 4; the arm is singular for position when the tip lies on the base yaw axis (r = 0, yaw does nothing) or when shoulder-to-wrist is fully stretched or folded (θ3 = 0° or 180°)." },
      ] },
      { t: "deep", title: "Why nonholonomic does not mean you cannot get there", blocks: [
        { t: "p", text: "A differential drive has three pose coordinates but only two velocity inputs. The constraint ẋ·sin θ - ẏ·cos θ = 0 (no sideways slip) cannot be integrated to a relation among x, y, θ, so all three remain reachable. Control theory explains this with Lie brackets: alternating forward and turning motions generates net sideways displacement, exactly what parallel parking is." },
        { t: "p", text: "A deep consequence (Brockett's theorem, 1983) is that no smooth, time-invariant feedback law can stabilise a nonholonomic robot to a point pose. This is why go-to-pose controllers for differential drive robots either use discontinuous laws (turn, drive, turn) or polar-coordinate controllers that are undefined exactly at the goal, and why Nav2's controllers track a path rather than regulating to a point." },
      ] },
    ],
    mistakes: [
      "**Evaluating J at the wrong configuration.** J changes with q; recompute it each control cycle.",
      "**Commanding Cartesian velocity straight through a singularity.** Joint speeds blow up. Use damping, slow down, or plan around it.",
      "**Using J⁻¹ for force mapping.** Torques from tip force use Jᵀ, not the inverse.",
      "**Confusing track width L with wheel radius** in the differential drive turn rate, or using diameter instead of radius.",
      "**Wrong mecanum roller pattern.** If the robot spins when it should strafe, your wheels are in the O pattern or a motor is reversed; check one wheel at a time.",
    ],
    practice: {
      kind: "bench",
      task: "Measure a differential-drive robot's kinematics and compare with the model.",
      steps: [
        "On a two-wheeled robot with encoders (ESP32 DevKit or Uno), measure wheel radius by rolling ten turns and track width with calipers.",
        "Command ω_R = 10 rad/s and ω_L = 8 rad/s and let it drive a circle on a smooth floor marked with tape. Measure the circle's radius and compare with r(ω_R + ω_L)/2 ÷ r(ω_R - ω_L)/L.",
        "Command a spin on the spot (ω_R = -ω_L) for 10 turns and count; compute the effective track width from the result. It is usually larger than measured, because of tyre scrub.",
        "In Python, compute det J for the 2R arm across θ2 from -180° to 180° and plot or tabulate it; identify the singular angles.",
      ],
    },
    quiz: [
      {
        q: "For the planar 2R arm, where are the singularities?",
        options: [
          "At θ1 = 0° and 180°",
          "Whenever the tip is on the x axis",
          "At θ2 = 0° and θ2 = 180°, fully stretched or fully folded",
          "At θ2 = ±90°",
        ],
        answer: 2,
        why: "det J = L1·L2·sin θ2, which is zero at θ2 = 0° and 180°. θ2 = ±90° is where manipulability is largest.",
      },
      {
        q: "Near a singularity, what happens to the joint speeds needed for a small tip velocity in the lost direction?",
        options: ["They approach zero", "They grow without bound", "They stay constant", "They reverse sign only"],
        answer: 1,
        why: "Inverting J involves dividing by det J, which tends to zero. Joint speeds grow like 1/sin θ2.",
      },
      {
        q: "A differential drive robot has r = 0.05 m, L = 0.2 m, ω_R = 6 rad/s, ω_L = 4 rad/s. What are v and ω?",
        options: ["v = 0.25 m/s, ω = 0.5 rad/s", "v = 0.5 m/s, ω = 0.1 rad/s", "v = 0.25 m/s, ω = 0.1 rad/s", "v = 0.5 m/s, ω = 0.5 rad/s"],
        answer: 0,
        why: "v = 0.05 × (6 + 4) / 2 = 0.25 m/s. ω = 0.05 × (6 - 4) / 0.2 = 0.5 rad/s.",
      },
      {
        q: "A bicycle-model vehicle has wheelbase 2 m and steers 45°. What is its turning radius?",
        options: ["1 m", "2.83 m", "4 m", "2 m"],
        answer: 3,
        why: "R = L / tan δ = 2 / tan 45° = 2 / 1 = 2 m.",
      },
      {
        q: "A 2R arm at θ = (0°, 90°) with L1 = 0.3 m, L2 = 0.2 m holds a 2 N downward load at the tip. What torque does the base joint need?",
        options: ["0.4 N·m", "1.0 N·m", "0.6 N·m", "0 N·m"],
        answer: 2,
        why: "The tip is 0.3 m horizontally from the base, so the moment is 2 × 0.3 = 0.6 N·m. τ = Jᵀ F gives the same.",
      },
      {
        q: "What can a four-wheel mecanum robot do that a differential drive cannot?",
        options: [
          "Turn on the spot",
          "Move sideways without rotating, because it is holonomic in the plane",
          "Drive without motors",
          "Climb stairs",
        ],
        answer: 1,
        why: "Differential drives also spin in place, but cannot translate sideways. Mecanum rollers allow independent v_x, v_y and ω_z.",
      },
    ],
  },

  "a10-dynamics-sizing-trajectories": {
    id: "a10-dynamics-sizing-trajectories",
    outcomes: [
      "Derive the equation of motion of a one-link arm with the Lagrangian",
      "Build a worst-case torque budget for a servo arm and choose a servo or gear ratio with margin",
      "Generate cubic, quintic and trapezoidal trajectories and compute their peak velocity and acceleration",
      "Choose between joint-space and task-space trajectories, and integrate FK and IK into the exit project",
    ],
    blocks: [
      { t: "h", text: "Why kinematics is not enough" },
      { t: "p", text: "Kinematics says where the arm goes; it says nothing about whether the motors can get it there. A servo that is fine holding the arm folded can stall when the arm stretches out with a load, and a trajectory that is geometrically perfect can demand an acceleration no motor can give. This lesson gives you enough dynamics to size motors honestly, and the trajectory tools that keep the demanded torque within what you have." },

      { t: "h", text: "Dynamics of a one-link arm, by Lagrange" },
      { t: "p", text: "Take a uniform rod of mass m and length l pivoting at one end about a horizontal axis, with θ measured up from horizontal. The **Lagrangian** method needs only energies: L = K - P, then τ = d/dt(∂L/∂θ̇) - ∂L/∂θ for each joint." },
      { t: "formula", text: String.raw`K = ½·I·θ̇²,        I = m·l²/3          (rod about its end)
P = m·g·(l/2)·sin θ                      (centre of mass height)

∂L/∂θ̇ = I·θ̇          d/dt → I·θ̈
∂L/∂θ = -m·g·(l/2)·cos θ

τ = I·θ̈ + m·g·(l/2)·cos θ`, caption: "Inertia term plus gravity term. Add a point payload M at the tip: I gains M·l², gravity gains M·g·l·cos θ." },
      { t: "p", text: "Example: a 0.2 kg, 0.25 m rod. I = 0.2 × 0.0625 / 3 = 0.00417 kg·m². Holding it horizontal (θ = 0) needs 0.2 × 9.81 × 0.125 = 0.245 N·m. Accelerating it at 2 rad/s² adds only 0.0083 N·m. For slow hobby arms, **gravity dominates**; inertia matters for fast or heavy arms." },
      { t: "p", text: "For a multi-link arm the same recipe gives the standard form below. You will not derive the full matrices by hand in this course, but you should know what each term is, because controllers and simulators are built on it." },
      { t: "formula", text: String.raw`τ = M(q)·q̈ + C(q, q̇)·q̇ + g(q) + τ_friction

M(q)       inertia matrix (symmetric, positive definite, changes with pose)
C(q, q̇)q̇   Coriolis and centrifugal torques (grow with speed squared)
g(q)       gravity torques`, caption: "The manipulator equation." },

      { t: "h", text: "A worked torque budget for a servo arm" },
      { t: "p", text: "Size the shoulder servo for our 4-servo arm. The worst case is the arm stretched horizontally, because every mass is then at its largest lever arm. List each mass and its horizontal distance from the shoulder axis:" },
      { t: "table", head: ["Item", "Mass (kg)", "Distance (m)", "m × d (kg·m)"], rows: [
        ["Upper arm link (centre)", "0.030", "0.06", "0.00180"],
        ["Elbow servo", "0.055", "0.12", "0.00660"],
        ["Forearm link (centre)", "0.030", "0.18", "0.00540"],
        ["Wrist servo", "0.055", "0.24", "0.01320"],
        ["Gripper with its servo", "0.080", "0.27", "0.02160"],
        ["Payload", "0.050", "0.30", "0.01500"],
        ["Total", "0.300", "", "0.06360"],
      ], caption: "Typical masses: an MG996R-class servo is about 55 g." },
      { t: "formula", text: String.raw`Gravity:        τ_g = g · Σ m·d = 9.81 × 0.0636 = 0.624 N·m
Inertia:        I ≈ Σ m·d² = 0.0154 kg·m²   (point masses; links' own I is small)
Acceleration:   α = 2.36 rad/s² (the cubic profile below, 90° in 2 s)
                τ_a = I·α = 0.0154 × 2.36 = 0.036 N·m
Total:          τ = 0.660 N·m = 0.660 / 9.81 × 100 = 6.7 kg·cm`, caption: "Hobby servo torque is quoted in kg·cm: 1 kg·cm = 0.0981 N·m." },
      { t: "p", text: "Now apply margin. A servo's quoted figure is **stall torque**, usually at 6 V; it can only deliver a fraction of it continuously without overheating, and the figure falls at lower voltage. A sound rule is to keep the worst-case demand under about 50% of stall. An MG996R-class servo is rated around 9 to 11 kg·cm depending on voltage, so 6.7 kg·cm is 60 to 75% of stall: it will work slowly, buzz, heat, and droop. Choose a 20 kg·cm class servo for the shoulder, or reduce the demand: lighter wrist and gripper servos (SG90-class, 9 g, for the gripper) shift the biggest terms. Notice the gripper and payload at the end contribute over half the total, which is why designers put heavy motors near the base." },
      { t: "p", text: "For a DC motor with a gearbox, the same budget sets the ratio. Output torque = motor torque × N × η (gearbox efficiency, 0.6 to 0.9) and output speed = motor speed / N. Required peak joint speed (1.18 rad/s here) times N must stay below the motor's speed at that load, so torque and speed pull the ratio in opposite directions." },
      { t: "note", kind: "safety", text: "A stalled servo or geared motor draws its stall current (often 1.5 to 2.5 A for an MG996R-class servo) and can strip gears or crush fingers. Power servos from a separate 5 to 6 V supply rated for the sum of stall currents, never from the Arduino or ESP32 board regulator, and share only ground with the board." },

      { t: "h", text: "Trajectory generation" },
      { t: "p", text: "Jumping a servo straight to a new angle asks for infinite acceleration; the arm jerks, overshoots and draws current spikes. A **trajectory** specifies position as a smooth function of time, so velocity and acceleration stay bounded. Three standard profiles for a rest-to-rest move of Δ = q1 - q0 in time T:" },
      { t: "formula", text: String.raw`Cubic   (zero velocity at both ends):
  q(t) = q0 + Δ·(3s² - 2s³),        s = t/T
  peak velocity 1.5·Δ/T (at mid-move),   peak acceleration 6·Δ/T² (at the ends)

Quintic (zero velocity AND acceleration at both ends):
  q(t) = q0 + Δ·(10s³ - 15s⁴ + 6s⁵)
  peak velocity 1.875·Δ/T,   peak acceleration (10/√3)·Δ/T² ≈ 5.77·Δ/T²

Trapezoidal velocity (accelerate at a_max, cruise at v_max, decelerate):
  t_a = v_max / a_max,   T = Δ/v_max + t_a      (needs Δ ≥ v_max²/a_max, else triangular)`, caption: "All three for Δ, starting and ending at rest." },
      { t: "p", text: "Worked example, Δ = 90° = 1.571 rad in T = 2 s. Cubic: peak velocity 1.5 × 1.571 / 2 = 1.178 rad/s, peak acceleration 6 × 1.571 / 4 = 2.356 rad/s² (the value used in the torque budget). Quintic: peak velocity 1.473 rad/s, peak acceleration 2.267 rad/s². The cubic jumps from 0 to 2.356 rad/s² instantly at the start (infinite jerk), which excites vibration; the quintic starts with zero acceleration and is smoother, at the cost of a higher peak speed." },
      { t: "p", text: "Trapezoid with v_max = 1 rad/s and a_max = 2 rad/s²: t_a = 0.5 s, covering ½ × 2 × 0.5² = 0.25 rad in each ramp. The cruise covers 1.571 - 0.5 = 1.071 rad at 1 rad/s, taking 1.071 s. Total T = 1.071 + 0.5 + 0.5 = 2.071 s. The trapezoid is time-optimal for given velocity and acceleration limits, which is why industrial drives and stepper libraries (AccelStepper) use it." },
      { t: "snippet", lang: "python", code: String.raw`import math

def quintic(q0, q1, T, t):
    """Rest-to-rest quintic: zero velocity and acceleration at both ends."""
    s = t / T
    d = q1 - q0
    pos = q0 + d * (10 * s**3 - 15 * s**4 + 6 * s**5)
    vel = d * (30 * s**2 - 60 * s**3 + 30 * s**4) / T
    acc = d * (60 * s - 180 * s**2 + 120 * s**3) / T**2
    return pos, vel, acc

def trapezoid(d, vmax, amax, t):
    ta = vmax / amax
    if d < vmax * ta:                    # never reaches vmax: triangular profile
        ta = math.sqrt(d / amax)
        vmax = amax * ta
    T = 2 * ta + (d - vmax * ta) / vmax
    if t < ta:
        return 0.5 * amax * t * t, T
    if t < T - ta:
        return 0.5 * vmax * ta + vmax * (t - ta), T
    tr = T - t
    return d - 0.5 * amax * tr * tr, T

if __name__ == "__main__":
    D, T = math.pi / 2, 2.0
    peak_v = max(quintic(0, D, T, T * i / 1000)[1] for i in range(1001))
    print(f"quintic peak velocity {peak_v:.4f} rad/s (formula 1.875*D/T = {1.875 * D / T:.4f})")
    _, Ttr = trapezoid(D, 1.0, 2.0, 0)
    print(f"trapezoid total time {Ttr:.4f} s, end position {trapezoid(D, 1.0, 2.0, Ttr)[0]:.4f} rad")
# quintic peak velocity 1.4726 rad/s (formula 1.875*D/T = 1.4726)
# trapezoid total time 2.0708 s, end position 1.5708 rad`, caption: "Sample these at your control rate (for hobby servos, 50 Hz) and send each point as a set-point." },

      { t: "h", text: "Joint space or task space?" },
      { t: "p", text: "**Joint-space** trajectories interpolate each joint from its start angle to its IK goal angle, all synchronised to the same T (scale each joint so the slowest one sets the time). They are cheap, always feasible within joint limits, and never pass through singularities, but the tip follows a curve you did not choose. **Task-space** trajectories interpolate the tip pose (a straight line in position, slerp in orientation) and call IK at every sample. Use them when the path matters: a straight approach into a gripper pose, drawing, or sliding along a surface. They cost an IK call per sample and can fail mid-move if the line crosses a singularity or leaves the workspace, so check every sample before starting." },
      { t: "p", text: "A typical pick uses both: joint space for the big transfer move through free air, task space for the last few centimetres of approach and retreat along the gripper axis." },

      { t: "h", text: "Exit project: FK and IK for a 3 or 4 axis arm" },
      { t: "list", ordered: true, items: [
        "**Model**: measure your arm, write the DH table, code FK, and assert the zero pose.",
        "**IK**: closed form with branch selection and joint-limit checks; FK round trip on 100 random reachable targets with errors under 1e-9 m.",
        "**Calibration**: per-joint offset and sign so that DH angles map to servo commands. Verify three poses with a ruler.",
        "**Motion**: quintic joint-space moves at 50 Hz from a PC (Python over serial) or on the board, plus a task-space straight-line approach of 5 cm.",
        "**Verification**: on hardware, touch six marked grid points and report errors; or in simulation (a URDF in RViz with `joint_state_publisher_gui`, or a Python plot) show the tip landing on target.",
        "**Torque budget**: a table like the one in this lesson for your shoulder joint, with the margin you achieved.",
      ] },

      { t: "deep", title: "Deriving the cubic and quintic coefficients", blocks: [
        { t: "p", text: "A cubic q(t) = a0 + a1 t + a2 t² + a3 t³ has four coefficients, so it can satisfy four boundary conditions: q(0) = q0, q(T) = q1, q̇(0) = v0, q̇(T) = v1. For rest to rest (v0 = v1 = 0): a0 = q0, a1 = 0, and the two end conditions give a2 = 3Δ/T², a3 = -2Δ/T³. Velocity q̇ = 6Δt/T² - 6Δt²/T³ peaks at t = T/2 with value 1.5Δ/T. Acceleration 6Δ/T² - 12Δt/T³ is 6Δ/T² at t = 0." },
        { t: "p", text: "A quintic has six coefficients, enough to also fix acceleration at both ends. With all four derivative conditions zero, the solution is the 10s³ - 15s⁴ + 6s⁵ blend. Its velocity 30Δs²(1 - s)²/T peaks at s = ½ with 30/16 = 1.875. Its acceleration 60Δs(1 - s)(1 - 2s)/T² peaks at s = ½ - 1/(2√3), giving (10/√3)Δ/T². For multi-waypoint paths, chain cubics with matched velocities (cubic splines), which is what ROS's joint trajectory controller does between waypoints that carry velocities." },
      ] },
      { t: "deep", title: "Reflected inertia and why gear ratio matters for control", blocks: [
        { t: "p", text: "Through a gearbox of ratio N, the motor's rotor inertia J_m appears at the joint multiplied by N². A small motor with J_m = 1e-6 kg·m² behind a 200:1 gearbox looks like 0.04 kg·m² at the joint, larger than our whole arm's 0.0154 kg·m². With high ratios the motor inertia dominates M(q), so the pose-dependent part barely matters and simple independent-joint PID works well. That is exactly why hobby servos (ratios of a few hundred) are easy to control and why direct-drive or low-ratio arms (quasi-direct-drive legs, collaborative arms) need model-based control." },
        { t: "p", text: "Inertia matching is a second design criterion: for maximum acceleration of a load J_L, the ideal ratio is N = √(J_L / J_m). Beyond that, a higher ratio wastes motor torque accelerating its own rotor." },
      ] },
    ],
    mistakes: [
      "**Sizing for the folded pose.** Gravity torque is largest with the arm horizontal and extended. Budget for that.",
      "**Designing to stall torque.** Stall is a limit, not an operating point. Keep the worst case under about half of it.",
      "**Powering servos from the board's 5 V pin.** The current surge resets the microcontroller or damages its regulator. Use a separate supply with common ground.",
      "**Stepping servos straight to targets.** Without a trajectory, acceleration is unbounded and the arm jerks and overshoots.",
      "**Running task-space moves without checking every sample.** A straight line can leave the workspace or cross a singularity halfway.",
      "**Unsynchronised joint moves.** Each joint finishing at a different time makes the tip wander; scale all joints to one T.",
    ],
    practice: {
      kind: "bench",
      task: "Measure your shoulder servo's real torque demand and run smooth trajectories.",
      steps: [
        "Weigh every link, servo and the gripper on a kitchen scale and build the torque budget table for the extended pose.",
        "Measure servo supply current with a multimeter in series (or a USB power meter) while the arm holds the extended pose, then while it is folded. Relate the difference to the computed gravity torque.",
        "Program a quintic 90° move for the shoulder at 50 Hz (on the ESP32 DevKit with a servo signal on GPIO 18, or D9 on the Uno), first with T = 2 s, then T = 0.5 s. Note the overshoot and current draw.",
        "Repeat with a trapezoid profile at the same total time and compare smoothness by ear and by watching the tip.",
      ],
    },
    quiz: [
      {
        q: "A uniform 0.4 kg rod 0.5 m long is held horizontal by a joint at one end. What gravity torque must the joint supply?",
        options: ["0.49 N·m", "0.98 N·m", "1.96 N·m", "0.25 N·m"],
        answer: 1,
        why: "τ = m·g·(l/2) = 0.4 × 9.81 × 0.25 = 0.98 N·m. The weight acts at the centre of mass, half way along.",
      },
      {
        q: "Your budget says the shoulder needs 6.7 kg·cm worst case. Which servo is the sound choice?",
        options: [
          "One rated 7 kg·cm stall, since it exceeds the need",
          "One rated 5 kg·cm, with a faster trajectory",
          "One rated about 20 kg·cm stall, keeping demand under half of stall",
          "Any servo, because hobby servos have internal gearboxes",
        ],
        answer: 2,
        why: "Stall torque is not continuous torque. Keeping demand under about 50% of stall avoids overheating, droop and stripped gears.",
      },
      {
        q: "A joint moves 1.2 rad in 2 s with a rest-to-rest cubic. What is the peak velocity?",
        options: ["0.6 rad/s", "1.2 rad/s", "1.8 rad/s", "0.9 rad/s"],
        answer: 3,
        why: "Peak velocity for a cubic is 1.5·Δ/T = 1.5 × 1.2 / 2 = 0.9 rad/s, at the middle of the move.",
      },
      {
        q: "Why choose a quintic over a cubic for a rest-to-rest move?",
        options: [
          "It reaches the goal sooner for the same T",
          "Its acceleration also starts and ends at zero, so there is no jerk spike and less vibration",
          "It needs fewer computations",
          "It has a lower peak velocity",
        ],
        answer: 1,
        why: "The quintic matches zero acceleration at both ends. Its peak velocity is actually higher (1.875Δ/T versus 1.5Δ/T).",
      },
      {
        q: "A trapezoidal move covers 2 rad with v_max = 1 rad/s and a_max = 4 rad/s². What is its total time?",
        options: ["2.25 s", "2.0 s", "2.5 s", "1.5 s"],
        answer: 0,
        why: "t_a = 1/4 = 0.25 s. T = Δ/v_max + t_a = 2 + 0.25 = 2.25 s. Check: ramps cover 0.125 rad each, cruise 1.75 rad in 1.75 s, total 0.25 + 1.75 + 0.25 = 2.25 s.",
      },
      {
        q: "When should you use a task-space trajectory instead of a joint-space one?",
        options: [
          "For every move, because it is always faster",
          "When the shape of the tip's path matters, such as a straight-line approach into a grasp",
          "When the arm is near a singularity",
          "When you have no IK solver",
        ],
        answer: 1,
        why: "Task space controls the tip's path but needs IK at every sample and can hit singularities; joint space is safer for free-air transfers.",
      },
    ],
  },
};

export default lessons;
