"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Diamond, ChevronDown, Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const menuItems = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/Privacy-Policy", label: "Privacy Policy" },
    { href: "/terms-and-condition", label: "Terms and Conditions" },
  ]

  const moreItems = [
    { href: "/about", label: "Beyond 4c's" },
    { href: "/contact", label: "Nurture Nature" },
  ]

  const [, setIsOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.slice(0, 3).map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href={item.href} className="font-medium hover:text-primary transition-colors">
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Diamond className="w-6 h-6" />
              <span className="font-serif text-2xl">Cranberri</span>
            </motion.div>
          </Link>

          {/* Desktop Right Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/terms" className="font-medium hover:text-primary transition-colors">
              Terms and Conditions
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center font-medium hover:text-primary">
                More <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </motion.button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[400px] bg-gradient-to-b from-gray-900 to-gray-800 border-none text-white"
              >
                <nav className="flex flex-col gap-4 pt-12">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mb-8"
                  >
                    <Diamond className="w-8 h-8 text-yellow-400" />
                    <span className="font-serif text-3xl text-white">Cranberri</span>
                  </motion.div>
                  
                  {menuItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className="block py-3 text-lg font-medium text-white/90 hover:text-yellow-400 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  <motion.div
                    className="h-px bg-gray-700 my-6"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                  
                  {moreItems.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (i + menuItems.length) * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        className="block py-3 text-lg font-medium text-white/90 hover:text-yellow-400 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-auto pt-8"
                  >
                    <div className="text-white/60 text-sm">
                      <p>© 2024 Cranberri Diamonds.</p>
                      <p>All rights reserved.</p>
                    </div>
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