import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Type, Palette, Wand2, Music2, Monitor, Layers,
  ChevronDown, ChevronRight
} from 'lucide-react';

function SettingsPanel({ config, updateConfig }) {
  const [expandedSection, setExpandedSection] = useState('text');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-80 border-l border-white/5 bg-dark-800/40 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Settings size={14} />
          Settings
        </h2>

        {/* Text Settings */}
        <SettingsSection
          title="Text"
          icon={<Type size={14} />}
          isExpanded={expandedSection === 'text'}
          onToggle={() => toggleSection('text')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Overlay Text</label>
              <input
                type="text"
                value={config.text.text}
                onChange={(e) => updateConfig('text', { text: e.target.value })}
                className="input-field w-full text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Font</label>
                <select
                  value={config.text.font}
                  onChange={(e) => updateConfig('text', { font: e.target.value })}
                  className="input-field w-full text-sm"
                >
                  <option value="Anton">Anton</option>
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Impact">Impact</option>
                  <option value="Arial Black">Arial Black</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Size</label>
                <input
                  type="number"
                  value={config.text.font_size}
                  onChange={(e) => updateConfig('text', { font_size: parseInt(e.target.value) })}
                  className="input-field w-full text-sm"
                  min={24}
                  max={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Color</label>
                <input
                  type="color"
                  value={config.text.color || '#ffffff'}
                  onChange={(e) => updateConfig('text', { color: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer bg-dark-700 border border-white/10"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Position</label>
                <select
                  value={config.text.position}
                  onChange={(e) => updateConfig('text', { position: e.target.value })}
                  className="input-field w-full text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Toggle label="Glow" value={config.text.glow} onChange={(v) => updateConfig('text', { glow: v })} />
              <Toggle label="Shadow" value={config.text.shadow} onChange={(v) => updateConfig('text', { shadow: v })} />
              <Toggle label="Stroke" value={config.text.stroke} onChange={(v) => updateConfig('text', { stroke: v })} />
            </div>
          </div>
        </SettingsSection>

        {/* Background Settings */}
        <SettingsSection
          title="Background"
          icon={<Palette size={14} />}
          isExpanded={expandedSection === 'background'}
          onToggle={() => toggleSection('background')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Mode</label>
              <select
                value={config.background.mode}
                onChange={(e) => updateConfig('background', { mode: e.target.value })}
                className="input-field w-full text-sm"
              >
                <option value="auto">Auto Aesthetic</option>
                <option value="gradient">Gradient</option>
                <option value="solid">Solid Color</option>
                <option value="upload">Uploaded Image</option>
              </select>
            </div>
            {(config.background.mode === 'gradient' || config.background.mode === 'solid') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Color 1</label>
                  <input
                    type="color"
                    value={config.background.color1}
                    onChange={(e) => updateConfig('background', { color1: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer bg-dark-700 border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Color 2</label>
                  <input
                    type="color"
                    value={config.background.color2}
                    onChange={(e) => updateConfig('background', { color2: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer bg-dark-700 border border-white/10"
                  />
                </div>
              </div>
            )}
            {config.background.mode === 'gradient' && (
              <div>
                <label className="text-xs text-white/40 mb-1 block">Direction</label>
                <select
                  value={config.background.gradient_direction}
                  onChange={(e) => updateConfig('background', { gradient_direction: e.target.value })}
                  className="input-field w-full text-sm"
                >
                  <option value="diagonal">Diagonal</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Effects Settings */}
        <SettingsSection
          title="Effects"
          icon={<Wand2 size={14} />}
          isExpanded={expandedSection === 'effects'}
          onToggle={() => toggleSection('effects')}
        >
          <div className="space-y-2">
            <Toggle label="Snowfall" value={config.effects.snowfall} onChange={(v) => updateConfig('effects', { snowfall: v })} />
            {config.effects.snowfall && (
              <div className="pl-4">
                <label className="text-xs text-white/40 mb-1 block">Speed ({config.effects.snowfall_speed})</label>
                <input
                  type="range"
                  min={33}
                  max={50}
                  value={config.effects.snowfall_speed}
                  onChange={(e) => updateConfig('effects', { snowfall_speed: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            )}
            <Toggle label="Fuzzy Stars" value={config.effects.fuzzy_stars} onChange={(v) => updateConfig('effects', { fuzzy_stars: v })} />
            <Toggle label="Glow Particles" value={config.effects.glow_particles} onChange={(v) => updateConfig('effects', { glow_particles: v })} />
            <Toggle label="Soft Blur Glow" value={config.effects.soft_blur_glow} onChange={(v) => updateConfig('effects', { soft_blur_glow: v })} />
            <Toggle label="4K Enhancement" value={config.effects.enhancement_4k} onChange={(v) => updateConfig('effects', { enhancement_4k: v })} />
            <div className="border-t border-white/5 pt-2 mt-2">
              <p className="text-xs text-white/30 mb-2">Advanced</p>
              <Toggle label="VHS Effect" value={config.effects.vhs_effect} onChange={(v) => updateConfig('effects', { vhs_effect: v })} />
              <Toggle label="Chromatic Glow" value={config.effects.chromatic_glow} onChange={(v) => updateConfig('effects', { chromatic_glow: v })} />
              <Toggle label="Film Grain" value={config.effects.grain} onChange={(v) => updateConfig('effects', { grain: v })} />
            </div>
          </div>
        </SettingsSection>

        {/* Audio Settings */}
        <SettingsSection
          title="Audio"
          icon={<Music2 size={14} />}
          isExpanded={expandedSection === 'audio'}
          onToggle={() => toggleSection('audio')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Speed ({config.audio.speed}x)</label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.01}
                value={config.audio.speed}
                onChange={(e) => updateConfig('audio', { speed: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">
                BG Music Volume ({config.audio.background_music_volume}dB)
              </label>
              <input
                type="range"
                min={-40}
                max={0}
                step={0.1}
                value={config.audio.background_music_volume}
                onChange={(e) => updateConfig('audio', { background_music_volume: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </SettingsSection>

        {/* Export Settings */}
        <SettingsSection
          title="Export"
          icon={<Monitor size={14} />}
          isExpanded={expandedSection === 'export'}
          onToggle={() => toggleSection('export')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Resolution</label>
              <select
                value={config.export.resolution}
                onChange={(e) => updateConfig('export', { resolution: e.target.value })}
                className="input-field w-full text-sm"
              >
                <option value="1080p">1080p (Full HD)</option>
                <option value="4k">4K (Ultra HD)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Quality</label>
              <select
                value={config.export.quality}
                onChange={(e) => updateConfig('export', { quality: e.target.value })}
                className="input-field w-full text-sm"
              >
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Recommended)</option>
                <option value="ultra">Ultra (Slow)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">FPS</label>
              <select
                value={config.export.fps}
                onChange={(e) => updateConfig('export', { fps: parseInt(e.target.value) })}
                className="input-field w-full text-sm"
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
            <Toggle
              label="Generate Thumbnail"
              value={config.export.generate_thumbnail}
              onChange={(v) => updateConfig('export', { generate_thumbnail: v })}
            />
          </div>
        </SettingsSection>

        {/* Sticker Settings */}
        <SettingsSection
          title="Sticker"
          icon={<Layers size={14} />}
          isExpanded={expandedSection === 'sticker'}
          onToggle={() => toggleSection('sticker')}
        >
          <div className="space-y-3">
            <Toggle
              label="TikTok Sticker"
              value={config.sticker.enabled}
              onChange={(v) => updateConfig('sticker', { enabled: v })}
            />
            {config.sticker.enabled && (
              <>
                <Toggle
                  label="Float Animation"
                  value={config.sticker.floating_animation}
                  onChange={(v) => updateConfig('sticker', { floating_animation: v })}
                />
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Position</label>
                  <select
                    value={config.sticker.position}
                    onChange={(e) => updateConfig('sticker', { position: e.target.value })}
                    className="input-field w-full text-sm"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

// Collapsible section component
function SettingsSection({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
          {icon}
          {title}
        </div>
        {isExpanded ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-2.5 pb-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// Toggle switch component
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-white/60">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          value ? 'bg-primary' : 'bg-dark-600'
        }`}
      >
        <motion.div
          animate={{ x: value ? 16 : 2 }}
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

export default SettingsPanel;
