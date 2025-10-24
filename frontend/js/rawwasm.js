// rawwasm.js
// Minimal WASM loader wrapper that exposes global RawWasm()
// Ensure rawwasm.wasm is available at the WASM_URL path.


(function (global) {
  const WASM_URL = './js/rawwasm.wasm';

  async function RawWasm() {
    if (RawWasm._instance) return RawWasm._instance;

    const resp = await fetch(WASM_URL);
    if (!resp.ok) throw new Error('Failed to fetch ' + WASM_URL + ' (' + resp.status + ')');
    const bytes = await resp.arrayBuffer();

    // Lightweight imports; adapt if your wasm requires more
    const memory = new WebAssembly.Memory({ initial: 256, maximum: 2048 });
    const imports = {
      env: {
        memory,
        abort: () => { throw new Error('WASM abort'); }
      }
    };

    const { instance } = await WebAssembly.instantiate(bytes, imports);
    const exports = instance.exports;

    function malloc(len) {
      if (!exports.malloc) throw new Error('WASM export malloc not found');
      return exports.malloc(len);
    }
    function free(ptr) {
      if (!exports.free) throw new Error('WASM export free not found');
      exports.free(ptr);
    }
    function copyToWasm(u8) {
      const ptr = malloc(u8.length);
      const memU8 = new Uint8Array(memory.buffer, ptr, u8.length);
      memU8.set(u8);
      return { ptr, len: u8.length };
    }
    function readWasmU8(ptr, len) {
      return new Uint8Array(memory.buffer, ptr, len).slice();
    }

    // JS wrapper matching expected wasm exports.
    class RawImage {
      constructor(u8array) {
        if (!(u8array instanceof Uint8Array)) throw new TypeError('RawImage expects Uint8Array');
        const { ptr, len } = copyToWasm(u8array);
        if (!exports.raw_create) throw new Error('WASM export raw_create not found');
        this._handle = exports.raw_create(ptr, len);
        this._filePtr = ptr;
        this._fileLen = len;
        this._destroyed = false;
      }

      decode() {
        if (!exports.raw_decode) throw new Error('WASM export raw_decode not found');
        const ok = exports.raw_decode(this._handle);
        if (!ok) throw new Error('WASM raw_decode failed');
        return ok;
      }

      get width() {
        if (!exports.raw_get_width) throw new Error('WASM export raw_get_width not found');
        return exports.raw_get_width(this._handle);
      }
      get height() {
        if (!exports.raw_get_height) throw new Error('WASM export raw_get_height not found');
        return exports.raw_get_height(this._handle);
      }

      getData() {
        if (!exports.raw_get_pixels_ptr || !exports.raw_get_pixels_len) {
          throw new Error('WASM exports raw_get_pixels_ptr/raw_get_pixels_len not found');
        }
        const ptr = exports.raw_get_pixels_ptr(this._handle);
        const len = exports.raw_get_pixels_len(this._handle);
        return readWasmU8(ptr, len);
      }

      destroy() {
        if (this._destroyed) return;
        if (exports.raw_destroy) exports.raw_destroy(this._handle);
        free(this._filePtr);
        this._destroyed = true;
      }
    }

    if (exports.raw_init) exports.raw_init();

    const module = { instance, exports, memory, RawImage, malloc, free };
    RawWasm._instance = module;
    return module;
  }

  global.RawWasm = RawWasm;
})(typeof window !== 'undefined' ? window : globalThis);
