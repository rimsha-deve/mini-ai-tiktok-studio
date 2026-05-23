import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { createGenerationSocket, uploadAvatar, uploadBackground, uploadAudio, healthCheck } from './utils/api';
import SourcesTab  from './components/SourcesTab';
import StyleTab    from './components/StyleTab';
import EffectsTab  from './components/EffectsTab';
import AudioTab    from './components/AudioTab';
import PreviewCard from './components/PreviewCard';

const tabs = [
  { id: 'sources', label: 'Sources', icon: '⊞' },
  { id: 'style',   label: 'Style',   icon: '🎨' },
  { id: 'effects', label: 'Effects', icon: '✦' },
  { id: 'audio',   label: 'Audio',   icon: '♫' },
];

const DEFAULT_CONFIG = {
  youtube_url: '',
  text: { text: 'SI TE SABES EL TIKTOK BAILAI', font: 'Anton', color: '#FFFFFF', font_size: 0 },
  audio: { speed: 1.18, background_music_volume: -20.8 },
  effects: { snowfall: true, snowfall_speed: 40, enhancement_4k: true },
  export: { resolution: '1080p', quality: 'high', generate_thumbnail: true },
  preset: 'mashup-style',
  layout: { avatar_x: -1, text_x: 0, text_y: 0, logo_x: 0, logo_y: 0 },
};

const STAGE_LABELS = {
  init: 'Initializing', youtube: 'Extracting Audio', audio: 'Processing Audio',
  color: 'Analyzing Colors', background: 'Building Background', avatar: 'Processing Avatar',
  text: 'Rendering Text', effects: 'Generating Effects', sticker: 'Loading Logo',
  render: 'Compositing Frames', encode: 'Encoding Video', outro: 'Adding Outro',
  concat: 'Finalizing', thumbnail: 'Creating Thumbnail', complete: 'Complete!',
};

// Card style — semi-transparent glass
const card = "bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl";

