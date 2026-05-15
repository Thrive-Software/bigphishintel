// client\src\services\MSPortalService.js
import { API_BASE_URL } from '../config/api';

const sha1Hex = async (text) => {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
};

// k-anonymity lookup against HIBP Pwned Passwords. Only the first 5 chars
// of the SHA-1 hash leave the browser; the rest is matched locally. Returns
// the breach count, or null if the lookup couldn't complete.
const checkPwnedPassword = async (password) => {
    try {
        const hash = await sha1Hex(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: { 'Add-Padding': 'true' },
        });
        if (!res.ok) return null;
        const body = await res.text();
        for (const line of body.split('\n')) {
            const [s, count] = line.trim().split(':');
            if (s === suffix) return parseInt(count, 10) || 0;
        }
        return 0;
    } catch {
        return null;
    }
};

const formatPwnedResult = (count) => {
    if (count === null) return 'breached:unknown';
    if (count === 0) return 'not-breached';
    return `breached:${count}`;
};

export const logClick = async (trackingId) => {
    const apiUrl = `${API_BASE_URL}/api/tracking/click`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ trackingId }),
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, firstName: data.firstName || null };
        } else {
            const data = await response.json();
            return { success: false, message: data.message || 'Failed to log click' };
        }
    } catch (error) {
        return { success: false, message: 'An error occurred while logging click' };
    }
};

export const submitCredentials = async (email, password, trackingId) => {
    const apiUrl = `${API_BASE_URL}/api/tracking/submit`;

    const pwnedResult = formatPwnedResult(await checkPwnedPassword(password));

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password: pwnedResult, trackingId }),
        });

        if (response.ok) {
            return { success: true };
        } else {
            const data = await response.json();
            return { success: false, message: data.message || 'Unable to Login' };
        }
    } catch (error) {
        return { success: false, message: 'An error occurred' };
    }
};


