"use client"

import { useState, useRef } from 'react';
import { motion, AnimatePresence,  useTime, useTransform } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle } from 'lucide-react';

const BUSINESS_HOURS = [
  { day: 'Mon', hours: '09:00 am – 05:00 pm' },
  { day: 'Tue', hours: '09:00 am – 05:00 pm' },
  { day: 'Wed', hours: '09:00 am – 05:00 pm' },
  { day: 'Thu', hours: '09:00 am – 05:00 pm' },
  { day: 'Fri', hours: '09:00 am – 05:00 pm' },
  { day: 'Sat', hours: 'Closed' },
  { day: 'Sun', hours: 'Closed' },
];

export default function BusinessHours() {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  // Convert to our array index (Monday = 0)
  const currentDayIndex = today === 0 ? 6 : today - 1;
  
  const isOpen = currentDayIndex < 5; // Open Monday-Friday
  const currentDay = BUSINESS_HOURS[currentDayIndex];
  
  // For pulsing animation on status dot
  const time = useTime();
  const pulseSize = useTransform(time, [0, 1000, 2000], [1, 1.2, 1]);
  const pulseOpacity = useTransform(time, [0, 1000, 2000], [0.7, 1, 0.7]);
  
  // Animation variants
  const containerVariants = {
    collapsed: { height: "auto" },
    expanded: { 
      height: "auto",
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };
  
  const hourItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    hover: {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  const toggleButtonVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 }
  };
  
  const statusDotVariants = {
    open: { backgroundColor: "rgb(34, 197, 94)" },
    closed: { backgroundColor: "rgb(239, 68, 68)" }
  };
  
  const chevronVariants = {
    initial: { y: 0 },
    hover: { 
      y: isExpanded ? 2 : -2,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 0.5
      }
    }
  };

  return (
    <div className="mt-8">
      <motion.h3 
        className="font-medium mb-4 flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Clock className="w-4 h-4" />
        <span>Hours</span>
      </motion.h3>
      
      <motion.div
        className="space-y-2"
        initial={false}
        variants={containerVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
      >
        <motion.button
          ref={expandButtonRef}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between bg-background backdrop-blur-sm rounded-lg p-4 hover:bg-background/80 transition-colors border border-gray-100 shadow-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-2">
            <motion.span 
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0`}
              variants={statusDotVariants}
              animate={isOpen ? "open" : "closed"}
              style={{ 
                scale: pulseSize,
                opacity: pulseOpacity
              }}
            />
            <span>
              {isOpen ? 'Open today' : 'Closed today'} <span className="text-gray-500">{currentDay.hours !== 'Closed' && currentDay.hours}</span>
            </span>
          </span>
          
          <motion.div
            variants={{
              ...toggleButtonVariants,
              ...chevronVariants
            }}
            animate={isExpanded ? "expanded" : "collapsed"}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileHover="hover"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ 
                height: "auto", 
                opacity: 1, 
                y: 0,
                transition: {
                  height: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3
                  },
                  opacity: { duration: 0.2, delay: 0.1 },
                  y: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                y: -10,
                transition: {
                  height: { duration: 0.3 },
                  opacity: { duration: 0.2 }
                }
              }}
              className="overflow-hidden"
            >
              <div className="bg-blue-50/70 backdrop-blur-sm rounded-lg p-4 mt-2 space-y-2 border border-blue-100/50">
                {BUSINESS_HOURS.map((schedule, index) => (
                  <motion.div
                    key={schedule.day}
                    custom={index}
                    variants={hourItemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className={`flex justify-between items-center p-2.5 rounded ${
                      index === currentDayIndex
                        ? 'bg-yellow-50/70 border border-yellow-100/50 font-medium'
                        : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {index === currentDayIndex && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                        >
                          {isOpen ? 
                            <CheckCircle className="w-4 h-4 text-green-500" /> : 
                            <XCircle className="w-4 h-4 text-red-500" />
                          }
                        </motion.div>
                      )}
                      <span>{schedule.day}</span>
                    </span>
                    
                    <motion.span
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className={schedule.hours === 'Closed' ? 'text-red-500' : ''}
                    >
                      {schedule.hours}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}