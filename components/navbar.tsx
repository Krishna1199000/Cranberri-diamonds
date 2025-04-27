"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { ChevronDown, Menu, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

export default function Navbar() {
  const menuItems = [
    { href: "/", label: "Home" },
    { href: "/Privacy-Policy", label: "Privacy Policy" },
    { href: "/terms-and-condition", label: "Terms and Conditions" },
  ]

  const moreItems = [
    { href: "/Beyond-4cs", label: "Beyond 4c's" },
    { href: "/contact", label: "Nurture Nature" },
  ]

  const [isOpen, setIsOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { scrollY } = useScroll()
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0.5)", "rgba(255, 255, 255, 0.95)"]
  )
  const navShadow = useTransform(
    scrollY,
    [0, 100],
    ["0 0 0 rgba(0,0,0,0)", "0 10px 30px rgba(0,0,0,0.1)"]
  )

  // Navbar variants
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1
      }
    }
  }

  // Menu item variants
  const menuItemVariants = {
    initial: { y: -20, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }),
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  }

  // Logo variants
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0, rotate: -5 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.2
      }
    },
    hover: {
      scale: 1.05,
      rotate: 2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  }

  // Mobile menu button variants
  const menuButtonVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 }
  }

  // Sparkle effect for logo
  const sparkleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 2,
        repeatDelay: 1
      }
    }
  }

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      style={{ 
        background: navBackground,
        boxShadow: navShadow,
        backdropFilter: "blur(10px)"
      }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.slice(0, 2).map((item, i) => (
              <motion.div
                key={item.href}
                custom={i}
                variants={menuItemVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setHoveredItem(item.href)}
                onHoverEnd={() => setHoveredItem(null)}
                className="relative z-20"
              >
                <Link href={item.href}>
                  <span className="font-medium text-black hover:text-black transition-colors relative">
                    {item.label}
                    {hoveredItem === item.href && (
                      <motion.span 
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full"
                        layoutId="underline"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                      />
                    )}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none z-10">
            <motion.div
              className="flex items-center gap-2 relative"
              variants={logoVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <Image src="/IMG_8981[1].png" alt="Cranberri Logo" width={140} height={60} className="object-contain" />
              
              {/* Sparkle effects */}
              <motion.div 
                className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full"
                variants={sparkleVariants}
                initial="initial"
                animate="animate"
              />
              <motion.div 
                className="absolute top-1/2 -left-3 w-2 h-2 bg-blue-300 rounded-full"
                variants={sparkleVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
              />
              <motion.div 
                className="absolute -bottom-1 right-1/3 w-2 h-2 bg-pink-300 rounded-full"
                variants={sparkleVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 1 }}
              />
            </motion.div>
          </Link>

          {/* Desktop Right Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div
              custom={2}
              variants={menuItemVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              className="relative z-20"
            >
              <Link href="/auth/signin">
                <span className="font-medium text-black hover:text-black transition-colors">
                  Sign In
                </span>
              </Link>
            </motion.div>
            
            <motion.div
              custom={3}
              variants={menuItemVariants}
              initial="initial"
              animate="animate"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)" 
              }}
              whileTap={{ scale: 0.95 }}
              className="relative z-20"
            >
              <Link href="/auth/signup">
                <span className="font-medium text-white bg-black px-4 py-2 rounded-md hover:bg-black transition-colors block">
                  Sign Up
                </span>
              </Link>
            </motion.div>
            
            <motion.div
              custom={4}
              variants={menuItemVariants}
              initial="initial"
              animate="animate"
              className="relative z-20"
            >
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center font-medium text-black hover:text-black group">
                  More 
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="ml-1 h-4 w-4 group-hover:text-blue-400 transition-colors duration-200" />
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black text-white border-none shadow-lg rounded-md">
                  {moreItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <DropdownMenuItem 
                        className="hover:bg-gray-800 transition-colors duration-200"
                        onSelect={() => {}}
                      >
                        <Link href={item.href} className="w-full">
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    </motion.div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <motion.button
                  variants={menuButtonVariants}
                  animate={isOpen ? "open" : "closed"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-background rounded-full bg-background relative"
                >
                  <AnimatePresence initial={false} mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -45, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 45, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 45, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -45, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-6 h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] bg-background border-none text-black overflow-y-auto"
              >
                <nav className="flex flex-col gap-4 pt-6 pb-8">

                  {/* Mobile Logo */}
                  <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    className="flex flex-col items-center gap-2 mb-8"
                  >
                    <div className="relative">
                      <Image src="/IMG_8981[1].png" alt="Cranberri Logo" width={200} height={100} className="object-contain" />
                      <motion.div 
                        className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2
                        }}
                      />
                    </div>
                  </motion.div>

                  {menuItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: i * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ 
                        x: 5,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="block py-3 text-lg font-medium text-black hover:text-black transition-colors">
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: menuItems.length * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    whileHover={{ 
                      x: 5,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                  >
                    <Link
                      href="/auth/signin"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="block py-3 text-lg font-medium text-black hover:text-black transition-colors">
                        Sign In
                      </span>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: (menuItems.length + 1) * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    whileHover={{ 
                      x: 5,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                  >
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="block py-3 text-lg font-medium text-black hover:text-black transition-colors">
                        Sign Up
                      </span>
                    </Link>
                  </motion.div>

                  <motion.div
                    className="h-px bg-gray-300 my-6"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />

                  {moreItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: (i + menuItems.length + 2) * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ 
                        x: 5,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="block py-3 text-lg font-medium text-black hover:text-black transition-colors">
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.5,
                      type: "spring",
                      stiffness: 100,
                      damping: 10
                    }}
                    className="mt-8 text-center text-gray-600 text-sm"
                  >
                    <p>© 2024 Cranberri Diamonds.</p>
                    <p>All rights reserved.</p>
                  </motion.div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}