// TransactionGraph.js
class TransactionGraph {
    constructor(containerId, options = {}) {
        this.container = document.querySelector(containerId);
        if (!this.container) {
            console.error('TransactionGraph: Container nicht gefunden', containerId);
            return;
        }
        
        // Standardoptionen
        this.options = {
            width: 800,
            height: 600,
            ...options
        };
        
        // Zustandsvariablen
        this.nodes = [];
        this.links = [];
        this.simulation = null;
        this.svg = null;
        this.node = null;
        this.link = null;
        this.label = null;
        this.tooltip = null;
        
        // Initialisiere die Visualisierung
        this.init();
    }
    
    init() {
        // Leere den Container
        this.container.innerHTML = '';
        
        // Erstelle SVG
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("width", this.options.width)
            .attr("height", this.options.height);
        
        // Erstelle Tooltip
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "transaction-tooltip")
            .style("opacity", 0);
        
        // Initialisiere Simulation (ohne Daten)
        this.initSimulation();
    }
    
    initSimulation() {
        // Erstelle leere Simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(this.options.width / 2, this.options.height / 2));
        
        // Setze Tick-Handler
        this.simulation.on("tick", () => {
            if (this.link) {
                this.link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
            }
            
            if (this.node) {
                this.node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            }
            
            if (this.label) {
                this.label
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            }
        });
    }
    
    update(transactions) {
        if (!transactions || transactions.length === 0) {
            console.warn('TransactionGraph: Keine Transaktionsdaten zum Aktualisieren');
            return;
        }
        
        // Verarbeite die Transaktionsdaten
        const { nodes, links } = this._processData(transactions);
        
        // Speichere die Daten
        this.nodes = nodes;
        this.links = links;
        
        // Aktualisiere die Simulation
        this.simulation.nodes(this.nodes);
        this.simulation.force("link").links(this.links);
        
        // Erstelle/aktualisiere die Verbindungen
        this.link = this.svg.select(".links")
            .selectAll("line")
            .data(this.links, d => `${d.source.id}-${d.target.id}`);
        
        this.link.exit().remove();
        
        this.link = this.link.enter()
            .append("line")
            .attr("stroke", "#95a5a6")
            .attr("stroke-width", d => Math.sqrt(d.value) * 0.1)
            .merge(this.link);
        
        // Erstelle/aktualisiere die Knoten
        this.node = this.svg.select(".nodes")
            .selectAll("circle")
            .data(this.nodes, d => d.id);
        
        this.node.exit().remove();
        
        this.node = this.node.enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", "#3498db")
            .call(this._drag(this.simulation))
            .merge(this.node);
        
        // Erstelle/aktualisiere die Labels
        this.label = this.svg.select(".labels")
            .selectAll("text")
            .data(this.nodes, d => d.id);
        
        this.label.exit().remove();
        
        this.label = this.label.enter()
            .append("text")
            .text(d => d.label)
            .attr("dx", 15)
            .attr("dy", 4)
            .attr("fill", "#2c3e50")
            .merge(this.label);
        
        // Setze Mouseover-Ereignisse
        this.node.on("mouseover", (event, d) => this._showTooltip(event, d))
            .on("mouseout", () => this._hideTooltip());
        
        // Starte die Simulation
        this.simulation.alpha(1).restart();
    }
    
    _processData(transactions) {
        const nodesMap = new Map();
        const links = [];
        
        transactions.forEach(tx => {
            const fromWallet = tx.from_wallet;
            const changes = tx.balance_changes || [];
            
            if (!nodesMap.has(fromWallet)) {
                nodesMap.set(fromWallet, {
                    id: fromWallet,
                    type: "wallet",
                    start: true,
                    label: "Quelle",
                    transaction: tx,
                    balance_changes: changes
                });
            }
            
            changes.forEach(change => {
                const account = change.account;
                const amount = Math.abs(change.change / 1e9);
                
                if (!nodesMap.has(account)) {
                    nodesMap.set(account, {
                        id: account,
                        type: "wallet",
                        label: `±${amount.toFixed(4)} SOL`,
                        transaction: tx,
                        balance_changes: changes
                    });
                }
                
                links.push({
                    source: fromWallet,
                    target: account,
                    value: amount,
                    highlighted: change.change < 0
                });
            });
        });
        
        return {
            nodes: Array.from(nodesMap.values()),
            links
        };
    }
    
    _drag(simulation) {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
    
    _showTooltip(event, d) {
        const tx = d.transaction || {};
        const meta = tx.meta || {};
        const account_keys = tx.transaction?.message?.accountKeys || [];
        const balance_changes = d.balance_changes || [];
        const fee = meta.fee ? (meta.fee / 1e9).toFixed(6) + " SOL" : "N/A";
        const block_time = tx.block_time ? new Date(tx.block_time * 1000).toLocaleString() : "N/A";
        
        let content = `
            <div class="tooltip-header">Konto: ${this._shortenAddress(d.id)}</div>
            <div class="tooltip-body">
                <div class="timestamp-label">Transaktions-Hash: ${tx.signature || "N/A"}</div>
                <div class="timestamp-label">Datum: ${block_time}</div>
                <div class="amount-label">Gebühr: ${fee}</div>
        `;
        
        if (balance_changes.length > 0) {
            content += '<div class="balance-changes"><strong>Bilanzänderungen:</strong><ul>';
            balance_changes.forEach(change => {
                const sign = change.change >= 0 ? "+" : "";
                content += `<li>${change.account.substring(0, 10)}...: <span class="${sign.startsWith('+') ? 'amount-label' : 'error'}">${sign}${change.change.toFixed(4)} SOL</span></li>`;
            });
            content += '</ul></div>';
        }
        
        content += '</div>';
        
        this.tooltip.html(content)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`)
            .style("opacity", 0.9);
    }
    
    _hideTooltip() {
        this.tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }
    
    _shortenAddress(address) {
        return address.length > 10 ? `${address.substring(0, 6)}...${address.substring(-4)}` : address;
    }
}

// Stelle sicher, dass die Klasse verfügbar ist
if (typeof window !== 'undefined') {
    window.TransactionGraph = TransactionGraph;
}

export default TransactionGraph;
