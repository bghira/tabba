import { useCallback, useState } from "react";
import type { Stem } from "../../project/types";
import { createStemFromAudioFile } from "../services/createStemFromAudioFile";
import { findMatchingStemForAudioFile } from "../services/matchStemSource";
import type { RuntimeStemSource } from "../types";

interface UseRuntimeStemSourcesOptions {
  existingStems?: Stem[];
  onStemsCreated: (stems: Stem[]) => void;
}

export function useRuntimeStemSources({
  existingStems = [],
  onStemsCreated,
}: UseRuntimeStemSourcesOptions) {
  const [sources, setSources] = useState<RuntimeStemSource[]>([]);

  const importFiles = useCallback(
    (files: FileList | File[]) => {
      const imported = Array.from(files).map((file) => {
        const stem = findMatchingStemForAudioFile(file, existingStems) ?? createStemFromAudioFile(file);
        return { stem, source: { stemId: stem.id, file } };
      });

      if (imported.length === 0) {
        return;
      }

      const newStems = imported
        .map(({ stem }) => stem)
        .filter((stem) => !existingStems.some((existingStem) => existingStem.id === stem.id));

      if (newStems.length > 0) {
        onStemsCreated(newStems);
      }

      setSources((currentSources) => [
        ...currentSources.filter(
          (source) => !imported.some((entry) => entry.source.stemId === source.stemId)
        ),
        ...imported.map(({ source }) => source),
      ]);
    },
    [existingStems, onStemsCreated]
  );

  const clearSources = useCallback(() => {
    setSources([]);
  }, []);

  return { clearSources, importFiles, sources };
}
