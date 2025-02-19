"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

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

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif text-center mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{faq.question}</span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

