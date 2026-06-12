export default function Card({ children, className = '', hoverEffect = false }) {
  const hoverStyles = hoverEffect ? 'hover:scale-[1.02] hover:-translate-y-2 transition-all duration-300' : '';
  
  return (
    <div className={`bg-white rounded-card p-8 shadow-deep overflow-hidden relative ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
