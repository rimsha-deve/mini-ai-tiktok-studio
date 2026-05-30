import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const submit = e => { e.preventDefault(); setLoading(true); setTimeout(()=>{ setLoading(false); nav('/studio'); },1000); };

  const S={
    page:{minHeight:'100vh',background:'#08080e',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",padding:'2rem',position:'relative'},
    orb1:{position:'absolute',width:500,height:500,background:'rgba(255,46,170,0.1)',borderRadius:'50%',filter:'blur(90px)',top:-150,left:-150,pointerEvents:'none'},
    orb2:{position:'absolute',width:400,height:400,background:'rgba(139,47,201,0.1)',borderRadius:'50%',filter:'blur(90px)',bottom:-100,right:-100,pointerEvents:'none'},
    card:{background:'#0f0f1c',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:'36px 32px',width:'100%',maxWidth:400,position:'relative',zIndex:1},
    logo:{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,textAlign:'center',marginBottom:6,color:'#fff'},
    title:{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:22,textAlign:'center',marginBottom:5,color:'#fff'},
    sub:{color:'rgba(255,255,255,0.35)',fontSize:13,textAlign:'center',marginBottom:28},
    label:{display:'block',fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:5,fontWeight:500},
    input:{width:'100%',background:'#111120',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:'11px 14px',color:'#fff',fontSize:13,outline:'none',marginBottom:14,boxSizing:'border-box'},
    btn:{width:'100%',padding:'12px',background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)',border:'none',borderRadius:9,color:'#fff',fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,cursor:'pointer',marginTop:4},
    perks:{display:'flex',flexDirection:'column',gap:7,marginBottom:24},
    perk:{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,0.4)'},
    perkIco:{fontSize:13},
    footer:{textAlign:'center',marginTop:20,fontSize:12,color:'rgba(255,255,255,0.3)'},
    link:{color:'#FF2EAA',cursor:'pointer',fontWeight:500},
  };

  return (
    <div style={S.page}>
      <div style={S.orb1}/><div style={S.orb2}/>
      <div style={S.card}>
        <div style={S.logo}>Mashup<span style={{color:'#FF2EAA'}}>Studio</span></div>
        <div style={S.title}>Start for free</div>
        <div style={S.sub}>No credit card required</div>
        <div style={S.perks}>
          {[['🎬','First 3 videos — no watermark'],['⚡','Generate in under 60 seconds'],['🎨','8 style presets included']].map(([ic,txt])=>(
            <div key={txt} style={S.perk}><span style={S.perkIco}>{ic}</span>{txt}</div>
          ))}
        </div>
        <form onSubmit={submit}>
          <label style={S.label}>Full name</label>
          <input style={S.input} type="text" placeholder="Your name" value={form.name} onChange={set('name')} required/>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required/>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="Create a password" value={form.password} onChange={set('password')} required/>
          <button style={S.btn} type="submit" disabled={loading}>{loading?'Creating account…':'Create Free Account'}</button>
        </form>
        <div style={S.footer}>Already have an account? <span style={S.link} onClick={()=>nav('/signin')}>Sign in</span></div>
      </div>
    </div>
  );
}