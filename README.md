# TeaVM compilation example

A small React/Vite app that compiles editable Java in a browser worker, emits WebAssembly, runs it there, and displays stdout. No server receives the Java source.

Requires Node.js 20.19+ or 22.12+. Clone this repository and run:

```sh
git clone https://github.com/petrpravda/teavm-compilation-example.git
cd teavm-compilation-example
npm ci
npm run dev
```

Open the URL Vite prints. Click **Compile Java**, then **Run Java**. Run stays disabled until compilation succeeds; editing the source requires another compile. `npm run build` creates a static site in `dist/`.

Click **Stop** to interrupt compilation or a running program, including an
infinite loop. Your edited source stays in the editor. Compile it again before
running, because stopping discards the worker and its compiled program.

The five browser compiler files in `public/vendor/teavm-javac/` come from [Vsprocessing/teavm-javac](https://github.com/Vsprocessing/teavm-javac/tree/3503e025bc688a5f116ffbf3059976fba7cfe7c9/dist/teavm-javac) at commit `3503e025bc688a5f116ffbf3059976fba7cfe7c9`. Its `LICENSE` is included alongside them. This example selects the JavaScript compiler backend, so it does not need the compiler's own Wasm binary. The wrapper still imports its Wasm runtime module. The **program it emits and runs is WebAssembly**.

The vendored `teavm-javac.js` has two local fixes: default compiler requests
reuse the runtime cache, and program execution completes when the Java `main`
callback fires even if the program has no `teavm_stopped` export.

The Java program reports TeaVM's Java and OS properties, selected environment variables, locale, time zone, charset, and runtime readings. It then counts primes below 10,000 and draws an ASCII Mandelbrot set. TeaVM's class library reports `java.version` and `java.vm.version` as `21`. `System.getenv()` with no argument is unavailable here, so the example asks for relevant names individually.
