import { useCallback, useEffect, useRef, useState } from 'react';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || 'The request could not be completed.');
  return payload.data;
}

const initialForm = { title: '', scenario: '', difficulty: 'medium', caseType: 'any', tone: 'classic-detective' };

export default function App() {
  const [caseId, setCaseId] = useState(new URLSearchParams(window.location.search).get('case'));
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('checking');
  const [mystery, setMystery] = useState(null);
  const [error, setError] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [health, setHealth] = useState('checking');
  const [result, setResult] = useState(null);
  const [accusationId, setAccusationId] = useState('');
  const [confirmAccusation, setConfirmAccusation] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyBusy, setHistoryBusy] = useState(false);
  const skipCaseLoad = useRef(false);
  const confirmDialogRef = useRef(null);
  const [view, setView] = useState('case');
  const [investigation, setInvestigation] = useState(null);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceFilter, setEvidenceFilter] = useState('all');

  useEffect(() => {
    api('/health').then((data) => setHealth(data.database === 'connected' ? 'connected' : 'unavailable'))
      .catch(() => setHealth('unavailable'));
  }, []);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (confirmAccusation && dialog && !dialog.open) dialog.showModal();
    if (!confirmAccusation && dialog?.open) dialog.close();
  }, [confirmAccusation]);

  const loadCase = useCallback(async (id) => {
    setPhase('loading');
    setError('');
    try {
      const status = await api(`/mysteries/${id}/status`);
      if (status.status === 'failed' || status.status === 'archived') {
        throw new Error(status.progressMessage || 'This case is no longer available.');
      }
      if (status.status !== 'ready') {
        setPhase(status.status);
        window.setTimeout(() => loadCase(id), 1800);
        return;
      }
      const result = await api(`/mysteries/${id}`);
      setMystery(result.mystery);
      setView('case');
      setPhase('ready');
    } catch (requestError) {
      setError(requestError.message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (caseId && skipCaseLoad.current) {
      skipCaseLoad.current = false;
      return;
    }
    if (caseId) loadCase(caseId);
  }, [caseId, loadCase]);

  async function createMystery(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setPhase('generating');
    try {
      const result = await api('/mysteries', { method: 'POST', body: JSON.stringify(form) });
      window.history.pushState({}, '', `/?case=${encodeURIComponent(result.mysteryId)}`);
      setCaseId(result.mysteryId);
    } catch (requestError) {
      setError(requestError.message);
      setPhase('error');
    } finally {
      setBusy(false);
    }
  }

  async function openEvidenceRoom() {
    setError('');
    setView('opening-evidence');
    try {
      const opened = await api('/investigations', {
        method: 'POST', body: JSON.stringify({ mysteryId: caseId }),
      });
      const listed = await api(`/mysteries/${caseId}/evidence?page=1&limit=50`);
      setInvestigation(opened.investigation);
      setEvidenceItems(listed.items);
      setView('evidence');
    } catch (requestError) {
      setError(requestError.message);
      setView('case');
    }
  }

  async function inspectEvidence(evidenceId) {
    try {
      const [detail, saved] = await Promise.all([
        api(`/mysteries/${caseId}/evidence/${evidenceId}`),
        api(`/investigations/${investigation._id}/evidence/${evidenceId}/examined`, {
          method: 'PATCH', body: JSON.stringify({ examined: true }),
        }),
      ]);
      setSelectedEvidence(detail.evidence);
      setInvestigation(saved.investigation);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitAccusation() {
    if (!accusationId || !investigation) return;
    setError('');
    setConfirmAccusation(false);
    setView('submitting-accusation');
    try {
      const submitted = await api(`/investigations/${investigation._id}/accuse`, {
        method: 'POST', body: JSON.stringify({ suspectId: accusationId }),
      });
      setInvestigation(submitted.investigation);
      setResult(submitted.result);
      setView('results');
    } catch (requestError) {
      setError(requestError.message);
      setView('accusation');
    }
  }

  async function openHistory() {
    setHistoryBusy(true);
    setError('');
    try {
      const listed = await api('/investigations?limit=50');
      const detailed = await Promise.all(listed.items.map(async (item) => {
        const response = await api(`/investigations/${item._id}`);
        return { investigation: response.investigation, mystery: response.mystery, result: response.result };
      }));
      setHistory(detailed);
      setView('history');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setHistoryBusy(false);
    }
  }

  function resumeHistory(item) {
    const id = item.mystery._id;
    skipCaseLoad.current = true;
    window.history.pushState({}, '', `/?case=${encodeURIComponent(id)}`);
    setCaseId(id);
    setMystery(item.mystery);
    setInvestigation(item.investigation);
    setResult(item.result || null);
    setView(item.result ? 'results' : 'evidence');
    setPhase('ready');
  }

  function startOver() {
    window.history.pushState({}, '', '/');
    setCaseId(null);
    setMystery(null);
    setSelectedSuspect(null);
    setInvestigation(null);
    setSelectedEvidence(null);
    setEvidenceItems([]);
    setView('case');
    setResult(null);
    setAccusationId('');
    setPhase('checking');
    setError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); startOver(); }} aria-label="AI Mystery Room home">
          <span className="brand-mark" aria-hidden="true">M</span><span>AI MYSTERY ROOM</span>
        </a>
        <div className="topbar-right"><button className="history-link" onClick={openHistory} disabled={historyBusy}>{historyBusy ? 'OPENING FILES…' : 'MY INVESTIGATIONS'}</button><span className={`service-dot ${health}`} />{health === 'connected' ? 'CASE SYSTEM ONLINE' : health === 'checking' ? 'CHECKING CASE SYSTEM' : 'CASE SYSTEM UNAVAILABLE'}</div>
      </header>

      {!caseId && !busy && <section className="landing" aria-labelledby="page-title">
        <div className="intro-column">
          <div className="eyebrow"><span className="eyebrow-line" /> THE CASE FILES / 001</div>
          <h1 id="page-title">Every clue tells a story.<br /><em>Find the truth.</em></h1>
          <p className="lead">Step into a fictional investigation built around evidence, not guesswork. Read the file. Follow the details. Decide who had the means and motive.</p>
          <div className="promise"><span>01</span><p><strong>One case. One culprit.</strong><br />Each case is checked for a consistent, evidence-backed solution.</p></div>
          <div className="promise"><span>02</span><p><strong>Your investigation stays yours.</strong><br />Case files are private to your browser session.</p></div>
        </div>

        <section className="create-panel" aria-labelledby="create-title">
          <div className="panel-heading"><div><div className="eyebrow">OPEN A NEW FILE</div><h2 id="create-title">Build your mystery</h2></div><span className="panel-number">01—04</span></div>
          <form onSubmit={createMystery}>
            <label className="field-label" htmlFor="scenario">What happened? <span>50–3,000 characters</span></label>
            <textarea id="scenario" required minLength={50} maxLength={3000} value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} placeholder="Describe the fictional incident, its setting, and any details you want woven into the case…" />
            <div className="char-count">{form.scenario.length} / 3,000</div>
            <label className="field-label" htmlFor="title">Case title <span>Optional</span></label>
            <input id="title" maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A name for the case file" />
            <div className="field-grid">
              <label><span className="field-label">Difficulty</span><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option value="easy">Easy · 3 suspects</option><option value="medium">Medium · 4 suspects</option><option value="hard">Hard · 5 suspects</option></select></label>
              <label><span className="field-label">Case type</span><select value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })}><option value="any">Surprise me</option><option value="theft">Theft</option><option value="disappearance">Disappearance</option><option value="murder">Murder</option><option value="fraud">Fraud</option><option value="custom">Other</option></select></label>
            </div>
            <label className="field-label" htmlFor="tone">Atmosphere</label>
            <select id="tone" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}><option value="classic-detective">Classic detective</option><option value="psychological">Psychological</option><option value="noir">Noir</option><option value="lighthearted">Lighthearted</option></select>
            {error && <p className="error-message" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={busy || form.scenario.trim().length < 50 || health !== 'connected'}>{busy ? <><span className="spinner" />Preparing your case…</> : <>Create investigation <span aria-hidden="true">↗</span></>}</button>
            <p className="form-note">Fictional adults and evidence only. No real people or active cases.</p>
          </form>
        </section>
      </section>}

      {(busy || (caseId && phase !== 'ready')) && <section className="progress-view" aria-live="polite">
        <div className="eyebrow"><span className="eyebrow-line" /> {caseId ? `CASE FILE / ${caseId.slice(-6).toUpperCase()}` : 'NEW CASE FILE'}</div>
        <div className="progress-orbit"><span /></div>
        <h1>{phase === 'error' ? 'The file is unavailable.' : 'Putting the pieces together.'}</h1>
        <p>{error || (phase === 'validating' ? 'Checking every clue against the timeline and solution.' : 'Generating a fictional case and checking its evidence.')}</p>
        {phase === 'error' && <button className="secondary-button" onClick={startOver}>Return to case files</button>}
        {phase !== 'error' && <div className="progress-steps"><span className={phase !== 'loading' ? 'active' : ''}>Constructing the case</span><span className={phase === 'validating' ? 'active' : ''}>Checking the evidence</span><span>Opening the file</span></div>}
      </section>}

      {caseId && phase === 'ready' && mystery && view === 'case' && <section className="case-view">
        <button className="back-link" onClick={startOver}>← New case</button>
        <div className="case-kicker"><span className="eyebrow-line" /> {mystery.caseType.toUpperCase()} CASE <span>·</span> {mystery.difficulty.toUpperCase()}</div>
        <div className="case-heading"><div><h1>{mystery.title}</h1><p className="lead">{mystery.summary}</p></div><div className="case-stamp">CASE<br /><strong>OPEN</strong></div></div>
        <div className="incident-card"><div className="eyebrow">INCIDENT BRIEF</div><h2>{mystery.incident.description}</h2><p>{mystery.incident.location} <span>·</span> {new Date(mystery.incident.occurredAt).toLocaleString()}</p><div className="victim-line"><span>THE VICTIM</span><strong>{mystery.victim.name}</strong><p>{mystery.victim.description}</p></div></div>
        <div className="section-heading"><div><div className="eyebrow">PERSONS OF INTEREST</div><h2>Meet the suspects</h2></div><span>{mystery.suspects.length} PROFILES</span></div>
        <div className="suspect-grid">{mystery.suspects.map((suspect, index) => <article className={`suspect-card ${selectedSuspect?._id === suspect._id ? 'selected' : ''}`} key={suspect._id}>
          <div className="suspect-top"><span className="suspect-index">0{index + 1}</span><span className="suspect-age">{suspect.age} YEARS</span></div><h3>{suspect.name}</h3><p className="occupation">{suspect.occupation}</p><p className="suspect-bio">{suspect.biography}</p><button className="profile-action" onClick={() => setSelectedSuspect(selectedSuspect?._id === suspect._id ? null : suspect)} aria-expanded={selectedSuspect?._id === suspect._id}>{selectedSuspect?._id === suspect._id ? 'CLOSE PROFILE −' : 'READ PROFILE +'}</button>
          {selectedSuspect?._id === suspect._id && <div className="profile-details"><strong>Possible motive</strong><p>{suspect.motive}</p><strong>Stated alibi</strong><p>{suspect.alibi}</p></div>}
        </article>)}</div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="next-step"><div><span className="eyebrow">THE INVESTIGATION STARTS HERE</span><p>Read each profile carefully. The evidence file is next.</p></div><button className="primary-button evidence-entry" onClick={openEvidenceRoom}>Open evidence room <span aria-hidden="true">↗</span></button></div>
      </section>}

      {caseId && phase === 'ready' && mystery && view === 'opening-evidence' && <section className="progress-view" aria-live="polite"><div className="progress-orbit"><span /></div><h1>Preparing your evidence room.</h1><p>Opening your private investigation file.</p>{error && <p className="error-message">{error}</p>}</section>}

      {caseId && phase === 'ready' && mystery && view === 'evidence' && <section className="case-view evidence-view">
        <button className="back-link" onClick={() => setView('case')}>← Case overview</button>
        <div className="case-kicker"><span className="eyebrow-line" /> EVIDENCE ROOM <span>·</span> {investigation?.examinedEvidenceIds?.length || 0} / {evidenceItems.length} EXAMINED</div>
        <div className="section-heading"><div><div className="eyebrow">CASE FILE / {mystery.title.toUpperCase()}</div><h2>Evidence board</h2></div><span>FICTIONAL RECORDS</span></div>
        <div className="evidence-filters" role="group" aria-label="Filter evidence by type">{['all', 'chat', 'photo', 'cctv', 'witness', 'document', 'physical'].map((type) => <button key={type} className={evidenceFilter === type ? 'active' : ''} onClick={() => setEvidenceFilter(type)}>{type === 'all' ? 'All clues' : type}</button>)}</div>
        <div className="evidence-layout">
          <div className="evidence-board" aria-label="Evidence list">{evidenceItems.filter((item) => evidenceFilter === 'all' || item.type === evidenceFilter).map((item, index) => {
            const examined = investigation?.examinedEvidenceIds?.includes(item._id);
            return <button className={`evidence-tile ${selectedEvidence?._id === item._id ? 'selected' : ''}`} key={item._id} onClick={() => inspectEvidence(item._id)}><div className="evidence-tile-head"><span className="evidence-number">CLUE {String(index + 1).padStart(2, '0')}</span>{examined && <span className="examined-mark">READ</span>}</div><h3>{item.title}</h3><p>{item.description}</p><div className="evidence-tile-foot"><span>{item.type.toUpperCase()}</span><time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString()}</time></div></button>;
          })}</div>
          <aside className="evidence-detail" aria-live="polite">{selectedEvidence ? <>
            <div className="eyebrow">{selectedEvidence.type.toUpperCase()} RECORD</div><h2>{selectedEvidence.title}</h2><p className="detail-description">{selectedEvidence.description}</p>
            {selectedEvidence.type === 'photo' && <div className="image-fallback"><span>FICTIONAL IMAGE / TEXT FALLBACK</span><p>{selectedEvidence.content?.imagePrompt || selectedEvidence.description}</p></div>}
            {selectedEvidence.type === 'cctv' && <div className="image-fallback"><span>FICTIONAL CCTV LOG / NO FOOTAGE</span><p>{selectedEvidence.content?.log || selectedEvidence.content?.observation || selectedEvidence.description}</p></div>}
            {selectedEvidence.type === 'chat' && Array.isArray(selectedEvidence.content?.messages) && <div className="chat-transcript">{selectedEvidence.content.messages.map((message, index) => <div className="chat-message" key={`${message.timestamp}-${index}`}><strong>{message.sender}</strong><time>{new Date(message.timestamp).toLocaleString()}</time><p>{message.text}</p></div>)}</div>}
            {selectedEvidence.type === 'witness' && <div className="statement-card"><span>WITNESS STATEMENT</span><p>{selectedEvidence.content?.statement || selectedEvidence.content?.text || selectedEvidence.description}</p></div>}
            {['document', 'physical'].includes(selectedEvidence.type) && <div className="statement-card"><span>{selectedEvidence.type.toUpperCase()} NOTES</span><p>{selectedEvidence.content?.text || selectedEvidence.content?.details || selectedEvidence.description}</p></div>}
            <div className="detail-meta"><span>LOCATION</span><strong>{selectedEvidence.location || 'Not specified'}</strong><span>RECORDED</span><strong>{new Date(selectedEvidence.timestamp).toLocaleString()}</strong><span>IMPORTANCE</span><strong>{selectedEvidence.importance}</strong></div>
          </> : <div className="empty-detail"><span>SELECT A CLUE</span><p>Open an evidence card to inspect its fictional record. Examined clues are saved to this investigation.</p></div>}</aside>
        </div>
        <section className="timeline-panel"><div className="eyebrow">EVENT ORDER</div><h2>Timeline</h2><ol>{mystery.timeline.map((event, index) => <li key={`${event.timestamp}-${index}`}><time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time><p>{event.description}</p><span>{event.confidence.toUpperCase()}</span></li>)}</ol></section>
        <div className="accuse-cta"><div><span className="eyebrow">READY TO DRAW A CONCLUSION?</span><p>Choose the person whose account best fits the evidence.</p></div><button className="primary-button evidence-entry" onClick={() => { setAccusationId(''); setView('accusation'); }}>Make an accusation <span aria-hidden="true">↗</span></button></div>
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>}

      {caseId && phase === 'ready' && mystery && view === 'accusation' && <section className="case-view accusation-view">
        <button className="back-link" onClick={() => setView('evidence')}>← Evidence room</button>
        <div className="case-kicker"><span className="eyebrow-line" /> FINAL DEDUCTION</div><h1>Who is responsible?</h1><p className="lead">Choose the suspect whose motive, alibi, and evidence record best explain what happened.</p>
        <div className="accusation-options" role="radiogroup" aria-label="Select a suspect">{mystery.suspects.map((suspect) => <button key={suspect._id} role="radio" aria-checked={accusationId === suspect._id} className={`accusation-option ${accusationId === suspect._id ? 'selected' : ''}`} onClick={() => setAccusationId(suspect._id)}><span className="radio-dot" /><span><strong>{suspect.name}</strong><small>{suspect.occupation}</small></span><span className="option-arrow">→</span></button>)}</div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button accusation-submit" disabled={!accusationId} onClick={() => setConfirmAccusation(true)}>Submit final accusation <span aria-hidden="true">↗</span></button>
        <dialog ref={confirmDialogRef} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-copy" onCancel={(event) => { event.preventDefault(); setConfirmAccusation(false); }}><div className="eyebrow">FINAL SUBMISSION</div><h2 id="confirm-title">Lock in your accusation?</h2><p id="confirm-copy">Submitting completes this investigation and reveals the case solution. You cannot change this choice afterward.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setConfirmAccusation(false)}>Review evidence</button><button className="primary-button" onClick={submitAccusation}>Confirm accusation</button></div></dialog>
      </section>}

      {view === 'submitting-accusation' && <section className="progress-view" aria-live="polite"><div className="progress-orbit"><span /></div><h1>Checking the case file.</h1><p>The result is being evaluated against the private solution.</p></section>}

      {view === 'results' && result && <section className="case-view result-view">
        <button className="back-link" onClick={openHistory}>← Investigation history</button><div className="case-kicker"><span className="eyebrow-line" /> CASE CLOSED</div>
        <div className={`result-banner ${result.isCorrect ? 'correct' : 'incorrect'}`}><div className="eyebrow">{result.isCorrect ? 'YOUR DEDUCTION WAS CORRECT' : 'THE EVIDENCE LED ELSEWHERE'}</div><h1>{result.isCorrect ? 'Well reasoned.' : 'The case is solved.'}</h1><p>{result.isCorrect ? `You identified ${result.culprit?.name}.` : `You accused ${result.accused?.name}; the evidence points to ${result.culprit?.name}.`}</p><span className="result-score">SCORE / {result.score}</span></div>
        <section className="solution-panel"><div className="eyebrow">THE SOLUTION</div><h2>{result.culprit?.name}</h2><p>{result.summary}</p><div className="solution-facts"><article><span>MOTIVE</span><p>{result.motive}</p></article><article><span>METHOD</span><p>{result.method}</p></article></div>
          <h3>How the evidence fits</h3><ol className="solution-steps">{result.steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>
          <div className="solution-clues">{result.keyEvidence.map((item) => <article key={item.id}><span>{item.type.toUpperCase()} · KEY EVIDENCE</span><strong>{item.title}</strong><p>{item.explanation}</p></article>)}</div>
          <div className="reasoning-list">{result.reasoning.map((item, index) => <article key={`${item.evidenceTitle}-${index}`}><span>{item.relationship.toUpperCase()} · {item.evidenceTitle}</span><p>{item.explanation}</p></article>)}</div>
        </section><button className="secondary-button" onClick={openHistory}>View investigation history</button>
      </section>}

      {view === 'history' && <section className="case-view history-view"><button className="back-link" onClick={() => caseId ? setView(result ? 'results' : 'case') : startOver()}>← Return</button><div className="case-kicker"><span className="eyebrow-line" /> YOUR PRIVATE FILES</div><h1>Investigation history</h1><p className="lead">Cases and results saved to this browser session.</p>
        {error && <p className="error-message" role="alert">{error}</p>}
        {history.length ? <div className="history-list">{history.map((item) => <button key={item.investigation._id} className="history-item" onClick={() => resumeHistory(item)}><span className={`history-status ${item.investigation.status}`}>{item.investigation.status === 'completed' ? 'CLOSED' : 'ACTIVE'}</span><strong>{item.mystery.title}</strong><span>{new Date(item.investigation.updatedAt).toLocaleString()}</span><small>{item.investigation.status === 'completed' ? `Score ${item.investigation.score ?? 0} · ${item.result?.isCorrect ? 'Correct accusation' : 'Solution revealed'}` : 'Resume investigation'}</small></button>)}</div> : <div className="empty-history"><span>NO SAVED INVESTIGATIONS</span><p>Start a case and your progress will appear here.</p><button className="secondary-button" onClick={startOver}>Create a case</button></div>}
      </section>}
      <footer className="site-footer"><span>FICTIONAL CASES ONLY</span><span>AI MYSTERY ROOM <i>·</i> {caseId ? 'CASE FILE' : 'INVESTIGATOR’S DESK'}</span></footer>
    </main>
  );
}
