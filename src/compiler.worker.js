const vendor = new URL('/vendor/teavm-javac/', self.location.origin);
let compilerPromise;
let compiledBytes;

async function compiler() {
  if (!compilerPromise) {
    compilerPromise = (async () => {
      const module = await import(/* @vite-ignore */ new URL('teavm-javac.js', vendor).href);
      const [javacClasslib, runtimeClasslib] = await Promise.all(
        ['compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin'].map(async (name) => {
          const response = await fetch(new URL(name, vendor));
          if (!response.ok) throw new Error(`Could not load ${name}: ${response.status}`);
          return response.arrayBuffer();
        }),
      );
      return module.createCompiler({
        backend: 'js',
        compilerJs: new URL('compiler.js', vendor).href,
        javacClasslib,
        runtimeClasslib,
      });
    })().catch((error) => {
      compilerPromise = null;
      throw error;
    });
  }
  return compilerPromise;
}

async function compileSource(source) {
  compiledBytes = null;
  const diagnostics = [];
  let subscription;
  try {
    self.postMessage({ type: 'status', text: 'Loading the Java compiler…' });
    const instance = await compiler();
    subscription = instance.onDiagnostic((diagnostic) => diagnostics.push(diagnostic));
    instance.clearSources();
    instance.addSource('BrowserJavaExplorer.java', source);
    self.postMessage({ type: 'status', text: 'Compiling Java…' });
    if (!instance.compile()) throw new Error(formatDiagnostics(diagnostics) || 'Compilation failed');
    self.postMessage({ type: 'status', text: 'Emitting WebAssembly…' });
    const result = instance.emitWasm({
      mainClass: 'BrowserJavaExplorer',
      optimization: 'simple',
      fastGlobalAnalysis: true,
    });
    if (!result.ok || !result.bytes) throw new Error(formatDiagnostics(diagnostics) || 'WebAssembly generation failed');
    compiledBytes = result.bytes;
    self.postMessage({ type: 'compiled' });
  } finally {
    subscription?.dispose();
  }
}

async function runProgram() {
  if (!compiledBytes) throw new Error('Compile the Java source first.');
  const module = await import(/* @vite-ignore */ new URL('teavm-javac.js', vendor).href);
  let output = '';
  const program = await module.createJavaProgram(compiledBytes, {
    stdio: {
      stdout: (text) => { output += text; },
      stderr: (text) => { output += text; },
    },
    fs: false,
  });
  self.postMessage({ type: 'status', text: 'Running WebAssembly…' });
  await program.execute();
  self.postMessage({ type: 'result', text: output });
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'compile') await compileSource(data.source);
    if (data.type === 'run') await runProgram();
  } catch (error) {
    self.postMessage({
      type: 'error',
      phase: data.type,
      text: error instanceof Error ? error.message : String(error),
    });
  }
};

function formatDiagnostics(diagnostics) {
  return diagnostics
    .filter(({ severity }) => severity === 'error')
    .map(({ fileName, lineNumber, message }) => `${fileName}:${lineNumber}: ${message}`)
    .join('\n');
}
