import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Minimize2 } from 'lucide-react';

export default function FloatingWindow({ title, position, onPositionChange, onClose, children, isMinimized, onMinimize, isRTL, size = "normal" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState('');
  const [windowSize, setWindowSize] = useState(size === "large" ? { width: 600, height: 400 } : { width: 400, height: 300 });

  const constrainPosition = useCallback((pos, width, height) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
      x: Math.max(0, Math.min(pos.x, viewportWidth - width)),
      y: Math.max(0, Math.min(pos.y, viewportHeight - height)),
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.window-controls') || e.target.closest('.resize-handle')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleResizeMouseDown = useCallback((e, type) => {
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true); setResizeType(type);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newPosition = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
      onPositionChange(constrainPosition(newPosition, windowSize.width, windowSize.height));
    } else if (isResizing) {
      const minWidth = 300, minHeight = 200;
      const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;

      if (resizeType.includes('right')) {
        const newWidth = Math.min(viewportWidth - position.x, Math.max(minWidth, windowSize.width + e.movementX));
        setWindowSize(prev => ({ ...prev, width: newWidth }));
      }
      if (resizeType.includes('left')) {
        const newWidth = Math.max(minWidth, windowSize.width - e.movementX);
        const newX = position.x + e.movementX;
        if (newX >= 0) {
          setWindowSize(prev => ({ ...prev, width: newWidth }));
          onPositionChange(prev => ({ ...prev, x: newX }));
        }
      }
      if (resizeType.includes('bottom')) {
        const newHeight = Math.min(viewportHeight - position.y, Math.max(minHeight, windowSize.height + e.movementY));
        setWindowSize(prev => ({ ...prev, height: newHeight }));
      }
    }
  }, [isDragging, isResizing, dragOffset, position, windowSize, resizeType, onPositionChange, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false); setIsResizing(false); setResizeType('');
  }, []);

  useEffect(() => {
    const handleResize = () => onPositionChange(prevPos => constrainPosition(prevPos, windowSize.width, windowSize.height));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowSize, onPositionChange, constrainPosition]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ left: position.x, top: position.y, width: windowSize.width, height: isMinimized ? 'auto' : windowSize.height }} className="absolute bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 z-50 flex flex-col">
      <div className={`flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/80 rounded-t-lg select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={handleMouseDown}>
        <h4 className="font-semibold text-sm pointer-events-none">{title}</h4>
        <div className="window-controls flex space-x-1 rtl:space-x-reverse">
          <Button size="sm" variant="ghost" onClick={onMinimize} className="h-6 w-6 p-0"><Minimize2 className="w-3 h-3" /></Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0"><X className="w-3 h-3" /></Button>
        </div>
      </div>
      {!isMinimized && <div className="flex-1 overflow-auto p-4">{children}</div>}
      {!isMinimized && (
        <>
          <div className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'right bottom')} />
          <div className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'left bottom')} />
          <div className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
          <div className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 h-full w-2 cursor-ew-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'left')} />
          <div className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2 cursor-ns-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
        </>
      )}
    </motion.div>
  );
}