import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';

// Stage labels for user-friendly display
const STAGE_LABELS = {
  init: 'Initializing',
  youtube: 'Extracting Audio',
  audio: 'Processing Audio',
  background: 'Generating Background',
  avatar: 'Processing Avatar',
  text: 'Rendering Text',
  effects: 'Generating Effects',
  sticker: 'Adding Sticker',
  render: 'Rendering Video',
  thumbnail: 'Creating Thumbnail',
  complete: 'Complete!',
  error: 'Error',
};

// Stage icons
const STAGE_ICONS = {
  init: '⚙️',
  youtube: '📥',
  audio: '🎵',
  background: '🎨',
  avatar: '👤',
  text: '✍️',
  effects: '✨',
  sticker: '🎯',
  render: '🎬',
  thumbnail: '🖼️',
  complete: '✅',
  error: '❌',
};

function ProgressOverlay({ progress, onCancel }) {
  const currentProgress = progress?.progress || 0;
  const stage = progress?.stage || 'init';
  const message = progress?.message || 'Please wait...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-8 max-w-lg w-full mx-4 relative"
      >
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Animated icon */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-5xl mb-3"
          >
            {STAGE_ICONS[stage] || '⚙️'}
          </motion.div>
          <h3 className="text-xl font-semibold">
            {STAGE_LABELS[stage] || 'Processing'}
          </h3>
          <p className="text-sm text-white/50 mt-1">{message}</p>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${currentProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Progress percentage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/40">
            {Math.round(currentProgress)}%
          </span>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Loader2 size={12} className="animate-spin" />
            Please wait...
          </div>
        </div>

        {/* Stage indicators */}
        <div className="mt-6 flex justify-center gap-1.5">
          {Object.keys(STAGE_LABELS).slice(0, -2).map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                Object.keys(STAGE_LABELS).indexOf(stage) >= i
                  ? 'bg-primary'
                  : 'bg-dark-600'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ProgressOverlay;