export default function App() {
  const [activeTab, setActiveTab]         = useState('sources');
  const [config, setConfig] = useState(() => {
    // Pick up URL passed from landing page
    const savedUrl = sessionStorage.getItem('yt_url') || '';
    if (savedUrl) sessionStorage.removeItem('yt_url');
    return { ...DEFAULT_CONFIG, youtube_url: savedUrl };
  });
  const [avatarFile, setAvatarFile]       = useState(null);
  const [bgFile, setBgFile]               = useState(null);
  const [audioFile, setAudioFile]         = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [progress, setProgress]           = useState(null);
  const [result, setResult]               = useState(null);

  useEffect(() => {
    const check = async () => { const h = await healthCheck(); setBackendOnline(h.status === 'healthy'); };
    check();
    const t = setInterval(check, 8000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = async () => {
    if (!config.youtube_url && !audioFile) {
      toast.error('Paste a YouTube URL or upload audio first.');
      return;
    }
    setGenerating(true);
    setProgress({ stage: 'init', progress: 2, message: 'Uploading files…' });
    setResult(null);

    try {
      if (avatarFile) await uploadAvatar(avatarFile);
      if (bgFile)     await uploadBackground(bgFile);
      if (audioFile)  await uploadAudio(audioFile);
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
      setGenerating(false); setProgress(null); return;
    }

    setProgress({ stage: 'init', progress: 8, message: 'Connecting…' });
    createGenerationSocket(config, {
      onStart:    () => setProgress({ stage: 'init', progress: 10, message: 'Connected!' }),
      onProgress: (d) => setProgress(d),
      onComplete: (d) => { setGenerating(false); setProgress(null); setResult(d); toast.success('Video ready! 🎬'); },
      onError:    (msg) => { setGenerating(false); setProgress(null); toast.error(msg || 'Generation failed.'); },
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden studio-root text-white"
         style={{ fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, #0f0c29 0%, #1a0533 50%, #24243e 100%)' }}>
      <Toaster position="top-right"
        toastOptions={{ style: { background: 'rgba(30,10,60,0.95)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px',
          backdropFilter: 'blur(12px)' } }} />

      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0"
           style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shadow-lg"
               style={{ background: 'linear-gradient(135deg, #ff2eaa, #8b2fc9, #ff6b00)' }}>T</div>
          <div>
            <span className="font-bold text-sm tracking-tight">TikTok Mashup Studio</span>
            <span className="text-xs text-white/30 ml-2 px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>v2.0</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
          ${backendOnline
            ? 'border-green-400/30 text-green-300' : 'border-red-400/30 text-red-300'}`}
          style={{ background: backendOnline ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)' }}>
          <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {backendOnline ? 'Backend Online' : 'Backend Offline'}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left Panel ── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">

          {/* Tab Bar */}
          <div className="px-5 pt-4 pb-0 shrink-0">
            <div className="flex gap-1 p-1 rounded-2xl"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={activeTab === t.id ? {
                    background: 'linear-gradient(135deg, rgba(255,46,170,0.3), rgba(139,47,201,0.3))',
                    border: '1px solid rgba(255,46,170,0.3)',
                    color: 'white',
                  } : { color: 'rgba(255,255,255,0.4)' }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>
                {activeTab === 'sources' && (
                  <SourcesTab config={config} setConfig={setConfig}
                    avatarFile={avatarFile} setAvatarFile={setAvatarFile}
                    bgFile={bgFile} setBgFile={setBgFile}
                    audioFile={audioFile} setAudioFile={setAudioFile} />
                )}
                {activeTab === 'style'   && <StyleTab   config={config} setConfig={setConfig} />}
                {activeTab === 'effects' && <EffectsTab config={config} setConfig={setConfig} />}
                {activeTab === 'audio'   && <AudioTab   config={config} setConfig={setConfig} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Generate Button ── */}
          <div className="shrink-0 px-5 pb-5 pt-3 space-y-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleGenerate} disabled={generating}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #ff2eaa, #8b2fc9, #ff6b00)',
                       boxShadow: '0 8px 32px rgba(255,46,170,0.35)' }}>
              {generating
                ? <><span className="animate-spin text-lg">⟳</span>{progress?.message || 'Generating…'}</>
                : <><span className="text-lg">▶</span> Generate Video</>}
            </motion.button>

            {generating && progress && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span>{STAGE_LABELS[progress.stage] || progress.stage}</span>
                  <span className="font-mono">{Math.round(progress.progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #ff2eaa, #8b2fc9, #ff6b00)' }}
                    animate={{ width: `${progress.progress}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>
            )}

            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
              1080p MP4 · 16:9 · Auto thumbnail · Outro included
            </p>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-80 flex flex-col p-4 gap-4 overflow-y-auto shrink-0"
             style={{ borderLeft: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)' }}>

          {/* Live Preview */}
          <div>
            <p className="text-xs mb-2 uppercase tracking-widest font-medium"
               style={{ color: 'rgba(255,255,255,0.35)' }}>Preview</p>
            <PreviewCard config={config} avatarFile={avatarFile} />
          </div>

          {/* Settings */}
          <div>
            <p className="text-xs mb-2 uppercase tracking-widest font-medium"
               style={{ color: 'rgba(255,255,255,0.35)' }}>Settings</p>
            <div className="rounded-2xl p-3 space-y-2"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['Preset',   config.preset || 'Custom'],
                ['Font',     config.text.font],
                ['Color',    config.text.color || '#FFFFFF'],
                ['Speed',    `${config.audio.speed}x`],
                ['Snow',     config.effects.snowfall ? `${config.effects.snowfall_speed}%` : 'Off'],
                ['Quality',  config.export.quality],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-0.5">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{k}</span>
                  <div className="flex items-center gap-1.5">
                    {k === 'Color' && (
                      <div className="w-3 h-3 rounded-full border border-white/20"
                           style={{ backgroundColor: v }} />
                    )}
                    <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outro */}
          <div>
            <p className="text-xs mb-2 uppercase tracking-widest font-medium"
               style={{ color: 'rgba(255,255,255,0.35)' }}>Outro (4s)</p>
            <div className="rounded-2xl p-4 text-center"
                 style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm text-white font-medium italic">Sígueme para ver más</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Black screen · White text · Centered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
            onClick={() => setResult(null)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              className="rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
              style={{ background: 'rgba(30,10,60,0.95)', border: '1px solid rgba(255,255,255,0.12)',
                       boxShadow: '0 32px 80px rgba(255,46,170,0.2)' }}
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background: 'linear-gradient(135deg, #ff2eaa, #8b2fc9)' }}>🎬</div>
              <h2 className="text-xl font-bold mb-1">Render Complete!</h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Your TikTok mashup is ready.</p>

              {/* Custom save name */}
              <div className="mb-4 text-left">
                <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Save as filename</p>
                <input
                  type="text"
                  value={result.saveName || 'tiktok_mashup'}
                  onChange={e => setResult(r => ({ ...r, saveName: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  placeholder="tiktok_mashup"
                />
              </div>

              {/* Play button */}
              <button
                onClick={() => {
                  const vp = result.data?.video_path;
                  if (window.require) {
                    window.require('electron').shell.openPath(vp);
                  } else if (vp) {
                    const p = vp.replace(/\\/g,'/').split('/');
                    window.open(`http://127.0.0.1:8000/exports/${p[p.length-2]}/${p[p.length-1]}`, '_blank');
                  }
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm mb-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #ff2eaa, #8b2fc9)' }}>
                ▶ Play Video
              </button>

              {/* Open folder */}
              <button
                onClick={() => {
                  const folder = result.data?.export_folder;
                  if (window.require) {
                    window.require('electron').shell.openPath(folder);
                  } else {
                    navigator.clipboard?.writeText(folder || '');
                    alert(`Saved to:\n${folder}\n\n(Path copied to clipboard)`);
                  }
                }}
                className="w-full py-3 rounded-2xl text-sm mb-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                         border: '1px solid rgba(255,255,255,0.1)' }}>
                📁 Open Export Folder
              </button>

              <button onClick={() => setResult(null)}
                className="w-full py-3 rounded-2xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
