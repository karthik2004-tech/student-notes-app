/* ==========================================================================
   FOCUSFLOW: CORE APPLICATION ENGINE
   ========================================================================== */

// 1. DYNAMIC MOTIVATIONAL QUOTES POOL
const QUOTES = {
    focus: [
        "Your focus determines your reality.",
        "Deep work is the superpower of the 21st century.",
        "One step, one block, one session at a time.",
        "Focus on being productive, not busy.",
        "Energy flows where attention goes.",
        "Simplicity is the ultimate sophistication of concentration.",
        "Keep your eyes on the finish line, not the distractions."
    ],
    break: [
        "Take a deep breath. Relax your shoulders.",
        "Rest is not laziness, it is recharging.",
        "A sharp axe cuts faster. Rest now to focus better later.",
        "Disconnect to reconnect.",
        "Hydrate, stretch, and let your mind drift.",
        "Well deserved break! Step away from the screen.",
        "Quiet the mind, and the soul will speak."
    ]
};

// 2. AUDIO SYNTHESIS ENGINE (WEB AUDIO API - ZERO ASSET DEPENDENCY)
class AudioSynthController {
    constructor() {
        this.ctx = null;
        this.ambientSource = null;
        this.ambientGainNode = null;
        this.volume = 0.4;
        this.currentSoundType = 'none';
        this.tickingInterval = null;
    }

    init() {
        if (!this.ctx) {
            // Initialize AudioContext on first user gesture
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.ambientGainNode = this.ctx.createGain();
            this.ambientGainNode.gain.value = this.volume;
            this.ambientGainNode.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(val) {
        this.volume = parseFloat(val) / 100;
        if (this.ambientGainNode) {
            this.ambientGainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    // Helper to generate white noise buffer
    createNoiseBuffer() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    }

    // Stop currently running ambient loop
    stopAmbient() {
        if (this.ambientSource) {
            try {
                this.ambientSource.stop();
            } catch (e) {}
            this.ambientSource.disconnect();
            this.ambientSource = null;
        }
        this.currentSoundType = 'none';
    }

    // Trigger Ambient Audio Types programmatically
    playAmbient(type) {
        this.init();
        this.stopAmbient();

        if (type === 'none') return;

        this.currentSoundType = type;
        const buffer = this.createNoiseBuffer();
        
        // Setup source
        this.ambientSource = this.ctx.createBufferSource();
        this.ambientSource.buffer = buffer;
        this.ambientSource.loop = true;

        // Custom DSP chains based on style
        if (type === 'white') {
            // Clean Lowpass Filtered Noise
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);

            this.ambientSource.connect(filter);
            filter.connect(this.ambientGainNode);

        } else if (type === 'rain') {
            // Rain: Deeper low pass + rapid slight volume modulations
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, this.ctx.currentTime);

            // Modulator for gusts
            const lfo = this.ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 0.2Hz
            
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

            const modGain = this.ctx.createGain();
            modGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(modGain.gain);

            this.ambientSource.connect(filter);
            filter.connect(modGain);
            modGain.connect(this.ambientGainNode);

            lfo.start();

        } else if (type === 'forest') {
            // Forest wind: High resonances sweeping + occasional high tweets (birds)
            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.setValueAtTime(3.0, this.ctx.currentTime);
            bandpass.frequency.setValueAtTime(300, this.ctx.currentTime);

            // LFO sweeps the bandpass back and forth to simulate rustling wind
            const lfo = this.ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); 
            
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(bandpass.frequency);

            this.ambientSource.connect(bandpass);
            bandpass.connect(this.ambientGainNode);

            lfo.start();
            
            // Background birds synth interval
            this.birdTimer = setInterval(() => {
                if (this.currentSoundType !== 'forest') {
                    clearInterval(this.birdTimer);
                    return;
                }
                if (Math.random() > 0.45) this.synthesizeBirdTweet();
            }, 3000);

        } else if (type === 'cafe') {
            // Cafe: Low rumbling hum + periodic randomized clinks (glasses/cups)
            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(250, this.ctx.currentTime);

            this.ambientSource.connect(lowpass);
            lowpass.connect(this.ambientGainNode);

            // Periodically synthesize clinks
            this.clinkTimer = setInterval(() => {
                if (this.currentSoundType !== 'cafe') {
                    clearInterval(this.clinkTimer);
                    return;
                }
                if (Math.random() > 0.5) this.synthesizeCupClink();
            }, 2000);
        }

        this.ambientSource.start();
    }

