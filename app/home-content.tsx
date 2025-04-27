"use client"
import { motion, useScroll, useTransform, useMotionValue, useInView } from "framer-motion"
import { useRef } from "react"
import { Diamond, Sparkles, Facebook, Instagram, Linkedin, Twitter, Star, Award, Gem } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import BusinessHours from "@/components/BusinessHours"
import Marquee from "react-fast-marquee"
import Link from "next/link"

export default function Home() {
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const shapesRef = useRef(null)
  const aboutRef = useRef(null)
  const partnersRef = useRef(null)
  const contactRef = useRef(null)

  const isHeroInView = useInView(heroRef, { once: false })
  const isShapesInView = useInView(shapesRef, { once: true, margin: "-100px" })
  const isAboutInView = useInView(aboutRef, { once: true, margin: "-100px" })
  const isPartnersInView = useInView(partnersRef, { once: true, margin: "-100px" })
  const isContactInView = useInView(contactRef, { once: true, margin: "-100px" })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // For parallax effects
  const logoY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"])
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "20%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  // For mouse follow effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

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

  // Hero section animation variants
  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.9],
        staggerChildren: 0.2
      }
    }
  }

  const heroChildVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  }

  // Diamond shape variants
  const shapeContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const shapeItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      rotate: [-1, 1, 0],
      filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))",
      transition: {
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 10
        },
        rotate: {
          repeat: Infinity,
          repeatType: "mirror",
          duration: 0.3
        }
      }
    }
  }

  // About section variants
  const aboutContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.7,
        ease: [0.215, 0.61, 0.355, 1]
      }
    }),
    hover: {
      y: -10,
      boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
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
      }
    },
  }

  // Logos section variants
  const logoContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const logoItemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    },
    hover: {
      scale: 1.1,
      filter: "brightness(1.1)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  }

  // Social icon variants
  const socialIconVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    }),
    hover: {
      scale: 1.2,
      rotate: [0, 10, -10, 0],
      transition: {
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 10
        },
        rotate: {
          duration: 0.3,
          ease: "easeInOut"
        }
      }
    }
  }

  // Sparkle animation for diamond effects
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        repeat: Infinity,
        duration: 2
      }
    }
  }

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50"
          style={{ y: logoY }}
        ></motion.div>

        {/* Animated background particles for diamond-like sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 8 + 2 + "px",
                height: Math.random() * 8 + 2 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)"
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.8, 0.1]
              }}
              transition={{
                repeat: Infinity,
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          variants={heroVariants}
          initial="hidden"
          animate={isHeroInView ? "visible" : "hidden"}
          className="text-center px-4 max-w-4xl mx-auto z-10 relative"
        >
          <motion.h2
            variants={heroChildVariants}
            className="text-5xl md:text-7xl font-serif mb-6 relative"
          >
            Your Journey to Timeless Beauty Begins Here
            <motion.div
              className="absolute -top-10 -right-10 md:-right-20 text-yellow-400"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 4
              }}
            >
              <Diamond className="w-10 h-10 md:w-16 md:h-16" />
            </motion.div>
          </motion.h2>

          <motion.p
            variants={heroChildVariants}
            className="text-xl text-gray-600 mb-8"
          >
            Whether you&apos;re marking a milestone or creating a bespoke design, our diamonds are the perfect
            expression of love and luxury
          </motion.p>

          <motion.div
            variants={heroChildVariants}
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth/signup">
              <motion.div className="inline-block">
                <Button
                  size="lg"
                  className="relative overflow-hidden group"
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                    animate={{
                      x: ["0%", "100%", "0%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "mirror",
                      duration: 2
                    }}
                  />
                  <span className="relative z-10">Get Started</span>

                  {/* Sparkle effect */}
                  <motion.span
                    className="absolute top-0 right-0 -mt-1 -mr-1"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="absolute top-1/4 left-1/4"
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
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute top-1/3 right-1/4"
            animate={{
              y: [0, -20, 0],
              rotate: [0, -5, 0, 5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </motion.div>

          <motion.div
            className="absolute bottom-1/4 left-1/3"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, 0, -10, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee section */}
      <motion.div
        className="w-full bg-background text-black py-3 overflow-hidden border-t border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Marquee
          speed={40}
          gradient={false}
          className="py-1"
        >
          {Array(2).fill(null).map((_, index) => (
            <div key={index} className="flex items-center">
              <span className="mx-4 font-medium">Lab Grown (CVD, HPHT), Colored and Natural Diamond, Custom Jewelery</span>
              <motion.span
                className="mx-4 text-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2
                }}
              >
                <Diamond className="w-4 h-4 inline-block" />
              </motion.span>
            </div>
          ))}
        </Marquee>
      </motion.div>

      {/* Diamond Shapes */}
      <section
        ref={shapesRef}
        className="py-20 bg-background overflow-hidden"
      >
        <div className="container mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isShapesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="text-4xl font-serif text-center mb-6"
          >
            Discover Our Shapes
          </motion.h3>

          <motion.div
            className="w-20 h-1 bg-black/20 rounded-full mx-auto mb-12"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isShapesInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ delay: 0.2 }}
          />

          <motion.div
            variants={shapeContainerVariants}
            initial="hidden"
            animate={isShapesInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center"
          >
            {DiscoverShapes.map((shape, index) => (
              <motion.div
                key={shape.name}
                variants={shapeItemVariants}
                whileHover="hover"
                className="relative w-40 h-40 flex flex-col items-center"
              >
                <div className="h-24 w-full relative mb-2">
                  <Image src={shape.url || "/placeholder.svg"} alt={shape.name} fill className="object-contain" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isShapesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-lg font-medium mt-2"
                >
                  {shape.name}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        className="py-32 bg-background relative overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={isAboutInView ? { opacity: 0.5 } : { opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Decorative elements */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              variants={sparkleVariants}
              initial="hidden"
              animate="visible"
              className="absolute"
              style={{
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
              transition={{ delay: Math.random() * 2 }}
            >
              <Sparkles className={`w-${Math.floor(Math.random() * 3) + 4} h-${Math.floor(Math.random() * 3) + 4} text-${['yellow', 'blue', 'purple'][Math.floor(Math.random() * 3)]}-400`} />
            </motion.div>
          ))}
        </motion.div>

        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate={isAboutInView ? "visible" : "hidden"}
            variants={aboutContainerVariants}
            className="text-center mb-20"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15
              }}
              className="inline-block"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6
                }}
              >
                <Diamond className="w-14 h-14 mx-auto mb-6 text-gray-800" />
              </motion.div>
            </motion.div>

            <motion.h2
              variants={{
                hidden: { opacity: 0, y: -50 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="text-5xl font-serif mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600"
            >
              About Cranberri Diamonds
            </motion.h2>

            <motion.div
              variants={{
                hidden: { scaleX: 0 },
                visible: { scaleX: 1 }
              }}
              transition={{ delay: 0.3 }}
              className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-600 mx-auto rounded-full"
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {aboutItems.map((item, index) => (
              <motion.div
                key={item.title}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate={isAboutInView ? "visible" : "hidden"}
                whileHover="hover"
                className={`relative p-8 rounded-2xl bg-background backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden`}
              >
                {/* Card background effect */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-40`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ delay: 0.3 }}
                />

                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  animate={isAboutInView ? "visible" : "hidden"}
                  whileHover={{
                    rotate: [0, 10, -10, 0],
                    transition: {
                      repeat: Infinity,
                      repeatType: "mirror",
                      duration: 0.5
                    }
                  }}
                  className={`w-16 h-16 mx-auto mb-6 rounded-xl bg-white shadow-lg flex items-center justify-center ${item.iconColor}`}
                >
                  <item.icon className="w-8 h-8" />
                </motion.div>

                <motion.h3
                  className="text-2xl font-serif mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {item.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 leading-relaxed relative z-10"
                >
                  {item.content}
                </motion.p>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Partners */}
      <section
        ref={partnersRef}
        className="py-20 bg-background"
      >
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isPartnersInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="text-4xl font-serif text-center mb-6"
          >
            Certification Partners
          </motion.h2>

          <motion.div
            className="w-20 h-1 bg-black/20 rounded-full mx-auto mb-16"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isPartnersInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ delay: 0.2 }}
          />

          <motion.div
            variants={logoContainerVariants}
            initial="hidden"
            animate={isPartnersInView ? "visible" : "hidden"}
            className="flex flex-wrap justify-center items-center gap-12 md:gap-20"
          >
            {certificationLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                variants={logoItemVariants}
                whileHover="hover"
                custom={index}
                className="relative w-40 h-40 flex items-center justify-center"
              >
                <motion.div
                  className="absolute inset-0 bg-white/50 rounded-full filter blur-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    delay: index * 0.5
                  }}
                />
                <div className="relative w-32 h-32">
                  <Image src={logo.url || "/placeholder.svg"} alt={logo.name} fill className="object-contain" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Partners */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isPartnersInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.2
            }}
            className="text-4xl font-serif text-center mb-6"
          >
            Our Partners
          </motion.h2>

          <motion.div
            className="w-20 h-1 bg-black/20 rounded-full mx-auto mb-16"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isPartnersInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ delay: 0.4 }}
          />

          <motion.div
            variants={logoContainerVariants}
            initial="hidden"
            animate={isPartnersInView ? "visible" : "hidden"}
            className="flex flex-wrap justify-center items-center gap-10 md:gap-16"
          >
            {PartnerLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                variants={logoItemVariants}
                custom={index}
                whileHover="hover"
                className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center"
              >
                <motion.div
                  className="relative w-24 h-24 md:w-32 md:h-32"
                  whileHover={{
                    scale: 1.1,
                    filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))"
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }}
                >
                  <Image src={logo.url || "/placeholder.svg"} alt={logo.name} fill className="object-contain" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        ref={contactRef}
        className="py-20 bg-background relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <motion.div
          className="absolute top-20 left-10 hidden md:block"
          variants={sparkleVariants}
          initial="hidden"
          animate={isContactInView ? "visible" : "hidden"}
        >
          <Diamond className="w-8 h-8 text-gray-200" />
        </motion.div>

        <motion.div
          className="absolute bottom-20 right-10 hidden md:block"
          variants={sparkleVariants}
          initial="hidden"
          animate={isContactInView ? "visible" : "hidden"}
          transition={{ delay: 0.7 }}
        >
          <Diamond className="w-6 h-6 text-gray-200" />
        </motion.div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-serif mb-6 relative inline-block">
              Get in touch!
              <motion.div
                className="absolute -top-4 -right-8"
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isContactInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mb-8"
            >
              Looking for something special? Have a question? Let us know, and we&apos;ll get back to you soon.
            </motion.p>

            <motion.a
              href="https://wa.me/918452872491"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded w-full max-w-xs mx-auto no-underline transition-colors duration-300 my-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Removed the animated gradient span */}
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.72.045.419-.1.824z" />
                </svg>
                Message us on WhatsApp
              </span>
            </motion.a>

            <div className="space-y-4 mt-8">
              <motion.p
                className="font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.4 }}
              >
                Cranberri Diamonds
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.5 }}
              >
                16, Chandrakant Bhavan, Marolnaka, Andheri (East) Mumbai 400 059
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.6 }}
              >
                <motion.a
                  href="mailto:info@cranberridiamonds.in"
                  className="text-blue-600 hover:underline relative overflow-hidden group"
                  whileHover="hover"
                >
                  <span>info@cranberridiamonds.in</span>
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    variants={{
                      initial: { scaleX: 0 },
                      hover: { scaleX: 1 }
                    }}
                    initial="initial"
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              </motion.p>

              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={isContactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.7 }}
              >
                <p>+91 929 297 9769</p>
                <p>+91 845 287 2491</p>
                <p>+91 845 197 7249</p>
              </motion.div>

              <BusinessHours />

              <motion.div
                className="flex justify-center space-x-6 mt-10"
                initial={{ opacity: 0 }}
                animate={isContactInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.9 }}
              >
                {[
                  { icon: Facebook, href: "https://www.facebook.com/people/Cranberri-Diamond/pfbid0E3bDNhPBJSBiV4PZXqSE83PD8iXVmbXxJ833gvKYkRuqh9sfN7nF4hrzvYG1pTuWl/?mibextid=LQQJ4d", color: "text-blue-600" },
                  { icon: Instagram, href: "https://www.instagram.com/Cranberri.life/#", color: "text-pink-600" },
                  { icon: Linkedin, href: "https://www.linkedin.com/company/cranberri-diamonds/", color: "text-blue-800" },
                  { icon: Twitter, href: "https://x.com/CranberriDiam", color: "text-gray-800" }
                ].map((social, i) => (
                  <motion.a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={i}
                    variants={socialIconVariants}
                    initial="hidden"
                    animate={isContactInView ? "visible" : "hidden"}
                    whileHover="hover"
                    className={`${social.color} w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md`}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}