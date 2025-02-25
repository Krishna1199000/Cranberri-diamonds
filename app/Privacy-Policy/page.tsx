"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Bell, Cookie, FileText, Phone } from "lucide-react";

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

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        initial="initial"
        animate="animate"
        variants={stagger}
        className="max-w-4xl mx-auto px-4 py-16 space-y-12"
      >
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Privacy Policy</h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Information We Collect</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Welcome to Cranberri Diamonds Privacy Policy. This policy outlines how we collect, use, disclose,
            and protect your information when you visit our website www.cranberridiamonds.in. Please
            read this policy carefully. By accessing or using our Website, you agree to the terms of this
            Privacy Policy.
          </p>
          <ul className="space-y-3 text-gray-600 pl-6 list-disc">
            <li>
              <span className="font-medium">Personal Information:</span> We collect personal information you provide to us voluntarily,
              such as your name, email address, phone number, and any other details you choose to share.
            </li>
            <li>
              <span className="font-medium">Usage Data:</span> We automatically collect information about your interactions with our Website,
              including IP address, browser type, pages visited, and timestamps.
            </li>
          </ul>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Use of Information</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">We use the information we collect for the following purposes:</p>
          <ul className="space-y-3 text-gray-600 pl-6 list-disc">
            <li>To provide and maintain our Website, including customer support.</li>
            <li>To improve and personalize our Website&apos;s features and services.</li>
            <li>To communicate with you, including responding to inquiries and sending updates.</li>
          </ul>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Disclosure of Information</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">We may disclose your information:</p>
          <ul className="space-y-3 text-gray-600 pl-6 list-disc">
            <li>To our affiliates, service providers, and partners who assist us in operating our Website.</li>
            <li>When required by law or to protect our rights and property.</li>
          </ul>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Cookies and Tracking Technologies</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Our Website uses cookies and similar tracking technologies to enhance user experience,
            analyze trends, and gather demographic information about our user base.
          </p>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Changes to This Privacy Policy</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of any changes by posting
            the updated Privacy Policy on our Website with a new effective date.
          </p>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Contact Us</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions or concerns about this Privacy Policy, please contact us at{" "}
            <a href="mailto:info@cranberridiamonds.in" className="text-primary hover:underline">
              info@cranberridiamonds.in
            </a>
            {" "}or +91 845 287 2491
          </p>
        </motion.section>

        <motion.footer 
          variants={fadeIn} 
          className="text-center text-gray-500 pt-8 border-t"
        >
          <p>Copyright © 2025 Cranberri Diamonds - All Rights Reserved.</p>
        </motion.footer>
      </motion.div>
    </div>
  );
}