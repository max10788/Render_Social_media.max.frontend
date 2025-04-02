document.getElementById("sentimentForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = document.getElementById("query").value;

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        const data = await response.json();
        document.getElementById("result").innerHTML = `
            <p>Suchbegriff: ${data.query}</p>
            <p>Sentiment-Wert: ${data.sentiment_score}</p>
        `;
    } catch (error) {
        console.error("Fehler bei der API-Anfrage:", error);
        document.getElementById("result").innerHTML = "<p>Fehler bei der Analyse.</p>";
    }
});
