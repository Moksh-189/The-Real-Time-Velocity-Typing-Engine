/**
 * ========================================
 * TYPING ENGINE - GLASS HUD
 * High-performance real-time typing test
 * With timer modes and performance analytics
 * ========================================
 */

// ========================================
// SAMPLE TEXT CORPUS (Extended for longer tests)
// ========================================
const SAMPLE_TEXTS = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. Typing tests often use such sentences to ensure comprehensive keyboard coverage. Practice makes perfect when it comes to typing speed.",
    "In the realm of software development, clean code is not just about making programs work. It is about crafting solutions that are readable, maintainable, and elegant. Every developer should strive to write code that tells a story and can be understood by others.",
    "Technology continues to reshape our world at an unprecedented pace. From artificial intelligence to quantum computing, innovations emerge daily that challenge our understanding of what machines can accomplish. The future promises even more remarkable breakthroughs.",
    "The art of programming lies not in complexity but in simplicity. A truly skilled developer can take a complicated problem and distill it into an elegant solution that others can understand and build upon. This is the mark of true expertise.",
    "Practice makes perfect when it comes to typing speed. Consistent daily practice, proper finger placement, and maintaining good posture all contribute to improving your words per minute over time. Keep pushing your limits and you will see improvement.",
    "JavaScript is a versatile programming language that powers the modern web. From simple animations to complex web applications, JavaScript enables developers to create interactive and dynamic user experiences. Its ecosystem continues to grow rapidly.",
    "The keyboard is an extension of your thoughts when you master touch typing. Your fingers dance across the keys, translating ideas into words without conscious effort. This fluency comes only through dedicated practice and patience.",
    "Web development has evolved significantly over the past decade. Modern frameworks and tools have simplified complex tasks, enabling developers to build sophisticated applications with less effort. However, understanding fundamentals remains crucial.",
    "Accuracy is just as important as speed in typing. Making fewer mistakes means less time spent correcting errors and more efficient communication. Focus on precision first, and speed will naturally follow with practice.",
    "The best typists in the world can exceed two hundred words per minute while maintaining near perfect accuracy. This level of skill requires years of dedicated practice and a deep understanding of keyboard layouts and finger positioning."
];

// ========================================
// STATE MANAGEMENT
// ========================================
const state = {
    text: '',
    spans: [],
    activeIndex: 0,
    startTime: null,
    timerInterval: null,
    correctChars: 0,
    incorrectChars: 0,
    totalKeysPressed: 0,
    isFinished: false,
    isStarted: false,
    lastKeypressTime: null,
    cursorTimeout: null,

    // Timer settings
    testDuration: 60,
    remainingTime: 60,
    countdownInterval: null,

    // Performance tracking for graph
    performanceData: [],
    lastRecordedSecond: 0
};

// ========================================
// DOM CACHE (Performance optimization)
// ========================================
const DOM = {
    typingArea: null,
    cursor: null,
    wpmDisplay: null,
    accuracyDisplay: null,
    timeDisplay: null,
    glassCard: null,
    restartBtn: null,
    timerPills: null,
    customTimeInput: null,
    resultsOverlay: null,
    finalWpm: null,
    finalAccuracy: null,
    finalChars: null,
    rawWpm: null,
    correctCharsDisplay: null,
    incorrectCharsDisplay: null,
    finalTime: null,
    performanceGraph: null,
    restartModalBtn: null
};

