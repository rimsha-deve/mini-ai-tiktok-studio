import React from 'react';

function buildVideoUrl(result) {
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  if (result?.session_id) return `${API}/api/video/${result.session_id}`;
  const vp = result?.video_path;
  if (!vp) return null;
  const norm = String(vp).replace(/\\/g, '/');
  const idx = norm.indexOf('exports/');
  if (idx !== -1) return `${API}/${norm.slice(idx)}`;
  return `${API}/exports/${norm.split('/').pop()}`;
}

const STATUS_COLORS = {
  waiting:   { bg:'rgba(255,255,255,0.06)',  border:'rgba(255,255,255,0.1)',  text:'rgba(255,255,255,0.4)', label:'Waiting'   },
  rendering: { bg:'rgba(255,46,170,0.08)',   border:'rgba(255,46,170,0.3)',   text:'#FF2EAA',               label:'Rendering' },
  done:      { bg:'rgba(74,222,128,0.07)',   border:'rgba(74,222,128,0.25)',  text:'#4ade80',               label:'Done ✅'   },
  error:     { bg:'rgba(239,68,68,0.07)',    border:'rgba(239,68,68,0.25)',   text:'#f87171',               label:'Error'     },
  cancelled: { bg:'rgba(255,255,255,0.03)',  border:'rgba(255,255,255,0.06)', text:'rgba(255,255,255,0.2)', label:'Cancelled' },
};

const S = {
  wrap:      { display:'flex', flexDirection:'column', gap:0 },
  header:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  title:     { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.3)' },
  countBadge:{ fontSize:10, fontWeight:700, color:'#FF2EAA', background:'rgba(255,46,170,0.1)', border:'1px solid rgba(255,46,170,0.2)', padding:'1px 7px', borderRadius:20 },
  slots:     { display:'flex', flexDirection:'column', gap:6 },
  // Job card
  job:       { borderRadius:9, padding:'10px 12px', border:'1px solid', transition:'all 0.2s' },
  jobTop:    { display:'flex', alignItems:'center', gap:8, marginBottom:5 },
  jobNum:    { width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.08)', flexShrink:0 },
  jobNumActive:{ background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', color:'#fff' },
  jobName:   { fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.75)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  statusBadge:{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10 },
  removeBtn: { fontSize:11, color:'rgba(255,255,255,0.2)', background:'none', border:'none', cursor:'pointer', padding:'1px 5px', lineHeight:1 },
  // Progress
  track:     { height:3, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden', marginBottom:4 },
  fill:      { height:'100%', background:'linear-gradient(90deg,#FF2EAA,#8B2FC9)', borderRadius:3, transition:'width 0.4s ease' },
  msgRow:    { display:'flex', justifyContent:'space-between', alignItems:'center' },
  msg:       { fontSize:10, color:'rgba(255,255,255,0.28)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 },
  pct:       { fontSize:10, fontWeight:700, color:'#FF2EAA', flexShrink:0 },
  // Action buttons
  actBtns:   { display:'flex', gap:5, marginTop:7 },
  playBtn:   { flex:1, padding:'5px 0', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 },
  dlBtn:     { flex:1, padding:'5px 0', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, textDecoration:'none' },
  errTxt:    { fontSize:10, color:'#f87171', marginTop:4, lineHeight:1.4 },
  // Empty state
  empty:     { textAlign:'center', padding:'20px 10px', color:'rgba(255,255,255,0.18)', fontSize:12 },
  emptyIco:  { fontSize:28, marginBottom:6, display:'block', opacity:0.35 },
};

function JobCard({ job, index, onRemove, onPlay }) {
  const sc = STATUS_COLORS[job.status] || STATUS_COLORS.waiting;
  const isActive = job.status === 'rendering';
  const isDone   = job.status === 'done';
  const isWaiting = job.status === 'waiting';
  const videoUrl = isDone ? buildVideoUrl(job.result) : null;

  const handleExport = async () => {
    if (!videoUrl) return;
    try {
      if (window.showSaveFilePicker) {
        const fh = await window.showSaveFilePicker({
          suggestedName: `${job.display_name || 'mashup'}.mp4`,
          types: [{ description:'MP4 Video', accept:{ 'video/mp4':['.mp4'] } }],
        });
        const resp = await fetch(videoUrl);
        const blob = await resp.blob();
        const w = await fh.createWritable();
        await w.write(blob); await w.close();
      } else {
        const a = document.createElement('a');
        a.href = videoUrl; a.download = `${job.display_name || 'mashup'}.mp4`; a.click();
      }
    } catch(e) { if (e.name !== 'AbortError') alert('Export failed: ' + e.message); }
  };

  return (
    <div style={{ ...S.job, background: sc.bg, borderColor: sc.border }}>
      <div style={S.jobTop}>
        <div style={{ ...S.jobNum, ...(isActive ? S.jobNumActive : {}) }}>{index + 1}</div>
        <span style={S.jobName} title={job.display_name}>{job.display_name}</span>
        <span style={{ ...S.statusBadge, color: sc.text, background: sc.bg }}>{sc.label}</span>
        {isWaiting && (
          <button style={S.removeBtn} onClick={() => onRemove(job.id)} title="Remove from queue">✕</button>
        )}
      </div>

      {(isActive || isWaiting) && (
        <>
          <div style={S.track}>
            <div style={{ ...S.fill, width: `${job.progress}%` }} />
          </div>
          <div style={S.msgRow}>
            <span style={S.msg}>{job.message}</span>
            {isActive && <span style={S.pct}>{job.progress}%</span>}
          </div>
        </>
      )}

      {isDone && videoUrl && (
        <div style={S.actBtns}>
          <button style={S.playBtn} onClick={() => onPlay(job.result)}>▶ Play</button>
          <button style={S.dlBtn} onClick={handleExport}>⬇ Export</button>
        </div>
      )}

      {job.status === 'error' && (
        <div style={S.errTxt}>{job.error || 'Render failed — check backend logs'}</div>
      )}
    </div>
  );
}

export default function QueuePanel({ jobs, onRemove, onPlay }) {
  const activeJobs = jobs.filter(j => j.status !== 'cancelled');
  const activeCount = jobs.filter(j => j.status === 'rendering' || j.status === 'waiting').length;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>📋 Video Queue</span>
        {activeCount > 0 && (
          <span style={S.countBadge}>{activeCount}/5</span>
        )}
      </div>

      <div style={S.slots}>
        {activeJobs.length === 0 ? (
          <div style={S.empty}>
            <span style={S.emptyIco}>🎬</span>
            Add jobs to the queue
          </div>
        ) : (
          activeJobs.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              index={i}
              onRemove={onRemove}
              onPlay={onPlay}
            />
          ))
        )}
      </div>
    </div>
  );
}
