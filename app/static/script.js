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
            <p><strong>Analyse für Suchbegriff:</strong> ${data.query}</p>
            <p><strong>Sentiment-Wert:</strong> ${data.sentiment_score.toFixed(2)}</p>
            <p>
                Dieser Wert basiert auf einer On-Chain-Analyse von Social-Media-Daten 
                auf der Plattform X (früher Twitter). Die Analyse berücksichtigt öffentlich 
                verfügbare Tweets und wertet deren Stimmung in Echtzeit aus.
            </p>
        `;
    } catch (error) {
        console.error("Fehler bei der API-Anfrage:", error);
        document.getElementById("result").innerHTML = `
            <p>Fehler bei der Analyse. Bitte versuchen Sie es erneut.</p>
        `;
    }
});
