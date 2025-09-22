// Timer Storage for Pomodoro functionality
class TimerStorage {
    constructor() {
        this.storageKey = 'pomodoro-timer';
        this.defaultState = {
            mode: 'work', // 'work' | 'break'
            remainingMs: 25 * 60 * 1000, // 25 minutes default
            preset: 'pomodoro', // 'pomodoro' | 'deepwork' | 'custom'
            isRunning: false,
            completedSessions: 0,
            lastTickAt: null,
            workDuration: 25, // minutes
            breakDuration: 5, // minutes
            customWorkDuration: 25,
            customBreakDuration: 5
        };
    }

    /**
     * Load timer state from localStorage
     * @returns {Object} Timer state object
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                return { ...this.defaultState };
            }

            const state = JSON.parse(saved);
            
            // Calculate time elapsed if timer was running
            if (state.isRunning && state.lastTickAt) {
                const now = Date.now();
                const elapsed = now - state.lastTickAt;
                state.remainingMs = Math.max(0, state.remainingMs - elapsed);
                
                // If time expired while away, handle transition
                if (state.remainingMs === 0) {
                    state.isRunning = false;
                    // Auto-transition to break/work
                    if (state.mode === 'work') {
                        state.completedSessions++;
                        state.mode = 'break';
                        state.remainingMs = state.breakDuration * 60 * 1000;
                    } else {
                        state.mode = 'work';
                        state.remainingMs = state.workDuration * 60 * 1000;
                    }
                }
            }

            // Ensure all required properties exist
            return { ...this.defaultState, ...state };
        } catch (error) {
            console.error('Error loading timer state:', error);
            return { ...this.defaultState };
        }
    }

    /**
     * Save timer state to localStorage
     * @param {Object} state - Timer state to save
     */
    saveState(state) {
        try {
            const stateToSave = {
                ...state,
                lastTickAt: state.isRunning ? Date.now() : null
            };
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    }

    /**
     * Clear all timer data
     */
    clearState() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Error clearing timer state:', error);
        }
    }

    /**
     * Get preset configurations
     * @returns {Object} Preset configurations
     */
    getPresets() {
        return {
            pomodoro: {
                name: 'Pomodoro',
                description: '25 phút làm việc, 5 phút nghỉ',
                workDuration: 25,
                breakDuration: 5,
                icon: '🍅'
            },
            deepwork: {
                name: 'Deep Work', 
                description: '50 phút làm việc, 10 phút nghỉ',
                workDuration: 50,
                breakDuration: 10,
                icon: '🧠'
            },
            custom: {
                name: 'Tùy chỉnh',
                description: 'Thiết lập thời gian riêng',
                workDuration: 25,
                breakDuration: 5,
                icon: '⚙️'
            }
        };
    }

    /**
     * Initialize state with preset
     * @param {string} presetName - Name of preset to use
     * @param {Object} customDurations - Custom durations if preset is 'custom'
     * @returns {Object} Initialized state
     */
    initializeWithPreset(presetName, customDurations = {}) {
        const presets = this.getPresets();
        const preset = presets[presetName] || presets.pomodoro;
        
        const workDuration = presetName === 'custom' 
            ? (customDurations.workDuration || preset.workDuration)
            : preset.workDuration;
            
        const breakDuration = presetName === 'custom'
            ? (customDurations.breakDuration || preset.breakDuration) 
            : preset.breakDuration;

        return {
            ...this.defaultState,
            preset: presetName,
            workDuration,
            breakDuration,
            remainingMs: workDuration * 60 * 1000,
            customWorkDuration: customDurations.workDuration || this.defaultState.customWorkDuration,
            customBreakDuration: customDurations.breakDuration || this.defaultState.customBreakDuration
        };
    }

    /**
     * Format time for display
     * @param {number} ms - Milliseconds to format
     * @returns {string} Formatted time string (mm:ss)
     */
    formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get progress percentage
     * @param {Object} state - Current timer state
     * @returns {number} Progress percentage (0-100)
     */
    getProgress(state) {
        const totalMs = state.mode === 'work' 
            ? state.workDuration * 60 * 1000
            : state.breakDuration * 60 * 1000;
        
        const progress = ((totalMs - state.remainingMs) / totalMs) * 100;
        return Math.min(100, Math.max(0, progress));
    }

    /**
     * Check if timer has completed
     * @param {Object} state - Current timer state
     * @returns {boolean} True if timer completed
     */
    isCompleted(state) {
        return state.remainingMs <= 0;
    }

    /**
     * Get next mode after current timer completes
     * @param {Object} state - Current timer state
     * @returns {string} Next mode ('work' | 'break')
     */
    getNextMode(state) {
        return state.mode === 'work' ? 'break' : 'work';
    }

    /**
     * Transition to next session
     * @param {Object} state - Current timer state
     * @returns {Object} Updated state for next session
     */
    transitionToNext(state) {
        const isWorkCompleted = state.mode === 'work';
        const nextMode = this.getNextMode(state);
        
        return {
            ...state,
            mode: nextMode,
            remainingMs: nextMode === 'work' 
                ? state.workDuration * 60 * 1000
                : state.breakDuration * 60 * 1000,
            completedSessions: isWorkCompleted 
                ? state.completedSessions + 1 
                : state.completedSessions,
            isRunning: false
        };
    }
}

// Export singleton instance
const timerStorage = new TimerStorage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimerStorage, timerStorage };
}