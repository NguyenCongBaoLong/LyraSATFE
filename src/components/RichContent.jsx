import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { API_ORIGIN } from '../api';

const ALLOWED_TAGS = new Set([
    'BR', 'P', 'DIV', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'SUB', 'SUP',
    'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IMG'
]);

function escapePlainText(value) {
    const container = document.createElement('div');
    container.textContent = value;
    return container.innerHTML.replace(/\r?\n/g, '<br>');
}

function decodeHtmlEntities(value) {
    let decoded = value;
    const container = document.createElement('textarea');

    for (let attempt = 0; attempt < 3; attempt += 1) {
        container.innerHTML = decoded;
        const next = container.value;
        if (next === decoded) break;
        decoded = next;
    }

    return decoded;
}

function sanitizeHtml(value) {
    if (!value) return '';
    const decodedValue = decodeHtmlEntities(value);
    if (!/<\/?[a-z][\s\S]*>/i.test(decodedValue)) return escapePlainText(decodedValue);

    const documentFragment = new DOMParser().parseFromString(decodedValue, 'text/html');
    documentFragment.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());

    documentFragment.body.querySelectorAll('*').forEach(node => {
        if (!ALLOWED_TAGS.has(node.tagName)) {
            node.replaceWith(...node.childNodes);
            return;
        }

        [...node.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const allowed = name === 'class' || name === 'alt' || name === 'title' ||
                (node.tagName === 'IMG' && name === 'src');
            if (!allowed || name.startsWith('on')) node.removeAttribute(attribute.name);
        });

        if (node.tagName === 'IMG') {
            const source = node.getAttribute('src') || '';
            const safeSource = /^(https?:\/\/|\/|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(source);
            if (!safeSource) node.remove();
            else if (source.startsWith('/') && !source.startsWith('//')) {
                node.setAttribute('src', `${API_ORIGIN}${source}`);
            }
        }
    });

    return documentFragment.body.innerHTML;
}

function renderMath(html) {
    if (!html.includes('math-inline') && !html.includes('math-block')) return html;

    const documentFragment = new DOMParser().parseFromString(html, 'text/html');
    documentFragment.body.querySelectorAll('.math-inline, .math-block').forEach(node => {
        const tex = node.textContent || '';
        const displayMode = node.classList.contains('math-block');
        try {
            node.innerHTML = katex.renderToString(tex, {
                displayMode,
                throwOnError: false,
                strict: false,
            });
        } catch {
            // Công thức lạ: giữ nguyên chữ thay vì làm vỡ cả câu hỏi.
        }
    });

    return documentFragment.body.innerHTML;
}

export default function RichContent({ content, className = '' }) {
    const html = useMemo(() => renderMath(sanitizeHtml(content)), [content]);

    if (!html) return null;

    return (
        <div
            className={`rich-content ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
