// Pomodoro Timer Component
class PomodoroTimer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.pomodoro = new PomodoroManager();
        this.currentPreset = 'pomodoro';
        
        this.init();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    /**
     * Initialize the component
     */
    init() {
        this.render();
        this.updateDisplay();
        this.setupPomodoroSubscriptions();
    }

    /**
     * Setup event subscriptions with Pomodoro manager
     */
    setupPomodoroSubscriptions() {
        this.pomodoro.subscribe('onTick', (data) => {
            this.updateTimer(data.formatted, data.progress);
            this.updateTitle(data.formatted);
        });

        this.pomodoro.subscribe('onStateChange', (data) => {
            this.updateDisplay();
        });

        this.pomodoro.subscribe('onComplete', (data) => {
            this.handleCompletion(data);
        });

        this.pomodoro.subscribe('onModeSwitch', (data) => {
            this.handleModeSwitch(data);
        });
    }

    /**
     * Render the component HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="pomodoro-container">
                <!-- Skip to content for accessibility -->
                <a href="#pomodoro-controls" class="skip-link">Skip to timer controls</a>
                
                <!-- Header -->
                <div class="pomodoro-header">
                    <h2 class="pomodoro-title">
                        <span class="pomodoro-icon">🍅</span>
                        Pomodoro Timer
                    </h2>
                    <div class="session-counter" aria-live="polite">
                        <span class="session-label">Phiên đã hoàn thành:</span>
                        <span class="session-count" id="session-count" aria-label="Số phiên đã hoàn thành">0</span>
                    </div>
                </div>

                <!-- Timer Display -->
                <div class="timer-display">
                    <div class="timer-circle">
                        <svg class="timer-progress" viewBox="0 0 100 100" aria-hidden="true">
                            <circle cx="50" cy="50" r="45" class="timer-progress-bg"/>
                            <circle cx="50" cy="50" r="45" class="timer-progress-bar" id="progress-circle"/>
                        </svg>
                        <div class="timer-content">
                            <div class="timer-time" 
                                 role="timer" 
                                 aria-live="polite" 
                                 aria-atomic="true"
                                 id="timer-display">25:00</div>
                            <div class="timer-mode" 
                                 id="timer-mode" 
                                 aria-live="polite">Làm việc</div>
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="pomodoro-controls" id="pomodoro-controls">
                    <button class="btn btn-primary btn-large timer-btn" 
                            id="start-pause-btn"
                            aria-label="Bắt đầu timer">
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">Bắt đầu</span>
                    </button>
                    <button class="btn btn-secondary timer-btn" 
                            id="reset-btn"
                            aria-label="Reset timer về đầu">
                        <span class="btn-icon">↻</span>
                        <span class="btn-text">Reset</span>
                    </button>
                    <button class="btn btn-secondary timer-btn" 
                            id="skip-btn"
                            aria-label="Chuyển sang phiên tiếp theo">
                        <span class="btn-icon">⏭️</span>
                        <span class="btn-text">Skip</span>
                    </button>
                </div>

                <!-- Preset Selection -->
                <div class="preset-selection">
                    <h3 class="preset-title">Chế độ Timer</h3>
                    <div class="preset-options" role="radiogroup" aria-labelledby="preset-title">
                        <button class="preset-btn active" 
                                data-preset="pomodoro"
                                role="radio"
                                aria-checked="true"
                                aria-label="Pomodoro: 25 phút làm việc, 5 phút nghỉ">
                            <span class="preset-icon">🍅</span>
                            <span class="preset-name">Pomodoro</span>
                            <span class="preset-desc">25 - 5</span>
                        </button>
                        <button class="preset-btn" 
                                data-preset="deepwork"
                                role="radio"
                                aria-checked="false"
                                aria-label="Deep Work: 50 phút làm việc, 10 phút nghỉ">
                            <span class="preset-icon">🧠</span>
                            <span class="preset-name">Deep Work</span>
                            <span class="preset-desc">50 - 10</span>
                        </button>
                        <button class="preset-btn" 
                                data-preset="custom"
                                role="radio"
                                aria-checked="false"
                                aria-label="Tùy chỉnh thời gian">
                            <span class="preset-icon">⚙️</span>
                            <span class="preset-name">Tùy chỉnh</span>
                            <span class="preset-desc">Custom</span>
                        </button>
                    </div>
                </div>

                <!-- Custom Duration Settings (hidden by default) -->
                <div class="custom-settings" id="custom-settings" style="display: none;">
                    <h4 class="custom-title">Thiết lập tùy chỉnh</h4>
                    <div class="custom-inputs">
                        <div class="input-group">
                            <label for="work-duration">Thời gian làm việc (phút):</label>
                            <input type="number" 
                                   id="work-duration" 
                                   min="1" 
                                   max="120" 
                                   value="25"
                                   aria-describedby="work-duration-desc">
                            <div id="work-duration-desc" class="input-desc">1-120 phút</div>
                        </div>
                        <div class="input-group">
                            <label for="break-duration">Thời gian nghỉ (phút):</label>
                            <input type="number" 
                                   id="break-duration" 
                                   min="1" 
                                   max="60" 
                                   value="5"
                                   aria-describedby="break-duration-desc">
                            <div id="break-duration-desc" class="input-desc">1-60 phút</div>
                        </div>
                        <button class="btn btn-primary btn-small" id="apply-custom">
                            Áp dụng
                        </button>
                    </div>
                </div>

                <!-- Keyboard Shortcuts Help -->
                <div class="keyboard-shortcuts">
                    <details>
                        <summary>⌨️ Phím tắt</summary>
                        <ul class="shortcut-list">
                            <li><kbd>Space</kbd> - Start/Pause</li>
                            <li><kbd>R</kbd> - Reset</li>
                            <li><kbd>1</kbd> - Pomodoro</li>
                            <li><kbd>2</kbd> - Deep Work</li>
                            <li><kbd>3</kbd> - Custom</li>
                            <li><kbd>S</kbd> - Skip Session</li>
                        </ul>
                    </details>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Control buttons
        const startPauseBtn = document.getElementById('start-pause-btn');
        const resetBtn = document.getElementById('reset-btn');
        const skipBtn = document.getElementById('skip-btn');

        startPauseBtn.addEventListener('click', () => this.toggleTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());
        skipBtn.addEventListener('click', () => this.skipSession());

        // Preset selection
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectPreset(btn.dataset.preset));
        });

        // Custom duration settings
        const applyCustomBtn = document.getElementById('apply-custom');
        applyCustomBtn.addEventListener('click', () => this.applyCustomSettings());

        // Input validation
        const workInput = document.getElementById('work-duration');
        const breakInput = document.getElementById('break-duration');
        
        workInput.addEventListener('input', () => this.validateCustomInput(workInput, 1, 120));
        breakInput.addEventListener('input', () => this.validateCustomInput(breakInput, 1, 60));
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if not focused on input
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleTimer();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    this.resetTimer();
                    break;
                case 'Digit1':
                case 'Numpad1':
                    e.preventDefault();
                    this.selectPreset('pomodoro');
                    break;
                case 'Digit2':
                case 'Numpad2':
                    e.preventDefault();
                    this.selectPreset('deepwork');
                    break;
                case 'Digit3':
                case 'Numpad3':
                    e.preventDefault();
                    this.selectPreset('custom');
                    break;
                case 'KeyS':
                    e.preventDefault();
                    this.skipSession();
                    break;
                case 'Escape':
                    // Clear focus for better keyboard navigation
                    document.activeElement.blur();
                    break;
            }
        });
    }

    /**
     * Update display based on current state
     */
    updateDisplay() {
        const state = this.pomodoro.getState();
        
        // Update timer display
        this.updateTimer(this.pomodoro.getFormattedTime(), this.pomodoro.getProgress());
        
        // Update mode display
        const modeText = state.mode === 'work' ? 'Làm việc' : 'Nghỉ ngơi';
        document.getElementById('timer-mode').textContent = modeText;
        
        // Update session count
        document.getElementById('session-count').textContent = state.completedSessions;
        
        // Update start/pause button
        this.updateStartPauseButton(state.isRunning);
        
        // Update preset selection
        this.updatePresetSelection(state.preset);
        
        // Update container class for styling
        this.container.className = `pomodoro-container mode-${state.mode} ${state.isRunning ? 'running' : 'paused'}`;
    }

    /**
     * Update timer display and progress
     */
    updateTimer(timeText, progress) {
        document.getElementById('timer-display').textContent = timeText;
        
        // Update progress circle
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }

    /**
     * Update page title with timer
     */
    updateTitle(timeText) {
        const state = this.pomodoro.getState();
        const mode = state.mode === 'work' ? 'Work' : 'Break';
        const icon = state.isRunning ? '🍅' : '⏸️';
        document.title = `${icon} ${timeText} - ${mode} | TaskManager`;
    }

    /**
     * Update start/pause button
     */
    updateStartPauseButton(isRunning) {
        const btn = document.getElementById('start-pause-btn');
        const icon = btn.querySelector('.btn-icon');
        const text = btn.querySelector('.btn-text');
        
        if (isRunning) {
            icon.textContent = '⏸️';
            text.textContent = 'Tạm dừng';
            btn.setAttribute('aria-label', 'Tạm dừng timer');
        } else {
            icon.textContent = '▶️';
            text.textContent = 'Bắt đầu';
            btn.setAttribute('aria-label', 'Bắt đầu timer');
        }
    }

    /**
     * Update preset selection display
     */
    updatePresetSelection(activePreset) {
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            const isActive = btn.dataset.preset === activePreset;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });
        
        // Show/hide custom settings
        const customSettings = document.getElementById('custom-settings');
        customSettings.style.display = activePreset === 'custom' ? 'block' : 'none';
        
        this.currentPreset = activePreset;
    }

    /**
     * Toggle timer (start/pause)
     */
    toggleTimer() {
        this.pomodoro.toggle();
    }

    /**
     * Reset timer
     */
    resetTimer() {
        this.pomodoro.reset();
        // Reset page title
        document.title = 'Pomodoro Timer | TaskManager';
    }

    /**
     * Skip current session
     */
    skipSession() {
        if (confirm('Bạn có chắc chắn muốn chuyển sang phiên tiếp theo?')) {
            this.pomodoro.skipSession();
        }
    }

    /**
     * Select preset
     */
    selectPreset(presetName) {
        if (this.currentPreset !== presetName) {
            this.pomodoro.selectPreset(presetName);
        }
    }

    /**
     * Apply custom duration settings
     */
    applyCustomSettings() {
        const workInput = document.getElementById('work-duration');
        const breakInput = document.getElementById('break-duration');
        
        const workMinutes = parseInt(workInput.value);
        const breakMinutes = parseInt(breakInput.value);
        
        if (this.validateCustomInput(workInput, 1, 120) && 
            this.validateCustomInput(breakInput, 1, 60)) {
            
            this.pomodoro.setCustomDurations(workMinutes, breakMinutes);
            Utils.showNotification('Đã cập nhật thiết lập tùy chỉnh!', 'success');
        }
    }

    /**
     * Validate custom input
     */
    validateCustomInput(input, min, max) {
        const value = parseInt(input.value);
        const isValid = !isNaN(value) && value >= min && value <= max;
        
        input.classList.toggle('invalid', !isValid);
        
        if (!isValid) {
            input.setCustomValidity(`Vui lòng nhập số từ ${min} đến ${max}`);
        } else {
            input.setCustomValidity('');
        }
        
        return isValid;
    }

    /**
     * Handle timer completion
     */
    handleCompletion(data) {
        const message = data.completedMode === 'work' 
            ? `🎉 Hoàn thành phiên làm việc! Time for a break.`
            : `✅ Nghỉ xong rồi! Ready for work.`;
            
        Utils.showNotification(message, 'success');
        
        // Flash effect
        this.container.classList.add('flash');
        setTimeout(() => {
            this.container.classList.remove('flash');
        }, 600);
    }

    /**
     * Handle mode switch
     */
    handleModeSwitch(data) {
        const modeText = data.toMode === 'work' ? 'làm việc' : 'nghỉ ngơi';
        Utils.showNotification(`Chuyển sang chế độ ${modeText}`, 'info');
    }

    /**
     * Destroy component
     */
    destroy() {
        if (this.pomodoro) {
            this.pomodoro.destroy();
        }
        
        // Remove keyboard event listeners
        document.removeEventListener('keydown', this.keydownHandler);
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PomodoroTimer };
}