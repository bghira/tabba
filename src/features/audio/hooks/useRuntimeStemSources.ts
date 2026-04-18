import { useCallback, useState } from "react";
import type { Stem } from "../../project/types";
import { createStemFromAudioFile } from "../services/createStemFromAudioFile";
import type { RuntimeStemSource } from "../types";

interface UseRuntimeStemSourcesOptions {
  onStemsCreated: (stems: Stem[]) => void;
}

export function useRuntimeStemSources({ onStemsCreated }: UseRuntimeStemSourcesOptions) {
  const [sources, setSources] = useState<RuntimeStemSource[]>([]);

  const importFiles = useCallback(
    (files: FileList | File[]) => {
      const imported = Array.from(files).map((file) => {
        const stem = createStemFromAudioFile(file);
        return { stem, source: { stemId: stem.id, file } };
      });

      if (imported.length === 0) {
        return;
      }

      onStemsCreated(imported.map(({ stem }) => stem));
      setSources((currentSources) => [
        ...currentSources,
        ...imported.map(({ source }) => source),
      ]);
    },
    [onStemsCreated]
  );

  const clearSources = useCallback(() => {
    setSources([]);
  }, []);

  return { clearSources, importFiles, sources };
}
