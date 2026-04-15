// Minimal Buffer shim for the browser.
//
// gray-matter (and transitively `section-matter` / `strip-bom-string`) calls
// `Buffer.from(str)` to attach a `.orig` property to the parsed file. We never
// read that property and we only ever feed strings in, so a tiny shim that
// quacks like `Buffer.from` and `Buffer.isBuffer` is enough. We deliberately
// avoid pulling in the full `buffer` npm package to keep the bundle small.

type BufferShim = {
  from: (input: unknown) => unknown;
  isBuffer: (val: unknown) => boolean;
};

const g = globalThis as unknown as { Buffer?: BufferShim };

if (typeof g.Buffer === "undefined") {
  g.Buffer = {
    from(input: unknown): unknown {
      // Return the input as-is; gray-matter only reads `.orig` via String(),
      // and strings already coerce correctly.
      return input;
    },
    isBuffer(_val: unknown): boolean {
      return false;
    },
  };
}

export {};
