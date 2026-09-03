# On-device model assets

These files are deliberately not committed: they are large binaries, and one of
them needs a licence decision recorded before it ships. `.gitignore` excludes
everything in this directory except this file.

Fetch them into `public/models/` and `public/wasm/` before running the app.

## `models/face_landmarker.task` (~3 MB)

MediaPipe Face Landmarker, Apache-2.0. Provides the chin and eye-line
measurements. Download from Google's model garden:

    https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

## `models/u2netp.onnx` (~4.7 MB) — the default

U2-Net small variant, Apache-2.0. Produces the person mask used both to replace
the background and to locate the crown of the head.

## `models/birefnet.onnx` (~220 MB) — optional quality upgrade

BiRefNet, MIT. Noticeably better on fine hair than U2-Net, at forty times the
download. Worth offering as an opt-in for users whose first result has ragged
hair edges; not worth making the default.

## Do not use RMBG

BRIA's RMBG 1.4 and 2.0 give the best masks of any openly available weights and
are the obvious thing to reach for. Their licence permits non-commercial use
only, and this site carries advertising, which makes our use commercial.
`assertCommercialUseAllowed` in `src/lib/photo/matting-model.ts` will throw
rather than load a model flagged that way. Do not work around it — either buy a
commercial licence from BRIA and update the flag, or stay on U2-Net/BiRefNet.

## WASM runtimes

Both runtimes are served from this origin rather than a CDN, so that a visitor's
use of a passport photo tool is not disclosed to a third party. Copy them out of
`node_modules` as a build step:

    cp node_modules/onnxruntime-web/dist/*.wasm public/wasm/ort/
    cp -r node_modules/@mediapipe/tasks-vision/wasm/* public/wasm/mediapipe/
