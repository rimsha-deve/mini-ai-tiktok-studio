import React from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createGenerationSocket } from '../utils/api';

function GenerateSection({ config, isGenerating, setIsGenerating, setProgress, setResult }) {
  const handleGenerate = () => {
    // Validate inputs
    if (!config.youtube_url && !config.avatar_path) {
      toast.error('Please provide a YouTube URL or upload an avatar to get started.');
      return;
    }

    if (!config.youtube_url) {
      toast.error('Please paste a YouTube URL for audio extraction.');
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: 'init', progress: 0, message: 'Starting...' });

    // Connect via WebSocket for real-time progress
    const ws = createGenerationSocket(config, {
      onStart: () => {
        setProgress({ stage: 'init', progress: 5, message: 'Connected to backend...' });
      },
      onProgress: (data) => {
        setProgress(data);
      },
      onComplete: (data) => {
        setIsGenerating(false);
        setProgress(null);
        setResult(data);
        toast.success('Video generated successfully! 🎬');
      },
      onError: (message) => {
        setIsGenerating(false);
        setProgress(null);
        toast.error(message || 'Generation failed. Check backend logs.');
      },
      onClose: () => {
        // Only set generating to false if not already handled
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to Generate</h2>
          <p className="text-sm text-white/40 mt-0.5">
            {config.youtube_url
              ? 'All set! Click generate to create your mashup.'
              : 'Paste a YouTube URL to get started.'}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`btn-primary flex items-center gap-2 text-lg px-8 py-4 ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-glow'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play size={20} fill="white" />
              Generate Video
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default GenerateSection;
