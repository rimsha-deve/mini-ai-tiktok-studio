import React from 'react';

export default function ProgressOverlay({ stage, progressPct, message, stageLabels = {} }) {
  const pct = Math.min(100, Math.max(0, progressPct || 0));
  const label = stageLabels[stage] || stage || 'Processing';

  const S = {
    overlay: { position:'fixed', inset:0, background:'rgba(8,8,14,0.92)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
    card:    { background:'#0f0f1c', border:'1px solid rgba(255,46,170,0.2)', borderRadius:20, padding:'40px 40px 36px', width:380, textAlign:'center' },
    logo:    { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:'#fff', marginBottom:6 },
    logoPk:  { color:'#FF2EAA' },
    stage:   { fontSize:18, fontWeight:700, fontFamily:"'Syne',sans-serif", color:'#fff', marginBottom:6, marginTop:20 },
    msg:     { fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24, lineHeight:1.5 },
    track:   { height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, overflow:'hidden', marginBottom:10 },
    fill:    { height:'100%', background:'linear-gradient(90deg,#FF2EAA,#8B2FC9)', borderRadius:4, transition:'width 0.4s ease' },
    pct:     { fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:600 },
    spinner: { width:40, height:40, border:'3px solid rgba(255,255,255,0.08)', borderTopColor:'#FF2EAA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 0' },
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.spinner} />
        <div style={S.stage}>{label}</div>
        <div style={S.msg}>{message || 'Please wait…'}</div>
        <div style={S.track}><div style={{ ...S.fill, width:`${pct}%` }} /></div>
        <div style={S.pct}>{Math.round(pct)}%</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}