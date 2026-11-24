import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { API_ORIGIN } from '../api';

const ALLOWED_TAGS = new Set([
    'BR', 'P', 'DIV', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'SUB', 'SUP',
    'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IMG'
]);

const KNOWN_HTML_TAG_REGEX = /<\/?(?:br|p|div|span|strong|b|em|i|u|sub|sup|ul|ol|li|table|thead|tbody|tr|td|th|img)\b/i;
const ESCAPED_HTML_TAG_REGEX = /&lt;\/?(?:br|p|div|span|strong|b|em|i|u|sub|sup|ul|ol|li|table|thead|tbody|tr|td|th|img)\b/i;

function escapePlainText(value) {
    const container = document.createElement('div');
    container.textContent = value;
    return container.innerHTML.replace(/\r?\n/g, '<br>');
}

function decodeHtmlEntities(value) {
    let decoded = value;
    const container = document.createElement('textarea');

    for (let attempt = 0; attempt < 2; attempt += 1) {
        container.innerHTML = decoded;
        const next = container.value;
        if (next === decoded) break;
        decoded = next;
    }

    return decoded;
}

const SUPERSCRIPT_DIGITS = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-', '⁺': '+'
};

const SUBSCRIPT_DIGITS = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
};

const VULGAR_FRACTIONS = {
    '½': '\\frac{1}{2}', '⅓': '\\frac{1}{3}', '⅔': '\\frac{2}{3}',
    '¼': '\\frac{1}{4}', '¾': '\\frac{3}{4}', '⅕': '\\frac{1}{5}',
    '⅖': '\\frac{2}{5}', '⅗': '\\frac{3}{5}', '⅘': '\\frac{4}{5}',
    '⅙': '\\frac{1}{6}', '⅚': '\\frac{5}{6}', '⅛': '\\frac{1}{8}'
};

function isPlainMath(text) {
    if (!text || text.length > 200) return false;
    // Hệ phương trình nhiều dòng để nguyên, bọc span sẽ làm mất xuống dòng.
    if (text.includes('\n') || text.includes('\r')) return false;
    // Giáo viên gõ tay LaTeX (có dấu \) thì để nguyên, không chuyển nữa.
    if (text.includes('\\')) return false;
    // Có chữ tiếng Việt là câu văn, không phải công thức.
    if (/[À-ỹ]/.test(text)) return false;

    const hasMathSignal = /[\^√]/.test(text) || text.includes('=') || /\d\s*\/\s*\d/.test(text);
    if (!hasMathSignal) return false;

    const allowed = /^[A-Za-z0-9\s+\-*/^()[\]{}.,=<>_√²³⁴⁵⁶⁷⁸⁹⁰⁻⁺₀-₉π∞·×÷±≠≤≥–—−°½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛|]+$/;
    if (!allowed.test(text)) return false;

    // Câu văn thường có từ dài; công thức chỉ có biến một hai ký tự và vài hàm quen thuộc.
    const withoutKnownFunctions = text.replace(/\b(?:sin|cos|tan|cot|log|ln|max|min)\b/gi, '');
    if (/[A-Za-z]{3,}/.test(withoutKnownFunctions)) return false;

    return true;
}

