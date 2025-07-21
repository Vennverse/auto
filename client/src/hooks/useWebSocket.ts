import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketProps {
  url: string;
  userId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = ({ 
  url, 
  userId, 
  onMessage, 
  onConnect, 
  onDisconnect 
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const mountedRef = useRef(true);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !userId || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up any existing connection
    if (ws.current) {
      ws.current.close();
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);
      setConnectionState('connecting');

      ws.current.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        
        // Authenticate with user ID
        if (userId && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'authenticate',
            userId: userId
          }));
        }
        
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionState('disconnected');
        onDisconnect?.();
      };

      ws.current.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionState('disconnected');
      };

    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('disconnected');
    }
  }, [userId, onMessage, onConnect, onDisconnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  // Only connect once when userId is available
  useEffect(() => {
    if (userId && connectionState === 'disconnected') {
      connect();
    }
  }, [userId, connect, connectionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    sendMessage,
    connect,
    disconnect
  };
};