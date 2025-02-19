"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const certificationPartners = [
  {
    name: "GCAL",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
  {
    name: "IGI",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
  {
    name: "GIA",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
]

const paymentPartners = [
  {
    name: "Razorpay",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
  {
    name: "TransferWise",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
  {
    name: "Payoneer",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
  {
    name: "PayPal",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-19%20005906-I6vSAYu9ciSo6sYw0MES0Q4m12bqVu.png",
  },
]

export function Partners() {
  return (
    <div className="space-y-16">
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          Certification Partners
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {certificationPartners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-center"
            >
              <Image
                src={partner.logo || "/placeholder.svg"}
                alt={partner.name}
                width={200}
                height={100}
                className="object-contain"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
        >
          Our Partners
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {paymentPartners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-center"
            >
              <Image
                src={partner.logo || "/placeholder.svg"}
                alt={partner.name}
                width={150}
                height={50}
                className="object-contain"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

