"""Render the lesson audio using Piper and a local Thorsten voice model."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import wave

from piper import PiperVoice


def selected_texts(studio):
    script = """
global.window = {};
require('./beginner-content.js');
require('./study-content.js');
const selected = window.BEGINNER_LESSONS.filter((item) => ['a0-01', 'a0-07'].includes(item.id));
const phrases = selected.flatMap((item) => [...item.words, ...item.examples].map(([de]) => de));
const labs = window.STUDY_CONTENT.labs.map((item) => item.text);
process.stdout.write(JSON.stringify([...new Set([...phrases, ...labs])]));
"""
    return json.loads(subprocess.check_output(["node", "-e", script], cwd=studio))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path, help="Piper ONNX model, with its JSON beside it")
    args = parser.parse_args()
    studio = Path(__file__).resolve().parent.parent
    voice = PiperVoice.load(args.model)
    media = studio / "media" / "thorsten"
    media.mkdir(parents=True, exist_ok=True)
    index = {}
    with tempfile.TemporaryDirectory() as temp:
        wav = Path(temp) / "phrase.wav"
        for phrase in selected_texts(studio):
            name = hashlib.sha256(phrase.encode("utf-8")).hexdigest()[:14] + ".mp3"
            with wave.open(str(wav), "wb") as audio:
                voice.synthesize_wav(phrase, audio)
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-b:a", "40k", str(media / name)],
                check=True,
            )
            index[phrase] = f"media/thorsten/{name}"
    encoded = json.dumps(index, ensure_ascii=False, indent=2)
    (studio / "media-index.js").write_text(f"globalThis.LILI_AUDIO = Object.freeze({encoded});\n", encoding="utf-8")
    print(f"{len(index)} audio clips")


if __name__ == "__main__":
    main()
