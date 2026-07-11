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
      <DialogContent className="max-w-2xl w-[50vw] p-0 sm:p-0 overflow-visible bg-transparent border-none">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 rounded-full bg-red-600 p-3 text-white hover:bg-red-700 transition-colors shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Monitor Frame */}
        <div className="bg-gray-900 rounded-t-xl p-3 border-x-4 border-t-4 border-gray-800">
          {/* Monitor Top Bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          {/* Monitor Screen */}
          <div className="bg-black rounded-lg overflow-hidden">
            <div className="relative w-full pt-[56.25%]">
              {videoType === 'youtube' && videoId && (
                <iframe
                  ref={iframeRef}
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {videoType === 'vimeo' && videoId && (
                <iframe
                  ref={iframeRef}
                  className="absolute inset-0 w-full h-full"
                  src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
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
                />
              )}
            </div>
          </div>
        </div>
        {/* Monitor Stand */}
        <div className="bg-gray-800 w-1/4 mx-auto h-4 rounded-b-xl"></div>
        <div className="bg-gray-700 w-1/2 mx-auto h-3 rounded-b-2xl mt-1"></div>
      </DialogContent>
    </Dialog>
  );
}
