import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import {
  createGenerationSocket,
  uploadAvatar, uploadBackground, uploadAudio,
  healthCheck, addToQueue, removeFromQueue,
  connectQueueSocket,
} from './utils/api';
import SourcesTab      from './components/SourcesTab';
import StyleTab        from './components/StyleTab';
import EffectsTab      from './components/EffectsTab';
import AudioTab        from './components/AudioTab';
import PreviewCard     from './components/PreviewCard';
import ProgressOverlay from './components/ProgressOverlay';
import QueuePanel      from './components/QueuePanel';

const DEFAULT_CONFIG = {
  youtube_url: '',
  text:    { text:'SI TE SABES EL TIKTOK BAILAI', font:'Anton', color:'#FFFFFF', font_size:0, align:'left' },
  audio:   { speed:1.18, background_music_volume:-20.8 },
  effects: { snowfall:true, snowfall_speed:40, snow_pink:true, snow_dust:true, snow_night:true, enhancement_4k:true, glow_particles:false, soft_blur_glow:false, vhs_effect:false, chromatic_glow:false, grain:false },
  export:  { resolution:'1080p', quality:'high', generate_thumbnail:true },
  preset:  'mashup-style',
  layout:  { avatar_x:-1, avatar_y:0, avatar_scale:1.0, text_x:0, text_y:0, text_y_offset:0, logo_x:0, logo_y:0, logo_size:0 },
};

const TABS = [
  { id:'sources', label:'Sources', icon:'🎵' },
  { id:'style',   label:'Style',   icon:'🎨' },
  { id:'effects', label:'Effects', icon:'✨' },
  { id:'audio',   label:'Audio',   icon:'🔊' },
];

const STAGE_LABELS = {
  init:'Initializing', youtube:'Extracting Audio', audio:'Processing Audio',
  beat:'Analyzing Beats', color:'Analyzing Colors', background:'Building Background',
  avatar:'Processing Avatar', text:'Rendering Text', effects:'Generating Effects',
  sticker:'Loading Logo', render:'Compositing Frames', encode:'Encoding Video',
  timeline:'Building Timeline', concat:'Finalizing', outro:'Adding Outro',
  thumbnail:'Creating Thumbnail', complete:'Complete!',
};

function buildVideoUrl(result) {
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  if (result?.session_id) return `${API}/api/video/${result.session_id}`;
  const vp = result?.video_path;
  if (!vp) return null;
  const norm = String(vp).replace(/\\/g, '/');
  const idx  = norm.indexOf('exports/');
  if (idx !== -1) return `${API}/${norm.slice(idx)}`;
  return `${API}/exports/${norm.split('/').pop()}`;
}

