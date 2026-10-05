const charVal = document.getElementById('editableEditor');
const checkButton = document.getElementById('checkButton');
const copyButton = document.getElementById('copyButton');
const clearButton = document.getElementById('clearButton'); 
let totalCounter = document.getElementById('total-counter');
const remainingCounter = document.getElementById('remaining-counter');
const MAX_CHARS = 1500;

const tooltip = document.createElement('div');
tooltip.className = 'grammar-tooltip';
document.body.appendChild(tooltip);
let activeSpan = null;

charVal.addEventListener('input', () => {
    const textLength = charVal.innerText.length;
    totalCounter.innerText = textLength;
    remainingCounter.innerText = MAX_CHARS - textLength;
});

clearButton.addEventListener('click', () => {
    charVal.innerText = '';
    totalCounter.innerText = 0;
    remainingCounter.innerText = MAX_CHARS;
    checkButton.innerText = 'Check Text';
    tooltip.classList.remove('show');
});

copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(charVal.innerText).then(() => {
        const originalText = copyButton.innerText;
        copyButton.innerText = 'Copied!';
        setTimeout(() => copyButton.innerText = originalText, 2000);
    });
});

checkButton.addEventListener('click', function () {
    if (this.innerText === "Check Text") {
        this.innerText = "Checking..."; 
        this.disabled = true; 
        checkGrammar(this);
    }
});

function checkGrammar(btnElement) {
    const textToCheck = charVal.innerText; 
    
    if (!textToCheck.trim()) {
        btnElement.innerText = "Check Text";
        btnElement.disabled = false;
        return;
    }

    const API_KEY = 'AQ.Ab8RN6K-dmxQtnBUTpUfzOmPPB7YY3-KQ220BI93E_Xvpp8Ung'; 
    // FIXED: Using standard string concatenation to prevent backtick/quote interpolation errors
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + API_KEY;

    const promptText = `Analyze this text for grammar, punctuation, and spelling errors. 
    Output ONLY a JSON object containing a 'matches' array. 
    Each item in the array must have:
    - "badPhrase": the exact incorrect word or phrase from the original text
    - "replacements": an array of up to 3 corrected strings
    - "message": a short explanation of why it is wrong
    If there are no errors, return {"matches": []}.
    Text to analyze: "${textToCheck}"`;

    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            responseMimeType: "application/json" 
        }
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const jsonString = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(jsonString);

        if (result.matches && result.matches.length > 0) {
            let highlightedText = textToCheck;
            
            result.matches.forEach(match => {
                const replacementsStr = match.replacements.join('|');
                const span = `<span class="correctionRequired" data-corrections="${replacementsStr}" data-message="${match.message}">${match.badPhrase}</span>`;
                highlightedText = highlightedText.replace(match.badPhrase, span);
            });
            
            charVal.innerHTML = highlightedText;
        } else {
            alert("No error in your sentence. Hurray!!");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Something went wrong with the AI API: ${error.message}`);
    })
    .finally(() => {
        btnElement.innerText = "Check Text";
        btnElement.disabled = false;
    });
}

charVal.addEventListener('click', function(e) {
    if (e.target.classList.contains('correctionRequired')) {
        activeSpan = e.target;
        
        const correctionsList = activeSpan.getAttribute('data-corrections').split('|');
        const message = activeSpan.getAttribute('data-message');
        
        let suggestionsHTML = '';
        if (correctionsList[0] !== "") {
            correctionsList.forEach(correction => {
                suggestionsHTML += `<span class="suggestion-text" style="display:inline-block; padding:4px 8px; margin:0 4px 4px 0; background:#3b82f6; color:white; border-radius:4px; font-weight:bold; cursor:pointer;">${correction}</span>`;
            });
        } else {
            suggestionsHTML = '<span style="color: #6b7280; font-style: italic;">No suggestions</span>';
        }
        
        tooltip.innerHTML = `
            <div class="tooltip-correction" style="margin-bottom: 8px;">${suggestionsHTML}</div>
            <div class="tooltip-message">${message}</div>
        `;
        
        const rect = activeSpan.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
        tooltip.classList.add('show');
    }
});

tooltip.addEventListener('click', function(e) {
    if (activeSpan && e.target.classList.contains('suggestion-text')) {
        activeSpan.outerHTML = e.target.innerText;
        tooltip.classList.remove('show');
        
        const event = new Event('input');
        charVal.dispatchEvent(event);
    }
});

document.addEventListener('click', function(e) {
    if (!tooltip.contains(e.target) && !e.target.classList.contains('correctionRequired')) {
        tooltip.classList.remove('show');
    }
});