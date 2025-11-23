import {
  fetchCurrentSeasonSchedule,
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchDriverImages,
} from "@/lib/f1";
import ScheduleClient from "@/components/ScheduleClient";
import Leaderboard from "@/components/Leaderboard";
import { Brand } from "@/components/ui/brand";

export default async function Home() {
  const [schedule, driverStandings, constructorStandings, driverImages] = await Promise.all([
    fetchCurrentSeasonSchedule(),
    fetchDriverStandings(),
    fetchConstructorStandings(),
    fetchDriverImages(),
  ]);

  return (
    <div className="min-h-dvh px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-3 font-display">
            <Brand />
          </h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Content - Schedule */}
          <div className="flex-1 w-full min-w-0">
            <ScheduleClient
              races={schedule}
              driverStandings={driverStandings}
              constructorStandings={constructorStandings}
              driverImages={driverImages}
            />

            <footer className="pt-6 sm:pt-10 text-center text-sm sm:text-base text-muted-foreground">
              <div className="inline-block space-y-4">
                <span className="font-f1 tracking-wide">
                  Clean, fast F1 schedule
                  <span className="px-2 text-foreground/30">•</span>
                  Live countdowns
                  <span className="px-2 text-foreground/30">•</span>
                  Local and UTC times
                </span>
                <div className="border-t-2 border-border/50 py-5">
                  <p className="text-sm text-muted-foreground/80 font-simple-life">Simply Lovely :D</p>
                </div>
              </div>
            </footer>
          </div>

          {/* Right Sidebar - Leaderboard (Desktop Only) */}
          <aside className="hidden lg:block w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:sticky lg:top-8">
            <Leaderboard
              driverStandings={driverStandings}
              constructorStandings={constructorStandings}
              driverImages={driverImages}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
