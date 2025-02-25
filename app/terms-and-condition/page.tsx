"use client";

import { motion } from "framer-motion";
import { Scroll, ShieldCheck, RefreshCw,  FileText } from "lucide-react";

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

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5 }
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <motion.div 
        initial="initial"
        animate="animate"
        variants={stagger}
        className="max-w-4xl mx-auto px-4 py-16 space-y-12"
      >
        <motion.div variants={fadeIn} className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Terms and Conditions</h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Scroll className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Agreement Overview</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Your Terms and Conditions section is like a contract between you and your customers. You make information 
            and services available to your customers, and your customers must follow your rules.
          </p>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Common Terms</h2>
          </div>
          <div className="space-y-4">
            {[
              "Withdraw and cancel services, and make financial transactions.",
              "Manage customer expectations, such as liability for information errors or website downtime.",
              "Explain your copyright rules, such as attribution, adaptation, commercial or non-commercial use, etc.",
              "Set rules for user behavior, like forbidding unlawful behavior, hate speech, bullying, promotions, spam, etc.",
              "Disable user accounts.",
              "Write down any other terms or conditions that protect you or your audience."
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={slideIn}
                className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm"
              >
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-primary" />
                <p className="text-gray-700">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Return and Refund Policy</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">30-Day Return Policy</h3>
              <p className="text-gray-600">We offer a 30-day return policy from the date of delivery.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Return Process</h3>
              <p className="text-gray-600">
                To initiate a return, please contact our customer service team at{" "}
                <a href="mailto:info@cranberridiamonds.in" className="text-primary hover:underline">
                  info@cranberridiamonds.in
                </a>
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Refunds</h3>
              <p className="text-gray-600">
                Once we receive your return, our quality assurance team will inspect the item. 
                If approved, a refund will be processed to your original method of payment within 15 business days.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Cancellations</h3>
              <p className="text-gray-600">
                Orders may be canceled within 24 hours of purchase without penalty, unless the item has already been shipped. 
                To cancel an order, please contact us immediately at{" "}
                <a href="mailto:smithp@cranberridiamonds.in" className="text-primary hover:underline">
                  smithp@cranberridiamonds.in
                </a>
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Non-Returnable Items</h3>
              <p className="text-gray-600">Engraved or customized items (unless defective).</p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif">Policy Updates</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600">
              We reserve the right to update or modify this return and refund policy at any time without prior notice. 
              Please review this policy periodically for changes.
            </p>
          </div>
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