async function checkSchema() {
    const API_BASE = "http://localhost:8080";
    try {
        const response = await fetch(`${API_BASE}/outer-players`);
        const data = await response.json();
        console.log("Current Outer Players Data:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error fetching data:", err.message);
    }
}

checkSchema();
