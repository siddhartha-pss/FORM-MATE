import { useState } from "react";
import WebcamCapture from "../../components/WebcamCapture";
import { runOCR } from "../../utils/ocrApi";

const STEPS = [
  { key: "aadhaar-front", label: "📄 Place Aadhaar Front side facing the camera" },
  { key: "aadhaar-back",  label: "📄 Place Aadhaar Back side facing the camera" },
  { key: "pan",           label: "💳 Place PAN Card facing the camera" },
];

/**
 * Props:
 * - onComplete(mergedData): called with parsed OCR data from all 3 docs
 */
export default function DocumentCaptureStep({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collectedData, setCollectedData] = useState({});
  const [capturedImage, setCapturedImage] = useState(null);

  const currentStep = STEPS[stepIndex];

  function handleCapture(base64) {
    setCapturedImage(base64);
    setError("");
  }

  async function handleConfirm() {
    if (!capturedImage) return;

    setLoading(true);
    setError("");
    try {
      const { parsed } = await runOCR(currentStep.key, capturedImage);
      const updated = { ...collectedData, ...parsed };
      setCollectedData(updated);

      if (stepIndex < STEPS.length - 1) {
        setStepIndex(stepIndex + 1);
        setCapturedImage(null);
      } else {
        onComplete(updated);
      }
    } catch (err) {
      setError(err.message || "OCR failed. Please retake the image.");
      setCapturedImage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      {/* Progress indicator */}
      <div style={styles.progress}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              ...styles.dot,
              background: i < stepIndex ? "#22c55e" : i === stepIndex ? "#2563eb" : "#d1d5db",
            }}
          />
        ))}
      </div>

      <h2 style={styles.title}>
        Step {stepIndex + 1} of {STEPS.length}
      </h2>

      <WebcamCapture
        key={stepIndex} // remount camera for each step
        label={currentStep.label}
        onCapture={handleCapture}
      />

      {error && <p style={styles.error}>⚠️ {error}</p>}

      {capturedImage && !loading && (
        <button onClick={handleConfirm} style={styles.confirmBtn}>
          {stepIndex < STEPS.length - 1 ? "✅ Confirm & Next" : "✅ Confirm & Finish"}
        </button>
      )}

      {loading && <p style={styles.loading}>🔍 Reading document...</p>}
    </div>
  );
}

const styles = {
  container: { maxWidth: 520, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 },
  title: { textAlign: "center", margin: 0 },
  progress: { display: "flex", justifyContent: "center", gap: 10 },
  dot: { width: 14, height: 14, borderRadius: "50%" },
  error: { color: "red", textAlign: "center", margin: 0 },
  loading: { textAlign: "center", color: "#2563eb" },
  confirmBtn: {
    padding: "12px 32px", fontSize: 15, background: "#16a34a",
    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", alignSelf: "center",
  },
};