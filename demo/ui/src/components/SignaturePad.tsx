import React, { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
  updateVisualSignature: (signatureUrl: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ updateVisualSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [points, setPoints] = useState([]);
  const [lastVelocity, setLastVelocity] = useState(0);
  const [lastWidth, setLastWidth] = useState(0);
  const [lastTimestamp, setLastTimestamp] = useState(0);

  const scaleCanvas = (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = window.devicePixelRatio || 1;

    canvas.width = rect.width * scaleFactor;
    canvas.height = rect.height * scaleFactor;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(scaleFactor, scaleFactor);

    return ctx;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = scaleCanvas(canvas);

    ctx.strokeStyle = "#000000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setContext(ctx);
  }, []);

  const getPointDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getVelocity = (p1, p2, time) => {
    const distance = getPointDistance(p1, p2);
    return distance / (time || 1);
  };

  const getStrokeWidth = (velocity) => {
    // Adjust these values to control how velocity affects stroke width
    const maxWidth = 4.5;
    const minWidth = 1.5;
    const velocityFactor = 0.5;
    
    // Calculate width based on velocity
    let width = maxWidth - (velocity * velocityFactor);
    
    // Ensure width is within bounds
    width = Math.max(minWidth, Math.min(maxWidth, width));
    
    return width;
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const newPoint = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top,
      time: Date.now(),
      pressure: e.pressure || 1
    };
    
    setPoints([newPoint]);
    setLastTimestamp(newPoint.time);
    
    context.beginPath();
    context.moveTo(newPoint.x, newPoint.y);
    
    // Start with a default width
    const width = 3;
    setLastWidth(width);
    context.lineWidth = width;
  };

  const draw = (e) => {
    if (!isDrawing || points.length === 0) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentPoint = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top,
      time: Date.now(),
      pressure: e.pressure || 1
    };
    
    const prevPoint = points[points.length - 1];
    
    // Calculate time difference
    const timeDelta = currentPoint.time - prevPoint.time;
    
    // Calculate velocity based on distance and time
    const velocity = getVelocity(prevPoint, currentPoint, timeDelta);
    
    // Smooth velocity transition using weighted average
    const smoothedVelocity = lastVelocity * 0.4 + velocity * 0.6;
    setLastVelocity(smoothedVelocity);
    
    // Calculate stroke width based on velocity and pressure
    const pressureFactor = currentPoint.pressure * 1.5;
    const rawWidth = getStrokeWidth(smoothedVelocity) * pressureFactor;
    
    // Smooth width transition
    const width = lastWidth * 0.7 + rawWidth * 0.3;
    setLastWidth(width);
    
    // Apply the new width
    context.lineWidth = width;
    
    // Use Bezier curves for smoother lines
    if (points.length >= 2) {
      const prevPrevPoint = points[points.length - 2];
      const midPoint1 = {
        x: (prevPrevPoint.x + prevPoint.x) / 2,
        y: (prevPrevPoint.y + prevPoint.y) / 2
      };
      const midPoint2 = {
        x: (prevPoint.x + currentPoint.x) / 2,
        y: (prevPoint.y + currentPoint.y) / 2
      };
      
      context.beginPath();
      context.moveTo(midPoint1.x, midPoint1.y);
      context.quadraticCurveTo(prevPoint.x, prevPoint.y, midPoint2.x, midPoint2.y);
      context.stroke();
    } else {
      context.beginPath();
      context.moveTo(prevPoint.x, prevPoint.y);
      context.lineTo(currentPoint.x, currentPoint.y);
      context.stroke();
    }
    
    // Add the new point to our points array
    setPoints([...points, currentPoint]);
    setLastTimestamp(currentPoint.time);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setPoints([]);
    handleUpdateVisualSignature();
  };

  const clearCanvas = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    handleUpdateVisualSignature();
  };

  const handleUpdateVisualSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    updateVisualSignature(dataUrl);
  };

  // Add touch support
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="border border-gray-300 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="bg-transparent cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 text-gray-500 bg-gray-200 rounded hover:bg-gray-300"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;