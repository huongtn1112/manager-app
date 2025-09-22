// Pomodoro Hook Logic - Vanilla JS Implementation
class PomodoroManager {
    constructor() {
        this.state = timerStorage.loadState();
        this.intervalId = null;
        this.callbacks = {
            onTick: [],
            onStateChange: [],
            onComplete: [],
            onModeSwitch: []
        };
        
        // Resume timer if it was running
        if (this.state.isRunning) {
            this.startTimer();
        }
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    subscribe(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Unsubscribe from events
     * @param {string} event - Event name  
     * @param {Function} callback - Callback function
     */
    unsubscribe(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Emit event to subscribers
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    /**
     * Update state and notify subscribers
     * @param {Object} updates - State updates
     */
    updateState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        timerStorage.saveState(this.state);
        this.emit('onStateChange', { prevState, newState: this.state });
    }

    /**
     * Start the timer
     */
    start() {
        if (this.state.isRunning) return;
        
        this.updateState({ isRunning: true });
        this.startTimer();
    }

    /**
     * Pause the timer
     */
    pause() {
        if (!this.state.isRunning) return;
        
        this.stopTimer();
        this.updateState({ isRunning: false });
    }

    /**
     * Toggle timer (start/pause)
     */
    toggle() {
        if (this.state.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    /**
     * Reset timer to beginning of current session
     */
    reset() {
        this.stopTimer();
        
        const resetTime = this.state.mode === 'work' 
            ? this.state.workDuration * 60 * 1000
            : this.state.breakDuration * 60 * 1000;
            
        this.updateState({
            isRunning: false,
            remainingMs: resetTime
        });
    }

    /**
     * Select a preset configuration
     * @param {string} presetName - Name of preset to select
     * @param {Object} customDurations - Custom durations if preset is 'custom'
     */
    selectPreset(presetName, customDurations = {}) {
        this.stopTimer();
        
        const newState = timerStorage.initializeWithPreset(presetName, customDurations);
        // Preserve completed sessions
        newState.completedSessions = this.state.completedSessions;
        
        this.state = newState;
        timerStorage.saveState(this.state);
        this.emit('onStateChange', { prevState: {}, newState: this.state });
    }

    /**
     * Set custom durations
     * @param {number} workMinutes - Work duration in minutes
     * @param {number} breakMinutes - Break duration in minutes  
     */
    setCustomDurations(workMinutes, breakMinutes) {
        this.selectPreset('custom', {
            workDuration: workMinutes,
            breakDuration: breakMinutes
        });
    }

    /**
     * Skip to next session (work -> break or break -> work)
     */
    skipSession() {
        this.stopTimer();
        
        const nextState = timerStorage.transitionToNext(this.state);
        this.updateState(nextState);
        this.emit('onModeSwitch', { 
            fromMode: this.state.mode,
            toMode: nextState.mode,
            completedSessions: nextState.completedSessions
        });
    }

    /**
     * Start internal timer interval
     */
    startTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    /**
     * Stop internal timer interval
     */
    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Timer tick - update remaining time
     */
    tick() {
        if (!this.state.isRunning) {
            this.stopTimer();
            return;
        }

        const newRemainingMs = Math.max(0, this.state.remainingMs - 1000);
        
        if (newRemainingMs === 0) {
            // Timer completed
            this.handleTimerComplete();
        } else {
            this.updateState({ remainingMs: newRemainingMs });
            this.emit('onTick', { 
                remainingMs: newRemainingMs,
                formatted: timerStorage.formatTime(newRemainingMs),
                progress: timerStorage.getProgress(this.state)
            });
        }
    }

    /**
     * Handle timer completion
     */
    handleTimerComplete() {
        const wasWorkSession = this.state.mode === 'work';
        const nextState = timerStorage.transitionToNext(this.state);
        
        this.stopTimer();
        this.updateState(nextState);
        
        this.emit('onComplete', {
            completedMode: wasWorkSession ? 'work' : 'break',
            nextMode: nextState.mode,
            completedSessions: nextState.completedSessions
        });
        
        this.emit('onModeSwitch', {
            fromMode: wasWorkSession ? 'work' : 'break',
            toMode: nextState.mode,
            completedSessions: nextState.completedSessions
        });
    }

    /**
     * Get current state
     * @returns {Object} Current timer state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get formatted time remaining
     * @returns {string} Formatted time (mm:ss)
     */
    getFormattedTime() {
        return timerStorage.formatTime(this.state.remainingMs);
    }

    /**
     * Get current progress percentage
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        return timerStorage.getProgress(this.state);
    }

    /**
     * Get available presets
     * @returns {Object} Preset configurations
     */
    getPresets() {
        return timerStorage.getPresets();
    }

    /**
     * Check if timer is currently running
     * @returns {boolean} True if running
     */
    isRunning() {
        return this.state.isRunning;
    }

    /**
     * Get current mode
     * @returns {string} Current mode ('work' | 'break')
     */
    getCurrentMode() {
        return this.state.mode;
    }

    /**
     * Get completed sessions count
     * @returns {number} Number of completed work sessions
     */
    getCompletedSessions() {
        return this.state.completedSessions;
    }

    /**
     * Reset all data (including completed sessions)
     */
    resetAll() {
        this.stopTimer();
        timerStorage.clearState();
        this.state = timerStorage.loadState();
        this.emit('onStateChange', { prevState: {}, newState: this.state });
    }

    /**
     * Destroy instance and cleanup
     */
    destroy() {
        this.stopTimer();
        this.callbacks = {
            onTick: [],
            onStateChange: [],
            onComplete: [],
            onModeSwitch: []
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PomodoroManager };
}