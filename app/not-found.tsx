"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Diamond, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center"
          >
            <Image
              src="/logo.png"
              alt="Cranberri Diamonds"
              width={120}
              height={120}
              className="w-24 h-24 md:w-32 md:h-32"
              priority
            />
          </motion.div>

          {/* 404 Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-slate-300 select-none">
              404
            </h1>
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Diamond className="h-5 w-5 text-blue-600" />
                Page Not Found
              </h2>
              <p className="text-base text-slate-600">
                The page you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col gap-3 justify-center items-center"
          >
            <Button asChild size="lg" className="w-full max-w-xs">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => window.history.back()}
              className="w-full max-w-xs"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 