// ========================================
// INITIALIZATION
// ========================================
function init() {
    // Cache DOM elements
    DOM.typingArea = document.getElementById('typing-area');
    DOM.cursor = document.getElementById('cursor');
    DOM.wpmDisplay = document.getElementById('wpm');
    DOM.accuracyDisplay = document.getElementById('accuracy');
    DOM.timeDisplay = document.getElementById('time');
    DOM.glassCard = document.querySelector('.glass-card');
    DOM.restartBtn = document.getElementById('restart-btn');
    DOM.timerPills = document.querySelectorAll('.timer-pill');
    DOM.customTimeInput = document.getElementById('custom-time');
    DOM.resultsOverlay = document.getElementById('results-overlay');
    DOM.finalWpm = document.getElementById('final-wpm');
    DOM.finalAccuracy = document.getElementById('final-accuracy');
    DOM.finalChars = document.getElementById('final-chars');
    DOM.rawWpm = document.getElementById('raw-wpm');
    DOM.correctCharsDisplay = document.getElementById('correct-chars');
    DOM.incorrectCharsDisplay = document.getElementById('incorrect-chars');
    DOM.finalTime = document.getElementById('final-time');
    DOM.performanceGraph = document.getElementById('performance-graph');
    DOM.restartModalBtn = document.getElementById('restart-modal-btn');

    // Generate enough text for the test
    generateText();

    // Generate character spans
    generateCharacterSpans();

    // Position cursor at first character
    requestAnimationFrame(updateCursorPosition);

    // Update time display
    DOM.timeDisplay.textContent = state.testDuration;

    // Attach event listeners
    window.addEventListener('keydown', handleKeydown);
    DOM.restartBtn.addEventListener('click', restartTest);
    DOM.restartModalBtn.addEventListener('click', () => {
        hideResults();
        restartTest();
    });

    // Timer pill listeners
    DOM.timerPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const time = parseInt(pill.dataset.time);
            selectTimer(time, pill);
        });
    });

    // Custom time input listener
    DOM.customTimeInput.addEventListener('change', () => {
        const customTime = parseInt(DOM.customTimeInput.value);
        if (customTime >= 5 && customTime <= 300) {
            selectTimer(customTime, null);
        }
    });

    DOM.customTimeInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
    });

    // Close results on escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.resultsOverlay.classList.contains('show')) {
            hideResults();
            restartTest();
        }
    });

    console.log('🚀 Glass HUD Typing Engine initialized');
}

// ========================================
// TIMER SELECTION
// ========================================
function selectTimer(seconds, pillElement) {
    state.testDuration = seconds;
    state.remainingTime = seconds;

    DOM.timerPills.forEach(pill => pill.classList.remove('active'));
    if (pillElement) {
        pillElement.classList.add('active');
        DOM.customTimeInput.value = '';
    }

    DOM.timeDisplay.textContent = seconds;

    if (state.isStarted) {
        restartTest();
    }
}

// ========================================
// GENERATE TEXT
// ========================================
function generateText() {
    const charsNeeded = Math.ceil((state.testDuration / 60) * 1200);

    let text = '';
    while (text.length < charsNeeded) {
        const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
        text += (text ? ' ' : '') + randomText;
    }

    state.text = text;
}

// ========================================
// GENERATE CHARACTER SPANS
// ========================================
function generateCharacterSpans() {
    DOM.typingArea.innerHTML = '';
    state.spans = [];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < state.text.length; i++) {
        const span = document.createElement('span');
        const char = state.text[i];

        if (char === ' ') {
            span.innerHTML = '&nbsp;';
            span.dataset.char = ' ';
        } else {
            span.textContent = char;
            span.dataset.char = char;
        }

        state.spans.push(span);
        fragment.appendChild(span);
    }

    DOM.typingArea.appendChild(fragment);
}

// ========================================
// KEYDOWN HANDLER
// ========================================
function handleKeydown(e) {
    if (DOM.resultsOverlay.classList.contains('show')) return;
    if (state.isFinished) return;

    const key = e.key;

    if (isModifierKey(key)) return;

    if (key === ' ' || key === 'Backspace') {
        e.preventDefault();
    }

    if (key === 'Backspace') {
        handleBackspace();
        return;
    }

    if (key.length > 1) return;

    if (!state.isStarted) {
        startTest();
    }

    state.lastKeypressTime = Date.now();
    DOM.cursor.classList.add('typing');

    clearTimeout(state.cursorTimeout);
    state.cursorTimeout = setTimeout(() => {
        DOM.cursor.classList.remove('typing');
    }, 500);

    processKeypress(key);
}

