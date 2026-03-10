/**
 * useMarkovStream.js — Custom Hook for Markov WebSocket stream
 * Connects to /api/v1/orderbook-heatmap/markov/l2-stream
 * Provides live price fan bands + active wall data for chart overlay
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export function useMarkovStream({
  token,
  network,
  enabled = false,
  retrainEvery = 30,
  minSnapshots = 15,
  intervalSeconds = 1.0,
  nPaths = 200,
  nSteps = 50,
  volatilityMultiplier = 1.0,
  wallBounceFactor = 0.7,
  limit = 50,
}) {
  const [markovData, setMarkovData] = useState(null);
  const [status, setStatus] = useState({ phase: 'idle', message: '' });
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      token,
      network,
      retrain_every: retrainEvery,
      min_snapshots: minSnapshots,
      interval_seconds: intervalSeconds,
      n_paths: nPaths,
      n_steps: nSteps,
      volatility_multiplier: volatilityMultiplier,
      wall_bounce_factor: wallBounceFactor,
      limit,
    });
    const wsBase = process.env.REACT_APP_API_URL.replace('http', 'ws');
    return `${wsBase}/api/v1/orderbook-heatmap/markov/l2-stream?${params}`;
  }, [token, network, retrainEvery, minSnapshots, intervalSeconds,
      nPaths, nSteps, volatilityMultiplier, wallBounceFactor, limit]);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setStatus({ phase: 'connecting', message: 'Connecting to Markov stream...' });
    const ws = new WebSocket(buildUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus({
        phase: 'collecting',
        message: 'Connected. Collecting snapshots...',
        snapshots_collected: 0,
        snapshots_needed: minSnapshots,
      });
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'markov_connected':
            setStatus({
              phase: 'collecting',
              message: msg.message,
              snapshots_collected: 0,
              snapshots_needed: minSnapshots,
            });
            break;
          case 'markov_collecting':
            setStatus({
              phase: 'collecting',
              message: msg.message,
              snapshots_collected: msg.snapshots_collected,
              snapshots_needed: msg.snapshots_needed,
            });
            break;
          case 'markov_update':
            setMarkovData(msg);
            setStatus({
              phase: 'streaming',
              message: `Live · buffer: ${msg.buffer_size} snapshots`,
            });
            break;
          case 'markov_error':
            setStatus({ phase: 'error', message: msg.error });
            break;
          default:
            break;
        }
      } catch (e) {
        console.warn('Markov WS parse error:', e);
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus({ phase: 'error', message: 'WebSocket error' });
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus({ phase: 'idle', message: 'Disconnected' });
      if (enabled && mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };
  }, [enabled, buildUrl, minSnapshots]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus({ phase: 'idle', message: '' });
    setMarkovData(null);
  }, []);

  // Connect/disconnect based on enabled flag; reconnect when token/network changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [enabled, token, network]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'ping' }));
    }
  }, []);

  const forceRetrain = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'force_retrain' }));
    }
  }, []);

  return { markovData, status, disconnect, sendPing, forceRetrain };
}
