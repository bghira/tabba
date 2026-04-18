import { createPositionCandidates } from "../../../domain/fingering/fretboardCandidates";
import type { InstrumentTuning } from "../../../domain/instruments/types";
import type { TabEvent, TabPosition } from "../../../domain/tab/types";
import type { DetectedNote } from "../types";

interface SuggestedEventOptions {
  createId?: () => string;
}

const defaultCreateId = () => crypto.randomUUID();

export function createSuggestedTabEvents(
  notes: DetectedNote[],
  tuning: InstrumentTuning,
  options: SuggestedEventOptions = {}
): TabEvent[] {
  const createId = options.createId ?? defaultCreateId;
  let previousPosition: TabPosition | undefined;

  return notes.flatMap((note) => {
    const candidates = createPositionCandidates(note.pitch, tuning, { previousPosition });
    const chosenPosition = candidates[0]?.positions[0];

    if (!chosenPosition) {
      return [];
    }

    previousPosition = chosenPosition;

    return [
      {
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
      },
    ];
  });
}
