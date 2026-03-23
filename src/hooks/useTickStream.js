/**
 * useTickStream.js — Einmaliger Tick-Collect → Simulate Hook
 *
 * Flow:
 *   startStream() → WS /markov/tick-stream akkumuliert Events
 *               → nach tick_stream_done: POST /markov/simulate/tick
 *               → simulationResult verfügbar
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const WS_BASE  = () => (process.env.REACT_APP_API_URL || '').replace('http', 'ws');
const HTTP_BASE = () => (process.env.REACT_APP_API_URL || '') + '/api/v1/orderbook-heatmap';

export function useTickStream({
  token,
  network,
  durationSeconds = 10,
  nPaths = 300,
  nSteps = 50,
  limit = 50,
}) {
  const [status, setStatus] = useState({ phase: 'idle', message: '', n_events: 0 });
  const [simulationResult, setSimulationResult] = useState(null);

  const wsRef       = useRef(null);
  const allEvents   = useRef([]);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const buildWsUrl = useCallback(() => {
    const params = new URLSearchParams({
      token,
      network,
      duration_seconds: durationSeconds,
      limit,
    });
    return `${WS_BASE()}/api/v1/orderbook-heatmap/markov/tick-stream?${params}`;
  }, [token, network, durationSeconds, limit]);

  const runSimulation = useCallback(async (events) => {
    if (!mountedRef.current) return;

    if (events.length < 50) {
      setStatus({
        phase: 'error',
        message: `Zu wenig Events: ${events.length} (min. 50 erforderlich)`,
        n_events: events.length,
      });
      return;
    }

    setStatus({ phase: 'simulating', message: `${events.length} Events werden simuliert...`, n_events: events.length });

    try {
      const url = `${HTTP_BASE()}/markov/simulate/tick?token=${encodeURIComponent(token)}&network=${encodeURIComponent(network)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tick_events: events, n_paths: nPaths, n_steps: nSteps }),
      });

      if (!mountedRef.current) return;

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        setStatus({
          phase: 'error',
          message: err.detail || `HTTP ${resp.status}`,
          n_events: events.length,
        });
        return;
      }

      const data = await resp.json();
      if (!mountedRef.current) return;

      setSimulationResult(data);
      setStatus({
        phase: 'done',
        message: `Simulation abgeschlossen · ${events.length} Events`,
        n_events: events.length,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus({
        phase: 'error',
        message: err.message || 'Simulation fehlgeschlagen',
        n_events: events.length,
      });
    }
  }, [token, network, nPaths, nSteps]);

  const startStream = useCallback(() => {
    // Vorherige Verbindung schließen
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    allEvents.current = [];
    setSimulationResult(null);
    setStatus({ phase: 'connecting', message: 'Verbinde mit Bitget...', n_events: 0 });

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'tick_stream_start':
            setStatus({ phase: 'collecting', message: msg.message || 'Events werden gesammelt...', n_events: 0 });
            break;

          case 'tick_batch':
            allEvents.current.push(...(msg.events || []));
            setStatus((prev) => ({ ...prev, phase: 'collecting', n_events: msg.n_total || allEvents.current.length }));
            break;

          case 'tick_stream_done':
            ws.onclose = null;
            ws.close();
            wsRef.current = null;
            runSimulation(allEvents.current);
            break;

          case 'error':
            setStatus({ phase: 'error', message: msg.message || 'Stream-Fehler', n_events: allEvents.current.length });
            break;

          case 'warning':
            console.warn('Tick WS warning:', msg.message);
            break;

          default:
            break;
        }
      } catch (e) {
        console.warn('useTickStream: JSON parse error', e);
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus({ phase: 'error', message: 'WebSocket Verbindungsfehler', n_events: allEvents.current.length });
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      // Unerwartetes Schließen (nicht durch uns initiiert)
      setStatus((prev) => {
        if (prev.phase === 'done' || prev.phase === 'idle' || prev.phase === 'simulating') return prev;
        return { ...prev, phase: 'error', message: 'Verbindung unerwartet getrennt' };
      });
    };
  }, [buildWsUrl, runSimulation]);

  const cancelStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    allEvents.current = [];
    setStatus({ phase: 'idle', message: '', n_events: 0 });
    setSimulationResult(null);
  }, []);

  return { status, simulationResult, startStream, cancelStream };
}
