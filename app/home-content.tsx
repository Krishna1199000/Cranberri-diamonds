"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Diamond, Sparkles, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/carousel";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  const diamondImages = [
    "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=1000",
    "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=1000",
    "https://images.unsplash.com/photo-1615655096345-61a54750068d?q=80&w=1000",
    "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1000",
  ];

  const certificationLogos = [
    {
      name: "GCAL",
      url: "https://www.gcalusa.com/images/gcal-logo.png"
    },
    {
      name: "IGI",
      url: "https://www.igi.org/images/IGI_Logo.png"
    },
    {
      name: "GIA",
      url: "https://www.gia.edu/sites/default/files/GIA_Logo.png"
    }
  ];

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <motion.div
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50"
          style={{ y: logoY }}
        >
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center px-4 max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-serif mb-6">
            Your Journey to Timeless Beauty Begins Here
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you&apos;re marking a milestone or creating a bespoke design, our diamonds are the perfect expression of love and luxury
          </p>
          <Button size="lg" className="animate-pulse">
            Explore Collection
          </Button>
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

      {/* Featured Collection */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-serif text-center mb-12"
          >
            Featured Collection
          </motion.h3>

          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {diamondImages.map((src, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <Image
                      src={src}
                      alt={`Diamond ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

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
            {['Round', 'Princess', 'Oval', 'Emerald'].map((shape, index) => (
              <motion.div
                key={shape}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-6 rounded-lg shadow-lg text-center"
              >
                <Diamond className="w-12 h-12 mx-auto mb-4" />
                <h4 className="text-xl font-medium">{shape}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUpVariants}
            className="text-4xl font-serif text-center mb-16"
          >
            About Cranberri Diamonds
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "OUR STORY",
                content: "At Cranberri Diamonds, we believe that every diamond tells a story. Our journey began with a passion for exquisite craftsmanship and a commitment to excellence."
              },
              {
                title: "OUR MISSION",
                content: "We empower jewelers by providing direct access to premium loose diamonds and custom jewelry at competitive prices, boosting profitability."
              },
              {
                title: "Our Product",
                content: "We offer an exclusive selection of D-E color, VVS clarity loose diamonds (both natural and lab-grown), custom jewelry, and components—sourced directly from manufacturers."
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.2 }
                  }
                }}
                className="text-center"
              >
                <Diamond className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                <h3 className="text-2xl font-serif mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUpVariants}
            className="text-4xl font-serif text-center mb-16"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              {
                question: "Are lab-grown diamonds real diamonds?",
                answer: "Yes, lab-grown diamonds are real diamonds. They have the same physical, chemical, and optical properties as natural diamonds. The only difference is that lab-grown diamonds are created in a laboratory, rather than mined from the Earth."
              },
              {
                question: "Are lab-grown diamonds cheaper than natural diamonds?",
                answer: "Yes, lab-grown diamonds are generally more affordable than natural diamonds because they are produced in a controlled environment and do not require the costly mining process. However, their value and price depend on the same factors that affect natural diamonds, such as carat weight, cut, clarity, and color."
              },
              {
                question: "Will my lab-grown diamond lose value over time?",
                answer: "While lab-grown diamonds generally cost less than natural diamonds, they do not appreciate in value over time like natural diamonds. However, they retain their intrinsic value due to their beauty, durability, and high-quality craftsmanship."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { delay: index * 0.2 }
                  }
                }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-medium mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
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
                    transition: { delay: index * 0.2 }
                  }
                }}
                className="relative w-40 h-20"
              >
                <Image
                  src={logo.url}
                  alt={logo.name}
                  fill
                  className="object-contain"
                />
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

            <div className="space-y-4">
              <p className="font-medium">Cranberri Diamonds</p>
              <p>16, Chandrakant Bhavan, Marolnaka, Andheri (East) Mumbai 400 059</p>
              <p>
                <a href="mailto:info@cranberridiamonds.in" className="text-blue-600 hover:underline">
                  info@cranberridiamonds.in
                </a>
              </p>
              <div className="space-y-1">
                <p>+1 929 297 9769</p>
                <p>+91 845 287 2491</p>
                <p>+91 845 197 7249</p>
              </div>

              <div className="mt-8">
                <h3 className="font-medium mb-4">Hours</h3>
                <div className="space-y-2">
                  {[
                    "Mon 09:00 am – 05:00 pm",
                    "Tue 09:00 am – 05:00 pm",
                    "Wed 09:00 am – 05:00 pm",
                    "Thu 09:00 am – 05:00 pm",
                    "Fri 09:00 am – 05:00 pm",
                    "Sat Closed",
                    "Sun Closed"
                  ].map((hours, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {hours}
                    </motion.p>
                  ))}
                </div>
              </div>

              <div className="flex justify-center space-x-6 mt-8">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-blue-600"
                >
                  <Facebook className="w-6 h-6" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-pink-600"
                >
                  <Instagram className="w-6 h-6" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-blue-800"
                >
                  <Linkedin className="w-6 h-6" />
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-800"
                >
                  <Twitter className="w-6 h-6" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}