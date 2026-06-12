import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-shiraz-950 text-shiraz-50 py-20 px-12 relative z-30 mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 max-w-7xl mx-auto">
        
        {/* Newsletter Signup (Left 6 cols) */}
        <div className="md:col-span-6 flex flex-col justify-between">
          <div>
            <h3 className="font-anton text-6xl mb-4 text-shiraz-200">JOIN THE LIST</h3>
            <p className="text-shiraz-300 mb-8 font-medium">Get updates on new features and premium splitting tools.</p>
          </div>
          <div className="relative w-full max-w-md">
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL" 
              className="w-full bg-transparent border-b-2 border-shiraz-800 py-4 outline-none uppercase tracking-[0.2em] font-bold text-xs placeholder:text-shiraz-800 focus:border-shiraz-400 transition-colors"
            />
            <button className="absolute right-0 bottom-4 text-shiraz-400 font-bold tracking-[0.2em] uppercase text-xs hover:text-white transition-colors">
              Submit
            </button>
          </div>
        </div>

        {/* Links (Right 6 cols) */}
        <div className="md:col-span-6 grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <h4 className="font-anton text-2xl text-shiraz-400">PRODUCT</h4>
            <Link href="/features" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">Features</Link>
            <Link href="/pricing" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">Pricing</Link>
            <Link href="/security" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">Security</Link>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="font-anton text-2xl text-shiraz-400">COMPANY</h4>
            <Link href="/about" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">About</Link>
            <Link href="/careers" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">Careers</Link>
            <Link href="/contact" className="text-[11px] font-bold tracking-[0.2em] uppercase hover:text-shiraz-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-shiraz-900 flex justify-between items-center opacity-50 text-[10px] uppercase tracking-widest font-bold">
        <span>© 2026 SplitBuddy Inc.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
