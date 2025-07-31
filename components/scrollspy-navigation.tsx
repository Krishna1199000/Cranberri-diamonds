"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface NavigationItem {
  id: string
  label: string
  offset?: number
}

const navigationItems: NavigationItem[] = [
  { id: "discover", label: "Discover Our Shapes", offset: -100 },
  { id: "about", label: "About CranberriDiamonds", offset: -100 },
  { id: "partners", label: "Partners", offset: -100 },
  { id: "contact", label: "Get in Touch", offset: -100 },
  { id: "featured", label: "Featured Collection", offset: -100 },
  { id: "faq", label: "FAQ", offset: -100 },
  { id: "vip", label: "VIP List", offset: -100 },
]

export default function ScrollspyNavigation() {
  const [activeSection, setActiveSection] = useState<string>("discover")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show navigation after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all navigation sections
    navigationItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const scrollToSection = (sectionId: string, offset: number = 0) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition + offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  // Get the current active index
  const activeIndex = navigationItems.findIndex(item => item.id === activeSection)
  
  // Calculate which 3 items to show (active item should be in the middle when possible)
  const getVisibleItems = () => {
    const totalItems = navigationItems.length
    let startIndex = Math.max(0, activeIndex - 1) // Try to center the active item
    
    // Adjust if we're near the end
    if (startIndex + 3 > totalItems) {
      startIndex = Math.max(0, totalItems - 3)
    }
    
    return navigationItems.slice(startIndex, startIndex + 3).map((item, index) => ({
      ...item,
      originalIndex: startIndex + index
    }))
  }

  const visibleItems = getVisibleItems()

  if (!isVisible) return null

  return (
    <motion.nav
      initial={{ 
        opacity: 0,
        x: -30 
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.8,
          ease: [0.6, 0.05, 0.01, 0.9]
        }
      }}
      className="fixed left-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block"
    >
      {/* Navigation container with clipped overflow */}
      <div className="relative h-32 overflow-hidden">
        <motion.div 
          className="flex flex-col space-y-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.6, 0.05, 0.01, 0.9]
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: -20,
                  transition: {
                    duration: 0.3
                  }
                }}
                onClick={() => scrollToSection(item.id, item.offset || 0)}
                className={cn(
                  "text-left relative group transition-all duration-300",
                  "hover:text-black focus:outline-none",
                  activeSection === item.id
                    ? "text-black font-bold"
                    : "text-gray-400 hover:text-gray-600"
                )}
                whileHover={{ 
                  x: 4,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator line */}
                <motion.div
                  className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-0.5 bg-black"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ 
                    scaleX: activeSection === item.id ? 1 : 0,
                    opacity: activeSection === item.id ? 1 : 0,
                    transition: {
                      duration: 0.3,
                      ease: [0.6, 0.05, 0.01, 0.9]
                    }
                  }}
                />
                
                {/* Text with proper typography */}
                <motion.span
                  className="text-sm tracking-wide font-serif leading-tight block whitespace-nowrap"
                  layout
                >
                  {item.label}
                </motion.span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Subtle gradient fade at top and bottom for clipping effect */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </motion.nav>
  )
}