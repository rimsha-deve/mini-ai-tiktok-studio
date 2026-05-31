import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, Wifi, WifiOff } from 'lucide-react';

function TitleBar({ backendStatus }) {
  const handleMinimize = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('minimize-window');
    }
  };

  const handleMaximize = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('maximize-window');
    }
  };

  const handleClose = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('close-window');
    }
  };

  return (
    <div className="h-10 bg-dark-800/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 select-none"
         style={{ WebkitAppRegion: 'drag' }}>
      {/* App Title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-secondary"
        />
        <span className="text-sm font-semibold text-white/80">
          TikTok Mashup Studio
        </span>
        <span className="text-xs text-white/30">v1.0</span>
      </div>

      {/* Status + Controls */}
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Backend Status */}
        <div className="flex items-center gap-1.5">
          {backendStatus === 'online' ? (
            <>
              <Wifi size={12} className="text-green-400" />
              <span className="text-xs text-green-400">Backend Online</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-400" />
              <span className="text-xs text-red-400">Backend Offline</span>
            </>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TitleBar;
