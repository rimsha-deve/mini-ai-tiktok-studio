import React, { useState } from 'react';

const glass = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

const BG_MUSIC_PRESETS = [
  { id: 'none',    label: 'None',       icon: '🔇', desc: 'No background music' },
  { id: 'hiphop',  label: 'Hip-Hop',    icon: '🎤', desc: 'Trap beat, 808s' },
  { id: 'pop',     label: 'Pop',        icon: '🎵', desc: 'Upbeat pop vibes' },
  { id: 'reggaeton',label:'Reggaeton',  icon: '🔥', desc: 'Latin rhythm' },
  { id: 'lofi',    label: 'Lo-Fi',      icon: '🎧', desc: 'Chill lo-fi beats' },
  { id: 'edm',     label: 'EDM',        icon: '⚡', desc: 'Electronic drop' },
];

export default function AudioTab({ config, setConfig }) {
  const upd    = (k, v) => setConfig(p => ({ ...p, audio:  { ...p.audio,  [k]: v } }));
  const updExp = (k, v) => setConfig(p => ({ ...p, export: { ...p.export, [k]: v } }));
  const [selectedMusic, setSelectedMusic] = useState('none');

  const handleMusicSelect = (id) => {
    setSelectedMusic(id);
    if (id === 'none') {
      upd('background_music_preset', null);
    } else {
      upd('background_music_preset', id);
    }
  };

  return (
    <div className="space-y-4">

      {/* Background Music */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Background Music</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {BG_MUSIC_PRESETS.map(m => (
            <button key={m.id} onClick={() => handleMusicSelect(m.id)}
              className="rounded-2xl p-3 text-left transition-all"
              style={selectedMusic === m.id
                ? { background: 'linear-gradient(135deg,rgba(255,46,170,0.3),rgba(139,47,201,0.3))',
                    border: '1px solid rgba(255,46,170,0.5)' }
                : { ...glass }}>
              <div className="text-xl mb-1">{m.icon}</div>
              <p className="text-xs font-bold text-white">{m.label}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {/* BG Music Volume */}
        {selectedMusic !== 'none' && (
          <div className="rounded-2xl p-4" style={glass}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-white">BG Music Volume</span>
              <span className="font-mono" style={{ color: '#ff2eaa' }}>
                {config.audio.background_music_volume} dB
              </span>
            </div>
            <input type="range" min={-40} max={0} step={0.1}
              value={config.audio.background_music_volume}
              onChange={e => upd('background_music_volume', +e.target.value)}
              className="w-full" style={{ accentColor: '#ff2eaa' }} />
            <div className="flex justify-between text-xs mt-1"
                 style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>-40 dB (quiet)</span>
              <span>-20.8 dB (default)</span>
              <span>0 dB (loud)</span>
            </div>
          </div>
        )}
      </div>

      {/* Beat Analysis */}
      <div className="rounded-2xl p-4 space-y-3" style={glass}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">🎵 Beat Analysis</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Analyzes every 10s — balances loud/quiet, detects song changes
            </p>
          </div>
          <button
            onClick={() => upd('beat_analysis', !config.audio.beat_analysis)}
            className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
            style={{ background: config.audio.beat_analysis !== false
              ? 'linear-gradient(135deg,#ff2eaa,#8b2fc9)'
              : 'rgba(255,255,255,0.1)' }}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                 style={{ left: config.audio.beat_analysis !== false ? '22px' : '2px' }} />
          </button>
        </div>

        {config.audio.beat_analysis !== false && (
          <div className="rounded-xl p-3 space-y-1.5"
               style={{ background: 'rgba(255,46,170,0.08)', border: '1px solid rgba(255,46,170,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: '#ff2eaa' }}>What it does:</p>
            {[
              '🔍 Detects BPM every 10 seconds',
              '🎚 Quiet sections → boosted louder',
              '🔊 Loud sections → compressed softer',
              '🎵 Song changes detected automatically',
              '🎸 Bass boost on high-energy parts',
              '✨ Final limiter prevents clipping',
            ].map((item, i) => (
              <p key={i} className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item}</p>
            ))}
          </div>
        )}
      </div>

      {/* Audio Speed */}
      <div className="rounded-2xl p-4 space-y-4" style={glass}>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-white">Audio Speed</span>
            <span className="font-mono" style={{ color: '#8b2fc9' }}>{config.audio.speed}x</span>
          </div>
          <input type="range" min={0.5} max={2.0} step={0.01}
            value={config.audio.speed} onChange={e => upd('speed', +e.target.value)}
            className="w-full" style={{ accentColor: '#8b2fc9' }} />
          <div className="flex justify-between text-xs mt-1"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>0.5x</span><span>1.18x (TikTok default)</span><span>2.0x</span>
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="rounded-2xl p-4 space-y-3" style={glass}>
        <p className="text-xs uppercase tracking-widest font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Export</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Resolution', key: 'resolution',
              opts: [['1080p','1080p Full HD'],['4k','4K Ultra HD']] },
            { label: 'Quality', key: 'quality',
              opts: [['low','Low (Fast)'],['medium','Medium'],['high','High'],['ultra','Ultra']] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              <select value={config.export[key]} onChange={e => updExp(key, e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ ...glass, color: 'white' }}>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
