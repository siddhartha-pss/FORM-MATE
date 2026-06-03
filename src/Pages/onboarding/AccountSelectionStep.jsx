import Dock from '../../components/Dock';

const ACCOUNT_TYPES = [
  { value: "Savings Account",  icon: "🏦" },
  { value: "Current Account",  icon: "💼" },
  { value: "Salary Account",   icon: "💰" },
  { value: "Joint Account",    icon: "👥" },
  { value: "Fixed Deposit",    icon: "📈" },
];

export default function AccountSelectionStep({ onSelect }) {
  const dockItems = ACCOUNT_TYPES.map((type) => ({
    icon: <span style={{ fontSize: 24 }}>{type.icon}</span>,
    label: type.value,
    onClick: () => onSelect(type.value),
  }));

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>What type of account would you like to open?</h2>
      
      <Dock
        items={dockItems}
        isVertical={true}
        panelHeight={60}
        baseItemSize={48}
        magnification={65}
        className="account-selection-dock"
      />

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
  container: { 
    maxWidth: 560, 
    margin: "40px auto", 
    padding: 24,
    background: "#120f17",
    minHeight: "100vh",
  },
  title: { 
    textAlign: "center", 
    marginBottom: 28,
    color: "#f0efee",
  },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: 16 
  },
  card: {
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
    gap: 10, 
    padding: "24px 16px", 
    background: "#120f17",
    border: "1px solid #2a3347", 
    borderRadius: 16, 
    cursor: "pointer",
    fontSize: 14, 
    fontWeight: 600, 
    transition: "all 0.2s",
    color: "#f0efee",
  },
  icon: { fontSize: 36 },
  label: { color: "#f0efee" },
};