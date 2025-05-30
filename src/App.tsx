import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as Tone from "tone";

const RhythmLine = ({
  yOffset,
  beatCount,
}: {
  yOffset: number;
  beatCount: number;
}) => {
  const fullWidth = 600;
  const beatWidth = fullWidth / beatCount;
  return (
    <g>
      {[
        // Main horizontal
        <line
          key="main"
          x1="100"
          y1={`${yOffset}`}
          x2="700"
          y2={`${yOffset}`}
          stroke="black"
          strokeWidth="3"
        />,
        <text key="label" x="80" y={`${yOffset + 7}`} fontSize="20">
          {beatCount}
        </text>,
        // Beat markers
        ...Array.from({ length: beatCount }).map((_, i) => (
          <line
            key={i}
            x1={`${100 + i * beatWidth}`}
            y1={`${yOffset - 10}`}
            x2={`${100 + i * beatWidth}`}
            y2={`${yOffset + 10}`}
            stroke="black"
            strokeWidth="3"
          />
        )),
      ]}
    </g>
  );
};

const BPMControl = ({
  bpm,
  onChange,
}: {
  bpm: number;
  onChange: (newBpm: number) => void;
}) => {
  return (
    <div className="group">
      <span>{`BPM: ${bpm}`}</span>
      <input
        type="range"
        id="bpm"
        name="bpm"
        list="bpm-markers"
        min="40"
        max="200"
        onChange={(e) => e.target.value && onChange(parseInt(e.target.value))}
        value={bpm}
      />
      <label htmlFor="bpm">BPM Slider</label>
      <datalist id="bpm-markers">
        <option value="50"></option>
        <option value="60"></option>
        <option value="70"></option>
        <option value="80"></option>
        <option value="90"></option>
        <option value="100"></option>
        <option value="110"></option>
        <option value="120"></option>
        <option value="130"></option>
        <option value="140"></option>
        <option value="150"></option>
        <option value="160"></option>
        <option value="170"></option>
        <option value="180"></option>
        <option value="190"></option>
        <option value="200"></option>
      </datalist>
    </div>
  );
};

const VisualSweeper = ({ position }: { position: number }) => (
  <line
    x1={position}
    y1="50"
    x2={position}
    y2="550"
    stroke="red"
    strokeWidth="3"
  />
);

export function App() {
  const [bpm, setBpm] = useState(60);
  const [two, setTwo] = useState(false);
  const [three, setThree] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [barPosition, setBarPosition] = useState(100);

  const svgWidth = 600; // Width of the rhythm lines
  const svgStartX = 100; // Starting X position of the rhythm lines

  useEffect(() => {
    Tone.getTransport().stop().cancel();
    if (playing) {
      // Animate the vertical sweeping bar
      new Tone.Loop((transportTime) => {
        /**
         * TODO there's a bug here...
         * The bar position gets desynched after a couple pause/play cycles.
         * I can't find a good way to sync it with the _actual_ measure.
         */
        Tone.getDraw().schedule(() => {
          const cycleDuration = 60 / bpm; // Duration of one beat cycle
          const normalizedTime =
            (transportTime % cycleDuration) / cycleDuration; // Normalize time to [0, 1]
          const newPosition = svgStartX + normalizedTime * svgWidth; // Calculate new bar position
          setBarPosition(newPosition);
        }, transportTime);
      }, "1i").start(0);

      // One
      new Tone.Loop(() => {
        new Tone.Synth().toDestination().triggerAttackRelease("A1", "1i");
      }, 60 / bpm).start(0);

      if (two) {
        // For "twos" we only add the half measure beat.
        new Tone.Loop(() => {
          new Tone.Synth().toDestination().triggerAttackRelease("A3", "1i");
        }, 60 / bpm).start("0:1");
      }

      if (three) {
        // For "threes" we add the second and third thirds.
        new Tone.Loop(() => {
          new Tone.Synth().toDestination().triggerAttackRelease("A3", "1i");
        }, 60 / bpm).start("4t");
        new Tone.Loop(() => {
          new Tone.Synth().toDestination().triggerAttackRelease("A3", "1i");
        }, 60 / bpm).start((2 / 3) * (60 / bpm));
      }

      Tone.getTransport().start();
    }
  }, [playing, bpm, two, three]);

  return (
    <>
      <h1>Beat Trainer</h1>
      <BPMControl bpm={bpm} onChange={setBpm} />
      <div className="group">
        <button
          onClick={() => {
            setPlaying((x) => !x);
          }}
        >
          {playing ? "Stop" : "Start"}
        </button>
      </div>
      <div className="group">
        <label>
          2
          <input
            type="checkbox"
            id="2"
            checked={two}
            onChange={(e) => setTwo(e.target.checked)}
          />
        </label>
        <label>
          3
          <input
            type="checkbox"
            id="3"
            checked={three}
            onChange={(e) => setThree(e.target.checked)}
          />
        </label>
      </div>
      <svg viewBox="0 0 800 600">
        <RhythmLine yOffset={100} beatCount={1} />
        <RhythmLine yOffset={200} beatCount={2} />
        <RhythmLine yOffset={300} beatCount={3} />
        <RhythmLine yOffset={400} beatCount={4} />
        <RhythmLine yOffset={500} beatCount={6} />
        <VisualSweeper position={barPosition} />
      </svg>
    </>
  );
}
