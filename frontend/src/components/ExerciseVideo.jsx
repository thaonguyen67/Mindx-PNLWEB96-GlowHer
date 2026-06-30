export default function ExerciseVideo({ src, label, className = '', controls = false }) {
  if (!src) {
    return <div className={`ex-media-placeholder${className ? ` ${className}` : ''}`} />;
  }

  return (
    <video
      className={`ex-video${className ? ` ${className}` : ''}`}
      src={src}
      controls={controls}
      autoPlay={!controls}
      muted
      loop={!controls}
      playsInline
      preload="metadata"
      aria-label={label}
    />
  );
}
