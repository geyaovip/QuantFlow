import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="QuantFlow">
      <Image
        src="/brand/quantflow-mark.svg"
        width={32}
        height={32}
        alt=""
        priority
      />
      {compact ? null : <strong>QuantFlow</strong>}
    </span>
  );
}
