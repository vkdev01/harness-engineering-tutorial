/* ============================================================
   Harness Engineering, Hands-On — interactive tutorial
   Vanilla JS, no build step, no network calls.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- persistent state ---------- */
  var KEY = 'harness-tutorial-v1';
  var state = { visited: [], labs: {}, data: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* storage blocked — run in memory */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- router ---------- */
  var chapters = $$('.chapter');
  var ids = chapters.map(function (c) { return c.id; });

  function chapterDone(ch) {
    return Object.keys(state.labs || {}).some(function (k) {
      return ('ch-' + k.replace('lab-', '').replace(/[ab]$/, '')) === ch;
    });
  }

  function show(id) {
    if (ids.indexOf(id) === -1) id = 'ch-0';
    chapters.forEach(function (c) { c.classList.toggle('active', c.id === id); });
    $$('.sidenav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-ch') === id);
      a.classList.toggle('done', chapterDone(a.getAttribute('data-ch')));
    });
    var idx = ids.indexOf(id);
    $('#chapterCounter').textContent = pad(idx) + ' / ' + pad(ids.length - 1);
    if (state.visited.indexOf(id) === -1) { state.visited.push(id); save(); }
    paintProgress();
    if (id === 'ch-10') paintFinal();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function paintProgress() {
    var pct = Math.round((state.visited.length / ids.length) * 100);
    $('#progressFill').style.width = clamp(pct, 2, 100) + '%';
  }

  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    show(h || 'ch-0');
  }
  window.addEventListener('hashchange', route);

  $$('[data-next],[data-prev],[data-ch-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-next') || b.getAttribute('data-prev') || b.getAttribute('data-ch-link');
      location.hash = '#/' + t;
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    var cur = ids.indexOf((location.hash.replace(/^#\/?/, '') || 'ch-0'));
    if (e.key === 'ArrowRight' && cur < ids.length - 1) location.hash = '#/' + ids[cur + 1];
    if (e.key === 'ArrowLeft' && cur > 0) location.hash = '#/' + ids[cur - 1];
  });

  /* ---------- lab completion ---------- */
  var booted = false;
  function markLab(key) {
    if (!booted) return;              // ignore the initial render pass
    var lab = $('.lab[data-lab="' + key + '"]');
    if (!lab) return;
    state.labs[key] = true; save();
    var st = $('[data-status]', lab);
    if (st) { st.textContent = '✓ lab complete'; st.classList.add('ok'); }
    $$('.sidenav a').forEach(function (a) {
      a.classList.toggle('done', chapterDone(a.getAttribute('data-ch')));
    });
    if ($('#ch-10').classList.contains('active')) paintFinal();
  }

  /* ============================================================
     LAB 01 — failure triage
     ============================================================ */
  var TRIAGE = {
    done: {
      title: '"It said done. It wasn\'t."',
      layer: 'Layer: feedback',
      body: 'The agent used its own definition of done, which is "the code looks fine". Nothing executable contradicted it, so the claim stood. This is the verification gap, and it is the single most common harness failure.',
      fix: '<b>Fix:</b> write a definition of done that a command can check — lint, tests, and a real end-to-end flow — and require the command output to be recorded before a feature can move to passing.'
    },
    rediscover: {
      title: '"It re-explores the repo every session"',
      layer: 'Layer: state',
      body: 'There is no externalised state, so every session begins as somebody\'s first day. Exploration time is repeated per session, and the re-derived understanding may not match the last one.',
      fix: '<b>Fix:</b> a feature list plus a progress log, committed in the repo, read as step one of the startup workflow. The agent should read state before it reads code.'
    },
    conventions: {
      title: '"It ignores our conventions"',
      layer: 'Layer: instructions',
      body: 'The convention lives in a Slack thread or someone\'s head. The agent has exactly three inputs — task, repo contents, command output — and that rule is in none of them. It is not being disobedient; it has never seen the rule.',
      fix: '<b>Fix:</b> move the rule into the repo, close to where it applies. A short AGENTS.md for the invariants, a topic file inside the module for the detail.'
    },
    overreach: {
      title: '"It rewrote 12 files at once"',
      layer: 'Layer: scope',
      body: 'You did not draw a boundary, so the agent drew a generous one. Attention divides: k parallel tasks each get a share of the budget, and past a point none of them get enough to finish and be verified.',
      fix: '<b>Fix:</b> WIP = 1. One feature, end-to-end verification, commit, update the list, unlock the next. Blockers justify a narrow supporting fix, nothing wider.'
    },
    guessing: {
      title: '"It keeps guessing when tests fail"',
      layer: 'Layer: feedback / observability',
      body: 'The failure is visible but not legible: no trace, no scoring rubric, no statement of which signal matters. So each retry is a random walk and the real cause survives several attempts.',
      fix: '<b>Fix:</b> make the runtime observable — structured logs and traces, plus an evaluation rubric with evidence. A retry should be aimed, not hopeful.'
    }
  };

  $$('#triageChips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      $$('#triageChips .chip').forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      var d = TRIAGE[chip.getAttribute('data-symptom')];
      $('#triageOut').innerHTML =
        '<h4>' + d.title + '</h4>' +
        '<div class="layer">' + d.layer + '</div>' +
        '<p>' + d.body + '</p>' +
        '<div class="fix">' + d.fix + '</div>';
      markLab('lab-1');
    });
  });

  /* ============================================================
     LAB 02 — five-subsystem scorecard
     ============================================================ */
  var SUBS = [
    { id: 'instructions', name: 'Instructions', hint: 'AGENTS.md, conventions, definition of done' },
    { id: 'tools', name: 'Tools', hint: 'test runner, linters, scripts, integrations' },
    { id: 'environment', name: 'Environment', hint: 'init.sh, lockfiles, isolation, cold-clone start' },
    { id: 'state', name: 'State', hint: 'feature list, progress log, decision notes, git' },
    { id: 'feedback', name: 'Feedback', hint: 'tests, e2e, traces, evaluation rubric' }
  ];

  (function buildScorecard() {
    var host = $('#scorecard');
    if (!host) return;
    host.innerHTML = SUBS.map(function (s) {
      return '<div class="field">' +
        '<div class="field-head"><label for="sc-' + s.id + '">' + s.name + ' <span style="text-transform:none;letter-spacing:0;color:var(--ink-faint)">— ' + s.hint + '</span></label>' +
        '<span class="val" id="scv-' + s.id + '">2 / 4</span></div>' +
        '<input type="range" id="sc-' + s.id + '" min="0" max="4" step="1" value="2" data-sub="' + s.id + '">' +
        '<div class="m-track" style="height:6px;margin-top:4px"><i class="m-fill" id="scf-' + s.id + '" style="width:50%"></i></div>' +
        '</div>';
    }).join('');

    function colour(v) {
      return v <= 1 ? 'var(--danger)' : v === 2 ? 'var(--gold)' : v === 3 ? 'var(--sage)' : '#3f5c26';
    }

    function update() {
      var vals = {}, total = 0, worst = null;
      SUBS.forEach(function (s) {
        var v = parseInt($('#sc-' + s.id).value, 10);
        vals[s.id] = v; total += v;
        $('#scv-' + s.id).textContent = v + ' / 4';
        var f = $('#scf-' + s.id);
        f.style.width = (v / 4 * 100) + '%';
        f.style.background = colour(v);
        if (!worst || v < worst.v) worst = { v: v, s: s };
      });

      $('#sc-score').textContent = total;
      var vd = $('#sc-verdict');
      if (total === 20) {
        vd.innerHTML = '<strong>Fully harnessed.</strong> Now audit: remove one subsystem at a time and see whether performance actually drops. Some parts stop being load-bearing as models improve.';
      } else if (worst.v <= 1) {
        vd.innerHTML = '<strong>Bottleneck: ' + worst.s.name.toLowerCase() + '</strong> (' + worst.v + '/4). Adding strength anywhere else is mostly wasted until this is fixed — a harness is a chain.';
      } else if (worst.v === 2) {
        vd.innerHTML = '<strong>Weakest: ' + worst.s.name.toLowerCase() + '</strong> (' + worst.v + '/4). You are getting sessions that mostly work and occasionally fail without explanation. Fix this layer before adding anything new.';
      } else {
        vd.innerHTML = '<strong>Solid across the board</strong> — weakest is ' + worst.s.name.toLowerCase() + ' at ' + worst.v + '/4. The next gain is usually sharper verification, not more instructions.';
      }
      state.data.scorecard = total; save();
      markLab('lab-2');
    }

    SUBS.forEach(function (s) { $('#sc-' + s.id).addEventListener('input', update); });
    update();
    markLab('lab-2');
  })();

  /* ============================================================
     shared checklist renderer
     ============================================================ */
  function buildChecklist(host, items, onChange) {
    host.innerHTML = items.map(function (it, i) {
      return '<div class="check-item" data-i="' + i + '">' +
        '<span class="check-box">✓</span>' +
        '<span class="check-text">' + it.q + (it.hint ? '<small>' + it.hint + '</small>' : '') + '</span>' +
        '<span style="display:flex;gap:4px;align-items:center">' +
        '<button class="btn small" data-ans="yes">Yes</button>' +
        '<button class="btn small" data-ans="no">No</button>' +
        '</span></div>';
    }).join('');

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ans]');
      if (!btn) return;
      var item = btn.closest('.check-item');
      var ans = btn.getAttribute('data-ans');
      item.classList.remove('yes', 'no');
      item.classList.add(ans);
      $('.check-box', item).textContent = ans === 'yes' ? '✓' : '✕';
      onChange();
    });
  }

  function answered(host) {
    var yes = 0, no = 0;
    $$('.check-item', host).forEach(function (it) {
      if (it.classList.contains('yes')) yes++;
      if (it.classList.contains('no')) no++;
    });
    return { yes: yes, no: no, total: $$('.check-item', host).length };
  }

  /* ============================================================
     LAB 03 — fresh-session test
     ============================================================ */
  (function () {
    var host = $('#fsList');
    if (!host) return;
    buildChecklist(host, [
      { q: 'What is this system?', hint: 'Answerable from README.md or AGENTS.md alone' },
      { q: 'How is it organised?', hint: 'ARCHITECTURE.md or module-level docs' },
      { q: 'How do I run it?', hint: 'init.sh, Makefile or package scripts that actually work' },
      { q: 'How do I verify it?', hint: 'Named test, lint and e2e commands' },
      { q: 'Where are we now?', hint: 'feature_list.json, progress log or recent git history' }
    ], function () {
      var a = answered(host);
      $('#fs-score').textContent = a.yes;
      var vd = $('#fs-verdict');
      if (a.yes + a.no < 5) { vd.textContent = 'Answer all five to see your score.'; return; }
      if (a.yes === 5) vd.innerHTML = '<strong>A fresh session can orient itself.</strong> That is the test that matters — not how good the docs are, but whether the repo alone is sufficient.';
      else if (a.yes >= 3) vd.innerHTML = '<strong>' + (5 - a.yes) + ' gap' + (5 - a.yes > 1 ? 's' : '') + '.</strong> Each one becomes exploration time at the start of every session, and exploration is where inconsistent decisions get made.';
      else vd.innerHTML = '<strong>The map is missing.</strong> A new session would spend its first third reconstructing the project. Start with AGENTS.md and a feature list; those two files fix most of this.';
      state.data.fresh = a.yes; save();
      markLab('lab-3');
    });
  })();

  /* ============================================================
     LAB 04a — context budget simulator
     ============================================================ */
  (function () {
    var linesEl = $('#cb-lines'), filesEl = $('#cb-files');
    if (!linesEl) return;
    var WINDOW = 200000, TOK_PER_LINE = 30, TOK_PER_FILE = 1200, TOOL_OUT = 30000;
    var mode = 'mono';

    function render() {
      var lines = parseInt(linesEl.value, 10);
      var files = parseInt(filesEl.value, 10);
      $('#cb-lines-v').textContent = lines + ' lines';
      $('#cb-files-v').textContent = files + ' files';

      var instr = mode === 'mono' ? lines * TOK_PER_LINE : Math.min(lines, 140) * TOK_PER_LINE + 2 * 1800;
      var src = files * TOK_PER_FILE;
      var used = instr + src + TOOL_OUT;
      var free = WINDOW - used;

      var segs = [
        { k: 'Instructions', v: instr, c: '#c2410c' },
        { k: 'Source files', v: src, c: '#2f4a5c' },
        { k: 'Tool output', v: TOOL_OUT, c: '#a97c1f' },
        { k: free >= 0 ? 'Left for reasoning' : 'OVERFLOW', v: Math.abs(free), c: free >= 0 ? '#5b7f3a' : '#a5281b' }
      ];

      var total = segs.reduce(function (a, s) { return a + s.v; }, 0);
      $('#cb-bar').innerHTML = segs.map(function (s) {
        var pct = (s.v / total) * 100;
        return '<div style="width:' + pct + '%;background:' + s.c + ';display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap">' +
          (pct > 11 ? Math.round(pct) + '%' : '') + '</div>';
      }).join('');

      $('#cb-legend').innerHTML = segs.map(function (s) {
        return '<span><span style="display:inline-block;width:9px;height:9px;background:' + s.c + ';border-radius:2px;margin-right:5px"></span>' +
          s.k + ' &middot; ' + Math.round(s.v / 1000) + 'k</span>';
      }).join('');

      var instrPct = (instr / WINDOW) * 100;
      var msg = '';
      if (free < 0) {
        msg = '<div class="callout warn"><span class="tag">Overflow</span><p>The session starts already over budget. The agent will not read the files it needs — it will skim, or work from filenames, and its "done" will be even less trustworthy than usual.</p></div>';
      } else if (instrPct > 8) {
        msg = '<div class="callout warn"><span class="tag">Instruction bloat</span><p>Instructions are eating <strong>' + instrPct.toFixed(0) + '%</strong> of the window before any code is read. A 600-line file is roughly 10–20k tokens, which is the 8–15% range where instruction bloat starts crowding out code reading and reasoning.</p></div>';
      } else if (instrPct > 5) {
        msg = '<div class="callout"><span class="tag">Borderline</span><p>Instructions at <strong>' + instrPct.toFixed(1) + '%</strong>. Workable, but every rule you add now is taken from the task rather than the file. Keep the root file under ~200 lines and route the rest.</p></div>';
      } else {
        msg = '<div class="callout"><span class="tag">Healthy</span><p>Instructions at <strong>' + instrPct.toFixed(1) + '%</strong> with ' + Math.round(free / 1000) + 'k tokens left for reasoning and verification. This is what a routed entry file buys you: the same rules, loaded when the task needs them.</p></div>';
      }
      $('#cb-warn').innerHTML = msg;
      state.data.instrPct = instrPct; save();
      markLab('lab-4a');
    }

    linesEl.addEventListener('input', render);
    filesEl.addEventListener('input', render);
    $$('#cb-mode .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('#cb-mode .chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        mode = c.getAttribute('data-mode');
        render();
      });
    });
    render();
    markLab('lab-4a');
  })();

  /* ============================================================
     LAB 04b — position and recall
     ============================================================ */
  (function () {
    var el = $('#att-pos');
    if (!el) return;
    var svg = $('#att-curve');

    function recall(p) { return 0.42 + 0.53 * Math.pow(Math.abs(2 * p - 1), 1.6); }

    function draw() {
      var p = parseInt(el.value, 10) / 100;
      var x0 = 46, x1 = 578, y0 = 158, y1 = 26;
      var W = x1 - x0;

      var pts = [];
      for (var i = 0; i <= 60; i++) {
        var t = i / 60;
        pts.push([x0 + t * W, y0 - (recall(t) - 0.35) / 0.65 * (y0 - y1)]);
      }
      var line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
      var area = line + ' L' + x1 + ' ' + y0 + ' L' + x0 + ' ' + y0 + ' Z';

      var px = x0 + p * W;
      var py = y0 - (recall(p) - 0.35) / 0.65 * (y0 - y1);
      var r = Math.round(recall(p) * 100);

      svg.innerHTML =
        '<defs><linearGradient id="attg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#c2410c" stop-opacity="0.20"/>' +
        '<stop offset="100%" stop-color="#c2410c" stop-opacity="0.02"/></linearGradient></defs>' +
        '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '" stroke="rgba(28,26,23,0.25)"/>' +
        '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + (y1 - 4) + '" stroke="rgba(28,26,23,0.25)"/>' +
        '<path d="' + area + '" fill="url(#attg)"/>' +
        '<path d="' + line + '" fill="none" stroke="#c2410c" stroke-width="2.2"/>' +
        '<rect x="' + (x0 + W * 0.32) + '" y="' + (y1 - 4) + '" width="' + (W * 0.36) + '" height="' + (y0 - y1 + 4) + '" fill="rgba(165,40,27,0.05)"/>' +
        '<line x1="' + px + '" y1="' + (y1 - 4) + '" x2="' + px + '" y2="' + y0 + '" stroke="#2f4a5c" stroke-width="1.2" stroke-dasharray="4 3"/>' +
        '<circle cx="' + px + '" cy="' + py + '" r="5.5" fill="#fffdf8" stroke="#2f4a5c" stroke-width="2.4"/>' +
        '<text x="' + px + '" y="' + (py - 13) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#2f4a5c">' + r + '%</text>' +
        '<text x="' + (x0 - 8) + '" y="' + (y1 + 2) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9" fill="#948c7f">high</text>' +
        '<text x="' + (x0 - 8) + '" y="' + (y0 + 2) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9" fill="#948c7f">low</text>' +
        '<text x="' + x0 + '" y="' + (y0 + 18) + '" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#948c7f">start of file</text>' +
        '<text x="' + x1 + '" y="' + (y0 + 18) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#948c7f">end of file</text>' +
        '<text x="' + (x0 + W / 2) + '" y="' + (y0 + 18) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#a5281b">the middle</text>';

      var lines = parseInt($('#cb-lines') ? $('#cb-lines').value : 600, 10);
      $('#att-pos-v').textContent = 'line ' + Math.round(p * lines) + ' of ' + lines;

      var vd = $('#att-verdict');
      if (p > 0.3 && p < 0.7) {
        vd.innerHTML = '<div class="callout warn"><span class="tag">Buried</span><p>Around <strong>' + r + '%</strong> relative recall at this position. A hard constraint — "all queries parameterised", "never commit secrets" — sitting mid-file is the rule most likely to be silently ignored. Move it to the top, or into its own file the agent must open.</p></div>';
      } else {
        vd.innerHTML = '<div class="callout"><span class="tag">Well placed</span><p>Around <strong>' + r + '%</strong> relative recall near an edge. Notice that position matters as much as wording: the same sentence is a different instruction depending on where it sits. That is why the entry file should hold the invariants and nothing else.</p></div>';
      }
      state.data.attPos = p; save();
      markLab('lab-4b');
    }

    el.addEventListener('input', draw);
    draw();
    markLab('lab-4b');
  })();

  /* ============================================================
     LAB 05 — session replay
     ============================================================ */
  (function () {
    var runBtn = $('#sim-run');
    if (!runBtn) return;
    var timers = [];

    var BARE = [
      { t: 0, p: 0, w: 0, txt: 'Session 1 — no progress file, no init phase', cls: 'head' },
      { t: 8, p: 0, w: 8, txt: 'reads 34 files to work out what the project is', cls: 'waste' },
      { t: 28, p: 40, w: 8, txt: 'implements ~40% of the feature', cls: '' },
      { t: 31, p: 40, w: 11, txt: 'context fills → rushed finish, tests skipped', cls: 'waste' },
      { t: 31, p: 40, w: 11, txt: 'session ends. Nothing written down.', cls: 'waste' },
      { t: 31, p: 40, w: 11, txt: 'Session 2 — starts from zero', cls: 'head' },
      { t: 46, p: 40, w: 26, txt: '15 min re-discovering files, tests, conventions', cls: 'waste' },
      { t: 71, p: 65, w: 26, txt: '25 min work — picks a different approach this time', cls: '' },
      { t: 74, p: 65, w: 29, txt: 'context fills again', cls: 'waste' },
      { t: 74, p: 65, w: 29, txt: 'Session 3 — starts from zero', cls: 'head' },
      { t: 88, p: 65, w: 43, txt: '14 min re-discovery', cls: 'waste' },
      { t: 108, p: 78, w: 43, txt: '20 min work → feature ~78%, two versions disagree', cls: '' },
      { t: 110, p: 78, w: 45, txt: 'ends with no verified state, nothing to trust', cls: 'waste' }
    ];

    var HARNESSED = [
      { t: 0, p: 0, w: 0, txt: 'Session 1 — dedicated init phase', cls: 'head' },
      { t: 6, p: 0, w: 0, txt: './init.sh green: deps, lint, tests, startup path', cls: 'good' },
      { t: 26, p: 45, w: 0, txt: '20 min on exactly one feature', cls: 'good' },
      { t: 28, p: 45, w: 0, txt: 'progress.md + feature_list.json updated, commit', cls: 'good' },
      { t: 28, p: 45, w: 0, txt: 'Session 2 — reads state (2 min)', cls: 'head' },
      { t: 30, p: 45, w: 0, txt: 'no re-discovery: picks the next unfinished item', cls: 'good' },
      { t: 55, p: 72, w: 0, txt: '25 min work, end-to-end flow green', cls: 'good' },
      { t: 57, p: 72, w: 0, txt: 'clean handoff committed', cls: 'good' },
      { t: 57, p: 72, w: 0, txt: 'Session 3 — reads state (2 min)', cls: 'head' },
      { t: 59, p: 72, w: 0, txt: 'picks up the last item directly', cls: 'good' },
      { t: 77, p: 100, w: 0, txt: '18 min → feature verified end to end', cls: 'good' },
      { t: 78, p: 100, w: 0, txt: 'done, and the repo is restartable', cls: 'good' }
    ];

    function clear() {
      timers.forEach(clearTimeout); timers = [];
      $('#sim-bare-log').innerHTML = '';
      $('#sim-h-log').innerHTML = '';
      $('#sim-bare-bar').style.width = '0%';
      $('#sim-h-bar').style.width = '0%';
      $('#sim-bare-time').textContent = '0 min';
      $('#sim-h-time').textContent = '0 min';
      $('#sim-bare-waste').textContent = '0 min';
      $('#sim-h-waste').textContent = '0 min';
      $('#sim-note').innerHTML = '';
    }

    function play(seq, logSel, barSel, timeSel, wasteSel, step) {
      var t = setTimeout(function () {
        var s = seq[step];
        var log = $(logSel);
        var d = document.createElement('div');
        d.className = s.cls || '';
        d.textContent = s.txt;
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
        $(barSel).style.width = s.p + '%';
        $(timeSel).textContent = s.t + ' min';
        $(wasteSel).textContent = s.w + ' min';
        if (step < seq.length - 1) play(seq, logSel, barSel, timeSel, wasteSel, step + 1);
      }, 520);
      timers.push(t);
    }

    runBtn.addEventListener('click', function () {
      clear();
      runBtn.disabled = true;
      play(BARE, '#sim-bare-log', '#sim-bare-bar', '#sim-bare-time', '#sim-bare-waste', 0);
      play(HARNESSED, '#sim-h-log', '#sim-h-bar', '#sim-h-time', '#sim-h-waste', 0);
      var done = setTimeout(function () {
        runBtn.disabled = false;
        $('#sim-note').innerHTML =
          '<div class="callout"><span class="tag">Result</span><p><strong>110 min vs 78 min</strong> for the same feature — and only one of them is finished. The bare column burned <strong>45 minutes</strong> re-deriving state it already had, then ended with two inconsistent implementations and nothing verified. The harnessed column spent 6 minutes on initialisation and 2 minutes per session rehydrating, and never repeated work.</p></div>';
        markLab('lab-5');
      }, 520 * (BARE.length + 1));
      timers.push(done);
    });

    $('#sim-reset').addEventListener('click', function () { clear(); runBtn.disabled = false; });
  })();

  /* ============================================================
     LAB 06a — WIP calculator
     ============================================================ */
  (function () {
    var el = $('#wip');
    if (!el) return;
    var C = 100, THRESH = 40;

    function render() {
      var k = parseInt(el.value, 10);
      var per = C / k;
      $('#wip-v').textContent = k;
      var host = $('#wip-bars');
      var html = '';
      for (var i = 1; i <= k; i++) {
        var pct = clamp(per, 0, 100);
        var ok = per >= THRESH;
        html += '<div class="meter">' +
          '<span class="m-label">task ' + i + '</span>' +
          '<span class="m-track"><i class="m-fill" style="width:' + pct + '%;background:' + (ok ? 'var(--sage)' : 'var(--danger)') + '"></i></span>' +
          '<span class="m-val">' + Math.round(per) + '</span>' +
          '</div>';
      }
      html += '<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);margin-top:6px">threshold to finish one task properly: ' + THRESH + ' units &nbsp;·&nbsp; C/k = ' + Math.round(per) + '</div>';
      host.innerHTML = html;

      var vd = $('#wip-verdict');
      if (k === 1) {
        vd.innerHTML = '<div class="callout"><span class="tag">WIP = 1</span><p><strong>' + Math.round(per) + ' units per task.</strong> Everything the session has goes into one item, which gets implemented, verified end to end, committed and recorded. This is the only configuration where "done" means something.</p></div>';
      } else if (k === 2) {
        vd.innerHTML = '<div class="callout"><span class="tag">Borderline</span><p><strong>' + Math.round(per) + ' units per task.</strong> Survivable for two genuinely coupled items, but verification quality already suffers — you will run the fast checks and skip the slow one.</p></div>';
      } else {
        vd.innerHTML = '<div class="callout warn"><span class="tag">Overreach</span><p><strong>' + Math.round(per) + ' units per task</strong> — below the threshold. None of these will finish. What you get is ' + k + ' partially-built features, tangled together, with no end-to-end verification anywhere. Anthropic\'s guidance is one feature at a time, verified and recorded before the next.</p></div>';
      }
      state.data.wip = k; save();
      markLab('lab-6a');
    }

    el.addEventListener('input', render);
    render();
    markLab('lab-6a');
  })();

  /* ============================================================
     LAB 06b — feature list builder
     ============================================================ */
  (function () {
    var rows = $('#feat-rows');
    if (!rows) return;

    var features = [
      { title: 'Create a conversation', behaviour: 'User clicks New Chat and sees an empty conversation', verify: 'pytest -q tests/test_chat.py::test_new', state: 'passing' },
      { title: 'Send a message', behaviour: 'Message appears in the active thread immediately', verify: '', state: 'in_progress' }
    ];

    function render() {
      rows.innerHTML = features.map(function (f, i) {
        return '<tr data-i="' + i + '">' +
          '<td><input type="text" data-f="title" value="' + esc(f.title) + '" placeholder="Feature title"></td>' +
          '<td><input type="text" data-f="behaviour" value="' + esc(f.behaviour) + '" placeholder="What the user can see happen"></td>' +
          '<td><input type="text" data-f="verify" value="' + esc(f.verify) + '" placeholder="exact command or steps" style="' + (f.verify.trim() ? '' : 'border-color:var(--danger)') + '"></td>' +
          '<td><select data-f="state">' +
          ['not_started', 'in_progress', 'blocked', 'passing'].map(function (s) {
            return '<option value="' + s + '"' + (f.state === s ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>';
          }).join('') +
          '</select></td>' +
          '<td><button class="rm" data-rm="' + i + '" title="Remove">&times;</button></td>' +
          '</tr>';
      }).join('');
      output();
    }

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    function output() {
      var missing = features.filter(function (f) { return !f.verify.trim(); }).length;
      var json = {
        project: 'replace-with-project-name',
        last_updated: new Date().toISOString().slice(0, 10),
        rules: { single_active_feature: true, passing_requires_evidence: true, do_not_skip_verification: true },
        status_legend: {
          not_started: 'Work has not begun.',
          in_progress: 'The feature is the current active task.',
          blocked: 'Work cannot continue until a documented blocker is resolved.',
          passing: 'Required verification has passed and evidence is recorded.'
        },
        features: features.map(function (f, i) {
          return {
            id: 'feat-' + String(i + 1).padStart(3, '0'),
            priority: i + 1,
            title: f.title || '(untitled)',
            user_visible_behavior: f.behaviour,
            status: f.state,
            verification: f.verify.trim() ? [f.verify] : [],
            evidence: [],
            notes: f.verify.trim() ? '' : 'MISSING VERIFICATION — this row cannot be marked passing'
          };
        })
      };
      $('#feat-json').textContent = JSON.stringify(json, null, 2);
      var warn = $('#feat-warn');
      if (missing) {
        warn.innerHTML = '<div class="callout warn"><span class="tag">Invalid</span><p><strong>' + missing + ' row' + (missing > 1 ? 's have' : ' has') + ' no verification.</strong> Without it the verifier has nothing to run and the agent falls back to its own standard — "the code looks fine". A row with no verification is a wish, not a feature.</p></div>';
      } else {
        warn.innerHTML = '<div class="callout"><span class="tag">Valid</span><p>Every row has a behaviour, a check and a state. This is now the shared data structure the scheduler, the verifier and the handoff writer all read from — which is why it belongs in the repo as machine-readable state, not in a chat transcript.</p></div>';
      }
      state.data.features = features.length; save();
      markLab('lab-6b');
    }

    rows.addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f');
      if (!f) return;
      var tr = e.target.closest('tr');
      var i = parseInt(tr.getAttribute('data-i'), 10);
      features[i][f] = e.target.value;
      if (f === 'verify') {
        e.target.style.borderColor = e.target.value.trim() ? '' : 'var(--danger)';
        output();
      } else { output(); }
    });
    rows.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-f') === 'state') {
        var tr = e.target.closest('tr');
        features[parseInt(tr.getAttribute('data-i'), 10)].state = e.target.value;
        output();
      }
    });
    rows.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (!b) return;
      features.splice(parseInt(b.getAttribute('data-rm'), 10), 1);
      render();
    });
    $('#feat-add').addEventListener('click', function () {
      features.push({ title: '', behaviour: '', verify: '', state: 'not_started' });
      render();
    });
    $('#feat-copy').addEventListener('click', function () { copy($('#feat-json').textContent, this); });
    $('#feat-dl').addEventListener('click', function () {
      download('feature_list.json', $('#feat-json').textContent);
    });

    render();
    markLab('lab-6b');
  })();

  /* ---------- helpers ---------- */
  function copy(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
  function download(name, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ============================================================
     LAB 07 — termination gate
     ============================================================ */
  (function () {
    var lintBtn = $('#gate-lint');
    if (!lintBtn) return;
    var ran = { lint: false, test: false, e2e: false };
    var con = $('#gate-console');

    function line(html) {
      var d = document.createElement('div');
      d.className = 'ln ' + (html.cls || '');
      d.innerHTML = html.t;
      con.appendChild(d);
      con.scrollTop = con.scrollHeight;
    }
    function clearCon() { con.innerHTML = ''; }
    function verdict(kind, stamp, text) {
      $('#gate-verdict').innerHTML =
        '<div class="verdict-box ' + kind + '"><span class="stamp">' + stamp + '</span><p>' + text + '</p></div>';
    }

    function refresh() {
      if (ran.lint && ran.test && ran.e2e) {
        verdict('fail', 'Rejected', '<strong>The gate worked.</strong> Three system-level defects surfaced that twelve green unit tests could not see. Had you accepted the agent\'s word, all three would have reached a user — and each one is a different class of defect: configuration, migration state, and behaviour over time.');
        markLab('lab-7');
        state.data.gate = 'caught'; save();
      }
    }

    lintBtn.addEventListener('click', function () {
      if (ran.lint) return;
      ran.lint = true; lintBtn.classList.add('on');
      clearCon();
      line({ t: '$ ruff check . &amp;&amp; mypy app', cls: 'dim' });
      line({ t: 'app/mailer.py:12:1: F401 unused import \'os\'', cls: 'warn' });
      line({ t: 'app/mailer.py:48: error: missing return type annotation', cls: 'warn' });
      line({ t: '2 issues — no blockers', cls: '' });
      line({ t: '→ gate 1 passed', cls: 'ok' });
      verdict('pending', 'Running', 'Lint and types are clean enough. That tells you the code is well-formed. It says nothing about whether the feature works.');
      refresh();
    });

    $('#gate-test').addEventListener('click', function () {
      if (ran.test) return;
      ran.test = true; $('#gate-test').classList.add('on');
      if (!ran.lint) clearCon();
      line({ t: '$ pytest -q', cls: 'dim' });
      line({ t: '............                        [100%]', cls: '' });
      line({ t: '12 passed in 3.41s', cls: 'ok' });
      line({ t: '→ gate 2 passed (the mailer is mocked)', cls: 'ok' });
      verdict('pending', 'Looks done', 'Twelve unit tests green. This is exactly the point where most people accept "done" — and exactly the point where the expensive defects are still invisible.');
      refresh();
    });

    $('#gate-e2e').addEventListener('click', function () {
      if (ran.e2e) return;
      ran.e2e = true; $('#gate-e2e').classList.add('on');
      if (!ran.lint && !ran.test) clearCon();
      line({ t: '$ pytest -q tests/e2e', cls: 'dim' });
      line({ t: 'FAILED test_reset_flow.py::test_reset_link_sent', cls: 'bad' });
      line({ t: '  SMTPAuthenticationError: MAIL_HOST is not configured', cls: 'bad' });
      line({ t: 'FAILED test_reset_flow.py::test_migration_clean', cls: 'bad' });
      line({ t: '  migration 0042_reset_tokens failed halfway: column already exists', cls: 'bad' });
      line({ t: 'FAILED test_reset_flow.py::test_token_expiry', cls: 'bad' });
      line({ t: '  link still valid after 48h (expected 1h)', cls: 'bad' });
      line({ t: '3 failed, 0 passed in 12.8s', cls: 'bad' });
      line({ t: '→ gate 3 FAILED', cls: 'bad' });
      refresh();
    });

    $('#gate-ship').addEventListener('click', function () {
      var all = ran.lint && ran.test && ran.e2e;
      if (all) return;
      verdict('fail', 'Shipped broken', 'You accepted a claim instead of evidence. Three defects are now in production: <strong>configuration</strong> (the mail host was never set), <strong>state propagation</strong> (a half-applied migration left the schema inconsistent), and <strong>behaviour over time</strong> (expiry silently ignored). Every one of them is invisible to the twelve passing unit tests.');
      markLab('lab-7');
      state.data.gate = 'shipped'; save();
    });
  })();

  /* ============================================================
     LAB 08 — clean exit checklist
     ============================================================ */
  (function () {
    var host = $('#exitList');
    if (!host) return;
    buildChecklist(host, [
      { q: 'The build passed when the session ended', hint: 'The next session did not have to fix it first' },
      { q: 'All tests passed, including pre-existing ones', hint: 'Not "the new ones pass" — the whole suite' },
      { q: 'Verification ran in CI, not just locally', hint: '"Works on my machine" is not evidence' },
      { q: 'Feature state and progress were written down', hint: 'With the command and result as evidence' },
      { q: 'Temp files, debug prints and scaffolding were removed', hint: 'Drift compounds when nobody cleans' },
      { q: 'A cold clone still starts via the standard path', hint: './init.sh works from scratch' }
    ], function () {
      var a = answered(host);
      $('#exit-score').textContent = a.yes;
      var vd = $('#exit-verdict');
      if (a.yes + a.no < 6) { vd.textContent = 'Tick all six to grade the handoff.'; return; }
      var grade, msg;
      if (a.yes === 6) { grade = 'A'; msg = 'The next session can start working immediately. This is the discipline that makes long-running agent work compound instead of decay.'; }
      else if (a.yes === 5) { grade = 'B'; msg = 'One soft spot. Worth fixing, because it is the one that will be skipped again next time.'; }
      else if (a.yes >= 3) { grade = 'C'; msg = 'The next session will spend its first half hour reconstructing what happened. That cost is paid every session, not once.'; }
      else if (a.yes >= 1) { grade = 'D'; msg = 'Little of what the session learned survives it. You are paying for the same exploration repeatedly.'; }
      else { grade = 'F'; msg = 'Nothing survives the session. Every new session is a first day, and the codebase accumulates whatever the last agent happened to leave behind.'; }
      vd.innerHTML = '<strong>Grade ' + grade + '.</strong> ' + msg;
      state.data.exit = a.yes; save();
      markLab('lab-8');
    });
  })();

  /* ============================================================
     LAB 09a — /goal builder
     ============================================================ */
  (function () {
    var st = $('#goal-state');
    if (!st) return;

    function render() {
      var s = st.value.trim(), v = $('#goal-verify').value.trim(), k = $('#goal-stop').value.trim();
      var max = $('#goal-max').value || '10';
      var parts = [];
      if (s) parts.push(s);
      if (v) parts.push('verified by: ' + v);
      if (k) parts.push(k);
      var cmd = '/goal "' + (parts.join('; ') || '<describe the end state>') + '" --max-iterations ' + max;
      $('#goal-out').textContent = cmd;

      var missing = [];
      if (!s) missing.push('the end state');
      if (!v) missing.push('the verification');
      if (!k) missing.push('the stopping condition');

      var vd = $('#goal-verdict');
      if (missing.length) {
        vd.innerHTML = '<div class="callout warn"><span class="tag">Incomplete</span><p>Missing ' + missing.join(', ') + '. A loop without a stopping condition either quits early or never quits — and a loop without verification has no way to know which.</p></div>';
      } else {
        vd.innerHTML = '<div class="callout"><span class="tag">Three parts present</span><p>Goal, verification, stopping condition. You are now describing a terminal state instead of a next action — which is what lets you walk away. Keep the iteration cap: it is the difference between "autonomous" and "unsupervised".</p></div>';
      }
      state.data.goal = !missing.length; save();
      markLab('lab-9a');
    }

    ['#goal-state', '#goal-verify', '#goal-stop', '#goal-max'].forEach(function (s) {
      $(s).addEventListener('input', render);
    });
    $('#goal-copy').addEventListener('click', function () { copy($('#goal-out').textContent, this); });
    render();
    markLab('lab-9a');
  })();

  /* ============================================================
     LAB 09b — loop to graph
     ============================================================ */
  (function () {
    var svg = $('#graph-svg');
    if (!svg) return;

    var CAPTIONS = [
      '<b>One node, one loop.</b> A goal, a verification, a stopping condition. Prompt, context and loop all live inside the same node. For most tasks this is genuinely enough — and it is the cheapest thing to debug.',
      '<b>Fan-out.</b> Two independent workstreams that do not need each other\'s output. You have added parallelism and a join, and with them the first real question: what does shared state look like when two nodes write to it?',
      '<b>Checker.</b> The generator and the evaluator are now separate nodes, so the thing doing the work is no longer the thing judging it. This is the structural fix for agents praising their own output. It costs a rejection path and a rubric.',
      '<b>Rollback and human approval.</b> The graph can now undo, not just retry — and a human gate sits on the path to merge. This is the point where the orchestration tax is real: four nodes, three edges and two failure paths to reason about. Worth it only when recovery is genuinely required.'
    ];

    function node(x, y, w, h, label, sub, accent) {
      var c = accent || '#2f4a5c';
      return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="#fffdf8" stroke="' + c + '" stroke-width="1.6"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + (sub ? h / 2 - 3 : h / 2 + 4)) + '" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="12.5" fill="#1c1a17">' + label + '</text>' +
        (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 13) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8.5" fill="#948c7f">' + sub + '</text>' : '') +
        '</g>';
    }
    function edge(d, label, dashed, color, lx, ly) {
      var c = color || '#2f4a5c';
      return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="1.5"' + (dashed ? ' stroke-dasharray="5 4"' : '') + ' marker-end="url(#arw)"/>' +
        (label ? '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8.5" fill="' + c + '">' + label + '</text>' : '');
    }

    function draw(step) {
      var defs = '<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="#2f4a5c"/></marker>' +
        '<marker id="arwR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="#a5281b"/></marker></defs>';
      var s = defs;

      var P = { x: 16, y: 138, w: 104, h: 54 };   // planner
      var A = { x: 172, y: 40, w: 118, h: 54 };   // generator A
      var B = { x: 172, y: 236, w: 118, h: 54 };  // generator B
      var C = { x: 352, y: 138, w: 122, h: 54 };  // checker / join
      var H = { x: 532, y: 138, w: 174, h: 54 };  // human gate / merge

      if (step === 0) {
        s += node(272, 128, 176, 66, 'Agent loop', 'goal · verify · stop');
        s += '<path d="M 448 145 C 512 137, 512 185, 448 173" fill="none" stroke="#a97c1c" stroke-width="1.5" marker-end="url(#arw)"/>';
        s += '<text x="524" y="165" font-family="JetBrains Mono, monospace" font-size="9" fill="#a97c1c">retry</text>';
        s += '<text x="360" y="236" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#948c7f">one prompt · one context · one loop</text>';
      }

      if (step === 1) {
        s += node(P.x, P.y, P.w, P.h, 'Planner', 'goal');
        s += node(A.x, A.y, A.w, A.h, 'Worker A', 'feature 1');
        s += node(B.x, B.y, B.w, B.h, 'Worker B', 'feature 2');
        s += node(C.x, C.y, C.w, C.h, 'Join', 'merge');
        s += edge('M 120 158 C 146 158, 146 67, 172 67', '', false);
        s += edge('M 120 172 C 146 172, 146 263, 172 263', '', false);
        s += edge('M 290 67 C 320 67, 320 158, 352 158', '', false);
        s += edge('M 290 263 C 320 263, 320 172, 352 172', '', false);
        s += '<text x="474" y="160" font-family="JetBrains Mono, monospace" font-size="9" fill="#a5281b">shared state?</text>';
        s += '<text x="474" y="176" font-family="JetBrains Mono, monospace" font-size="9" fill="#a5281b">who wins a conflict?</text>';
      }

      if (step === 2) {
        s += node(P.x, P.y, P.w, P.h, 'Planner', 'goal');
        s += node(A.x, A.y, A.w, A.h, 'Generator', 'does work');
        s += node(B.x, B.y, B.w, B.h, 'Generator', 'does work');
        s += node(C.x, C.y, C.w, C.h, 'Checker', 'rubric + evidence', '#c2410c');
        s += node(H.x, H.y, H.w, H.h, 'Merge', 'verified only');
        s += edge('M 120 158 C 146 158, 146 67, 172 67', '', false);
        s += edge('M 120 172 C 146 172, 146 263, 172 263', '', false);
        s += edge('M 290 67 C 320 67, 320 158, 352 158', '', false);
        s += edge('M 290 263 C 320 263, 320 172, 352 172', '', false);
        s += edge('M 474 165 L 532 165', 'verified', false, '#5b7f3a', 503, 157);
        s += '<path d="M 413 138 C 413 16, 231 16, 231 40" fill="none" stroke="#a5281b" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#arwR)"/>';
        s += '<text x="322" y="10" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#a5281b">reject → rework</text>';
      }

      if (step === 3) {
        s += node(P.x, P.y, P.w, P.h, 'Planner', 'goal');
        s += node(A.x, A.y, A.w, A.h, 'Generator', 'does work');
        s += node(B.x, B.y, B.w, B.h, 'Generator', 'does work');
        s += node(C.x, C.y, C.w, C.h, 'Checker', 'rubric', '#c2410c');
        s += node(H.x, H.y, H.w, H.h, 'Human gate', 'approve merge', '#5b7f3a');
        s += edge('M 120 158 C 146 158, 146 67, 172 67', '', false);
        s += edge('M 120 172 C 146 172, 146 263, 172 263', '', false);
        s += edge('M 290 67 C 320 67, 320 158, 352 158', '', false);
        s += edge('M 290 263 C 320 263, 320 172, 352 172', '', false);
        s += edge('M 474 165 L 532 165', 'verified', false, '#5b7f3a', 503, 157);
        s += '<path d="M 413 138 C 413 16, 231 16, 231 40" fill="none" stroke="#a5281b" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#arwR)"/>';
        s += '<text x="322" y="10" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#a5281b">reject → rework</text>';
        s += '<path d="M 413 192 C 413 348, 68 348, 68 192" fill="none" stroke="#a5281b" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#arwR)"/>';
        s += '<text x="240" y="368" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#a5281b">rollback: undo, not just retry</text>';
      }

      svg.innerHTML = s;
      $('#graphCaption').innerHTML = CAPTIONS[step];
      $$('#graphSteps .step-pill').forEach(function (p) {
        p.classList.toggle('on', parseInt(p.getAttribute('data-step'), 10) === step);
      });
      state.data.graphStep = step; save();
      markLab('lab-9b');
    }

    $$('#graphSteps .step-pill').forEach(function (p) {
      p.addEventListener('click', function () { draw(parseInt(p.getAttribute('data-step'), 10)); });
    });
    draw(0);
    markLab('lab-9b');
  })();

  /* ============================================================
     LAB 10 — harness kit generator
     ============================================================ */
  (function () {
    var nameEl = $('#kit-name');
    if (!nameEl) return;
    var active = 'agents';

    function v(id) { var el = $(id); return el ? el.value.trim() : ''; }

    function files() {
      var name = v('#kit-name') || 'your-project';
      var stack = v('#kit-stack') || 'unspecified stack';
      var install = v('#kit-install') || 'make install';
      var start = v('#kit-start') || 'make dev';
      var lint = v('#kit-lint') || 'make lint';
      var test = v('#kit-test') || 'make test';
      var e2e = v('#kit-e2e') || 'make e2e';
      var feature = v('#kit-feature') || 'The first user-visible behaviour';
      var today = new Date().toISOString().slice(0, 10);

      var agents = [
        '# AGENTS.md — ' + name,
        '',
        stack + '. This repository is set up for long-running coding-agent work.',
        'The goal is not maximum code output. The goal is to leave the repository in a',
        'state where the next session can continue without guessing.',
        '',
        '## Startup workflow (run before writing any code)',
        '',
        '1. `pwd` — confirm you are at the repository root.',
        '2. Read `progress.md` — last verified state and the next step.',
        '3. Read `feature_list.json` — pick the single highest-priority `not_started` item.',
        '4. `git log --oneline -5` — see what changed recently.',
        '5. Run `./init.sh` — install, lint and test. If the baseline is red, fix that',
        '   first; do not stack new work on a broken starting state.',
        '6. Run the end-to-end check: `' + e2e + '`.',
        '',
        '## Working rules',
        '',
        '- One feature at a time. WIP = 1.',
        '- Do not mark a feature complete because code was added.',
        '- Stay inside the selected feature\'s scope. Only a blocker justifies a narrow',
        '  supporting fix.',
        '- Never change verification rules in the middle of a task.',
        '- Prefer durable repository artefacts over chat summaries.',
        '- If a rule here is wrong, fix the rule in the same commit — do not work around it.',
        '',
        '## Definition of done',
        '',
        'A feature is done only when every line below is true:',
        '',
        '- [ ] the user-visible behaviour is implemented',
        '- [ ] `' + lint + '` passes',
        '- [ ] `' + test + '` passes',
        '- [ ] `' + e2e + '` passes',
        '- [ ] the command and its result are recorded in `feature_list.json`',
        '- [ ] the repository still starts from a cold clone via `./init.sh`',
        '',
        '## End of session',
        '',
        '1. Update `progress.md`.',
        '2. Update `feature_list.json`.',
        '3. Record blockers and unresolved risk.',
        '4. Commit with a descriptive message.',
        '5. Remove temp files, debug output and scaffolding.',
        ''
      ].join('\n');

      var featureJson = JSON.stringify({
        project: name,
        last_updated: today,
        rules: { single_active_feature: true, passing_requires_evidence: true, do_not_skip_verification: true },
        status_legend: {
          not_started: 'Work has not begun.',
          in_progress: 'The feature is the current active task.',
          blocked: 'Work cannot continue until a documented blocker is resolved.',
          passing: 'Required verification has passed and evidence is recorded.'
        },
        features: [{
          id: 'feat-001',
          priority: 1,
          title: feature.length > 60 ? feature.slice(0, 57) + '...' : feature,
          user_visible_behavior: feature,
          status: 'not_started',
          verification: [e2e],
          evidence: [],
          notes: ''
        }]
      }, null, 2);

      var init = [
        '#!/usr/bin/env bash',
        '# init.sh — the single standard startup path for humans and agents.',
        'set -euo pipefail',
        '',
        'ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
        'cd "$ROOT_DIR"',
        '',
        'INSTALL_CMD=(' + install + ')',
        'LINT_CMD=(' + lint + ')',
        'VERIFY_CMD=(' + test + ')',
        'START_CMD=(' + start + ')',
        '',
        'echo "==> Working directory: $PWD"',
        'echo "==> Syncing dependencies"',
        '"${INSTALL_CMD[@]}"',
        '',
        'echo "==> Lint and typecheck"',
        '"${LINT_CMD[@]}"',
        '',
        'echo "==> Baseline verification"',
        '"${VERIFY_CMD[@]}"',
        '',
        'echo "==> Startup command"',
        'printf \'    %q\' "${START_CMD[@]}"',
        'printf \'\\n\'',
        '',
        'if [ "${RUN_START_COMMAND:-0}" = "1" ]; then',
        '  echo "==> Starting the app"',
        '  exec "${START_CMD[@]}"',
        'fi',
        '',
        'echo "Environment is ready. Set RUN_START_COMMAND=1 to launch the app."',
        ''
      ].join('\n');

      var progress = [
        '# Progress — ' + name,
        '',
        'Last updated: ' + today,
        '',
        '## Current verified state',
        '',
        '- Build: passing',
        '- Lint: passing',
        '- Tests: passing',
        '- End-to-end: not yet run',
        '',
        '## Active feature',
        '',
        '- `feat-001` — ' + feature,
        '',
        '## Decisions and why',
        '',
        '- (record the choices a future session would otherwise re-litigate:',
        '  why this approach, why not the obvious alternative)',
        '',
        '## Blockers',
        '',
        '- none',
        '',
        '## Next step',
        '',
        '1. Implement `feat-001` only.',
        '2. Run `' + lint + '`, `' + test + '`, `' + e2e + '`.',
        '3. Record the command output in `feature_list.json` and move the status to `passing`.',
        '4. Commit, update this file, end the session clean.',
        ''
      ].join('\n');

      return { agents: agents, features: featureJson, init: init, progress: progress };
    }

    function render() {
      var f = files();
      $('#kit-out').textContent = f[active];
      state.data.kit = true; save();
      markLab('lab-10');
    }

    $$('#kitTabs .kit-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('#kitTabs .kit-tab').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        active = t.getAttribute('data-file');
        render();
      });
    });
    $$('#kit-name,#kit-stack,#kit-install,#kit-start,#kit-lint,#kit-test,#kit-e2e,#kit-feature').forEach(function (el) {
      el.addEventListener('input', render);
    });
    $('#kit-copy').addEventListener('click', function () { copy($('#kit-out').textContent, this); });
    $('#kit-dl').addEventListener('click', function () {
      var names = { agents: 'AGENTS.md', features: 'feature_list.json', init: 'init.sh', progress: 'progress.md' };
      download(names[active], files()[active]);
    });
    render();
    markLab('lab-10');
  })();

  /* ============================================================
     final readiness summary
     ============================================================ */
  function paintFinal() {
    var host = $('#finalScore');
    if (!host) return;
    var d = state.data || {};
    var rows = [
      { k: 'Harness scorecard', v: d.scorecard != null ? d.scorecard + ' / 20' : 'not scored', ok: d.scorecard >= 14 },
      { k: 'Fresh-session test', v: d.fresh != null ? d.fresh + ' / 5' : 'not scored', ok: d.fresh >= 4 },
      { k: 'Clean exit', v: d.exit != null ? d.exit + ' / 6' : 'not scored', ok: d.exit >= 5 },
      { k: 'Termination gate', v: d.gate === 'caught' ? 'caught 3 defects' : d.gate === 'shipped' ? 'shipped broken' : 'not run', ok: d.gate === 'caught' },
      { k: 'Loop spec', v: d.goal ? 'three parts present' : 'incomplete', ok: !!d.goal },
      { k: 'Harness kit', v: d.kit ? 'generated' : 'not generated', ok: !!d.kit }
    ];
    var scored = rows.filter(function (r) { return r.ok; }).length;

    host.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Check</th><th>Your result</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + r.k + '</td><td class="mono">' + r.v + '</td><td>' +
          (r.ok ? '<span style="color:var(--sage);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em">READY</span>'
                : '<span style="color:var(--ink-faint);font-family:var(--font-mono);font-size:10px;letter-spacing:.1em">OPEN</span>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="small">' + scored + ' of 6 checks ready. This is stored in your browser only — reload to keep it, clear site data to reset.</p>';
  }

  /* ---------- boot ---------- */
  // restore "lab complete" badges for labs finished in an earlier visit
  Object.keys(state.labs || {}).forEach(function (k) {
    var lab = $('.lab[data-lab="' + k + '"]');
    if (!lab) return;
    var st = $('[data-status]', lab);
    if (st) { st.textContent = '✓ lab complete'; st.classList.add('ok'); }
  });

  booted = true;
  route();
})();
