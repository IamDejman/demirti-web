'use client';

import { useState, useEffect, useRef } from 'react';

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedCounter({
  value = 0,
  duration = 1000,
  prefix = '',
  suffix = '',
}) {
  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
    const animate = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOut(progress);
      setDisplay(Math.round(num * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else startRef.current = null;
    };
    requestAnimationFrame(animate);
  }, [visible, value, duration]);

  const formatted = display.toLocaleString();

  return (
    <span ref={ref}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
