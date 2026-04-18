import { useId } from "react";
import type { Stem } from "../../project/types";
import styles from "./StemLane.module.css";

interface StemLaneProps {
  activeStemId?: string;
  onImportFiles: (files: FileList) => void;
  onSelectStem: (stemId: string) => void;
  projectNotice?: string;
  stems: Stem[];
}

export function StemLane({
  activeStemId,
  onImportFiles,
  onSelectStem,
  projectNotice,
  stems,
}: StemLaneProps) {
  const inputId = useId();

  return (
    <section className={styles.stemLane} aria-label="Stem lane">
      <div className={styles.header}>
        <div>
          <h2>Stems</h2>
          <span>{stems.length}</span>
        </div>
        <label htmlFor={inputId} className={styles.importButton}>
          Import
        </label>
        <input
          accept="audio/*"
          className={styles.fileInput}
          id={inputId}
          multiple
          onChange={(event) => {
            if (event.currentTarget.files) {
              onImportFiles(event.currentTarget.files);
            }

            event.currentTarget.value = "";
          }}
          type="file"
        />
      </div>
      {stems.length === 0 ? (
        <div className={styles.emptyState}>No stems</div>
      ) : (
        <div className={styles.stemList}>
          {stems.map((stem) => (
            <button
              className={stem.id === activeStemId ? styles.activeStem : styles.stemButton}
              key={stem.id}
              onClick={() => onSelectStem(stem.id)}
              type="button"
            >
              <span>{stem.name}</span>
              <small>{formatDuration(stem.durationSeconds)}</small>
            </button>
          ))}
        </div>
      )}
      {projectNotice && <p className={styles.notice}>{projectNotice}</p>}
    </section>
  );
}

function formatDuration(durationSeconds?: number): string {
  if (durationSeconds === undefined) {
    return "duration unknown";
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