// ========================================
// CHECK FOR MODIFIER KEYS
// ========================================
function isModifierKey(key) {
    const modifiers = [
        'Shift', 'Control', 'Alt', 'Meta',
        'CapsLock', 'Tab', 'Escape',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown',
        'Insert', 'Delete', 'Enter',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
        'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];
    return modifiers.includes(key);
}

// ========================================
// PROCESS KEYPRESS
// ========================================
function processKeypress(key) {
    if (state.activeIndex >= state.spans.length) {
        finishTest();
        return;
    }

    const currentSpan = state.spans[state.activeIndex];
    const expectedChar = currentSpan.dataset.char;

    state.totalKeysPressed++;

    if (key === expectedChar) {
        currentSpan.classList.remove('incorrect');
        currentSpan.classList.add('correct');
        state.correctChars++;
    } else {
        currentSpan.classList.remove('correct');
        currentSpan.classList.add('incorrect');
        state.incorrectChars++;
    }

    state.activeIndex++;

    requestAnimationFrame(updateCursorPosition);
    updateMetrics();
    checkVelocityMode();

    if (state.activeIndex >= state.spans.length) {
        finishTest();
    }
}

// ========================================
// HANDLE BACKSPACE
// ========================================
function handleBackspace() {
    if (state.activeIndex === 0) return;

    state.activeIndex--;

    const prevSpan = state.spans[state.activeIndex];

    if (prevSpan.classList.contains('correct')) {
        state.correctChars--;
    } else if (prevSpan.classList.contains('incorrect')) {
        state.incorrectChars--;
    }

    prevSpan.classList.remove('correct', 'incorrect');

    if (state.totalKeysPressed > 0) {
        state.totalKeysPressed--;
    }

    requestAnimationFrame(updateCursorPosition);
    updateMetrics();
}

// ========================================
// BLOCK CURSOR POSITIONING
// ========================================
function updateCursorPosition() {
    let targetSpan;

    if (state.activeIndex >= state.spans.length) {
        targetSpan = state.spans[state.spans.length - 1];
    } else {
        targetSpan = state.spans[state.activeIndex];
    }

    const rect = targetSpan.getBoundingClientRect();
    const cardRect = DOM.glassCard.getBoundingClientRect();

    // Block cursor - position behind the character
    DOM.cursor.style.left = `${rect.left - cardRect.left}px`;
    DOM.cursor.style.top = `${rect.top - cardRect.top}px`;
    DOM.cursor.style.width = `${rect.width}px`;
    DOM.cursor.style.height = `${rect.height}px`;
}

// ========================================
// TEST START
// ========================================
function startTest() {
    state.isStarted = true;
    state.startTime = Date.now();
    state.remainingTime = state.testDuration;
    state.performanceData = [];
    state.lastRecordedSecond = 0;

    state.countdownInterval = setInterval(() => {
        const elapsed = (Date.now() - state.startTime) / 1000;
        state.remainingTime = Math.max(0, state.testDuration - elapsed);

        DOM.timeDisplay.textContent = Math.ceil(state.remainingTime);

        const currentSecond = Math.floor(elapsed);
        if (currentSecond > state.lastRecordedSecond && currentSecond <= state.testDuration) {
            recordPerformanceData(currentSecond);
            state.lastRecordedSecond = currentSecond;
        }

        if (state.remainingTime <= 0) {
            finishTest();
        }
    }, 100);

    state.timerInterval = setInterval(() => {
        updateMetrics();
    }, 100);
}

// ========================================
// RECORD PERFORMANCE DATA
// ========================================
function recordPerformanceData(second) {
    const elapsedMinutes = second / 60;
    const wpm = elapsedMinutes > 0 ? Math.round((state.correctChars / 5) / elapsedMinutes) : 0;
    const accuracy = state.totalKeysPressed > 0
        ? Math.round((state.correctChars / state.totalKeysPressed) * 100)
        : 100;

    state.performanceData.push({ second, wpm, accuracy });
}

// ========================================
// STOP TIMERS
// ========================================
function stopTimers() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
}

// ========================================
// METRICS CALCULATION
// ========================================
function updateMetrics() {
    const elapsedMs = state.startTime ? Date.now() - state.startTime : 0;
    const elapsedMinutes = elapsedMs / 60000;

    let wpm = 0;
    if (elapsedMinutes > 0) {
        wpm = Math.round((state.correctChars / 5) / elapsedMinutes);
    }

    let accuracy = 100;
    if (state.totalKeysPressed > 0) {
        accuracy = Math.round((state.correctChars / state.totalKeysPressed) * 100);
    }

    DOM.wpmDisplay.textContent = wpm;
    DOM.accuracyDisplay.textContent = accuracy;
}

// ========================================
// VELOCITY MODE
// ========================================
function checkVelocityMode() {
    const elapsedMs = state.startTime ? Date.now() - state.startTime : 0;
    const elapsedMinutes = elapsedMs / 60000;

    let wpm = 0;
    if (elapsedMinutes > 0) {
        wpm = (state.correctChars / 5) / elapsedMinutes;
    }

    if (wpm >= 80) {
        DOM.glassCard.classList.add('velocity-active');
    } else {
        DOM.glassCard.classList.remove('velocity-active');
    }
}

