import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function AudioVoicePlayer({ src, duration = 0, className = '' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef(null);

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const audioUrl = src?.startsWith('http') 
        ? src 
        : `${apiUrl.replace(/\/+$/, '')}${src?.startsWith('/') ? '' : '/'}${src}`;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
                setTotalDuration(audio.duration);
            }
        };
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleSpeed = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const rates = [1, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        audio.playbackRate = nextRate;
        setPlaybackRate(nextRate);
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs) || secs === Infinity) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className={`flex items-center gap-3 bg-pink-50/80 border border-pink-200/90 rounded-2xl px-4 py-2.5 max-w-sm shadow-xs ${className}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm transition cursor-pointer"
            >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1">
                <input
                    type="range"
                    min="0"
                    max={totalDuration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between items-center text-[10px] font-bold text-pink-700/80 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>
            </div>

            <button
                type="button"
                onClick={toggleSpeed}
                className="px-2 py-1 bg-white border border-pink-200 rounded-lg text-[10px] font-black text-pink-700 hover:bg-pink-100 transition cursor-pointer"
            >
                {playbackRate}x
            </button>
        </div>
    );
}
