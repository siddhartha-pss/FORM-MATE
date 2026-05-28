const ACCOUNT_TYPES = [
  { value: "Savings Account",  icon: "🏦" },
  { value: "Current Account",  icon: "💼" },
  { value: "Salary Account",   icon: "💰" },
  { value: "Joint Account",    icon: "👥" },
  { value: "Fixed Deposit",    icon: "📈" },
];

export default function AccountSelectionStep({ onSelect }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>What type of account would you like to open?</h2>
      <div style={styles.grid}>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            style={styles.card}
          >
            <span style={styles.icon}>{type.icon}</span>
            <span style={styles.label}>{type.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 560, margin: "40px auto", padding: 24 },
  title:     { textAlign: "center", marginBottom: 28 },
  grid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  card: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 10, padding: "24px 16px", background: "#fff",
    border: "2px solid #e5e7eb", borderRadius: 10, cursor: "pointer",
    fontSize: 14, fontWeight: 600, transition: "border-color 0.2s",
  },
  icon:  { fontSize: 36 },
  label: { color: "#1f2937" },
};