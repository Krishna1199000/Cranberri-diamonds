"use client"

import type * as React from "react"
import { useRef, useEffect } from "react"

interface CarouselProps {
  children: React.ReactNode
}

export const Carousel = ({ children }: CarouselProps) => {
  return (
    <div className="relative">
      <CarouselContent>{children}</CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </div>
  )
}

interface CarouselContentProps {
  children: React.ReactNode
}

export const CarouselContent = ({ children }: CarouselContentProps) => {
  return <div className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory">{children}</div>
}

interface CarouselItemProps {
  children: React.ReactNode
}

export const CarouselItem = ({ children }: CarouselItemProps) => {
  return <div className="snap-start shrink-0 w-full h-auto p-4">{children}</div>
}

export const CarouselNext = () => {
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft += carouselRef.current.offsetWidth
    }
  }

  useEffect(() => {
    carouselRef.current = document.querySelector(".overflow-x-auto") as HTMLDivElement
  }, [])

  return (
    <button
      onClick={handleNext}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-200 rounded-full p-2"
    >
      Next
    </button>
  )
}

export const CarouselPrevious = () => {
  const carouselRef = useRef<HTMLDivElement>(null)

  const handlePrevious = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft -= carouselRef.current.offsetWidth
    }
  }

  useEffect(() => {
    carouselRef.current = document.querySelector(".overflow-x-auto") as HTMLDivElement
  }, [])

  return (
    <button
      onClick={handlePrevious}
      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-200 rounded-full p-2"
    >
      Previous
    </button>
  )
}

