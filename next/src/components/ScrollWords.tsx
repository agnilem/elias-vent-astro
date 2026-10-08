// GENERATED from src/components/ScrollWords.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';

interface Props {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  className?: string;
  style?: string;
  text: string;
}

export default function ScrollWords({ as: Tag = "h2", className: className, style, text }: Props) {
  const words = text.split(" ");

  return (
    <>
      <Tag className={className} style={sx(style)}>{words.map((w, i) => <span><span className="sw">{w}</span>{i < words.length - 1 ? " " : ""}</span>)}</Tag>
    </>
  );
}
