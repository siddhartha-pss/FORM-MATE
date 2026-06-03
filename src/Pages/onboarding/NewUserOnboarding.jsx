import { useState } from "react";
import AccountSelectionStep from "./AccountSelectionStep";
import DocumentCaptureStep from "./DocumentCaptureStep";
import OCRConfirmationStep from "./OCRConfirmationStep";
import FaceRegistrationStep from "./FaceRegistrationStep";

const STEPS = {
  ACCOUNT_SELECT: "ACCOUNT_SELECT",
  DOCUMENT_CAPTURE: "DOCUMENT_CAPTURE",
  OCR_CONFIRM: "OCR_CONFIRM",
  FACE_REGISTER: "FACE_REGISTER",
  SUCCESS: "SUCCESS",
};

export default function NewUserOnboarding({ onExit }) {
  const [step, setStep] = useState(STEPS.ACCOUNT_SELECT);
  const [accountType, setAccountType] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [savedUser, setSavedUser] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleAccountSelected(type) {
    setAccountType(type);
    setStep(STEPS.DOCUMENT_CAPTURE);
  }

  function handleDocumentsComplete(mergedData) {
    setOcrData(mergedData);
    setStep(STEPS.OCR_CONFIRM);
  }

  async function handleOCRConfirmed(confirmedData) {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...confirmedData, accountType }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save user");
      setSavedUser(data.user);
      setStep(STEPS.FACE_REGISTER);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleFaceRegistered() {
    setStep(STEPS.SUCCESS);
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.brand}>🏦 New Customer Registration</h1>
        <button onClick={onExit} style={styles.exitBtn}>✕ Exit</button>
      </div>

      {/* Steps */}
      {step === STEPS.ACCOUNT_SELECT && (
        <AccountSelectionStep onSelect={handleAccountSelected} />
      )}

      {step === STEPS.DOCUMENT_CAPTURE && (
        <DocumentCaptureStep onComplete={handleDocumentsComplete} />
      )}

      {step === STEPS.OCR_CONFIRM && ocrData && (
        <>
          {saveError && <p style={styles.error}>⚠️ {saveError}</p>}
          {saving
            ? <p style={styles.loading}>💾 Saving your details...</p>
            : <OCRConfirmationStep data={ocrData} onConfirm={handleOCRConfirmed} />
          }
        </>
      )}

      {step === STEPS.FACE_REGISTER && savedUser && (
        <FaceRegistrationStep
          userId={savedUser._id}
          userName={savedUser.fullName}
          onComplete={handleFaceRegistered}
        />
      )}

      {step === STEPS.SUCCESS && (
        <div style={styles.success}>
          <div style={styles.successIcon}>🎉</div>
          <h2>Registration Complete!</h2>
          <p>
            Welcome, <strong>{savedUser?.fullName}</strong>!<br />
            Your {accountType} has been created successfully.
          </p>
          <button onClick={onExit} style={styles.doneBtn}>
            Go to Login →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page:    { minHeight: "100vh", background: "#120f17", padding: "0 0 40px" },
  header:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#120f17", borderBottom: "1px solid #2a3347" },
  brand:   { margin: 0, fontSize: 18, color: "#f0efee" },
  exitBtn: { padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  error:   { color: "#ef4444", textAlign: "center" },
  loading: { textAlign: "center", color: "#3b82f6", fontSize: 16, marginTop: 40, color: "#f0efee" },
  success: { maxWidth: 440, margin: "60px auto", textAlign: "center", background: "#120f17", borderRadius: 12, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", border: "1px solid #2a3347", color: "#f0efee" },
  successIcon: { fontSize: 64, marginBottom: 16 },
  doneBtn: { marginTop: 20, padding: "12px 32px", fontSize: 15, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
};