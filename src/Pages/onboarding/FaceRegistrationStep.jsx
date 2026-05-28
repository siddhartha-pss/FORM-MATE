import { useEffect, useRef, useState } from "react";

const REQUIRED_CAPTURES = 5;

/**
 * Props:
 * - userId: MongoDB _id of the saved user
 * - userName: for display
 * - onComplete(): called after successful registration
 */
export default function FaceRegistrationStep({ userId, userName, onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    stopCamera();
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
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
    canvas.getContext("2d").drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setCaptures((prev) => [...prev, base64]);
  }

  async function handleRegister() {
    setLoading(true);
    setError("");
    stopCamera();
    try {
      const res = await fetch("/api/face/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, images: captures }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Face registration failed");
      onComplete();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const remaining = REQUIRED_CAPTURES - captures.length;
  const ready_to_register = captures.length >= REQUIRED_CAPTURES;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Face Registration</h2>
      <p style={styles.subtitle}>
        Hi <strong>{userName}</strong>! We need {REQUIRED_CAPTURES} face photos.
        Look directly at the camera.
      </p>

      {!ready_to_register ? (
        <>
          <video ref={videoRef} style={styles.video} muted playsInline />
          <p style={styles.counter}>
            {captures.length} / {REQUIRED_CAPTURES} captured
            {remaining > 0 && ` — ${remaining} more needed`}
          </p>
          <button onClick={captureFrame} disabled={!ready} style={styles.captureBtn}>
            {ready ? "📸 Capture" : "Starting camera..."}
          </button>

          {captures.length > 0 && (
            <div style={styles.thumbnailRow}>
              {captures.map((img, i) => (
                <img key={i} src={img} alt={`Face ${i + 1}`} style={styles.thumb} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p style={styles.doneText}>✅ {REQUIRED_CAPTURES} photos captured!</p>
          <div style={styles.thumbnailRow}>
            {captures.map((img, i) => (
              <img key={i} src={img} alt={`Face ${i + 1}`} style={styles.thumb} />
            ))}
          </div>
          {!loading && (
            <button onClick={handleRegister} style={styles.registerBtn}>
              Register Face →
            </button>
          )}
          {loading && <p style={styles.loading}>⏳ Registering your face...</p>}
        </>
      )}

      {error && <p style={styles.error}>⚠️ {error}</p>}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

const styles = {
  container: { maxWidth: 520, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" },
  title:     { margin: 0 },
  subtitle:  { textAlign: "center", color: "#6b7280", margin: 0 },
  video:     { width: "100%", maxWidth: 440, borderRadius: 8, border: "2px solid #ccc" },
  counter:   { margin: 0, fontWeight: 600 },
  captureBtn: { padding: "10px 28px", fontSize: 15, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  registerBtn: { padding: "12px 36px", fontSize: 15, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  thumbnailRow: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  thumb:  { width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "2px solid #22c55e" },
  doneText: { color: "#16a34a", fontWeight: 700, fontSize: 16, margin: 0 },
  loading: { color: "#2563eb" },
  error:   { color: "red" },
};