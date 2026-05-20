import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import TitleBar from './components/TitleBar';
import InputSection from './components/InputSection';
import PresetSection from './components/PresetSection';
import SettingsPanel from './components/SettingsPanel';
import GenerateSection from './components/GenerateSection';
import ProgressOverlay from './components/ProgressOverlay';
import { healthCheck } from './utils/api';

function App() {
  // Application state
  const [config, setConfig] = useState({
    youtube_url: '',
    avatar_path: null,
    preset: null,
    audio: {
      speed: 1.18,
      background_music_path: null,
      background_music_volume: -20.8,
    },
    background: {
      mode: 'auto',
      color1: '#ff006e',
      color2: '#8338ec',
      gradient_direction: 'diagonal',
      uploaded_path: null,
    },
    avatar: {
      remove_background: true,
      enhance_colors: true,
      sharpen: true,
      upscale: false,
      position: 'left',
      scale: 0.6,
    },
    text: {
      text: 'SI TE SABES EL TIKTOK BAILAI',
      font: 'Anton',
      font_size: 72,
      color: null,
      position: 'right',
      glow: true,
      glow_color: null,
      shadow: true,
      stroke: true,
      stroke_width: 3,
      opacity: 1.0,
    },
    effects: {
      snowfall: true,
      snowfall_speed: 40,
      fuzzy_stars: true,
      glow_particles: true,
      soft_blur_glow: true,
      vhs_effect: false,
      chromatic_glow: false,
      grain: false,
      cinematic_blur: false,
      enhancement_4k: true,
    },
    sticker: {
      enabled: true,
      floating_animation: true,
      position: 'top-right',
      scale: 0.15,
    },
    export: {
      resolution: '1080p',
      format: 'mp4',
      fps: 30,
      quality: 'high',
      generate_thumbnail: true,
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [result, setResult] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      const health = await healthCheck();
      setBackendStatus(health.status === 'healthy' ? 'online' : 'offline');
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update config helper
  const updateConfig = (section, updates) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-dark-900">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />

      {/* Custom Title Bar */}
      <TitleBar backendStatus={backendStatus} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left + Center Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Top: Input Section */}
          <InputSection
            config={config}
            setConfig={setConfig}
            updateConfig={updateConfig}
          />

          {/* Middle: Preset Cards */}
          <PresetSection
            selectedPreset={config.preset}
            onSelectPreset={(presetId) => setConfig(prev => ({ ...prev, preset: presetId }))}
          />

          {/* Bottom: Generate Button */}
          <GenerateSection
            config={config}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setProgress={setProgress}
            setResult={setResult}
          />
        </div>

        {/* Right: Settings Panel */}
        <SettingsPanel config={config} updateConfig={updateConfig} />
      </div>

      {/* Progress Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <ProgressOverlay
            progress={progress}
            onCancel={() => setIsGenerating(false)}
          />
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-2xl font-bold mb-2">Render Complete!</h2>
              <p className="text-white/60 mb-6">Your TikTok mashup video is ready.</p>
              
              {result.data?.export_folder && (
                <button
                  onClick={() => {
                    // Try Electron first, fallback to copying path
                    if (window.require) {
                      const { ipcRenderer } = window.require('electron');
                      ipcRenderer.invoke('open-folder', result.data.export_folder);
                    } else {
                      // Browser mode: copy path to clipboard
                      navigator.clipboard.writeText(result.data.export_folder);
                      alert(`Video saved to:\n${result.data.export_folder}\n\n(Path copied to clipboard)`);
                    }
                  }}
                  className="btn-primary w-full mb-3"
                >
                  Open Export Folder
                </button>
              )}
              
              <button
                onClick={() => setResult(null)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
