"use client"

import { motion } from "framer-motion"

const shapes = [
  { name: "Pear", path: "M10,0 L20,15 L10,30 L0,15 Z" },
  { name: "Cushion", path: "M5,0 L25,0 L30,20 L15,30 L0,20 Z" },
  { name: "Marquise", path: "M15,0 L30,15 L15,30 L0,15 Z" },
  { name: "Heart", path: "M15,30 L0,15 C0,0 15,0 15,10 C15,0 30,0 30,15 Z" },
  { name: "Emerald", path: "M5,0 L25,0 L30,25 L0,25 Z" },
]

export function DiamondShapes() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.1 }}
          className="flex flex-col items-center"
        >
          <svg viewBox="0 0 30 30" className="w-24 h-24 stroke-current fill-none stroke-2">
            <path d={shape.path} />
          </svg>
          <p className="mt-4 text-gray-600">{shape.name}</p>
        </motion.div>
      ))}
    </div>
  )
}

