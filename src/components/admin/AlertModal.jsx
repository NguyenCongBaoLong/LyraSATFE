import React from 'react';

export default function AlertModal({ modal, onClose }) {
    if (!modal.isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-pink-100 text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner ${modal.type === 'success' ? 'bg-pink-100 text-pink-600' : 'bg-rose-100 text-rose-600'}`}>
                    {modal.type === 'success' ? '' : ''}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{modal.title}</h3>
                <p className="text-xs text-slate-500 mb-6">{modal.message}</p>
                <button 
                    onClick={onClose}
                    className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-pink-500/20 transition cursor-pointer"
                >
                    Đồng ý
                </button>
            </div>
        </div>
    );
}