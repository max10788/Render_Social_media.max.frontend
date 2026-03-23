/**
 * useTickStreamLive.js — Kontinuierliches Live-Overlay via Tick-Stream
 *
 * Wenn enabled=true, läuft ein Loop:
 *   1. WS /markov/tick-stream für durationSeconds sammeln
 *   2. POST /markov/simulate/tick
 *   3. markovData aktualisieren (kompatibel mit useMarkovStream)
 *   4. (retrainEvery - durationSeconds) Sekunden warten
 *   5. Wiederholen
 *
 * Das zurückgegebene markovData ist direkt kompatibel mit useMarkovStream:
 *   { price_fan, active_walls, initial_price, tick_data, buffer_size }
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const WS_BASE   = () => (process.env.REACT_APP_API_URL || '').replace('http', 'ws');
const HTTP_BASE = () => (process.env.REACT_APP_API_URL || '') + '/api/v1/orderbook-heatmap';

export function useTickStreamLive({
  token,
  network,
  enabled = false,
  durationSeconds = 10,
  retrainEvery = 40,
  nPaths = 200,
  nSteps = 50,
  limit = 50,
}) {
  const [markovData, setMarkovData] = useState(null);
  const [status, setStatus] = useState({ phase: 'idle', message: '', n_events: 0, cycle: 0 });

  const mountedRef  = useRef(true);
  const wsRef       = useRef(null);
  const cycleRef    = useRef({ running: false, cancelRequested: false, timer: null, cycle: 0 });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      _cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const _cancel = () => {
    cycleRef.current.cancelRequested = true;
    cycleRef.current.running = false;
    clearTimeout(cycleRef.current.timer);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const runCycle = useCallback(async () => {
    const ctrl = cycleRef.current;
    if (ctrl.cancelRequested || !mountedRef.current) return;

    ctrl.cycle += 1;
    const cycleNum = ctrl.cycle;

    // ── Phase 1: Collecting ──────────────────────────────────────────
    const params = new URLSearchParams({
      token, network, duration_seconds: durationSeconds, limit,
    });
    const wsUrl = `${WS_BASE()}/api/v1/orderbook-heatmap/markov/tick-stream?${params}`;

    if (mountedRef.current) {
      setStatus({ phase: 'connecting', message: 'Verbinde...', n_events: 0, cycle: cycleNum });
    }

    const allEvents = [];

    await new Promise((resolve) => {
      if (ctrl.cancelRequested) { resolve(); return; }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (ctrl.cancelRequested) { ws.close(); resolve(); return; }
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'tick_stream_start':
              if (mountedRef.current) {
                setStatus({ phase: 'collecting', message: msg.message || 'Sammle...', n_events: 0, cycle: cycleNum });
              }
              break;
            case 'tick_batch':
              allEvents.push(...(msg.events || []));
              if (mountedRef.current) {
                setStatus({ phase: 'collecting', message: 'Sammle...', n_events: msg.n_total || allEvents.length, cycle: cycleNum });
              }
              break;
            case 'tick_stream_done':
              ws.onclose = null;
              ws.close();
              wsRef.current = null;
              resolve();
              break;
            case 'error':
              ws.onclose = null;
              ws.close();
              wsRef.current = null;
              resolve();
              break;
            default:
              break;
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onerror = () => { resolve(); };
      ws.onclose = () => { resolve(); };
    });

    if (ctrl.cancelRequested || !mountedRef.current) return;

    // ── Phase 2: Simulate ────────────────────────────────────────────
    if (allEvents.length < 50) {
      if (mountedRef.current) {
        setStatus({
          phase: 'error',
          message: `Cycle ${cycleNum}: Nur ${allEvents.length} Events — min. 50 nötig`,
          n_events: allEvents.length,
          cycle: cycleNum,
        });
      }
      // Kurz warten und erneut versuchen
      await new Promise((resolve) => {
        ctrl.timer = setTimeout(resolve, 10000);
      });
      if (!ctrl.cancelRequested && mountedRef.current) runCycle();
      return;
    }

    if (mountedRef.current) {
      setStatus({ phase: 'simulating', message: `${allEvents.length} Events simulieren...`, n_events: allEvents.length, cycle: cycleNum });
    }

    try {
      const url = `${HTTP_BASE()}/markov/simulate/tick?token=${encodeURIComponent(token)}&network=${encodeURIComponent(network)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tick_events: allEvents, n_paths: nPaths, n_steps: nSteps }),
      });

      if (ctrl.cancelRequested || !mountedRef.current) return;

      if (resp.ok) {
        const data = await resp.json();
        if (!ctrl.cancelRequested && mountedRef.current) {
          setMarkovData({
            price_fan:     data.price_fan,
            active_walls:  data.active_walls || [],
            initial_price: data.initial_price,
            tick_data:     data.tick_data,
            buffer_size:   data.tick_data?.n_tick_events || allEvents.length,
          });
          setStatus({
            phase: 'streaming',
            message: `Live · cycle ${cycleNum}`,
            n_events: allEvents.length,
            cycle: cycleNum,
          });
        }
      } else {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        if (mountedRef.current) {
          setStatus({
            phase: 'error',
            message: `Simulation Fehler: ${err.detail || resp.statusText}`,
            n_events: allEvents.length,
            cycle: cycleNum,
          });
        }
      }
    } catch (err) {
      if (!ctrl.cancelRequested && mountedRef.current) {
        setStatus({
          phase: 'error',
          message: `Fehler: ${err.message}`,
          n_events: allEvents.length,
          cycle: cycleNum,
        });
      }
    }

    if (ctrl.cancelRequested || !mountedRef.current) return;

    // ── Phase 3: Warten bis zum nächsten Cycle ───────────────────────
    const waitMs = Math.max(5000, (retrainEvery - durationSeconds) * 1000);
    await new Promise((resolve) => {
      ctrl.timer = setTimeout(resolve, waitMs);
    });

    if (!ctrl.cancelRequested && mountedRef.current) {
      runCycle();
    }
  }, [token, network, durationSeconds, retrainEvery, nPaths, nSteps, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // enabled Wechsel → Loop starten / stoppen
  useEffect(() => {
    if (enabled) {
      cycleRef.current.cancelRequested = false;
      cycleRef.current.running = true;
      runCycle();
    } else {
      _cancel();
      if (mountedRef.current) {
        setStatus({ phase: 'idle', message: '', n_events: 0, cycle: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Token/Netzwerk/Parameter-Wechsel → bei aktivem Loop neu starten
  useEffect(() => {
    if (enabled && cycleRef.current.running) {
      _cancel();
      cycleRef.current.cancelRequested = false;
      cycleRef.current.running = true;
      cycleRef.current.cycle = 0;
      runCycle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, network, durationSeconds, retrainEvery]);

  const stopLive = useCallback(() => {
    _cancel();
    if (mountedRef.current) {
      setStatus({ phase: 'idle', message: '', n_events: 0, cycle: 0 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { markovData, status, stopLive };
}
