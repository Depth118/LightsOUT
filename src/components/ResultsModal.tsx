import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { fetchSessionResults, SessionResult, NormalizedRace } from "@/lib/f1";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ResultsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    race: NormalizedRace | null;
    initialSessionKey: number | null;
};

export function ResultsModal({
    isOpen,
    onClose,
    race,
    initialSessionKey,
}: ResultsModalProps) {
    const sessions = race ? [
        { name: "Sprint", full: "Sprint", data: race.sessions.sprint, disabled: false },
        { name: "Quali", full: "Qualifying", data: race.sessions.qualifying, disabled: false },
        { name: "Race", full: "Race", data: race.sessions.race, disabled: false },
    ].filter(s => s.data?.key) : [];

    const [results, setResults] = useState<SessionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSessionKey, setActiveSessionKey] = useState<number | null>(null);

    // Initialize active session when modal opens or initialSessionKey changes
    useEffect(() => {
        if (isOpen && initialSessionKey) {
            setActiveSessionKey(initialSessionKey);
        } else if (isOpen && race) {
            // Default to Race if no initial key, or find first available
            const raceKey = race.sessions.race.key;
            if (raceKey) setActiveSessionKey(raceKey);
        }
    }, [isOpen, initialSessionKey, race]);

    // Fetch results when active session changes
    useEffect(() => {
        if (isOpen && activeSessionKey) {
            setLoading(true);
            setResults([]); // Clear previous results
            setError(null); // Clear previous errors
            // Find the session object to get the name
            const session = sessions.find(s => s.data.key === activeSessionKey);

            if (session?.disabled || !race) {
                setLoading(false);
                return;
            }

            fetchSessionResults(race.year, race.round, session?.name || "Race")
                .then(setResults)
                .catch((err) => {
                    console.error("Failed to fetch results", err);
                    setError(err.message || "Failed to load results");
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, activeSessionKey]);

    if (!race) return null;

    const activeSession = sessions.find(s => s.data.key === activeSessionKey);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full h-full max-w-none sm:max-w-5xl sm:h-auto sm:max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden rounded-none sm:rounded-lg border-0 sm:border">
                <div className="p-4 border-b shrink-0 bg-background z-10">
                    <div className="flex items-center justify-between mb-4">
                        <DialogHeader>
                            <DialogTitle className="font-display text-xl sm:text-2xl">
                                {race.name} Results
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Session results for {race.name}
                            </DialogDescription>
                        </DialogHeader>
                        <button
                            onClick={onClose}
                            className="sm:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                        {sessions.map((session) => (
                            <button
                                key={session.name}
                                onClick={() => !session.disabled && setActiveSessionKey(session.data.key!)}
                                disabled={session.disabled}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                                    activeSessionKey === session.data.key
                                        ? "bg-primary text-primary-foreground"
                                        : session.disabled
                                            ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {session.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-muted/5">
                    <div className="p-4 sm:p-6">
                        <div className="mb-4 text-sm text-muted-foreground font-medium flex justify-between items-center">
                            <span>{activeSession?.full} Classification</span>
                            {results.length > 0 && (
                                <span className="text-xs bg-muted px-2 py-1 rounded-md">
                                    {results.length} Drivers
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : activeSession?.disabled ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                Practice session results are not available.
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-destructive bg-destructive/10 rounded-lg border border-destructive/20 p-4">
                                <p className="font-medium">Unable to load results</p>
                                <p className="text-sm opacity-80 mt-1">{error}</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                No results available for this session yet.
                            </div>
                        ) : (
                            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                <TableHead className="w-16 text-center">Pos</TableHead>
                                                <TableHead>Driver</TableHead>
                                                <TableHead>Team</TableHead>
                                                <TableHead className="text-right">Time/Gap</TableHead>
                                                <TableHead className="text-right w-16">Pts</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r) => (
                                                <TableRow key={r.driverNumber} className="hover:bg-muted/30">
                                                    <TableCell className="text-center font-medium text-lg">
                                                        {r.position || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {r.headshotUrl && (
                                                                <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-muted overflow-hidden border border-border/50">
                                                                    <img
                                                                        src={r.headshotUrl}
                                                                        alt={r.driverAcronym}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="font-bold">
                                                                {r.driverName}
                                                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                                    {r.driverAcronym}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-1 h-4 rounded-full"
                                                                style={{ backgroundColor: `#${r.teamColour}` }}
                                                            />
                                                            <span className="font-medium text-sm">{r.teamName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {r.time}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {r.points > 0 && (
                                                            <Badge variant="secondary" className="font-mono">
                                                                {r.points}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List View */}
                                <div className="md:hidden divide-y divide-border">
                                    {results.map((r) => (
                                        <div key={r.driverNumber} className="p-3 flex items-center gap-3 bg-card">
                                            <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                                <span className="text-lg font-bold text-muted-foreground/70">{r.position || "-"}</span>
                                            </div>

                                            {r.headshotUrl && (
                                                <div className="relative h-12 w-12 flex-shrink-0 rounded-full bg-muted overflow-hidden border border-border/50">
                                                    <img
                                                        src={r.headshotUrl}
                                                        alt={r.driverAcronym}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-bold text-base truncate pr-2">{r.driverName}</span>
                                                    {r.points > 0 && (
                                                        <Badge variant="secondary" className="font-mono text-xs shrink-0">
                                                            +{r.points}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground truncate pr-2">
                                                        <div
                                                            className="w-1 h-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: `#${r.teamColour}` }}
                                                        />
                                                        <span className="truncate">{r.teamName}</span>
                                                    </div>
                                                    <span className="font-mono text-xs shrink-0 text-right">{r.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
