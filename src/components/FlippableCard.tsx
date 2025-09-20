import React, { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2 } from "lucide-react";
import { Button } from "./ui/button";

interface FlippableCardProps {
  icon: ReactNode;
  title: string;
  count?: number;
  frontContent: ReactNode;
  backContent: ReactNode;
  expandedContent?: ReactNode;
  className?: string;
  onExpand?: () => void;
}

export function FlippableCard({ 
  icon, 
  title, 
  count, 
  frontContent, 
  backContent, 
  expandedContent,
  className = "",
  onExpand
}: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Don't flip if clicking on interactive elements
    const interactiveElements = [
      'button', 'a', 'input', 'textarea', 'select', 'label',
      '[role="button"]', '[role="checkbox"]', '[role="radio"]',
      '[role="tab"]', '[contenteditable="true"]'
    ];
    
    const isInteractiveElement = interactiveElements.some(selector => 
      target.closest(selector) !== null
    );
    
    // Handle expand button click
    if (target.closest('[data-expand-button]')) {
      e.stopPropagation();
      onExpand?.();
      return;
    }
    
    // Only flip if not clicking on an interactive element
    if (!isInteractiveElement) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      onClick={handleCardClick}
      whileHover={{ 
        y: -3, 
        boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
        scale: 1.02
      }}
      transition={{ 
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      animate={{ 
        height: isFlipped ? "auto" : "320px",
        minHeight: "320px"
      }}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: 0.65, 
          ease: [0.23, 1, 0.32, 1], // Custom cubic-bezier for smooth, sophisticated motion
          type: "tween"
        }}
      >
        {/* Front Side */}
        <div 
          className="w-full bg-white rounded-2xl shadow-md border border-gray-100 backface-hidden overflow-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            display: isFlipped ? "none" : "block"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="text-blue-600">{icon}</div>
              <h3 className="font-medium text-gray-900">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              {count !== undefined && (
                <span className="text-sm text-gray-500">
                  {count} new
                </span>
              )}
              {onExpand && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                  data-expand-button
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4" style={{ height: "248px", overflow: "hidden" }}>
            {frontContent}
          </div>
        </div>

        {/* Back Side */}
        <motion.div 
          className="w-full bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            display: isFlipped ? "block" : "none"
          }}
          initial={{ height: "320px" }}
          animate={{ 
            height: isFlipped ? "auto" : "320px"
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing for height expansion
            type: "tween"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="text-blue-600">{icon}</div>
              <h3 className="font-medium text-gray-900">{title} - Details</h3>
            </div>
            {onExpand && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                data-expand-button
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4">
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ 
                    duration: 0.35, 
                    delay: 0.25,
                    ease: [0.25, 0.46, 0.45, 0.94], // Smooth content entrance
                    type: "tween"
                  }}
                >
                  {backContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}