    synthesizeBirdTweet() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Fast sweep upwards
        osc.frequency.setValueAtTime(2500, now);
        osc.frequency.exponentialRampToValueAtTime(3800, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(3000, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    synthesizeCupClink() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(4500, now);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(5200, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.volume * 0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
    }

    // Play Chime sound upon session completion
    playChime() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Beautiful arpeggio synth chime: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            
            gain.gain.setValueAtTime(0, now + idx * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.7);
        });
    }

    // Programmatic click for timer ticking sound feedback
    playTick() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.03);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.04);
    }
}

const AudioController = new AudioSynthController();

// 3. APPLICATION STATE MANAGER
const FocusFlowState = {
    timer: {
        mode: 'focus', // focus, shortBreak, longBreak
        timeLeft: 1500,
        totalDuration: 1500,
        isRunning: false,
        timerId: null
    },
    gamification: {
        xp: 0,
        level: 1,
        streak: 0,
        lastFocusDate: null
    },
    tasks: [],
    history: [],
    settings: {
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        autoBreaks: false,
        autoPoms: false,
        soundChime: true,
        soundTicking: false
    },

    saveToLocalStorage() {
        const payload = {
            gamification: this.gamification,
            tasks: this.tasks,
            history: this.history,
            settings: this.settings
        };
        localStorage.setItem('focusflow_premium_data', JSON.stringify(payload));
    },

    loadFromLocalStorage() {
        const saved = localStorage.getItem('focusflow_premium_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.gamification = parsed.gamification || this.gamification;
                this.tasks = parsed.tasks || this.tasks;
                this.history = parsed.history || this.history;
                this.settings = parsed.settings || this.settings;
            } catch (e) {
                console.error("Error loading local storage data", e);
            }
        }
        this.timer.timeLeft = this.settings.focus * 60;
        this.timer.totalDuration = this.settings.focus * 60;
    }
};

// Available milestone achievement badges
const BADGES = [
    { id: 'first_step', name: 'First Step', desc: 'Complete your first focus block', icon: 'ph-flag' },
    { id: 'deep_work', name: 'Deep Work Master', desc: 'Log more than 100 focus minutes', icon: 'ph-brain' },
    { id: 'streak_starter', name: 'Streak Starter', desc: 'Accumulate a 3-day streak', icon: 'ph-flame' },
    { id: 'zen_master', name: 'Zen Master', desc: 'Log 8 focus sessions', icon: 'ph-crown' },
    { id: 'task_slayer', name: 'Task Slayer', desc: 'Mark 5 focus tasks completed', icon: 'ph-sword' },
    { id: 'elite_tier', name: 'Elite Focus Flow', desc: 'Reach Level 5', icon: 'ph-trophy' }
];

