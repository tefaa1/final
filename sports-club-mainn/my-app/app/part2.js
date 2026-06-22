// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
    users: [
        { id: 1, keycloakId: "uid-001", firstName: "Ahmed", lastName: "Benali", email: "ahmed@club.dz", role: "ADMIN", gender: "MALE", phoneNumber: "+213555001" },
        { id: 2, keycloakId: "uid-002", firstName: "Karim", lastName: "Mansouri", email: "karim@club.dz", role: "HEAD_COACH", gender: "MALE", phoneNumber: "+213555002" },
        { id: 3, keycloakId: "uid-003", firstName: "Sara", lastName: "Ouali", email: "sara@club.dz", role: "DOCTOR", gender: "FEMALE", phoneNumber: "+213555003" },
        { id: 4, keycloakId: "uid-004", firstName: "Youcef", lastName: "Zidane", email: "youcef@club.dz", role: "PLAYER", gender: "MALE", phoneNumber: "+213555004" },
        { id: 5, keycloakId: "uid-005", firstName: "Amina", lastName: "Kerouani", email: "amina@club.dz", role: "SCOUT", gender: "FEMALE", phoneNumber: "+213555005" },
    ],
    teams: [
        { id: 1, name: "Blue Stars FC", country: "Algeria", sportId: 1 },
        { id: 2, name: "Blue Stars BB", country: "Algeria", sportId: 2 },
        { id: 3, name: "Blue Stars HB", country: "Algeria", sportId: 3 },
    ],
    sports: [
        { id: 1, name: "Football Division 1", sportType: "FOOTBALL" },
        { id: 2, name: "Basketball League", sportType: "BASKETBALL" },
        { id: 3, name: "Handball Premier", sportType: "HANDBALL" },
    ],
    contracts: [
        { id: 1, playerKeycloakId: "uid-004", teamId: 1, startDate: "2024-07-01", endDate: "2026-06-30", salary: 50000, releaseClause: 2000000, contractStatus: "ACTIVE" },
    ],
    incomingTransfers: [
        { id: 1, playerKeycloakId: "uid-007", fromTeam: "FC Rival", transferFee: 3500000, transferDate: "2025-01-15", status: "COMPLETED", contractDetails: "3-year deal" },
    ],
    outgoingTransfers: [
        { id: 1, playerKeycloakId: "uid-008", toTeam: "FC Destination", transferFee: 5000000, transferDate: "2025-01-31", status: "PENDING", contractDetails: "Sold permanently" },
    ],
    matches: [
        { id: 1, homeTeamId: 1, outerTeamId: 5, matchType: "LEAGUE", status: "SCHEDULED", sportType: "FOOTBALL", venue: "Stade 5 Juillet", competition: "Division 1", season: "2025/2026", homeTeamScore: 0, awayTeamScore: 0, kickoffTime: "2025-11-02T19:00:00" },
        { id: 2, homeTeamId: 2, outerTeamId: 6, matchType: "LEAGUE", status: "FINISHED", sportType: "BASKETBALL", venue: "Arena Complex", homeTeamScore: 78, awayTeamScore: 72, kickoffTime: "2025-10-31T20:30:00" },
    ],
    trainingSessions: [
        { id: 1, teamId: 1, headCoachKeycloakId: "uid-002", sessionType: "TACTICAL", status: "SCHEDULED", location: "Training Ground A", scheduledDate: "2025-11-03T09:00:00", durationMinutes: 120, objectives: "High press" },
        { id: 2, teamId: 2, headCoachKeycloakId: "uid-002", sessionType: "FITNESS", status: "COMPLETED", location: "Gym", scheduledDate: "2025-11-01T10:00:00", durationMinutes: 90, objectives: "Cardio conditioning" },
    ],
    injuries: [
        { id: 1, playerKeycloakId: "uid-006", teamId: 1, reportedByDoctorKeycloakId: "uid-003", injuryType: "MUSCLE_STRAIN", severity: "MODERATE", injuredBodyPart: "Left hamstring", injuryDate: "2025-03-15", expectedRecoveryDate: "2025-04-20", status: "TREATING", description: "Sprint injury" },
    ],
    fitnessTests: [
        { id: 1, playerKeycloakId: "uid-004", teamId: 1, testType: "VO2_MAX", sportType: "FOOTBALL", testDate: "2025-03-20", testName: "Aerobic Capacity", result: 58.5, unit: "ml/kg/min", resultCategory: "Excellent" },
    ],
    sponsorOffers: [
        { id: 1, sponsorKeycloakId: "uid-009", sponsorName: "SportsBrand Co.", offerTitle: "Kit Sponsorship 2025/2026", contractValue: 500000, startDate: "2025-07-01", endDate: "2026-06-30", sponsorshipType: "KIT", status: "PENDING", targetTeamId: 1 },
    ],
    callups: [
        { id: 1, playerKeycloakId: "uid-004", callUpDate: "2025-03-01", returnDate: "2025-03-15", status: "APPROVED" },
    ],
    alerts: [
        { id: 1, alertType: "INJURY_REPORTED", priority: "HIGH", title: "Critical Injury Alert", message: "Player Youcef reported with hamstring strain", targetRole: "DOCTOR", acknowledged: false, resolved: false },
        { id: 2, alertType: "CONTRACT_EXPIRING", priority: "MEDIUM", title: "Contract Expiring Soon", message: "Karim Mansouri contract expires in 30 days", targetRole: "TEAM_MANAGER", acknowledged: false, resolved: false },
    ],
    notifications: [
        { id: 1, title: "Match Scheduled", message: "Blue Stars FC vs Red Lions FC scheduled for Nov 2", category: "MATCH_REMINDER", status: "UNREAD" },
        { id: 2, title: "Injury Report", message: "Player #6 reported injury during training", category: "INJURY", status: "READ" },
    ],
    messages: [
        { id: 1, senderUserKeycloakId: "uid-002", recipientUserKeycloakId: "uid-003", subject: "Recovery Update", content: "Hi Doctor, update on Youcef recovery?", status: "SENT", createdAt: "2025-10-30" },
        { id: 2, senderUserKeycloakId: "uid-003", recipientUserKeycloakId: "uid-002", subject: "Re: Recovery Update", content: "He needs 2 more weeks rest.", status: "READ", createdAt: "2025-10-31", parentMessageId: 1 },
    ],
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
    const icons = {
        dashboard: "⊞", users: "👥", players: "⚽", training: "🏋️", matches: "🏆",
        medical: "🩺", scouting: "🔭", analytics: "📊", finance: "💰", media: "📣",
        messages: "✉️", reports: "📋", settings: "⚙️", staff: "👔", teams: "🏟️",
        sports: "🎯", contracts: "📝", transfers: "🔄", rosters: "📋", callups: "🌍",
        injuries: "🩹", fitness: "💪", alerts: "🔔", sponsor: "💼", chart: "📈",
        search: "🔍", plus: "+", edit: "✏️", trash: "🗑️",
    };
    return <span style={{ fontSize: size, lineHeight: 1 }}>{icons[name] || "•"}</span>;
};

