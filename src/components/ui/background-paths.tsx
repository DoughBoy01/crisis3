export function BackgroundPaths({ className }: { className?: string }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5} -${189 + i * 6}C-${380 - i * 5} -${189 + i * 6} -${312 - i * 5} ${216 - i * 6} ${152 - i * 5} ${343 - i * 6}C${616 - i * 5} ${470 - i * 6} ${684 - i * 5} ${875 - i * 6} ${684 - i * 5} ${875 - i * 6}`,
    opacity: 0.03 + i * 0.012,
    width: 0.4 + i * 0.025,
    duration: 16 + i * 0.4,
    delay: i * 0.3,
  }));

  const mirroredPaths = Array.from({ length: 36 }, (_, i) => ({
    id: i + 36,
    d: `M-${380 + i * 5} -${189 + i * 6}C-${380 + i * 5} -${189 + i * 6} -${312 + i * 5} ${216 - i * 6} ${152 + i * 5} ${343 - i * 6}C${616 + i * 5} ${470 - i * 6} ${684 + i * 5} ${875 - i * 6} ${684 + i * 5} ${875 - i * 6}`,
    opacity: 0.02 + i * 0.009,
    width: 0.3 + i * 0.02,
    duration: 20 + i * 0.35,
    delay: i * 0.25 + 2,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {[...paths, ...mirroredPaths].map((path) => (
            <style key={`style-${path.id}`}>{`
              @keyframes dash-${path.id} {
                0% { stroke-dashoffset: 1000; opacity: 0; }
                10% { opacity: ${path.opacity}; }
                90% { opacity: ${path.opacity}; }
                100% { stroke-dashoffset: -1000; opacity: 0; }
              }
              .path-${path.id} {
                stroke-dasharray: 200 800;
                stroke-dashoffset: 1000;
                animation: dash-${path.id} ${path.duration}s linear ${path.delay}s infinite;
              }
            `}</style>
          ))}
        </defs>
        {paths.map((path) => (
          <path
            key={path.id}
            className={`path-${path.id}`}
            d={path.d}
            stroke={`rgba(14,165,233,${path.opacity})`}
            strokeWidth={path.width}
            fill="none"
          />
        ))}
        {mirroredPaths.map((path) => (
          <path
            key={path.id}
            className={`path-${path.id}`}
            d={path.d}
            stroke={`rgba(56,189,248,${path.opacity})`}
            strokeWidth={path.width}
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
}
