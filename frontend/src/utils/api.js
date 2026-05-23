/**
 * API utility for communicating with the Python FastAPI backend.
 */

import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';
const WS_BASE = 'ws://127.0.0.1:8000/ws';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 min timeout for long operations
});

// ==================== YouTube ====================

export async function extractYouTubeAudio(url, speed = 1.18) {
  const response = await api.post('/youtube/extract', { url, speed });
  return response.data;
}

// ==================== Uploads ====================

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function uploadBackground(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/background', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ==================== Presets ====================

export async function getPresets() {
  const response = await api.get('/presets');
  return response.data;
}

export async function getPreset(id) {
  const response = await api.get(`/presets/${id}`);
  return response.data;
}

// ==================== Generation ====================

export async function generateVideo(config) {
  const response = await api.post('/generate', config);
  return response.data;
}

// ==================== WebSocket Generation ====================

export function createGenerationSocket(config, callbacks) {
  let ws;
  let hasConnected = false;
  let retryCount = 0;
  const maxRetries = 3;

  function connect() {
    try {
      ws = new WebSocket(`${WS_BASE}/generate`);
    } catch (err) {
      // If WebSocket constructor fails, fall back to REST API
      fallbackToRest(config, callbacks);
      return null;
    }

    ws.onopen = () => {
      hasConnected = true;
      retryCount = 0;
      ws.send(JSON.stringify(config));
      callbacks.onStart?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.status === 'processing') {
          callbacks.onProgress?.(data);
        } else if (data.status === 'complete') {
          callbacks.onComplete?.(data);
          ws.close();
        } else if (data.status === 'error') {
          callbacks.onError?.(data.message);
          ws.close();
        }
      } catch (parseErr) {
        console.error('Failed to parse WebSocket message:', parseErr);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!hasConnected && retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying WebSocket connection (${retryCount}/${maxRetries})...`);
        setTimeout(connect, 2000);
      } else if (!hasConnected) {
        // All retries failed, fall back to REST API
        fallbackToRest(config, callbacks);
      }
    };

    ws.onclose = (event) => {
      // Only trigger close callback if we never got a complete/error
      // Don't treat normal close after complete as an error
      if (hasConnected && event.code !== 1000) {
        callbacks.onClose?.();
      }
    };

    return ws;
  }

  return connect();
}

/**
 * Fallback: use REST API if WebSocket connection fails.
 */
async function fallbackToRest(config, callbacks) {
  callbacks.onStart?.();
  callbacks.onProgress?.({ stage: 'init', progress: 10, message: 'Using REST API (WebSocket unavailable)...' });

  try {
    const response = await api.post('/generate', config, { timeout: 600000 });
    const data = response.data;

    if (data.success) {
      callbacks.onComplete?.({
        stage: 'complete',
        progress: 100,
        message: data.message,
        status: 'complete',
        data: {
          video_path: data.video_path,
          thumbnail_path: data.thumbnail_path,
          audio_path: data.audio_path,
          export_folder: data.export_folder,
          duration: data.duration,
        },
      });
    } else {
      callbacks.onError?.(data.message || 'Generation failed');
    }
  } catch (err) {
    const msg = err.response?.data?.detail || err.message || 'Backend connection failed. Make sure the backend is running.';
    callbacks.onError?.(msg);
  }
}

// ==================== Utilities ====================

export async function getAvailableFonts() {
  const response = await api.get('/fonts');
  return response.data;
}

export async function healthCheck() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch {
    return { status: 'offline' };
  }
}

export async function cleanupTemp() {
  const response = await api.post('/cleanup');
  return response.data;
}

export default api;


// ==================== Color Preview ====================

export async function getAvatarColors() {
  const response = await api.get('/colors/preview');
  return response.data;
}
