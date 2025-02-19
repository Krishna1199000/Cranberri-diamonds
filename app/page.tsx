import Navbar from "@/components/navbar"
import FeaturedCollection from "@/components/featured-collection"
import FAQ from "@/components/faq"
import VipSignup from "@/components/vip-signup"
import ChatWidget from "@/components/chat-widget"

// Import the existing Home component content
import HomeContent from "./home-content"

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <HomeContent />
        <FeaturedCollection />
        <FAQ />
        <VipSignup />
        <ChatWidget />
      </main>
    </>
  )
}

