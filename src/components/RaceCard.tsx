"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RaceCardProps = {
  title: string;
  round: number;
  circuit: string;
  city: string;
  country: string;
  when: string | null;
  isNext?: boolean;
};

export function RaceCard({
  title,
  round,
  circuit,
  city,
  country,
  when,
  isNext,
}: RaceCardProps) {
  return (
    <Card
      className={
        isNext
          ? "relative border-primary/40 bg-gradient-to-b from-primary/10 to-transparent"
          : "relative"
      }
    >
      {isNext && (
        <div className="absolute right-3 top-3">
          <Badge className="bg-primary text-white">Next</Badge>
        </div>
      )}
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="font-display text-base sm:text-lg">{title}</div>
          <div className="text-xs text-muted-foreground">Round {round}</div>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{circuit}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {city}, {country}
        </div>
        <div className="mt-3 text-sm text-foreground/80">{when ?? "TBD"}</div>
      </CardContent>
    </Card>
  );
}

