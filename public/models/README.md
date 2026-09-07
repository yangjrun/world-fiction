# On-device model assets

These files are deliberately not committed because they are large binaries.
`.gitignore` excludes everything in this directory except this file.

`pnpm build` downloads the two default models when missing and verifies their
pinned SHA-256 hashes before building. Existing files with unexpected hashes
fail the build instead of being overwritten. For local development, run:

    pnpm setup:models

The download URLs and hashes are recorded in `scripts/setup-models.mjs`.
Downloads happen on the build machine; visitors load all assets from this site.

## `models/face_landmarker.task` (~3 MB)

MediaPipe Face Landmarker, Apache-2.0. Provides the chin and eye-line
measurements. Download from Google's model garden:

    https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

## `models/u2netp.onnx` (~4.7 MB) — the default

U2-Net small variant, Apache-2.0. Produces the person mask used both to replace
the background and to locate the crown of the head. The pinned ONNX export is
distributed with rembg:

    https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx

## `models/birefnet.onnx` (~220 MB) — optional quality upgrade

BiRefNet, MIT. Noticeably better on fine hair than U2-Net, at forty times the
download. Worth offering as an opt-in for users whose first result has ragged
hair edges; not worth making the default.

This optional model is not downloaded by the build. It exceeds Cloudflare Pages'
25 MiB single-file limit and would need separate asset hosting if enabled.

## Do not use RMBG

BRIA's RMBG 1.4 and 2.0 give the best masks of any openly available weights and
are the obvious thing to reach for. Their licence permits non-commercial use
only, and this site carries advertising, which makes our use commercial.
`assertCommercialUseAllowed` in `src/lib/photo/matting-model.ts` will throw
rather than load a model flagged that way. Do not work around it — either buy a
commercial licence from BRIA and update the flag, or stay on U2-Net/BiRefNet.

## WASM runtimes

Both runtimes are served from this origin rather than a CDN, so that a visitor's
use of a passport photo tool is not disclosed to a third party. `pnpm dev` and
`pnpm build` copy them from the installed dependencies automatically. To prepare
them manually after installing dependencies, run:

    pnpm setup:wasm

The application imports `onnxruntime-web/wasm` and requires the matching
`ort-wasm-simd-threaded.mjs` and `ort-wasm-simd-threaded.wasm` pair in
`public/wasm/ort/`. The copy script removes stale generated ONNX backends from
earlier builds. Do not switch back to the general ONNX entry without revisiting
this list: it needs JSEP, whose binary exceeds the Pages single-file limit.

See `docs/deploy-cloudflare-pages.md` for deployment settings.
