import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, Highlighter } from 'lucide-react';

const HIGHLIGHT_COLORS = [
    { id: 'yellow', name: 'Vàng', hex: '#fef08a', textHex: '#713f12', bgClass: 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300' },
    { id: 'green', name: 'Xanh lá', hex: '#bbf7d0', textHex: '#14532d', bgClass: 'bg-emerald-200 border-emerald-400 hover:bg-emerald-300' },
    { id: 'blue', name: 'Xanh dương', hex: '#bfdbfe', textHex: '#1e3a8a', bgClass: 'bg-sky-200 border-sky-400 hover:bg-sky-300' },
    { id: 'pink', name: 'Hồng', hex: '#fbcfe8', textHex: '#831843', bgClass: 'bg-pink-200 border-pink-400 hover:bg-pink-300' },
    { id: 'orange', name: 'Cam', hex: '#fed7aa', textHex: '#7c2d12', bgClass: 'bg-orange-200 border-orange-400 hover:bg-orange-300' }
];

// Helper to inject highlight stylesheet once
const ensureHighlightStyles = () => {
    if (typeof document === 'undefined') return;
    const styleId = 'lyra-sat-highlight-styles';
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    let cssText = '';

    HIGHLIGHT_COLORS.forEach(c => {
        // Native CSS Custom Highlight API rules
        cssText += `
            ::highlight(sat-hl-${c.id}) {
                background-color: ${c.hex};
                color: ${c.textHex};
                border-radius: 2px;
            }
        `;
    });

    // Fallback mark classes
    cssText += `
        mark.sat-mark-yellow { background-color: #fef08a; color: #713f12; border-radius: 2px; padding: 1px 0; }
        mark.sat-mark-green { background-color: #bbf7d0; color: #14532d; border-radius: 2px; padding: 1px 0; }
        mark.sat-mark-blue { background-color: #bfdbfe; color: #1e3a8a; border-radius: 2px; padding: 1px 0; }
        mark.sat-mark-pink { background-color: #fbcfe8; color: #831843; border-radius: 2px; padding: 1px 0; }
        mark.sat-mark-orange { background-color: #fed7aa; color: #7c2d12; border-radius: 2px; padding: 1px 0; }
    `;

    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
};

export default function TextHighlighter({
    questionId,
    children,
    className = '',
    onHighlightsChange
}) {
    const containerRef = useRef(null);
    const [toolbarState, setToolbarState] = useState({
        visible: false,
        x: 0,
        y: 0,
        placement: 'top' // 'top' | 'bottom'
    });

    // Reference to stored ranges keyed by color for native CSS highlights
    const highlightsMapRef = useRef(new Map());
    const isNativeSupportedRef = useRef(false);
    const savedSelectionRangeRef = useRef(null);

    // Check CSS Custom Highlight API capability
    useEffect(() => {
        ensureHighlightStyles();
        isNativeSupportedRef.current = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';
        
        // Initialize highlight containers in CSS.highlights if supported
        if (isNativeSupportedRef.current) {
            HIGHLIGHT_COLORS.forEach(c => {
                const highlightName = `sat-hl-${c.id}`;
                if (!CSS.highlights.has(highlightName)) {
                    CSS.highlights.set(highlightName, new Highlight());
                }
            });
        }
    }, []);

    const [prevQuestionId, setPrevQuestionId] = useState(questionId);
    if (questionId !== prevQuestionId) {
        setPrevQuestionId(questionId);
        setToolbarState({ visible: false, x: 0, y: 0, placement: 'top' });
    }

    // Clean up highlights when questionId changes or unmounts
    const cleanupDomHighlights = useCallback(() => {
        if (isNativeSupportedRef.current) {
            HIGHLIGHT_COLORS.forEach(c => {
                const highlightName = `sat-hl-${c.id}`;
                const hl = CSS.highlights?.get(highlightName);
                if (hl) {
                    // Remove only ranges that belong to this container
                    const toDelete = [];
                    for (const range of hl.values()) {
                        if (containerRef.current && (containerRef.current.contains(range.commonAncestorContainer))) {
                            toDelete.push(range);
                        }
                    }
                    toDelete.forEach(r => hl.delete(r));
                }
            });
        }

        // Clean up fallback DOM marks if any exist inside container
        if (containerRef.current) {
            const marks = containerRef.current.querySelectorAll('mark[data-sat-highlight="true"]');
            marks.forEach(mark => {
                const parent = mark.parentNode;
                while (mark.firstChild) {
                    parent.insertBefore(mark.firstChild, mark);
                }
                parent.removeChild(mark);
                parent.normalize();
            });
        }

        highlightsMapRef.current.clear();
        savedSelectionRangeRef.current = null;
    }, []);

    // Handle question lifecycle synchronization with external Highlight API
    useEffect(() => {
        cleanupDomHighlights();

        return () => {
            cleanupDomHighlights();
        };
    }, [questionId, cleanupDomHighlights]);

    const clearAllHighlightsForQuestion = useCallback(() => {
        cleanupDomHighlights();
        setToolbarState({ visible: false, x: 0, y: 0, placement: 'top' });
        if (onHighlightsChange) {
            onHighlightsChange([]);
        }
    }, [cleanupDomHighlights, onHighlightsChange]);

    // Detect mouse selection inside container
    const handleMouseUp = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            setToolbarState(prev => prev.visible ? { ...prev, visible: false } : prev);
            savedSelectionRangeRef.current = null;
            return;
        }

        const range = selection.getRangeAt(0);
        const container = containerRef.current;

        // Check if selection is within our container
        if (!container || !container.contains(range.commonAncestorContainer)) {
            setToolbarState(prev => prev.visible ? { ...prev, visible: false } : prev);
            savedSelectionRangeRef.current = null;
            return;
        }

        const selectedText = selection.toString().trim();
        if (!selectedText) {
            setToolbarState(prev => prev.visible ? { ...prev, visible: false } : prev);
            return;
        }

        savedSelectionRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();

        const toolbarWidth = 230;
        const toolbarHeight = 44;

        let left = rect.left + rect.width / 2;
        // Clamp to screen boundaries
        if (left - toolbarWidth / 2 < 12) left = toolbarWidth / 2 + 12;
        if (left + toolbarWidth / 2 > window.innerWidth - 12) left = window.innerWidth - toolbarWidth / 2 - 12;

        let top = rect.top - toolbarHeight - 8;
        let placement = 'top';

        if (top < 10) {
            top = rect.bottom + 8;
            placement = 'bottom';
        }

        setToolbarState({
            visible: true,
            x: left,
            y: top,
            placement
        });
    }, []);

    // Dismiss toolbar on clicks outside container or when scrolling
    useEffect(() => {
        const handleDocMouseDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                // If click is not inside floating toolbar
                const toolbarEl = document.getElementById('sat-floating-highlighter-toolbar');
                if (toolbarEl && toolbarEl.contains(e.target)) return;

                setToolbarState(prev => ({ ...prev, visible: false }));
            }
        };

        const handleScroll = () => {
            setToolbarState(prev => prev.visible ? { ...prev, visible: false } : prev);
        };

        document.addEventListener('mousedown', handleDocMouseDown);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    // Helper: Check if two ranges overlap
    const rangesOverlap = (r1, r2) => {
        try {
            return (
                r1.compareBoundaryPoints(Range.END_TO_START, r2) < 0 &&
                r1.compareBoundaryPoints(Range.START_TO_END, r2) > 0
            );
        } catch {
            return false;
        }
    };

    // Apply color highlight
    const applyHighlight = (colorId) => {
        const range = savedSelectionRangeRef.current;
        if (!range) return;

        if (isNativeSupportedRef.current) {
            // First, remove existing highlights overlapping this range from all colors to avoid stacking
            HIGHLIGHT_COLORS.forEach(c => {
                const hl = CSS.highlights.get(`sat-hl-${c.id}`);
                if (hl) {
                    const toDelete = [];
                    for (const r of hl.values()) {
                        if (rangesOverlap(r, range)) {
                            toDelete.push(r);
                        }
                    }
                    toDelete.forEach(r => hl.delete(r));
                }
            });

            // Add new range to the target color highlight
            const targetHighlight = CSS.highlights.get(`sat-hl-${colorId}`);
            if (targetHighlight) {
                targetHighlight.add(range);
            }
        } else {
            // DOM Fallback: Wrap range with <mark> safely
            try {
                const mark = document.createElement('mark');
                mark.setAttribute('data-sat-highlight', 'true');
                mark.setAttribute('data-color', colorId);
                mark.className = `sat-mark-${colorId} rounded px-0.5 transition-colors cursor-pointer`;
                range.surroundContents(mark);
            } catch (err) {
                console.warn('DOM Fallback highlight surroundContents failed (complex range across nodes):', err);
            }
        }

        // Notify parent callback if subscribed
        if (onHighlightsChange) {
            onHighlightsChange({
                questionId,
                color: colorId,
                text: range.toString()
            });
        }

        // Clear active selection and hide toolbar
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
        setToolbarState(prev => ({ ...prev, visible: false }));
        savedSelectionRangeRef.current = null;
    };

    // Clear highlight intersecting current selection
    const clearCurrentSelectionHighlight = () => {
        const range = savedSelectionRangeRef.current;
        if (!range) {
            clearAllHighlightsForQuestion();
            return;
        }

        if (isNativeSupportedRef.current) {
            HIGHLIGHT_COLORS.forEach(c => {
                const hl = CSS.highlights.get(`sat-hl-${c.id}`);
                if (hl) {
                    const toDelete = [];
                    for (const r of hl.values()) {
                        if (rangesOverlap(r, range)) {
                            toDelete.push(r);
                        }
                    }
                    toDelete.forEach(r => hl.delete(r));
                }
            });
        }

        // Fallback marks unwrapping
        if (containerRef.current) {
            const marks = containerRef.current.querySelectorAll('mark[data-sat-highlight="true"]');
            marks.forEach(mark => {
                const markRange = document.createRange();
                markRange.selectNode(mark);
                if (rangesOverlap(markRange, range)) {
                    const parent = mark.parentNode;
                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }
                    parent.removeChild(mark);
                    parent.normalize();
                }
            });
        }

        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
        setToolbarState(prev => ({ ...prev, visible: false }));
        savedSelectionRangeRef.current = null;
    };

    return (
        <div
            ref={containerRef}
            onMouseUp={handleMouseUp}
            className={`relative sat-highlightable-container select-text ${className}`}
        >
            {children}

            {/* Floating Highlight Toolbar */}
            {toolbarState.visible && (
                <div
                    id="sat-floating-highlighter-toolbar"
                    style={{
                        position: 'fixed',
                        left: `${toolbarState.x}px`,
                        top: `${toolbarState.y}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 9999
                    }}
                    onMouseDown={(e) => {
                        // Crucial: Prevent default to preserve active browser selection!
                        e.preventDefault();
                    }}
                    className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold pr-1.5 border-r border-slate-700 select-none">
                        <Highlighter className="w-3.5 h-3.5 text-pink-400" />
                        <span className="hidden sm:inline">Highlight</span>
                    </div>

                    {/* 5 Color Selection Buttons */}
                    <div className="flex items-center gap-1.5">
                        {HIGHLIGHT_COLORS.map(color => (
                            <button
                                key={color.id}
                                type="button"
                                title={`Tô màu ${color.name}`}
                                onMouseDown={(e) => {
                                    // Prevent text deselect on mousedown
                                    e.preventDefault();
                                }}
                                onClick={() => applyHighlight(color.id)}
                                style={{ backgroundColor: color.hex }}
                                className="w-5 h-5 rounded-full border border-black/10 hover:scale-125 active:scale-95 transition-all shadow-sm cursor-pointer flex items-center justify-center focus:outline-none"
                            />
                        ))}
                    </div>

                    {/* Clear Button */}
                    <div className="pl-1.5 border-l border-slate-700">
                        <button
                            type="button"
                            title="Xóa highlight"
                            onMouseDown={(e) => {
                                e.preventDefault();
                            }}
                            onClick={clearCurrentSelectionHighlight}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer focus:outline-none"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Subtle downward pointer */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-slate-700 rotate-45 ${
                            toolbarState.placement === 'top'
                                ? '-bottom-1 border-b border-r'
                                : '-top-1 border-t border-l'
                        }`}
                    />
                </div>
            )}
        </div>
    );
}
