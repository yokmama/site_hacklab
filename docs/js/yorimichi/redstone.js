// Redstone Lab: レバーを切り替えて各ゲートと半加算器の出力を表示する
document.addEventListener('DOMContentLoaded', () => {
    const lab = document.querySelector('[data-rs-lab]');
    if (!lab) return;

    const state = { a: false, b: false };

    // トーチ = NOT を起点に、ラボの組み立て方と同じ式で各ゲートを求める
    const not = (x) => !x;
    const or = (x, y) => x || y;
    const and = (x, y) => not(or(not(x), not(y)));
    const nand = (x, y) => not(and(x, y));
    const xor = (x, y) => and(or(x, y), nand(x, y));

    const render = () => {
        const { a, b } = state;
        const outputs = {
            not: not(a),
            or: or(a, b),
            and: and(a, b),
            nand: nand(a, b),
            xor: xor(a, b),
        };

        lab.querySelectorAll('.rs-lever').forEach((lever) => {
            const on = state[lever.dataset.input];
            lever.setAttribute('aria-pressed', String(on));
            lever.querySelector('.rs-lever-state').textContent = on ? 'ON' : 'OFF';
        });

        lab.querySelectorAll('.rs-gate').forEach((gate) => {
            gate.classList.toggle('is-on', outputs[gate.dataset.gate]);
        });

        const bits = { a, b, c: and(a, b), s: xor(a, b) };
        lab.querySelectorAll('[data-out]').forEach((el) => {
            const on = bits[el.dataset.out];
            el.textContent = on ? '1' : '0';
            if (el.classList.contains('rs-bit')) el.classList.toggle('is-on', on);
        });
    };

    lab.querySelectorAll('.rs-lever').forEach((lever) => {
        lever.addEventListener('click', () => {
            const key = lever.dataset.input;
            state[key] = !state[key];
            render();
        });
    });

    render();
});
