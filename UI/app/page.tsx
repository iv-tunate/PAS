import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Courses from "@/components/Courses";
import Books from "@/components/Books";
import StudyJournal from "@/components/StudyJournal";
import Philosophy from "@/components/Philosophy";
import About from "@/components/About";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Courses />
        <Books />
        <StudyJournal />
        <Philosophy />
        <About />
      </main>
      <Footer />
    </>
  );
}