// 4. MAIN CORE APPLICATION CODE
document.addEventListener('DOMContentLoaded', () => {
    // Load state
    FocusFlowState.loadFromLocalStorage();

    // DOM selectors
    const timerTime = document.getElementById('timer-time');
    const timerStatus = document.getElementById('timer-status');
    const timerProgress = document.getElementById('timer-progress');
    const timerToggle = document.getElementById('timer-toggle');
    const timerReset = document.getElementById('timer-reset');
    const timerSkip = document.getElementById('timer-skip');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const quoteText = document.getElementById('quote-text');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const streakCount = document.getElementById('streak-count');

    // Modals
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const settingsForm = document.getElementById('settings-form');
    const settingsResetDefaultBtn = document.getElementById('settings-reset-defaults');
    const badgeMenuBtn = document.getElementById('badge-menu-btn');
    const badgesModal = document.getElementById('badges-modal');
    const badgesClose = document.getElementById('badges-close');
    const badgesGrid = document.getElementById('badges-grid');

    // Forms & Settings
    const settingFocus = document.getElementById('setting-focus');
    const settingShort = document.getElementById('setting-short');
    const settingLong = document.getElementById('setting-long');
    const settingAutoBreaks = document.getElementById('setting-auto-breaks');
    const settingAutoPoms = document.getElementById('setting-auto-poms');
    const settingSoundChime = document.getElementById('setting-sound-chime');
    const settingSoundTicking = document.getElementById('setting-sound-ticking');

    // Tasks DOM
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskPriority = document.getElementById('task-priority');
    const estCount = document.getElementById('est-count');
    const estMinus = document.getElementById('est-minus');
    const estPlus = document.getElementById('est-plus');
    const activeTaskContainer = document.getElementById('active-task-container');
    const activeTaskName = document.getElementById('active-task-name');
    const activeTaskProgress = document.getElementById('active-task-progress');
    const taskList = document.getElementById('task-list');
    const taskCompletedFraction = document.getElementById('task-completed-fraction');
    const taskProgressFill = document.getElementById('task-progress-fill');

    // Soundscapes DOM
    const soundTabs = document.querySelectorAll('.sound-tab');
    const ambientVolume = document.getElementById('ambient-volume');

    // Analytics Summary DOM
    const statTotalMinutes = document.getElementById('stat-total-minutes');
    const statCompletedPoms = document.getElementById('stat-completed-poms');
    const statTasksCompleted = document.getElementById('stat-tasks-completed');
    const statUserTier = document.getElementById('stat-user-tier');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Gamification
    const currentXp = document.getElementById('current-xp');
    const nextLevelXp = document.getElementById('next-level-xp');
    const xpProgressFill = document.getElementById('xp-progress-fill');
    const levelBadge = document.getElementById('level-badge');
    const xpRank = document.getElementById('xp-rank');

    // Toast DOM
    const appToast = document.getElementById('app-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');
    const toastIcon = document.getElementById('toast-icon');

    // Setup active priority estimation number logic
    let tempEstCount = 1;
    estMinus.addEventListener('click', () => {
        if (tempEstCount > 1) {
            tempEstCount--;
            estCount.textContent = tempEstCount;
        }
    });
    estPlus.addEventListener('click', () => {
        if (tempEstCount < 10) {
            tempEstCount++;
            estCount.textContent = tempEstCount;
        }
    });

    // Toast utility helper
    function triggerToast(title, body, iconClass = 'ph-check-circle', duration = 3500) {
        toastTitle.textContent = title;
        toastBody.textContent = body;
        toastIcon.className = `ph-bold ${iconClass}`;
        
        appToast.classList.add('show');
        setTimeout(() => {
            appToast.classList.remove('show');
        }, duration);
    }

    // Refresh XP Display
    function refreshGamification() {
        const xp = FocusFlowState.gamification.xp;
        const level = FocusFlowState.gamification.level;
        
        // XP levels formula: each level takes (Level * 100) XP
        const needed = level * 100;
        const pct = Math.min((xp / needed) * 100, 100);

        currentXp.textContent = xp;
        nextLevelXp.textContent = needed;
        xpProgressFill.style.width = `${pct}%`;
        levelBadge.textContent = `LVL ${level}`;

        // Ranks based on level
        let rankStr = "Focus Initiate";
        if (level >= 15) rankStr = "Zen Grandmaster";
        else if (level >= 10) rankStr = "Flow Guru";
        else if (level >= 5) rankStr = "Productivity Warrior";
        else if (level >= 3) rankStr = "Focus Enthusiast";

        xpRank.textContent = rankStr;
        streakCount.textContent = FocusFlowState.gamification.streak;
    }

    // Add focus reward XP
    function awardXp(amount) {
        FocusFlowState.gamification.xp += amount;
        const needed = FocusFlowState.gamification.level * 100;
        
        if (FocusFlowState.gamification.xp >= needed) {
            FocusFlowState.gamification.xp -= needed;
            FocusFlowState.gamification.level++;
            triggerToast("Level Up!", `Congratulations! You reached Level ${FocusFlowState.gamification.level}!`, 'ph-shield-star');
            AudioController.playChime();
        }
        refreshGamification();
        FocusFlowState.saveToLocalStorage();
        updateAnalytics();
    }

    // Check & verify badge unlocks
    function checkBadgeAchievements() {
        let dirty = false;
        const stats = computeAnalyticsStats();
        
        const unlockedList = FocusFlowState.gamification.unlockedBadges || [];

        const registerUnlock = (badgeId, badgeName) => {
            if (!unlockedList.includes(badgeId)) {
                unlockedList.push(badgeId);
                triggerToast("Badge Unlocked!", `Achievement Earned: ${badgeName}!`, 'ph-medal');
                dirty = true;
            }
        };

        // Milestone evaluations
        if (stats.completedPoms >= 1) registerUnlock('first_step', 'First Step');
        if (stats.totalMinutes >= 100) registerUnlock('deep_work', 'Deep Work Master');
        if (FocusFlowState.gamification.streak >= 3) registerUnlock('streak_starter', 'Streak Starter');
        if (stats.completedPoms >= 8) registerUnlock('zen_master', 'Zen Master');
        if (stats.completedTasks >= 5) registerUnlock('task_slayer', 'Task Slayer');
        if (FocusFlowState.gamification.level >= 5) registerUnlock('elite_tier', 'Elite Focus Flow');

        if (dirty) {
            FocusFlowState.gamification.unlockedBadges = unlockedList;
            FocusFlowState.saveToLocalStorage();
        }
    }

    // Render Badge grid dynamically
    function renderBadgesGrid() {
        badgesGrid.innerHTML = '';
        const unlockedList = FocusFlowState.gamification.unlockedBadges || [];

        BADGES.forEach(b => {
            const isUnlocked = unlockedList.includes(b.id);
            const badgeCard = document.createElement('div');
            badgeCard.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
            
            badgeCard.innerHTML = `
                <div class="badge-icon-box">
                    <i class="ph-fill ${b.icon}"></i>
                </div>
                <div class="badge-info">
                    <span class="badge-name">${b.name}</span>
                    <span class="badge-desc">${b.desc}</span>
                </div>
            `;
            badgesGrid.appendChild(badgeCard);
        });
    }

    // 5. THEME TOGGLER
    themeToggleBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        themeIcon.className = nextTheme === 'light' ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
    });

    // 6. TIMER ENGINE
    // SVG DashOffset calculator
    function setTimerProgress(percent) {
        const circleRadius = 130;
        const circumference = 2 * Math.PI * circleRadius;
        const offset = circumference - (percent / 100) * circumference;
        timerProgress.style.strokeDashoffset = offset;
    }

    function formatTime(secs) {
        const mins = Math.floor(secs / 60);
        const remaining = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
    }

    function getActiveModeName() {
        if (FocusFlowState.timer.mode === 'focus') return "Focus Space";
        if (FocusFlowState.timer.mode === 'shortBreak') return "Short Break";
        return "Long Break";
    }

    function updateTimerUI() {
        timerTime.textContent = formatTime(FocusFlowState.timer.timeLeft);
        timerStatus.textContent = getActiveModeName();
        
        // Progress percentage
        const pct = (FocusFlowState.timer.timeLeft / FocusFlowState.timer.totalDuration) * 100;
        setTimerProgress(pct);

        // Tab selection highlight
        document.querySelectorAll('.timer-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.mode === FocusFlowState.timer.mode) {
                tab.classList.add('active');
            }
        });

        // Set layout color schemes context
        document.body.setAttribute('data-active-mode', FocusFlowState.timer.mode);

        // Toggle play/pause icon states
        if (FocusFlowState.timer.isRunning) {
            playIcon.className = "ph-fill ph-pause";
            playText.textContent = "Pause Session";
        } else {
            playIcon.className = "ph-fill ph-play";
            playText.textContent = FocusFlowState.timer.mode === 'focus' ? "Start Focus" : "Start Break";
        }

        // Webpage title tracking
        document.title = `${formatTime(FocusFlowState.timer.timeLeft)} | FocusFlow`;
    }

    function switchMode(newMode) {
        stopTimer();
        FocusFlowState.timer.mode = newMode;
        
        let mins = FocusFlowState.settings.focus;
        if (newMode === 'shortBreak') mins = FocusFlowState.settings.shortBreak;
        if (newMode === 'longBreak') mins = FocusFlowState.settings.longBreak;

        FocusFlowState.timer.timeLeft = mins * 60;
        FocusFlowState.timer.totalDuration = mins * 60;

        // Ticker quotes rotation
        const quotesPool = newMode === 'focus' ? QUOTES.focus : QUOTES.break;
        const randomQuote = quotesPool[Math.floor(Math.random() * quotesPool.length)];
        quoteText.textContent = `"${randomQuote}"`;

        updateTimerUI();
    }

    function stopTimer() {
        if (FocusFlowState.timer.timerId) {
            clearInterval(FocusFlowState.timer.timerId);
            FocusFlowState.timer.timerId = null;
        }
        FocusFlowState.timer.isRunning = false;
        updateTimerUI();
    }

    function tick() {
        if (FocusFlowState.timer.timeLeft > 0) {
            FocusFlowState.timer.timeLeft--;
            updateTimerUI();
            
            // Audio Tick Sound feedback
            if (FocusFlowState.timer.mode === 'focus' && FocusFlowState.settings.soundTicking) {
                AudioController.playTick();
            }
        } else {
            // Timer reaches zero!
            stopTimer();
            handleSessionCompleted();
        }
    }

    function startTimer() {
        AudioController.init();
        FocusFlowState.timer.isRunning = true;
        updateTimerUI();
        FocusFlowState.timer.timerId = setInterval(tick, 1000);
    }

    // Trigger complete events
    function handleSessionCompleted() {
        const mode = FocusFlowState.timer.mode;
        
        if (FocusFlowState.settings.soundChime) {
            AudioController.playChime();
        }

        // Streak check & persistence updates
        let xpGranted = 15;
        if (mode === 'focus') {
            xpGranted = 35;
            // Increments active task pomodoro
            incrementActiveTaskPomodoro();
            
            // Record history
            const activeTaskObj = FocusFlowState.tasks.find(t => t.active);
            const taskTitle = activeTaskObj ? activeTaskObj.title : 'Free Focus Session';
            
            logSessionHistory('focus', taskTitle, FocusFlowState.settings.focus, xpGranted);
            
            // Update daily streak
            const todayStr = new Date().toDateString();
            if (FocusFlowState.gamification.lastFocusDate !== todayStr) {
                // If yesterday was last date, increment streak, otherwise reset
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (FocusFlowState.gamification.lastFocusDate === yesterday.toDateString() || !FocusFlowState.gamification.lastFocusDate) {
                    FocusFlowState.gamification.streak++;
                } else {
                    FocusFlowState.gamification.streak = 1;
                }
                FocusFlowState.gamification.lastFocusDate = todayStr;
            }

            triggerToast("Deep Block Finished!", "Incredible effort! You earned 35 XP. Time to rest your eyes.", "ph-sparkle");
            
            // Trigger automatic next phase
            if (FocusFlowState.settings.autoBreaks) {
                switchMode('shortBreak');
                startTimer();
            } else {
                switchMode('shortBreak');
            }

        } else {
            // Break completed
            logSessionHistory('break', 'Rest Block Completed', mode === 'shortBreak' ? FocusFlowState.settings.shortBreak : FocusFlowState.settings.longBreak, xpGranted);
            triggerToast("Break Completed!", "Time to return to productivity!", "ph-lightning");

            if (FocusFlowState.settings.autoPoms) {
                switchMode('focus');
                startTimer();
            } else {
                switchMode('focus');
            }
        }

        awardXp(xpGranted);
        checkBadgeAchievements();
    }

    timerToggle.addEventListener('click', () => {
        if (FocusFlowState.timer.isRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    });

    timerReset.addEventListener('click', () => {
        switchMode(FocusFlowState.timer.mode);
    });

    timerSkip.addEventListener('click', () => {
        stopTimer();
        if (FocusFlowState.timer.mode === 'focus') {
            switchMode('shortBreak');
        } else {
            switchMode('focus');
        }
    });

    // Wire up tab clicks
    document.querySelectorAll('.timer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchMode(tab.dataset.mode);
        });
    });

    // 7. TASK MANAGER LOGIC
    function refreshTasksUI() {
        taskList.innerHTML = '';
        
        let completedCount = 0;
        FocusFlowState.tasks.forEach(task => {
            if (task.completed) completedCount++;

            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''} ${task.active ? 'active-working' : ''}`;
            
            li.innerHTML = `
                <div class="task-left">
                    <div class="task-checkbox-custom">
                        <i class="ph-bold ph-check"></i>
                    </div>
                    <div class="task-text-group">
                        <span class="task-title">${escapeHTML(task.title)}</span>
                        <div class="task-badges">
                            <span class="priority-tag ${task.priority}">${task.priority}</span>
                            <span class="task-poms-tag"><i class="ph-fill ph-clock"></i> ${task.completedPoms}/${task.estPoms}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-act-btn pin-btn" title="Pin as Active Working Task">
                        <i class="ph-fill ph-push-pin" style="${task.active ? 'color: var(--accent-color);' : ''}"></i>
                    </button>
                    <button class="task-act-btn delete-btn" title="Delete Task">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            `;

            // Checkbox completion toggle
            li.querySelector('.task-checkbox-custom').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTaskCompletion(task.id);
            });

            // Active worker selection toggle
            li.querySelector('.pin-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                selectActiveTask(task.id);
            });

            // Delete click
            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            // Make single click select working active task too
            li.addEventListener('click', () => {
                selectActiveTask(task.id);
            });

            taskList.appendChild(li);
        });

        // Compute fractions
        const total = FocusFlowState.tasks.length;
        taskCompletedFraction.textContent = `${completedCount}/${total} Tasks`;
        
        const progressPct = total > 0 ? (completedCount / total) * 100 : 0;
        taskProgressFill.style.width = `${progressPct}%`;

        // Render pinned tasks
        const activeObj = FocusFlowState.tasks.find(t => t.active);
        if (activeObj) {
            activeTaskContainer.style.display = 'flex';
            activeTaskName.textContent = activeObj.title;
            activeTaskProgress.textContent = `${activeObj.completedPoms}/${activeObj.estPoms}`;
        } else {
            activeTaskContainer.style.display = 'none';
        }
    }

    function toggleTaskCompletion(id) {
        FocusFlowState.tasks = FocusFlowState.tasks.map(t => {
            if (t.id === id) {
                const completeState = !t.completed;
                if (completeState) {
                    awardXp(20); // Bonus XP for task completion!
                    triggerToast("Task Completed!", "Nice! You earned 20 XP.", "ph-check-circle");
                }
                return { ...t, completed: completeState };
            }
            return t;
        });
        checkBadgeAchievements();
        FocusFlowState.saveToLocalStorage();
        refreshTasksUI();
        updateAnalytics();
    }

    function selectActiveTask(id) {
        FocusFlowState.tasks = FocusFlowState.tasks.map(t => {
            return { ...t, active: (t.id === id) };
        });
        FocusFlowState.saveToLocalStorage();
        refreshTasksUI();
    }

    function deleteTask(id) {
        FocusFlowState.tasks = FocusFlowState.tasks.filter(t => t.id !== id);
        FocusFlowState.saveToLocalStorage();
        refreshTasksUI();
    }

    function incrementActiveTaskPomodoro() {
        FocusFlowState.tasks = FocusFlowState.tasks.map(t => {
            if (t.active) {
                return { ...t, completedPoms: t.completedPoms + 1 };
            }
            return t;
        });
        FocusFlowState.saveToLocalStorage();
        refreshTasksUI();
    }

    // Submit new task form
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const priority = taskPriority.value;
        
        const newTask = {
            id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
            title: text,
            priority: priority,
            estPoms: tempEstCount,
            completedPoms: 0,
            completed: false,
            active: FocusFlowState.tasks.length === 0 // Make first task active automatically
        };

        FocusFlowState.tasks.push(newTask);
        FocusFlowState.saveToLocalStorage();
        
        // Reset forms
        taskInput.value = '';
        tempEstCount = 1;
        estCount.textContent = '1';
        taskPriority.value = 'medium';

        refreshTasksUI();
    });

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // 8. SOUNDSCAPE WIDGET WIREUPS
    soundTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            soundTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const soundType = tab.dataset.sound;
            AudioController.playAmbient(soundType);
        });
    });

    ambientVolume.addEventListener('input', (e) => {
        AudioController.setVolume(e.target.value);
    });

    // 9. SETTINGS CONTROL FORM
    settingsBtn.addEventListener('click', () => {
        // Load initial inputs from state
        settingFocus.value = FocusFlowState.settings.focus;
        settingShort.value = FocusFlowState.settings.shortBreak;
        settingLong.value = FocusFlowState.settings.longBreak;
        settingAutoBreaks.checked = FocusFlowState.settings.autoBreaks;
        settingAutoPoms.checked = FocusFlowState.settings.autoPoms;
        settingSoundChime.checked = FocusFlowState.settings.soundChime;
        settingSoundTicking.checked = FocusFlowState.settings.soundTicking;

        settingsModal.classList.add('active');
    });

    settingsClose.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsResetDefaultBtn.addEventListener('click', () => {
        settingFocus.value = 25;
        settingShort.value = 5;
        settingLong.value = 15;
        settingAutoBreaks.checked = false;
        settingAutoPoms.checked = false;
        settingSoundChime.checked = true;
        settingSoundTicking.checked = false;
    });

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        FocusFlowState.settings.focus = parseInt(settingFocus.value);
        FocusFlowState.settings.shortBreak = parseInt(settingShort.value);
        FocusFlowState.settings.longBreak = parseInt(settingLong.value);
        FocusFlowState.settings.autoBreaks = settingAutoBreaks.checked;
        FocusFlowState.settings.autoPoms = settingAutoPoms.checked;
        FocusFlowState.settings.soundChime = settingSoundChime.checked;
        FocusFlowState.settings.soundTicking = settingSoundTicking.checked;

        FocusFlowState.saveToLocalStorage();
        settingsModal.classList.remove('active');

        // Apply durations immediately
        switchMode(FocusFlowState.timer.mode);
        triggerToast("Settings Applied!", "Your customized durations have been loaded successfully.", "ph-gear-six");
    });

    // Achievement badges Modal
    badgeMenuBtn.addEventListener('click', () => {
        renderBadgesGrid();
        badgesModal.classList.add('active');
    });
    badgesClose.addEventListener('click', () => {
        badgesModal.classList.remove('active');
    });

    // Close Modals on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
        if (e.target === badgesModal) badgesModal.classList.remove('active');
    });

    // 10. SESSION HISTORY LOGGER
    function logSessionHistory(mode, title, mins, xp) {
        const item = {
            id: 'hist_' + Date.now(),
            mode: mode,
            title: title,
            duration: mins,
            timestamp: new Date().getTime(),
            xp: xp
        };
        FocusFlowState.history.unshift(item); // Prepend
        FocusFlowState.saveToLocalStorage();
        updateAnalytics();
    }

    function renderHistoryList() {
        historyList.innerHTML = '';
        const list = FocusFlowState.history;

        if (list.length === 0) {
            historyList.innerHTML = '<li class="empty-history">No sessions logged yet. Complete a focus block to start!</li>';
            return;
        }

        list.slice(0, 15).forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            li.innerHTML = `
                <div class="hist-left">
                    <span class="hist-dot ${item.mode === 'focus' ? 'focus' : 'break'}"></span>
                    <span class="hist-title">${escapeHTML(item.title)}</span>
                    <span class="hist-time">${dateStr}</span>
                </div>
                <div class="hist-right">
                    <span class="hist-dur">${item.duration}m</span>
                    <span class="hist-xp">+${item.xp} XP</span>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your productivity focus history? This will reset all charts.")) {
            FocusFlowState.history = [];
            FocusFlowState.saveToLocalStorage();
            updateAnalytics();
            triggerToast("Logs Cleared", "Productivity logs have been wiped successfully.", "ph-trash");
        }
    });

    // 11. ANALYTICS CALCULATION & SVG CHARTS GENERATOR
    function computeAnalyticsStats() {
        let totalMinutes = 0;
        let completedPoms = 0;
        let completedTasks = 0;

        FocusFlowState.history.forEach(item => {
            if (item.mode === 'focus') {
                totalMinutes += item.duration;
                completedPoms++;
            }
        });

        FocusFlowState.tasks.forEach(t => {
            if (t.completed) completedTasks++;
        });

        return { totalMinutes, completedPoms, completedTasks };
    }

    function updateAnalytics() {
        const stats = computeAnalyticsStats();
        
        statTotalMinutes.textContent = stats.totalMinutes;
        statCompletedPoms.textContent = stats.completedPoms;
        statTasksCompleted.textContent = stats.completedTasks;

        // Rank designation
        let rank = "Bronze";
        if (stats.totalMinutes >= 500) rank = "Platinum";
        else if (stats.totalMinutes >= 200) rank = "Gold";
        else if (stats.totalMinutes >= 60) rank = "Silver";
        
        statUserTier.textContent = rank;

        renderHistoryList();
        generateCharts();
    }

    // Custom programmatically rendered SVG charts
    function generateCharts() {
        generateWeeklyBarChart();
        generateHourlyDistributionChart();
    }

    function generateWeeklyBarChart() {
        const container = document.getElementById('weekly-chart-container');
        container.innerHTML = '';

        // Calculate focus minutes for the last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const minutesPerDay = [0, 0, 0, 0, 0, 0, 0];
        
        const now = new Date();
        FocusFlowState.history.forEach(item => {
            if (item.mode === 'focus') {
                const diffTime = Math.abs(now - new Date(item.timestamp));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                    const dayIdx = new Date(item.timestamp).getDay();
                    minutesPerDay[dayIdx] += item.duration;
                }
            }
        });

        // Rotate index so today is on the far right
        const todayIdx = now.getDay();
        const displayDays = [];
        const displayMins = [];
        for (let i = 6; i >= 0; i--) {
            const idx = (todayIdx - i + 7) % 7;
            displayDays.push(days[idx]);
            displayMins.push(minutesPerDay[idx]);
        }

        // SVG Dimensions
        const width = 180;
        const height = 110;
        const padding = 15;
        const maxVal = Math.max(...displayMins, 25); // Minimum y-scale height of 25m

        let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">`;
        
        // Render 4 horizontal gridlines
        for (let i = 0; i <= 3; i++) {
            const y = padding + (i / 3) * (height - 2 * padding);
            svgContent += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--card-border)" stroke-width="1" stroke-dasharray="2,2"/>`;
        }

        const barWidth = 14;
        const gap = (width - 2 * padding - 7 * barWidth) / 6;

        for (let i = 0; i < 7; i++) {
            const x = padding + i * (barWidth + gap);
            const barHeight = (displayMins[i] / maxVal) * (height - 2 * padding);
            const y = height - padding - barHeight;

            // Bar background slot
            svgContent += `<rect x="${x}" y="${padding}" width="${barWidth}" height="${height - 2 * padding}" rx="4" fill="rgba(255,255,255,0.02)"/>`;

            // Active focus bar
            if (barHeight > 0) {
                svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--accent-color)" filter="drop-shadow(0 2px 4px var(--accent-glow))" class="chart-bar-anim"/>`;
            }

            // Labels
            svgContent += `<text x="${x + barWidth / 2}" y="${height - 2}" text-anchor="middle" font-size="7" fill="var(--text-muted)" font-weight="600">${displayDays[i]}</text>`;
            
            // Value labels hovering
            if (displayMins[i] > 0) {
                svgContent += `<text x="${x + barWidth / 2}" y="${y - 3}" text-anchor="middle" font-size="7" fill="var(--text-secondary)" font-weight="700">${displayMins[i]}m</text>`;
            }
        }

        svgContent += `</svg>`;
        container.innerHTML = svgContent;
    }

    function generateHourlyDistributionChart() {
        const container = document.getElementById('hourly-chart-container');
        container.innerHTML = '';

        // Hourly aggregation (24 hours grouped into 6 sectors of 4-hours)
        const hourlyBuckets = [0, 0, 0, 0, 0, 0]; // 0-4, 4-8, 8-12, 12-16, 16-20, 20-24
        const bucketLabels = ['Night', 'Early', 'Morning', 'Afternoon', 'Evening', 'Night'];

        FocusFlowState.history.forEach(item => {
            if (item.mode === 'focus') {
                const hour = new Date(item.timestamp).getHours();
                const bucketIdx = Math.floor(hour / 4);
                hourlyBuckets[bucketIdx]++;
            }
        });

        // Chart dimension
        const width = 180;
        const height = 110;
        const padding = 15;
        const maxVal = Math.max(...hourlyBuckets, 3);

        let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">`;
        
        // Chart lines
        for (let i = 0; i <= 3; i++) {
            const y = padding + (i / 3) * (height - 2 * padding);
            svgContent += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--card-border)" stroke-width="1" stroke-dasharray="2,2"/>`;
        }

        const barWidth = 16;
        const gap = (width - 2 * padding - 6 * barWidth) / 5;

        for (let i = 0; i < 6; i++) {
            const x = padding + i * (barWidth + gap);
            const barHeight = (hourlyBuckets[i] / maxVal) * (height - 2 * padding);
            const y = height - padding - barHeight;

            svgContent += `<rect x="${x}" y="${padding}" width="${barWidth}" height="${height - 2 * padding}" rx="4" fill="rgba(255,255,255,0.02)"/>`;

            if (barHeight > 0) {
                svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--accent-pink)" class="chart-bar-anim"/>`;
            }

            svgContent += `<text x="${x + barWidth / 2}" y="${height - 2}" text-anchor="middle" font-size="7" fill="var(--text-muted)" font-weight="600">${bucketLabels[i]}</text>`;

            if (hourlyBuckets[i] > 0) {
                svgContent += `<text x="${x + barWidth / 2}" y="${y - 3}" text-anchor="middle" font-size="7" fill="var(--text-secondary)" font-weight="700">${hourlyBuckets[i]}</text>`;
            }
        }

        svgContent += `</svg>`;
        container.innerHTML = svgContent;
    }

    // Export history to CSV
    exportCsvBtn.addEventListener('click', () => {
        const history = FocusFlowState.history;
        if (history.length === 0) {
            triggerToast("Export Failed", "There is no focus history logged yet.", "ph-x-circle");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Session Type,Description,Duration (Mins),XP Gained,Time Logged\r\n";

        history.forEach(item => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            const cleanTitle = item.title.replace(/"/g, '""');
            csvContent += `${item.id},${item.mode},"${cleanTitle}",${item.duration},${item.xp},"${dateStr}"\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `focusflow_productivity_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        
        triggerToast("CSV Exported!", "Your local study analytics file was generated successfully.", "ph-file-csv");
    });

    // 12. INITIAL BOOTSTRAP INITIALIZATION
    switchMode('focus');
    refreshGamification();
    refreshTasksUI();
    updateAnalytics();
    
    // Welcome message
    triggerToast("Welcome to FocusFlow!", "Tap 'Start Focus' to launch your high-efficiency session.", "ph-compass");
});
