'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

import './Dock.css';

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, itemWidth, isVertical }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      y: 0,
      width: baseItemSize,
      height: baseItemSize
    };
    
    if (isVertical) {
      return val - rect.y - baseItemSize / 2;
    }
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: isVertical ? itemWidth : size,
        minWidth: isVertical ? itemWidth : undefined,
        maxWidth: isVertical ? itemWidth : undefined,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, child => cloneElement(child, { isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className = '', isVertical, ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, ...(isVertical ? { x: 0 } : { y: 0 }) }}
          animate={{ opacity: 1, ...(isVertical ? { x: -10 } : { y: -10 }) }}
          exit={{ opacity: 0, ...(isVertical ? { x: 0 } : { y: 0 }) }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={isVertical ? { left: '-8px', top: '50%', transform: 'translateY(-50%)' } : { x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  itemWidth = baseItemSize,
  isVertical = false
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div 
      style={isVertical ? { width: height, scrollbarWidth: 'none' } : { height, scrollbarWidth: 'none' }} 
      className="dock-outer"
    >
      <motion.div
        onMouseMove={({ pageX, pageY }) => {
          isHovered.set(1);
          mouseX.set(isVertical ? pageY : pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${isVertical ? 'dock-vertical' : 'dock-horizontal'} ${className}`}
        style={isVertical ? { width: panelHeight } : { height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            itemWidth={itemWidth}
            isVertical={isVertical}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel isVertical={isVertical}>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}