import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getPresets } from '../utils/api';

// Preset visual configs (icons/colors for display)
const PRESET_VISUALS = {
  'tiktok-neon': {
    icon: '⚡',
    gradient: 'from-pink-500 to-purple-600',
    label: 'Neon',
  },
  'snow-aesthetic': {
    icon: '❄️',
    gradient: 'from-blue-900 to-indigo-900',
    label: 'Snow',
  },
  'dark-mood': {
    icon: '🌑',
    gradient: 'from-gray-900 to-purple-950',
    label: 'Dark',
  },
  'anime-glow': {
    icon: '✨',
    gradient: 'from-pink-500 to-cyan-400',
    label: 'Anime',
  },
  'mashup-style': {
    icon: '🎵',
    gradient: 'from-red-500 to-orange-500',
    label: 'Mashup',
  },
  'glow': {
    icon: '💫',
    gradient: 'from-purple-600 to-teal-400',
    label: 'Glow',
  },
};

function PresetSection({ selectedPreset, onSelectPreset }) {
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const result = await getPresets();
        if (result.success) {
          setPresets(result.presets);
        }
      } catch {
        // Use default preset list if backend unavailable
        setPresets(Object.keys(PRESET_VISUALS).map(id => ({
          id,
          name: PRESET_VISUALS[id].label,
        })));
      }
    };
    loadPresets();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        Style Presets
      </h2>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(PRESET_VISUALS).map(([id, visual]) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectPreset(selectedPreset === id ? null : id)}
            className={`relative rounded-xl p-3 text-center transition-all duration-300 overflow-hidden
              ${selectedPreset === id
                ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(255,0,110,0.3)]'
                : 'hover:ring-1 hover:ring-white/20'
              }`}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-40`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-2xl mb-1">{visual.icon}</div>
              <p className="text-xs font-medium text-white/80">{visual.label}</p>
            </div>

            {/* Selected indicator */}
            {selectedPreset === id && (
              <motion.div
                layoutId="preset-indicator"
                className="absolute inset-0 border-2 border-primary rounded-xl"
              />
            )}
          </motion.button>
        ))}
      </div>

      {selectedPreset && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/40 mt-3 text-center"
        >
          Preset "{PRESET_VISUALS[selectedPreset]?.label}" selected. Settings will be auto-configured.
        </motion.p>
      )}
    </motion.div>
  );
}

export default PresetSection;
