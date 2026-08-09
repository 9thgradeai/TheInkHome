import { useEffect, useRef, useState } from "react";

/**
 * Ambient soundscape + scroll-velocity modulation.
 *
 * Synthesizes a low-frequency cosmic hum with the WebAudio API (no audio files),
 * and modulates its filter/shimmer by scroll velocity. The AudioContext is created
 * lazily on first play (browsers require a user gesture), and the rAF modulation
 * loop only runs while the sound is playing AND the tab is visible.
 */
export function useAmbientAudio() {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<any>(null); // the synth controller { play, pause }

  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollVelocity = useRef(0);
  const audioActiveRef = useRef(false); // true only while the ambient hum is playing
  const audioFrameId = useRef<number | null>(null); // current rAF tick id (null = not running)

  useEffect(() => {
    // Generate a beautiful, low-frequency cosmic synth tone as standard audio
    // helper so we don't have to pool heavy external audio files.
    audioRef.current = {
      play: () => {
        const self = audioRef.current;
        // Lazily create the AudioContext on first play — browsers require a user
        // gesture, and we shouldn't allocate it on mount.
        if (!self.audioContext) {
          self.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = self.audioContext;
        if (audioContext.state === "suspended") {
          audioContext.resume();
        }
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(55, audioContext.currentTime); // Low A hum

        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, audioContext.currentTime);
        filter.Q.setValueAtTime(1.0, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.015, audioContext.currentTime);

        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(0.15, audioContext.currentTime);
        lfoGain.gain.setValueAtTime(5, audioContext.currentTime);

        const shimmerOsc = audioContext.createOscillator();
        shimmerOsc.type = "triangle";
        shimmerOsc.frequency.setValueAtTime(440, audioContext.currentTime);
        const shimmerGain = audioContext.createGain();
        shimmerGain.gain.setValueAtTime(0.0, audioContext.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(filter);
        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.start();
        lfo.start();
        shimmerOsc.start();

        self.audioContext = audioContext;
        self.oscillator = osc;
        self.lfo = lfo;
        self.shimmerOsc = shimmerOsc;
        self.shimmerGain = shimmerGain;
        self.filter = filter;
        self.gainNode = gainNode;

        audioActiveRef.current = true;
        // Kick off the modulation loop if it isn't already running.
        if (audioFrameId.current == null) {
          audioFrameId.current = requestAnimationFrame(tick);
        }
      },
      pause: () => {
        try {
          const ref = audioRef.current;
          if (ref.oscillator) ref.oscillator.stop();
          if (ref.lfo) ref.lfo.stop();
          if (ref.shimmerOsc) ref.shimmerOsc.stop();
          if (ref.audioContext) ref.audioContext.suspend();
        } catch (e) {}
        audioActiveRef.current = false;
      }
    };

    // Scroll tracker (cheap, passive — always on so velocity is ready when audio starts)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const dt = Math.max(currentTime - lastScrollTime.current, 10);
      const dy = Math.abs(currentScrollY - lastScrollY.current);

      const velocity = dy / dt; // pixels per ms
      scrollVelocity.current = Math.min(velocity, 5); // cap at reasonable speed

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    };

    // Animation frame tick loop to decay scroll velocity smoothly and modulate audio.
    // Only runs while the ambient hum is playing AND the tab is visible.
    let lastTickTime = Date.now();

    const tick = () => {
      audioFrameId.current = null; // frame consumed

      // Stop burning frames when sound is off or the tab is hidden.
      if (!audioActiveRef.current || document.hidden) return;

      const now = Date.now();
      const dt = (now - lastTickTime) / 1000;
      lastTickTime = now;

      // Decay velocity
      if (scrollVelocity.current > 0) {
        scrollVelocity.current -= scrollVelocity.current * 3.5 * dt;
        if (scrollVelocity.current < 0.001) scrollVelocity.current = 0;
      }

      // Modulate synth properties if running
      const ref = audioRef.current;
      if (ref && ref.audioContext && ref.audioContext.state === "running") {
        const vel = scrollVelocity.current;
        const curTime = ref.audioContext.currentTime;

        const targetFilterFreq = 220 + vel * 320;
        if (ref.filter) {
          ref.filter.frequency.setTargetAtTime(targetFilterFreq, curTime, 0.12);
          ref.filter.Q.setTargetAtTime(1.0 + vel * 2.0, curTime, 0.12);
        }

        if (ref.shimmerGain && ref.shimmerOsc) {
          const targetShimmerVol = vel * 0.012;
          ref.shimmerGain.gain.setTargetAtTime(targetShimmerVol, curTime, 0.15);

          const targetShimmerFreq = 440 + vel * 80;
          ref.shimmerOsc.frequency.setTargetAtTime(targetShimmerFreq, curTime, 0.18);
        }
      }

      audioFrameId.current = requestAnimationFrame(tick);
    };

    // Resume the loop when the tab becomes visible again (if still playing).
    const handleVisibility = () => {
      if (!document.hidden && audioActiveRef.current && audioFrameId.current == null) {
        audioFrameId.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (audioFrameId.current != null) cancelAnimationFrame(audioFrameId.current);
      try {
        const ref = audioRef.current;
        if (ref && ref.oscillator) ref.oscillator.stop();
        if (ref && ref.shimmerOsc) ref.shimmerOsc.stop();
      } catch (e) {}
    };
  }, []);

  const toggleSound = () => {
    if (musicPlaying) {
      audioRef.current?.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current?.play();
      setMusicPlaying(true);
    }
  };

  const startAmbient = () => {
    if (musicPlaying) return;
    try {
      audioRef.current?.play();
      setMusicPlaying(true);
    } catch (e) {}
  };

  return { musicPlaying, toggleSound, startAmbient };
}