function plainTextToLatex(text) {
    let latex = text.trim();

    latex = latex.replace(/[–—−]/g, '-');
    latex = latex.replace(/×/g, '\\times ');
    latex = latex.replace(/÷/g, '\\div ');
    latex = latex.replace(/·/g, '\\cdot ');
    latex = latex.replace(/±/g, '\\pm ');
    latex = latex.replace(/∞/g, '\\infty ');
    latex = latex.replace(/π/g, '\\pi ');
    latex = latex.replace(/≠/g, '\\neq ');
    latex = latex.replace(/≤/g, '\\le ');
    latex = latex.replace(/≥/g, '\\ge ');
    latex = latex.replace(/°/g, '^{\\circ}');
    latex = latex.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛]/g, (match) => VULGAR_FRACTIONS[match]);
    latex = latex.replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (run) => `^{${[...run].map((char) => SUPERSCRIPT_DIGITS[char]).join('')}}`);
    latex = latex.replace(/[₀-₉]+/g, (run) => `_{${[...run].map((char) => SUBSCRIPT_DIGITS[char]).join('')}}`);

    // Căn bậc hai: √(4r - 7) và √x
    latex = latex.replace(/√\s*\(([^()]*)\)/g, '\\sqrt{$1}');
    latex = latex.replace(/√\s*([A-Za-z0-9.]+)/g, '\\sqrt{$1}');

    // Số mũ: ^(6x), ^[x+1], ^{...}, ^x, ^-3
    latex = latex.replace(/\^\[([^\]]*)\]/g, '^{$1}');
    latex = latex.replace(/\^\(([^()]*)\)/g, '^{$1}');
    latex = latex.replace(/\^\{([^{}]*)\}/g, '^{$1}');
    latex = latex.replace(/\^(-?[A-Za-z0-9.]+)/g, '^{$1}');

    // Chỉ số dưới: x_1
    latex = latex.replace(/_([A-Za-z0-9]+)/g, '_{$1}');

    // Phân số có ngoặc: (8x + 4) / (7p)
    latex = latex.replace(/\(([^()]*)\)\s*\/\s*\(([^()]*)\)/g, '\\frac{$1}{$2}');
    // Tử là tên hàm: f(x)p / (x + 1)
    latex = latex.replace(/([A-Za-z]\([^()]*\)[A-Za-z0-9]*)\s*\/\s*\(([^()]*)\)/g, '\\frac{$1}{$2}');
    // Phân số số: 38/7, 11/30
    latex = latex.replace(/(?<![\w.])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\w.])/g, '\\frac{$1}{$2}');
    // Phân số đơn giản: r^{2}/4, x/2
    latex = latex.replace(/([A-Za-z](?:\^\{[^{}]*\})?)\s*\/\s*(\d+|[A-Za-z])/g, '\\frac{$1}{$2}');
    // Bỏ ngoặc thừa quanh phân số: (\frac{2}{9}) -> \frac{2}{9}
    latex = latex.replace(/\(\\frac\{([^{}]*)\}\{([^{}]*)\}\)/g, '\\frac{$1}{$2}');
    // ⅓. t -> \frac{1}{3}\cdot t
    latex = latex.replace(/(\\frac\{[^{}]*\}\{[^{}]*\})\.\s*/g, '$1\\cdot ');

    latex = latex.replace(/[%&#$]/g, (match) => `\\${match}`);
    latex = latex.replace(/_(?!\{)/g, '\\_');

    return latex;
}

const INLINE_FORMULA = /[A-Za-z]\([^()]{0,12}\)\s*=\s*[^,;]+?(?=\.(?:\s|$)|[,;]|$)/g;

function upgradeMathNodesInDocument(documentFragment) {
    const bodyText = documentFragment.body.textContent || '';
    if (!/[=^√/]/.test(bodyText)) return;

    const walker = document.createTreeWalker(documentFragment.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
        if (!node.parentNode) return;
        if (node.parentElement && node.parentElement.closest('.math-inline, .math-block, code, pre')) return;

        const raw = node.nodeValue || '';
        const trimmed = raw.trim();
        if (!trimmed) return;

        // 1. Cả nút chữ là công thức
        if (/[=^√/]/.test(trimmed) && isPlainMath(trimmed)) {
            const start = raw.indexOf(trimmed);
            const before = raw.slice(0, start);
            const after = raw.slice(start + trimmed.length);
            const replacement = documentFragment.createDocumentFragment();

            if (before) replacement.appendChild(documentFragment.createTextNode(before));

            const span = documentFragment.createElement('span');
            span.className = 'math-inline';
            span.textContent = plainTextToLatex(trimmed);
            replacement.appendChild(span);

            if (after) replacement.appendChild(documentFragment.createTextNode(after));

            node.parentNode.replaceChild(replacement, node);
            return;
        }

        // 2. Công thức nằm giữa câu văn: "The function f is defined by f(x) = ..."
        if (raw.length < 6 || !raw.includes('=')) return;

        const pieces = [];
        const regex = new RegExp(INLINE_FORMULA.source, 'g');
        let lastIndex = 0;
        let changed = false;
        let match = regex.exec(raw);

        while (match !== null) {
            const formula = match[0].trim();
            const start = match.index + match[0].indexOf(formula);

            if (start >= lastIndex && isPlainMath(formula)) {
                pieces.push({ text: raw.slice(lastIndex, start), latex: null });
                pieces.push({ text: formula, latex: plainTextToLatex(formula) });
                lastIndex = start + formula.length;
                changed = true;
            }

            match = regex.exec(raw);
        }

        if (!changed) return;
        pieces.push({ text: raw.slice(lastIndex), latex: null });

        const replacement = documentFragment.createDocumentFragment();
        pieces.forEach((piece) => {
            if (!piece.latex) {
                if (piece.text) replacement.appendChild(documentFragment.createTextNode(piece.text));
                return;
            }

            const span = documentFragment.createElement('span');
            span.className = 'math-inline';
            span.textContent = piece.latex;
            replacement.appendChild(span);
        });

        node.parentNode.replaceChild(replacement, node);
    });
}

function sanitizeDomTree(documentFragment) {
    documentFragment.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => { node.remove(); });

    documentFragment.body.querySelectorAll('*').forEach(node => {
        if (!ALLOWED_TAGS.has(node.tagName)) {
            node.replaceWith(...node.childNodes);
            return;
        }

        [...node.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const allowImageSize = node.tagName === 'IMG' &&
                (name === 'width' || name === 'height') &&
                /^\d{1,5}$/.test(attribute.value);
            const allowTableSpan = (node.tagName === 'TD' || node.tagName === 'TH') &&
                (name === 'colspan' || name === 'rowspan') &&
                /^\d{1,3}$/.test(attribute.value);
            const allowed = name === 'class' || name === 'alt' || name === 'title' ||
                (node.tagName === 'IMG' && name === 'src') ||
                allowImageSize ||
                allowTableSpan;
            if (!allowed || name.startsWith('on')) node.removeAttribute(attribute.name);
        });

        if (node.tagName === 'IMG') {
            const source = node.getAttribute('src') || '';
            const safeSource = /^(https?:\/\/|\/|data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,)/i.test(source);
            if (!safeSource) {
                node.remove();
            } else {
                if (source.startsWith('/') && !source.startsWith('//')) {
                    node.setAttribute('src', `${API_ORIGIN}${source}`);
                }
                node.setAttribute('loading', 'lazy');
                node.setAttribute('decoding', 'async');
            }
        }
    });
}

