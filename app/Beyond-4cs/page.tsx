'use client';

import { useState, useEffect } from 'react';
import { Eye, Scissors, Scale, Heart, Sparkles, ArrowRight, Star, Award, Gem, Zap } from 'lucide-react';
import Navbar from "@/components/navbar";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Beyond4Cs() {
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const traditional4Cs = [
    {
      icon: Scissors,
      title: 'Cut',
      description: 'Precision craftsmanship that unleashes brilliance',
      detail: 'Expert artisans shape each diamond to maximize its fire and scintillation through mathematical precision.',
      grade: 'Excellent',
    },
    {
      icon: Eye,
      title: 'Clarity',
      description: 'Pure transparency revealing natural beauty',
      detail: 'Each diamond is carefully selected for its exceptional clarity, with inclusions mapped and graded.',
      grade: 'VVS1-FL',
    },
    {
      icon: Heart,
      title: 'Color',
      description: 'Spectrum of elegance from crystal clear to warm hues',
      detail: 'From colorless D-grade to fancy colors, each diamond tells its unique chromatic story.',
      grade: 'D-F',
    },
    {
      icon: Scale,
      title: 'Carat',
      description: 'Weight that measures dreams and desires',
      detail: 'Every carat represents moments of joy and milestones of love, precisely measured to 0.01ct.',
      grade: '0.50-5.00ct',
    },
  ];

  const beyondCs = [
    {
      icon: Zap,
      title: 'Light Performance',
      description: 'Advanced optical analysis beyond traditional grading',
      detail: 'Using cutting-edge technology to measure brilliance, fire, and scintillation with scientific precision.',
    },
    {
      icon: Star,
      title: 'Craftsmanship',
      description: 'Artisan expertise passed through generations',
      detail: 'Master craftsmen with decades of experience create each piece with unparalleled attention to detail.',
    },
    {
      icon: Award,
      title: 'Provenance',
      description: 'Complete traceability from mine to market',
      detail: 'Every diamond comes with full documentation of its ethical journey and responsible sourcing.',
    },
    {
      icon: Gem,
      title: 'Character',
      description: 'The unique personality of each stone',
      detail: 'Beyond grades and measurements, we celebrate the individual beauty and story of every diamond.',
    },
  ];

  const heroSlides = [
    {
      image: '/Beyond.png',
      title: 'Beyond 4Cs',
      subtitle: 'Redefining diamond excellence through innovation',
    },
    {
      image: '/Beyond1.png',
      title: 'True Excellence',
      subtitle: 'Where traditional standards meet modern innovation',
    },
    {
      image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      title: 'Perfect Harmony',
      subtitle: 'Balancing science, art, and ethical responsibility',
    },
  ];

  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt="Diamond Excellence"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-white/70" />
            </div>
          ))}
        </div>
        
        <div 
          className="relative z-10 text-center px-8 max-w-6xl mx-auto"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        >
          <div className="inline-flex items-center gap-3 mb-8 animate-bounce">
            <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
            <Gem className="w-12 h-12 text-black animate-spin-slow" />
            <Star className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          
          <h1 className="text-8xl md:text-9xl font-light mb-8 tracking-wide animate-fade-in-up">
            {heroSlides[currentSlide].title.split(' ').map((word, index) => (
              <span
                key={index}
                className="inline-block animate-slide-in-up"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {word}&nbsp;
              </span>
            ))}
          </h1>
          
          <p className="text-2xl md:text-4xl font-light mb-12 text-black/80 animate-fade-in-up animation-delay-300">
            {heroSlides[currentSlide].subtitle}
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-blue-600 scale-125' : 'bg-black/30'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Traditional 4Cs Section */}
      <section className="py-32 px-8 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-light mb-8">The Traditional 4Cs</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">
              The foundation of diamond grading, perfected through decades of expertise and precision.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {traditional4Cs.map((item, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-4 transition-all duration-500 border border-black/10"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-blue-600 mb-2">{item.grade}</div>
                </div>
                
                <h3 className="text-2xl font-light mb-4">{item.title}</h3>
                <p className="text-black/70 mb-4">{item.description}</p>
                <p className="text-sm text-black/60 leading-relaxed">{item.detail}</p>
                
                <div className="mt-6 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beyond Section */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-light mb-8">Going Beyond</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">
              We&apos;ve expanded the traditional framework to include modern innovations and ethical considerations 
              that define true diamond excellence in the 21st century.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            {beyondCs.map((feature, index) => (
              <div
                key={index}
                className="group flex gap-8 p-8 rounded-3xl bg-gradient-to-br from-white to-blue-50/50 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-light mb-3">{feature.title}</h3>
                  <p className="text-black/70 mb-4 text-lg">{feature.description}</p>
                  <p className="text-sm text-black/60 leading-relaxed">{feature.detail}</p>
                  
                  <div className="mt-6 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Innovation */}
      <section className="py-32 px-8 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className="space-y-8"
              style={{
                transform: `translateY(${Math.max(0, scrollY - 1600) * -0.1}px)`,
              }}
            >
              <h2 className="text-6xl font-light mb-8">Scientific Precision</h2>
              
              <p className="text-xl leading-relaxed text-black/80">
                Our advanced gemological laboratory uses cutting-edge technology to analyze every aspect 
                of diamond performance, from light return to optical symmetry, ensuring each stone meets 
                our exacting standards.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">ASET Analysis</div>
                    <div className="text-sm text-black/60">Advanced light performance measurement</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Hearts & Arrows</div>
                    <div className="text-sm text-black/60">Perfect optical symmetry verification</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Triple Certification</div>
                    <div className="text-sm text-black/60">GIA, AGS, and internal grading</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className="relative"
              style={{
                transform: `translateY(${Math.max(0, scrollY - 1600) * 0.05}px)`,
              }}
            >
              <Image
                src="/Beyond1.png"
                alt="Diamond Technology"
                width={800}
                height={600}
                className="w-full rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-100 rounded-full shadow-xl flex items-center justify-center animate-float">
                <Gem className="w-16 h-16 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Gallery */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-light text-center mb-20">Excellence Redefined</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                src: '/Beyond.png',
                title: 'Traditional Grading',
                description: 'Classic 4Cs assessment'
              },
              {
                src: '/Beyond1.png',
                title: 'Advanced Analysis',
                description: 'Scientific light performance'
              },
              {
                src: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&fit=crop',
                title: 'Beyond Excellence',
                description: 'Complete quality assurance'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-700"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  width={400}
                  height={384}
                  className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-xl font-light mb-2">{item.title}</h3>
                  <p className="text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-light mb-8">Experience the Difference</h2>
          <p className="text-xl mb-12 text-white/80">
            Discover how our comprehensive approach to diamond grading ensures you receive 
            not just a beautiful stone, but a masterpiece of nature and craftsmanship.
          </p>
          
          <button 
            onClick={() => router.push('/auth/signup')}
            className="group px-12 py-4 bg-blue-600 text-white rounded-full text-lg font-light hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3">
              Explore Our Standards
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </section>
    </>
  );
}