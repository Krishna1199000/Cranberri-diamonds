"use client";

import { motion } from "framer-motion";
import {  Diamond,  Sparkles,  Scale,   Microscope,   BadgeCheck,   Info,   Facebook,   Instagram,   Linkedin,   Twitter } from "lucide-react";
import Image from "next/image";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const diamondAnimation = {
  initial: { scale: 0.9, rotate: -10 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    rotate: 5,
    transition: {
      duration: 0.3
    }
  }
};

const floatAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function Beyond4Cs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="max-w-6xl mx-auto px-4 py-16 space-y-16"
      >
        {/* Header Section */}
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Diamond Quality Chart</h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
            Understanding the 4 C&apos;s of diamonds - Cut, Color, Clarity, and Carat - is essential for making an informed diamond purchase.
          </p>
        </motion.div>

        {/* Quality Chart Pyramid */}
        <motion.div 
          variants={fadeIn}
          className="relative w-full max-w-2xl mx-auto"
        >
          <Image
            src="https://images.unsplash.com/photo-1600703136783-bdb5ea365239?auto=format&fit=crop&w=800"
            alt="Diamond Quality Chart"
            width={800}
            height={600}
            className="w-full rounded-lg shadow-lg"
          />
        </motion.div>

        
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Diamond className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">Cut</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                The cut of a diamond refers to how well it has been shaped and faceted, and it affects how light reflects and disperses within the stone. It is the most important factor for determining a diamond&apos;s overall beauty. A well-cut diamond will sparkle more.
              </p>
              <p className="text-gray-600">
                The cut grade includes the proportions, symmetry, and polish of the diamond. The quality of the cut can range from Poor to Excellent.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                variants={diamondAnimation}
                whileHover="hover"
                className="bg-white p-4 rounded-lg shadow-md text-center"
              >
                <Image
                  src="https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=300"
                  alt="Shallow Cut"
                  width={300}
                  height={300}
                  className="w-full rounded"
                />
                <p className="mt-2 font-medium">Shallow</p>
              </motion.div>
              <motion.div
                variants={diamondAnimation}
                whileHover="hover"
                className="bg-white p-4 rounded-lg shadow-md text-center"
              >
                <Image
                  src="https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=300"
                  alt="Ideal Cut"
                  width={300}
                  height={300}
                  className="w-full rounded"
                />
                <p className="mt-2 font-medium">Ideal</p>
              </motion.div>
              <motion.div
                variants={diamondAnimation}
                whileHover="hover"
                className="bg-white p-4 rounded-lg shadow-md text-center"
              >
                <Image
                  src="https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=300"
                  alt="Deep Cut"
                  width={300}
                  height={300}
                  className="w-full rounded"
                />
                <p className="mt-2 font-medium">Deep</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Color Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">Color</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Diamonds come in a range of colors, from colorless to shades of yellow and brown. The color scale typically ranges from D (colorless) to Z (light yellow or brown). Colorless diamonds (D-F) are the most valuable, as they allow more light to pass through them, increasing their brilliance.
              </p>
              <p className="text-gray-600">
                G-J diamonds are near colorless and may have slight traces of color detectable only by an expert. As the scale moves toward K-Z, the presence of color becomes more noticeable.
              </p>
            </div>
            
            <motion.div
              variants={fadeIn}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <Image
                src="https://images.unsplash.com/photo-1600703136783-bdb5ea365239?auto=format&fit=crop&w=800"
                alt="Diamond Color Scale"
                width={800}
                height={400}
                className="w-full rounded"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Clarity Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Microscope className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">Clarity</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Clarity refers to the presence of internal (inclusions) and external (blemishes) imperfections in a diamond. These imperfections can affect the diamond&apos;s appearance and brilliance, but many are microscopic and invisible to the naked eye. The clarity of a diamond is graded on a scale from Flawless (FL), meaning no visible imperfections, to Included (I1, I2, I3).
              </p>
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-md"
                variants={floatAnimation}
                animate="animate"
              >
                <h3 className="font-semibold mb-2">Clarity Scale:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-primary" />
                    <span>FL (Flawless)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-primary" />
                    <span>VVS1-VVS2 (Very Very Slightly Included)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-primary" />
                    <span>VS1-VS2 (Very Slightly Included)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-primary" />
                    <span>SI1-SI2 (Slightly Included)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-primary" />
                    <span>I1-I3 (Included)</span>
                  </li>
                </ul>
              </motion.div>
            </div>
            
            <motion.div
              variants={fadeIn}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <Image
                src="/clarity-chart.jpg"
                alt="Diamond Clarity Chart"
                width={800}
                height={400}
                className="w-full rounded"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Carat Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">Carat</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                Carat refers to the weight of a diamond, not its size, though the two are often correlated. One carat equals 200 milligrams (0.2 grams). The term carat is derived from the carob tree&apos;s seeds, which were historically used as a standard for weighing gemstones.
              </p>
              <p className="text-gray-600">
                Larger diamonds are rarer and typically more expensive because of their scarcity, but the price is also influenced by the other 3 Cs—cut, color, and clarity.
              </p>
            </div>
            
            <motion.div
              variants={fadeIn}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <Image
                src="https://images.unsplash.com/photo-1600703136783-bdb5ea365239?auto=format&fit=crop&w=800"
                alt="Diamond Carat Comparison"
                width={800}
                height={400}
                className="w-full rounded"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* The 5th C - Certification Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <BadgeCheck className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">The 5th C - Certification</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                While the traditional 4 C&apos;s are crucial, the fifth C - Certification - is equally important. A diamond certificate from a reputable laboratory like GIA provides an unbiased assessment of your diamond&apos;s quality.
              </p>
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-md"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-semibold mb-2">Why Certification Matters:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span>Independent verification of quality</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span>Protection against misrepresentation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span>Resale value assurance</span>
                  </li>
                </ul>
              </motion.div>
            </div>
            
            <motion.div
              variants={fadeIn}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <Image
                src="/gia-certificate.jpg"
                alt="GIA Certificate"
                width={800}
                height={400}
                className="w-full rounded"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Diamond Anatomy Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-serif">Diamond Anatomy</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">
                The anatomy of a diamond refers to its various parts and the way they contribute to the overall appearance, brilliance, and value of the stone. A diamond&apos;s anatomy can be broken down into several key components:
              </p>
              <motion.div 
                className="bg-white p-6 rounded-lg shadow-md space-y-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Table:</h3>
                  <p className="text-gray-600">The flat, top surface of the diamond, which is the largest facet. The table allows light to enter the diamond, and its size and quality influence the stone brilliance.</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Crown:</h3>
                  <p className="text-gray-600">The upper portion of the diamond above the girdle, including the table. The crown consists of several facets (usually 32 in total) and plays a significant role in reflecting light.</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Girdle:</h3>
                  <p className="text-gray-600">The outer edge or circumference of the diamond, where the crown meets the pavilion. The girdle serves as a band that holds the diamond in its setting.</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Pavilion:</h3>
                  <p className="text-gray-600">The lower portion of the diamond, below the girdle. It creates the diamond sparkle through light refraction and dispersion.</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Culet:</h3>
                  <p className="text-gray-600">The very tip or bottom point of the pavilion. A well-formed culet is important for the overall symmetry of the diamond.</p>
                </div>
              </motion.div>
            </div>
            
            <div className="space-y-6">
              <motion.div
                variants={fadeIn}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <Image
                  src="/diamond-anatomy.jpg"
                  alt="Diamond Anatomy"
                  width={800}
                  height={400}
                  className="w-full rounded"
                />
              </motion.div>
              
              <motion.div
                variants={diamondAnimation}
                whileHover="hover"
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <Image
                  src="/diamond-proportions.jpg"
                  alt="Diamond Proportions"
                  width={800}
                  height={400}
                  className="w-full rounded"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Connect With Us Section */}
        <motion.section variants={fadeIn} className="space-y-8">
          <h2 className="text-3xl font-serif text-center">Connect With Us</h2>
          <motion.div 
            className="flex justify-center gap-8"
            variants={stagger}
          >
            <motion.a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Facebook className="w-6 h-6 text-[#1877F2]" />
            </motion.a>
            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-6 h-6 text-[#E4405F]" />
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-6 h-6 text-black" />
            </motion.a>
          </motion.div>
        </motion.section>

        <motion.footer 
          variants={fadeIn} 
          className="text-center text-gray-500 pt-8 border-t space-y-4"
        >
          <p>Copyright © 2025 Cranberri Diamonds - All Rights Reserved.</p>
          
            
        
        </motion.footer>
      </motion.div>
    </div>
  );
}