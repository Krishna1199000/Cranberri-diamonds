"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

const collections = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375",
    title: "Diamond Collection",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1615655096345-61a54750068d",
    title: "Luxury Rings",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed",
    title: "Wedding Collection",
  },
]

export default function FeaturedCollection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % collections.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + collections.length) % collections.length)
  }

  return (
    <section id="featured" className="py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-4xl font-serif text-center mb-12"
      >
        Featured Collection
      </motion.h2>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="relative overflow-hidden aspect-[16/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0"
            >
              <Image
                src={collections[currentIndex].image || "/placeholder.svg"}
                alt={collections[currentIndex].title}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-8 left-8 text-3xl font-serif text-white"
              >
                {collections[currentIndex].title}
              </motion.h3>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={prev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={next}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="flex justify-center mt-4 gap-2">
          {collections.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}