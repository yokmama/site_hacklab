// EDMを学ぼう: 16マスのビートを打ちこんで鳴らし、同じビートを Strudel のコードで表示する
document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('[data-edm-beat]');
    if (!root) return;

    const BPM = 120;
    const STEPS = 16; // 1サイクル = 4拍 = 16マス（Strudel for Xcratch のチュートリアルと同じ）
    const STEP_SEC = 60 / BPM / 4;

    const TRACKS = [
        { id: 'bd', label: 'キック', play: playKick },
        { id: 'sd', label: 'スネア', play: playSnare },
        { id: 'hh', label: 'ハイハット', play: playHat },
    ];

    const PRESETS = {
        four: { bd: [0, 4, 8, 12], sd: [4, 12], hh: [2, 6, 10, 14] },
        break: { bd: [0, 2, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
        clear: { bd: [], sd: [], hh: [] },
    };

    const pattern = {};
    const cells = {};
    const grid = root.querySelector('[data-edm-grid]');
    const codeEl = root.querySelector('[data-edm-code]');
    const playButton = root.querySelector('[data-edm-play]');

    TRACKS.forEach((track) => {
        pattern[track.id] = new Array(STEPS).fill(false);
        cells[track.id] = [];

        const row = document.createElement('div');
        row.className = 'edm-row';

        const label = document.createElement('div');
        label.className = 'edm-row-label';
        label.textContent = track.label;
        const name = document.createElement('small');
        name.textContent = track.id;
        label.appendChild(name);
        row.appendChild(label);

        for (let i = 0; i < STEPS; i++) {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'edm-cell' + (i % 4 === 0 ? ' is-beat' : '');
            cell.setAttribute('aria-label', track.label + ' ' + (i + 1) + 'マスめ');
            cell.setAttribute('aria-pressed', 'false');
            cell.addEventListener('click', () => {
                pattern[track.id][i] = !pattern[track.id][i];
                render();
            });
            row.appendChild(cell);
            cells[track.id].push(cell);
        }
        grid.appendChild(row);
    });

    function applyPreset(name) {
        const preset = PRESETS[name];
        TRACKS.forEach((track) => {
            pattern[track.id] = new Array(STEPS).fill(false);
            preset[track.id].forEach((i) => { pattern[track.id][i] = true; });
        });
        render();
    }

    function render() {
        TRACKS.forEach((track) => {
            cells[track.id].forEach((cell, i) => {
                cell.setAttribute('aria-pressed', String(pattern[track.id][i]));
            });
        });

        // ~ は「休み」。1行が1つのトラック（$:）になる
        const lines = TRACKS
            .filter((track) => pattern[track.id].some(Boolean))
            .map((track) => {
                const steps = pattern[track.id].map((on) => (on ? track.id : '~')).join(' ');
                return '$: s("' + steps + '")  // ' + track.label;
            });
        codeEl.textContent = lines.length === 0
            ? '// マスをクリックして、音を置いてみよう'
            : 'setcpm(' + BPM + '/4)  // テンポ ' + BPM + '\n' + lines.join('\n');
    }

    root.querySelectorAll('[data-edm-preset]').forEach((button) => {
        button.addEventListener('click', () => applyPreset(button.dataset.edmPreset));
    });

    // --- 音（Web Audio で合成） ---
    let ctx = null;
    let noise = null;
    let timer = null;
    let nextTime = 0;
    let step = 0;
    const queue = [];

    function playKick(time) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
        gain.gain.setValueAtTime(0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    function playNoise(time, cutoff, length, level) {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = cutoff;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(level, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + length);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(time);
        src.stop(time + length);
    }

    function playSnare(time) {
        playNoise(time, 1200, 0.18, 0.5);
    }

    function playHat(time) {
        playNoise(time, 7000, 0.05, 0.25);
    }

    function setup() {
        if (ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
        noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    // 少し先までの音を予約しておく（タイマーのゆれで音がずれないように）
    function schedule() {
        while (nextTime < ctx.currentTime + 0.1) {
            TRACKS.forEach((track) => {
                if (pattern[track.id][step]) track.play(nextTime);
            });
            queue.push({ step, time: nextTime });
            nextTime += STEP_SEC;
            step = (step + 1) % STEPS;
        }
    }

    function drawNow() {
        if (!timer) return;
        let current = null;
        while (queue.length && queue[0].time <= ctx.currentTime) current = queue.shift().step;
        if (current !== null) {
            TRACKS.forEach((track) => {
                cells[track.id].forEach((cell, i) => cell.classList.toggle('is-now', i === current));
            });
        }
        requestAnimationFrame(drawNow);
    }

    function start() {
        setup();
        ctx.resume();
        step = 0;
        queue.length = 0;
        nextTime = ctx.currentTime + 0.05;
        timer = setInterval(schedule, 25);
        schedule();
        requestAnimationFrame(drawNow);
        playButton.setAttribute('aria-pressed', 'true');
        playButton.textContent = '■ 止める';
    }

    function stop() {
        clearInterval(timer);
        timer = null;
        TRACKS.forEach((track) => cells[track.id].forEach((cell) => cell.classList.remove('is-now')));
        playButton.setAttribute('aria-pressed', 'false');
        playButton.textContent = '▶ 鳴らす';
    }

    playButton.addEventListener('click', () => (timer ? stop() : start()));

    applyPreset('four');
});
