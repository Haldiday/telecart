import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isVideoUrl(url: string): boolean {
  // Check for YouTube, Vimeo, or HTML5 video extensions
  const youtubePattern = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const vimeoPattern = /(?:vimeo\.com\/)(\d+)/;
  const html5Pattern = /\.(mp4|webm|ogg)$/i;
  
  return youtubePattern.test(url) || vimeoPattern.test(url) || html5Pattern.test(url);
}
