// GENERATED from src/components/ScrollRing.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';

interface Props {
  images: string[];
  radius?: number;
  scrollSpeed?: number;
  autoSpin?: number;
}

export default function ScrollRing({ images, radius = 360, scrollSpeed = 0.02, autoSpin = 2 }: Props) {
  const n = images.length || 1;

  return (
    <>
      <div className="nf-ring" aria-hidden="true" data-ring="" data-radius={radius} data-speed={scrollSpeed} data-spin={autoSpin}>
        <div className="nf-ring-wheel" style={sx(`--r: ${Math.min(radius, 240)}`)} data-wheel="">
          {images.map((src, i) => <img src={src} alt="" draggable="false" style={sx(`--a: ${(i / n) * 360}deg`)} />)}
        </div>
      </div>
    </>
  );
}
