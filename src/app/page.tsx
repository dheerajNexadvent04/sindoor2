import styles from "./page.module.css";
// import Navbar from "@/components/Navbar/Navbar"; // Removed to fix duplication
import Hero from "@/components/Hero/Hero";
import HowItWorks from "@/components/HowItWorks/HowItWorks";
import WhyChooseUs from "@/components/WhyChooseUs/WhyChooseUs";
import Testimonials from "@/components/Testimonials/Testimonials";
import StatsOfUs from "@/components/StatsOfUs/StatsOfUs";
import OwnerSection from "@/components/OwnerSection/OwnerSection";
import ContactUs from "@/components/ContactUs/ContactUs";
import MatrimonyQueries from "@/components/MatrimonyQueries/MatrimonyQueries";
import BrowseProfiles from "@/components/BrowseProfiles/BrowseProfiles";
import Footer from "@/components/Footer/Footer";
import ScrollReveal from "@/components/common/ScrollReveal";


export default function Home() {
  return (
    <main className={styles.main}>
      {/* <Navbar /> Removed to fix duplication */}
      <Hero />
      <ScrollReveal delay={40}><HowItWorks /></ScrollReveal>
      {/* <ScrollReveal delay={80}><WhyChooseUs /></ScrollReveal> */}
      <ScrollReveal delay={120}><Testimonials /></ScrollReveal>
      <ScrollReveal delay={170}><StatsOfUs /></ScrollReveal>
      <ScrollReveal delay={190}><OwnerSection /></ScrollReveal>
      <ScrollReveal delay={210}><ContactUs /></ScrollReveal>
      <ScrollReveal delay={240}><MatrimonyQueries /></ScrollReveal>
      <ScrollReveal delay={270}><BrowseProfiles /></ScrollReveal>
      <Footer />
    </main>
  );
}
