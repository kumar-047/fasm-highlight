(function () {
    const vscode = acquireVsCodeApi();
    const app = document.getElementById('app');
    const ICONS = window.FASM_ICONS;
    let state = null;
    let activeTab = (vscode.getState() || {}).tab || 'control';
    let converted = null;

    const send = (message) => vscode.postMessage(message);
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name) => `<span class="icon" aria-hidden="true">${ICONS[name] || ''}</span>`;

    const TABS = [['control', 'Control', 'dashboard'], ['settings', 'Settings', 'settings-gear'], ['project', 'Project', 'info']];
    const LINK_ICONS = {
        fasmSite: 'globe', fasmDocs: 'book', fasmDownload: 'cloud-download', fasmForum: 'comment-discussion',
        repository: 'code', changelog: 'history', license: 'law', donateFasm: 'heart'
    };
    const OPTION_LABELS = {
        auto: 'Automatic', right: 'Right', left: 'Left', windows: 'Windows', linux: 'Linux', macos: 'macOS',
        fasm: 'fasm', fasm2: 'fasm 2', fasmg: 'fasmg', fasmarm: 'FASMARM', x86: 'x86 and x86-64', 8051: '8051', avr: 'AVR',
        jvm: 'JVM bytecode', wasm: 'WebAssembly', aarch64: 'AArch64', arm: 'ARM'
    };

    const button = (label, attributes, secondary, iconName) =>
        `<button class="${secondary ? 'secondary' : ''}" ${attributes}>${iconName ? icon(iconName) : ''}${escapeHtml(label)}</button>`;
    const command = (id, label, secondary, iconName, disabled) => button(label, `data-command="${id}"${disabled ? ' disabled' : ''}`, secondary, iconName);
    const heading = (label, iconName) => `<h2>${icon(iconName)}${escapeHtml(label)}</h2>`;

    function row(id, label, control, hint) {
        return `<div class="row"><label for="${id}">${escapeHtml(label)}</label>${control}${hint ? `<p class="hint">${escapeHtml(hint)}</p>` : ''}</div>`;
    }

    function selectSetting(id, label, hint) {
        const options = (state.settingOptions[id] || []).map((option) =>
            `<option value="${escapeHtml(option)}"${state.settings[id] === option ? ' selected' : ''}>${escapeHtml(OPTION_LABELS[option] || option)}</option>`).join('');
        return row(id, label, `<select id="${id}" data-setting="${id}">${options}</select>`, hint);
    }

    function inputSetting(id, label, type, hint) {
        return row(id, label, `<input id="${id}" type="${type}" data-setting="${id}" data-kind="${type}" value="${escapeHtml(state.settings[id])}">`, hint);
    }

    function checkSetting(id, label, hint) {
        return `<div class="row check"><label><input type="checkbox" data-setting="${id}" data-kind="checkbox"${state.settings[id] ? ' checked' : ''}> ${escapeHtml(label)}</label>${hint ? `<p class="hint">${escapeHtml(hint)}</p>` : ''}</div>`;
    }

    function renderCompiler(compiler) {
        const found = compiler.path && compiler.version;
        const status = found ? `Version ${escapeHtml(compiler.version)}` : compiler.path ? 'Not found at this path' : 'Not found';
        return `<div class="compiler${compiler.active ? ' active' : ''}">
            <div class="compiler-head"><strong>${escapeHtml(compiler.label)}</strong>${compiler.active ? '<span class="badge">In use</span>' : ''}</div>
            <div class="status${found ? ' found' : ''}">${icon(found ? 'pass-filled' : 'circle-large')}${status}</div>
            ${compiler.path ? `<p class="path" title="${escapeHtml(compiler.path)}">${escapeHtml(compiler.path)}</p>` : ''}
            <div class="actions">
                ${button('Browse', `data-browse="${compiler.kind}"`, true, 'folder-opened')}
                ${!found ? button('Where to get it', 'data-tab="project"', true, 'info') : ''}
            </div>
        </div>`;
    }

    function renderFile() {
        const file = state.file;
        if (!file) {
            return '<p class="hint">Open a FASM file to see its details.</p>';
        }
        const rows = [
            ['File', file.name], ['Architecture', file.architecture], ['Syntax', file.dialect],
            ['Target system', `${OPTION_LABELS[file.target]} (from ${file.targetSource})`], ['Output', file.output || 'None']
        ];
        if (file.macrosFound > 0) {
            rows.push(['Macros from includes', file.macrosFound]);
        }
        return `<dl>${rows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`;
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
        return `<input id="converter" type="text" aria-label="Number to convert" value="${escapeHtml(value)}"><div id="converter-result" class="row">${result}</div>`;
    }

    function renderControl() {
        const file = state.file;
        return `<section>${heading('Editor tools', 'symbol-misc')}
                <div class="actions">
                    ${command('format', 'Format file', true, 'list-flat', !file)}
                    ${command('insertStarter', 'Starter program', true, 'new-file', !file)}
                    ${command('openOutputFolder', 'Open folder', true, 'folder-opened', !file)}
                </div>
                <h3>${icon('symbol-numeric')}Number converter</h3>${renderConverter()}
            </section>
            <section>${heading('Current file', 'file-code')}${renderFile()}
            <div class="actions">
                ${command('build', 'Build', false, 'tools', !file || !file.canBuild)}
                ${command('buildAndRun', 'Run', true, 'play', !file || !file.canRun)}
                ${command('stop', 'Stop', true, 'debug-stop')}
            </div></section>
            <section>${heading('Compilers', 'chip')}
                ${selectSetting('assembler', 'Use', 'Automatic picks the compiler from the file.')}
                ${selectSetting('architecture', 'Architecture', 'Automatic reads the file\'s include lines.')}
                ${state.compilers.map(renderCompiler).join('')}
                <div class="actions">${command('refreshCompilers', 'Search again', true, 'refresh')}</div>
            </section>`;
    }

    function renderScope() {
        const options = [['workspace', 'This workspace'], ['user', 'All windows']]
            .filter(([id]) => id === 'user' || state.hasWorkspace)
            .map(([id, label]) => `<option value="${id}"${state.scope === id ? ' selected' : ''}>${label}</option>`).join('');
        return row('scope', 'Save changes for', `<select id="scope" data-scope>${options}</select>`, 'Font and format settings only change FASM files.');
    }

    function renderColors() {
        const roles = state.colors.roles.map((role) => `<div class="color">
            <input id="color-${role.role}" type="color" data-color="${role.role}" value="${escapeHtml(role.color)}">
            <label for="color-${role.role}">${escapeHtml(role.label)}</label>
            ${role.custom ? button('Reset', `data-reset-color="${role.role}"`, true, 'discard') : ''}
        </div>`).join('');
        return `<div class="row check"><label><input type="checkbox" data-colors${state.colors.on ? ' checked' : ''}> Use FASM Colors</label>
            <p class="hint">Only changes FASM text. Your theme and other languages stay the same.</p></div>${state.colors.on ? roles : ''}`;
    }

    function renderSettings() {
        return `<section>${renderScope()}</section>
            <section>${heading('Fonts', 'text-size')}
                ${inputSetting('fontFamily', 'Font family', 'text')}
                ${inputSetting('fontSize', 'Font size', 'number')}
                ${checkSetting('fontLigatures', 'Font ligatures')}
            </section>
            <section>${heading('Formatting', 'list-flat')}
                ${inputSetting('tabSize', 'Indent size', 'number')}
                ${checkSetting('insertSpaces', 'Indent with spaces')}
                ${inputSetting('commentColumn', 'Comment column', 'number', '0 keeps your spacing.')}
                ${checkSetting('formatOnSave', 'Format on save')}
            </section>
            <section>${heading('Colors', 'symbol-color')}${renderColors()}</section>
            <section>${heading('System', 'vm')}
                ${selectSetting('panelSide', 'Panel side')}
                ${selectSetting('targetSystem', 'Target system', 'A format line in the file always wins.')}
                ${inputSetting('memoryLimit', 'Memory limit (KB)', 'number')}
                ${inputSetting('passesLimit', 'Passes limit', 'number')}
                ${checkSetting('generateSymbols', 'Generate symbol file')}
            </section>`;
    }

    function link(id) {
        return `<a href="#" data-link="${id}">${icon(LINK_ICONS[id])}${escapeHtml(state.links[id])}</a>`;
    }

    function renderProject() {
        const list = (ids) => `<ul class="links">${ids.map((id) => `<li>${link(id)}</li>`).join('')}</ul>`;
        return `<section>${heading('flat assembler', 'globe')}${list(['fasmSite', 'fasmDocs', 'fasmDownload', 'fasmForum'])}</section>
            <section>${heading('Issues and requests', 'comment-discussion')}
                <p class="hint">Opens GitHub with your extension version and system filled in. You can edit it before sending.</p>
                <div class="actions">${button('Report a bug', 'data-issue="bug"', true, 'bug')}${button('Request a feature', 'data-issue="request"', true, 'lightbulb')}</div>
            </section>
            <section>${heading('Support', 'heart')}
                <p class="hint">flat assembler is made by Tomasz Grysztar. This extension is a separate, free project.</p>
                ${list(['donateFasm'])}
            </section>
            <section>${heading('About', 'info')}
                <dl class="about"><dt>Version</dt><dd>${escapeHtml(state.version)}</dd></dl>
                ${list(['repository', 'changelog', 'license'])}
                <p class="hint">Unofficial. Not made by or connected to the flat assembler project.</p>
            </section>`;
    }

    function render() {
        if (!state) {
            app.innerHTML = '<p class="hint">Loading</p>';
            return;
        }
        const tabs = TABS.map(([id, label, iconName]) => `<button role="tab" id="tab-${id}" title="${label}" aria-label="${label}" aria-selected="${activeTab === id}" aria-controls="content" data-tab="${id}" class="tab${activeTab === id ? ' selected' : ''}">${icon(iconName)}<span class="tab-label">${label}</span></button>`).join('');
        const body = activeTab === 'settings' ? renderSettings() : activeTab === 'project' ? renderProject() : renderControl();
        app.innerHTML = `<div role="tablist" aria-label="FASM panel" class="tabs">${tabs}</div><div id="content" role="tabpanel">${body}</div>`;
    }

    app.addEventListener('click', (event) => {
        const target = event.target.closest('[data-tab],[data-command],[data-browse],[data-link],[data-issue],[data-reset-color]');
        if (!target) {
            return;
        }
        const data = target.dataset;
        if (data.tab) {
            activeTab = data.tab;
            vscode.setState({ tab: activeTab });
            render();
        } else if (data.command) {
            send({ type: 'command', command: data.command });
        } else if (data.browse) {
            send({ type: 'browseCompiler', kind: data.browse });
        } else if (data.link) {
            event.preventDefault();
            send({ type: 'openLink', link: data.link });
        } else if (data.issue) {
            send({ type: 'reportIssue', issue: data.issue });
        } else if (data.resetColor) {
            send({ type: 'setColor', role: data.resetColor });
        }
    });

    app.addEventListener('change', (event) => {
        const target = event.target;
        const data = target.dataset;
        if (data.setting) {
            const value = data.kind === 'checkbox' ? target.checked : data.kind === 'number' ? Number(target.value) : target.value;
            if (data.kind === 'text' && target.value === '') {
                send({ type: 'resetSetting', id: data.setting });
            } else {
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
            const typing = focused && (focused.tagName === 'INPUT' && focused.type !== 'checkbox' && focused.type !== 'color');
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
