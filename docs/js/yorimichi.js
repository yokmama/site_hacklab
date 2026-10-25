// よりみちの一覧を data/yorimichi.json から描画する
//
// 使い方: <div data-yorimichi-list data-base="../" data-variant="card"></div>
//   data-base    docs/ までの相対パス（トップページは ""、yorimichi/ の中は "../"）
//   data-variant card = 画像つきカード / chip = コースカード内の小さな一覧
//   data-exclude 表示しない id（今いるページなど）
document.addEventListener('DOMContentLoaded', () => {
    const lists = document.querySelectorAll('[data-yorimichi-list]');
    if (lists.length === 0) return;

    const base = lists[0].dataset.base || '';

    fetch(base + 'data/yorimichi.json')
        .then((response) => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then((data) => {
            lists.forEach((list) => render(list, data.items || []));
        })
        .catch((error) => {
            // 読み込めなくても、HTML に書いてある一覧ページへのリンクは残る
            console.error('Error fetching yorimichi:', error);
        });

    function render(list, items) {
        const listBase = list.dataset.base || '';
        const variant = list.dataset.variant || 'card';
        const exclude = (list.dataset.exclude || '').split(',');
        const visible = items.filter((item) => !exclude.includes(item.id));

        list.textContent = '';
        visible.forEach((item) => {
            list.appendChild(variant === 'chip' ? chip(item, listBase) : card(item, listBase));
        });
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    // 公開中はリンク、準備中はリンクなしの箱にする
    function wrapper(item, listBase, className) {
        const isOpen = item.status === 'open';
        const node = el(isOpen ? 'a' : 'div', className + (isOpen ? '' : ' is-coming'));
        if (isOpen) node.href = listBase + item.url;
        if (item.accent) node.style.setProperty('--yorimichi-accent', item.accent);
        return node;
    }

    function card(item, listBase) {
        const node = wrapper(item, listBase, 'yorimichi-card');

        if (item.image) {
            const img = el('img', 'yorimichi-card-img');
            img.src = listBase + item.image;
            img.alt = item.imageAlt || '';
            img.loading = 'lazy';
            node.appendChild(img);
        }

        const body = el('div', 'yorimichi-card-body');
        body.appendChild(el('p', 'yorimichi-card-tool', item.tool));
        body.appendChild(el('h3', 'yorimichi-card-title', item.title));
        body.appendChild(el('p', 'yorimichi-card-catch', item.catch));
        body.appendChild(el('p', 'yorimichi-card-summary', item.summary));

        const tags = el('div', 'yorimichi-card-tags');
        (item.tags || []).forEach((tag) => tags.appendChild(el('span', '', tag)));
        if (item.status !== 'open') tags.appendChild(el('span', 'is-coming-badge', '準備中'));
        body.appendChild(tags);

        node.appendChild(body);
        return node;
    }

    function chip(item, listBase) {
        const node = wrapper(item, listBase, 'yorimichi-chip');
        node.appendChild(el('strong', '', item.title));
        node.appendChild(el('span', '', item.status === 'open' ? item.tool : '準備中'));
        return node;
    }
});
