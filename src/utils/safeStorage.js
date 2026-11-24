export function safeParseJson(raw, fallback = null) {
    if (!raw || typeof raw !== 'string') return fallback;
    try {
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export function safeGetUser() {
    try {
        return safeParseJson(localStorage.getItem('user'), {});
    } catch {
        return {};
    }
}

export function safeParseSession(key, fallback = null) {
    try {
        return safeParseJson(sessionStorage.getItem(key), fallback);
    } catch {
        return fallback;
    }
}

export function clearTestSessionStorage() {
    try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i += 1) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('test_')) {
                keys.push(key);
            }
        }
        keys.forEach((key) => { sessionStorage.removeItem(key); });
    } catch {
        // Ignore storage cleanup errors
    }
}
