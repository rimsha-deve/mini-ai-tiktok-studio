import React, { useState, useEffect } from 'react';
import { getBgMusicTracks, downloadBgTrack, uploadThumbnail } from '../utils/api';
import toast from 'react-hot-toast';

const BG_PRESETS = [
  { id:'hiphop',    label:'Hip-Hop',    icon:'🎤', desc:'Trap beat, 808s',       bpm:90  },
  { id:'pop',       label:'Pop',        icon:'🎵', desc:'Upbeat pop vibes',      bpm:120 },
  { id:'reggaeton', label:'Reggaeton',  icon:'🔥', desc:'Latin rhythm',          bpm:100 },
  { id:'lofi',      label:'Lo-Fi',      icon:'🎧', desc:'Chill lo-fi beats',     bpm:75  },
  { id:'edm',       label:'EDM',        icon:'⚡', desc:'Electronic drop',       bpm:138 },
];

const QUALITIES = [
  { id:'low',    label:'Low',    sub:'Fast render' },
  { id:'medium', label:'Medium', sub:'Balanced'    },
  { id:'high',   label:'High',   sub:'Default'     },
  { id:'ultra',  label:'Ultra',  sub:'4K quality'  },
];

const S = {
  wrap:     { display:'flex', flexDirection:'column', gap:14 },
  sec:      { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:8, display:'block' },
  sep:      { border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', margin:'4px 0' },
  // presets grid
  pgrid:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 },
  pcard:    { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, padding:'10px 6px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' },
  pcardOn:  { background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.3)' },
  pico:     { fontSize:20, marginBottom:4, display:'block' },
  pname:    { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.75)', display:'block', marginBottom:2 },
  pnameOn:  { color:'#FF2EAA' },
  pdesc:    { fontSize:9, color:'rgba(255,255,255,0.25)', display:'block' },
  pbpm:     { fontSize:9, color:'rgba(255,255,255,0.2)', display:'block', marginTop:2 },
  // track list
  trackList:{ display:'flex', flexDirection:'column', gap:6 },
  trackCard:{ background:'#0f0f1c', border:'1px solid rgba(255,46,170,0.2)', borderRadius:10, padding:'10px 12px' },
  trackTop: { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  trackIco: { fontSize:16, flexShrink:0 },
  trackName:{ fontSize:12, fontWeight:600, color:'#FF2EAA', flex:1 },
  trackBpm: { fontSize:10, color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.05)', padding:'2px 6px', borderRadius:5 },
  trackDl:  { fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'2px 8px', cursor:'pointer' },
  trackDld: { fontSize:10, color:'#4ade80', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:5, padding:'2px 8px' },
  removeBtn:{ fontSize:14, color:'rgba(255,100,100,0.6)', background:'none', border:'none', cursor:'pointer', padding:'0 4px', lineHeight:1, flexShrink:0 },
  slRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 },
  slName:   { fontSize:11, color:'rgba(255,255,255,0.45)' },
  slVal:    { fontSize:11, fontWeight:700, color:'#FF2EAA' },
  slHints:  { display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:3 },
  addHint:  { textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', padding:'8px 0' },
  // global volume
  slCard:   { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 14px' },
  // speed main
  speedCard:{ background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 14px' },
  // beat info
  beatCard: { background:'rgba(139,47,201,0.06)', border:'1px solid rgba(139,47,201,0.15)', borderRadius:10, padding:'12px 14px' },
  beatTitle:{ fontSize:12, fontWeight:700, color:'#a855f7', marginBottom:8, display:'flex', alignItems:'center', gap:6 },
  beatItem: { fontSize:11, color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:6, marginBottom:4 },
  // quality
  qGrid:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 },
  qCard:    { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'8px 6px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' },
  qCardOn:  { background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.3)' },
  qLabel:   { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:2 },
  qLabelOn: { color:'#FF2EAA' },
  qSub:     { fontSize:9, color:'rgba(255,255,255,0.25)', display:'block' },
  // thumbnail
  thumbDz:  { border:'1.5px dashed rgba(255,255,255,0.1)', borderRadius:9, padding:'14px 10px', textAlign:'center', cursor:'pointer', background:'rgba(255,255,255,0.02)', transition:'border-color 0.2s' },
  thumbPrev:{ width:'100%', maxHeight:80, objectFit:'cover', borderRadius:6, marginBottom:6 },
};

export default function AudioTab({ config, setConfig, audioFile, setAudioFile, avatarFile, setAvatarFile }) {
  const updA = (k, v) => setConfig(p => ({ ...p, audio: { ...p.audio, [k]: v } }));
  const updE = (k, v) => setConfig(p => ({ ...p, export: { ...p.export, [k]: v } }));

  // bg_tracks: array of { id, label, icon, volume, speed, downloading, downloaded }
  const bgTracks  = config.audio?.bg_tracks || [];
  const [thumbFile,  setThumbFile]  = useState(null);
  const [thumbPrev,  setThumbPrev]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  const setBgTracks = (tracks) => updA('bg_tracks', tracks);

  const addTrack = async (preset) => {
    if (bgTracks.find(t => t.id === preset.id)) {
      toast.error(`${preset.label} is already added`);
      return;
    }
    if (bgTracks.length >= 3) {
      toast.error('Maximum 3 background tracks allowed');
      return;
    }
    const newTrack = { ...preset, volume: -20, speed: 1.0, downloading: true, downloaded: false };
    const updated  = [...bgTracks, newTrack];
    setBgTracks(updated);

    // Download track in background
    try {
      const r = await downloadBgTrack(preset.id);
      setBgTracks(updated.map(t =>
        t.id === preset.id ? { ...t, downloading: false, downloaded: r.success } : t
      ));
      if (r.success) toast.success(`${preset.label} ready!`);
      else toast.error(`${preset.label} download failed — check backend`);
    } catch {
      setBgTracks(updated.map(t =>
        t.id === preset.id ? { ...t, downloading: false, downloaded: false } : t
      ));
      toast.error(`Failed to download ${preset.label}`);
    }
  };

  const removeTrack = (id) => setBgTracks(bgTracks.filter(t => t.id !== id));

  const updateTrack = (id, key, val) => setBgTracks(
    bgTracks.map(t => t.id === id ? { ...t, [key]: val } : t)
  );

  const handleThumb = async (file) => {
    if (!file) return;
    setThumbFile(file);
    setThumbPrev(URL.createObjectURL(file));
    setUploading(true);
    try {
      await uploadThumbnail(file);
      toast.success('Thumbnail uploaded!');
    } catch { toast.error('Thumbnail upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div style={S.wrap}>

      {/* ── Video Avatar ──────────────────────────────────────── */}
      <div>
        <span style={S.sec}>🎬 Video Avatar (Animated)</span>
        <div style={S.thumbDz} onClick={() => document.getElementById('vid-av-inp').click()}>
          <input id="vid-av-inp" type="file" accept="video/*" style={{ display:'none' }}
            onChange={e => e.target.files[0] && setAvatarFile(e.target.files[0])} />
          <div style={{ fontSize:22, marginBottom:5 }}>
            {avatarFile?.type?.startsWith('video') ? '✅' : '🎬'}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:3 }}>
            {avatarFile?.type?.startsWith('video') ? avatarFile.name : 'Drop video avatar here'}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>MP4 WebM MOV — animated avatar</div>
        </div>
      </div>

      <hr style={S.sep} />

      {/* ── Background Music ──────────────────────────────────── */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ ...S.sec, marginBottom:0 }}>🎶 Background Music</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{bgTracks.length}/3 tracks</span>
        </div>

        {/* Preset picker */}
        <div style={S.pgrid}>
          {BG_PRESETS.map(p => {
            const added = bgTracks.some(t => t.id === p.id);
            return (
              <div key={p.id}
                style={{ ...S.pcard, ...(added ? S.pcardOn : {}), opacity: added ? 1 : 0.85 }}
                onClick={() => added ? removeTrack(p.id) : addTrack(p)}>
                <span style={S.pico}>{p.icon}</span>
                <span style={{ ...S.pname, ...(added ? S.pnameOn : {}) }}>{p.label}</span>
                <span style={S.pdesc}>{p.desc}</span>
                <span style={S.pbpm}>{p.bpm} BPM</span>
                {added && <span style={{ fontSize:9, color:'#FF2EAA', marginTop:3, display:'block' }}>✓ Added</span>}
              </div>
            );
          })}
        </div>

        {/* Active track controls */}
        {bgTracks.length > 0 ? (
          <div style={S.trackList}>
            {bgTracks.map(t => (
              <div key={t.id} style={S.trackCard}>
                <div style={S.trackTop}>
                  <span style={S.trackIco}>{t.icon}</span>
                  <span style={S.trackName}>{t.label}</span>
                  <span style={S.trackBpm}>{t.bpm} BPM</span>
                  {t.downloading
                    ? <span style={S.trackDl}>⏳ Downloading…</span>
                    : t.downloaded
                      ? <span style={S.trackDld}>✅ Ready</span>
                      : <span style={{ ...S.trackDl, cursor:'pointer' }}
                          onClick={() => downloadBgTrack(t.id).then(r =>
                            updateTrack(t.id,'downloaded',r.success))}>↓ Download</span>
                  }
                  <button style={S.removeBtn} onClick={() => removeTrack(t.id)}>✕</button>
                </div>

                {/* Volume */}
                <div style={S.slRow}>
                  <span style={S.slName}>🔊 Volume</span>
                  <span style={S.slVal}>{t.volume ?? -20} dB</span>
                </div>
                <input type="range" min={-40} max={0} step={0.5}
                  value={t.volume ?? -20}
                  onChange={e => updateTrack(t.id,'volume',+e.target.value)}
                  style={{ width:'100%', accentColor:'#FF2EAA', marginBottom:6 }} />
                <div style={S.slHints}><span>-40 quiet</span><span>0 loud</span></div>

                {/* BG Speed */}
                <div style={{ ...S.slRow, marginTop:8 }}>
                  <span style={S.slName}>⏩ BG Speed</span>
                  <span style={S.slVal}>{(t.speed ?? 1.0).toFixed(2)}x</span>
                </div>
                <input type="range" min={0.5} max={2.0} step={0.01}
                  value={t.speed ?? 1.0}
                  onChange={e => updateTrack(t.id,'speed',+e.target.value)}
                  style={{ width:'100%', accentColor:'#FF2EAA' }} />
                <div style={S.slHints}><span>0.5x slow</span><span>1.0x normal</span><span>2.0x fast</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={S.addHint}>Click a genre above to add background music</div>
        )}
      </div>

      <hr style={S.sep} />

      {/* ── Main Audio Speed ──────────────────────────────────── */}
      <div>
        <span style={S.sec}>⏩ Audio Speed</span>
        <div style={S.speedCard}>
          <div style={S.slRow}>
            <span style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.7)' }}>Playback Speed</span>
            <span style={{ fontSize:12, fontWeight:700, color:'#FF2EAA' }}>{config.audio?.speed ?? 1.18}x</span>
          </div>
          <input type="range" min={0.5} max={2.0} step={0.01}
            value={config.audio?.speed ?? 1.18}
            onChange={e => updA('speed', +e.target.value)}
            style={{ width:'100%', accentColor:'#FF2EAA' }} />
          <div style={S.slHints}><span>0.5x slow</span><span>1.18x TikTok default</span><span>2.0x fast</span></div>
        </div>
      </div>

      <hr style={S.sep} />

      {/* ── Beat Analysis ─────────────────────────────────────── */}
      <div style={S.beatCard}>
        <div style={S.beatTitle}><span>🎵</span> Beat Analysis — Auto</div>
        {[
          '🔍 Detects BPM every 10 seconds',
          '🔈 Quiet sections → boosted louder',
          '🔊 Loud sections → compressed softer',
          '🎵 Song changes detected automatically',
          '🎸 Bass boost on high-energy parts',
          '✨ Final limiter prevents clipping',
        ].map(t => <div key={t} style={S.beatItem}>{t}</div>)}
      </div>

      <hr style={S.sep} />

      {/* ── Custom Thumbnail ──────────────────────────────────── */}
      <div>
        <span style={S.sec}>🖼 Custom Thumbnail</span>
        <div style={S.thumbDz} onClick={() => document.getElementById('thumb-inp').click()}>
          <input id="thumb-inp" type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => e.target.files[0] && handleThumb(e.target.files[0])} />
          {thumbPrev
            ? <img src={thumbPrev} alt="thumbnail" style={S.thumbPrev} />
            : <div style={{ fontSize:22, marginBottom:5 }}>🖼️</div>
          }
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:3 }}>
            {uploading ? '⏳ Uploading…' : thumbFile ? thumbFile.name : 'Upload custom thumbnail'}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>JPG PNG WebP — replaces auto-generated thumbnail</div>
        </div>
        {thumbFile && (
          <button onClick={() => { setThumbFile(null); setThumbPrev(null); }}
            style={{ marginTop:6, width:'100%', padding:'5px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, fontSize:11, color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>
            ✕ Remove thumbnail
          </button>
        )}
      </div>

      <hr style={S.sep} />

      {/* ── Export Quality ────────────────────────────────────── */}
      <div>
        <span style={S.sec}>🎬 Export Quality</span>
        <div style={S.qGrid}>
          {QUALITIES.map(q => (
            <div key={q.id}
              style={{ ...S.qCard, ...(config.export?.quality === q.id ? S.qCardOn : {}) }}
              onClick={() => updE('quality', q.id)}>
              <span style={{ ...S.qLabel, ...(config.export?.quality === q.id ? S.qLabelOn : {}) }}>{q.label}</span>
              <span style={S.qSub}>{q.sub}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}