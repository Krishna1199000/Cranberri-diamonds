"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link";

export default function VipSignup() {


  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-serif mb-6"
          >
            Join Our VIP List
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mb-8"
          >
            Be the first to hear about upcoming sales, hot trends, and new arrivals.
          </motion.p>
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <Input type="email" placeholder="Enter your email" className="flex-grow" />
            <motion.button >
              <Link href="/auth/signup">
              <Button className="whitespace-nowrap">
                Sign up
              </Button>
              </Link>
            
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </section>
  )
}

