# Harness Engineering, Hands-On

An interactive tutorial on **harness engineering** — the discipline of designing the
instructions, state, verification and feedback systems around an AI coding agent so it
produces reliable work instead of confident guesses.

**Live site:** https://vkdev01.github.io/harness-engineering-tutorial/

## What's in it

Eleven chapters and nine interactive labs. Every lab is a small simulator: move a slider
or press a button and the numbers change, because the model behind them is the point.

| Chapter | Lab |
|---|---|
| 00 Start here | — |
| 01 Why capable agents fail | Failure triage — map a symptom to a harness layer |
| 02 What a harness is | Five-subsystem scorecard, judged by the weakest link |
| 03 The repo as source of truth | Fresh-session test (five questions) |
| 04 Instruction architecture | Context budget simulator + lost-in-the-middle position explorer |
| 05 Continuity and init | Three-session replay, bare vs harnessed |
| 06 Scope and feature lists | WIP = 1 attention calculator + `feature_list.json` builder |
| 07 Verification | The three-layer termination gate |
| 08 Observability and clean exits | Clean-exit checklist with a handoff grade |
| 09 Loops and graphs | `/goal` builder + loop-to-graph stepper |
| 10 Build your harness kit | Generates `AGENTS.md`, `feature_list.json`, `init.sh`, `progress.md` |


## Theme variants

Four visual directions are included and can be previewed side by side:

| Variant | Preview | Character |
|---|---|---|
| Swiss grid | `preview-swiss.html` | Light, heavy grotesque, black rules, one red accent |
| Terminal phosphor | `preview-terminal.html` | Near-black, all-monospace, green on scanlines |
| Editorial noir | `preview-noir.html` | Warm near-black, serif display, gold |
| Blueprint | `preview-blueprint.html` | Deep blue drawing grid, technical mono labels, amber |

The main `index.html` uses the default (paper/ink) theme. Each preview page is the same
content with one extra stylesheet from `themes/`. To adopt a variant permanently, replace
`assets/style.css` with that theme file and delete the extra link.

## Running locally

No build step, no dependencies, no network calls at runtime.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Progress is stored in `localStorage` under `harness-tutorial-v1`. Clearing site data resets it.

## Structure

```
index.html          all chapters and lab markup
assets/style.css    paper/ink design system
assets/app.js       router, progress, and all nine lab simulators
```

## Credits

The theory follows the MIT-licensed
[Learn Harness Engineering](https://github.com/walkinglabs/learn-harness-engineering) course,
which synthesises OpenAI's *Harness engineering* and Anthropic's *Effective harnesses for
long-running agents* / *Harness design for long-running application development*.

The prose, simulators, generated templates and design here are original to this page.
Not affiliated with the course authors.

## License

MIT