// ========================================
// FINISH TEST
// ========================================
function finishTest() {
    if (state.isFinished) return;

    state.isFinished = true;
    stopTimers();

    const totalSeconds = Math.min(
        (Date.now() - state.startTime) / 1000,
        state.testDuration
    );
    if (totalSeconds > state.lastRecordedSecond) {
        recordPerformanceData(Math.floor(totalSeconds));
    }

    const elapsedMinutes = totalSeconds / 60;
    const finalWPM = elapsedMinutes > 0
        ? Math.round((state.correctChars / 5) / elapsedMinutes)
        : 0;
    const finalAccuracy = state.totalKeysPressed > 0
        ? Math.round((state.correctChars / state.totalKeysPressed) * 100)
        : 100;
    const rawWPM = elapsedMinutes > 0
        ? Math.round(((state.correctChars + state.incorrectChars) / 5) / elapsedMinutes)
        : 0;

    DOM.finalWpm.textContent = finalWPM;
    DOM.finalAccuracy.textContent = finalAccuracy;
    DOM.finalChars.textContent = state.correctChars + state.incorrectChars;
    DOM.rawWpm.textContent = rawWPM;
    DOM.correctCharsDisplay.textContent = state.correctChars;
    DOM.incorrectCharsDisplay.textContent = state.incorrectChars;
    DOM.finalTime.textContent = Math.round(totalSeconds);

    drawPerformanceGraph();
    showResults();

    console.log(`✅ Complete | WPM: ${finalWPM} | Acc: ${finalAccuracy}%`);
}

// ========================================
// PERFORMANCE GRAPH (Glass Style)
// ========================================
function drawPerformanceGraph() {
    const canvas = DOM.performanceGraph;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 120 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '120px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 120;
    const padding = { top: 15, right: 15, bottom: 25, left: 35 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (state.performanceData.length < 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Not enough data', width / 2, height / 2);
        return;
    }

    const maxWPM = Math.max(...state.performanceData.map(d => d.wpm), 50);
    const maxTime = state.performanceData[state.performanceData.length - 1].second;

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (graphHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const wpmValue = Math.round(maxWPM - (maxWPM / 4) * i);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(wpmValue.toString(), padding.left - 5, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    const timeStep = Math.ceil(maxTime / 5);
    for (let t = 0; t <= maxTime; t += timeStep) {
        const x = padding.left + (t / maxTime) * graphWidth;
        ctx.fillText(`${t}s`, x, height - 8);
    }

    // Draw WPM line with glow
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.performanceData.forEach((point, index) => {
        const x = padding.left + (point.second / maxTime) * graphWidth;
        const y = padding.top + (1 - point.wpm / maxWPM) * graphHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Accuracy line
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.performanceData.forEach((point, index) => {
        const x = padding.left + (point.second / maxTime) * graphWidth;
        const y = padding.top + (1 - point.accuracy / 100) * graphHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
}

// ========================================
// SHOW/HIDE RESULTS
// ========================================
function showResults() {
    DOM.resultsOverlay.classList.add('show');
}

function hideResults() {
    DOM.resultsOverlay.classList.remove('show');
}

// ========================================
// RESTART TEST
// ========================================
function restartTest() {
    stopTimers();

    state.activeIndex = 0;
    state.startTime = null;
    state.correctChars = 0;
    state.incorrectChars = 0;
    state.totalKeysPressed = 0;
    state.isFinished = false;
    state.isStarted = false;
    state.remainingTime = state.testDuration;
    state.performanceData = [];
    state.lastRecordedSecond = 0;

    DOM.wpmDisplay.textContent = '0';
    DOM.accuracyDisplay.textContent = '100';
    DOM.timeDisplay.textContent = state.testDuration;

    DOM.glassCard.classList.remove('velocity-active');

    generateText();
    generateCharacterSpans();

    requestAnimationFrame(updateCursorPosition);

    console.log('🔄 Test restarted');
}

// ========================================
// WINDOW RESIZE HANDLER
// ========================================
window.addEventListener('resize', () => {
    requestAnimationFrame(updateCursorPosition);

    if (DOM.resultsOverlay.classList.contains('show')) {
        drawPerformanceGraph();
    }
});

// ========================================
// INITIALIZE ON DOM READY
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
