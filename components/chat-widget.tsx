"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion"
import { MessageSquare, X, Send, ChevronRight } from "lucide-react"
// import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const formRef = useRef<HTMLFormElement>(null)
  
  // For gradient button effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }
  
  // Create a radial gradient based on mouse position
  const background = useMotionTemplate`radial-gradient(
    circle at ${mouseX}px ${mouseY}px,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 1) 50%
  )`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: "", email: "", message: "" })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Animation variants
  const chatButtonVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5
      }
    },
    hover: { 
      scale: 1.1,
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.9 }
  }

  const chatPanelVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transformOrigin: "bottom right"
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  }

  const formControlVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    })
  }

  const pulseRing = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: [0, 0.5, 0],
      scale: [0.8, 1.5, 2],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeOut"
      }
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={chatPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <motion.div 
              className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="w-2 h-2 bg-green-500 rounded-full absolute top-0 right-0"></span>
                    <MessageSquare className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="font-semibold">Cranberri Diamonds</h3>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-gray-100 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
            
            <div className="p-5">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-600 mb-4"
                    >
                      Hi! Let us know how we can help and we&apos;ll respond shortly.
                    </motion.p>
                    <motion.form 
                      ref={formRef}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <motion.div
                        custom={0}
                        variants={formControlVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Input 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Name*" 
                          required 
                          className="border-gray-300 focus:border-black focus:ring-black transition-all duration-300"
                        />
                      </motion.div>
                      
                      <motion.div
                        custom={1}
                        variants={formControlVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Input 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email" 
                          placeholder="Email*" 
                          required 
                          className="border-gray-300 focus:border-black focus:ring-black transition-all duration-300"
                        />
                      </motion.div>
                      
                      <motion.div
                        custom={2}
                        variants={formControlVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Textarea 
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="How can we help?*" 
                          required 
                          className="min-h-24 border-gray-300 focus:border-black focus:ring-black transition-all duration-300" 
                        />
                      </motion.div>
                      
                      <motion.div
                        custom={3}
                        variants={formControlVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.button
                          type="submit"
                          className="w-full bg-black text-white rounded-md py-2.5 relative overflow-hidden"
                          style={{ background }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onMouseMove={handleMouseMove}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Send Message
                            <Send className="h-4 w-4" />
                          </span>
                        </motion.button>
                      </motion.div>
                    </motion.form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex flex-col items-center justify-center py-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <ChevronRight className="h-8 w-8 text-green-600" />
                      </motion.div>
                    </motion.div>
                    
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg font-medium text-center mb-2"
                    >
                      Message Sent!
                    </motion.h3>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-gray-600 text-center"
                    >
                      We&apos;ll get back to you as soon as possible.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="fixed bottom-6 right-6 z-50 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Pulse rings */}
        <AnimatePresence>
          {!isOpen && (
            <>
              <motion.div 
                className="absolute inset-0 rounded-full bg-black/10"
                variants={pulseRing}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0 }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-black/10"
                variants={pulseRing}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.5 }}
              />
            </>
          )}
        </AnimatePresence>
        
        <motion.button
          variants={chatButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg relative z-10"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageSquare className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  )
}