class TransactionGraph {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = d3.select(containerId);
        this.options = {
            width: options.width || 960,
            height: options.height || 600,
            margin: options.margin || { top: 20, right: 20, bottom: 30, left: 40 },
            nodeRadius: options.nodeRadius || 6,
            linkDistance: options.linkDistance || 100,
            colors: options.colors || {
                node: {
                    default: "#1f77b4",
                    source: "#2ca02c",
                    target: "#ff7f0e",
                    exchange: "#9467bd",
                    bridge: "#e377c2"
                },
                link: {
                    default: "#999",
                    highlighted: "#ff7f0e"
                }
            }
        };

        this.initializeSvg();
        this.initializeForces();
        this.initializeTooltip();
        this.initializeLegend();
    }

    initializeSvg() {
        this.svg = this.container
            .append("svg")
            .attr("viewBox", [0, 0, this.options.width, this.options.height])
            .attr("preserveAspectRatio", "xMidYMid meet")
            .classed("transaction-graph", true);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.options.margin.left},${this.options.margin.top})`);

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                this.g.attr("transform", event.transform);
            });

        this.svg.call(this.zoom);
    }

    initializeForces() {
        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(this.options.linkDistance))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(
                (this.options.width - this.options.margin.left - this.options.margin.right) / 2,
                (this.options.height - this.options.margin.top - this.options.margin.bottom) / 2
            ))
            .force("collision", d3.forceCollide(this.options.nodeRadius * 1.5));
    }

    initializeTooltip() {
        this.tooltip = this.container
            .append("div")
            .attr("class", "transaction-tooltip")
            .style("opacity", 0);
    }

    initializeLegend() {
        const legend = this.svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.options.width - 120}, 20)`);

        const legendData = [
            { color: this.options.colors.node.source, label: "Source" },
            { color: this.options.colors.node.target, label: "Target" },
            { color: this.options.colors.node.exchange, label: "Exchange" },
            { color: this.options.colors.node.bridge, label: "Bridge" }
        ];

        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("circle")
            .attr("r", 6)
            .style("fill", d => d.color);

        legendItems.append("text")
            .attr("x", 12)
            .attr("y", 4)
            .text(d => d.label);
    }

    async visualizeTransactions(txHash, options = {}) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/v1/track-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start_tx_hash: txHash,
                    target_currency: options.targetCurrency || "USD",
                    amount: options.amount || 1.0,
                    num_transactions: options.numTransactions || 10
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch transaction data');
            }

            const data = await response.json();
            this.renderGraph(this.transformData(data));
            this.updateScenarioList(data.detected_scenarios, data.scenario_details);

        } catch (error) {
            console.error('Visualization error:', error);
            this.showError(error.message);
        }
    }

    transformData(apiResponse) {
        const nodes = [];
        const links = [];
        const seenNodes = new Set();

        apiResponse.tracked_transactions.forEach((tx, index) => {
            if (!seenNodes.has(tx.from_wallet)) {
                nodes.push({
                    id: tx.from_wallet,
                    type: index === 0 ? 'source' : this.getNodeType(tx.from_wallet),
                    value: tx.amount
                });
                seenNodes.add(tx.from_wallet);
            }

            if (!seenNodes.has(tx.to_wallet)) {
                nodes.push({
                    id: tx.to_wallet,
                    type: this.getNodeType(tx.to_wallet),
                    value: tx.amount
                });
                seenNodes.add(tx.to_wallet);
            }

            links.push({
                source: tx.from_wallet,
                target: tx.to_wallet,
                value: tx.amount,
                timestamp: tx.timestamp,
                hash: tx.tx_hash
            });
        });

        return { nodes, links };
    }

    getNodeType(address) {
        // You can expand this based on your needs
        if (address.includes('exchange')) return 'exchange';
        if (address.includes('bridge')) return 'bridge';
        return 'default';
    }

    renderGraph(data) {
        this.g.selectAll("*").remove();

        const link = this.g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .attr("stroke-width", d => Math.sqrt(d.value))
            .attr("stroke", this.options.colors.link.default);

        const node = this.g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", this.options.nodeRadius)
            .attr("fill", d => this.getNodeColor(d.type))
            .call(this.drag(this.simulation));

        node.on("mouseover", (event, d) => {
            this.tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            this.tooltip.html(this.getTooltipContent(d))
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            this.tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        this.simulation
            .nodes(data.nodes)
            .on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });

        this.simulation.force("link")
            .links(data.links);

        this.simulation.alpha(1).restart();
    }

    getNodeColor(type) {
        return this.options.colors.node[type] || this.options.colors.node.default;
    }

    getTooltipContent(d) {
        return `
            <div class="tooltip-content">
                <div class="tooltip-header">${d.type.toUpperCase()}</div>
                <div class="tooltip-body">
                    <div>Address: ${d.id.substring(0, 8)}...${d.id.substring(d.id.length - 8)}</div>
                    <div>Value: ${d.value.toFixed(4)} SOL</div>
                </div>
            </div>
        `;
    }

    updateScenarioList(scenarios, details) {
        const scenarioList = d3.select(this.containerId)
            .selectAll(".scenario-list")
            .data([null])
            .join("div")
            .attr("class", "scenario-list");

        const items = scenarioList
            .selectAll(".scenario-item")
            .data(scenarios)
            .join("div")
            .attr("class", "scenario-item");

        items.html(scenario => `
            <h4>${this.formatScenarioName(scenario)}</h4>
            <p>${this.formatScenarioDetails(scenario, details[scenario])}</p>
        `);
    }

    formatScenarioName(scenario) {
        return scenario.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatScenarioDetails(scenario, details) {
        if (!details) return '';
        return Object.entries(details)
            .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
            .join('<br>');
    }

    drag(simulation) {
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

    showError(message) {
        const errorDiv = this.container
            .selectAll(".error-message")
            .data([null])
            .join("div")
            .attr("class", "error-message");

        errorDiv
            .html(`<strong>Error:</strong> ${message}`)
            .style("opacity", 1)
            .transition()
            .duration(5000)
            .style("opacity", 0)
            .remove();
    }
}
