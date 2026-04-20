"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClubCardData {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  memberCount?: number;
  _count?: { memberships: number };
}

interface ClubCardProps {
  club: ClubCardData;
}

const COVER_GRADIENTS = [
  "from-red-700 to-orange-500",
  "from-orange-600 to-yellow-400",
  "from-red-900 to-red-600",
  "from-orange-800 to-red-500",
  "from-yellow-700 to-orange-600",
  "from-red-600 to-rose-400",
  "from-orange-900 to-amber-600",
  "from-rose-700 to-red-500",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

export function ClubCard({ club }: ClubCardProps) {
  const memberCount = club.memberCount ?? club._count?.memberships ?? 0;
  const gradient = getGradient(club.name);

  return (
    <Link href={`/clubs/${club.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-md transition-all group-hover:ring-1 group-hover:ring-primary/40 h-full flex flex-col">
        {/* Cover gradient */}
        <div className={`h-20 bg-gradient-to-br ${gradient} flex items-end p-3`}>
          <div className="size-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
            <span className="text-white font-bold text-sm">
              {club.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {club.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 pb-3 flex flex-col gap-2 flex-1">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {club.description}
          </p>
          <div className="mt-auto">
            <Badge variant="secondary" className="gap-1 text-xs">
              <Users className="size-3" />
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
