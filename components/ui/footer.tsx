"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Diamond, Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

const Footer = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
        stiffness: 100,
        damping: 15
      }
    }
  }

  const linkVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  }

  const socialIconVariants = {
    hover: {
      scale: 1.2,
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  }

  // Footer link sections
  const footerLinks = [
    {
      title: "Information",
      links: [
        { name: "Terms & Condition", href: "/terms" },
        { name: "About Us", href: "/about" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Contact Us", href: "/contact" },
      ]
    },
    {
      title: "Follow Us",
      social: [
        { icon: Facebook, href: "https://www.facebook.com/people/Cranberri-Diamond/pfbid0E3bDNhPBJSBiV4PZXqSE83PD8iXVmbXxJ833gvKYkRuqh9sfN7nF4hrzvYG1pTuWl/?mibextid=LQQJ4d", color: "hover:text-blue-600" },
        { icon: Instagram, href: "https://www.instagram.com/Cranberri.life/#", color: "hover:text-pink-600" },
        { icon: Linkedin, href: "https://www.linkedin.com/company/cranberri-diamonds/", color: "hover:text-blue-800" },
        { icon: Twitter, href: "https://x.com/CranberriDiam", color: "hover:text-gray-800" }
      ]
    }
  ]

  return (
    <motion.footer 
      className="bg-gradient-to-b from-background to-slate-100 pt-16 border-t border-slate-200 relative overflow-hidden print:hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      {/* Decorative diamond elements */}
      <motion.div
        className="absolute top-12 left-10 opacity-10"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 5, 0, -5, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut"
        }}
      >
        <Diamond className="w-16 h-16" />
      </motion.div>
      
      <motion.div
        className="absolute bottom-12 right-10 opacity-10"
        animate={{
          y: [0, -15, 0],
          rotate: [0, -5, 0, 5, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: "easeInOut",
          delay: 1
        }}
      >
        <Diamond className="w-12 h-12" />
      </motion.div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo and company info */}
          <motion.div 
            className="col-span-1 md:col-span-2 lg:col-span-1"
            variants={itemVariants}
          >
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-80 h-60 mb-4">
                <Image 
                  src="/IMG_8981[1].png"
                  alt="Cranberri Diamonds Logo"
                  fill
                  className="object-contain"
                />
              </div>
            
              <motion.p
                className="text-base text-gray-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                We are broad supplier of an extensive inventory of type IIA lab-grown Diamonds at the best affordable price
              </motion.p>
            </div>
          </motion.div>

          {/* Contact information */}
          <motion.div 
            className="col-span-1"
            variants={itemVariants}
          >
            <h4 className="font-medium text-lg mb-4">Contact Us</h4>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                16, Chandrakant Bhavan, Marolnaka, Andheri (East) Mumbai 400 059
              </p>
              <p className="text-sm text-gray-600">
                <Link 
                  href="mailto:info@cranberridiamonds.in"
                  className="hover:text-primary transition-colors duration-300"
                >
                  info@cranberridiamonds.in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Footer Links - Information */}
          {footerLinks.map((section) => (
            <motion.div 
              key={section.title} 
              className="col-span-1"
              variants={itemVariants}
            >
              <h4 className="font-medium text-lg mb-4">{section.title}</h4>
              {section.links && (
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <motion.div
                        variants={linkVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Link 
                          href={link.href}
                          className="text-sm text-gray-600 hover:text-primary transition-colors duration-300 relative group"
                        >
                          {link.name}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Social Icons */}
              {section.social && (
                <div className="flex space-x-4 mt-4">
                  {section.social.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-full bg-slate-100 text-gray-600 transition-colors duration-300 ${social.color}`}
                      variants={socialIconVariants}
                      whileHover="hover"
                      aria-label={`Visit our ${social.icon.name} page`}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <motion.div 
          className="w-full h-px bg-slate-200 my-8"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        />

        {/* Copyright and credits */}
        <motion.div 
          className="py-6 text-center"
          variants={itemVariants}
        >
          <p className="text-sm text-gray-600 mb-2">© 2025 Cranberri Diamonds.</p>
          <p className="text-sm text-gray-600 mb-4">All rights reserved.</p>
          <p className="text-sm text-gray-600">
            Powered by{" "}
            <Link 
              href="https://portfolio-krishna-psi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Krishna
            </Link>
            , Mumbai, India
          </p>
        </motion.div>
      </div>
    </motion.footer>
  )
}

export default Footer