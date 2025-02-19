"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Diamond, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link href="/" className="font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/shop" className="font-medium hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/privacy-policy" className="font-medium hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>

          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Diamond className="w-6 h-6" />
              <span className="font-serif text-2xl">Cranberri</span>
            </motion.div>
          </Link>

          <div className="flex items-center space-x-8">
            <Link href="/terms" className="font-medium hover:text-primary transition-colors">
              Terms and Conditions
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center font-medium hover:text-primary">
                More <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link href="/about">Beyond 4c's</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/contact">Nurture Nature</Link>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

