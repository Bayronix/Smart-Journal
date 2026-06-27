'use client';

export default function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <div className="water-blob b1" />
      <div className="water-blob b2" />
      <div className="water-blob b3" />
      <div className="water-blob b4" />
      <div className="water-blob b5" />
      <div className="water-blob b6" />
    </div>
  );
}
