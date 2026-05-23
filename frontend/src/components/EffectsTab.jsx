import React from 'react';

const glass = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

function Toggle({ label, value, onChange, desc }) {
  return (
    <div className="flex items-center justify-between py-2.5"
         style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
        style={{ background: value ? 'linear-gradient(135deg,#ff2eaa,#8b2fc9)' : 'rgba(255,255,255,0.1)' }}>
        <motion_div value={value} />
      </button>
    </div>
  );
}

function motion_div({ value }) {
  return (
    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
         style={{ left: value ? '22px' : '2px' }} />
  );
}

export default function EffectsTab({ config, setConfig }) {
  const upd = (k, v) => setConfig(p => ({ ...p, effects: { ...p.effects, [k]: v } }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={glass}>
        <Toggle label="Snowfall" desc="Animated snowflakes overlay"
          value={config.effects.snowfall} onChange={v => upd('snowfall', v)} />
        {config.effects.snowfall && (
          <div className="py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Snow Speed</span>
              <span className="font-mono text-white">{config.effects.snowfall_speed}%</span>
            </div>
            <input type="range" min={10} max={100} value={config.effects.snowfall_speed}
              onChange={e => upd('snowfall_speed', +e.target.value)}
              className="w-full" style={{ accentColor: '#ff2eaa' }} />
          </div>
        )}
        <Toggle label="4K Enhancement" desc="Sharpen & clarity boost"
          value={config.effects.enhancement_4k} onChange={v => upd('enhancement_4k', v)} />
        <Toggle label="Glow Particles" desc="Floating light particles"
          value={config.effects.glow_particles || false} onChange={v => upd('glow_particles', v)} />
        <Toggle label="Soft Blur Glow" desc="Background bloom effect"
          value={config.effects.soft_blur_glow || false} onChange={v => upd('soft_blur_glow', v)} />
        <Toggle label="VHS Effect" desc="Retro scanline overlay"
          value={config.effects.vhs_effect || false} onChange={v => upd('vhs_effect', v)} />
        <Toggle label="Chromatic Glow" desc="Color aberration effect"
          value={config.effects.chromatic_glow || false} onChange={v => upd('chromatic_glow', v)} />
        <div style={{ borderBottom: 'none' }}>
          <Toggle label="Film Grain" desc="Cinematic grain texture"
            value={config.effects.grain || false} onChange={v => upd('grain', v)} />
        </div>
      </div>
    </div>
  );
}
