"use client"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Diamond, Sparkles, Facebook, Instagram, Linkedin, Twitter, Star, Award, Gem } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import BusinessHours from "@/components/BusinessHours"
import Marquee from "react-fast-marquee"
import Link from "next/link"

export default function Home() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const logoY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"])

  const certificationLogos = [
    {
      name: "GCAL",
      url: "/e8310c82-41b0-4a1b-8cf9-3744c09f8176_removalai_preview.png",
    },
    {
      name: "IGI",
      url: "/23d688c0cc81dd2f7d4f41a84b6cfd92.png",
    },
    {
      name: "GIA",
      url: "/bfbb77ae2465ce3dbd7544459195ab57.png",
    },
  ]
  const PartnerLogos = [
    {
      name: "Payoneer",
      url: "/6102d9aca849c40004f9a134.png",
    },
    {
      name: "WISE",
      url: "/62a89334da9e7313e0262a70.png",
    },
    {
      name: "PAYPAL",
      url: "/580b57fcd9996e24bc43c530.png",
    },
    {
      name: "REMITLY",
      url: "/pinpng.com-rupee-sign-png-207821.png",
    },
    {
      name: "RAZORPAY",
      url: "/pngwing.com.png",
    },
  ]

  const DiscoverShapes = [
    {
      name: "Round",
      url: "/LABON - Search Inventory.png",
    },
    {
      name: "Princess",
      url: "/Princess.png",
    },
    {
      name: "Oval",
      url: "/Oval.png",
    },
    {
      name: "Emerald",
      url: "/Emerald.png",
    }
  ]


  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const aboutItems = [
    {
      title: "OUR STORY",
      icon: Star,
      content:
        "At Cranberri Diamonds, we believe that every diamond tells a story. Our journey began with a passion for exquisite craftsmanship and a commitment to excellence.",
      bgColor: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "OUR MISSION",
      icon: Award,
      content:
        "We empower jewelers by providing direct access to premium loose diamonds and custom jewelry at competitive prices, boosting profitability.",
      bgColor: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "OUR PRODUCT",
      icon: Gem,
      content:
        "We offer an exclusive selection of D-E color, VVS clarity loose diamonds (both natural and lab-grown), custom jewelry, and components—sourced directly from manufacturers.",
      bgColor: "from-amber-500/10 to-yellow-500/10",
      iconColor: "text-amber-500",
    },
  ]

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.7,
        ease: [0.215, 0.61, 0.355, 1],
      },
    }),
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    },
  }

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <motion.div
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50"
          style={{ y: logoY }}
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center px-4 max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-serif mb-6">Your Journey to Timeless Beauty Begins Here</h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you&apos;re marking a milestone or creating a bespoke design, our diamonds are the perfect
            expression of love and luxury
          </p>
          <Link href="/auth/signup">
          <Button size="lg" className="animate-pulse">
            Get Started
          </Button>
          </Link>
          
        </motion.div>
        
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="absolute top-1/4 left-1/4 w-6 h-6 text-yellow-400" />
          <Sparkles className="absolute top-1/3 right-1/4 w-8 h-8 text-yellow-400" />
          <Sparkles className="absolute bottom-1/4 left-1/3 w-4 h-4 text-yellow-400" />
        </motion.div>
      </section>
      <div className="w-full bg-black text-white py-2 overflow-hidden">
        <Marquee speed={50} gradient={false}>
          <span className="mx-4">Lab Grown (CVD, HPHT), Colored and Natural Diamond, Custom Jewelery</span>
          <span className="mx-4">•</span>
          <span className="mx-4">Lab Grown (CVD, HPHT), Colored and Natural Diamond, Custom Jewelery</span>
          <span className="mx-4">•</span>
        </Marquee>
      </div>
      {/* Diamond Shapes */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-serif text-center mb-12"
          >
            Discover Our Shapes
          </motion.h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {DiscoverShapes.map((shape, index) => (
              <motion.div
                key={shape.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative w-40 h-20"
              >
        
                <Image src={shape.url || "/placeholder.svg"} alt={shape.name} fill className="object-contain" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <Sparkles className="absolute top-20 left-1/4 w-6 h-6 text-yellow-400" />
          <Sparkles className="absolute top-40 right-1/3 w-4 h-4 text-purple-400" />
          <Sparkles className="absolute bottom-32 left-1/3 w-8 h-8 text-blue-400" />
        </motion.div>

        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <Diamond className="w-12 h-12 mx-auto mb-6 text-gray-800" />
            </motion.div>
            <motion.h2
              variants={fadeInUpVariants}
              className="text-5xl font-serif mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600"
            >
              About Cranberri Diamonds
            </motion.h2>
            <motion.div
              variants={fadeInUpVariants}
              className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-600 mx-auto rounded-full"
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {aboutItems.map((item, index) => (
              <motion.div
                key={item.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className={`relative p-8 rounded-2xl bg-gradient-to-br ${item.bgColor} backdrop-blur-sm border border-white/20 shadow-xl`}
              >
                <motion.div
                  variants={iconVariants}
                  className={`w-16 h-16 mx-auto mb-6 rounded-xl bg-white shadow-lg flex items-center justify-center ${item.iconColor}`}
                >
                  <item.icon className="w-8 h-8" />
                </motion.div>
                
                <h3 className="text-2xl font-serif mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                  {item.title}
                </h3>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 leading-relaxed"
                >
                  {item.content}
                </motion.p>

                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Partners */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUpVariants}
            className="text-4xl font-serif text-center mb-16"
          >
            Certification Partners
          </motion.h2>

          <div className="flex justify-center items-center space-x-12">
            {certificationLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { delay: index * 0.2 },
                  },
                }}
                className="relative w-40 h-20"
              >
                <Image src={logo.url || "/placeholder.svg"} alt={logo.name} fill className="object-contain" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUpVariants}
            className="text-4xl font-serif text-center mb-16"
          >
            Our Partners
          </motion.h2>

          <div className="flex justify-center items-center space-x-12">
            {PartnerLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { delay: index * 0.2 },
                  },
                }}
                className="relative w-40 h-20"
              >
                <Image src={logo.url || "/placeholder.svg"} alt={logo.name} fill className="object-contain" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUpVariants}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-serif mb-6">Get in touch!</h2>
            <p className="text-gray-600 mb-8">
              Looking for something special? Have a question? Let us know, and we&apos;ll get back to you soon.
            </p>
            <motion.a 
  href="https://wa.me/918452872491" 
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded w-full max-w-xs mx-auto no-underline transition-colors duration-300 my-6"
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="white"
  >
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.72.045.419-.1.824z"/>
  </svg>
  Message us on WhatsApp
</motion.a>
            <div className="space-y-4">
              <p className="font-medium">Cranberri Diamonds</p>
              <p>16, Chandrakant Bhavan, Marolnaka, Andheri (East) Mumbai 400 059</p>
              <p>
                <a href="mailto:info@cranberridiamonds.in" className="text-blue-600 hover:underline">
                  info@cranberridiamonds.in
                </a>
              </p>
              <div className="space-y-1">
                <p>+91 929 297 9769</p>
                <p>+91 845 287 2491</p>
                <p>+91 845 197 7249</p>
              </div>

              <BusinessHours/>

              <div className="flex justify-center space-x-6 mt-8">
                <motion.a href="https://www.facebook.com/people/Cranberri-Diamond/pfbid0E3bDNhPBJSBiV4PZXqSE83PD8iXVmbXxJ833gvKYkRuqh9sfN7nF4hrzvYG1pTuWl/?mibextid=LQQJ4d" whileHover={{ scale: 1.1 }} className="text-blue-600">
                  <Facebook className="w-6 h-6" />
                </motion.a>
                <motion.a href="https://www.instagram.com/Cranberri.life/#" whileHover={{ scale: 1.1 }} className="text-pink-600">
                  <Instagram className="w-6 h-6" />
                </motion.a>
                <motion.a href="https://www.linkedin.com/company/cranberri-diamonds/" whileHover={{ scale: 1.1 }} className="text-blue-800">
                  <Linkedin className="w-6 h-6" />
                </motion.a>
                <motion.a href="https://x.com/CranberriDiam" whileHover={{ scale: 1.1 }} className="text-gray-800">
                  <Twitter className="w-6 h-6" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

