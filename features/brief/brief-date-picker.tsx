"use client";

import { useRouter } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

import type { BriefHistoryItem } from "@/types/brief";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BriefDatePickerProps {
  currentDate: string;
  history: BriefHistoryItem[];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BriefDatePicker({ currentDate, history }: BriefDatePickerProps) {
  const router = useRouter();

  function navigate(date: string) {
    router.push(`/brief?date=${date}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-sm">
          <Calendar className="size-3.5" aria-hidden />
          {formatDate(currentDate)}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Recent briefs
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {history.map((item) => (
          <DropdownMenuItem
            key={item.snapshot_date}
            onSelect={() => navigate(item.snapshot_date)}
            className="flex items-center justify-between gap-4 cursor-pointer"
          >
            <span>{formatDate(item.snapshot_date)}</span>
            {item.snapshot_date === currentDate && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push("/brief/history")}
          className="cursor-pointer text-sm"
        >
          Show all history →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
