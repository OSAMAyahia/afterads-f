import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

const CustomCursor = () => {
  const location = useLocation();
  const [position, setPosition] = useState<Position>({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hide custom cursor in specific pages
  const hideCursorPaths = ['/admin', '/login'];
  const shouldHideCursor = hideCursorPaths.some(path => 
    location.pathname.startsWith(path)
  );
  
  // Detect mobile/tablet devices
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse movement with optimization
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Position the glow directly at cursor tip
    setPosition({ x: e.clientX, y: e.clientY });
    
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;
    
    setIsVisible(!isInputField);
    
    // Check if hovering over interactive elements
    const isInteractive = target.tagName === 'A' || 
                         target.tagName === 'BUTTON' ||
                         target.role === 'button' ||
                         target.onclick !== null ||
                         window.getComputedStyle(target).cursor === 'pointer';
    
    setIsHovering(isInteractive);
  }, []);

  // Handle click with debounce
  const handleClick = useCallback(() => {
    setIsClicking(true);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicking(false);
    }, 150);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (shouldHideCursor || isMobile) return;

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Keep default cursor visible
    document.body.style.cursor = 'default';
    document.documentElement.style.cursor = 'default';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      
      // Restore default cursor
      document.body.style.cursor = '';
      document.documentElement.style.cursor = '';
      
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [shouldHideCursor, isMobile, handleMouseMove, handleClick, handleMouseLeave, handleMouseEnter]);

  // Don't render on mobile or hidden paths
  if (shouldHideCursor || isMobile) return null;

const scale = isClicking ? 0.7 : isHovering ? 1.3 : 1.0;
  const opacity = isVisible ? 1 : 0;

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(2); }
          50% { opacity: 0.5; transform: scale(2.2); }
        }
        
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
      
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: position.x,
          top: position.y,
          opacity,
          transition: 'opacity 200ms ease-out',
        }}
      >
        {/* Outer glow effect - centered on cursor */}
        <div 
          className="absolute"
          style={{
           width: '50px',
          height: '50px',
          left: '-25px',
          top: '-25px',
            background: 'radial-gradient(circle, rgba(24,181,216,0.3) 0%, rgba(24,181,216,0.15) 50%, transparent 70%)',
            filter: 'blur(12px)',
            animation: 'pulse-glow 2s ease-in-out infinite',
            transform: `scale(${scale})`,
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        
        {/* Secondary glow layer - centered on cursor */}
        <div 
          className="absolute"
          style={{
         width: '35px',
height: '35px',
left: '-17.5px',
top: '-17.5px',
            background: 'radial-gradient(circle, rgba(95,211,255,0.4) 0%, rgba(24,181,216,0.2) 60%, transparent 80%)',
            filter: 'blur(8px)',
            transform: `scale(${scale * 0.9})`,
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        
        {/* Main cursor circle - centered on cursor */}
        <div
          className="absolute"
          style={{
width: '28px',
height: '28px',
left: '-14px',
top: '-14px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #18b5d8 0%, #5fd3ff 100%)',
            boxShadow: `
              0 0 20px rgba(24, 181, 216, 0.7),
              0 0 40px rgba(24, 181, 216, 0.5),
              0 0 60px rgba(24, 181, 216, 0.3),
              inset 0 0 10px rgba(255, 255, 255, 0.3)
            `,
            transform: `scale(${scale * 0.8})`,
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Inner bright core */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)',
              transform: 'scale(0.5)',
            }}
          />
        </div>
        
        {/* Click ripple effect - centered on cursor */}
        {isClicking && (
          <>
            <div
              className="absolute rounded-full border-2 border-[#18b5d8]"
              style={{
      width: '28px',
height: '28px',
left: '-14px',
top: '-14px',
                animation: 'ripple 500ms ease-out',
              }}
            />
            <div
              className="absolute rounded-full border border-[#5fd3ff]"
              style={{
                width: '32px',
                height: '32px',
                left: '-16px',
                top: '-16px',
                animation: 'ripple 600ms ease-out 50ms',
              }}
            />
          </>
        )}
        
        {/* Trailing particles - centered on cursor */}
        <div
          className="absolute"
          style={{
            width: '10px',
            height: '10px',
            left: '-5px',
            top: '-5px',
            borderRadius: '50%',
            backgroundColor: '#5fd3ff',
            opacity: 0.4,
            filter: 'blur(1px)',
            transform: `scale(${scale * 0.5})`,
            transition: 'all 150ms ease-out',
          }}
        />
        <div
          className="absolute"
          style={{
            width: '7px',
            height: '7px',
            left: '-3.5px',
            top: '-3.5px',
            borderRadius: '50%',
            backgroundColor: '#18b5d8',
            opacity: 0.3,
            filter: 'blur(1px)',
            transform: `scale(${scale * 0.4})`,
            transition: 'all 200ms ease-out',
          }}
        />
      </div>
    </>
  );
};

export default CustomCursor;