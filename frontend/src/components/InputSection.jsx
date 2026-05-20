import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Link, User, Image, Music, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAvatar, uploadBackground, uploadAudio } from '../utils/api';

function InputSection({ config, setConfig, updateConfig }) {
  // Avatar dropzone
  const onDropAvatar = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      try {
        const result = await uploadAvatar(acceptedFiles[0]);
        if (result.success) {
          setConfig(prev => ({ ...prev, avatar_path: result.path }));
          toast.success('Avatar uploaded!');
        }
      } catch (err) {
        toast.error('Failed to upload avatar');
      }
    }
  }, [setConfig]);

  // Background dropzone
  const onDropBackground = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      try {
        const result = await uploadBackground(acceptedFiles[0]);
        if (result.success) {
          updateConfig('background', { mode: 'upload', uploaded_path: result.path });
          toast.success('Background uploaded!');
        }
      } catch (err) {
        toast.error('Failed to upload background');
      }
    }
  }, [updateConfig]);

  // Audio dropzone
  const onDropAudio = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      try {
        const result = await uploadAudio(acceptedFiles[0]);
        if (result.success) {
          toast.success('Custom audio uploaded!');
        }
      } catch (err) {
        toast.error('Failed to upload audio');
      }
    }
  }, []);

  const avatarDropzone = useDropzone({
    onDrop: onDropAvatar,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  const bgDropzone = useDropzone({
    onDrop: onDropBackground,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  const audioDropzone = useDropzone({
    onDrop: onDropAudio,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'] },
    multiple: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        Input Sources
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* YouTube URL */}
        <div className="lg:col-span-2">
          <label className="text-sm text-white/50 mb-1.5 block">YouTube URL</label>
          <div className="relative">
            <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Paste YouTube video URL here..."
              value={config.youtube_url}
              onChange={(e) => setConfig(prev => ({ ...prev, youtube_url: e.target.value }))}
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        {/* Avatar Upload */}
        <div
          {...avatarDropzone.getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
            ${avatarDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/30'}`}
        >
          <input {...avatarDropzone.getInputProps()} />
          <User size={24} className="mx-auto mb-2 text-white/40" />
          <p className="text-sm text-white/60">
            {config.avatar_path ? '✓ Avatar uploaded' : 'Drop avatar or click to browse'}
          </p>
          <p className="text-xs text-white/30 mt-1">PNG, JPG, WebP</p>
        </div>

        {/* Background Upload */}
        <div
          {...bgDropzone.getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
            ${bgDropzone.isDragActive ? 'border-secondary bg-secondary/5' : 'border-white/10 hover:border-secondary/30'}`}
        >
          <input {...bgDropzone.getInputProps()} />
          <Image size={24} className="mx-auto mb-2 text-white/40" />
          <p className="text-sm text-white/60">
            {config.background.mode === 'upload' ? '✓ Background uploaded' : 'Drop background or click'}
          </p>
          <p className="text-xs text-white/30 mt-1">Or use Auto Background</p>
        </div>

        {/* Custom Audio Upload */}
        <div
          {...audioDropzone.getRootProps()}
          className={`lg:col-span-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200
            ${audioDropzone.isDragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-accent/30'}`}
        >
          <input {...audioDropzone.getInputProps()} />
          <Music size={24} className="mx-auto mb-2 text-white/40" />
          <p className="text-sm text-white/60">
            Upload custom audio (optional - overrides YouTube audio)
          </p>
          <p className="text-xs text-white/30 mt-1">MP3, WAV, M4A</p>
        </div>
      </div>
    </motion.div>
  );
}

export default InputSection;
