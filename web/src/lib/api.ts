const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

class ApiClient {
    private getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    }

    private getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refreshToken');
    }

    private setTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    private async refreshAccessToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            this.setTokens(data.accessToken, data.refreshToken);
            return true;
        } catch {
            return false;
        }
    }

    async fetch<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { skipAuth, ...fetchOptions } = options;
        const url = `${API_BASE}${endpoint}`;

        const headers: Record<string, string> = {
            ...((fetchOptions.headers as Record<string, string>) || {}),
        };

        if (!skipAuth) {
            const token = this.getAccessToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(fetchOptions.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(url, { ...fetchOptions, headers });

        if (res.status === 401 && !skipAuth) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                const retryRes = await fetch(url, { ...fetchOptions, headers });
                if (!retryRes.ok) {
                    const error = await retryRes.json().catch(() => ({ message: 'Request failed' }));
                    throw new Error(error.message || `HTTP ${retryRes.status}`);
                }
                return retryRes.json();
            } else {
                this.clearTokens();
                if (typeof window !== 'undefined') window.location.href = '/login';
                throw new Error('Session expired');
            }
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }

        return res.json();
    }

    get<T = unknown>(endpoint: string, options?: FetchOptions) {
        return this.fetch<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    put<T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    patch<T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) {
        return this.fetch<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    delete<T = unknown>(endpoint: string, options?: FetchOptions) {
        return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const api = new ApiClient();
export default api;
