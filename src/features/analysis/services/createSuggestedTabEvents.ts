import { createPositionCandidates } from "../../../domain/fingering/fretboardCandidates";
import type { InstrumentTuning } from "../../../domain/instruments/types";
import type { TabEvent, TabPosition } from "../../../domain/tab/types";
import type { DetectedNote } from "../types";

interface SuggestedEventOptions {
  createId?: () => string;
  lockedEvents?: TabEvent[];
}

const defaultCreateId = () => crypto.randomUUID();

export function createSuggestedTabEvents(
  notes: DetectedNote[],
  tuning: InstrumentTuning,
  options: SuggestedEventOptions = {}
): TabEvent[] {
  const createId = options.createId ?? defaultCreateId;
  const lockedEvents = options.lockedEvents ?? [];
  const createdEvents: TabEvent[] = [];

  for (const note of [...notes].sort((left, right) => left.startSeconds - right.startSeconds)) {
    const previousPosition = findPreviousPosition(note.startSeconds, [
      ...lockedEvents,
      ...createdEvents,
    ]);
    const candidates = createPositionCandidates(note.pitch, tuning, { previousPosition });
    const chosenPosition = candidates[0]?.positions[0];

    if (!chosenPosition) {
      continue;
    }

    createdEvents.push({
      id: createId(),
      startSeconds: note.startSeconds,
      durationSeconds: note.durationSeconds,
      kind: "single",
      texture: "mono",
      detectedPitches: [
        {
          confidence: note.confidence,
          frequencyHz: note.frequencyHz,
          pitch: note.pitch,
        },
      ],
      chosenPositions: [chosenPosition],
      candidates,
      confidence: note.confidence,
      locked: false,
    });
  }

  return createdEvents;
}

function findPreviousPosition(
  startSeconds: number,
  events: TabEvent[]
): TabPosition | undefined {
  return events
    .filter((event) => event.startSeconds < startSeconds && event.chosenPositions[0])
    .sort((left, right) => right.startSeconds - left.startSeconds)[0]
    ?.chosenPositions[0];
}
