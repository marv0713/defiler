import { GAME_CORE_VERSION } from "@warring-states/game-core";

export default function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="app-title">
        <p className="eyebrow">Web MVP scaffold</p>
        <h1 id="app-title">Warring States: Card Tactics</h1>
        <p>
          A browser-first tactical card game prototype with shared game logic
          prepared for future clients.
        </p>
        <dl className="status-list">
          <div>
            <dt>Game core</dt>
            <dd>{GAME_CORE_VERSION}</dd>
          </div>
          <div>
            <dt>Current phase</dt>
            <dd>Project setup</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

