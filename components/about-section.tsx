"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const aboutItems = [
  {
    title: "Our Story",
    content:
      "At Cranberri Diamonds, we believe that every diamond tells a story. Our Journey began with a passion for exquisite craftsmanship and a commitment to ethical sourcing.",
    image: "/placeholder.svg",
  },
  {
    title: "Our Mission",
    content:
      "We empower jewelers by providing direct access to premium loose diamonds and custom jewelry at competitive prices, boosting profitability without compromising quality.",
    image: "/placeholder.svg",
  },
  {
    title: "Our Products",
    content:
      "We offer an exclusive selection of D-E color, VVS clarity loose diamonds (both natural and lab-grown), custom jewelry, and components—sourced directly from Surat.",
    image: "/placeholder.svg",
  },
]

export function AboutSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16"
        >
          About Cranberri Diamonds
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {aboutItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400/20 to-sky-400/20 rounded-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300" />
              <div className="relative bg-white p-6 rounded-lg shadow-lg">
                <div className="mb-4 relative h-48">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{item.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

