"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DriverStanding, ConstructorStanding } from "@/lib/f1";
import { getDriverImage, getTeamColor, TEAM_DISPLAY_NAMES, DRIVER_TEAM_OVERRIDES } from "@/lib/driverImages";

interface LeaderboardProps {
    driverStandings: DriverStanding[];
    constructorStandings: ConstructorStanding[];
    driverImages: Record<string, string>;
}

export default function Leaderboard({
    driverStandings,
    constructorStandings,
    driverImages,
}: LeaderboardProps) {
    const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");

    return (
        <Card className="h-fit w-full border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-sidebar-border/50 bg-sidebar-accent/20">
                <CardTitle className="font-display text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary">{new Date().getFullYear()}</span> Standings
                </CardTitle>
                <div className="flex w-full rounded-lg bg-muted/50 p-1 mt-4 border border-sidebar-border/50">
                    <button
                        onClick={() => setActiveTab("drivers")}
                        className={cn(
                            "flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide transition-all",
                            activeTab === "drivers"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Drivers
                    </button>
                    <button
                        onClick={() => setActiveTab("constructors")}
                        className={cn(
                            "flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide transition-all",
                            activeTab === "constructors"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Constructors
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)] min-h-[500px]">
                    <div className="divide-y divide-sidebar-border/40">
                        {activeTab === "drivers" ? (
                            <div>
                                {driverStandings.map((driver, index) => {
                                    const apiTeamName = driver.Constructors[0]?.name || "";
                                    const teamName = DRIVER_TEAM_OVERRIDES[driver.Driver.driverId] || apiTeamName;
                                    const teamColor = getTeamColor(teamName);
                                    const isTop3 = index < 3;

                                    return (
                                        <div
                                            key={driver.Driver.driverId}
                                            className="group relative flex items-center justify-between p-3 transition-colors hover:bg-sidebar-accent/40"
                                        >
                                            {/* Team Color Bar */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                                                style={{ backgroundColor: teamColor }}
                                            />

                                            <div className="flex items-center gap-4 pl-2 w-full">
                                                <span className={cn(
                                                    "w-6 text-center font-display font-bold text-lg",
                                                    isTop3 ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {driver.position}
                                                </span>

                                                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-sidebar-border bg-muted">
                                                    <img
                                                        src={driverImages[driver.Driver.permanentNumber] || getDriverImage(driver.Driver.driverId)}
                                                        alt={driver.Driver.familyName}
                                                        className="h-full w-full object-cover object-top scale-110 translate-y-1"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="font-bold text-sm truncate pr-2">
                                                            {driver.Driver.givenName} <span className="uppercase">{driver.Driver.familyName}</span>
                                                        </span>
                                                        <span className="font-mono font-bold text-primary text-sm">{driver.points}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate font-medium">
                                                        {TEAM_DISPLAY_NAMES[teamName] || teamName}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div>
                                {constructorStandings.map((constructor, index) => {
                                    const teamColor = getTeamColor(constructor.Constructor.name);
                                    const isTop3 = index < 3;

                                    return (
                                        <div
                                            key={constructor.Constructor.constructorId}
                                            className="group relative flex items-center justify-between p-4 transition-colors hover:bg-sidebar-accent/40"
                                        >
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                                                style={{ backgroundColor: teamColor }}
                                            />

                                            <div className="flex items-center gap-3 w-full">
                                                <div className="font-mono text-sm font-bold w-6 text-muted-foreground/70">
                                                    {constructor.position}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm truncate pr-2">
                                                            {TEAM_DISPLAY_NAMES[constructor.Constructor.name] || constructor.Constructor.name}
                                                        </span>
                                                        <span className="font-mono font-bold text-primary text-sm">{constructor.points}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {constructor.wins} Wins
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
