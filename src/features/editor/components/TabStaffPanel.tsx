import { useEffect, useState } from "react";
import type { InstrumentKind } from "../../../domain/instruments/types";
import type { TabTrack } from "../../project/types";
import { ManualTrackStaff } from "./ManualTrackStaff";
import styles from "./TabStaffPanel.module.css";
import { TrackCreationPanel } from "./TrackCreationPanel";
import type { SelectedTabEvent } from "../types";

interface TabStaffPanelProps {
  activeStemId?: string;
  currentTime: number;
  duration: number;
  onAddNote: (
    trackId: string,
    stringNumber: number,
    fret: number,
    startSeconds: number
  ) => void;
  onAnalyzeTrack: (trackId: string) => void;
  onCreateTrack: (instrument: InstrumentKind) => void;
  onSelectEvent: (selection: SelectedTabEvent) => void;
  onShiftSuggestions: (trackId: string, deltaSeconds: number) => void;
  selectedEvent?: SelectedTabEvent;
  tracks: TabTrack[];
}

export function TabStaffPanel({
  activeStemId,
  currentTime,
  duration,
  onAddNote,
  onAnalyzeTrack,
  onCreateTrack,
  onSelectEvent,
  onShiftSuggestions,
  selectedEvent,
  tracks,
}: TabStaffPanelProps) {
  const [selectedFret, setSelectedFret] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(undefined);
  const activeTracks = tracks.filter((track) => track.stemId === activeStemId);
  const selectedTrack =
    activeTracks.find((track) => track.id === selectedTrackId) ?? activeTracks[0];

  useEffect(() => {
    if (selectedEvent && selectedEvent.trackId !== selectedTrackId) {
      const matchingTrack = activeTracks.find((track) => track.id === selectedEvent.trackId);
      if (matchingTrack) {
        setSelectedTrackId(matchingTrack.id);
      }
    }
  }, [activeTracks, selectedEvent, selectedTrackId]);

  useEffect(() => {
    if (!selectedTrack && activeTracks.length > 0) {
      setSelectedTrackId(activeTracks[0].id);
    }
    if (selectedTrack && selectedTrackId !== selectedTrack.id) {
      setSelectedTrackId(selectedTrack.id);
    }
  }, [activeTracks, selectedTrack, selectedTrackId]);

  return (
    <section className={styles.panel} aria-label="Tab staff">
      <div className={styles.header}>
        <div>
          <h2>Tab Staff</h2>
          <span>{activeTracks.length} active tracks</span>
        </div>
        {activeStemId && <TrackCreationPanel onCreateTrack={onCreateTrack} />}
      </div>
      <div className={styles.tools}>
        <label>
          Fret
          <input
            min={0}
            onChange={(event) => setSelectedFret(Number(event.currentTarget.value))}
            type="number"
            value={selectedFret}
          />
        </label>
        {activeTracks.length > 1 && (
          <label>
            Track
            <select
              onChange={(event) => setSelectedTrackId(event.currentTarget.value)}
              value={selectedTrack?.id ?? ""}
            >
              {activeTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <span>Playhead {currentTime.toFixed(2)}s</span>
      </div>
      {!activeStemId && <p className={styles.emptyState}>Import or select a stem first.</p>}
      {activeStemId && activeTracks.length === 0 && (
        <p className={styles.emptyState}>No tab tracks for selected stem.</p>
      )}
      {selectedTrack && (
        <ManualTrackStaff
          key={selectedTrack.id}
          currentTime={currentTime}
          duration={duration}
          onAddNote={(trackId, stringNumber, startSeconds) =>
            onAddNote(trackId, stringNumber, selectedFret, startSeconds)
          }
          onAnalyzeTrack={onAnalyzeTrack}
          onSelectEvent={onSelectEvent}
          onShiftSuggestions={onShiftSuggestions}
          selectedEvent={selectedEvent}
          track={selectedTrack}
        />
      )}
    </section>
  );
}
