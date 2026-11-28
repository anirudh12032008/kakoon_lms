import type { ModuleContent } from "../model/curriculum";

/**
 * Module a17: Machine learning on embedded devices.
 * Normal mode is complete on its own; `deep` holds derivations and detail.
 * Python snippets were run; numbers in worked examples checked. No long dashes.
 */
const lessons: ModuleContent = {
  "a17-ml-workflow-and-honest-evaluation": {
    id: "a17-ml-workflow-and-honest-evaluation",
    outcomes: [
      "Run the machine learning workflow from data collection to a held-out test score without leaking information",
      "Explain overfitting and use train, validation and test splits and cross-validation to detect it",
      "Compute and interpret a confusion matrix, precision, recall and F1 for an imbalanced problem",
      "Recognise dataset bias and failure modes, and decide when ML is the wrong tool",
    ],
    blocks: [
      { t: "h", text: "Why run ML on a microcontroller at all" },
      { t: "p", text: "An accelerometer sampled at 100 Hz produces 600 numbers per second. Streaming them to the cloud to decide whether someone has fallen costs radio energy, needs a network that may not be there, adds latency, and sends intimate data off the device. Running a small model on the ESP32 turns those 600 numbers into one decision (\"fall\" or \"no fall\") where the data is produced. That is **TinyML**: inference on microcontrollers with kilobytes of RAM and milliwatts of power. But a model is only as good as its data and its evaluation, and most failed TinyML projects fail there, not in deployment. So this module starts with the workflow and honest evaluation." },

      { t: "h", text: "The workflow" },
      { t: "list", ordered: true, items: [
        "**Define the task precisely.** Inputs (which sensor, rate, window length), outputs (classes, including an \"other\" or \"idle\" class), and the cost of each kind of error. Missing a fall is far worse than a false alarm; a keyword spotter that fires on television is annoying.",
        "**Collect data** on the target hardware, with the sensor mounted as it will be in use. Data from a phone accelerometer will not match an MPU-6050 on a wristband: different noise, range and orientation.",
        "**Label** it. For gestures, record each example as a separate file with its label; for continuous recordings, mark start and end times. Write labelling rules down so two people would agree.",
        "**Extract features** (next lesson) or feed raw windows to a model that learns its own.",
        "**Split** into training, validation and test sets.",
        "**Train** candidate models on the training set, choose between them and tune settings using the validation set.",
        "**Test once** on the test set and report that number.",
        "**Deploy**, then measure on the device and in the field, and collect the failures for the next round.",
      ] },

      { t: "h", text: "Splits, overfitting and leakage" },
      { t: "p", text: "A model with enough parameters can memorise its training data, getting it 100% right while learning nothing that transfers. That is **overfitting**, and the symptom is a gap: high accuracy on data it trained on, lower on data it has not seen. To see the gap you need data the model never touched. Typical splits are 70% training, 15% validation, 15% test. The **validation set** is used repeatedly while you choose features, model size and training length, so it slowly stops being unseen: you have tuned to it. The **test set** is used once, at the end, to give an unbiased estimate." },
      { t: "p", text: "The most damaging error is **leakage**: information from the test set reaching training. In sensor ML the usual cause is splitting windows at random. If you cut one 10-second recording of a person waving into twenty overlapping 1-second windows and scatter them across train and test, the test windows are nearly copies of training windows, and your accuracy is fiction. **Split by recording, and better by person or session**: all of Asha's recordings go in training or all in test. Then the test score measures what you care about, which is performance on a new user." },
      { t: "p", text: "With small datasets (a few hundred examples is normal in TinyML), a single split is noisy. **k-fold cross-validation** divides the training data into k groups (folds), trains k times, each time validating on a different fold, and averages. Use grouped folds (by person) for the same leakage reason. Five folds is a common choice." },
      { t: "diagram", text: String.raw`
 5-fold cross-validation, grouped by person (P1 to P10), test people held out separately
 fold 1: [VAL P1 P2][train P3 P4][train P5 P6][train P7 P8][train P9 P10]
 fold 2: [train P1 P2][VAL P3 P4][train P5 P6][train P7 P8][train P9 P10]
 fold 3: [train P1 P2][train P3 P4][VAL P5 P6][train P7 P8][train P9 P10]
 fold 4: [train P1 P2][train P3 P4][train P5 P6][VAL P7 P8][train P9 P10]
 fold 5: [train P1 P2][train P3 P4][train P5 P6][train P7 P8][VAL P9 P10]
 TEST  : P11 P12 (never used until the end)`, caption: "Each person appears in validation exactly once and never in the same fold as their own training data." },

      { t: "h", text: "Accuracy lies on imbalanced data" },
      { t: "p", text: "Falls are rare. Suppose your test set has 1000 two-second windows, of which 50 contain a fall. A model that always says \"no fall\" is 95% accurate and useless. You need the **confusion matrix**, which counts each combination of true and predicted class." },
      { t: "table", head: ["", "Predicted fall", "Predicted no fall", "Total"], rows: [
        ["Actual fall", "TP = 42", "FN = 8", "50"],
        ["Actual no fall", "FP = 30", "TN = 920", "950"],
        ["Total", "72", "928", "1000"],
      ], caption: "A fall detector evaluated on a held-out test set." },
      { t: "formula", text: String.raw`Accuracy  = (TP + TN) / total     = (42 + 920) / 1000  = 0.962
Precision = TP / (TP + FP)        = 42 / 72            ≈ 0.583
Recall    = TP / (TP + FN)        = 42 / 50            = 0.840
F1        = 2 · P · R / (P + R)   = 2 · 0.583 · 0.840 / 1.423 ≈ 0.689`, caption: "Precision: when it alarms, how often is it right? Recall: of real falls, how many did it catch?" },
      { t: "p", text: "**Check the numbers:** the four cells add to 42 + 8 + 30 + 920 = 1000, and each row adds to its class total (50 and 950). Accuracy 96.2% looks excellent and only slightly beats the useless 95% baseline. The real story is in the other numbers: the detector catches 84% of falls (8 missed falls is the figure a carer will ask about), and 30 false alarms in 950 normal windows means 42% of its alarms are false. If the device evaluates a window every two seconds, all day, those false alarms add up: 30/950 of the 43,200 windows in a day is about 1364 false alarms per day. That would be unusable, and the accuracy figure hid it completely. Report per-class precision and recall, and always translate error rates into events per day in the field." },
      { t: "p", text: "Most classifiers output a score, and you choose the threshold above which you call it a fall. Raising the threshold trades recall for precision. Choose it from the costs you defined at step 1, on the validation set, never on the test set." },

      { t: "h", text: "Bias and failure modes" },
      { t: "list", items: [
        "**Population bias.** Training a fall detector on twenty-year-old engineering students who fall onto a mattress, then deploying it for elderly people whose falls are slower, produces a model that misses the falls that matter. A keyword spotter trained on one accent underperforms on others.",
        "**Condition shift.** A model trained with the wristband on the left wrist, at room temperature, with a fresh battery, may fail on the right wrist or when the sensor's offset drifts.",
        "**The unknown class.** A gesture model trained only on \"circle\", \"swipe\" and \"tap\" will confidently call scratching your head one of the three, because softmax outputs always sum to one. Collect an \"other\" class of everyday motion and noise.",
        "**Label noise.** Inconsistent labels cap achievable accuracy. Two labellers disagreeing on 10% of windows means 90% agreement is roughly your ceiling.",
        "**Silent degradation.** Unlike code, a model does not crash when it is wrong. Log predictions with confidence in the field and review a sample.",
      ] },

      { t: "h", text: "When not to use ML" },
      { t: "p", text: "Use ML when the rule is hard to write but easy to demonstrate with examples. Do not use it when a rule is easy to write. \"Alarm if temperature exceeds 45 °C\" is a comparison. Detecting that a motor is drawing more current than usual is a threshold on RMS current. Counting steps is peak detection on filtered acceleration magnitude, and works well. Use ML also only when you can collect enough representative data, including the failures, and when you can tolerate a probabilistic answer. A safety function that must be certified (a machine guard, a medical alarm) usually needs deterministic, verifiable logic, perhaps with ML as an advisory layer on top. Always build the simple baseline first; if a threshold gets 90% and the neural net 91%, ship the threshold." },

      { t: "deep", title: "Bias, variance and learning curves", blocks: [
        { t: "p", text: "Expected error on new data can be split into bias (the model is too simple to represent the pattern), variance (the model is so flexible it fits the noise of this particular training set), and irreducible noise. A small decision tree has high bias and low variance; a deep unpruned tree has low bias and high variance. Regularisation (weight decay, dropout, tree depth limits, early stopping) trades a little bias for less variance." },
        { t: "p", text: "A **learning curve** plots training and validation score against the amount of training data. If both are low and close, the model is too simple: more data will not help, a richer model or better features will. If training is high and validation much lower, the model is overfitting: more data, augmentation or regularisation will help. Plotting this for your dataset tells you whether to spend the next week collecting data or changing the model, which is the most useful decision in a TinyML project." },
      ] },
      { t: "deep", title: "Computing the metrics in Python, and the confusion matrix for more classes", blocks: [
        { t: "snippet", lang: "python", code: String.raw`def metrics(tp, fn, fp, tn):
    total = tp + fn + fp + tn
    acc = (tp + tn) / total
    prec = tp / (tp + fp)
    rec = tp / (tp + fn)
    f1 = 2 * prec * rec / (prec + rec)
    return acc, prec, rec, f1

acc, p, r, f1 = metrics(tp=42, fn=8, fp=30, tn=920)
print(f"acc={acc:.3f} precision={p:.3f} recall={r:.3f} f1={f1:.3f}")
# acc=0.962 precision=0.583 recall=0.840 f1=0.689

windows_per_day = 24 * 3600 // 2          # one 2 s window at a time
false_alarms = 30 / 950 * windows_per_day
print(round(false_alarms), "false alarms per day")   # 1364
assert abs(f1 - 0.6885) < 1e-3`, caption: "Pure Python, runs as is. In practice use sklearn.metrics.confusion_matrix and classification_report." },
        { t: "p", text: "With more than two classes the matrix is N by N. Each class has its own precision (its column) and recall (its row). Report the **macro average** (mean over classes, so rare classes count equally) as well as the **weighted average** (by class frequency). Look at the off-diagonal cells: if \"swipe left\" is mostly confused with \"swipe right\", the problem may be a mirrored sensor axis rather than the model." },
      ] },
    ],
    mistakes: [
      "**Splitting overlapping windows at random across train and test.** Near-identical windows leak, and test accuracy becomes meaningless. Split by recording or person.",
      "**Reporting accuracy on imbalanced data.** Report per-class precision and recall and the false alarms per day.",
      "**Tuning on the test set.** Every time you adjust after looking at the test score, it becomes a validation score. Use it once.",
      "**No \"other\" class.** The model will force every motion into a known gesture.",
      "**Collecting training data with a different sensor or mounting than deployment.** The model learns the wrong noise and orientation.",
      "**Skipping the simple baseline.** A threshold may be as good, cheaper and explainable.",
    ],
    practice: {
      kind: "bench",
      task: "Collect and split a dataset honestly for your exit project (gesture, keyword or fall detection).",
      steps: [
        "Define the task: classes including an \"other\" class, sensor and sample rate, window length, and the cost of a false positive versus a false negative.",
        "Write an ESP32 sketch that streams sensor data over serial with a label you set from the keyboard, and a PC Python script that saves each example as a CSV with label, person and session.",
        "Collect at least 30 examples per class from at least 5 people, plus 5 minutes of \"other\" activity per person.",
        "Split by person into training (with grouped 5-fold cross-validation) and a held-out test group. Write down which people are in the test set and do not open it.",
        "Build a non-ML baseline (for example a threshold on peak acceleration magnitude) and record its confusion matrix on the validation folds.",
      ],
    },
    quiz: [
      {
        q: "A test set has 200 keyword examples and 1800 background examples. A model always predicts background. What is its accuracy?",
        options: ["10%", "50%", "90%", "100%"],
        answer: 2,
        why: "It is right on all 1800 background examples and wrong on all 200 keywords: 1800 / 2000 = 90%, with zero recall for the keyword.",
      },
      {
        q: "A detector has TP = 30, FN = 10, FP = 20, TN = 940. What are precision and recall?",
        options: ["Precision 0.60, recall 0.75", "Precision 0.75, recall 0.60", "Precision 0.97, recall 0.75", "Precision 0.60, recall 0.97"],
        answer: 0,
        why: "Precision = 30 / (30 + 20) = 0.60. Recall = 30 / (30 + 10) = 0.75.",
      },
      {
        q: "You cut each 10 s recording into overlapping 1 s windows and split windows randomly into train and test. Test accuracy is 99%. What is wrong?",
        options: ["Nothing; 99% is a good result", "Windows from the same recording are nearly identical and appear in both sets, so the test set leaks training data", "The windows are too short", "Random splits always underestimate accuracy"],
        answer: 1,
        why: "Overlapping windows from one recording are near copies. Split by recording or by person so the test measures generalisation.",
      },
      {
        q: "Training accuracy is 99% and validation accuracy is 72%. What does this suggest?",
        options: ["The model is too simple", "The validation set is too large", "The learning rate is too low", "The model is overfitting; it has memorised training data"],
        answer: 3,
        why: "A large gap between training and validation scores is the signature of overfitting.",
      },
      {
        q: "Which task is the weakest case for on-device ML?",
        options: ["Recognising a spoken keyword", "Classifying five hand gestures from an IMU", "Raising an alarm when a temperature exceeds 45 °C", "Detecting abnormal vibration patterns in a pump"],
        answer: 2,
        why: "A fixed threshold is a single comparison. It is simpler, cheaper, deterministic and fully explainable; ML adds nothing.",
      },
      {
        q: "A gesture model trained on three gestures labels head-scratching as \"circle\" with 0.9 confidence. What is the best fix?",
        options: ["Lower the learning rate", "Add an \"other\" class with recorded everyday motions", "Quantise the model", "Use a larger window"],
        answer: 1,
        why: "Softmax always distributes probability over known classes. The model needs examples of motions that are none of the gestures.",
      },
    ],
  },

  "a17-features-and-model-types": {
    id: "a17-features-and-model-types",
    outcomes: [
      "Window a sensor stream and compute time-domain and FFT features for motion",
      "Explain how spectrograms and MFCCs represent sound for keyword spotting, and what vision on a microcontroller can do",
      "Choose between a decision tree, a small dense network, a 1D CNN and a depthwise-separable CNN for a task",
      "Estimate a model's parameter count, flash and RAM before training it",
    ],
    blocks: [
      { t: "h", text: "Why features decide whether a small model can work" },
      { t: "p", text: "A microcontroller model has a few thousand to a few hundred thousand parameters, against hundreds of millions in a phone's vision model. It cannot afford to learn from raw data what an engineer already knows: that a tap is a short spike, that a wave is a 2 Hz oscillation, that speech is best seen as energy per frequency band over time. **Features** are that knowledge, computed by ordinary signal processing before the model. Good features let a tiny model succeed; bad ones make even a large model fail." },

      { t: "h", text: "Windowing" },
      { t: "p", text: "Sensors produce a continuous stream; classifiers want fixed-size inputs. So the stream is cut into **windows** of N samples, usually overlapping. Window length should cover one complete event: a gesture takes 1 to 2 s, a keyword about 1 s, a fall including impact and stillness about 2 to 3 s. Overlap (often 50%) ensures an event is not split between two windows, and **hop** (the step between window starts) sets how often you make a decision." },
      { t: "formula", text: String.raw`Accelerometer at fs = 100 Hz, window N = 128 samples, hop 64 (50% overlap)
Window duration    = 128 / 100        = 1.28 s
Decision interval  = 64 / 100         = 0.64 s
FFT bin spacing    = fs / N = 100/128 ≈ 0.78 Hz
Highest frequency  = fs / 2           = 50 Hz   (Nyquist)`, caption: "A power-of-two N lets you use a fast FFT; 128 samples is a common choice." },

      { t: "h", text: "Motion features" },
      { t: "p", text: "For each axis (x, y, z) and often for the magnitude √(x² + y² + z²), which does not depend on orientation, compute a small set of numbers per window:" },
      { t: "list", items: [
        "**Mean**: mostly the gravity component, which tells you orientation.",
        "**Standard deviation and RMS**: how vigorous the motion is. RMS = √( (1/N) Σ xᵢ² ). Subtract the mean first if you want only the dynamic part.",
        "**Min, max and peak-to-peak**: impacts in a fall show as a large peak in magnitude, often above 2 to 3 g, followed by low variance (lying still).",
        "**Zero crossings** of the mean-removed signal: a rough frequency estimate.",
        "**FFT band energies**: the spectrum summarised into a few bins (for example 0 to 2, 2 to 5, 5 to 10, 10 to 20 Hz). Walking has a strong peak near 2 Hz; tremor sits at 4 to 12 Hz.",
      ] },
      { t: "snippet", lang: "python", code: String.raw`import math

def features(x, fs):
    """Mean, RMS (mean removed), peak-to-peak, and band energies for one axis."""
    n = len(x)
    mean = sum(x) / n
    d = [v - mean for v in x]
    rms = math.sqrt(sum(v * v for v in d) / n)
    p2p = max(x) - min(x)
    # Naive DFT magnitude for bins 1..n/2 (use numpy.fft.rfft or CMSIS-DSP in practice)
    mags = []
    for k in range(1, n // 2 + 1):
        re = sum(d[i] * math.cos(2 * math.pi * k * i / n) for i in range(n))
        im = -sum(d[i] * math.sin(2 * math.pi * k * i / n) for i in range(n))
        mags.append(math.hypot(re, im))
    bands = [(0, 2), (2, 5), (5, 10), (10, 20)]
    energy = []
    for lo, hi in bands:
        e = sum(m * m for k, m in enumerate(mags, start=1) if lo <= k * fs / n < hi)
        energy.append(e)
    return mean, rms, p2p, energy

fs, n = 100, 128
wave = [1.0 + 0.5 * math.sin(2 * math.pi * 3.125 * i / fs) for i in range(n)]
mean, rms, p2p, energy = features(wave, fs)
print(f"mean={mean:.3f} rms={rms:.3f} p2p={p2p:.3f}")
print("band with most energy:", energy.index(max(energy)))   # 1 -> the 2 to 5 Hz band
assert abs(rms - 0.5 / math.sqrt(2)) < 1e-3 and energy.index(max(energy)) == 1`, caption: "A 3.125 Hz sine of amplitude 0.5 g on a 1 g offset: four whole cycles in the window, so the energy lands cleanly in one FFT bin." },
      { t: "p", text: "**Check the output:** the mean of a sine over whole cycles is its offset, 1.0. The RMS of a sine of amplitude A is A / √2 = 0.5 / 1.414 ≈ 0.354, and peak-to-peak is 2A = 1.0. The frequency 3.125 Hz is exactly bin 4 (4 × 0.78125 Hz), which falls in the 2 to 5 Hz band, index 1. The program asserts all of this." },

      { t: "h", text: "Sound features: spectrograms and MFCCs" },
      { t: "p", text: "Raw audio at 16 kHz is 16,000 numbers per second, too many for a small model and in the wrong form: speech is recognised by which frequencies carry energy and how that changes over time. A **spectrogram** cuts the audio into short frames (typically 30 ms, hop 20 ms), applies a window function such as Hann, takes the FFT of each, and keeps the magnitude. A 1 s clip with 30 ms frames (480 samples) and 20 ms hop (320 samples) gives 1 + (16000 - 480) / 320 = 49.5, so **49 frames**." },
      { t: "p", text: "Human hearing resolves low frequencies finely and high ones coarsely, so a **mel filterbank** sums the FFT bins into, say, 40 triangular bands spaced evenly on the mel scale, mel(f) = 2595 · log₁₀(1 + f / 700). Taking the logarithm gives a **log-mel spectrogram**: for our clip a 49 × 40 image, which is exactly the input of the classic TensorFlow Lite Micro \"micro speech\" keyword example. **MFCCs** go one step further: a discrete cosine transform of each log-mel frame, keeping the first 10 to 13 coefficients, which decorrelates them and compresses further. CNNs often do as well on log-mel features directly, so modern keyword spotters frequently skip the DCT." },
      { t: "p", text: "**Vision** on a microcontroller works at very low resolution: 96 × 96 grayscale is common (9216 bytes per frame), enough for person detection, simple object presence, or reading a dial. The ESP32-S3, with vector instructions and PSRAM, is the Espressif chip suited to this (for example the ESP32-S3-EYE board with a camera). Preprocessing is resizing, conversion to grayscale and normalisation; the features are learned by a CNN." },

      { t: "h", text: "Model types that fit" },
      { t: "table", head: ["Model", "Input", "Typical size", "Strengths", "Weaknesses"], rows: [
        ["Decision tree / random forest", "Hand-made features", "Hundreds of bytes to a few kB", "Tiny, fast, explainable; compiles to if-statements", "Needs good features; poor on raw signals"],
        ["Small dense network (MLP)", "Feature vector", "1 to 20 kB", "Smooth decision boundaries, easy to quantise", "No notion of time or position in input"],
        ["1D CNN", "Raw or lightly filtered sensor windows", "5 to 50 kB", "Learns local temporal patterns; shift tolerant", "More compute and RAM for activations"],
        ["Depthwise-separable 2D CNN (MobileNet-style, DS-CNN)", "Spectrograms, small images", "20 to 300 kB", "Best accuracy per operation for audio and vision", "Needs more data and a capable chip"],
      ], caption: "Start at the top of the table and move down only if the simpler model is not good enough." },
      { t: "p", text: "**Size estimate before training.** A dense layer from n inputs to m outputs has n × m weights plus m biases. A gesture MLP with 30 features (3 axes × 10 features each), one hidden layer of 16 and 4 output classes has 30 × 16 + 16 = 496 parameters in the first layer and 16 × 4 + 4 = 68 in the second: **564 parameters**, about 564 bytes as int8, plus a few hundred bytes of activation RAM. It fits on an Arduino Uno's 32 kB flash, never mind an ESP32." },
      { t: "p", text: "Why depthwise-separable convolutions? A standard 3 × 3 convolution from 32 to 64 channels needs 3 × 3 × 32 × 64 = **18,432** weights, and the same number of multiply-adds per output pixel. A depthwise-separable version first applies one 3 × 3 filter per input channel (3 × 3 × 32 = 288 weights), then a 1 × 1 pointwise convolution to mix channels (32 × 64 = 2048 weights): **2336** in total, about 12.7% of the original, with similar accuracy in practice. That factor is why MobileNet and DS-CNN keyword spotters run on microcontrollers." },
      { t: "note", kind: "tip", text: "RAM is usually the tighter limit, not flash. Weights live in flash and are read in place; activations (the intermediate outputs of each layer) must be in RAM, and the runtime needs a working buffer (the tensor arena) big enough for the largest pair of adjacent layers. A 49 × 40 input with 64 channels after the first layer is 49 × 40 × 64 = 125,440 bytes as int8: too much for many boards, which is why the first layer of a keyword model uses a stride of 2." },

      { t: "deep", title: "Choosing window length and sample rate from the physics", blocks: [
        { t: "p", text: "Human voluntary motion has almost all its energy below 20 Hz, so sampling an accelerometer at 50 to 100 Hz (Nyquist 25 to 50 Hz) is enough, provided the sensor's internal low-pass filter (the MPU-6050's DLPF setting, for example) removes content above Nyquist; otherwise impacts alias into low bins. Impacts in falls have content above 20 Hz, so fall detectors often sample at 100 to 200 Hz. Speech intelligibility lies mostly below 4 kHz, which is why 16 kHz audio (Nyquist 8 kHz) is the standard for keyword spotting." },
        { t: "p", text: "Frequency resolution is fs / N, and time resolution is N / fs: you cannot improve one without worsening the other for a single window. Applying a window function (Hann) before the FFT reduces spectral leakage, at the cost of slightly wider peaks. For band energies over wide bands, leakage matters little; for a pure-tone detector, it matters a lot." },
      ] },
      { t: "deep", title: "How a 1D CNN sees a sensor window", blocks: [
        { t: "p", text: "Input: a window of 128 time steps × 3 channels (x, y, z). A Conv1D layer with 8 filters of kernel size 5 has 5 × 3 × 8 + 8 = 128 parameters and outputs 124 × 8 (no padding). Each filter slides along time looking for one short pattern, such as a sharp rise in z. Max pooling of 2 halves the time axis to 62 × 8. A second Conv1D of 16 filters, kernel 5: 5 × 8 × 16 + 16 = 656 parameters, output 58 × 16. Global average pooling reduces it to 16 numbers, and a dense layer to 4 classes adds 16 × 4 + 4 = 68. Total 852 parameters." },
        { t: "p", text: "The largest activation is the first conv output, 124 × 8 = 992 values, so the arena needs only a few kilobytes as int8. Compared with the MLP on hand-made features, the CNN learns its own features from raw data, at the cost of more multiply-adds (about 124 × 5 × 3 × 8 ≈ 14,880 in the first layer alone) and a need for more training examples." },
      ] },
    ],
    mistakes: [
      "**Windows shorter than the event.** Half a gesture in each window cannot be classified. Size windows to the longest event and overlap them.",
      "**Computing features differently in training and on the device.** Units, scaling, axis order or window alignment that differ between Python and C silently ruin accuracy. Test the device features against Python on the same recorded data.",
      "**Forgetting the anti-alias filter.** Sampling below twice the highest frequency present folds impacts into low bins.",
      "**Starting with a CNN when a decision tree on ten features would do.** Simpler models need less data and are easier to debug.",
      "**Estimating only flash, not RAM.** Activations and the tensor arena are what usually do not fit.",
    ],
    practice: {
      kind: "bench",
      task: "Build and compare features and models for your exit project dataset.",
      steps: [
        "Write a Python function that windows your recordings (choose N and hop from your event length) and computes mean, RMS, peak-to-peak and four band energies per axis and for magnitude.",
        "Train a decision tree (scikit-learn, max depth 5) and a small MLP on those features using the grouped cross-validation from the previous lesson. Record per-class precision and recall.",
        "Train a small 1D CNN on raw windows with the same folds. Compare scores and parameter counts in a table.",
        "Estimate flash and arena RAM for each candidate as int8 and compare with your board's free memory.",
        "Choose one model and justify it in three sentences, including why the simpler options were or were not enough.",
      ],
    },
    quiz: [
      {
        q: "An accelerometer is sampled at 50 Hz with a 64-sample window. What is the FFT bin spacing?",
        options: ["0.39 Hz", "1.28 Hz", "25 Hz", "0.78 Hz"],
        answer: 3,
        why: "Bin spacing is fs / N = 50 / 64 ≈ 0.78 Hz.",
      },
      {
        q: "A window of one axis contains a pure sine of amplitude 0.8 g with zero mean. What is its RMS?",
        options: ["0.40 g", "0.57 g", "0.80 g", "1.60 g"],
        answer: 1,
        why: "The RMS of a sine is amplitude / √2 = 0.8 / 1.414 ≈ 0.57 g.",
      },
      {
        q: "A dense layer has 40 inputs and 10 outputs. How many parameters does it have?",
        options: ["50", "400", "410", "440"],
        answer: 2,
        why: "40 × 10 weights plus 10 biases = 410.",
      },
      {
        q: "Why do keyword spotters use a log-mel spectrogram rather than raw 16 kHz samples?",
        options: ["It represents energy per perceptually spaced frequency band over time, which is what distinguishes words, in far fewer numbers", "Raw samples cannot be stored on a microcontroller", "It removes the need for a model", "It makes audio louder"],
        answer: 0,
        why: "A 49 × 40 log-mel image summarises one second of speech in the form that matters for recognition, instead of 16,000 raw values.",
      },
      {
        q: "Replacing a standard 3 × 3 convolution from 16 to 32 channels by a depthwise-separable one changes the weight count from what to what?",
        options: ["4608 to 656", "4608 to 4608", "512 to 144", "4608 to 2304"],
        answer: 0,
        why: "Standard: 3 × 3 × 16 × 32 = 4608. Separable: depthwise 3 × 3 × 16 = 144 plus pointwise 16 × 32 = 512, total 656.",
      },
    ],
  },

  "a17-quantisation-deployment-and-measurement": {
    id: "a17-quantisation-deployment-and-measurement",
    outcomes: [
      "Quantise a model to int8 and work the affine scale and zero-point mapping by hand",
      "Deploy a model to an ESP32 with TensorFlow Lite Micro (LiteRT for Microcontrollers) via esp-tflite-micro, or with Edge Impulse",
      "Measure inference latency, flash, RAM and energy per inference on the device",
      "Deliver a gesture, keyword or fall detector running entirely on a microcontroller, evaluated honestly",
    ],
    blocks: [
      { t: "h", text: "Why quantise" },
      { t: "p", text: "A model trained in Python stores each weight as a 32-bit float. On a microcontroller that costs four times the flash and RAM that an 8-bit integer would, and float arithmetic is slower than integer arithmetic on most cores (the ESP32 has a single-precision FPU, but its integer and vector paths are still faster; the ESP32-S3's vector instructions work on 8-bit integers; an Arduino Uno has no FPU at all). **Quantisation** stores weights and activations as int8, cutting memory by four and usually speeding inference by two to four times, typically for a loss of under one percentage point of accuracy. It is the single most important step in fitting a model to a microcontroller." },

      { t: "h", text: "The affine mapping" },
      { t: "p", text: "Int8 quantisation maps a real range [r_min, r_max] onto the 256 integers from -128 to 127 using a **scale** s (the real value of one integer step) and a **zero point** z (the integer that represents real 0.0)." },
      { t: "formula", text: String.raw`real  r  ≈  s · (q - z)
quantise:    q = clamp( round(r / s) + z , -128, 127 )
scale:       s = (r_max - r_min) / (q_max - q_min) = (r_max - r_min) / 255
zero point:  z = round( q_min - r_min / s )        = round( -128 - r_min / s )`, caption: "r_min must be ≤ 0 ≤ r_max so that 0.0 is exactly representable (padding and ReLU depend on it)." },
      { t: "p", text: "**Worked example.** A layer's activations range from -2.0 to 6.0 on the calibration data." },
      { t: "formula", text: String.raw`s = (6.0 - (-2.0)) / 255 = 8 / 255         ≈ 0.031373
z = round(-128 - (-2.0) / 0.031373)
  = round(-128 + 63.75) = round(-64.25)    = -64
Quantise r = 1.0:  q = round(1.0 / 0.031373) + (-64) = round(31.875) - 64 = 32 - 64 = -32
Dequantise:        r = 0.031373 × (-32 - (-64)) = 0.031373 × 32 ≈ 1.0039
Error              = 0.0039  ≤  s/2 ≈ 0.0157   ✓
Check r = 0:       q = round(0) - 64 = -64 → r = s × 0 = 0.0 exactly  ✓`, caption: "The rounding error of any in-range value is at most half a step." },
      { t: "p", text: "**Check the ends too:** r = -2.0 gives round(-63.75) - 64 = -64 - 64 = -128, and r = 6.0 gives round(191.25) - 64 = 191 - 64 = 127. The whole range maps onto the int8 range with nothing clipped. TensorFlow Lite uses exactly this scheme for activations (asymmetric, per tensor), while weights are quantised **symmetrically** (z = 0, range ±max|w|) and **per channel**, with one scale per output channel of a convolution, because channels can have very different ranges." },
      { t: "p", text: "Inside the model, a layer multiplies int8 inputs by int8 weights, accumulates in int32, then rescales to the next layer's int8 using a fixed-point multiplier derived from s_in × s_w / s_out. No floats are needed at inference. The output is dequantised only at the very end if you want probabilities." },

      { t: "h", text: "Post-training quantisation in practice" },
      { t: "p", text: "**Post-training quantisation (PTQ)** converts a trained float model using a **representative dataset**: a few hundred real input examples run through the model to record the range of every activation. Choose them from training data that covers all classes and conditions; if the calibration data never includes a hard impact, the activation range is too small and impacts will clip. If PTQ loses too much accuracy, **quantisation-aware training** (QAT) simulates int8 rounding during training so the weights adapt to it." },
      { t: "snippet", lang: "python", code: String.raw`# TensorFlow 2.x: train a tiny model, then full-integer post-training quantisation.
import numpy as np
import tensorflow as tf

x_train = np.load("features_train.npy").astype(np.float32)   # shape (n, 30)
y_train = np.load("labels_train.npy")                          # ints 0..3

model = tf.keras.Sequential([
    tf.keras.Input(shape=(30,)),
    tf.keras.layers.Dense(16, activation="relu"),
    tf.keras.layers.Dense(4, activation="softmax"),
])
model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(x_train, y_train, epochs=60, batch_size=32, validation_split=0.2, verbose=0)

def representative_data():
    for i in np.random.choice(len(x_train), 300, replace=False):
        yield [x_train[i:i + 1]]

conv = tf.lite.TFLiteConverter.from_keras_model(model)
conv.optimizations = [tf.lite.Optimize.DEFAULT]
conv.representative_dataset = representative_data
conv.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
conv.inference_input_type = tf.int8
conv.inference_output_type = tf.int8
tflite_model = conv.convert()
open("gesture_int8.tflite", "wb").write(tflite_model)
print(len(tflite_model), "bytes")

# Turn it into a C array for the firmware:  xxd -i gesture_int8.tflite > model_data.cc`, caption: "Check the quantised model's accuracy with the TFLite interpreter on your validation folds before deploying. Requires TensorFlow; newer releases also provide the same converter in the LiteRT package (ai-edge-litert)." },

      { t: "h", text: "Deploying: TensorFlow Lite Micro and Edge Impulse" },
      { t: "p", text: "In 2024 Google renamed TensorFlow Lite to **LiteRT**. The microcontroller runtime, still developed in the `tensorflow/tflite-micro` repository and widely called **TensorFlow Lite Micro (TFLM)**, is now documented as LiteRT for Microcontrollers. It is a C++ interpreter with no dynamic memory allocation: you give it a fixed byte array, the **tensor arena**, and register only the operators your model uses. For the ESP32 family, Espressif maintains the **`esp-tflite-micro`** component (install with `idf.py add-dependency \"espressif/esp-tflite-micro\"`), which plugs in **ESP-NN**, Espressif's optimised kernels for convolution, depthwise convolution and fully connected layers, using the vector instructions of the ESP32-S3 where available. It runs under ESP-IDF; examples include hello world, micro speech and person detection." },
      { t: "snippet", lang: "cpp", code: String.raw`// ESP-IDF 5.x with espressif/esp-tflite-micro. Classifies one 30-feature vector.
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include <cmath>
#include "esp_timer.h"
#include "esp_log.h"
#include "model_data.h"           // extern const unsigned char gesture_int8_tflite[];

static const char *TAG = "tinyml";
constexpr int kArenaSize = 8 * 1024;
alignas(16) static uint8_t arena[kArenaSize];

static tflite::MicroInterpreter *interp;

void ml_init() {
    const tflite::Model *model = tflite::GetModel(gesture_int8_tflite);
    static tflite::MicroMutableOpResolver<2> ops;   // register only what the model uses
    ops.AddFullyConnected();
    ops.AddSoftmax();
    static tflite::MicroInterpreter i(model, ops, arena, kArenaSize);
    interp = &i;
    if (interp->AllocateTensors() != kTfLiteOk) { ESP_LOGE(TAG, "arena too small"); return; }
    ESP_LOGI(TAG, "arena used: %u bytes", (unsigned)interp->arena_used_bytes());
}

int ml_classify(const float *features) {      // features computed exactly as in Python
    TfLiteTensor *in = interp->input(0);
    const float s = in->params.scale; const int z = in->params.zero_point;
    for (int k = 0; k < 30; k++) {
        int q = (int)lroundf(features[k] / s) + z;
        in->data.int8[k] = (int8_t)(q < -128 ? -128 : q > 127 ? 127 : q);
    }
    int64_t t0 = esp_timer_get_time();
    interp->Invoke();
    ESP_LOGI(TAG, "inference %lld us", (long long)(esp_timer_get_time() - t0));
    TfLiteTensor *out = interp->output(0);
    int best = 0;
    for (int c = 1; c < 4; c++) if (out->data.int8[c] > out->data.int8[best]) best = c;
    return best;
}`, caption: "The quantise loop is the formula from this lesson. Start with a generous arena, read `arena_used_bytes()`, then shrink it." },
      { t: "p", text: "**Edge Impulse** (now part of Qualcomm) is a hosted platform that covers the whole workflow: data collection from a device or phone, labelling, signal processing blocks (spectral features, MFE and MFCC for audio), model training with a choice of architectures, an estimate of latency and memory on a chosen target, and export as a C++ library or an Arduino library that includes the feature extraction code, so training and device features match. It is quick and good for learning; be aware that the project and its data live on a third-party service, and check its free-tier terms. Doing it yourself with TensorFlow and esp-tflite-micro teaches you every step and keeps everything local. Both are legitimate engineering choices." },

      { t: "h", text: "Measuring on the device" },
      { t: "list", items: [
        "**Latency.** Time `Invoke()` with `esp_timer_get_time()` (microseconds), and separately time feature extraction, which is often slower than the model. Report the median and the worst case over hundreds of runs, with Wi-Fi on, because interrupts add jitter.",
        "**Flash.** The model array size plus the TFLM library code; `idf.py size-components` breaks the binary down.",
        "**RAM.** `arena_used_bytes()` after `AllocateTensors()`, plus input buffers (a ring buffer of audio or IMU samples) and the feature buffers. Check `heap_caps_get_free_size(MALLOC_CAP_8BIT)` before and after.",
        "**Energy.** Measure current with a USB power meter or, better, a shunt resistor and oscilloscope, or a power profiler, on the 3.3 V rail, not on USB 5 V where the regulator and USB chip add their own draw. Energy per inference = V × I × t.",
      ] },
      { t: "formula", text: String.raw`Energy per inference  = V × ΔI × t = 3.3 V × 0.100 A × 0.020 s = 6.6 mJ
At one inference per second, average extra current = 0.100 A × 0.020 = 2 mA
Feature extraction 5 ms at the same current         adds 0.5 mA
Total ≈ 2.5 mA extra over the CPU's idle or sleep current`, caption: "Example numbers for an ESP32 at 240 MHz with 100 mA extra during a 20 ms inference. Measure your own: they vary widely with model and clock." },
      { t: "p", text: "That arithmetic shows where energy really goes in a battery TinyML device: running the model briefly is cheap compared with keeping the CPU awake to collect samples, and far cheaper than the radio. Designs that last on batteries keep the sensor buffering into its own FIFO while the CPU sleeps, wake to run features and the model, and transmit only the rare positive result." },

      { t: "h", text: "The exit project" },
      { t: "p", text: "Build a gesture, keyword or fall detector that runs entirely on a microcontroller: sensor sampling, features, inference and the decision, with no PC or cloud in the loop (the radio may report results). Deliver: the task definition and error costs; the dataset description (people, sessions, classes, how it was split); the baseline and the chosen model with cross-validation results; the held-out test confusion matrix, precision and recall, and false alarms per hour estimated from a long recording of normal activity; the float versus int8 accuracy comparison; on-device latency, flash, arena RAM and energy per inference; a check that device features match Python features on the same recorded data; and a list of known failure modes and populations or conditions not covered by your data." },

      { t: "deep", title: "Deriving the zero point and why 0.0 must be exact", blocks: [
        { t: "p", text: "Require that r_min maps to q_min: r_min = s(q_min - z), so z = q_min - r_min / s. Rounding z to an integer means r_min is now represented only approximately, but 0.0 is represented exactly by q = z. That matters because zero is special in neural networks: zero padding at image borders, ReLU outputs, and sparse activations must all be exactly zero, or a constant bias error appears in every layer." },
        { t: "p", text: "Symmetric quantisation (z = 0, s = max|r| / 127) wastes part of the range when the data is lopsided: for activations from -2 to 6 it would use s = 6/127 ≈ 0.0472, a step 50% coarser than the asymmetric 0.0314, and never use the integers from -128 to -43. For weights, which are roughly symmetric around zero, the loss is small and z = 0 removes a correction term from every multiply-accumulate, which is why TFLite chooses symmetric weights and asymmetric activations." },
        { t: "snippet", lang: "python", code: String.raw`def qparams(rmin, rmax, qmin=-128, qmax=127):
    rmin, rmax = min(rmin, 0.0), max(rmax, 0.0)    # 0.0 must be in range
    s = (rmax - rmin) / (qmax - qmin)
    z = round(qmin - rmin / s)
    return s, z

def quant(r, s, z):
    return max(-128, min(127, round(r / s) + z))

def dequant(q, s, z):
    return s * (q - z)

s, z = qparams(-2.0, 6.0)
print(round(s, 6), z)                          # 0.031373 -64
for r in (-2.0, 0.0, 1.0, 6.0):
    q = quant(r, s, z)
    print(r, q, round(dequant(q, s, z), 4))
assert (quant(-2.0, s, z), quant(0.0, s, z), quant(1.0, s, z), quant(6.0, s, z)) == (-128, -64, -32, 127)
assert dequant(quant(0.0, s, z), s, z) == 0.0`, caption: "Pure Python, runs as is. Python's round() rounds halves to even; TFLite rounds halves away from zero, which only matters exactly on a half step." },
      ] },
      { t: "deep", title: "Why quantised accuracy sometimes collapses, and how to debug it", blocks: [
        { t: "p", text: "If int8 accuracy is far below float, the usual causes are: a representative dataset that does not cover the real input range (values clip at 127); inputs fed to the device in different units or scaling than in training (a model trained on g fed with m/s² sees everything 9.81 times larger); an input tensor filled with float values instead of quantised int8 using that tensor's own scale and zero point; and a layer whose weights have extreme outliers, making one per-tensor scale too coarse for the rest." },
        { t: "p", text: "Debug in order: run the int8 `.tflite` file on the PC with the TFLite interpreter on validation data (isolates conversion from deployment); then feed the device the same recorded windows over serial and compare its outputs with the PC interpreter's, bit for bit if possible (isolates feature and input mismatches); only then look at the model. Most \"the model does not work on the board\" problems turn out to be in feature extraction, not in the model." },
      ] },
    ],
    mistakes: [
      "**A representative dataset that misses extreme inputs.** Activations clip and the rare events you care about are the ones mangled.",
      "**Feeding float or wrongly scaled data into an int8 input tensor.** Quantise using that tensor's own `scale` and `zero_point`.",
      "**Different feature code on the PC and the device.** Verify device features against Python on the same recorded data.",
      "**Timing only `Invoke()`.** Feature extraction, sampling and the radio often cost more time and energy than the model.",
      "**Measuring current on USB 5 V.** The regulator and USB bridge chip dominate; measure on the 3.3 V rail.",
      "**Arena sized by guesswork.** Start large, read `arena_used_bytes()`, then set it with a small margin.",
    ],
    practice: {
      kind: "bench",
      task: "Deploy your chosen model to an ESP32 and produce the exit project measurements.",
      steps: [
        "Convert your model to full-integer int8 with a representative dataset of at least 300 examples covering all classes. Compare float and int8 accuracy on the validation folds with the TFLite interpreter.",
        "Create an ESP-IDF project, add `espressif/esp-tflite-micro`, embed the model with `xxd -i`, and port your feature extraction to C. Feed 20 recorded windows over serial and confirm features and outputs match the PC within rounding.",
        "Run live: sample the sensor into a ring buffer, compute features every hop, classify, and print the class and confidence. Log median and worst-case latency over 500 inferences.",
        "Record `arena_used_bytes()`, the binary size from `idf.py size`, and current on the 3.3 V rail during inference. Compute energy per inference.",
        "Evaluate on the held-out test people once, and record one hour of normal activity to estimate false alarms per hour. Write the report described in the lesson.",
      ],
    },
    quiz: [
      {
        q: "Activations range from 0.0 to 5.1. What are the int8 scale and zero point?",
        options: ["s = 0.02, z = -128", "s = 0.04, z = 0", "s = 0.02, z = 0", "s = 0.0201, z = 127"],
        answer: 0,
        why: "s = (5.1 - 0) / 255 = 0.02. z = round(-128 - 0 / 0.02) = -128, so real 0.0 maps to -128 and 5.1 maps to 127.",
      },
      {
        q: "With s = 0.05 and z = 10, what real value does q = 30 represent?",
        options: ["1.5", "2.0", "1.0", "0.5"],
        answer: 2,
        why: "r = s × (q - z) = 0.05 × (30 - 10) = 1.0.",
      },
      {
        q: "Why does int8 quantisation need a representative dataset?",
        options: ["To retrain the model", "To compress the weights", "To test the model's accuracy", "To measure the range of each activation so its scale and zero point can be chosen"],
        answer: 3,
        why: "Weights are known, but activation ranges depend on inputs. Running real examples records them; a narrow set causes clipping.",
      },
      {
        q: "An inference takes 15 ms and draws 80 mA extra at 3.3 V. What is the energy per inference?",
        options: ["1.2 mJ", "3.96 mJ", "39.6 mJ", "0.4 mJ"],
        answer: 1,
        why: "E = V × I × t = 3.3 × 0.080 × 0.015 = 0.00396 J = 3.96 mJ.",
      },
      {
        q: "A model reaches 94% on the PC with the int8 .tflite file, but 40% on the ESP32. What should you check first?",
        options: ["Whether the device computes features and fills the input tensor exactly as the PC does, using the input tensor's scale and zero point", "Retrain with more epochs", "Switch to a bigger model", "Increase the CPU clock"],
        answer: 0,
        why: "The same model file works on the PC, so the model and conversion are fine. The difference is in what the device feeds it: features, units or quantisation of the input.",
      },
    ],
  },
};

export default lessons;
