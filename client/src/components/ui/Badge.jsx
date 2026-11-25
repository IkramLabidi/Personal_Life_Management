const variants = {
  neutral: 'bg-pale/70 text-deep',
  blue: 'bg-deep/10 text-deep',
  green: 'bg-[#7FA88A]/18 text-[#4f7a5c]',
  amber: 'bg-[#C2A878]/22 text-[#8a6f3f]',
  red: 'bg-[#b0655f]/15 text-[#9d5650]',
  gray: 'bg-charcoal/[0.08] text-charcoal/70',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return <span className={`chip ${variants[variant] || variants.neutral} ${className}`}>{children}</span>;
}
