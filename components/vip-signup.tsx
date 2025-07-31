"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Check, Sparkles, ArrowRight } from "lucide-react"

export default function VipSignup() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hover, setHover] = useState(false)
  
  // For the 3D tilt effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-100, 100], [5, -5])
  const rotateY = useTransform(x, [-100, 100], [-5, 5])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setEmail("")
      }, 3000)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: 50
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }
  
  const childVariants = {
    hidden: { 
      opacity: 0,
      y: 20 
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  }
  
  const sparkleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 2,
        repeatDelay: 0.5
      }
    }
  }

  return (
    <section id="vip" className="py-24 bg-gradient-to-br bg-background overflow-hidden relative">
      {/* Background sparkles */}
      <motion.div 
        className="absolute top-1/4 left-1/4 text-yellow-400"
        variants={sparkleVariants}
        initial="hidden"
        animate="visible"
      >
        <Sparkles className="w-6 h-6" />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-1/4 right-1/3 text-blue-400"
        variants={sparkleVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.7 }}
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>
      
      <motion.div 
        className="absolute top-1/2 right-1/4 text-purple-400"
        variants={sparkleVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.3 }}
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto"
          style={{
            perspective: 1000
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d"
            }}
            className="py-8 px-6 rounded-2xl bg-white/50 backdrop-blur-md shadow-xl border border-white/40"
          >
            <motion.div className="relative" variants={childVariants}>
              <motion.h2
                className="text-4xl font-serif mb-6 relative inline-block"
                whileHover={{
                  scale: 1.05,
                  transition: { 
                    type: "spring",
                    stiffness: 300,
                    damping: 10 
                  }
                }}
              >
                Join Our VIP List
                <motion.div 
                  className="absolute -top-4 -right-6"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: 2
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.h2>
            </motion.div>
            
            <motion.p
              variants={childVariants}
              className="text-gray-600 mb-8 leading-relaxed"
            >
              Be the first to hear about upcoming sales, hot trends, and new arrivals. 
              Join our VIP diamond collectors for exclusive offers and updates.
            </motion.p>
            
            <motion.div variants={childVariants}>
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="signupForm"
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-grow shadow-inner border-gray-200 focus:border-black focus:ring-black transition-all duration-300" 
                      required
                    />
                    <motion.div
                      onHoverStart={() => setHover(true)}
                      onHoverEnd={() => setHover(false)}
                    >
                      <Link href="/auth/signup">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            className="whitespace-nowrap shadow-lg group relative overflow-hidden"
                          >
                            <motion.span 
                              className="absolute inset-0 bg-black"
                              initial={{ x: "-100%" }}
                              animate={{ x: hover ? "0%" : "-100%" }}
                              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                            />
                            <motion.span className="relative z-10 flex items-center gap-1">
                              Sign up
                              <motion.span
                                animate={{ x: hover ? 5 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </motion.span>
                            </motion.span>
                          </Button>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="successMessage"
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }
                    }}
                    exit={{ 
                      scale: 0.8, 
                      opacity: 0,
                      transition: {
                        duration: 0.2
                      }
                    }}
                    className="py-2 px-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Thank you! You&apos;re now on our VIP list.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}