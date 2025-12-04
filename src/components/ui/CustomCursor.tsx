import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

const CustomCursor = () => {
  const location = useLocation();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Hide custom cursor in dashboard pages
  const hideCursorPaths = ['/admin', '/login'];
  const shouldHideCursor = hideCursorPaths.some(path => 
    location.pathname.startsWith(path)
  );
  
  // Hide custom cursor on mobile and tablet - show only on desktop
  const [isMobile, setIsMobile] = useState(true); // Default to true for SSR

  useEffect(() => {
    // Check if we're on mobile/tablet after component mounts
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        // Only hide on actual mobile devices (768px and below)
        setIsMobile(window.innerWidth <= 768);
      }
    };
    
    checkMobile();
    
    // Add resize listener to update mobile state
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    // Don't add event listeners if cursor should be hidden or if document is not available
    if (shouldHideCursor || isMobile || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      const hideForText = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      setIsVisible(!hideForText);
    };

    const handleClick = () => {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 100);
    };

    const handleTouchStart = () => {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 100);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    try {
      // More sensitive event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick);
      document.addEventListener('mousedown', handleClick); // Extra sensitivity
      document.addEventListener('touchstart', handleTouchStart); // Touch support
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
    } catch (error) {
      console.warn('CustomCursor: Failed to add event listeners', error);
    }

    return () => {
      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick);
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mouseenter', handleMouseEnter);
      } catch (error) {
        console.warn('CustomCursor: Failed to remove event listeners', error);
      }
    };
  }, [shouldHideCursor, location.pathname]);

  return null;
};

export default CustomCursor;
