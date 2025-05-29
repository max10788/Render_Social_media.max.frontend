export class DashboardState {
    constructor() {
        this.subscribers = new Set();
        this.state = {
            currentTransaction: null,
            loading: false,
            error: null,
            metrics: {
                totalVolume: 0,
                averageAmount: 0,
                uniqueWallets: 0,
                transactionCount: 0
            },
            uiState: {
                activeTab: 'transaction-tracker',
                graphZoomLevel: 1,
                selectedTimeRange: '24h'
            }
        };
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        // Initial call with current state
        callback(this.state);
        return () => this.subscribers.delete(callback);
    }

    setState(newState) {
        this.state = {
            ...this.state,
            ...newState
        };
        this.notify();
    }

    setMetrics(metrics) {
        this.setState({
            metrics: {
                ...this.state.metrics,
                ...metrics
            }
        });
    }

    setError(error) {
        this.setState({
            error,
            loading: false
        });
    }

    setLoading(loading) {
        this.setState({ loading });
    }

    clearError() {
        this.setState({ error: null });
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.state));
    }
}
