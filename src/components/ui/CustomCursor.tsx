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
  const [smoothPosition, setSmoothPosition] = useState<Position>({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Hide custom cursor in dashboard pages
  const hideCursorPaths = ['/admin', '/login'];
  const shouldHideCursor = hideCursorPaths.some(path => 
    location.pathname.startsWith(path)
  );
  
  // Hide custom cursor on mobile and tablet - show only on desktop
  const [isMobile, setIsMobile] = useState(false);

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
    // Smooth animation loop using requestAnimationFrame
    let animationFrameId: number;
    
    const animate = () => {
      setSmoothPosition(prev => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        const factor = 0.12; // Smoothing factor (lower = smoother but slower)
        
        return {
          x: prev.x + dx * factor,
          y: prev.y + dy * factor
        };
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [position]);

  useEffect(() => {
    // Don't add event listeners if cursor should be hidden or if document is not available
    if (shouldHideCursor || isMobile || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    // Mark as initialized
    setIsInitialized(true);
    console.log('CustomCursor: Initializing cursor effect');

    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smoother movement
      requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      });
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
  }, [shouldHideCursor, location.pathname, isMobile]);

  // Don't render anything if cursor should be hidden or on mobile
  if (shouldHideCursor || isMobile) {
    console.log('CustomCursor: Hidden due to shouldHideCursor or isMobile', { shouldHideCursor, isMobile });
    return null;
  }

  // Debug info
  if (!isInitialized) {
    console.log('CustomCursor: Not initialized yet');
  } else {
    console.log('CustomCursor: Rendering at position', smoothPosition, 'visible:', isVisible);
  }

  return (
    <div
      className={`fixed pointer-events-none z-50 transition-all duration-75 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: smoothPosition.x - 12,
        top: smoothPosition.y - 12,
        transform: isClicking ? 'scale(0.7)' : 'scale(1)',
        willChange: 'transform, left, top',
      }}
    >
      {/* Blue circle cursor effect with strong glow */}
      <div className="relative">
        {/* Outer glow layers */}
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-[#18b5d8] opacity-30 animate-pulse" 
             style={{transform: 'scale(2)', filter: 'blur(2px)'}} />
        <div className="absolute inset-0 w-6 h-6 rounded-full bg-[#18b5d8] opacity-40 animate-pulse" 
             style={{transform: 'scale(1.5)', filter: 'blur(1px)', animationDelay: '0.2s'}} />
        
        {/* Main circle */}
        <div 
          className="w-6 h-6 rounded-full bg-[#18b5d8] opacity-70 relative"
          style={{
            boxShadow: '0 0 15px #18b5d8, 0 0 25px #18b5d8, 0 0 35px #18b5d8',
          }}
        >
          {/* Inner bright core */}
          <div 
            className="absolute inset-1 rounded-full bg-[#5fd3ff] opacity-90"
            style={{
              boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
      </div>
      
      {/* Ripple effect on click */}
      {isClicking && (
        <div 
          className="absolute inset-0 w-6 h-6 rounded-full bg-[#18b5d8] opacity-50"
          style={{
            animation: 'ripple 300ms ease-out',
            transform: 'scale(2)',
            filter: 'blur(2px)',
          }}
        />
      )}
    </div>
  );
};

export default CustomCursor;