function extractLatexFromMathNode(node) {
    let out = '';
    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            out += child.nodeValue || '';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = child.tagName;
            if (tag === 'SUP') {
                out += `^{${extractLatexFromMathNode(child)}}`;
            } else if (tag === 'SUB') {
                out += `_{${extractLatexFromMathNode(child)}}`;
            } else if (tag === 'BR') {
                out += ' ';
            } else {
                out += extractLatexFromMathNode(child);
            }
        }
    });
    return out;
}

function repairCorruptedMathTex(tex) {
    if (!tex || !tex.includes('\\lt')) return tex;
    let fixed = tex
        .replace(/\\lt\s*sup\s*\\gt\s*(.*?)\s*\\lt\s*\/sup\s*\\gt\s?/gi, '^{$1}')
        .replace(/\\lt\s*sub\s*\\gt\s*(.*?)\s*\\lt\s*\/sub\s*\\gt\s?/gi, '_{$1}');

    fixed = fixed.replace(/\\lt (\/?)(em|strong|span|i|b|u)\\gt ?/gi, (match, slash, name) => {
        const lower = name.toLowerCase();
        if (lower.length > 1 || slash === '/') return '';
        return fixed.toLowerCase().includes(`\\lt /${lower}\\gt`) ? '' : match;
    });

    return fixed.replace(/\s+/g, ' ').trim();
}

function renderMathInDocument(documentFragment) {
    documentFragment.body.querySelectorAll('.math-inline, .math-block').forEach(node => {
        const rawTex = extractLatexFromMathNode(node);
        const tex = repairCorruptedMathTex(rawTex);
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
}

function renderRichHtml(value) {
    if (!value) return '';

    let prepared = String(value);
    const hasKnownTag = KNOWN_HTML_TAG_REGEX.test(prepared);
    if (!hasKnownTag) {
        if (ESCAPED_HTML_TAG_REGEX.test(prepared)) {
            prepared = decodeHtmlEntities(prepared);
        } else {
            // Văn bản thuần (có thể chứa bất đẳng thức 0 < x < 10): escape trước để DOMParser không coi < x > là thẻ HTML.
            prepared = escapePlainText(prepared);
        }
    }

    const documentFragment = new DOMParser().parseFromString(prepared, 'text/html');
    sanitizeDomTree(documentFragment);
    upgradeMathNodesInDocument(documentFragment);
    renderMathInDocument(documentFragment);

    return documentFragment.body.innerHTML;
}

function RichContent({ content, className = '' }) {
    const html = useMemo(() => renderRichHtml(content), [content]);

    if (!html) return null;

    return (
        <div
            className={`rich-content ${className}`}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML sanitized by sanitizeDomTree + KaTeX
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

export default React.memo(RichContent);
