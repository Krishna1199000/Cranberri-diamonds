"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Sparkles } from "lucide-react"

const faqs = [
  {
    question: "Are lab-grown diamonds real diamonds?",
    answer:
      "Yes, lab-grown diamonds are real diamonds. They have the same physical, chemical, and optical properties as natural diamonds. The only difference is that lab-grown diamonds are created in a laboratory, rather than mined from the Earth.",
  },
  {
    question: "Are lab-grown diamonds cheaper than natural diamonds?",
    answer:
      "Yes, lab-grown diamonds are generally more affordable than natural diamonds because they are produced in a controlled environment and do not require the costly mining process. However, their value and price depend on the same factors that affect natural diamonds, such as carat weight, cut, clarity, and color.",
  },
  {
    question: "Will my lab-grown diamond lose value over time?",
    answer:
      "While lab-grown diamonds generally cost less than natural diamonds, they do not appreciate in value over time like natural diamonds. However, they retain their intrinsic value due to their beauty, durability, and high-quality craftsmanship.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [, setHoveredIndex] = useState<number | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 20
            }
          }}
          viewport={{ once: true }}
          className="text-4xl font-serif text-center mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-background transition-colors"
                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <span className="font-medium">{faq.question}</span>
                <motion.div
                  animate={{ 
                    rotate: openIndex === index ? 180 : 0,
                    transition: {
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }
                  }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ 
                      height: "auto",
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }
                    }}
                    exit={{ 
                      height: 0,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        transition: { duration: 0.2 }
                      }}
                      exit={{ opacity: 0 }}
                      className="px-6 pb-4 pt-2 bg-background"
                    >
                      {faq.answer}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Decorative sparkles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            transition: {
              repeat: Infinity,
              duration: 2
            }
          }}
          className="absolute top-10 right-10"
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
      </div>
    </section>
  )
}