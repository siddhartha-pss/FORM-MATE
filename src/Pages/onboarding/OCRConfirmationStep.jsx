import { useState } from "react";

/**
 * Props:
 * - data: object from mergedOCRData
 * - onConfirm(confirmedData): called when user submits
 */
export default function OCRConfirmationStep({ data, onConfirm }) {
  const [form, setForm] = useState({
    fullName:      data.fullName      || "",
    dob:           data.dob           || "",
    gender:        data.gender        || "",
    aadhaarNumber: data.aadhaarNumber || "",
    panNumber:     data.panNumber     || "",
    address:       data.address       || "",
    city:          data.city          || "",
    state:         data.state         || "",
    pincode:       data.pincode       || "",
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Name is required";
    if (!form.dob.trim()) errs.dob = "Date of birth is required";
    if (!/^\d{12}$/.test(form.aadhaarNumber))
      errs.aadhaarNumber = "Aadhaar must be 12 digits";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber))
      errs.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onConfirm(form);
  }

  const Field = ({ label, name, placeholder }) => (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder || ""}
        style={{
          ...styles.input,
          borderColor: errors[name] ? "red" : "#d1d5db",
        }}
      />
      {errors[name] && <span style={styles.fieldError}>{errors[name]}</span>}
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Review Your Details</h2>
      <p style={styles.subtitle}>Please review and correct any mistakes before proceeding.</p>

      <Field label="Full Name"      name="fullName"      placeholder="As on Aadhaar" />
      <Field label="Date of Birth"  name="dob"           placeholder="DD/MM/YYYY" />

      <div style={styles.field}>
        <label style={styles.fieldLabel}>Gender</label>
        <select name="gender" value={form.gender} onChange={handleChange} style={styles.input}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <Field label="Aadhaar Number" name="aadhaarNumber" placeholder="12-digit number" />
      <Field label="PAN Number"     name="panNumber"     placeholder="ABCDE1234F" />
      <Field label="Address"        name="address"       placeholder="As on Aadhaar back" />
      <Field label="City"           name="city"          placeholder="City" />
      <Field label="State"          name="state"         placeholder="State" />
      <Field label="Pincode"        name="pincode"       placeholder="6-digit pincode" />

      <button onClick={handleSubmit} style={styles.submitBtn}>
        Confirm & Proceed →
      </button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  title:    { margin: 0, textAlign: "center" },
  subtitle: { margin: 0, textAlign: "center", color: "#6b7280", fontSize: 14 },
  field:    { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "9px 12px", fontSize: 14, borderRadius: 6,
    border: "1px solid #d1d5db", outline: "none",
  },
  fieldError: { fontSize: 12, color: "red" },
  submitBtn: {
    marginTop: 8, padding: "12px", fontSize: 15, background: "#2563eb",
    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
  },
};