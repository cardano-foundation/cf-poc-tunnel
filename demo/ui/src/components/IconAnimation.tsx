import React, { useState, useRef, useEffect } from 'react';
import { Signature, Check, Shield } from 'lucide-react';
import VerifiedIcon from '../assets/icon-only.png';
import PDFIcon from '../assets/pdfIcon.png';
import { eventBus } from '../utils/EventBus';

interface AnimationProps {
 
}

type IconType = 'signature' | 'check' | 'shield';

const IconAnimation: React.FC<AnimationProps> = () => {
  const [showIcon, setShowIcon] = useState(false);
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const [iconType, setIconType] = useState<IconType>('shield');
  const [iconColor, setIconColor] = useState<string>('black');
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [animationStage, setAnimationStage] = useState<'fadeIn' | 'moving' | 'idle'>('idle');
  const leftImageRef = useRef<HTMLImageElement>(null);
  const rightImageRef = useRef<HTMLImageElement>(null);
  const animationRef = useRef<number | null>(null);
  const fadeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleIconEvent = (type: {iconType: IconType}) => {
      setIconType(type.iconType);
      setIconColor(
        type.iconType === 'signature' ? '#23649e' :
        type.iconType === 'check' ? 'green' :
        'gray'
      );

      if (!leftImageRef.current || !rightImageRef.current) {
        console.log('Image refs not available');
        return;
      }

      const leftRect = leftImageRef.current.getBoundingClientRect();
      const rightRect = rightImageRef.current.getBoundingClientRect();

      const startX = leftRect.width / 2;
      const startY = leftRect.height / 2;
      const targetX = (rightRect.left - leftRect.left) + (rightRect.width / 2);
      const targetY = (rightRect.top - leftRect.top) + (rightRect.height / 2);

      setIconPosition({ x: startX, y: startY });
      startAnimation(startX, startY, targetX, targetY);
    };

    eventBus.subscribe("startIconAnimation", handleIconEvent);
    
    return () => {
      eventBus.unsubscribe("startIconAnimation", handleIconEvent);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current);
      }
    };
  }, []);

  const handleLeftImageClick = () => {
    if (!leftImageRef.current || !rightImageRef.current) return;

    const leftRect = leftImageRef.current.getBoundingClientRect();
    const rightRect = rightImageRef.current.getBoundingClientRect();

    const startX = leftRect.width / 2;
    const startY = leftRect.height / 2;
    const targetX = (rightRect.left - leftRect.left) + (rightRect.width / 2);
    const targetY = (rightRect.top - leftRect.top) + (rightRect.height / 2);

    setIconType('shield'); // Valor por defecto al hacer clic
    setIconColor('purple');
    setIconPosition({ x: startX, y: startY });
    startAnimation(startX, startY, targetX, targetY);
  };

  const startAnimation = (startX: number, startY: number, targetX: number, targetY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
    }

    setOpacity(0);
    setRotation(0);
    setShowIcon(true);
    setAnimationStage('fadeIn');
    
    const fadeInDuration = 1500;
    const fadeStart = Date.now();
    
    const animateFadeIn = () => {
      const elapsed = Date.now() - fadeStart;
      const progress = Math.min(elapsed / fadeInDuration, 1);
      
      setOpacity(progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateFadeIn);
      } else {
        setAnimationStage('moving');
        animateIcon({ x: startX, y: startY }, { x: targetX, y: targetY });
      }
    };
    
    animationRef.current = requestAnimationFrame(animateFadeIn);
  };

  const animateIcon = (startPos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
    const animate = () => {
      setIconPosition(prevPos => {
        const dx = targetPos.x - prevPos.x;
        const dy = targetPos.y - prevPos.y;
        
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          setShowIcon(false);
          setAnimationStage('idle');
          return prevPos;
        }
        
        return {
          x: prevPos.x + dx * 0.02,
          y: prevPos.y + dy * 0.02
        };
      });
      
      setRotation(prev => (prev + 5) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const renderIcon = () => {
    console.log('Rendering icon type:', iconType); // Debug para verificar el tipo actual
    switch (iconType) {
      case 'signature':
        return <Signature color={iconColor} size={32} />;
      case 'check':
        return <Check color={iconColor} size={32} />;
      case 'shield':
        return <Shield color={iconColor} size={32} />;
      default:
        return <Shield color={iconColor} size={32} />;
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="relative">
        <img
          ref={leftImageRef}
          src={VerifiedIcon}
          alt="Imagen izquierda"
          width="80"
          className="cursor-pointer rounded-lg shadow-md"
          onClick={handleLeftImageClick}
        />
        
        {showIcon && (
          <div 
            className="absolute pointer-events-none"
            style={{ 
              left: `${iconPosition.x}px`, 
              top: `${iconPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity,
              transition: animationStage === 'fadeIn' ? 'opacity 0.05s linear' : 'none'
            }}
          >
            <div 
              className="relative flex items-center justify-center"
              style={{
                width: '50px',
                height: '50px',
              }}
            >
              <div
                className="absolute w-full h-full border-2 border-gray-300 rounded-full bg-slate-100"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: animationStage === 'moving' ? 'transform 0s linear' : 'none'
                }}
              />
              <div className="relative z-10">
                {renderIcon()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative">
        <img
          ref={rightImageRef}
          src={PDFIcon}
          alt="Imagen derecha"
          width={80}
          className="rounded-lg shadow-md"
        />
      </div>
    </div>
  );
};

export default IconAnimation;