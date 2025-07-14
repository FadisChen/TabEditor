
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const editor = document.getElementById('editor');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const settingsModal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key');
    const geminiModelSelect = document.getElementById('gemini-model');
    const suggestionDelaySlider = document.getElementById('suggestion-delay');
    const delayValueSpan = document.getElementById('delay-value');
    const articleStyleInput = document.getElementById('article-style');
    const articleLengthSlider = document.getElementById('article-length');
    const lengthValueSpan = document.getElementById('length-value');
    const knowledgeBaseTextarea = document.getElementById('knowledge-base');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const magicWandBtn = document.getElementById('magic-wand-btn');
    const acceptSuggestionBtnContainer = document.getElementById('accept-suggestion-btn-container');
    const acceptSuggestionBtn = document.getElementById('accept-suggestion-btn');
    const downloadBtn = document.getElementById('download-btn');
    const menuBtn = document.getElementById('menu-btn');
    const menuContainer = document.getElementById('menu-container');
    const clearEditorBtn = document.getElementById('clear-editor-btn');

    // App State
    let suggestionTimeout;
    let currentSuggestion = '';

    // --- Initialization ---
    function initializeApp() {
        loadSettings();
        loadEditorContent();
        initTheme();
        addEventListeners();
        checkDeviceAndDisplayButton();
        acceptSuggestionBtnContainer.classList.add('hidden');
    }

    // --- Editor Content Persistence ---
    function saveEditorContent() {
        localStorage.setItem('ghostEditorContent', editor.innerText);
    }

    function loadEditorContent() {
        const savedContent = localStorage.getItem('ghostEditorContent');
        if (savedContent) {
            editor.innerText = savedContent;
        }
    }

    // --- Event Listeners ---
    function addEventListeners() {
        settingsBtn.addEventListener('click', openSettingsModal);
        closeModalBtn.addEventListener('click', closeSettingsModal);
        window.addEventListener('click', (e) => { // Close modal if clicking outside
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
            if (!menuContainer.contains(e.target) && !menuBtn.contains(e.target)) {
                menuContainer.classList.add('hidden');
            }
        });

        editor.addEventListener('input', () => {
            handleEditorInput();
            saveEditorContent(); // Save content on every input
        });
        editor.addEventListener('keydown', handleEditorKeydown);

        apiKeyInput.addEventListener('change', () => {
            saveSettings();
            fetchAndPopulateModels(); 
        });
        geminiModelSelect.addEventListener('change', saveSettings);
        suggestionDelaySlider.addEventListener('input', handleSliderInput);
        suggestionDelaySlider.addEventListener('change', saveSettings);
        articleStyleInput.addEventListener('change', saveSettings);
        articleLengthSlider.addEventListener('input', handleLengthSliderInput);
        articleLengthSlider.addEventListener('change', saveSettings);
        knowledgeBaseTextarea.addEventListener('change', saveSettings);

        themeToggleBtn.addEventListener('click', toggleTheme);
        magicWandBtn.addEventListener('click', handleMagicWand);
        acceptSuggestionBtn.addEventListener('click', acceptSuggestion);
        downloadBtn.addEventListener('click', handleDownload);
        menuBtn.addEventListener('click', toggleMenu);
        clearEditorBtn.addEventListener('click', clearEditorContent);

        window.addEventListener('resize', checkDeviceAndDisplayButton);
    }

    // --- Menu Logic ---
    function toggleMenu() {
        menuContainer.classList.toggle('hidden');
    }

    // --- Clear Editor Logic ---
    function clearEditorContent() {
        if (confirm('確定要清除內容嗎？')){
            editor.innerText = '';
            saveEditorContent();
            removeSuggestion();
            menuContainer.classList.add('hidden'); // Close menu after clearing
        }
    }

    // --- Device Detection ---
    function isMobileOrTablet() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        // Basic detection for common mobile/tablet OS
        if (/android/i.test(userAgent)) {
            return true;
        }
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return true;
        }
        // Check for touch screen capability (more reliable for tablets)
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    }

    function checkDeviceAndDisplayButton() {
        if (isMobileOrTablet()) {
            acceptSuggestionBtnContainer.classList.remove('hidden');
        } else {
            acceptSuggestionBtnContainer.classList.add('hidden');
        }
    }

    // --- Settings Management ---
    function openSettingsModal() {
        settingsModal.classList.remove('hidden');
        fetchAndPopulateModels();
    }

    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }

    function saveSettings() {
        const settings = {
            apiKey: apiKeyInput.value,
            model: geminiModelSelect.value,
            delay: suggestionDelaySlider.value,
            articleStyle: articleStyleInput.value,
            articleLength: articleLengthSlider.value,
            knowledgeBase: knowledgeBaseTextarea.value
        };
        localStorage.setItem('ghostEditorSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('ghostEditorSettings'));
        if (settings) {
            apiKeyInput.value = settings.apiKey || '';
            suggestionDelaySlider.value = settings.delay || 3;
            delayValueSpan.textContent = settings.delay || 3;
            articleStyleInput.value = settings.articleStyle || '';
            articleLengthSlider.value = settings.articleLength || 2048;
            lengthValueSpan.textContent = settings.articleLength || 2048;
            knowledgeBaseTextarea.value = settings.knowledgeBase || '';

            if (settings.apiKey) {
                fetchAndPopulateModels();
            }
        }
    }
    
    function handleSliderInput() {
        delayValueSpan.textContent = suggestionDelaySlider.value;
        saveSettings();
    }

    function handleLengthSliderInput() {
        lengthValueSpan.textContent = articleLengthSlider.value;
        saveSettings();
    }

    // --- Theme Management ---
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeToggleBtn.textContent = '☀️ 淺色';
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleBtn.textContent = '🌙 深色';
        }
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // --- Editor and Suggestion Logic ---
    function handleEditorInput() {
        clearTimeout(suggestionTimeout);
        if (currentSuggestion) {
            removeSuggestion();
        }
        // Hide the accept button if there's no suggestion
        if (isMobileOrTablet() && !currentSuggestion) {
            acceptSuggestionBtnContainer.classList.add('hidden');
        }

        const delay = (suggestionDelaySlider.value || 3) * 1000;
        suggestionTimeout = setTimeout(() => {
            triggerSuggestion();
        }, delay);
    }

    function handleEditorKeydown(e) {
        if (e.key === 'Tab' && currentSuggestion) {
            e.preventDefault();
            acceptSuggestion();
        } 
    }

    async function triggerSuggestion() {
        const content = editor.innerText;
        if (!content.trim() || document.getElementById('suggestion-node')) return;

        const articleStyle = articleStyleInput.value;
        const stylePrompt = articleStyle ? `Please adopt the following writing style: ${articleStyle}.` : '';
        const prompt = `Based on the following text, provide a short, relevant continuation. Do not repeat the original text in your response. Just provide the new text snippet. ${stylePrompt}`;
        
        const suggestion = await callGeminiAPI(prompt, content, 100, false);
        
        if (suggestion) {
            displaySuggestion(suggestion);
        }
    }

    function displaySuggestion(suggestion) {
        removeSuggestion();
        currentSuggestion = suggestion;
        const suggestionNode = document.createElement('span');
        suggestionNode.id = 'suggestion-node';
        suggestionNode.className = 'suggestion-text';
        suggestionNode.innerText = suggestion;
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.collapse(false);
            range.insertNode(suggestionNode);
            const newRange = document.createRange();
            newRange.setStartAfter(suggestionNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        // Show the accept button if on mobile/tablet
        if (isMobileOrTablet()) {
            acceptSuggestionBtnContainer.classList.remove('hidden');
        }
    }

    function removeSuggestion() {
        const suggestionNode = document.getElementById('suggestion-node');
        if (suggestionNode) {
            suggestionNode.remove();
        }
        currentSuggestion = '';
        // Hide the accept button when suggestion is removed
        if (isMobileOrTablet()) {
            acceptSuggestionBtnContainer.classList.add('hidden');
        }
    }

    function acceptSuggestion() {
        const suggestionNode = document.getElementById('suggestion-node');
        if (suggestionNode) {
            const text = suggestionNode.innerText;
            suggestionNode.remove();
            document.execCommand('insertText', false, text);
            currentSuggestion = '';
            handleEditorInput();
            editor.blur(); // Dismiss soft keyboard on mobile
        }
    }

    // --- Magic Wand Logic ---
    async function handleMagicWand() {
        acceptSuggestionBtnContainer.classList.add('hidden');
        const content = editor.innerText;
        if (!content.trim()) {
            alert('Editor is empty. Please write something to rewrite.');
            return;
        }

        magicWandBtn.disabled = true;
        magicWandBtn.classList.add('animate-pulse');

        const articleStyle = articleStyleInput.value;
        const stylePrompt = articleStyle ? `Please adopt the following writing style: ${articleStyle}.` : '';
        const prompt = `You are an expert writer. Rewrite and expand the following text to be more structured, engaging, and complete. ${stylePrompt} Use the provided knowledge base for context if available. The output should be the rewritten article itself, without any extra commentary. `;
        
        const maxTokens = parseInt(articleLengthSlider.value, 10);
        await callGeminiAPI(prompt, content, maxTokens, true);
        
        magicWandBtn.disabled = false;
        magicWandBtn.classList.remove('animate-pulse');
    }

    // --- Download Logic ---
    function handleDownload() {
        const content = editor.innerText;
        if (!content.trim()) {
            alert('Editor is empty. Nothing to download.');
            return;
        }

        const filename = 'TabEditor_' + new Date().toLocaleDateString() + '.txt';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // --- API and Model Logic ---
    async function callGeminiAPI(prompt, textToProcess, maxTokens, useStream) {
        const apiKey = apiKeyInput.value;
        const model = geminiModelSelect.value;
        const knowledgeBase = knowledgeBaseTextarea.value;

        if (!apiKey || !model) {
            alert('Please set your API Key and select a model in the settings.');
            return null;
        }

        const modelToUse = model.startsWith('models/') ? model.split('models/')[1] : model;
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:${useStream ? 'streamGenerateContent?alt=sse&' : 'generateContent?'}key=${apiKey}`;

        const fullPrompt = `${knowledgeBase ? `Use the following knowledge base as context:\n${knowledgeBase}\n\n---\n\n` : ''}Task: ${prompt}\n\n---\n\nText to process:\n${textToProcess}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: maxTokens,
                        ...(modelToUse.includes('gemini-2.0') ? { } : {thinkingConfig: { thinkingBudget: 0 }}),
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            if (useStream) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = '';
                let isFirstChunk = true;

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.substring(6);
                            try {
                                const parsed = JSON.parse(jsonStr);
                                if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                                    const textPart = parsed.candidates[0].content.parts[0].text;
                                    if (isFirstChunk && textPart.trim()) {
                                        editor.innerText = '';
                                        isFirstChunk = false;
                                    }
                                    accumulatedText += textPart;
                                    editor.innerText = accumulatedText;
                                }
                            } catch (e) {
                                // Ignore parsing errors
                            }
                        }
                    }
                }
                return trimEllipsis(accumulatedText);
            } else {
                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return trimEllipsis(data.candidates[0].content.parts[0].text.trim());
                } else {
                    const blockReason = data.promptFeedback?.blockReason;
                    if (blockReason) {
                        alert(`Request was blocked due to: ${blockReason}.`);
                    }
                    return null;
                }
            }
        } catch (error) {
            console.error('Gemini API call failed:', error);
            alert(`An error occurred: ${error.message}`);
            if (useStream) {
                editor.innerText = textToProcess;
            }
            return null;
        }
    }

    async function fetchAndPopulateModels() {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            geminiModelSelect.innerHTML = '<option value="">請先輸入 API Key</option>';
            return;
        }

        geminiModelSelect.innerHTML = '<option value="">正在載入模型...</option>';
        geminiModelSelect.disabled = true;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!response.ok) {
                throw new Error(`API 錯誤: ${response.status}`);
            }

            const data = await response.json();
            
            geminiModelSelect.innerHTML = '<option value="">選擇模型...</option>';
            
            const uniqueModels = new Map();
            
            data.models
                .filter(model => model.name.includes('gemini-2.0') || model.name.includes('gemini-2.5'))
                .forEach(model => {
                    const displayName = model.displayName || model.name.split('models/')[1];
                    uniqueModels.set(displayName, model);
                });

            uniqueModels.forEach((model, displayName) => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = displayName;
                geminiModelSelect.appendChild(option);
            });

            const settings = JSON.parse(localStorage.getItem('ghostEditorSettings'));
            if (settings && settings.model) {
                geminiModelSelect.value = settings.model;
            }

        } catch (error) {
            console.error('無法獲取模型:', error);
            geminiModelSelect.innerHTML = `<option value="">無法載入模型</option><option value="">${error.message}</option>`;
        } finally {
            geminiModelSelect.disabled = false;
        }
    }

    // --- Helper Functions ---
    function trimEllipsis(text) {
        let trimmedText = text;
        if (trimmedText.startsWith('…')) {
            trimmedText = trimmedText.substring(1);
        }
        if (trimmedText.endsWith('…')) {
            trimmedText = trimmedText.substring(0, trimmedText.length - 1);
        }
        return trimmedText.trim();
    }

    // --- Start the App ---
    initializeApp();
});
