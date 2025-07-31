import Navbar from "@/components/navbar"
import FeaturedCollection from "@/components/featured-collection"
import FAQ from "@/components/faq"
import VipSignup from "@/components/vip-signup"
import ChatWidget from "@/components/chat-widget"
// import ScrollspyNavigation from "@/components/scrollspy-navigation"
// import PageLabel from "@/components/page-label"

// Import the existing Home component content
import HomeContent from "./home-content"

export default function Page() {
  return (
    <>
      <Navbar />
      {/* <ScrollspyNavigation /> */}
      {/* <PageLabel /> */}
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