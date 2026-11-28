import type { ModuleContent } from "../model/curriculum";

/**
 * Module a12: Perception.
 * Python examples were run against OpenCV 5.1 (the ArucoDetector API used here
 * is the same from 4.7 on). ROS 2 material targets Lyrical Luth (2026 LTS) and
 * also works on Jazzy.
 */
const lessons: ModuleContent = {
  "a12-cameras-and-calibration": {
    id: "a12-cameras-and-calibration",
    outcomes: [
      "Project a 3D point to a pixel with the pinhole model and the intrinsics matrix K",
      "Explain radial and tangential lens distortion and how the five OpenCV coefficients describe it",
      "Calibrate a camera with a printed checkerboard in OpenCV and judge the result by its reprojection error",
      "Convert a focal length in millimetres to pixels for a real sensor",
    ],
    blocks: [
      { t: "h", text: "Why a robot needs a calibrated camera" },
      { t: "p", text: "A camera is the cheapest rich sensor a robot can carry. A ₹1500 module gives you millions of measurements thirty times a second. But a raw image only tells you that something is at pixel (412, 230). To steer towards it, grasp it or put it on a map, you need to turn that pixel into a direction in space, and for that you need a mathematical model of the camera with numbers that belong to your particular camera. Getting those numbers is called **calibration**. Every later lesson in this module (marker pose, depth, following an object) quietly depends on it." },

      { t: "h", text: "The pinhole model" },
      { t: "p", text: "Imagine a box with a tiny hole in one face. Light from a point in the scene travels in a straight line through the hole and lands on the back face. A real lens gathers far more light than a pinhole, but for geometry it behaves like one, apart from distortion, which we add later. Put the hole at the origin, point the z axis out of the camera along the optical axis, x to the right and y downwards (the OpenCV convention). A point P = (X, Y, Z) in this **camera frame** lands on an image plane at distance f in front of the hole at" },
      { t: "formula", text: String.raw`x = f · X / Z
y = f · Y / Z`, caption: "Perspective projection: divide by depth. Things twice as far away look half as big." },
      { t: "p", text: "The division by Z is the whole story of perspective, and it also tells you the bad news: depth is lost. Every point along the ray through the pinhole lands on the same pixel. One camera alone can tell you direction, not distance, unless you know something extra such as the real size of the object." },

      { t: "h", text: "From millimetres to pixels: the intrinsics matrix K" },
      { t: "p", text: "Pixels are not millimetres, and pixel (0, 0) is the top left corner, not the centre. So we scale by the pixel size and shift by the pixel where the optical axis meets the sensor, the **principal point** (cx, cy). Folding the focal length into pixel units gives fx and fy. All of it fits in one 3 × 3 matrix:" },
      { t: "formula", text: String.raw`| u |       | fx   0  cx |   | X/Z |
| v |   =   |  0  fy  cy | × | Y/Z |
| 1 |       |  0   0   1 |   |  1  |

u = fx · X/Z + cx
v = fy · Y/Z + cy`, caption: "K maps a normalised direction (X/Z, Y/Z) to a pixel (u, v)." },
      { t: "p", text: "fx and fy are the focal length measured in pixels. They are nearly equal for square pixels. cx and cy are usually near the image centre but rarely exactly on it, because the lens is never glued in perfectly. These four numbers are the camera's **intrinsic parameters**. The pose of the camera in the world (where it is and which way it points) is the **extrinsic** part, a rotation R and translation t, which takes a world point into the camera frame before K is applied." },

      { t: "h", text: "Worked example: projecting a point" },
      { t: "p", text: "A 640 × 480 camera has fx = fy = 600 px, cx = 320, cy = 240. A ball sits at X = 0.2 m, Y = -0.1 m, Z = 2.0 m in the camera frame (to the right and a little above the axis)." },
      { t: "formula", text: String.raw`X/Z = 0.2 / 2.0 = 0.10      Y/Z = -0.1 / 2.0 = -0.05
u = 600 × 0.10 + 320 = 380
v = 600 × (-0.05) + 240 = 210`, caption: "The ball appears at pixel (380, 210)." },
      { t: "p", text: "Check by going backwards: (380 - 320) / 600 = 0.10 and (210 - 240) / 600 = -0.05, which times Z = 2 gives back X = 0.2 and Y = -0.1. The reverse step only works because we supplied Z; from the pixel alone you get the ray, not the point." },
      { t: "p", text: "Where does 600 come from? The Raspberry Pi Camera Module v2 has a 3.04 mm lens and 1.12 µm pixels, so at full resolution fx = 3.04 mm / 0.00112 mm ≈ 2714 px across a 3280 pixel wide image. Scale the image down to 640 wide (a factor of 3280 / 640 = 5.125) and fx becomes 2714 / 5.125 ≈ 530 px. Datasheet numbers like this are a good sanity check on calibration, but always calibrate: tolerances and the actual crop mode change them." },
      { t: "note", kind: "warn", text: "K belongs to one resolution. If you calibrate at 1280 × 720 and run at 640 × 360, divide fx, fy, cx and cy by two. If the new mode crops the sensor instead of scaling it, the old K is simply wrong: recalibrate." },

      { t: "h", text: "Lens distortion" },
      { t: "p", text: "Real lenses bend straight lines, especially wide angle ones. Straight door frames near the edge of the image bow outwards (**barrel** distortion) or inwards (**pincushion**). This is **radial** distortion: it depends only on the distance r of a point from the image centre. A lens that is slightly tilted relative to the sensor adds a smaller **tangential** distortion. OpenCV describes both with five numbers, `dist = (k1, k2, p1, p2, k3)`, applied to the normalised coordinates (x, y) = (X/Z, Y/Z) before K:" },
      { t: "formula", text: String.raw`r² = x² + y²
x_d = x (1 + k1 r² + k2 r⁴ + k3 r⁶) + 2 p1 x y + p2 (r² + 2x²)
y_d = y (1 + k1 r² + k2 r⁴ + k3 r⁶) + p1 (r² + 2y²) + 2 p2 x y`, caption: "Negative k1 gives barrel distortion, positive k1 pincushion." },
      { t: "p", text: "Once you know the coefficients you can **undistort** an image (or, much cheaper, just the handful of pixel coordinates you care about with `cv2.undistortPoints`), after which the clean pinhole formulas hold again." },

      { t: "h", text: "Calibrating with a checkerboard" },
      { t: "p", text: "Calibration needs points whose 3D positions you know and whose pixels you can find precisely. A flat printed checkerboard is ideal: the inner corners are on a perfect grid of known spacing, and corner positions can be found to a fraction of a pixel. You photograph the board in 10 to 20 different poses; OpenCV then searches for the K, distortion and per-image board poses that best explain every detected corner. The quantity it minimises is the **reprojection error**: the distance in pixels between where each corner was detected and where the model says it should appear." },
      { t: "list", ordered: true, items: [
        "Print a board, for example 10 × 7 squares (which has **9 × 6 inner corners**), and glue it to something truly flat such as glass or foam board. Measure one square with a ruler; printers scale.",
        "Capture 15 or so images at the resolution you will use: board near and far, tilted up to about 45° in each direction, and covering the corners of the image, where distortion is strongest.",
        "Run the script below. It finds corners, refines them to sub-pixel accuracy and calls `cv2.calibrateCamera`.",
        "Judge the result: an RMS reprojection error below about 0.5 px is good for a webcam. Check that fx is close to the datasheet estimate and that cx, cy are near the centre.",
      ] },
      { t: "snippet", lang: "python", code: String.raw`import glob
import cv2
import numpy as np

PATTERN = (9, 6)      # inner corners per row, per column
SQUARE = 0.025        # measured square size in metres

# 3D corner positions in the board's own frame (z = 0 plane).
objp = np.zeros((PATTERN[0] * PATTERN[1], 3), np.float32)
objp[:, :2] = np.mgrid[0:PATTERN[0], 0:PATTERN[1]].T.reshape(-1, 2) * SQUARE

obj_points, img_points, size = [], [], None
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1e-3)

for name in sorted(glob.glob("calib/*.png")):
    gray = cv2.cvtColor(cv2.imread(name), cv2.COLOR_BGR2GRAY)
    size = gray.shape[::-1]                     # (width, height)
    found, corners = cv2.findChessboardCorners(gray, PATTERN, None)
    if not found:
        print("no board:", name)
        continue
    corners = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), criteria)
    obj_points.append(objp)
    img_points.append(corners)

rms, K, dist, rvecs, tvecs = cv2.calibrateCamera(obj_points, img_points, size, None, None)
print(f"views used: {len(obj_points)}, RMS reprojection error: {rms:.3f} px")
print("K =\n", K)
print("dist (k1 k2 p1 p2 k3) =", dist.ravel())
np.savez("camera.npz", K=K, dist=dist, size=size)

# Undistort one image to check by eye that straight edges are straight.
img = cv2.imread(sorted(glob.glob("calib/*.png"))[0])
newK, roi = cv2.getOptimalNewCameraMatrix(K, dist, size, 1, size)
cv2.imwrite("undistorted.png", cv2.undistort(img, K, dist, None, newK))`, caption: "Checkerboard calibration with OpenCV 4.x or 5.x. Images go in a folder called calib." },
      { t: "p", text: "This script was tested on synthetic views rendered through a known camera with fx = fy = 700, cx = 320, cy = 240 and k1 = -0.2. It recovered fx ≈ 699.9, fy ≈ 700.1, cx ≈ 320.8, cy ≈ 240.8 with an RMS error of 0.17 px. Three of the twelve views were rejected because the board ran off the image, which is normal: `findChessboardCorners` needs the whole grid in view." },
      { t: "note", kind: "tip", text: "In ROS 2 the `camera_calibration` package (`ros2 run camera_calibration cameracalibrator --size 9x6 --square 0.025`) does the same job interactively and writes a YAML file that the camera driver publishes as `sensor_msgs/CameraInfo`. Under the hood it calls the same OpenCV functions." },

      { t: "deep", title: "Why calibration works: counting unknowns and Zhang's method", blocks: [
        { t: "p", text: "A flat board in view defines a **homography**: a 3 × 3 matrix H, known up to scale, that maps board coordinates (X, Y, 1) to pixels. Each image gives one H with 8 degrees of freedom. Writing H = K [r1 r2 t] (the first two columns of the rotation and the translation) and using the facts that r1 and r2 are orthogonal and of equal length gives two linear constraints on the matrix B = K⁻ᵀ K⁻¹ per image." },
        { t: "formula", text: String.raw`h1ᵀ B h2 = 0
h1ᵀ B h1 = h2ᵀ B h2`, caption: "Zhang's two constraints per view; B is symmetric with 6 entries, so 3 views fix it." },
        { t: "p", text: "With three or more views you solve for B, factor out K, recover each R and t, and then run nonlinear least squares (Levenberg Marquardt) over everything, distortion included, to minimise reprojection error. That is what `calibrateCamera` does internally. It also explains the advice to vary the tilt: views that are all parallel to the sensor give nearly identical constraints, and the solution for focal length becomes poorly conditioned." },
        { t: "p", text: "A low RMS error is necessary, not sufficient. If every view sits in the middle of the image, the distortion model is free to do anything at the edges and the error still looks small. Professionals look at the coverage map of detected corners and the standard deviations of each parameter (`cv2.calibrateCameraExtended` returns them)." },
      ] },
      { t: "deep", title: "Fisheye lenses and rolling shutters", blocks: [
        { t: "p", text: "The polynomial model above breaks down past about 120° field of view. For fisheye lenses OpenCV has a separate `cv2.fisheye` module whose model uses the angle θ of the incoming ray: r = θ (1 + k1 θ² + k2 θ⁴ + k3 θ⁶ + k4 θ⁸). Calibrate fisheye cameras with `cv2.fisheye.calibrate`, not the standard function." },
        { t: "p", text: "Most cheap CMOS sensors have a **rolling shutter**: rows are exposed one after another over a few tens of milliseconds. A robot turning at 1 rad/s rotates about 0.03 rad while a 30 ms frame is read out, which at fx = 600 px smears a vertical edge by about 18 px from top to bottom. For fast motion, choose a global shutter sensor or slow down when precision matters." },
      ] },
    ],
    mistakes: [
      "**Counting squares instead of inner corners.** A 10 × 7 square board is `PATTERN = (9, 6)`. The wrong count makes `findChessboardCorners` fail on every image.",
      "**Using a K calibrated at a different resolution.** Scale K with the image, or recalibrate if the sensor mode crops.",
      "**A floppy printed board.** A curled sheet of paper breaks the flat-plane assumption and calibration absorbs the error into nonsense distortion values.",
      "**Calibrating with every view square on and centred.** Tilt the board and cover the image corners, or focal length and distortion are poorly determined.",
      "**Changing focus or zoom after calibration.** Both change fx and fy. Lock autofocus for robotics.",
    ],
    practice: {
      kind: "bench",
      task: "Calibrate your robot's camera and verify the result with a known object.",
      steps: [
        "Print a 10 × 7 checkerboard, glue it flat and measure a square.",
        "Capture 15 to 20 images at your working resolution, covering the frame and tilting the board.",
        "Run the calibration script. Record RMS error, fx, fy, cx, cy and the distortion coefficients.",
        "Compare fx with the datasheet estimate (focal length divided by pixel pitch, scaled to your resolution).",
        "Place an object of known width W at a measured distance Z. Measure its width w in pixels and check that Z ≈ fx × W / w to within a few per cent.",
      ],
    },
    quiz: [
      {
        q: "With fx = fy = 600, cx = 320, cy = 240, where does the point (0.3, 0, 1.5) m appear?",
        options: ["(440, 240)", "(500, 240)", "(320, 360)", "(380, 240)"],
        answer: 0,
        why: "X/Z = 0.3 / 1.5 = 0.2, so u = 600 × 0.2 + 320 = 440. Y = 0 gives v = cy = 240.",
      },
      {
        q: "Why can a single camera not measure the distance to an unknown object from one image?",
        options: [
          "Because lens distortion hides depth",
          "Because projection divides by Z, so every point along a ray maps to the same pixel",
          "Because K has no entry for depth",
          "Because pixels are not square",
        ],
        answer: 1,
        why: "u and v depend only on X/Z and Y/Z. Scaling the point along its ray leaves the pixel unchanged, so depth needs extra information such as known size.",
      },
      {
        q: "You calibrated at 1280 × 720 and got fx = 900, cx = 645. What should you use at 640 × 360 if the camera scales (not crops) the image?",
        options: ["fx = 900, cx = 645", "fx = 1800, cx = 1290", "fx = 450, cx = 322.5", "fx = 450, cx = 645"],
        answer: 2,
        why: "Halving the resolution halves every pixel measurement, both focal length in pixels and the principal point.",
      },
      {
        q: "A board has 8 × 6 squares. What do you pass as the pattern size?",
        options: ["(8, 6)", "(9, 7)", "(6, 8)", "(7, 5)"],
        answer: 3,
        why: "OpenCV counts inner corners, which is one fewer than squares in each direction: 7 × 5.",
      },
      {
        q: "Calibration reports an RMS reprojection error of 0.2 px, but every image had the board in the centre. What is the risk?",
        options: [
          "None; 0.2 px proves the model is right everywhere",
          "Distortion near the edges is poorly constrained, so the model may be wrong there even though the error is small",
          "The focal length will be exactly zero",
          "The principal point will be at (0, 0)",
        ],
        answer: 1,
        why: "The error is measured only where there were corners. Without data near the edges, distortion there is unconstrained.",
      },
    ],
  },

  "a12-image-processing-features-and-markers": {
    id: "a12-image-processing-features-and-markers",
    outcomes: [
      "Choose between Gaussian, median and morphological filters for a given kind of noise",
      "Threshold an image with a fixed value, Otsu's method or adaptive thresholding, and find edges with Canny",
      "Segment a coloured object in HSV and find its centroid from contours and moments",
      "Detect and match ORB features, and detect ArUco markers with the OpenCV 4.7+ ArucoDetector API",
      "Recover a marker's 3D pose with solvePnP",
    ],
    blocks: [
      { t: "h", text: "From pixels to things" },
      { t: "p", text: "A camera gives you a grid of numbers. A robot needs answers: where is the red ball, which way is the line, how far is the docking marker. Classical image processing is the toolkit that bridges the two with a few milliseconds of CPU, no training data and fully predictable behaviour. Even when a neural network does detection (lesson 4), these operations do the pre and post processing around it. An image in OpenCV's Python API is a NumPy array: height × width × 3 for colour, in **BGR** order (not RGB), with 8 bit values from 0 to 255." },

      { t: "h", text: "Filtering: removing noise" },
      { t: "p", text: "Every pixel is noisy. Filtering replaces each pixel with a combination of its neighbours, defined by a small window called a **kernel**." },
      { t: "list", items: [
        "**Box blur** (`cv2.blur`): average of the window. Cheap, but it smears edges and makes blocky artefacts.",
        "**Gaussian blur** (`cv2.GaussianBlur(img, (5, 5), 0)`): weights fall off with distance from the centre, so it smooths sensor noise while softening edges less than a box. The usual first step before edges or thresholds.",
        "**Median blur** (`cv2.medianBlur(img, 5)`): the median of the window. It deletes isolated bright or dark specks (salt and pepper noise) completely, which averaging cannot, and it keeps edges sharp.",
        "**Morphology** on binary masks: **erosion** shrinks white regions, **dilation** grows them. **Opening** (erode then dilate) removes small white specks; **closing** (dilate then erode) fills small holes.",
      ] },

      { t: "h", text: "Thresholding: from grey to black and white" },
      { t: "p", text: "Thresholding turns a greyscale image into a binary mask: pixels above T become 255, the rest 0. A fixed T fails as soon as lighting changes. **Otsu's method** chooses T automatically by looking at the histogram: it tries every T and keeps the one that makes the two resulting classes (dark and bright) as internally uniform as possible, which is the same as maximising the variance between them." },
      { t: "formula", text: String.raw`σ_B²(T) = w0(T) · w1(T) · (μ0(T) - μ1(T))²
T* = argmax over T of σ_B²(T)`, caption: "w0, w1 are the fractions of pixels below and above T; μ0, μ1 are their mean intensities." },
      { t: "p", text: "Test: an image whose left half is 60 and right half 180, plus Gaussian noise of standard deviation 15. Otsu chooses T = 119, almost exactly halfway, as you would hope. When lighting varies across the image (a shadow over half a line track), use **adaptive thresholding** (`cv2.adaptiveThreshold`), which computes a separate threshold for each neighbourhood." },
      { t: "snippet", lang: "python", code: String.raw`t, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
mask_local = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 31, 5)   # 31 px window, offset 5`, caption: "Otsu returns the threshold it chose as t." },

      { t: "h", text: "Edges: Canny" },
      { t: "p", text: "An edge is where intensity changes quickly, so edge detectors look at the image gradient. The **Sobel** operator estimates the horizontal and vertical derivatives Gx and Gy with 3 × 3 kernels; the gradient magnitude is √(Gx² + Gy²). **Canny** builds on it in four steps: blur, compute gradients, thin each edge to one pixel by keeping only local maxima along the gradient direction (non-maximum suppression), then apply **hysteresis** with two thresholds: pixels above the high threshold are edges, pixels between the two are edges only if connected to a strong edge. That keeps long weak edges and drops isolated noise. A low to high ratio of 1:2 or 1:3 (say `cv2.Canny(blur, 50, 150)`) is the usual starting point." },

      { t: "h", text: "Contours and moments" },
      { t: "p", text: "Given a binary mask, `cv2.findContours` traces the outline of every white region. For each contour you can compute its area (`cv2.contourArea`), bounding box (`cv2.boundingRect`), and **image moments**. The zeroth moment m00 is the area; the centroid is (m10 / m00, m01 / m00). The centroid is exactly what a follower controller needs: how far left or right of centre the target is." },

      { t: "h", text: "Colour segmentation in HSV" },
      { t: "p", text: "Finding a red ball by its BGR values fails because brightness changes all three channels together: a red ball in shadow is (0, 0, 90), in sunlight (60, 60, 255). **HSV** separates **hue** (which colour), **saturation** (how pure) and **value** (how bright). A ball's hue barely changes with lighting, so you threshold mostly on hue and accept a wide range of value. In OpenCV's 8 bit HSV, hue runs from 0 to 179 (degrees halved to fit a byte) and red sits at both ends, so you need two bands." },
      { t: "snippet", lang: "python", code: String.raw`import cv2
import numpy as np

def find_red_blob(bgr, min_area=300):
    """Return (cx, cy, area) of the largest red blob, or None."""
    blur = cv2.GaussianBlur(bgr, (5, 5), 0)
    hsv = cv2.cvtColor(blur, cv2.COLOR_BGR2HSV)
    # Red wraps round hue 0 on OpenCV's 0..179 hue scale, so use two bands.
    lo = cv2.inRange(hsv, (0, 120, 70), (10, 255, 255))
    hi = cv2.inRange(hsv, (170, 120, 70), (179, 255, 255))
    mask = cv2.bitwise_or(lo, hi)
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)    # remove specks
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)   # fill holes
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    c = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(c)
    if area < min_area:
        return None
    m = cv2.moments(c)
    return m["m10"] / m["m00"], m["m01"] / m["m00"], area

if __name__ == "__main__":
    img = np.full((480, 640, 3), 90, np.uint8)          # grey background
    cv2.circle(img, (400, 200), 50, (0, 0, 220), -1)     # red disc (BGR)
    cv2.circle(img, (100, 100), 30, (220, 0, 0), -1)     # blue disc, ignored
    cx, cy, area = find_red_blob(img)
    print(f"centre ({cx:.1f}, {cy:.1f}), area {area:.0f} px")
    assert abs(cx - 400) < 2 and abs(cy - 200) < 2`, caption: "Runs as is; prints centre (400.0, 200.0), area 7910 px. For a webcam, loop over cv2.VideoCapture(0).read()." },
      { t: "p", text: "Check the area: a disc of radius 50 px has area π × 50² ≈ 7854 px². The contour area of 7910 is within 1%, the difference being how a polygon traces pixel edges. Tune the saturation and value lower bounds on your real object; print the HSV of a few pixels on it first." },

      { t: "h", text: "Features and matching: ORB" },
      { t: "p", text: "Colour only works for objects with a distinctive colour. A more general tool is **local features**: distinctive points (corners, blobs) with a **descriptor** summarising the patch around each, so the same physical point can be recognised in another image even after rotation or scale change. **ORB** (Oriented FAST and Rotated BRIEF) is the free, fast standard: FAST finds corners, an orientation is assigned from the patch's intensity centroid, and BRIEF describes the patch as 256 bits from pairwise brightness comparisons. Matching two binary descriptors means counting differing bits, the **Hamming distance**." },
      { t: "snippet", lang: "python", code: String.raw`orb = cv2.ORB_create(nfeatures=1000)
kp1, des1 = orb.detectAndCompute(gray1, None)
kp2, des2 = orb.detectAndCompute(gray2, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING)
pairs = bf.knnMatch(des1, des2, k=2)
good = [m for m, n in pairs if m.distance < 0.75 * n.distance]   # Lowe ratio test`, caption: "Keep a match only if it is clearly better than the second best." },
      { t: "p", text: "Even after the ratio test some matches are wrong. You then fit a geometric model (a homography for a flat object, an essential matrix for general motion) with **RANSAC**, which repeatedly fits to a random minimal subset and keeps the model most matches agree with. Feature matching is the front end of visual odometry and visual SLAM." },

      { t: "h", text: "Fiducial markers: ArUco and AprilTag" },
      { t: "p", text: "When you control the environment, print the features yourself. A **fiducial marker** is a black square with a binary code inside. The square's four corners can be found precisely, and the code gives an ID with error correction, so false detections are very rare. **ArUco** markers ship with OpenCV in dictionaries such as `DICT_4X4_50` (4 × 4 bits, 50 IDs). **AprilTag** families (for example `DICT_APRILTAG_36h11`, also in OpenCV) are slower to decode but more robust. Docking stations, warehouse floors and test rigs all use them." },
      { t: "note", kind: "warn", text: "The ArUco API changed in OpenCV 4.7. Old tutorials call `cv2.aruco.detectMarkers(img, dictionary)` and `cv2.aruco.estimatePoseSingleMarkers`; in 4.7 and later (including 5.x) you create a `cv2.aruco.ArucoDetector(dictionary, parameters)` object and call its `detectMarkers` method, and per-marker pose comes from `cv2.solvePnP`. `estimatePoseSingleMarkers` is gone from the current Python packages (it is absent in 5.x)." },

      { t: "h", text: "Pose from four corners: solvePnP" },
      { t: "p", text: "You know the marker is a square of side L (say 0.10 m) and you have its four corner pixels and your K. The **Perspective-n-Point** problem asks: which rotation and translation of the square would project its corners exactly onto those pixels? `cv2.solvePnP` answers it and returns `rvec` (a rotation as axis times angle, the Rodrigues vector) and `tvec`, the marker centre in the camera frame in metres. The flag `SOLVEPNP_IPPE_SQUARE` is a solver designed for exactly this case of a square's four corners in a fixed order." },
      { t: "snippet", lang: "python", code: String.raw`import cv2
import numpy as np

K = np.array([[600.0, 0, 320], [0, 600.0, 240], [0, 0, 1]])   # from calibration
dist = np.zeros(5)
L = 0.10  # marker side in metres

dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
detector = cv2.aruco.ArucoDetector(dictionary, cv2.aruco.DetectorParameters())

# Corners in the marker frame, in ArUco order: top-left, top-right, bottom-right, bottom-left.
obj = np.array([[-L/2,  L/2, 0], [ L/2,  L/2, 0],
                [ L/2, -L/2, 0], [-L/2, -L/2, 0]], dtype=np.float32)

def marker_poses(gray):
    corners, ids, _ = detector.detectMarkers(gray)
    out = []
    if ids is None:
        return out
    for c, i in zip(corners, ids.flatten()):
        ok, rvec, tvec = cv2.solvePnP(obj, c.reshape(4, 2), K, dist,
                                      flags=cv2.SOLVEPNP_IPPE_SQUARE)
        if ok:
            out.append((int(i), rvec.ravel(), tvec.ravel()))
    return out

if __name__ == "__main__":
    # Synthesise a view: marker 7, 1 m in front of the camera, square on.
    side_px = int(600 * L / 1.0)                       # 60 px
    tag = cv2.aruco.generateImageMarker(dictionary, 7, side_px)
    img = np.full((480, 640), 255, np.uint8)
    x0, y0 = 320 - side_px // 2, 240 - side_px // 2
    img[y0:y0 + side_px, x0:x0 + side_px] = tag
    for mid, rvec, tvec in marker_poses(img):
        print(f"id {mid}: t = {np.round(tvec, 3)} m")
        assert mid == 7 and abs(tvec[2] - 1.0) < 0.03`, caption: "Tested on OpenCV 5.1: prints id 7 with z ≈ 1.017 m." },
      { t: "p", text: "Check the synthetic test by hand: a 0.10 m marker at 1 m with fx = 600 should be 600 × 0.10 / 1 = 60 px wide, which is how it was drawn. The solver returned z ≈ 1.017 m, a 1.7% error caused by rounding the corners to whole pixels on a tiny 60 px marker. Bigger markers in the image give better pose. For the robot, the two numbers that matter are tvec[0] (sideways offset, positive to the right) and tvec[2] (distance ahead)." },
      { t: "p", text: "Print markers with a white border at least one cell wide around the black square, and measure the printed black square, not the paper. You can generate one with `cv2.aruco.generateImageMarker(dictionary, id, 400)` and `cv2.imwrite`." },

      { t: "deep", title: "Deriving Otsu's criterion", blocks: [
        { t: "p", text: "Split pixels at T into class 0 (below) and class 1 (above) with weights w0 + w1 = 1, means μ0 and μ1 and variances σ0², σ1². The overall mean is μ = w0 μ0 + w1 μ1 and the total variance σ² is fixed by the image. It decomposes as within-class plus between-class:" },
        { t: "formula", text: String.raw`σ² = [w0 σ0² + w1 σ1²] + [w0 (μ0 - μ)² + w1 (μ1 - μ)²]
     =      σ_W²(T)      +            σ_B²(T)
σ_B² = w0 w1 (μ0 - μ1)²`, caption: "Since σ² is constant, minimising σ_W² is the same as maximising σ_B²." },
        { t: "p", text: "The last line follows by substituting μ and simplifying. The useful property is that σ_B² needs only cumulative sums of the histogram, so all 256 candidates are evaluated in one pass. Otsu works when the histogram is bimodal; for a small bright object on a large background the peak is swamped and the threshold drifts, which is a common surprise." },
      ] },
      { t: "deep", title: "How solvePnP finds the pose, and the flip ambiguity", blocks: [
        { t: "p", text: "For four coplanar points, the image of the plane is a homography, and IPPE (Infinitesimal Plane-based Pose Estimation) solves it in closed form. It generally returns **two** candidate poses that explain the corners almost equally well: the marker tilted towards you or away from you by the same angle. When the marker is small or nearly face on, noise can make the solver pick the wrong one, and the reported orientation flips between frames while the position stays sensible." },
        { t: "p", text: "Remedies used in practice: rely on tvec (which is stable) and ignore the marker's orientation when you only need to drive to it; use `cv2.solvePnPGeneric` to get both solutions and pick the one closer to the last frame; or use a board of several markers (`cv2.aruco.GridBoard`), whose extra points remove the ambiguity. General PnP with more points minimises reprojection error iteratively (`SOLVEPNP_ITERATIVE`), and `cv2.solvePnPRansac` rejects outlier correspondences." },
      ] },
    ],
    mistakes: [
      "**Treating OpenCV images as RGB.** OpenCV loads BGR. Converting with `COLOR_RGB2HSV` by mistake swaps red and blue hues.",
      "**Using one hue band for red.** Red wraps round 0 and 179 in OpenCV HSV; you need two `inRange` calls joined with `bitwise_or`.",
      "**Copying pre 4.7 ArUco code.** `cv2.aruco.detectMarkers(img, dict)` and `estimatePoseSingleMarkers` fail on current OpenCV. Use `ArucoDetector` and `solvePnP`.",
      "**Wrong marker size or corner order in solvePnP.** L must be the black square's measured side, and the object points must follow ArUco's top-left, top-right, bottom-right, bottom-left order, or the pose is scaled or mirrored.",
      "**Forgetting to pass K and distortion from your calibration.** A guessed K gives distances that are wrong by the ratio of the true to guessed focal length.",
    ],
    practice: {
      kind: "bench",
      task: "Build a marker range finder and a colour tracker on a laptop or Raspberry Pi with a USB camera.",
      steps: [
        "Generate ArUco marker 7 from DICT_4X4_50 at 400 px, print it, and measure the black square.",
        "Load your K and dist from the calibration lesson. Run the detector on live frames from cv2.VideoCapture(0).",
        "Hold the marker at 0.5 m, 1.0 m and 1.5 m (measured with a tape) and record tvec[2]. Compute the error at each distance.",
        "Switch to find_red_blob and tune the HSV bounds on a real red object under room light and near a window. Write down the bounds that work for both.",
        "Measure the frame rate of each pipeline with time.perf_counter over 100 frames.",
      ],
    },
    quiz: [
      {
        q: "An image has a few isolated white specks on dark background. Which filter removes them while keeping edges sharp?",
        options: ["Box blur", "Gaussian blur", "Median blur", "Dilation"],
        answer: 2,
        why: "The median of a window ignores a single extreme value, so isolated specks disappear and edges are preserved. Averaging filters only spread the speck out; dilation would grow it.",
      },
      {
        q: "Why do we threshold a coloured ball in HSV rather than BGR?",
        options: [
          "HSV images are smaller",
          "Brightness changes alter all three BGR channels together, while hue stays nearly constant",
          "OpenCV cannot threshold BGR images",
          "HSV removes lens distortion",
        ],
        answer: 1,
        why: "Hue describes the colour independently of brightness, so a single hue range works in shadow and in light.",
      },
      {
        q: "A contour has m00 = 2000, m10 = 640000, m01 = 300000. Where is its centroid?",
        options: ["(150, 320)", "(320, 150)", "(640, 300)", "(2000, 320)"],
        answer: 1,
        why: "cx = m10 / m00 = 640000 / 2000 = 320 and cy = m01 / m00 = 300000 / 2000 = 150.",
      },
      {
        q: "A 0.15 m marker appears 45 px wide with fx = 600 px, square on. Roughly how far away is it?",
        options: ["0.5 m", "1.0 m", "2.0 m", "4.0 m"],
        answer: 2,
        why: "Width in pixels = fx × L / Z, so Z = 600 × 0.15 / 45 = 2.0 m.",
      },
      {
        q: "In Canny, what does hysteresis do?",
        options: [
          "Blurs the image twice",
          "Keeps weak edge pixels only if they connect to strong ones, dropping isolated noise",
          "Converts the image to HSV",
          "Finds the threshold automatically like Otsu",
        ],
        answer: 1,
        why: "Two thresholds: above the high one is an edge, between the two is an edge only if connected to a strong edge.",
      },
      {
        q: "Which OpenCV 4.7+ call detects ArUco markers?",
        options: [
          "cv2.aruco.estimatePoseSingleMarkers(img)",
          "cv2.findChessboardCorners(img, dict)",
          "cv2.aruco.ArucoDetector(dictionary, params).detectMarkers(gray)",
          "cv2.aruco.detect(gray)",
        ],
        answer: 2,
        why: "Since 4.7, detection goes through an ArucoDetector object. Pose then comes from solvePnP.",
      },
    ],
  },

  "a12-lidar-depth-and-point-clouds": {
    id: "a12-lidar-depth-and-point-clouds",
    outcomes: [
      "Explain how time-of-flight and triangulation LiDARs measure range, and the specifications that matter",
      "Convert a 2D laser scan from polar form to Cartesian points in the robot frame",
      "Compute depth from stereo disparity and back-project a depth image into a point cloud",
      "Describe point cloud processing steps: voxel downsampling, cropping, ground removal and clustering",
    ],
    blocks: [
      { t: "h", text: "Why measure depth directly" },
      { t: "p", text: "The last two lessons recovered distance only for objects of known size. Obstacle avoidance and mapping need the distance to everything: walls, chair legs, people. Sensors that measure range directly make that easy, and they work in the dark. The two you will meet on an indoor robot are a spinning 2D **LiDAR** such as the RPLIDAR A1 or A2, and a **depth camera** such as an Intel RealSense D435 or an OAK-D. Both feed the mapping and navigation of module a13." },

      { t: "h", text: "How a LiDAR measures range" },
      { t: "p", text: "A LiDAR fires a short infrared laser pulse and times the echo. Light covers 0.3 m per nanosecond, and the pulse goes there and back, so range r = c · Δt / 2. A target at 3 m returns after 2 × 3 / (3 × 10⁸) = 20 ns. Cheap units such as the RPLIDAR A1 use **triangulation** instead: a laser dot is viewed by a small camera offset sideways, and the dot's position on that sensor gives the range by similar triangles. Triangulation is cheap and accurate up close but its error grows with the square of range, which is why such units are rated to around 12 m." },
      { t: "p", text: "A 2D LiDAR spins the measurement head, sweeping one horizontal plane. The specifications that matter:" },
      { t: "table", head: ["Specification", "Typical RPLIDAR A1-class value", "What it means for you"], rows: [
        ["Range", "0.15 to 12 m", "Anything closer than the minimum is invisible"],
        ["Scan rate", "5.5 to 10 Hz", "How often the whole circle is refreshed"],
        ["Sample rate", "about 8000 per second", "Samples per scan = sample rate / scan rate"],
        ["Angular resolution", "about 1°", "Gap between neighbouring beams"],
        ["Range accuracy", "about 1% of range", "Noise on each reading"],
      ], caption: "Check your own unit's datasheet; models differ." },
      { t: "p", text: "Angular resolution matters more than people expect. At 1° spacing, neighbouring beams at 5 m are 5 × 0.01745 ≈ 0.087 m apart, so a 2 cm chair leg can fall between beams completely. Also remember the scan is a single plane at the height of the sensor: a table top above it or a low step below it is invisible." },
      { t: "note", kind: "safety", text: "Robot LiDARs are Class 1 lasers, safe in normal use, but never look into the optics of a stationary or opened unit, and do not run a unit with a damaged housing. Keep the spinning head clear of fingers and cables." },

      { t: "h", text: "From a scan to points" },
      { t: "p", text: "A ROS 2 LiDAR driver publishes `sensor_msgs/LaserScan`: a start angle `angle_min`, a step `angle_increment`, and an array `ranges`. Beam i points at θ_i = angle_min + i · angle_increment in the sensor frame. Invalid readings are `inf` or `nan`, or fall outside `range_min` to `range_max`, and must be discarded, not treated as zero." },
      { t: "formula", text: String.raw`θ_i = angle_min + i · angle_increment
x_i = r_i · cos θ_i
y_i = r_i · sin θ_i`, caption: "ROS frames: x forward, y left, z up (REP 103)." },
      { t: "p", text: "Worked example: a reading of 2.0 m at θ = 30° gives x = 2.0 × 0.866 = 1.732 m ahead and y = 2.0 × 0.5 = 1.0 m to the left. If the LiDAR is mounted 0.10 m ahead of the robot's centre, the point is at x = 1.832 m in `base_link`. ROS handles that shift for you through the static transform from `base_link` to `laser` that you publish from the robot's URDF." },
      { t: "snippet", lang: "python", code: String.raw`import numpy as np

def scan_to_points(msg):
    """sensor_msgs/LaserScan to an (N, 2) array of valid x, y points in the sensor frame."""
    r = np.asarray(msg.ranges, dtype=np.float32)
    theta = msg.angle_min + np.arange(len(r)) * msg.angle_increment
    ok = np.isfinite(r) & (r >= msg.range_min) & (r <= msg.range_max)
    return np.column_stack((r[ok] * np.cos(theta[ok]), r[ok] * np.sin(theta[ok])))

def nearest_in_front(points, half_width=0.2):
    """Distance to the closest point in a corridor ahead of the robot."""
    ahead = points[(points[:, 0] > 0) & (np.abs(points[:, 1]) < half_width)]
    return float(ahead[:, 0].min()) if len(ahead) else float("inf")`, caption: "Vectorised with NumPy; a 720 beam scan converts in well under a millisecond." },

      { t: "h", text: "Depth cameras" },
      { t: "p", text: "A depth camera gives a range for every pixel, so it sees table tops and overhangs that a 2D LiDAR misses. Three technologies are common:" },
      { t: "list", items: [
        "**Stereo** (RealSense D400 series, OAK-D): two cameras a known **baseline** B apart. A point appears shifted horizontally between the two images by a **disparity** d pixels, and depth Z = f · B / d. An infrared pattern projector adds texture to blank walls so matching works indoors.",
        "**Structured light**: project a known pattern and measure how it deforms. Accurate up close, struggles in sunlight.",
        "**Time of flight** (ToF): measure the phase delay of modulated infrared light at every pixel. Good on blank surfaces, but confused by multipath in corners and by dark or shiny materials.",
      ] },
      { t: "formula", text: String.raw`Z = f · B / d

f = 600 px, B = 0.05 m, d = 15 px:
Z = 600 × 0.05 / 15 = 2.0 m`, caption: "Stereo depth from disparity." },
      { t: "p", text: "The formula explains stereo's main weakness. Disparity shrinks as 1/Z, so a fixed one pixel matching error causes a depth error that grows as Z². In the example, d = 14 instead of 15 gives Z = 2.14 m, a 7% error from one pixel. At 4 m (d = 7.5) the same pixel error is about 14%. Stereo is precise near the robot and rough far away, which is why the useful range of small depth cameras is a few metres." },

      { t: "h", text: "Point clouds" },
      { t: "p", text: "Back-projecting each depth pixel with the inverse of the pinhole model gives a 3D point, and the set of all of them is a **point cloud** (ROS type `sensor_msgs/PointCloud2`)." },
      { t: "formula", text: String.raw`X = (u - cx) · Z / fx
Y = (v - cy) · Z / fy
Z = depth(u, v)`, caption: "The pinhole model run backwards, now that Z is known." },
      { t: "p", text: "Example: pixel (380, 210) with depth 2.0 m and the K from lesson 1 gives X = 60 × 2 / 600 = 0.2 m and Y = -30 × 2 / 600 = -0.1 m, the ball from lesson 1 recovered exactly. Note this is in the **optical frame** (z forward, x right, y down). ROS distinguishes `camera_color_optical_frame` from `camera_link` (x forward, y left, z up) precisely because of this; mixing them rotates your cloud by 90°." },
      { t: "p", text: "A 640 × 480 depth image is 307 200 points at 30 frames per second, far too many to process raw on a small computer. A typical pipeline, usually with the Open3D or PCL libraries:" },
      { t: "list", ordered: true, items: [
        "**Crop** to the region you care about (a box in front of the robot, below 2 m height).",
        "**Voxel downsample**: divide space into cubes, say 2 cm, and keep one averaged point per occupied cube. This often cuts the cloud by a factor of 10 to 50.",
        "**Remove the ground** by fitting a plane with RANSAC and deleting points within a centimetre or two of it.",
        "**Cluster** the rest by distance (Euclidean clustering or DBSCAN): each cluster is a candidate obstacle or object, with a centroid and bounding box.",
      ] },
      { t: "p", text: "For navigation you often do not need a cloud at all. Nav2's costmaps can take a depth cloud directly through a voxel layer, and the `depthimage_to_laserscan` package squashes a horizontal band of a depth image into a fake `LaserScan`, which lets a cheap robot use a depth camera where software expects a LiDAR." },

      { t: "deep", title: "Triangulation LiDAR error grows with range squared", blocks: [
        { t: "p", text: "In a triangulation sensor the laser and a lens of focal length f are separated by baseline b. A target at range r images the laser dot at offset x = f · b / r on the detector, exactly the stereo relation. Differentiate to see how a detector error δx maps to a range error:" },
        { t: "formula", text: String.raw`r = f · b / x
dr/dx = -f · b / x² = -r² / (f · b)
|δr| = r² · |δx| / (f · b)`, caption: "Doubling range quadruples the error." },
        { t: "p", text: "The same algebra gives stereo depth error δZ = Z² δd / (f B). With f = 600 px, B = 0.05 m and δd = 0.25 px (good sub-pixel matching), δZ at 2 m is 4 × 0.25 / 30 ≈ 0.033 m, and at 4 m it is about 0.13 m. To push range out, designers increase the baseline or the focal length; that is why long range stereo rigs are wide." },
      ] },
      { t: "deep", title: "Motion distortion in spinning LiDARs", blocks: [
        { t: "p", text: "A 5.5 Hz LiDAR takes about 180 ms to complete one revolution. If the robot turns at 1 rad/s meanwhile, it rotates about 0.18 rad (10°) during the scan, so a straight wall comes out slightly bent, and the first and last beams disagree where they meet. At 0.5 m/s forward the robot also moves 9 cm during the scan." },
        { t: "p", text: "The fix, called **deskewing**, uses odometry or IMU to estimate the robot's pose at the time of each beam and transforms each point by its own pose. 3D LiDAR SLAM packages always deskew. For a slow indoor robot with a 2D LiDAR, turning slowly while mapping is the practical remedy, and scan matching in a13 absorbs the remaining error." },
      ] },
    ],
    mistakes: [
      "**Treating invalid ranges as zero.** An `inf` or `nan` reading means no return. Replacing it with 0 puts a phantom obstacle on the robot itself.",
      "**Forgetting the scan is one plane.** Table tops, overhanging shelves and steps down are invisible to a 2D LiDAR. Add a depth camera or a cliff sensor.",
      "**Confusing optical and body frames.** Camera optical frames are z forward, x right, y down; ROS body frames are x forward, y left, z up.",
      "**Expecting stereo to be accurate at long range.** Error grows as Z². Check the error at the distances you care about.",
      "**Processing full resolution clouds on a Pi.** Crop and voxel downsample first, or the pipeline cannot keep up.",
    ],
    practice: {
      kind: "bench",
      task: "Measure your LiDAR's real performance and turn its scan into an obstacle alarm.",
      steps: [
        "Connect the LiDAR to a Raspberry Pi or laptop running ROS 2 and launch its driver (for Slamtec units, the `sllidar_ros2` package). Run `ros2 topic hz /scan` and record the scan rate.",
        "Run `ros2 topic echo /scan --once` and read angle_increment. Compute the gap between beams at 3 m.",
        "Place a box at 0.5, 1, 2 and 4 m measured with a tape. Average 20 readings of the beam that hits it and record the error at each distance.",
        "Write a node that uses scan_to_points and nearest_in_front and logs a warning when anything is closer than 0.4 m in a 0.4 m wide corridor.",
        "Find a chair leg or table edge your LiDAR misses, and explain why.",
      ],
    },
    quiz: [
      {
        q: "A LiDAR beam at θ = 90° returns r = 1.5 m. Where is the point in the sensor frame (x forward, y left)?",
        options: ["(1.5, 0)", "(0, 1.5)", "(0, -1.5)", "(1.06, 1.06)"],
        answer: 1,
        why: "x = 1.5 cos 90° = 0 and y = 1.5 sin 90° = 1.5: straight to the left.",
      },
      {
        q: "A stereo camera has f = 700 px and B = 0.06 m. A point has disparity 21 px. What is its depth?",
        options: ["0.5 m", "1.0 m", "2.0 m", "3.5 m"],
        answer: 2,
        why: "Z = f B / d = 700 × 0.06 / 21 = 42 / 21 = 2.0 m.",
      },
      {
        q: "Why is stereo depth less accurate far away?",
        options: [
          "The infrared projector turns off",
          "Disparity shrinks as 1/Z, so a fixed pixel error causes a depth error growing as Z²",
          "Lens distortion is larger at long range",
          "The cameras run at a lower frame rate",
        ],
        answer: 1,
        why: "Small disparities at long range mean a one pixel error is a large fraction of the measurement.",
      },
      {
        q: "A 2D LiDAR with 1° resolution looks at a 3 cm table leg 4 m away. What is likely?",
        options: [
          "It is always detected by several beams",
          "Beams are about 7 cm apart there, so the leg may be missed",
          "The leg will appear 1° wide",
          "The LiDAR reports it as inf",
        ],
        answer: 1,
        why: "Beam spacing is 4 × 0.01745 ≈ 0.07 m, more than twice the leg width, so it can fall between beams.",
      },
      {
        q: "A depth pixel at (u, v) = (420, 240) has Z = 1.2 m, with fx = 600, cx = 320, cy = 240. What is X?",
        options: ["0.1 m", "0.2 m", "0.5 m", "1.2 m"],
        answer: 1,
        why: "X = (u - cx) Z / fx = 100 × 1.2 / 600 = 0.2 m. Y = 0 because v = cy.",
      },
    ],
  },

  "a12-detection-tracking-and-ros2-pipelines": {
    id: "a12-detection-tracking-and-ros2-pipelines",
    outcomes: [
      "Explain how a single-stage detector such as YOLO produces boxes, and compute IoU",
      "Deploy a detector on a Raspberry Pi 5 with a Hailo accelerator or a Jetson Orin Nano, and explain INT8 quantisation",
      "Track objects across frames with IoU or centroid association, and outline Kalman tracking",
      "Write a ROS 2 node that converts images with cv_bridge, detects a target and publishes velocity commands to follow it",
    ],
    blocks: [
      { t: "h", text: "When hand-made rules run out" },
      { t: "p", text: "HSV thresholds find a red ball; markers find a printed square. Neither finds \"a person\" or \"a cup\", whose appearance varies endlessly. For those, robots use **convolutional neural networks** trained on hundreds of thousands of labelled images. You will rarely train one from scratch; the engineering skill is choosing a model, running it fast enough on the robot, and turning its per-frame output into something stable a controller can follow. This lesson covers those three steps and then wires everything into ROS 2 for the module project." },

      { t: "h", text: "What a detector outputs" },
      { t: "p", text: "A detector takes an image and returns a list of **boxes**, each with a class label and a confidence score. The **YOLO** family (You Only Look Once) are single-stage detectors: one pass of the network over the image predicts boxes at every location of a few coarse grids at once, which is why they run in real time. The current Ultralytics releases are **YOLO11** and **YOLO26**; YOLO26 removes the separate non-maximum suppression step, which simplifies deployment on accelerators. Each comes in sizes n, s, m, l, x (nano to extra large). On a robot you start with the nano model." },
      { t: "snippet", lang: "python", code: String.raw`# pip install ultralytics
from ultralytics import YOLO

model = YOLO("yolo26n.pt")                 # downloads pretrained COCO weights
results = model("frame.jpg", conf=0.5)     # list with one Results per image
for box in results[0].boxes:
    x1, y1, x2, y2 = box.xyxy[0].tolist()
    print(model.names[int(box.cls)], round(float(box.conf), 2), (x1, y1, x2, y2))`, caption: "Ultralytics Python API. Swap in yolo11n.pt for the previous generation; the API is the same." },

      { t: "h", text: "Intersection over union" },
      { t: "p", text: "The basic measure of how well two boxes agree is **IoU**: the area of their overlap divided by the area of their union. It is 1 for identical boxes and 0 for disjoint ones. It is used to score detectors against labels, to remove duplicate detections (non-maximum suppression keeps the highest score box and deletes others with IoU above about 0.5), and, below, to track." },
      { t: "formula", text: String.raw`IoU(A, B) = area(A ∩ B) / area(A ∪ B)

A = (0, 0)-(10, 10), B = (5, 5)-(15, 15)
intersection = 5 × 5 = 25
union = 100 + 100 - 25 = 175
IoU = 25 / 175 ≈ 0.143`, caption: "Two boxes shifted by half their width overlap much less than people guess." },
      { t: "snippet", lang: "python", code: String.raw`def iou(a, b):
    """Boxes as (x1, y1, x2, y2)."""
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0

assert abs(iou((0, 0, 10, 10), (5, 5, 15, 15)) - 25 / 175) < 1e-9`, caption: "IoU with its check." },

      { t: "h", text: "Running on edge hardware" },
      { t: "p", text: "A YOLO nano model at 640 × 640 input needs several billion multiply-accumulate operations per frame. On a Raspberry Pi 5's CPU that gives a few frames per second at best. Two common ways to get real time on a student budget:" },
      { t: "table", head: ["Platform", "Accelerator", "Model format", "How you get there"], rows: [
        ["Raspberry Pi 5 + AI HAT+ / AI Kit", "Hailo-8L or Hailo-8 NPU (13 or 26 TOPS)", "HEF (Hailo executable)", "Export to ONNX, compile with the Hailo Dataflow Compiler, or use Hailo's precompiled model zoo"],
        ["NVIDIA Jetson Orin Nano", "Ampere GPU with tensor cores", "TensorRT engine", "`model.export(format=\"engine\", half=True)` on the Jetson itself"],
        ["Any Linux PC or Pi CPU", "None", "ONNX or NCNN", "`model.export(format=\"onnx\")` or `format=\"ncnn\"`"],
      ], caption: "Check the Ultralytics and Hailo documentation for your exact model version; accelerator toolchains change often." },
      { t: "p", text: "Accelerators get their speed from **quantisation**: storing weights and activations as 8 bit integers instead of 32 bit floats. A real value v is represented by an integer q with a scale s and zero point z, v ≈ s · (q - z). If a layer's activations range from -6 to +6, s = 12 / 255 ≈ 0.047, so values are stored to within about 0.024 of the original. INT8 models are 4× smaller than FP32, and integer arithmetic is far cheaper in silicon. The cost is a small accuracy drop, kept small by **calibration**: running a few hundred representative images through the network to choose each layer's range. Hailo-8 and Hailo-8L run quantised integer models only (INT8 for almost every layer, with some 16-bit and 4-bit options), never floating point; Jetsons commonly use FP16 (`half=True`) or INT8." },
      { t: "note", kind: "tip", text: "Measure latency end to end, not just inference. Capture, resize, copy to the accelerator and post-processing often cost as much as the network. A detector at 30 fps with 150 ms of latency still makes a follower robot oscillate." },

      { t: "h", text: "Tracking over time" },
      { t: "p", text: "A detector treats every frame independently. It misses the target in some frames, swaps which of two people is which, and jitters the box by a few pixels. **Tracking** links detections across frames into persistent tracks with IDs." },
      { t: "list", items: [
        "**Centroid tracking**: match each new detection to the existing track whose last centroid is nearest, if within a gate distance. Simple and good for well separated targets.",
        "**IoU tracking**: match by highest IoU between the track's last box and new boxes, above a threshold such as 0.3. Works well at high frame rates where boxes move little between frames.",
        "**Track management**: start a new track for an unmatched detection, and delete a track after it has gone unmatched for, say, 10 frames. This bridges short gaps in detection.",
        "**Kalman tracking** (as in SORT and ByteTrack): each track has a Kalman filter with state (cx, cy, w, h and their velocities) under a constant velocity model. Each frame you predict, associate detections to predictions (by IoU, using the Hungarian algorithm for the best overall assignment), then update. Prediction carries the track through missed frames and smooths jitter.",
      ] },
      { t: "p", text: "Ultralytics has tracking built in (`model.track(frame, persist=True, tracker=\"bytetrack.yaml\")`), but you should be able to write a centroid tracker yourself in 30 lines, and know that the Kalman version is the a9 filter with a 2D constant velocity model." },

      { t: "h", text: "Perception in ROS 2" },
      { t: "p", text: "In ROS 2 (this module uses Lyrical Luth, the 2026 LTS; the same code runs on Jazzy), a camera driver publishes `sensor_msgs/Image` and `sensor_msgs/CameraInfo` (which carries K and the distortion coefficients). Three pieces glue OpenCV to it:" },
      { t: "list", items: [
        "**cv_bridge** converts between `sensor_msgs/Image` and NumPy arrays: `bridge.imgmsg_to_cv2(msg, desired_encoding=\"bgr8\")`.",
        "**image_transport** publishes images in compressed forms (`/image_raw/compressed`) as well as raw. Raw 640 × 480 colour at 30 fps is about 27 MB/s, too much for Wi-Fi; view the compressed topic from a laptop and process raw on the robot.",
        "**QoS**: sensor topics use the best effort `qos_profile_sensor_data`. A subscriber asking for reliable delivery from a best effort publisher receives nothing, a classic silent bug.",
      ] },
      { t: "p", text: "The follower controller is a pair of proportional laws. Let the image be W pixels wide, the target centroid at cx, and the target's distance Z (from marker tvec or from box size). Normalised horizontal error e = (cx - W/2) / (W/2) is between -1 and 1. Angular velocity ω = -k_ω · e turns towards the target (ROS positive ω is anticlockwise, to the left, while positive e means the target is to the right). Linear velocity v = k_v · (Z - Z_goal), clamped, drives to a standoff distance. Worked example: W = 640, cx = 400, so e = 80 / 320 = 0.25; with k_ω = 1.0 rad/s, ω = -0.25 rad/s, a gentle right turn. With Z = 1.5 m, Z_goal = 0.6 m and k_v = 0.5, v = 0.45 m/s, which the clamp limits to 0.3 m/s." },
      { t: "snippet", lang: "python", code: String.raw`import cv2
import numpy as np
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Image, CameraInfo
from geometry_msgs.msg import Twist
from cv_bridge import CvBridge

L = 0.10           # marker side, metres
TARGET_ID = 7
Z_GOAL = 0.6       # stop this far from the marker

class MarkerFollower(Node):
    def __init__(self):
        super().__init__("marker_follower")
        self.bridge = CvBridge()
        self.K = None
        self.dist = None
        d = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        self.detector = cv2.aruco.ArucoDetector(d, cv2.aruco.DetectorParameters())
        self.obj = np.array([[-L/2, L/2, 0], [L/2, L/2, 0],
                             [L/2, -L/2, 0], [-L/2, -L/2, 0]], np.float32)
        self.create_subscription(CameraInfo, "camera/camera_info", self.on_info, 10)
        self.create_subscription(Image, "camera/image_raw", self.on_image,
                                 qos_profile_sensor_data)
        self.pub = self.create_publisher(Twist, "cmd_vel", 10)
        self.last_seen = self.get_clock().now()
        self.create_timer(0.1, self.watchdog)

    def on_info(self, msg):
        self.K = np.array(msg.k).reshape(3, 3)
        self.dist = np.array(msg.d)

    def on_image(self, msg):
        if self.K is None:
            return
        gray = self.bridge.imgmsg_to_cv2(msg, desired_encoding="mono8")
        corners, ids, _ = self.detector.detectMarkers(gray)
        if ids is None or TARGET_ID not in ids.flatten():
            return
        c = corners[list(ids.flatten()).index(TARGET_ID)].reshape(4, 2)
        ok, rvec, tvec = cv2.solvePnP(self.obj, c, self.K, self.dist,
                                      flags=cv2.SOLVEPNP_IPPE_SQUARE)
        if not ok:
            return
        t = tvec.ravel()
        x, z = float(t[0]), float(t[2])     # right offset, distance ahead
        cmd = Twist()
        cmd.angular.z = float(np.clip(-1.5 * np.arctan2(x, z), -1.0, 1.0))
        cmd.linear.x = float(np.clip(0.5 * (z - Z_GOAL), 0.0, 0.3))
        self.pub.publish(cmd)
        self.last_seen = self.get_clock().now()

    def watchdog(self):
        # Stop if the marker has not been seen for half a second.
        if (self.get_clock().now() - self.last_seen).nanoseconds > 5e8:
            self.pub.publish(Twist())

def main():
    rclpy.init()
    rclpy.spin(MarkerFollower())

if __name__ == "__main__":
    main()`, caption: "The exit project core: a ROS 2 Python node that follows ArUco marker 7. Topic names depend on your camera driver; remap them at launch." },
      { t: "p", text: "Two design choices are worth noticing. The heading error uses the bearing atan2(x, z) in radians rather than pixels, so the gain does not depend on camera resolution. And the **watchdog** stops the robot when the target is lost: without it, the last command would keep the robot driving blind. Linear speed is clamped to zero from below so the robot never reverses into something it cannot see." },
      { t: "note", kind: "warn", text: "Some base controllers in recent ROS 2 releases (for example ros2_control's diff_drive_controller) expect `geometry_msgs/TwistStamped` on their velocity topic. If your robot ignores the Twist from this node, check the message type with `ros2 topic info -v` and either publish TwistStamped or add a converter." },
      { t: "note", kind: "safety", text: "Test followers with the wheels off the ground first, then at low speed limits in an open space. Keep a hand on the motor power switch or an emergency stop, since a detection glitch can command full speed." },

      { t: "deep", title: "Inside a YOLO head and the loss it is trained with", blocks: [
        { t: "p", text: "A YOLO network has a **backbone** (convolutions that extract features, downsampling the image by 8, 16 and 32), a **neck** that mixes features across those scales, and a **head** that, at every cell of each grid, predicts box geometry, an objectness or class score per class. A 640 × 640 input gives grids of 80 × 80, 40 × 40 and 20 × 20, which is 8400 candidate locations. Small objects are found on the fine grid and large ones on the coarse grid." },
        { t: "p", text: "Training combines a classification loss (binary cross entropy per class) with a box regression loss based on IoU (CIoU, which also penalises centre distance and aspect ratio mismatch) and, in recent versions, distribution focal loss for box edges. Older models then needed **non-maximum suppression** to delete the many overlapping predictions of one object; NMS is awkward on accelerators because it is sequential and data dependent. YOLO26 is trained with one-to-one label assignment so each object produces one box, removing NMS from deployment." },
        { t: "p", text: "Fine-tuning on your own objects needs a few hundred labelled images per class, labelled in a tool such as CVAT or Label Studio, then `model.train(data=\"my.yaml\", epochs=100, imgsz=640)`. Always hold out a test set captured on a different day and place, or you will measure memorisation, not detection." },
      ] },
      { t: "deep", title: "Kalman tracking in detail", blocks: [
        { t: "p", text: "SORT uses state x = (cx, cy, s, r, ċx, ċy, ṡ), where s is box area and r aspect ratio (assumed constant). The motion model is constant velocity: each step, cx ← cx + ċx and so on, with process noise allowing velocity to change. The measurement is (cx, cy, s, r) from the detector, so H picks the first four state entries." },
        { t: "formula", text: String.raw`predict:  x⁻ = F x,          P⁻ = F P Fᵀ + Q
associate: cost[i][j] = 1 - IoU(predicted box i, detection j)
           solve the assignment with the Hungarian algorithm,
           reject pairs with IoU < 0.3
update:   K = P⁻ Hᵀ (H P⁻ Hᵀ + R)⁻¹
          x = x⁻ + K (z - H x⁻),   P = (I - K H) P⁻`, caption: "The a9 Kalman filter, one per track." },
        { t: "p", text: "ByteTrack improves on this by also associating low confidence detections in a second pass, which keeps tracks alive through partial occlusion. DeepSORT adds an appearance descriptor from a small re-identification network, so a person who walks behind a pillar gets the same ID back. For a follower robot, a single track on one target with a constant velocity Kalman filter is usually enough, and its prediction lets the robot keep turning the right way for a moment when the target leaves the frame." },
      ] },
    ],
    mistakes: [
      "**Benchmarking inference alone.** Pre and post processing and copies often double the real latency. Time the whole loop.",
      "**Subscribing to camera images with reliable QoS.** Most drivers publish best effort; use `qos_profile_sensor_data` or you receive nothing.",
      "**No watchdog on the velocity command.** If the target disappears, the robot keeps executing the last command. Always time out to zero.",
      "**Steering on pixel error with a fixed gain.** The gain then changes with resolution and lens. Steer on bearing in radians.",
      "**Assuming quantisation is free.** An INT8 model calibrated on unrepresentative images can lose a lot of accuracy. Calibrate with images from your robot's camera.",
      "**Ignoring the sign of angular velocity.** Positive ω turns left in ROS. A sign error makes the robot turn away from the target and spin.",
    ],
    practice: {
      kind: "bench",
      task: "Exit project: a robot that detects and follows a marker or object with its camera.",
      steps: [
        "Bring up your robot's base driver and camera driver in ROS 2. Confirm `camera/image_raw`, `camera/camera_info` and `cmd_vel` with `ros2 topic list` and check the camera_info K against your calibration.",
        "Run the MarkerFollower node with the wheels lifted. Move the marker left and right and confirm the wheels turn the correct way; move it closer than 0.6 m and confirm forward speed drops to zero.",
        "On the floor, record a rosbag of `cmd_vel` and the marker pose while following a marker carried slowly around a room. Plot distance error over time.",
        "Replace the marker detector with a YOLO detector for one class (for example a person or a sports ball) on a Pi 5 with Hailo or a Jetson. Estimate distance from box height and a known object height.",
        "Add a centroid or IoU tracker so the robot follows the same target when two are in view, and report the end-to-end latency and frame rate.",
      ],
    },
    quiz: [
      {
        q: "Box A is (0, 0)-(4, 4) and box B is (2, 0)-(6, 4). What is their IoU?",
        options: ["0.25", "0.33", "0.50", "0.67"],
        answer: 1,
        why: "Intersection 2 × 4 = 8. Union 16 + 16 - 8 = 24. IoU = 8 / 24 ≈ 0.33.",
      },
      {
        q: "An INT8 layer represents activations from -4 to +4. What is the scale s, roughly?",
        options: ["0.016", "0.031", "0.25", "8"],
        answer: 1,
        why: "s = range / 255 = 8 / 255 ≈ 0.031 per integer step.",
      },
      {
        q: "Image width 640, target centroid at x = 160, k_ω = 1.0 rad/s using the normalised pixel law in the lesson. What angular velocity is commanded?",
        options: ["-0.5 rad/s", "+0.5 rad/s", "+0.25 rad/s", "-1.0 rad/s"],
        answer: 1,
        why: "e = (160 - 320) / 320 = -0.5, so ω = -k e = +0.5 rad/s, turning left towards a target on the left.",
      },
      {
        q: "Your ROS 2 node subscribes to the camera with default reliable QoS and never receives images, though `ros2 topic hz` shows 30 Hz. What is the likely cause?",
        options: [
          "cv_bridge is not installed",
          "The driver publishes best effort, which is incompatible with a reliable subscription",
          "The image is too large for ROS",
          "The node needs a timer",
        ],
        answer: 1,
        why: "A reliable subscriber cannot match a best effort publisher. Use qos_profile_sensor_data.",
      },
      {
        q: "What does a Kalman filter add to a tracker compared with plain IoU matching?",
        options: [
          "It detects new object classes",
          "It predicts where each track will be, bridging missed detections and smoothing jitter",
          "It removes the need for a detector",
          "It increases the image resolution",
        ],
        answer: 1,
        why: "The constant velocity prediction carries a track through frames with no detection, and the update averages out noisy boxes.",
      },
    ],
  },
};

export default lessons;
