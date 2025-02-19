"use client"

import { motion } from "framer-motion"
import { Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ContactSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in touch!</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Looking for something special? Have a question? Let us know, and we'll get back to you soon.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-rose-400 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-gray-600">
                  16, Chandrakant Bhavan, Marolnaka,
                  <br />
                  Andheri (East) Mumbai 400 059
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-rose-400 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Phone</h3>
                <div className="space-y-1 text-gray-600">
                  <p>+1 929 297 9769</p>
                  <p>+91 845 287 2491</p>
                  <p>+91 845 197 7249</p>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-rose-400 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">Info@cranberridiamonds.in</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-rose-400 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Hours</h3>
                <p className="text-gray-600">Open today 09:00 am – 05:00 pm</p>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <motion.a whileHover={{ scale: 1.1 }} href="#" className="bg-gray-100 p-2 rounded-full">
                <Facebook className="w-6 h-6 text-gray-600" />
              </motion.a>
              <motion.a whileHover={{ scale: 1.1 }} href="#" className="bg-gray-100 p-2 rounded-full">
                <Instagram className="w-6 h-6 text-gray-600" />
              </motion.a>
              <motion.a whileHover={{ scale: 1.1 }} href="#" className="bg-gray-100 p-2 rounded-full">
                <Linkedin className="w-6 h-6 text-gray-600" />
              </motion.a>
              <motion.a whileHover={{ scale: 1.1 }} href="#" className="bg-gray-100 p-2 rounded-full">
                <Twitter className="w-6 h-6 text-gray-600" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] mb-6">
              Message us on WhatsApp
            </Button>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea rows={4} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-400" />
              </div>
              <Button size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

