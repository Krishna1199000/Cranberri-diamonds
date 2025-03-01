"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

export function Navigation() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md"
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-gray-800 hover:text-gray-600 border-b-2 border-black">
            Home
          </Link>
          <Link href="/shop" className="text-gray-800 hover:text-gray-600">
            Shop
          </Link>
          <Link href="Privacy-Policy" className="text-gray-800 hover:text-gray-600">
            Privacy Policy
          </Link>
        </div>

        <div className="flex items-center space-x-8">
          <Link href="terms-and-condition" className="text-gray-800 hover:text-gray-600">
            Terms and Conditions
          </Link>
          <button className="text-gray-800 hover:text-gray-600 flex items-center">
            More
            <ChevronDown className="ml-1 h-4 w-4" />
          </button>
        </div>
      </nav>
    </motion.header>
  )
}

