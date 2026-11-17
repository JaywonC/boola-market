import type { ReactNode } from "react";

import type { Category, TicketType } from "@/lib/categories";

type ArtProps = {
  category: Category;
  ticketType: TicketType | null;
  title: string;
  className?: string;
};

export function ListingArt({ category, ticketType, title, className }: ArtProps) {
  if (category === "tickets" && ticketType === "harvard_yale") {
    return <GameArt className={className} />;
  }
  if (category === "tickets" && ticketType === "yso") {
    return <YsoArt className={className} />;
  }
  if (category === "tickets") {
    return <ConcertArt className={className} title={title} />;
  }
  return <GoodsArt className={className} category={category} title={title} />;
}

function Frame({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 640 420"
      className={className ?? "h-full w-full"}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

function GameArt({ className }: { className?: string }) {
  return (
    <Frame className={className} label="Harvard–Yale ticket">
      <rect width="640" height="420" fill="#00356b" />
      <rect width="36" height="420" fill="#f4efe4" />
      {Array.from({ length: 9 }, (_, index) => (
        <circle key={index} cx="36" cy={26 + index * 46} r="12" fill="#00356b" />
      ))}
      <text x="64" y="78" fill="#e4c98a" fontSize="18" letterSpacing="3.5" fontFamily="ui-sans-serif, sans-serif">
        YALE BOWL · NOV 21
      </text>
      <text x="64" y="168" fill="#f7f4ec" fontSize="78" fontFamily="Georgia, serif">
        The Game
      </text>
      <text x="64" y="214" fill="#f7f4ec" fontSize="28" fontFamily="ui-sans-serif, sans-serif">
        Harvard – Yale
      </text>
      <text x="64" y="360" fill="#d5deea" fontSize="18" fontFamily="ui-sans-serif, sans-serif">
        Student transfer · not a screenshot
      </text>
      <path d="M430 250h150M430 272h150M430 294h110" stroke="#e4c98a" strokeWidth="3" />
    </Frame>
  );
}

function YsoArt({ className }: { className?: string }) {
  return (
    <Frame className={className} label="YSO Halloween ticket">
      <rect width="640" height="420" fill="#16130f" />
      <rect width="36" height="420" fill="#f4efe4" />
      {Array.from({ length: 9 }, (_, index) => (
        <circle key={index} cx="36" cy={26 + index * 46} r="12" fill="#16130f" />
      ))}
      <path d="M80 250c40-28 70-28 110 0s70 28 110 0 70-28 110 0 70 28 110 0" fill="none" stroke="#e4c98a" strokeWidth="3" />
      <path d="M80 278c40-28 70-28 110 0s70 28 110 0 70-28 110 0 70 28 110 0" fill="none" stroke="#e4c98a" strokeWidth="2" opacity="0.7" />
      <text x="64" y="86" fill="#e4c98a" fontSize="18" letterSpacing="4" fontFamily="ui-sans-serif, sans-serif">
        WOOLSEY HALL
      </text>
      <text x="64" y="176" fill="#f7f4ec" fontSize="84" fontFamily="Georgia, serif">
        YSO
      </text>
      <text x="64" y="222" fill="#f7f4ec" fontSize="28" fontFamily="ui-sans-serif, sans-serif">
        Halloween show
      </text>
      <text x="64" y="360" fill="#d9d0c2" fontSize="18" fontFamily="ui-sans-serif, sans-serif">
        Orchestra seats · official transfer
      </text>
    </Frame>
  );
}

function ConcertArt({ className, title }: { className?: string; title: string }) {
  return (
    <Frame className={className} label={title}>
      <rect width="640" height="420" fill="#1d4e89" />
      <circle cx="520" cy="90" r="70" fill="#e4c98a" opacity="0.9" />
      <text x="48" y="180" fill="#f7f4ec" fontSize="48" fontFamily="Georgia, serif">
        Campus
      </text>
      <text x="48" y="236" fill="#f7f4ec" fontSize="48" fontFamily="Georgia, serif">
        ticket
      </text>
      <text x="48" y="360" fill="#d5deea" fontSize="18" fontFamily="ui-sans-serif, sans-serif">
        Held by a Yale student
      </text>
    </Frame>
  );
}

function GoodsArt({
  className,
  category,
  title,
}: {
  className?: string;
  category: Category;
  title: string;
}) {
  const palettes: Record<Exclude<Category, "tickets">, [string, string]> = {
    furniture: ["#efe6d6", "#00356b"],
    textbooks: ["#e7eef6", "#1d4e89"],
    electronics: ["#e8eef2", "#142033"],
    clothing: ["#f3e7ea", "#7a2430"],
    other: ["#efeae0", "#5c4a32"],
  };
  const [paper, ink] = palettes[category === "tickets" ? "other" : category];
  const label =
    category === "furniture"
      ? "Furniture"
      : category === "textbooks"
        ? "Textbook"
        : category === "electronics"
          ? "Electronics"
          : category === "clothing"
            ? "Clothing"
            : "Campus find";
  return (
    <Frame className={className} label={title}>
      <rect width="640" height="420" fill={paper} />
      <GoodsMark category={category} ink={ink} />
      <text x="48" y="340" fill={ink} fontSize="28" fontFamily="Georgia, serif">
        {label}
      </text>
      <text x="48" y="376" fill={ink} opacity="0.7" fontSize="16" fontFamily="ui-sans-serif, sans-serif">
        Pickup on campus
      </text>
    </Frame>
  );
}

function GoodsMark({ category, ink }: { category: Category; ink: string }) {
  if (category === "furniture") {
    return (
      <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round">
        <path d="M180 250h160v70H180z" />
        <path d="M190 250v-50h140v50" />
        <path d="M180 320v28M340 320v28" />
      </g>
    );
  }
  if (category === "textbooks") {
    return (
      <g fill={ink}>
        <rect x="170" y="120" width="150" height="190" rx="6" />
        <rect x="210" y="100" width="150" height="190" rx="6" fill="#f7f4ec" stroke={ink} strokeWidth="6" />
        <path d="M240 160h90M240 190h70" stroke={ink} strokeWidth="6" />
      </g>
    );
  }
  if (category === "electronics") {
    return (
      <g fill="none" stroke={ink} strokeWidth="6">
        <rect x="150" y="110" width="250" height="160" rx="10" />
        <path d="M230 270h90l16 28H214z" />
      </g>
    );
  }
  if (category === "clothing") {
    return (
      <path
        d="M250 120l40 28 40-28 50 36-28 28v130H228V184l-28-28z"
        fill="none"
        stroke={ink}
        strokeWidth="6"
        strokeLinejoin="round"
      />
    );
  }
  return <rect x="190" y="120" width="160" height="140" rx="12" fill="none" stroke={ink} strokeWidth="6" />;
}
