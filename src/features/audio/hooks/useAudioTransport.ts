import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopRegion } from "../../editor/services/practiceControls";
import { normalizeLoopRegion, normalizePlaybackRate } from "../../editor/services/practiceControls";

interface UseAudioTransportOptions {
  file?: File;
  loopRegion?: LoopRegion;
  onDurationChange?: (durationSeconds: number) => void;
  playbackRate?: number;
}

interface PlaybackAnchor {
  bufferStartOffset: number;
  contextStartTime: number;
  playbackRate: number;
}

export function useAudioTransport({
  file,
  loopRegion,
  onDurationChange,
  playbackRate = 1,
}: UseAudioTransportOptions) {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const anchorRef = useRef<PlaybackAnchor | null>(null);
  const pausedOffsetRef = useRef(0);
  const frameRequestRef = useRef<number | undefined>(undefined);
  const loopRegionRef = useRef<LoopRegion | undefined>(loopRegion);
  const playbackRateRef = useRef(normalizePlaybackRate(playbackRate));
  const onDurationChangeRef = useRef(onDurationChange);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSource, setHasSource] = useState(false);

  useEffect(() => {
    loopRegionRef.current = loopRegion;
  }, [loopRegion]);

  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  const getContext = useCallback((): AudioContext => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const stopFrameUpdates = useCallback(() => {
    if (frameRequestRef.current !== undefined) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = undefined;
    }
  }, []);

  const computeLivePosition = useCallback((): number => {
    const anchor = anchorRef.current;
    const context = contextRef.current;
    const buffer = bufferRef.current;

    if (!anchor || !context || !buffer) {
      return pausedOffsetRef.current;
    }

    const elapsedContextSeconds = Math.max(0, context.currentTime - anchor.contextStartTime);
    const rawOffset =
      anchor.bufferStartOffset + elapsedContextSeconds * anchor.playbackRate;

    const loop = loopRegionRef.current;

    if (loop) {
      const normalized = normalizeLoopRegion(loop, buffer.duration);

      if (normalized.enabled && rawOffset >= normalized.endSeconds) {
        const loopDuration = normalized.endSeconds - normalized.startSeconds;

        if (loopDuration > 0) {
          return (
            normalized.startSeconds +
            ((rawOffset - normalized.startSeconds) % loopDuration)
          );
        }
      }
    }

    return Math.min(Math.max(0, rawOffset), buffer.duration);
  }, []);

  const teardownSource = useCallback(() => {
    const source = sourceRef.current;
    sourceRef.current = null;
    anchorRef.current = null;

    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // Source may already be stopped.
      }
      source.disconnect();
    }
  }, []);

  const applyLoopRegionToSource = useCallback((source: AudioBufferSourceNode) => {
    const buffer = bufferRef.current;
    const loop = loopRegionRef.current;

    if (!buffer || !loop) {
      source.loop = false;
      source.loopStart = 0;
      source.loopEnd = 0;
      return;
    }

    const normalized = normalizeLoopRegion(loop, buffer.duration);
    source.loop = normalized.enabled;
    source.loopStart = normalized.startSeconds;
    source.loopEnd = normalized.endSeconds;
  }, []);

  const startPlayback = useCallback(
    (offsetSeconds: number) => {
      const context = contextRef.current;
      const buffer = bufferRef.current;

      if (!context || !buffer) {
        return;
      }

      teardownSource();

      if (context.state === "suspended") {
        void context.resume();
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRateRef.current;
      applyLoopRegionToSource(source);
      source.connect(context.destination);

      source.onended = () => {
        if (sourceRef.current !== source) {
          return;
        }

        sourceRef.current = null;
        anchorRef.current = null;
        pausedOffsetRef.current = 0;
        stopFrameUpdates();
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const safeOffset = Math.min(Math.max(0, offsetSeconds), buffer.duration);
      source.start(0, safeOffset);

      sourceRef.current = source;
      anchorRef.current = {
        bufferStartOffset: safeOffset,
        contextStartTime: context.currentTime,
        playbackRate: playbackRateRef.current,
      };
      pausedOffsetRef.current = safeOffset;

      setIsPlaying(true);
      setCurrentTime(safeOffset);

      stopFrameUpdates();

      const tick = () => {
        const offset = computeLivePosition();
        pausedOffsetRef.current = offset;
        setCurrentTime(offset);
        frameRequestRef.current = requestAnimationFrame(tick);
      };

      frameRequestRef.current = requestAnimationFrame(tick);
    },
    [applyLoopRegionToSource, computeLivePosition, stopFrameUpdates, teardownSource]
  );

  // Decode the current file and publish duration.
  useEffect(() => {
    if (!file) {
      teardownSource();
      bufferRef.current = null;
      pausedOffsetRef.current = 0;
      stopFrameUpdates();
      setHasSource(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let cancelled = false;
    const context = getContext();

    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);

        if (cancelled) {
          return;
        }

        teardownSource();
        bufferRef.current = buffer;
        pausedOffsetRef.current = 0;
        stopFrameUpdates();
        setHasSource(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(buffer.duration);
        onDurationChangeRef.current?.(buffer.duration);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to decode audio for playback", error);
          bufferRef.current = null;
          setHasSource(false);
          setDuration(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, getContext, stopFrameUpdates, teardownSource]);

  // Hot-apply loop-region changes to any currently-playing source.
  useEffect(() => {
    const source = sourceRef.current;

    if (source) {
      applyLoopRegionToSource(source);
    }
  }, [applyLoopRegionToSource, loopRegion]);

  // Hot-apply playbackRate changes by re-anchoring at the current offset.
  useEffect(() => {
    const normalized = normalizePlaybackRate(playbackRate);
    playbackRateRef.current = normalized;

    const source = sourceRef.current;
    const context = contextRef.current;

    if (!source || !context) {
      return;
    }

    const offset = computeLivePosition();
    source.playbackRate.value = normalized;
    anchorRef.current = {
      bufferStartOffset: offset,
      contextStartTime: context.currentTime,
      playbackRate: normalized,
    };
    pausedOffsetRef.current = offset;
  }, [computeLivePosition, playbackRate]);

  // Close the AudioContext on unmount.
  useEffect(() => {
    return () => {
      teardownSource();
      stopFrameUpdates();
      const context = contextRef.current;
      contextRef.current = null;

      if (context) {
        void context.close();
      }
    };
  }, [stopFrameUpdates, teardownSource]);

  const play = useCallback(() => {
    const buffer = bufferRef.current;

    if (!buffer) {
      return;
    }

    let offset = pausedOffsetRef.current;

    if (offset >= buffer.duration) {
      offset = 0;
    }

    const loop = loopRegionRef.current;

    if (loop) {
      const normalized = normalizeLoopRegion(loop, buffer.duration);

      if (
        normalized.enabled &&
        (offset < normalized.startSeconds || offset >= normalized.endSeconds)
      ) {
        offset = normalized.startSeconds;
      }
    }

    startPlayback(offset);
  }, [startPlayback]);

  const pause = useCallback(() => {
    if (!sourceRef.current) {
      return;
    }

    const offset = computeLivePosition();
    teardownSource();
    stopFrameUpdates();
    pausedOffsetRef.current = offset;
    setCurrentTime(offset);
    setIsPlaying(false);
  }, [computeLivePosition, stopFrameUpdates, teardownSource]);

  const stop = useCallback(() => {
    teardownSource();
    stopFrameUpdates();
    pausedOffsetRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [stopFrameUpdates, teardownSource]);

  const seek = useCallback(
    (timeSeconds: number) => {
      const buffer = bufferRef.current;
      const safeDuration = buffer?.duration ?? 0;
      const nextTime = Math.min(Math.max(0, timeSeconds), safeDuration);

      pausedOffsetRef.current = nextTime;
      setCurrentTime(nextTime);

      if (sourceRef.current) {
        startPlayback(nextTime);
      }
    },
    [startPlayback]
  );

  return {
    currentTime,
    duration,
    hasSource,
    isPlaying,
    pause,
    play,
    seek,
    stop,
  };
}
