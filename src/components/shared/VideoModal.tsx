import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}

export function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo' | 'html5' | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Determine video type and extract ID
    const youtubeMatch = videoUrl.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    const vimeoMatch = videoUrl.match(/(?:vimeo\.com\/)(\d+)/);
    const isHtml5Video = /\.(mp4|webm|ogg)$/i.test(videoUrl);

    if (youtubeMatch && youtubeMatch[1]) {
      setVideoType('youtube');
      setVideoId(youtubeMatch[1]);
    } else if (vimeoMatch && vimeoMatch[1]) {
      setVideoType('vimeo');
      setVideoId(vimeoMatch[1]);
    } else if (isHtml5Video) {
      setVideoType('html5');
      setVideoId(videoUrl);
    }
  }, [isOpen, videoUrl]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Stop video when closing
  useEffect(() => {
    if (!isOpen) {
      if (iframeRef.current) {
        // Reload iframe to stop video
        iframeRef.current.src = iframeRef.current.src;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/10" />
      <DialogContent className="w-[90vw] max-w-[90vw] sm:w-[50vw] sm:max-w-2xl p-0 overflow-visible bg-transparent border-none">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 rounded-full bg-red-600 p-3 text-white hover:bg-red-700 transition-colors shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative w-full pt-[56.25%]">
            {videoType === 'youtube' && videoId && (
              <iframe
                ref={iframeRef}
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
            {videoType === 'vimeo' && videoId && (
              <iframe
                ref={iframeRef}
                className="absolute inset-0 w-full h-full"
                src={`https://player.vimeo.com/video/${videoId}?autoplay=1&playsinline=1`}
                title="Vimeo video player"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
            {videoType === 'html5' && videoId && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full"
                src={videoId}
                controls
                autoPlay
                playsInline
                muted
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
