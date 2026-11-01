(function () {
    const vscode = acquireVsCodeApi();
    const app = document.getElementById('app');
    const ICONS = window.FASM_ICONS;
    let state = null;
    let activeTab = (vscode.getState() || {}).tab || 'format';
    let converted = null;

    const send = (message) => vscode.postMessage(message);
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => `<span class="icon" aria-hidden="true">${ICONS[name] || ''}</span>`;

    const TABS = [['format', 'Format', 'list-flat'], ['colors', 'Colors', 'symbol-color']];

    const button = (label, attributes, secondary, iconName) =>
        `<button class="${secondary ? 'secondary' : ''}" ${attributes}>${iconName ? icon(iconName) : ''}${escapeHtml(label)}</button>`;

    function row(id, label, control, hint) {
        return `<div class="row"><label for="${id}">${escapeHtml(label)}</label>${control}${hint ? `<p class="hint">${escapeHtml(hint)}</p>` : ''}</div>`;
    }

    function inputSetting(id, label, type, hint) {
        return row(id, label, `<input id="${id}" type="${type}" data-setting="${id}" data-kind="${type}" value="${escapeHtml(state.settings[id])}">`, hint);
    }

    function checkSetting(id, label) {
        return `<div class="row check"><label><input type="checkbox" data-setting="${id}" data-kind="checkbox"${state.settings[id] ? ' checked' : ''}> ${escapeHtml(label)}</label></div>`;
    }

    function renderScope() {
        const options = [['workspace', 'This workspace'], ['user', 'All windows']]
            .filter(([id]) => id === 'user' || state.hasWorkspace)
            .map(([id, label]) => `<option value="${id}"${state.scope === id ? ' selected' : ''}>${label}</option>`).join('');
        return row('scope', 'Save changes for', `<select id="scope" data-scope>${options}</select>`);
    }

    function renderFormat() {
        return `<section>
                ${inputSetting('tabSize', 'Indent size', 'number')}
                ${checkSetting('insertSpaces', 'Indent with spaces')}
                ${inputSetting('commentColumn', 'Comment column', 'number', '0 keeps your spacing.')}
                ${checkSetting('formatOnSave', 'Format on save')}
                ${renderScope()}
                <div class="actions">${button('Format file', `data-format${state.hasFile ? '' : ' disabled'}`, false, 'list-flat')}</div>
            </section>`;
    }

    function renderColors() {
        const roles = state.colors.roles.map((role) => `<div class="color">
            <input id="color-${role.role}" type="color" data-color="${role.role}" value="${escapeHtml(role.color)}">
            <label for="color-${role.role}">${escapeHtml(role.label)}</label>
            ${role.custom ? button('Reset', `data-reset-color="${role.role}"`, true, 'discard') : ''}
        </div>`).join('');
        return `<section>
                <div class="row check"><label><input type="checkbox" data-colors${state.colors.on ? ' checked' : ''}> Use FASM Colors</label>
                <p class="hint">Only changes FASM text. Your theme and other languages stay the same.</p></div>
                ${renderScope()}
                ${state.colors.on ? roles : ''}
            </section>`;
    }

    function renderConverter() {
        const value = converted ? converted.text : '';
        let result = '<p class="hint">Try 255, 0FFh, 0xFF, $FF, 11111111b or 377o.</p>';
        if (converted && converted.text.trim() && !converted.result) {
            result = '<p class="hint error">That isn\'t a number fasm can read.</p>';
        } else if (converted && converted.result) {
            const r = converted.result;
            result = `<dl><dt>Decimal</dt><dd>${escapeHtml(r.decimal)}</dd><dt>Hex</dt><dd>${escapeHtml(r.hex)}</dd><dt>Binary</dt><dd>${escapeHtml(r.binary)}</dd><dt>Octal</dt><dd>${escapeHtml(r.octal)}</dd></dl>`;
        }
        return `<section><h2>${icon('symbol-numeric')}Number converter</h2>
            <input id="converter" type="text" aria-label="Number to convert" value="${escapeHtml(value)}">
            <div id="converter-result" class="result">${result}</div></section>`;
    }

    function renderCompiler() {
        return `<section><h2>${icon('folder-opened')}Compiler for Build</h2>
            <input id="compilerPath" type="text" aria-label="Compiler path" data-setting="compilerPath" data-kind="text" placeholder="Path to fasm, fasm 2 or fasmg" value="${escapeHtml(state.settings.compilerPath)}">
            <div class="actions">${button('Browse', 'data-browse', true, 'folder-opened')}</div></section>`;
    }

    function render() {
        if (!state) {
            app.innerHTML = '<p class="hint">Loading</p>';
            return;
        }
        const tabs = TABS.map(([id, label, iconName]) => `<button role="tab" id="tab-${id}" aria-selected="${activeTab === id}" aria-controls="content" data-tab="${id}" class="tab${activeTab === id ? ' selected' : ''}">${icon(iconName)}${label}</button>`).join('');
        app.innerHTML = `<div role="tablist" aria-label="FASM panel" class="tabs">${tabs}</div>
            <div id="content" role="tabpanel">${activeTab === 'colors' ? renderColors() : renderFormat()}</div>
            ${renderConverter()}${renderCompiler()}`;
    }

    app.addEventListener('click', (event) => {
        const target = event.target.closest('[data-tab],[data-format],[data-browse],[data-reset-color]');
        if (!target || target.disabled) {
            return;
        }
        const data = target.dataset;
        if (data.tab) {
            activeTab = data.tab;
            vscode.setState({ tab: activeTab });
            render();
        } else if ('format' in data) {
            send({ type: 'formatFile' });
        } else if ('browse' in data) {
            send({ type: 'browseCompiler' });
        } else if (data.resetColor) {
            send({ type: 'setColor', role: data.resetColor });
        }
    });

    app.addEventListener('change', (event) => {
        const target = event.target;
        const data = target.dataset;
        if (data.setting) {
            if (data.kind === 'text' && target.value === '') {
                send({ type: 'resetSetting', id: data.setting });
            } else {
                const value = data.kind === 'checkbox' ? target.checked : data.kind === 'number' ? Number(target.value) : target.value;
                send({ type: 'setSetting', id: data.setting, value });
            }
        } else if ('scope' in data) {
            send({ type: 'setScope', scope: target.value });
        } else if ('colors' in data) {
            send({ type: 'setColors', enabled: target.checked });
        } else if (data.color) {
            send({ type: 'setColor', role: data.color, color: target.value });
        }
    });

    app.addEventListener('input', (event) => {
        if (event.target.id === 'converter') {
            send({ type: 'convertNumber', text: event.target.value });
        }
    });

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'state') {
            const focused = document.activeElement;
            const typing = focused && focused.tagName === 'INPUT' && focused.type !== 'checkbox' && focused.type !== 'color';
            state = message;
            if (!typing) {
                render();
            }
        } else if (message.type === 'converted') {
            converted = { text: message.text, result: message.result };
            const holder = document.getElementById('converter-result');
            if (holder) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = renderConverter();
                holder.innerHTML = wrapper.querySelector('#converter-result').innerHTML;
            }
        }
    });

    render();
    send({ type: 'ready' });
}());
