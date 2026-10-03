# SpeakOut

> Practice turning what you *want to say* into spoken English: listen, hide, speak, and track your mastery sentence by sentence.

<!-- TODO: replace with a short GIF of the core flow (listen → hide → speak → set proficiency) -->
![Core flow demo](docs/demo.gif)

## 1. About the Project

### Why

There are plenty of tools for practicing input skills like listening, reading, and vocabulary, but in my experience, far fewer that let you collect the expressions *you* want to use and practice saying them out loud.

I kept running into the same gap: I could understand a sentence when I read or heard it, but I couldn't reliably produce it when I needed it.

What I needed was a way to check whether I could actually say what I wanted to say in English—and practice until I could. I built this app to address that gap.


### Key Features

Study sentences from the English script of your choice, organized in folders, and repeat this loop on one sentence at a time:

1. **Listen** to the English sentence with built-in text-to-speech (TTS).
2. **Hide** the English (and/or Korean) column and try to say it from the Korean prompt.
3. **Speak** into the microphone; speech-to-text (STT) shows what you said, or type it yourself.
4. **Reveal** the English and compare it with what you said.
5. **Rate** the sentence: `0` Brand new / `1` Shaky / `2` Acquired. Filter by level to focus on what still needs work.

Also included:
- **Dial-style practice view** that keeps one sentence centered, with neighbors fading out.
- **Table view** to scan, edit, delete, filter, and sort all sentences in a folder.
- **Add sentences** by typing them or uploading a CSV (`id, en, ko, transcript`, UTF-8).

## 2. Getting Started

**Prerequisites**
- Node.js (a version supported by Vite 8; see the [Vite docs](https://vite.dev/guide/))
- Google Chrome (required for speech recognition, see below)

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
npm run dev
```

Open http://localhost:5173 in **Chrome**.

Other commands: `npm run build` (production build to `dist/`), `npm test` (run tests with Vitest).

## 3. Tech Stack

| Area | Choice |
|---|---|
| Framework | React 19, Vite, JavaScript |
| Routing | react-router-dom 7 |
| Storage | localStorage (single JSON key), behind an async `storage/` layer |
| Speech | Web Speech API: `speechSynthesis` (TTS), `webkitSpeechRecognition` (STT) |
| UI | Plain CSS, lucide-react icons, Noto Sans KR / Plus Jakarta Sans |
| Testing | Vitest |


## License

[MIT](LICENSE)
