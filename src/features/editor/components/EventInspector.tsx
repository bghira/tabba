import type { TabEvent } from "../../../domain/tab/types";
import type { TabTrack } from "../../project/types";
import styles from "./EventInspector.module.css";

interface EventInspectorProps {
  activeStemName?: string;
  onDeleteEvent: () => void;
  onUpdateEvent: (patch: EventInspectorPatch) => void;
  selectedEvent?: TabEvent;
  selectedTrack?: TabTrack;
  trackCount: number;
}

export interface EventInspectorPatch {
  durationSeconds?: number;
  fret?: number;
  startSeconds?: number;
  stringNumber?: number;
}

export function EventInspector({
  activeStemName,
  onDeleteEvent,
  onUpdateEvent,
  selectedEvent,
  selectedTrack,
  trackCount,
}: EventInspectorProps) {
  const position = selectedEvent?.chosenPositions[0];

  return (
    <aside className={styles.inspector} aria-label="Event inspector">
      <div className={styles.header}>
        <h2>Inspector</h2>
      </div>
      <dl>
        <div>
          <dt>Stem</dt>
          <dd>{activeStemName ?? "None"}</dd>
        </div>
        <div>
          <dt>Tracks</dt>
          <dd>{trackCount}</dd>
        </div>
        <div>
          <dt>Selection</dt>
          <dd>{selectedEvent ? selectedEvent.kind : "None"}</dd>
        </div>
      </dl>
      {selectedEvent && position && selectedTrack && (
        <form className={styles.editor} onSubmit={(event) => event.preventDefault()}>
          <label>
            String
            <select
              onChange={(event) =>
                onUpdateEvent({ stringNumber: Number(event.currentTarget.value) })
              }
              value={position.stringNumber}
            >
              {selectedTrack.tuning.strings.map((string) => (
                <option key={string.stringNumber} value={string.stringNumber}>
                  {string.stringNumber} - {string.openPitch}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fret
            <input
              min={0}
              onChange={(event) => onUpdateEvent({ fret: Number(event.currentTarget.value) })}
              type="number"
              value={position.fret}
            />
          </label>
          <label>
            Start
            <input
              min={0}
              onChange={(event) =>
                onUpdateEvent({ startSeconds: Number(event.currentTarget.value) })
              }
              step={0.05}
              type="number"
              value={selectedEvent.startSeconds}
            />
          </label>
          <label>
            Duration
            <input
              min={0.05}
              onChange={(event) =>
                onUpdateEvent({ durationSeconds: Number(event.currentTarget.value) })
              }
              step={0.05}
              type="number"
              value={selectedEvent.durationSeconds}
            />
          </label>
          {selectedEvent.candidates.length > 0 && (
            <div className={styles.candidates}>
              <h3>Positions</h3>
              {selectedEvent.candidates.map((candidate) => {
                const candidatePosition = candidate.positions[0];

                if (!candidatePosition) {
                  return null;
                }

                const isActive =
                  candidatePosition.stringNumber === position.stringNumber &&
                  candidatePosition.fret === position.fret;

                return (
                  <button
                    className={isActive ? styles.activeCandidate : styles.candidate}
                    key={candidate.id}
                    onClick={() =>
                      onUpdateEvent({
                        fret: candidatePosition.fret,
                        stringNumber: candidatePosition.stringNumber,
                      })
                    }
                    type="button"
                  >
                    <span>{candidate.label}</span>
                    <small>{candidatePosition.pitch}</small>
                  </button>
                );
              })}
            </div>
          )}
          <button className={styles.deleteButton} onClick={onDeleteEvent} type="button">
            Delete event
          </button>
        </form>
      )}
    </aside>
  );
}