const S = {
  app:    { display:'flex', flexDirection:'column', height:'100vh', background:'#08080e', color:'rgba(255,255,255,0.92)', fontFamily:"'DM Sans',system-ui,sans-serif", overflow:'hidden' },
  header: { height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'#0b0b16', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, zIndex:20 },
  hLeft:  { display:'flex', alignItems:'center', gap:10 },
  logo:   { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#fff', letterSpacing:'-0.3px' },
  logoPk: { color:'#FF2EAA' },
  badge:  { fontSize:9, background:'rgba(255,46,170,0.12)', color:'#FF2EAA', border:'1px solid rgba(255,46,170,0.2)', padding:'2px 7px', borderRadius:20, fontWeight:700 },
  online: { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#4ade80', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.15)', padding:'4px 10px', borderRadius:20 },
  onDot:  { width:6, height:6, borderRadius:'50%', background:'#4ade80' },
  offline:{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', padding:'4px 10px', borderRadius:20 },
  body:   { flex:1, display:'grid', gridTemplateColumns:'1fr 320px', overflow:'hidden' },
  left:   { display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid rgba(255,255,255,0.06)' },
  tabs:   { display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 },
  tab:    { flex:1, padding:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.35)', cursor:'pointer', borderBottom:'2px solid transparent', transition:'all 0.2s', borderRight:'1px solid rgba(255,255,255,0.04)' },
  tabOn:  { color:'#fff', borderBottomColor:'#FF2EAA', background:'rgba(255,46,170,0.04)' },
  scroll: { flex:1, overflowY:'auto', padding:'18px' },
  right:  { display:'flex', flexDirection:'column', overflow:'hidden', background:'#0a0a16' },
  rightTop: { padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 },
  rightScroll: { flex:1, overflowY:'auto', padding:'14px' },
  settingRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  settingName:{ fontSize:11, color:'rgba(255,255,255,0.35)' },
  settingVal: { fontSize:11, color:'#FF2EAA', fontWeight:500 },
  outroBox:   { marginTop:12, background:'#111120', borderRadius:9, padding:'10px 12px', border:'1px solid rgba(255,255,255,0.06)' },
  outroLbl:   { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)', marginBottom:5 },
  outroText:  { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', fontStyle:'italic' },
  outroSub:   { fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:2 },
  sep:        { border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', margin:'12px 0' },
  footer:     { padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:7 },
  // Buttons in footer
  addBtn:     { width:'100%', padding:'10px', background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.25)', borderRadius:9, color:'#FF2EAA', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.2s' },
  addBtnFull: { width:'100%', padding:'12px', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', borderRadius:9, color:'#fff', fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 },
  queueFull:  { width:'100%', padding:'9px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center' },
  // result card
  resultCard: { background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:10, padding:'12px' },
  resultTitle:{ fontSize:13, fontWeight:700, color:'#4ade80', marginBottom:8, display:'flex', alignItems:'center', gap:6 },
  resultBtns: { display:'flex', gap:6 },
  playBtn:    { flex:1, padding:'8px', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', borderRadius:7, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' },
  dlBtn:      { flex:1, padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer' },
  newBtn:     { padding:'8px 10px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, color:'rgba(255,255,255,0.3)', fontSize:11, cursor:'pointer' },
  // modal
  modalOverlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998, padding:20 },
  modalBox:   { background:'#0f0f1c', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, overflow:'hidden', width:'100%', maxWidth:700, boxShadow:'0 40px 80px rgba(0,0,0,0.8)' },
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  modalTitle: { fontSize:15, fontWeight:700, color:'#fff', fontFamily:"'Syne',sans-serif", display:'flex', alignItems:'center', gap:7 },
  modalClose: { width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'none', color:'rgba(255,255,255,0.5)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  modalBody:  { padding:'18px' },
  videoEl:    { width:'100%', borderRadius:10, background:'#000', display:'block' },
  modalBtns:  { display:'flex', gap:8, marginTop:14 },
  modalDlBtn: { flex:1, padding:'11px', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 },
  modalNewBtn:{ padding:'11px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer' },
};

export default function App() {
  const [tab, setTab]               = useState('sources');
  const [config, setConfig]         = useState(DEFAULT_CONFIG);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bgFile, setBgFile]         = useState(null);
  const [audioFile, setAudioFile]   = useState(null);
  const [online, setOnline]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState(null);
  const [result, setResult]         = useState(null);    // last completed single-gen result
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerResult, setPlayerResult] = useState(null); // what to play in modal
  // Queue state
  const [queueJobs, setQueueJobs]   = useState([]);
  const [canAdd, setCanAdd]         = useState(true);
  const [addingToQueue, setAddingToQueue] = useState(false);
  const queueWsRef = useRef(null);

  // ── Notification permission ───────────────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Health check ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const h = await healthCheck();
      setOnline(h?.status === 'healthy');
    };
    check();
    const t = setInterval(check, 8000);
    return () => clearInterval(t);
  }, []);

  // ── Queue WebSocket ───────────────────────────────────────────────────────
  useEffect(() => {
    const conn = connectQueueSocket({
      onUpdate:     (jobs) => {
        setQueueJobs(jobs);
        const active = jobs.filter(j => j.status === 'waiting' || j.status === 'rendering').length;
        setCanAdd(active < 5);
      },
      onJobComplete: (jobId, jobResult, jobs) => {
        setQueueJobs(jobs);
        const active = jobs.filter(j => j.status === 'waiting' || j.status === 'rendering').length;
        setCanAdd(active < 5);
        const job = jobs.find(j => j.id === jobId);
        const name = job?.display_name || 'Video';
        toast.success(`🎬 "${name}" is ready!`, { duration: 6000 });
        if (Notification.permission === 'granted') {
          new Notification('MashupStudio ✅', { body: `"${name}" finished rendering!` });
        }
      },
      onJobError: (jobId, jobs) => {
        setQueueJobs(jobs);
        toast.error('A video failed to render. Check queue for details.');
      },
      onDisconnect: () => {
        // Silently reconnect after 3s
        setTimeout(() => {
          if (queueWsRef.current) {
            const newConn = connectQueueSocket({});
            queueWsRef.current = newConn;
          }
        }, 3000);
      },
    });
    queueWsRef.current = conn;
    return () => conn?.close();
  }, []);

  // ── Upload helpers ────────────────────────────────────────────────────────
  const uploadFiles = async () => {
    if (avatarFile) await uploadAvatar(avatarFile).catch(() => {});
    if (bgFile)     await uploadBackground(bgFile).catch(() => {});
    if (audioFile)  await uploadAudio(audioFile).catch(() => {});
  };

  // ── Add to Queue ──────────────────────────────────────────────────────────
  const handleAddToQueue = async () => {
    if (!config.youtube_url && !audioFile) {
      toast.error('Please add a YouTube URL or upload audio first.');
      return;
    }
    if (!canAdd) {
      toast.error('Queue is full (5/5). Wait for a video to finish.');
      return;
    }
    setAddingToQueue(true);
    try {
      // Upload current files first — queue_manager will snapshot them
      await uploadFiles();

      // Build a display name from the audio/text
      const name = config.text?.text
        ? config.text.text.slice(0, 28) + (config.text.text.length > 28 ? '…' : '')
        : 'Video';

      const res = await addToQueue(config, name);
      if (res.success) {
        toast.success(`✅ Added to queue! Position: ${res.queue_position}`);
        // Reset config for the next job
        setConfig({ ...DEFAULT_CONFIG });
        setAvatarFile(null);
        setBgFile(null);
        setAudioFile(null);
      } else {
        toast.error(res.message || 'Failed to add to queue');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add to queue');
    } finally {
      setAddingToQueue(false);
    }
  };

  // ── Single immediate generate (legacy — kept for direct Generate button) ─
  const handleGenerate = async () => {
    if (!config.youtube_url && !audioFile) {
      toast.error('Please add a YouTube URL or upload audio.');
      return;
    }
    setGenerating(true);
    setResult(null);
    setProgress({ stage:'init', progress:2, message:'Uploading files…' });

    try {
      await uploadFiles();
    } catch {
      setGenerating(false); setProgress(null);
      toast.error('Upload failed.'); return;
    }

    setProgress({ stage:'init', progress:8, message:'Connecting…' });
    createGenerationSocket(config, {
      onStart:    () => setProgress({ stage:'init', progress:10, message:'Connected!' }),
      onProgress: d  => setProgress(d),
      onComplete: d  => {
        setGenerating(false); setProgress(null);
        setResult(d);
        setPlayerResult(d);
        setShowPlayer(true);
        toast.success('🎬 Video ready!', { duration:5000 });
        if (Notification.permission === 'granted') {
          new Notification('MashupStudio ✅', { body:'Your mashup is ready!' });
        }
      },
      onError: msg => {
        setGenerating(false); setProgress(null);
        toast.error(msg || 'Generation failed.');
      },
    });
  };

  // ── Export helper ─────────────────────────────────────────────────────────
  const handleExport = async (res) => {
    const videoUrl = buildVideoUrl(res);
    if (!videoUrl) return;
    try {
      if (window.showSaveFilePicker) {
        const fh = await window.showSaveFilePicker({
          suggestedName: 'tiktok_mashup.mp4',
          types: [{ description:'MP4 Video', accept:{ 'video/mp4':['.mp4'] } }],
        });
        const blob = await (await fetch(videoUrl)).blob();
        const w = await fh.createWritable();
        await w.write(blob); await w.close();
        toast.success('✅ Saved!');
      } else {
        const a = document.createElement('a');
        a.href = videoUrl; a.download = 'tiktok_mashup.mp4'; a.click();
      }
    } catch(e) {
      if (e.name !== 'AbortError') toast.error('Export failed: ' + e.message);
    }
  };

  // ── Settings panel items ──────────────────────────────────────────────────
  const settings = [
    ['Preset',   config.preset || 'mashup-style'],
    ['Font',     config.text?.font || 'Anton'],
    ['Color',    config.text?.color || '#FFFFFF'],
    ['Speed',    `${config.audio?.speed || 1.18}x`],
    ['Snow',     config.effects?.snowfall ? `${config.effects?.snowfall_speed || 40}%` : 'Off'],
    ['Quality',  config.export?.quality || 'high'],
  ];

  const activeQueueCount = queueJobs.filter(j => j.status === 'waiting' || j.status === 'rendering').length;

  return (
    <div style={S.app}>
      <Toaster position="top-right" toastOptions={{ style:{ background:'#1c1c2e', color:'#fff', border:'1px solid rgba(255,255,255,0.08)', fontSize:13 } }} />

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.hLeft}>
          <span style={S.logo}>Mashup<span style={S.logoPk}>Studio</span></span>
          <span style={S.badge}>v2.0</span>
        </div>
        <div style={online ? S.online : S.offline}>
          <div style={{ ...S.onDot, background: online ? '#4ade80' : 'rgba(255,255,255,0.2)' }} />
          {online ? 'Backend Online' : 'Backend Offline'}
        </div>
      </header>

      <div style={S.body}>
        {/* LEFT PANEL */}
        <div style={S.left}>
          <div style={S.tabs}>
            {TABS.map((t, i) => (
              <div key={t.id}
                style={{ ...S.tab, ...(tab === t.id ? S.tabOn : {}), borderRight: i < TABS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                onClick={() => setTab(t.id)}>
                <span>{t.icon}</span>{t.label}
              </div>
            ))}
          </div>
          <div style={S.scroll}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}}>
                {tab==='sources' && <SourcesTab  config={config} setConfig={setConfig} avatarFile={avatarFile} setAvatarFile={setAvatarFile} bgFile={bgFile} setBgFile={setBgFile} audioFile={audioFile} setAudioFile={setAudioFile} />}
                {tab==='style'   && <StyleTab    config={config} setConfig={setConfig} avatarFile={avatarFile} />}
                {tab==='effects' && <EffectsTab  config={config} setConfig={setConfig} />}
                {tab==='audio'   && <AudioTab    config={config} setConfig={setConfig} audioFile={audioFile} setAudioFile={setAudioFile} avatarFile={avatarFile} setAvatarFile={setAvatarFile} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={S.right}>
          <div style={S.rightTop}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Preview</div>
            <PreviewCard config={config} avatarFile={avatarFile} />
          </div>

          <div style={S.rightScroll}>
            {/* Settings */}
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.2)', marginBottom:8 }}>Settings</div>
            {settings.map(([k, v]) => (
              <div key={k} style={S.settingRow}>
                <span style={S.settingName}>{k}</span>
                <span style={S.settingVal}>{v}</span>
              </div>
            ))}

            <div style={S.outroBox}>
              <div style={S.outroLbl}>Outro (5s)</div>
              <div style={S.outroText}>Sígueme para ver más</div>
              <div style={S.outroSub}>Gradient bg · White text · Centered</div>
            </div>

            <div style={S.sep} />

            {/* QUEUE PANEL */}
            <QueuePanel
              jobs={queueJobs}
              onRemove={async (jobId) => {
                await removeFromQueue(jobId).catch(() => {});
              }}
              onPlay={(jobResult) => {
                setPlayerResult(jobResult);
                setShowPlayer(true);
              }}
            />

            {/* Single-gen result (if using direct Generate) */}
            {result && !queueJobs.some(j => j.result === result) && (() => {
              const videoUrl = buildVideoUrl(result);
              return (
                <div style={{ ...S.resultCard, marginTop: 12 }}>
                  <div style={S.resultTitle}><span>✅</span> Ready!</div>
                  <div style={S.resultBtns}>
                    <button style={S.playBtn} onClick={() => { setPlayerResult(result); setShowPlayer(true); }}>▶ Play</button>
                    <button style={S.dlBtn}   onClick={() => handleExport(result)}>⬇ Export</button>
                    <button style={S.newBtn}  onClick={() => setResult(null)}>New</button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* FOOTER BUTTONS */}
          <div style={S.footer}>
            {/* Add to Queue */}
            {canAdd ? (
              <button style={{ ...S.addBtn, opacity: addingToQueue ? 0.6 : 1 }}
                onClick={handleAddToQueue} disabled={addingToQueue}>
                {addingToQueue
                  ? '⏳ Adding…'
                  : `+ Add to Queue ${activeQueueCount > 0 ? `(${activeQueueCount}/5)` : ''}`}
              </button>
            ) : (
              <div style={S.queueFull}>Queue full (5/5) — wait for a video to finish</div>
            )}

            {/* Generate Now */}
            <button
              style={{ ...S.addBtnFull, opacity: generating ? 0.6 : 1 }}
              onClick={handleGenerate}
              disabled={generating}>
              {generating ? '⏳ Generating…' : '✦ Generate Now'}
            </button>
          </div>
        </div>
      </div>

      {/* VIDEO PLAYER MODAL */}
      {showPlayer && playerResult && (() => {
        const videoUrl = buildVideoUrl(playerResult);
        return (
          <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowPlayer(false); }}>
            <div style={S.modalBox}>
              <div style={S.modalHeader}>
                <span style={S.modalTitle}>🎬 Your Mashup is Ready!</span>
                <button style={S.modalClose} onClick={() => setShowPlayer(false)}>✕</button>
              </div>
              <div style={S.modalBody}>
                {videoUrl
                  ? <video style={S.videoEl} src={videoUrl} controls autoPlay />
                  : <div style={{ textAlign:'center', padding:'40px 20px' }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Video URL could not be resolved.</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'monospace', marginTop:6 }}>
                        {playerResult?.video_path}
                      </div>
                    </div>
                }
                <div style={S.modalBtns}>
                  <button style={S.modalDlBtn} onClick={() => handleExport(playerResult)}>
                    ⬇ Export / Save As…
                  </button>
                  <button style={S.modalNewBtn} onClick={() => { setShowPlayer(false); setResult(null); }}>
                    ✦ Create New
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PROGRESS OVERLAY (single generate) */}
      {generating && progress && (
        <ProgressOverlay
          stage={progress.stage}
          progressPct={progress.progress}
          message={progress.message}
          stageLabels={STAGE_LABELS}
        />
      )}
    </div>
  );
}