// Enhanced Storage Layer API
class StorageManager {
    constructor() {
        this.storageKeys = {
            todo: 'todos',
            calendar: 'calendar-events',
            blocks: 'time-blocks'
        };
        this.apiBase = '/api';
    }

    /**
     * Load all items of a specific type
     * @param {string} type - 'todo', 'calendar', or 'blocks'
     * @returns {Promise<Array>} Array of items
     */
    async loadAll(type) {
        try {
            const key = this.storageKeys[type];
            if (!key) {
                throw new Error(`Unknown storage type: ${type}`);
            }

            // Use backend for todos if available
            if (type === 'todo') {
                try {
                    const headers = { 'Accept': 'application/json' };
                    const token = localStorage.getItem('auth_token');
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(`${this.apiBase}/todos`, { headers });
                    if (res.ok) {
                        const data = await res.json();
                        return Array.isArray(data) ? data : [];
                    }
                } catch (_) {
                    // fallback to local
                }
            }
            
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error loading ${type} data:`, error);
            return [];
        }
    }

    /**
     * Save all items of a specific type
     * @param {string} type - 'todo', 'calendar', or 'blocks'
     * @param {Array} items - Array of items to save
     * @returns {Promise<void>}
     */
    async saveAll(type, items) {
        try {
            const key = this.storageKeys[type];
            if (!key) {
                throw new Error(`Unknown storage type: ${type}`);
            }

            // Push to backend for todos; mirror into local as cache
            if (type === 'todo') {
                try {
                    const headers = { 'Content-Type': 'application/json' };
                    const token = localStorage.getItem('auth_token');
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    await fetch(`${this.apiBase}/todos`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(items)
                    });
                } catch (_) {
                    // ignore network error; still write to local
                }
            }
            
            localStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.error(`Error saving ${type} data:`, error);
            throw error;
        }
    }

    /**
     * Check if storage is empty for a specific type
     * @param {string} type - 'todo', 'calendar', or 'blocks'
     * @returns {Promise<boolean>} True if empty, false otherwise
     */
    async isEmpty(type) {
        const items = await this.loadAll(type);
        return items.length === 0;
    }

    /**
     * Clear all data for a specific type
     * @param {string} type - 'todo', 'calendar', or 'blocks'
     * @returns {Promise<void>}
     */
    async clearAll(type) {
        try {
            const key = this.storageKeys[type];
            if (!key) {
                throw new Error(`Unknown storage type: ${type}`);
            }
            
            localStorage.removeItem(key);

            if (type === 'todo') {
                try {
                    await fetch(`${this.apiBase}/todos`, { method: 'DELETE' });
                } catch (_) {}
            }
            
            // Also clear related settings if they exist
            if (type === 'blocks') {
                localStorage.removeItem('time-blocks-settings');
            }
            if (type === 'todo') {
                localStorage.removeItem('nextId');
            }
        } catch (error) {
            console.error(`Error clearing ${type} data:`, error);
            throw error;
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        const stats = {};
        
        for (const type of Object.keys(this.storageKeys)) {
            const items = await this.loadAll(type);
            stats[type] = {
                count: items.length,
                isEmpty: items.length === 0
            };
        }
        
        return stats;
    }
}

// Sample Data Generator
class SampleDataGenerator {
    static generateTodoSamples() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return [
            {
                id: Date.now() + 1,
                text: "Hoàn thành báo cáo dự án Q3",
                priority: "high",
                completed: false,
                createdAt: now.toISOString(),
                tags: ["work", "important"]
            },
            {
                id: Date.now() + 2,
                text: "Đọc sách 30 phút mỗi ngày",
                priority: "medium",
                completed: false,
                createdAt: now.toISOString(),
                tags: ["personal", "habit"]
            }
        ];
    }

    static generateCalendarSamples() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return [
            {
                id: `sample-${Date.now()}-1`,
                title: "Họp team standup",
                date: today.toISOString().split('T')[0],
                time: "10:00",
                endTime: "11:00",
                priority: "high",
                description: "Họp đầu tuần với team để sync tiến độ công việc",
                createdAt: today.toISOString()
            },
            {
                id: `sample-${Date.now()}-2`,
                title: "Workshop học React",
                date: tomorrow.toISOString().split('T')[0],
                time: "14:00",
                endTime: "15:30",
                priority: "medium",
                description: "Khóa học trực tuyến về React hooks và state management",
                createdAt: today.toISOString()
            }
        ];
    }

    static generateTimeBlocksSamples() {
        return [
            {
                id: "09:00-09:25",
                startTime: "09:00",
                endTime: "09:25",
                task: "Pomodoro - Viết code cho tính năng authentication",
                completed: false,
                index: 0
            },
            {
                id: "10:00-10:50",
                startTime: "10:00",
                endTime: "10:50",
                task: "Deep Work - Nghiên cứu và thiết kế database schema",
                completed: false,
                index: 1
            }
        ];
    }

    static async createSampleData(type) {
        switch (type) {
            case 'todo':
                return this.generateTodoSamples();
            case 'calendar':
                return this.generateCalendarSamples();
            case 'blocks':
                return this.generateTimeBlocksSamples();
            default:
                throw new Error(`Unknown sample data type: ${type}`);
        }
    }
}

// Enhanced Utils class with new methods
class EnhancedUtils extends Utils {
    static createSampleDataButton(type, containerId, onCreateCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const button = document.createElement('button');
        button.className = 'btn btn-primary sample-data-btn';
        button.setAttribute('aria-label', `Tạo dữ liệu mẫu cho ${type}`);
        button.innerHTML = `
            <span class="btn-icon">✨</span>
            <span class="btn-text">Tạo dữ liệu mẫu</span>
        `;
        
        button.addEventListener('click', async () => {
            try {
                button.disabled = true;
                button.innerHTML = `
                    <span class="loading-spinner"></span>
                    <span class="btn-text">Đang tạo...</span>
                `;
                
                await onCreateCallback();
                
                // Hide button after successful creation
                button.style.display = 'none';
            } catch (error) {
                console.error('Error creating sample data:', error);
                Utils.showNotification('Có lỗi xảy ra khi tạo dữ liệu mẫu!', 'error');
                
                // Reset button state
                button.disabled = false;
                button.innerHTML = `
                    <span class="btn-icon">✨</span>
                    <span class="btn-text">Tạo dữ liệu mẫu</span>
                `;
            }
        });

        return button;
    }

    static createResetDataButton(type, onResetCallback) {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-small reset-data-btn';
        button.setAttribute('aria-label', `Xóa tất cả dữ liệu ${type}`);
        button.innerHTML = `
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">Reset dữ liệu</span>
        `;
        
        button.addEventListener('click', async () => {
            if (confirm(`Bạn có chắc chắn muốn xóa tất cả dữ liệu ${type}? Hành động này không thể hoàn tác.`)) {
                try {
                    button.disabled = true;
                    await onResetCallback();
                    Utils.showNotification('Đã xóa tất cả dữ liệu!', 'success');
                } catch (error) {
                    console.error('Error resetting data:', error);
                    Utils.showNotification('Có lỗi xảy ra khi xóa dữ liệu!', 'error');
                } finally {
                    button.disabled = false;
                }
            }
        });

        return button;
    }

    static createOptionsMenu(type, onResetCallback) {
        const menu = document.createElement('div');
        menu.className = 'options-menu';
        menu.innerHTML = `
            <button class="options-menu-trigger btn btn-secondary btn-small" 
                    aria-label="Tùy chọn khác" 
                    aria-expanded="false"
                    aria-haspopup="true">
                <span class="btn-icon">⋯</span>
            </button>
            <div class="options-menu-content" role="menu" aria-hidden="true">
                <button class="options-menu-item btn btn-danger btn-small" 
                        role="menuitem"
                        aria-label="Xóa tất cả dữ liệu">
                    <span class="btn-icon">🗑️</span>
                    <span class="btn-text">Reset dữ liệu</span>
                </button>
            </div>
        `;

        const trigger = menu.querySelector('.options-menu-trigger');
        const content = menu.querySelector('.options-menu-content');
        const resetBtn = menu.querySelector('.options-menu-item');

        // Toggle menu
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            trigger.setAttribute('aria-expanded', !isExpanded);
            content.setAttribute('aria-hidden', isExpanded);
            content.style.display = isExpanded ? 'none' : 'block';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                trigger.setAttribute('aria-expanded', 'false');
                content.setAttribute('aria-hidden', 'true');
                content.style.display = 'none';
            }
        });

        // Reset data handler
        resetBtn.addEventListener('click', async () => {
            if (confirm(`Bạn có chắc chắn muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.`)) {
                try {
                    await onResetCallback();
                    Utils.showNotification('Đã reset tất cả dữ liệu!', 'success');
                    
                    // Close menu
                    trigger.setAttribute('aria-expanded', 'false');
                    content.setAttribute('aria-hidden', 'true');
                    content.style.display = 'none';
                } catch (error) {
                    console.error('Error resetting data:', error);
                    Utils.showNotification('Có lỗi xảy ra khi reset dữ liệu!', 'error');
                }
            }
        });

        return menu;
    }

    static createEmptyState(type, config = {}) {
        const {
            icon = '📋',
            title = 'Chưa có dữ liệu',
            description = 'Hãy thêm dữ liệu đầu tiên để bắt đầu!',
            containerId = 'empty-state-container'
        } = config;

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state fade-in';
        emptyState.setAttribute('role', 'region');
        emptyState.setAttribute('aria-labelledby', `${containerId}-title`);
        emptyState.id = containerId;
        
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-icon" aria-hidden="true">${icon}</div>
                <h3 class="empty-state-title" id="${containerId}-title">${title}</h3>
                <p class="empty-state-description">${description}</p>
                <div class="empty-state-actions" id="${containerId}-actions">
                    <!-- Sample data button will be inserted here -->
                </div>
            </div>
        `;

        return emptyState;
    }
}

// Initialize global instances
const storageManager = new StorageManager();
const sampleDataGenerator = new SampleDataGenerator();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        StorageManager, 
        SampleDataGenerator, 
        EnhancedUtils,
        storageManager,
        sampleDataGenerator
    };
}