'use client';

import { useState, useEffect } from 'react';
import { Leaf, Heart, Shield, Sparkles, ArrowRight, Globe, Recycle, Award } from 'lucide-react';
import Navbar from "@/components/navbar";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function NurtureNature() {
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

  const sustainabilityFeatures = [
    {
      icon: Globe,
      title: 'Carbon Neutral',
      description: 'Every diamond sourced with zero carbon footprint',
      detail: 'We offset 100% of our mining and transportation emissions through verified carbon credits and renewable energy initiatives.',
    },
    {
      icon: Recycle,
      title: 'Circular Economy',
      description: 'Sustainable practices from mine to market',
      detail: 'Our closed-loop system ensures minimal waste, with recycled materials used in packaging and operations.',
    },
    {
      icon: Shield,
      title: 'Ethical Sourcing',
      description: 'Conflict-free diamonds with full traceability',
      detail: 'Every stone comes with complete documentation of its ethical journey from source to your hands.',
    },
    {
      icon: Award,
      title: 'Certified Impact',
      description: 'Third-party verified sustainability standards',
      detail: 'Independently audited and certified by leading environmental and ethical organizations.',
    },
  ];

  const heroSlides = [
    {
      image: '/tree1.png',
      title: 'Nurture Nature',
      subtitle: 'Where diamonds meet environmental consciousness',
    },
    {
      image: 'https://images.pexels.com/photos/1438761/pexels-photo-1438761.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      title: 'Sustainable Beauty',
      subtitle: 'Preserving Earth while creating timeless treasures',
    },
    {
      image: '/tree2.png',
      title: 'Ethical Excellence',
      subtitle: 'Diamonds that honor both nature and craftsmanship',
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
                alt="Nature Diamond"
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
            <Leaf className="w-10 h-10 text-green-600 animate-pulse" />
            <Sparkles className="w-12 h-12 text-black animate-spin-slow" />
            <Heart className="w-10 h-10 text-green-600 animate-pulse" />
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
                  index === currentSlide ? 'bg-green-600 scale-125' : 'bg-black/30'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-32 px-8 bg-gradient-to-b from-white to-green-50/30">
        <div className="max-w-6xl mx-auto text-center">
          <div 
            className="space-y-8"
            style={{
              transform: `translateY(${Math.max(0, scrollY - 600) * -0.1}px)`,
            }}
          >
            <div className="inline-flex items-center gap-4 mb-8">
              <Leaf className="w-16 h-16 text-green-600 animate-float" />
              <h2 className="text-6xl font-light">Our Earth Promise</h2>
            </div>
            
            <p className="text-2xl leading-relaxed text-black/80 max-w-4xl mx-auto">
              We believe luxury should never come at the expense of our planet. Every diamond in our collection 
              represents a commitment to environmental stewardship, ethical sourcing, and sustainable practices 
              that protect the Earth for future generations.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 pt-16">
              <div className="text-center p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="text-4xl font-light mb-4 text-green-600">100%</div>
                <div className="text-lg font-medium mb-2">Renewable Energy</div>
                <div className="text-sm text-black/60">All operations powered by clean energy sources</div>
              </div>
              <div className="text-center p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="text-4xl font-light mb-4 text-green-600">Zero</div>
                <div className="text-lg font-medium mb-2">Conflict Diamonds</div>
                <div className="text-sm text-black/60">Complete traceability and ethical sourcing</div>
              </div>
              <div className="text-center p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="text-4xl font-light mb-4 text-green-600">50%</div>
                <div className="text-lg font-medium mb-2">Waste Reduction</div>
                <div className="text-sm text-black/60">Minimized environmental impact through innovation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Features */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-light mb-8">Sustainable Excellence</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">
              Our comprehensive approach to sustainability ensures every diamond tells a story of environmental responsibility.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            {sustainabilityFeatures.map((feature, index) => (
              <div
                key={index}
                className="group flex gap-8 p-8 rounded-3xl bg-gradient-to-br from-white to-green-50/50 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-light mb-3">{feature.title}</h3>
                  <p className="text-black/70 mb-4 text-lg">{feature.description}</p>
                  <p className="text-sm text-black/60 leading-relaxed">{feature.detail}</p>
                  
                  <div className="mt-6 w-full h-1 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="py-32 px-8 bg-gradient-to-b from-white to-green-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className="space-y-8"
              style={{
                transform: `translateY(${Math.max(0, scrollY - 1600) * -0.1}px)`,
              }}
            >
              <h2 className="text-6xl font-light mb-8">Protecting Tomorrow</h2>
              
              <p className="text-xl leading-relaxed text-black/80">
                Our environmental initiatives go beyond compliance. We actively contribute to reforestation, 
                ocean cleanup, and renewable energy projects, ensuring our positive impact extends far beyond diamonds.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">10,000 Trees Planted</div>
                    <div className="text-sm text-black/60">Contributing to global reforestation efforts</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Ocean Conservation</div>
                    <div className="text-sm text-black/60">Supporting marine ecosystem protection</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium">Clean Energy Initiative</div>
                    <div className="text-sm text-black/60">100% renewable energy operations</div>
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
                src="/tree.png"
                alt="Environmental Impact"
                width={800}
                height={600}
                className="w-full rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-green-100 rounded-full shadow-xl flex items-center justify-center animate-float">
                <Globe className="w-16 h-16 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tree Planting Initiative */}
      <section className="py-32 px-8 bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-8">
              <Leaf className="w-16 h-16 text-green-600 animate-pulse" />
              <h2 className="text-6xl font-light">One Diamond, One Tree</h2>
              <Leaf className="w-16 h-16 text-green-600 animate-pulse" />
            </div>
            <p className="text-2xl text-black/80 max-w-4xl mx-auto leading-relaxed">
              For every diamond sold, we plant a tree. It&apos;s our commitment to giving back to the Earth 
              that gives us these precious stones.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-light">Our Tree Planting Promise</h3>
                </div>
                <p className="text-lg text-black/70 leading-relaxed mb-6">
                  Every time you choose a Cranberri diamond, you&apos;re not just acquiring a piece of timeless beauty—you&apos;re 
                  contributing to a greener planet. We partner with verified reforestation organizations to ensure 
                  each tree is planted in areas that need it most.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-black/60">Verified Planting</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-2xl">
                    <div className="text-2xl font-bold text-green-600">Global</div>
                    <div className="text-sm text-black/60">Impact</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2">
                <h3 className="text-2xl font-light mb-4">Why Trees Matter</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-black/70">Carbon sequestration and climate change mitigation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-black/70">Biodiversity preservation and habitat restoration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-black/70">Soil conservation and water quality improvement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-black/70">Community livelihoods and sustainable development</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-3xl shadow-lg">
                <h3 className="text-3xl font-light mb-6 text-center">Your Impact</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <span className="text-lg font-medium">Trees Planted</span>
                    <span className="text-2xl font-bold text-green-600">15,847</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <span className="text-lg font-medium">CO₂ Absorbed</span>
                    <span className="text-2xl font-bold text-blue-600">237 tons</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl">
                    <span className="text-lg font-medium">Communities Helped</span>
                    <span className="text-2xl font-bold text-yellow-600">23</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <span className="text-lg font-medium">Species Protected</span>
                    <span className="text-2xl font-bold text-purple-600">156</span>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl">
                  <p className="text-center text-black/80 font-medium">
                    &ldquo;Every diamond tells a story. Every tree we plant writes a new chapter for our planet.&rdquo;
                  </p>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-100 rounded-full shadow-lg flex items-center justify-center animate-float">
                <Sparkles className="w-12 h-12 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-light mb-8">Join the Movement</h2>
          <p className="text-xl mb-12 text-white/80">
            Choose diamonds that reflect your values. Together, we can create a more sustainable 
            and ethical future for the luxury industry.
          </p>
          
          <button 
            onClick={() => router.push('/auth/signup')}
            className="group px-12 py-4 bg-green-600 text-white rounded-full text-lg font-light hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-3">
              Discover Our Collection
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </section>
    </>
  );
}