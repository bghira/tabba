import { useCallback, useState } from "react";
import type { InstrumentKind } from "../../../domain/instruments/types";
import { StemLane } from "../../audio/components/StemLane";
import { useAudioTransport } from "../../audio/hooks/useAudioTransport";
import { useDecodedWaveform } from "../../audio/hooks/useDecodedWaveform";
import type { RuntimeStemSource } from "../../audio/types";
import type { TabbaProject } from "../../project/types";
import { EventInspector } from "./EventInspector";
import type { EventInspectorPatch } from "./EventInspector";
import { TabStaffPanel } from "./TabStaffPanel";
import { TimelinePanel } from "./TimelinePanel";
import { TransportStrip } from "./TransportStrip";
import styles from "./EditorWorkspace.module.css";
import type { SelectedTabEvent } from "../types";
import { createDefaultLoopRegion, normalizePlaybackRate } from "../services/practiceControls";

interface EditorWorkspaceProps {
  activeSource?: RuntimeStemSource;
  activeStemId?: string;
  onActiveStemChange: (stemId: string) => void;
  onAddManualEvent: (
    trackId: string,
    stringNumber: number,
    fret: number,
    startSeconds: number
  ) => void;
  onAnalyzeTrack: (trackId: string) => void;
  onCreateTrack: (instrument: InstrumentKind) => void;
  onDeleteSelectedEvent: () => void;
  onExportProject: () => void;
  onImportProject: (file: File) => void;
  onSelectEvent: (selection: SelectedTabEvent) => void;
  onShiftSuggestions: (trackId: string, deltaSeconds: number) => void;
  onUpdateSelectedEvent: (patch: EventInspectorPatch) => void;
  onImportFiles: (files: FileList | File[]) => void;
  onStemDurationChange: (stemId: string, duration: number) => void;
  project: TabbaProject;
  projectNotice?: string;
  selectedEvent?: SelectedTabEvent;
}

export function EditorWorkspace({
  activeSource,
  activeStemId,
  onActiveStemChange,
  onAddManualEvent,
  onAnalyzeTrack,
  onCreateTrack,
  onDeleteSelectedEvent,
  onExportProject,
  onImportProject,
  onSelectEvent,
  onShiftSuggestions,
  onUpdateSelectedEvent,
  onImportFiles,
  onStemDurationChange,
  project,
  projectNotice,
  selectedEvent,
}: EditorWorkspaceProps) {
  const [loopRegion, setLoopRegion] = useState(() => createDefaultLoopRegion(60));
  const [playbackRate, setPlaybackRate] = useState(1);
  const handleDurationChange = useCallback(
    (duration: number) => {
      if (activeStemId) {
        onStemDurationChange(activeStemId, duration);
      }
    },
    [activeStemId, onStemDurationChange]
  );
  const transport = useAudioTransport({
    file: activeSource?.file,
    loopRegion,
    onDurationChange: handleDurationChange,
    playbackRate,
  });
  const waveform = useDecodedWaveform(activeSource?.file);
  const activeStem = project.stems.find((stem) => stem.id === activeStemId);
  const selectedTrack = project.tracks.find((track) => track.id === selectedEvent?.trackId);
  const selectedTabEvent = selectedTrack?.events.find((event) => event.id === selectedEvent?.eventId);
  const timelineDuration = Math.max(activeStem?.durationSeconds ?? transport.duration, 60);

  return (
    <div className={styles.workspace}>
      <TransportStrip
        currentTime={transport.currentTime}
        hasSource={transport.hasSource}
        isPlaying={transport.isPlaying}
        onExportProject={onExportProject}
        onImportProject={onImportProject}
        onPause={transport.pause}
        onPlay={transport.play}
        onStop={transport.stop}
        projectName={project.name}
      />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <StemLane
            activeStemId={activeStemId}
            onImportFiles={onImportFiles}
            onSelectStem={onActiveStemChange}
            projectNotice={projectNotice}
            stems={project.stems}
          />
        </aside>
        <div className={styles.mainColumn}>
          <TimelinePanel
            currentTime={transport.currentTime}
            duration={timelineDuration}
            loopRegion={loopRegion}
            onLoopRegionChange={setLoopRegion}
            onPlaybackRateChange={(rate) => setPlaybackRate(normalizePlaybackRate(rate))}
            onSeek={transport.seek}
            playbackRate={playbackRate}
            waveformError={waveform.error}
            waveformLoading={waveform.isLoading}
            waveformPeaks={waveform.peaks}
          />
          <TabStaffPanel
            activeStemId={activeStemId}
            currentTime={transport.currentTime}
            duration={timelineDuration}
            onAddNote={(trackId, stringNumber, fret, startSeconds) =>
              onAddManualEvent(trackId, stringNumber, fret, startSeconds)
            }
            onAnalyzeTrack={onAnalyzeTrack}
            onCreateTrack={onCreateTrack}
            onSelectEvent={onSelectEvent}
            onShiftSuggestions={onShiftSuggestions}
            selectedEvent={selectedEvent}
            tracks={project.tracks}
          />
        </div>
        <EventInspector
          activeStemName={activeStem?.name}
          onDeleteEvent={onDeleteSelectedEvent}
          onUpdateEvent={onUpdateSelectedEvent}
          selectedEvent={selectedTabEvent}
          selectedTrack={selectedTrack}
          trackCount={project.tracks.length}
        />
      </div>
    </div>
  );
}
