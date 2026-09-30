import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import source from './BrowserJavaExplorer.java?raw';
import './style.css';

function App() {
  const [code, setCode] = useState(source);
  const [status, setStatus] = useState('Ready');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function worker() {
    if (workerRef.current) return workerRef.current;
    const instance = new Worker(new URL('./compiler.worker.js', import.meta.url), { type: 'module' });
    instance.onmessage = ({ data }) => {
      if (workerRef.current !== instance) return;
      if (data.type === 'status') setStatus(data.text);
      if (data.type === 'compiled') {
        setCompiled(true);
        setBusy(false);
        setStatus('Compiled — ready to run');
      }
      if (data.type === 'result') {
        setOutput(data.text);
        setStatus('Done');
        setBusy(false);
      }
      if (data.type === 'error') {
        setOutput(data.text);
        if (data.phase === 'compile') setCompiled(false);
        setStatus('Failed');
        setBusy(false);
      }
    };
    instance.onerror = (error) => {
      if (workerRef.current !== instance) return;
      setOutput(error.message || 'Worker failed');
      setStatus('Failed');
      setCompiled(false);
      setBusy(false);
      instance.terminate();
      workerRef.current = null;
    };
    workerRef.current = instance;
    return instance;
  }

  function changeCode(value) {
    setCode(value);
    setCompiled(false);
    setOutput('');
    setStatus('Source changed — compile again');
  }

  function compile() {
    setBusy(true);
    setCompiled(false);
    setOutput('');
    worker().postMessage({ type: 'compile', source: code });
  }

  function run() {
    if (!compiled) return;
    setBusy(true);
    setOutput('');
    worker().postMessage({ type: 'run' });
  }

  function stop() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setCompiled(false);
    setStatus('Stopped');
    setOutput('Stopped. Compile the source again to run it.');
  }

  return <main>
    <p className="eyebrow">TeaVM + React + Vite</p>
    <h1>What environment does browser Java see?</h1>
    <p>Edit the Java program, compile it directly in your browser, then run the WebAssembly. Explore TeaVM's Java 21 environment, count primes, and draw a tiny Mandelbrot set.</p>
    <label htmlFor="source">BrowserJavaExplorer.java</label>
    <textarea id="source" spellCheck="false" value={code} disabled={busy} onChange={(event) => changeCode(event.target.value)} />
    <div className="actions">
      <button type="button" onClick={compile} disabled={busy}>Compile Java</button>
      <button className="secondary" type="button" onClick={run} disabled={!compiled || busy}>Run Java</button>
      <button className="secondary" type="button" onClick={stop} disabled={!busy}>Stop</button>
      <span role="status">{status}</span>
    </div>
    <label htmlFor="output">Output</label>
    <pre id="output" aria-live="polite">{output || (compiled ? 'Compilation succeeded. Click Run Java.' : 'Compile the source to enable Run Java.')}</pre>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