// const Avatar = ({ name = "?", size = 36, color = "#10b981" }) => {
//     const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
//     return (
//         <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: color + "33", color, border: \`1px solid \${color}44\` }}>
//       {initials}
//     </div>
//   );
// };

// const SportBadge = ({ sport }) => (
//   <span className="badge" style={{ background:(SPORT_COLORS[sport]||"#10b981")+"22", color:SPORT_COLORS[sport]||"#10b981", border:\`1px solid \${(SPORT_COLORS[sport]||"#10b981")}44\`, fontSize:11 }}>
//     {SPORT_ICONS[sport]} {sport}
//   </span>
// );

// const StatusBadge = ({ status }) => {
//   const map = {
//     ACTIVE:"badge-green", AVAILABLE:"badge-green", APPROVED:"badge-green", COMPLETED:"badge-green", RECOVERED:"badge-green",
//     PENDING:"badge-yellow", SCHEDULED:"badge-blue", IN_PROGRESS:"badge-blue", TREATING:"badge-yellow", RECOVERING:"badge-yellow", NEGOTIATING:"badge-yellow",
//     INJURED:"badge-red", SUSPENDED:"badge-red", CRITICAL:"badge-red", REPORTED:"badge-red", TERMINATED:"badge-red", CANCELLED:"badge-red",
//     EXPIRED:"badge-gray", RETIRED:"badge-gray", ON_HOLD:"badge-gray", TRANSFERRED:"badge-purple", ON_LOAN:"badge-cyan",
//     LIVE:"badge-red", FINISHED:"badge-green", POSTPONED:"badge-yellow",
//     HIGH:"badge-red", MEDIUM:"badge-yellow", LOW:"badge-green",
//   };
//   return <span className={\`badge \${map[status]||"badge-gray"}\`}>{status}</span>;
// };

// const Toast = ({ msg, type="success", onClose }) => {
//   useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
//   const colors = { success:"#10b981", error:"#ef4444", info:"#38bdf8" };
//   return (
//     <div style={{ position:"fixed", bottom:24, right:24, background:"#1a3d2e", border:\`1px solid \${colors[type]}44\`, borderLeft:\`3px solid \${colors[type]}\`, padding:"12px 20px", borderRadius:10, boxShadow:"0 8px 30px rgba(0,0,0,0.4)", zIndex:9999, maxWidth:320, animation:"fadeIn 0.3s ease" }}>
//       <div style={{ fontWeight:600, color:colors[type], fontSize:13 }}>{type==="success"?"✓":type==="error"?"✕":"ℹ"} {msg}</div>
//     </div>
//   );
// };

// const FormModal = ({ title, fields, onSubmit, onClose, initialData={} }) => {
//   const [form, setForm] = useState(initialData);
//   const set = (k,v) => setForm(p=>({...p,[k]:v}));
//   return (
//     <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
//       <div className="modal fade-in">
//         <div className="modal-header">
//           <div className="modal-title">{title}</div>
//           <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
//         </div>
//         <div className="modal-body">
//           <div className="form-grid form-grid-2">
//             {fields.map(f=>(
//               <div key={f.key} className="form-group" style={f.full?{gridColumn:"1/-1"}:{}}>
//                 <label>{f.label}</label>
//                 {f.type==="select" ? (
//                   <select value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}>
//                     <option value="">Select {f.label}</option>
//                     {(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
//                   </select>
//                 ) : f.type==="textarea" ? (
//                   <textarea rows={3} value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}/>
//                 ) : (
//                   <input type={f.type||"text"} value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}/>
//                 )}
//               </div>
//             ))}
//           </div>
//           <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
//             <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
//             <button className="btn btn-primary" onClick={()=>onSubmit(form)}>Save</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
