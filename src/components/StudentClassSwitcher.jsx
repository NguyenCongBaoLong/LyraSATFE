import React, { useEffect, useState } from 'react';
import {
    getSelectedStudentClass,
    getStudentClassCodes,
    onStudentClassChange,
    setSelectedStudentClass
} from '../studentClass';

/**
 * Hiển thị lớp đang học của học sinh. Nếu học sinh thuộc nhiều lớp thì biến thành
 * ô chọn lớp, đổi lớp là danh sách nhiệm vụ và từ vựng đổi theo.
 */
export default function StudentClassSwitcher({ user, className = '' }) {
    const [selectedClass, setSelectedClass] = useState(() => getSelectedStudentClass(user));
    const classes = getStudentClassCodes(user);

    useEffect(() => {
        setSelectedClass(getSelectedStudentClass(user));
        return onStudentClassChange((code) => setSelectedClass(code));
    }, [user]);

    if (classes.length === 0) {
        return (
            <p className={`text-xs text-slate-400 mt-0.5 ${className}`}>
                Lớp: <span className="text-slate-500 font-semibold">chưa được xếp lớp</span>
            </p>
        );
    }

    if (classes.length === 1) {
        return (
            <p className={`text-xs text-slate-400 mt-0.5 ${className}`}>
                Lớp: <span className="text-slate-700 font-semibold">{selectedClass}</span>
            </p>
        );
    }

    return (
        <label className={`flex items-center gap-2 text-xs text-slate-400 mt-0.5 ${className}`}>
            <span>Lớp:</span>
            <select
                value={selectedClass}
                onChange={(e) => setSelectedStudentClass(e.target.value)}
                aria-label="Chọn lớp đang học"
                className="text-xs font-semibold text-slate-700 bg-white border border-pink-200 rounded-xl px-2 py-1 cursor-pointer hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
                {classes.map((code) => (
                    <option key={code} value={code}>
                        {code}
                    </option>
                ))}
            </select>
            <span className="text-[10px] text-pink-500 font-semibold">đang học</span>
        </label>
    );
}
