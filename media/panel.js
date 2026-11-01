(function () {
    const vscode = acquireVsCodeApi();
    const app = document.getElementById('app');
    const ICONS = window.FASM_ICONS;
    let state = null;
    let number = null;
    let customizing = (vscode.getState() || {}).customizing || false;

    const send = (message) => vscode.postMessage(message);
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => `<span class="icon" aria-hidden="true">${ICONS[name] || ''}</span>`;
    const heading = (label, iconName) => `<h2>${icon(iconName)}${escapeHtml(label)}</h2>`;

    function renderFormat() {
        return `<section><button id="format" class="wide" data-action="formatFile"${state.hasFile ? '' : ' disabled'}>${icon('list-flat')}Format File</button></section>`;
    }

    function renderNumberResult() {
        if (number && number.text.trim() && !number.result) {
            return '<p class="hint error">That isn\'t a number fasm can read.</p>';
        }
        if (!number || !number.result) {
            return '<p class="hint">Click a number in your code, or type one here.</p>';
        }
        const r = number.result;
        const rows = [['Decimal', r.decimal], ['Hex', r.hex], ['Binary', r.binary], ['Octal', r.octal]];
        return `<div class="values">${rows.map(([name, value]) =>
            `<button class="value" data-copy="${escapeHtml(value)}" title="Copy ${escapeHtml(value)}"><span class="name">${name}</span><code>${escapeHtml(value)}</code></button>`).join('')}</div>`;
    }

    function renderNumber() {
        return `<section>${heading('Number', 'symbol-numeric')}
            <input id="number" type="text" aria-label="Number" placeholder="255, 0FFh, 11111111b" value="${escapeHtml(number ? number.text : '')}">
            <div id="number-result" class="result">${renderNumberResult()}</div></section>`;
    }

    function renderSwatches(kind) {
        return state.palettes.filter((palette) => palette.kind === kind).map((palette) => {
            const current = state.colorsOn && state.palette === palette.id;
            return `<button class="palette${current ? ' current' : ''}" data-palette="${escapeHtml(palette.id)}" aria-pressed="${current}" title="${escapeHtml(palette.label)}">
                <span class="swatch" data-colors="${escapeHtml(palette.colors.join(','))}"></span><span class="palette-name">${escapeHtml(palette.label)}</span></button>`;
        }).join('');
    }

    function renderCustomize() {
        if (!customizing) {
            return '';
        }
        return `<div class="roles">${state.roles.map((role) => `<label class="role">
            <input type="color" data-role="${escapeHtml(role.role)}" value="${escapeHtml(role.color)}"><span>${escapeHtml(role.label)}</span></label>`).join('')}</div>`;
    }

    function renderColors() {
        return `<section>${heading('Colors', 'symbol-color')}
            <p class="group">Dark</p><div class="palettes">${renderSwatches('dark')}</div>
            <p class="group">Light</p><div class="palettes">${renderSwatches('light')}</div>
            <div class="actions">
                <button class="secondary" data-action="toggleCustomize" aria-expanded="${customizing}">${icon('settings-gear')}Customize</button>
                <button class="secondary" data-action="resetColors"${state.colorsOn ? '' : ' disabled'}>${icon('discard')}Reset</button>
            </div>${renderCustomize()}</section>`;
    }

    function renderFonts() {
        const fonts = state.fonts.map((font) => `<option value="${escapeHtml(font.family)}"${font.family === state.fontFamily ? ' selected' : ''}>${escapeHtml(font.label)}</option>`).join('');
        const known = state.fonts.some((font) => font.family === state.fontFamily);
        const sizes = state.sizes.map((size) => `<button class="chip${size === state.fontSize ? ' current' : ''}" data-size="${size}" aria-pressed="${size === state.fontSize}">${size}</button>`).join('');
        return `<section>${heading('Fonts', 'text-size')}
            <select id="font" aria-label="Font">${known ? '' : '<option value="" selected>Your editor font</option>'}${fonts}</select>
            <p class="group">Size</p><div class="chips">${sizes}</div>
            <div class="actions">
                <button class="secondary" data-action="openFontSettings">${icon('settings-gear')}Customize</button>
                <button class="secondary" data-action="resetFont">${icon('discard')}Reset</button>
            </div></section>`;
    }

    function paintSwatches() {
        for (const swatch of app.querySelectorAll('[data-colors]')) {
            const [first, second, third] = swatch.dataset.colors.split(',');
            swatch.style.background = `conic-gradient(${first} 0 33.4%, ${second} 33.4% 66.7%, ${third} 66.7% 100%)`;
        }
    }

    function focusSelector() {
        const focused = document.activeElement;
        if (!focused || focused === document.body) {
            return '';
        }
        if (focused.id) {
            return `#${focused.id}`;
        }
        const key = ['action', 'palette', 'size', 'copy'].find((name) => focused.dataset[name] !== undefined);
        return key ? `[data-${key}="${CSS.escape(focused.dataset[key])}"]` : '';
    }

    function render() {
        if (!state) {
            app.innerHTML = '<p class="hint loading">Loading</p>';
            return;
        }
        const focusKey = focusSelector();
        app.innerHTML = `${renderFormat()}${renderNumber()}${renderColors()}${renderFonts()}`;
        paintSwatches();
        if (focusKey) {
            app.querySelector(focusKey)?.focus();
        }
    }

    function showNumberResult() {
        const holder = document.getElementById('number-result');
        if (holder) {
            holder.innerHTML = renderNumberResult();
        }
    }

    app.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action],[data-palette],[data-size],[data-copy]');
        if (!target || target.disabled) {
            return;
        }
        const data = target.dataset;
        if (data.palette) {
            send({ type: 'setPalette', id: data.palette });
        } else if (data.size) {
            send({ type: 'setFontSize', size: Number(data.size) });
        } else if (data.copy) {
            send({ type: 'copyValue', value: data.copy });
        } else if (data.action === 'toggleCustomize') {
            customizing = !customizing;
            vscode.setState({ customizing });
            render();
        } else if (data.action) {
            send({ type: data.action });
        }
    });

    app.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id === 'font' && target.value) {
            send({ type: 'setFont', family: target.value });
        } else if (target.dataset.role) {
            send({ type: 'setRoleColor', role: target.dataset.role, color: target.value });
        }
    });

    app.addEventListener('input', (event) => {
        if (event.target.id === 'number') {
            send({ type: 'convertNumber', text: event.target.value });
        }
    });

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'state') {
            const focused = document.activeElement;
            const editing = focused && (focused.id === 'number' || focused.type === 'color');
            state = message;
            if (!editing) {
                render();
            }
        } else if (message.type === 'number') {
            number = { text: message.text, result: message.result };
            const input = document.getElementById('number');
            if (input && document.activeElement !== input) {
                input.value = message.text;
            }
            showNumberResult();
        }
    });

    render();
    send({ type: 'ready' });
}());
