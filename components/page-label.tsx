"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export default function PageLabel() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show label after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        x: 30
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.8,
          ease: [0.6, 0.05, 0.01, 0.9]
        }
      }}
      className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block"
    >
      {/* Rotated page label exactly like Diamonds in Glass */}
      <motion.div
        className="transform rotate-90 origin-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        <span className="text-black font-serif text-lg font-normal tracking-[0.3em] whitespace-nowrap">
          HOME
        </span>
      </motion.div>
    </motion.div>
  )
}