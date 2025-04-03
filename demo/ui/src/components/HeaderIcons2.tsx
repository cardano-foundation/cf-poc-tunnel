// components/HeaderIcons.tsx
import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react"; // Ícono de seguridad
import veridianIcon from "../assets/icon-only.png";
import pdfIcon from "../assets/pdfIcon.png";

interface HeaderIconsProps {
  triggerAnimation: boolean; // Prop para activar la animación externamente
  onAnimationEnd?: () => void; // Callback opcional cuando la animación termina
}

const HeaderIcons: React.FC<HeaderIconsProps> = ({ triggerAnimation, onAnimationEnd }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      setIsAnimating(true);
    }
  }, [triggerAnimation]);

  const handleImageClick = () => {
    setIsAnimating(true); // Activa la animación al hacer clic en la imagen izquierda
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  // Tamaños de las imágenes
  const veridianWidth = 100; // Ancho de veridianIcon
  const pdfWidth = 80; // Ancho de pdfIcon
  const gap = 16; // gap-4 en Tailwind = 1rem = 16px
  const iconSize = 24; // Tamaño del ícono Lock (w-6 h-6)

  return (
    <div className="flex items-center gap-4 relative">
      <img
        width={veridianWidth}
        src={veridianIcon}
        alt="Veridian Icon"
        onClick={handleImageClick}
        className="cursor-pointer"
      />
      <img width={pdfWidth} src={pdfIcon} alt="PDF Icon" />
      {isAnimating && (
        <div
          className="absolute top-1/2 -translate-y-1/2 animate-security-move"
          style={{
            // Posición inicial: centro de veridianIcon
            left: `${veridianWidth / 2 - iconSize / 2}px`,
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          <Lock className="w-6 h-6 text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default HeaderIcons;