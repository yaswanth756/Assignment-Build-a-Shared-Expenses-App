import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function Home() {
  const heroText = "SETTLE UP";
  
  return (
    <main className="min-h-screen bg-shiraz-50 overflow-hidden relative">
      <Navbar />

      {/* Hero Section */}
      {/* Hero Section - SUPERGREEN Reference Style (Shiraz Theme) */}
      <section className="h-screen flex flex-col justify-center items-center relative pt-20 bg-shiraz-50 overflow-hidden w-full">
        
        {/* Floating Abstract Element / Images */}
        <div className="absolute top-1/4 left-10 md:left-24 w-48 h-64 md:w-80 md:h-[400px] z-0 -rotate-12 rounded-[2rem] overflow-hidden shadow-deep animate-float">
          <Image src="/ref-img-light.png" alt="Friends Dinner" fill className="object-cover" priority />
        </div>
        
        <div className="absolute bottom-10 right-10 md:right-24 w-48 h-48 md:w-72 md:h-72 z-0 rotate-12 rounded-[2rem] overflow-hidden shadow-deep animate-float" style={{ animationDelay: '1s' }}>
          <Image src="/ref-img-2.png" alt="Financial Coins" fill className="object-cover" priority />
        </div>

        {/* Massive Text */}
        <div className="z-10 flex w-full justify-center px-4 overflow-hidden">
          {"SETTLE UP".split('').map((letter, i) => (
            <span 
              key={i} 
              className="font-anton text-[22vw] leading-[0.75] tracking-[-0.06em] text-shiraz-950 reveal-anim"
              style={{
                animation: `revealText 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
                transform: 'translateY(100px)'
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Bottom descriptive text */}
        <div className="absolute bottom-12 w-full px-12 flex justify-between items-end z-30">
          <div className="max-w-md hidden md:block">
            <p className="text-shiraz-800 text-sm leading-relaxed tracking-wide font-bold backdrop-blur-md bg-shiraz-50/50 p-4 rounded-xl border border-shiraz-900/10">
              A premium way to split expenses with friends. No stress, just elegant settlements and clear balances.
            </p>
          </div>
          <Button variant="primary" as="a" href="/register">
            Get Started
          </Button>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 px-12 relative z-20">
        <h2 className="font-anton text-center text-[8vw] md:text-7xl leading-none tracking-tight text-shiraz-950 mb-20">HOW IT WORKS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {[
            { step: '01', title: 'CREATE GROUPS', desc: 'Organize your friends, roommates, or travel buddies into dedicated groups for easy tracking.' },
            { step: '02', title: 'ADD EXPENSES', desc: 'Log shared costs and split them equally, unequally, by percentage, or by specific shares.' },
            { step: '03', title: 'SETTLE UP', desc: 'Review elegant balance summaries and record payments to settle debts effortlessly.' }
          ].map((item, index) => (
            <div key={index} className="flex flex-col relative  group">
              <span className="font-anton text-[12rem] leading-none absolute -top-10 -left-6 text-shiraz-100 z-0 opacity-50 group-hover:text-shiraz-200 transition-colors duration-500">
                {item.step}
              </span>
              <div className="relative z-10 pt-20">
                <h3 className="font-anton text-4xl text-shiraz-950 mb-4">{item.title}</h3>
                <p className="text-shiraz-800 font-medium leading-relaxed max-w-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-shiraz-950 text-shiraz-50 min-h-screen rounded-t-[5rem] p-12 relative z-20 shadow-[0_-25px_50px_-12px_rgba(72,9,26,0.3)] flex flex-col justify-center items-center text-center overflow-hidden">
        
        {/* Background decorative circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full border border-shiraz-800 opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full border border-shiraz-800 opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full border border-shiraz-700 opacity-60" />
        </div>

        <div className="relative z-10 max-w-3xl flex flex-col items-center">
          <p className="text-[12px] uppercase tracking-[0.3em] font-bold text-shiraz-400 mb-8">Ready to experience elegant splitting?</p>
          <h2 className="font-anton text-[10vw] md:text-8xl leading-[0.9] text-white mb-12">
            JOIN SPLITBUDDY TODAY.
          </h2>
          <Button variant="blurReveal" as="a" href="/register" className="px-12 py-6 text-sm">
            CREATE FREE ACCOUNT
          </Button>
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes revealText {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </main>
  );
}
