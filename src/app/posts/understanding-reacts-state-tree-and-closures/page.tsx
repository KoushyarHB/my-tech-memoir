import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Understanding React's State Tree and Closures",
  description:
    "A deep dive into how React tracks state internally and why closures matter for understanding hooks behavior.",
  openGraph: {
    title: "Understanding React's State Tree and Closures",
    description:
      "A deep dive into how React tracks state internally and why closures matter for understanding hooks behavior.",
    type: "article",
    publishedTime: "2026-07-28T21:00:00Z",
  },
};

export default function PostUnderstandingReactStateTreeAndClosures() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <article className="prose-memoir">
        <h1>Understanding React&apos;s State Tree and Closures</h1>

        <p>
          In the{" "}
          <a href="/posts/why-you-cant-call-usestate-inside-useeffect">
            previous post
          </a>
          , we covered <em>why</em> you can&apos;t call{" "}
          <code>useState</code> inside <code>useEffect</code>. But the
          explanation relied on two concepts that deserve their own deep dive:
          <strong> the component state tree</strong> and{" "}
          <strong>closures</strong>.
        </p>

        <p>
          Understanding these two things doesn&apos;t just help you avoid
          mistakes — it helps you <em>think in React</em>.
        </p>

        <h2>The Component State Tree</h2>

        <p>
          When you write a React component with multiple <code>useState</code>{" "}
          calls, React doesn&apos;t store them in a dictionary or a map. It
          stores them in a <strong>flat array</strong>, indexed by the order you
          call the hooks.
        </p>

        <pre>{`function Profile() {
  const [name, setName] = useState("Koushyar");   // slot 0
  const [age, setAge] = useState(28);              // slot 1
  const [darkMode, setDarkMode] = useState(false); // slot 2
}`}</pre>

        <p>React&apos;s internal state for this component looks like:</p>

        <pre>{`State Tree:
┌─────────┬─────────┬──────────┐
│ slot 0  │ slot 1  │ slot 2   │
│"Koushyar"│   28    │  false   │
└─────────┴─────────┴──────────┘`}</pre>

        <p>
          That&apos;s it. No names, no labels — just positions. When you call{" "}
          <code>setName(&quot;Alex&quot;)</code>, React looks up{" "}
          <strong>slot 0</strong> and overwrites it. When you call{" "}
          <code>setAge(29)</code>, it hits <strong>slot 1</strong>.
        </p>

        <p>
          This is why the <strong>Rules of Hooks</strong> exist. If you
          conditionally call a hook:
        </p>

        <pre>{`// ❌ DON'T
if (isLoggedIn) {
  const [token, setToken] = useState(null);
  // Sometimes slot 2, sometimes doesn't exist
}`}</pre>

        <p>
          React gets confused about which slot is which. The state tree
          becomes misaligned with your code, and you get corrupted state or
          crashes.
        </p>

        <h3>The Array Behind the Curtain</h3>

        <p>
          You can actually visualize this. Imagine React keeps something like
          this internally:
        </p>

        <pre>{`// React's internal state (simplified)
let stateSlots = [];

// Each useState call:
function useState(initialValue) {
  const slotIndex = currentHookIndex++;

  if (stateSlots[slotIndex] === undefined) {
    stateSlots[slotIndex] = initialValue;
  }

  const setState = (newValue) => {
    stateSlots[slotIndex] = newValue;
    scheduleReRender();
  };

  return [stateSlots[slotIndex], setState];
}`}</pre>

        <p>
          The <code>currentHookIndex</code> increments with every{" "}
          <code>useState</code> call. Every render resets it to 0 and walks
          through your hooks top-to-bottom. That&apos;s the contract.
        </p>

        <h2>Closures: Snapshots of a Moment</h2>

        <p>
          A <strong>closure</strong> is when a function remembers the variables
          from the scope where it was created — even after that scope is gone.
        </p>

        <pre>{`function createCounter() {
  let count = 0;

  return function increment() {
    count++;
    return count;
  };
}

const counter = createCounter();
counter(); // 1
counter(); // 2
counter(); // 3`}</pre>

        <p>
          Every JavaScript function creates a closure. React uses this
          extensively.
        </p>

        <h3>Closures in useEffect</h3>

        <p>
          Every time your component renders, <code>useEffect</code> creates a{" "}
          <strong>new function</strong> — a fresh closure that captures the
          state values from <em>that specific render</em>:
        </p>

        <pre>{`const [count, setCount] = useState(0);

useEffect(() => {
  console.log(count);
}, [count]);

// Render 1: count = 0  →  closure sees { count: 0 }
// Render 2: count = 1  →  closure sees { count: 1 }
// Render 3: count = 2  →  closure sees { count: 2 }`}</pre>

        <p>
          Each closure is a <strong>snapshot</strong> — it can&apos;t see future
          renders. This is why stale closures are such a common bug in React.
        </p>

        <h3>The Stale Closure Bug</h3>

        <pre>{`const [count, setCount] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // Always logs 0 — stale!
  }, 1000);

  return () => clearInterval(interval);
}, []); // Empty deps = this closure never updates`}</pre>

        <p>
          The <code>setInterval</code> callback closes over{" "}
          <code>count</code> from the first render. It never sees the updated
          value because the dependency array is empty — so the effect never
          re-runs, and the closure never refreshes.
        </p>

        <p>
          <strong>The fix:</strong> Either add <code>count</code> to the
          dependency array, or use the functional updater form:
        </p>

        <pre>{`useEffect(() => {
  const interval = setInterval(() => {
    setCount(prev => prev + 1); // ✅ Uses latest value
  }, 1000);

  return () => clearInterval(interval);
}, []);`}</pre>

        <h2>Putting It Together</h2>

        <p>
          Now you can see why <code>useState</code> inside{" "}
          <code>useEffect</code> breaks:
        </p>

        <ul>
          <li>
            <strong>State tree:</strong> The new state variable doesn&apos;t get
            a slot — it&apos;s created inside a closure, invisible to
            React&apos;s tracking system.
          </li>
          <li>
            <strong>Closures:</strong> Each effect run creates a new closure
            with its own isolated state. It&apos;s not connected to the
            component&apos;s state tree. It&apos;s a ghost variable that exists
            in a parallel universe.
          </li>
        </ul>

        <pre>{`useEffect(() => {
  // Creates a new state variable in THIS closure's scope
  // Not in the component's state tree
  // React can't track it
  // Re-created every time the effect runs
  const [ghost, setGhost] = useState(0);
}, []);`}</pre>

        <h2>The Mental Model</h2>

        <p>Think of your component as a <strong>building</strong>:</p>

        <ul>
          <li>
            <strong>State tree</strong> = the building&apos;s address directory.
            Every room (state variable) has a fixed floor number (slot index).
          </li>
          <li>
            <strong>Closures</strong> = photographs taken at different times.
            Each photo captures the building as it was at that moment.
          </li>
          <li>
            <strong>useEffect</strong> = a photographer who visits the building
            and takes a snapshot. If you build a new room inside the
            photograph, it doesn&apos;t exist in the real building.
          </li>
        </ul>

        <p>
          Hooks must live at the top level because that&apos;s where the
          building&apos;s directory lives. Put them inside a photograph
          (closure), and the building&apos;s directory never knows they exist.
        </p>

        <hr />

        <p>
          <strong>Back to:</strong>{" "}
          <a href="/posts/why-you-cant-call-usestate-inside-useeffect">
            Why You Can&apos;t Call useState Inside useEffect
          </a>
        </p>
      </article>
    </div>
  );
}
