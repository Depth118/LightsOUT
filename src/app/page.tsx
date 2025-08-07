import { fetchCurrentSeasonSchedule } from "@/lib/f1";
import ScheduleClient from "@/components/ScheduleClient";
import { Brand } from "@/components/ui/brand";

export default async function Home() {
  const races = await fetchCurrentSeasonSchedule();
  return (
    <div className="min-h-dvh px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-3 font-display">
            <Brand />
          </h1>
        </header>

        <ScheduleClient races={races} />

        <footer className="pt-6 sm:pt-10 text-center text-sm sm:text-base text-muted-foreground">
          <span className="font-f1 tracking-wide">
            Clean, fast F1 schedule
            <span className="px-2 text-foreground/30">•</span>
            Live countdowns
            <span className="px-2 text-foreground/30">•</span>
            Local and UTC times
          </span>
        </footer>
      </div>
    </div>
  );
}
