import { useEffect, useMemo, useState, useRef } from 'react';

export function useInfiniteStepCarousel(
  itemCount: number,
  visibleCount: number,
  enabled: boolean,
  delay = 3500,
) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndex(0);
    setAnimate(true);
    setDragOffset(0);
  }, [itemCount, visibleCount]);

  useEffect(() => {
    if (!enabled || itemCount === 0 || isDragging) return;

    const interval = window.setInterval(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, delay);

    return () => window.clearInterval(interval);
  }, [delay, enabled, itemCount, isDragging]);

  const duplicatedCount = Math.min(visibleCount, itemCount);
  const slideWidth = useMemo(() => 100 / visibleCount, [visibleCount]);

  const handleTransitionEnd = () => {
    if (index < itemCount && index >= 0) return;
    
    setAnimate(false);
    if (index >= itemCount) {
      setIndex(0);
    } else if (index < 0) {
      setIndex(itemCount - 1);
    }
  };

  useEffect(() => {
    if (animate) return;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimate(true);
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  const goNext = () => {
    if (!enabled) return;
    setAnimate(true);
    setIndex((current) => current + 1);
  };

  const goPrev = () => {
    if (!enabled) return;
    setAnimate(true);
    setIndex((current) => current - 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
    setAnimate(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!enabled || touchStartX.current === null || touchStartY.current === null || !containerRef.current) return;
    
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
    if (!enabled || touchStartX.current === null) return;

    setIsDragging(false);
    
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      const threshold = 15;
      
      if (dragOffset < -threshold) {
        goNext();
      } else if (dragOffset > threshold) {
        goPrev();
      }
    }
    
    setDragOffset(0);
    setAnimate(true);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  return {
    index,
    animate,
    goNext,
    goPrev,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    dragOffset,
    containerRef,
  };
}
