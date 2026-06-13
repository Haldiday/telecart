import { useState, useRef } from 'react';

export function useFixedCarouselTouch(
  currentPage: number,
  totalPages: number,
  onPageChange: (newPage: number) => void
) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !containerRef.current) return;

    const touchX = e.touches[0].clientX;
    const diff = touchX - touchStartX.current;
    const containerWidth = containerRef.current.offsetWidth;

    // Convert pixel diff to percentage of container width
    const percentageDiff = (diff / containerWidth) * 100;
    setDragOffset(percentageDiff);
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null) return;

    setIsDragging(false);
    const threshold = 15; // 15% of width to trigger slide change

    if (dragOffset < -threshold) {
      // Swipe left - go to next page
      if (currentPage < totalPages - 1) {
        onPageChange(currentPage + 1);
      }
    } else if (dragOffset > threshold) {
      // Swipe right - go to previous page
      if (currentPage > 0) {
        onPageChange(currentPage - 1);
      }
    }

    setDragOffset(0);
    touchStartX.current = null;
  };

  const getTransformStyle = () => {
    const baseTranslate = -currentPage * 100;
    return `translateX(${baseTranslate + dragOffset}%)`;
  };

  const getTransitionStyle = () => {
    return isDragging ? 'none' : 'transform 500ms ease-in-out';
  };

  return {
    containerRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    getTransformStyle,
    getTransitionStyle,
  };
}
