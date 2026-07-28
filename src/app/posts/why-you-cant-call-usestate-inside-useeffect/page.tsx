import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why You Can't Call useState Inside useEffect",
  description:
    "React's Rules of Hooks exist for a reason. Here's what happens when you break them — and how to fix it.",
  openGraph: {
    title: "Why You Can't Call useState Inside useEffect",
    description:
      "React's Rules of Hooks exist for a reason. Here's what happens when you break them — and how to fix it.",
    type: "article",
  },
};

export default function PostWhyYouCantCallUseStateInsideUseEffect() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
      <article className="prose-memoir">
        <h1>Why You Can&apos;t Call useState Inside useEffect</h1>

        <p>
          I was quizzing myself on React fundamentals when I hit this question:
          <em>&quot;What happens when you call useState inside useEffect without
          a dependency array?&quot;</em>
        </p>

        <p>
          My first instinct was: <strong>&quot;We don&apos;t do that.&quot;</strong>
          But I couldn&apos;t explain <em>why</em>. And if you can&apos;t explain
          why something is wrong, you&apos;re one bad day away from doing it
          anyway.
        </p>

        <p>
          So here&apos;s the full breakdown — for future me, and for anyone else
          who&apos;s ever written a hook inside a hook and felt a vague sense of
          dread.
        </p>

        <h2>The Forbidden Pattern</h2>

        <p>Here&apos;s what the mistake looks like:</p>

        <pre>{`useEffect(() => {
  const [count, setCount] = useState(0);  // ❌ useState INSIDE useEffect

  setCount(prev => prev + 1);
}, []);`}</pre>

        <p>
          Looks innocent enough. You&apos;re just initializing some state and
          updating it when the component mounts. What could go wrong?
        </p>

        <p>
          <strong>Everything.</strong>
        </p>

        <h2>Why It Breaks</h2>

        <h3>1. React Tracks Hooks by Call Order</h3>

        <p>
          When React renders your component, it doesn&apos;t know anything
          about your code — it just sees a list of hook calls. It tracks them
          by <strong>the order they appear</strong>, top to bottom, every single
          render.
        </p>

        <p>
          When you put <code>useState</code> inside <code>useEffect</code>,
          you&apos;re creating a <strong>new state variable inside a
          closure</strong> — one that React can&apos;t track because it&apos;s
          not in the top-level hook sequence.
        </p>

        <h3>2. It Violates the Rules of Hooks</h3>

        <p>
          React&apos;s official rule is dead simple:
        </p>

        <blockquote>
          <p>
            <strong>Don&apos;t call hooks inside loops, conditions, or nested
            functions.</strong> Only call hooks at the top level of your React
            function.
          </p>
        </blockquote>

        <p>
          This exists because React needs to call the <strong>same hooks in
          the same order</strong> every render. If you move a hook inside a
          <code>useEffect</code> that conditionally runs, the hook count
          changes between renders — and React crashes.
        </p>

        <pre>{`// ❌ This crashes React
useEffect(() => {
  if (someCondition) {
    const [data, setData] = useState(null);  // Different hook count per render
  }
}, [someCondition]);`}</pre>

        <p>
          You&apos;ll see this error:
        </p>

        <pre>{`Error: Rendered more hooks than during the previous render.`}</pre>

        <h3>3. Each Render Has Its Own Scope</h3>

        <p>
          Every time your component renders, <code>useEffect</code> creates a
          new closure. A <code>useState</code> inside that closure creates a
          <strong>completely separate state variable</strong> that doesn&apos;t
          connect to the component&apos;s state tree.
        </p>

        <p>
          It&apos;s like writing a function inside a function — the inner
          function&apos;s variables are invisible to the outer scope. Same
          principle, same problem.
        </p>

        <h2>The Fix</h2>

        <p>
          Move your hooks to the <strong>top level</strong> of the component,
          where React can see and track them:
        </p>

        <pre>{`// ✅ RIGHT — hooks at top level
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(prev => prev + 1);
}, []);`}</pre>

        <p>
          Now React tracks <code>count</code> as part of the component&apos;s
          state tree. The effect runs after render, updates the state, and
          React re-renders with the new value. Clean, predictable, correct.
        </p>

        <h2>The TL;DR</h2>

        <p>
          Hooks are a <strong>contract</strong> between your component and
          React&apos;s reconciler. You call them the same way every render,
          and React promises to track their state reliably. Break the contract,
          and React loses its ability to reconcile — leading to crashes,
          corrupted state, or silent bugs that haunt you for days.
        </p>

        <p>
          <strong>Next time someone asks:</strong> &quot;Hooks must always be
          called at the top level of the component — never inside other hooks,
          effects, or conditions — because React tracks them by call order.&quot;
        </p>

        <hr />

        <p>
          <em>This post was born from a self-quiz session. Sometimes the best
          way to learn something is to realize you can&apos;t explain it — then
          fix that.</em>
        </p>
      </article>
    </div>
  );
}
