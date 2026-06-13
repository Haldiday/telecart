import { useState, useRef } from 'react';

export function useFixedCarouselTouch(
  currentPage: number,
  totalPages: number,
  onPageChange: (newPage: number) => void
) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || !containerRef.current) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartX.current;
    const diffY = touchY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      const minSwipeThreshold = 5; // Minimum pixels moved before determining direction
      if (Math.abs(diffX) > minSwipeThreshold || Math.abs(diffY) > minSwipeThreshold) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      } else {
        return; // Not enough movement yet, don't do anything
      }
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      const containerWidth = containerRef.current.offsetWidth;
      const percentageDiff = (diffX / containerWidth) * 100;
      setDragOffset(percentageDiff);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    setIsDragging(false);
    
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      const threshold = 15;

      if (dragOffset < -threshold) {
        if (currentPage < totalPages - 1) {
          onPageChange(currentPage + 1);
        }
      } else if (dragOffset > threshold) {
        if (currentPage > 0) {
          onPageChange(currentPage - 1);
        }
      }
    }

    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
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
