"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Cranberri Diamonds</h3>
                <Button variant="outline" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">Hi! Let us know how we can help and we&apos;ll respond shortly.</p>
              <form className="space-y-4">
                <Input placeholder="Name*" required />
                <Input type="email" placeholder="Email*" required />
                <Textarea placeholder="How can we help?*" required />
                <Button className="w-full">Send Message</Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>
    </>
  )
}

