import { useEffect, useRef, useState } from "react";

/**
 * Props:
 * - onCapture(base64string): called when user clicks capture
 * - onRetake(): optional, called when user retakes
 * - label: string shown above camera
 */
export default function WebcamCapture({ onCapture, label }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    stopCamera(); // always stop old stream first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
        };
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setReady(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(base64);
    stopCamera();
    onCapture(base64);
  }

  function retake() {
    setCaptured(null);
    setError("");
    startCamera();
  }

  return (
    <div style={styles.wrapper}>
      {label && <p style={styles.label}>{label}</p>}

      {error && <p style={styles.error}>{error}</p>}

      {!captured ? (
        <>
          <video ref={videoRef} style={styles.video} muted playsInline />
          <button
            onClick={captureFrame}
            disabled={!ready}
            style={styles.captureBtn}
          >
            {ready ? "📸 Capture" : "Starting camera..."}
          </button>
        </>
      ) : (
        <>
          <img src={captured} alt="Captured" style={styles.video} />
          <button onClick={retake} style={styles.retakeBtn}>
            🔄 Retake
          </button>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  label: { fontWeight: 600, fontSize: 16, margin: 0 },
  video: { width: "100%", maxWidth: 480, borderRadius: 8, border: "2px solid #ccc" },
  captureBtn: {
    padding: "10px 28px", fontSize: 15, background: "#2563eb",
    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
  },
  retakeBtn: {
    padding: "10px 28px", fontSize: 15, background: "#6b7280",
    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
  },
  error: { color: "red", fontSize: 14 },
};