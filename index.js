const contentInput = document.getElementById("content-input");
const matchType = document.getElementById("match-type");
const matchTypeRadios = document.querySelectorAll("input[name='match-type']");
const jsResultDisplay = document.getElementById("js-result-display");
const jsInfoDisplay = document.getElementById("js-info-display");
const jsArrayDisplay = document.getElementById("js-array-display");
const aeDefaultArrayDisplay = document.getElementById("ae-default-array-display");
const aeFixedArrayDisplay = document.getElementById("ae-fixed-array-display");
const aeDefaultResultDisplay = document.getElementById(
	"ae-default-result-display"
);

const aeFixedResultDisplay = document.getElementById(
	"ae-fixed-result-display"
);
const aeFixedInfoDisplay = document.getElementById("ae-fixed-info-display");

const presets = {
	"Control (match)": "0 match 0",
	"Control (hashtag)": "0 #hashtag 0",
	"Emoji after match/hashtag": "match #before emoji 😅🙏🏌️‍♂️",
	"Complex emoji after match": "Emoji match #test: 👨‍👩‍👧‍👦🌈🚀",
	"!!-Emoji before match": "😅🙏🏌️‍♂️ match #after emoji string",
	"!!-Complex emoji before match": "👨‍👩‍👧‍👦🌈🚀: Emoji match #test string",
};

// Create preset dropdown
const presetSelect = document.createElement("select");
presetSelect.id = "preset-select";
Object.keys(presets).forEach((key) => {
	const option = document.createElement("option");
	option.value = presets[key];
	option.textContent = key;
	presetSelect.appendChild(option);
});
const customOption = document.createElement("option");
customOption.value = "custom";
customOption.textContent = "Custom...";
presetSelect.appendChild(customOption);

// Insert preset dropdown before content input
contentInput.parentNode.insertBefore(presetSelect, contentInput);

presetSelect.addEventListener("change", (e) => {
	if (e.target.value === "custom") {
		contentInput.style.display = "inline-block";
		contentInput.value = "";
		contentInput.focus();
	} else {
		contentInput.style.display = "none";
		contentInput.value = e.target.value;
	}
	applyMatch();
});

contentInput.addEventListener("input", applyMatch);

function getUTF8Bytes(char) {
    try {
        return encodeURIComponent(char).replace(/%/g, '');
    } catch (e) {
        console.error('Error encoding character:', char, e);
        return '';
    }
}

function getCharComponents(str) {
	const result = [];
	let currentEmoji = '';

	for (let i = 0; i < str.length; i++) {
		const code = str.codePointAt(i);
		if (code > 0xFFFF) {
			currentEmoji += str[i] + str[i + 1];
			result.push({ char: str[i], type: 'high-surrogate', emoji: currentEmoji });
			result.push({ char: str[i + 1], type: 'low-surrogate', emoji: currentEmoji });
			i++; // Skip the next code unit as it's part of the same character
		} else if (code === 0xFE0F || code === 0x200D) {
			// Variation Selector-16 or Zero Width Joiner
			currentEmoji += str[i];
			result.push({ char: str[i], type: 'modifier', emoji: currentEmoji });
		} else if (code >= 0x1F1E6 && code <= 0x1F1FF) {
			// Regional Indicator
			currentEmoji += str[i];
			result.push({ char: str[i], type: 'regional-indicator', emoji: currentEmoji });
		} else {
			if (currentEmoji) {
				// End of the current emoji sequence
				result.forEach(component => {
					if (component.emoji === currentEmoji) {
						component.fullEmoji = currentEmoji;
					}
				});
				currentEmoji = '';
			}
			result.push({ char: str[i], type: 'standard' });
		}
	}

	// Handle the last emoji if the string ends with one
	if (currentEmoji) {
		result.forEach(component => {
			if (component.emoji === currentEmoji) {
				component.fullEmoji = currentEmoji;
			}
		});
	}

	return result;
}

function getCharInfo(component) {
	const { char, type, fullEmoji } = component;
	const codePoint = char.codePointAt(0);
	let name = '';
	let symbol = char;
	let miniEmoji = fullEmoji || '';

	switch (type) {
		case 'high-surrogate':
			name = 'High Surrogate';
			symbol = '🔺';
			break;
		case 'low-surrogate':
			name = 'Low Surrogate';
			symbol = '🔻';
			break;
		case 'modifier':
			name = codePoint === 0xFE0F ? 'Variation Selector-16' : 'Zero Width Joiner';
			symbol = codePoint === 0xFE0F ? '🔧' : '🔗';
			break;
		case 'regional-indicator':
			name = `Regional Indicator ${String.fromCodePoint(codePoint - 0x1F1E6 + 65)}`;
			symbol = '🏳️';
			break;
		default:
			symbol = char === ' ' ? '␣' : char;
	}

	return { codePoint, name, symbol, miniEmoji };
}

function simplifyEmojis(text) {
	return text.replace(
		/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:(?:\u200D|\uFE0F)(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)|[\u{1F3FB}-\u{1F3FF}])*/gu,
		"□"
	);
}

function highlightMatches(text, regex, matchType) {
    const simplifiedText = simplifyEmojis(text);
    
	let jsResult, jsInfo, jsStrArray, aeDefaultResult, aeDefaultInfo, aeDefaultStrArray, aeFixedResult, aeFixedInfo, aeFixedStrArray;

	// JS
    const jsMatches = [];
	let match;
	let count = 1;
	while ((match = regex.exec(text)) !== null) {
			jsMatches.push({
				count: count,
				text: match[0],
				start: match.index,
				end: regex.lastIndex,
			});
		count++;
	}
	/*while ((match = text,match(/\u0020/g)) !== null) {
		jsSpaces.push({
			count: count,
			text: match[0],
			start: match.index,
			end: match.index + match[0].length,
		})
		count++;
	}*/
	
	// Create an array to store styles for each character
    const charStyles = new Array(text.length).fill('');
	
    // Apply styles based on matches
    jsMatches.forEach(match => {
		for (let i = match.start; i < match.end; i++) {
			charStyles[i] = 'match-highlight';
        }
    });
	/*jsSpaces.forEach(match => {	
		for (let i = match.start; i < match.end; i++) {
			if (charStyles[i] === '') {
			charStyles[i] = 'invisible-char';
			}
		}
	});*/
	
	jsResult = '';
	let lastIndex = 0;
	jsMatches.forEach((match) => {
		jsResult += text.slice(lastIndex, match.start);
		jsResult += `<span class="highlight">${match.text}</span>`;
		lastIndex = match.end;
	});
	jsResult += text.slice(lastIndex);
	jsInfo = '';
	jsInfo += jsMatches.map(match => `${match.count}: <b>"${match.text}"</b> - Start: ${match.start}, End: ${match.end}<br>`).join("<br>");

    // Generate character array display
	let currentIndex = 0;
	jsStrArray = getCharComponents(text).map((component, arrayIndex) => {
		const utf8Bytes = getUTF8Bytes(component.char);
		const { codePoint, name, symbol, miniEmoji } = getCharInfo(component);

		const displayChar = name ? symbol : (component.char === ' ' ? '␣' : component.char);
		const tooltip = name ? `title="${name}"` : '';

		let charContent = `<div class="char">${displayChar}</div>`;
		if (miniEmoji) {
			charContent = `
            <div class="char-wrapper">
                <div class="mini-emoji">${miniEmoji}</div>
                <div class="char">${displayChar}</div>
            </div>
        `;
		}

		const charContainer = `
        <div class="char-container ${component.type} ${charStyles[currentIndex]}" ${tooltip}>
            ${charContent}
            <div class="char-uri">${utf8Bytes}</div>
            <div class="char-index">${currentIndex}</div>
        </div>
    `;

		currentIndex++;
		return charContainer;
	}).join('');


	// AE Default
	const aeDefaultMatches = [];
	while ((match = regex.exec(simplifiedText)) !== null) {
		aeDefaultMatches.push({
			text: match[0],
			start: match.index,
			end: regex.lastIndex,
		});
	}

	aeDefaultResult = "";
	lastIndex = 0;
	jsMatches.forEach((match) => {
		aeDefaultResult += simplifiedText.slice(lastIndex, match.start);
		aeDefaultResult += `<span class="highlight">${simplifiedText.slice(
			match.start,
			match.end
		)}
	</span>`;
		lastIndex = match.end;
	});
	aeDefaultResult += simplifiedText.slice(lastIndex);
	
	currentIndex = 0;
	aeDefaultStrArray = getCharComponents(simplifiedText).map((component, arrayIndex) => {
		const utf8Bytes = getUTF8Bytes(component.char);
		const { codePoint, name, symbol, miniEmoji } = getCharInfo(component);
		//const displayChar = name ? `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}` : (component === ' ' ? '␣' : component);
		const displayChar = name ? `␣␣` : (component.char === ' ' ? '␣' : component.char);
		const tooltip = name ? `title="${name}"` : '';

		const charContainer = `
            <div class="char-container ${charStyles[currentIndex]}" ${tooltip}>
                <div class="char">${displayChar}</div>
                <div class="char-uri">${utf8Bytes}</div>
                <div class="char-index">${currentIndex}</div>
            </div>
        `;
		if (component.length === 2) currentIndex++; // Increment twice for surrogate pairs
		currentIndex++;
		return charContainer;
	}).join('');

	// AE Fixed
	const aeFixedMatches = [];
	count = 1;
	let fixedRegex = regex;
	if (matchType === "emoji") {
		fixedRegex = /□/g;
		while ((match = fixedRegex.exec(simplifiedText)) !== null) {
			aeFixedMatches.push({
				count: count,
				text: match[0],
				start: match.index,
				end: fixedRegex.lastIndex,
			});
        count++;
		}
	}
	
	while ((match = regex.exec(simplifiedText)) !== null) {
		aeFixedMatches.push({
			count: count,
			text: match[0],
			start: match.index,
			end: regex.lastIndex,
		});
		count++;
    }
	aeFixedResult = '';
	lastIndex = 0;
	aeFixedMatches.forEach((match) => {
		aeFixedResult += simplifiedText.slice(lastIndex, match.start);
		aeFixedResult += `<span class="highlight">${match.text}</span>`;
		lastIndex = match.end;
	});
	aeFixedResult += simplifiedText.slice(lastIndex);
	aeFixedInfo = '';
	aeFixedInfo += aeFixedMatches.map(match => `${match.count}: <b>"${match.text}"</b> - Start: ${match.start}, End: ${match.end}`)
    .join("<br>");
	
	const fixedCharStyles = new Array(simplifiedText.length).fill('');

	// Apply styles based on matches
	aeFixedMatches.forEach(match => {
		for (let i = match.start; i < match.end; i++) {
			fixedCharStyles[i] = 'match-highlight';
		}
	});
	currentIndex = 0;

	aeFixedStrArray = getCharComponents(simplifiedText).map((component, arrayIndex) => {
		const utf8Bytes = getUTF8Bytes(component.char);
		const { codePoint, name, symbol, miniEmoji } = getCharInfo(component);
		const displayChar = name ? `␣␣` : (component.char === ' ' ? '␣' : component.char);
		const tooltip = name ? `title="${name}"` : '';

		const charContainer = `
            <div class="char-container ${fixedCharStyles[currentIndex]}" ${tooltip}>
                <div class="char">${displayChar}</div>
                <div class="char-uri">${utf8Bytes}</div>
                <div class="char-index">${currentIndex}</div>
            </div>
        `;
		if (component.length === 2) currentIndex++; // Increment twice for surrogate pairs
		currentIndex++;
		return charContainer;
	}).join('');

    return {
        js: { result: jsResult, info: jsInfo, array: jsStrArray },
        aeDefault: { result: aeDefaultResult, info: aeDefaultInfo, array: aeDefaultStrArray },
        aeFixed: { result: aeFixedResult, info: aeFixedInfo, array: aeFixedStrArray },
    };
}

function applyMatch() {
	const content = contentInput.value;
	const matchType = document.querySelector('input[name="match-type"]:checked').value;
	const activeString = document.getElementById("active-string");
	activeString.innerHTML = content;

	let regex;

	switch (matchType) {
		case "word":
			regex = /\bmatch\b/g;
			break;
		case "hashtag":
			regex = /#\w+/g;
			break;
		case "emoji":
			regex =
				/(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:(?:\u200D|\uFE0F)(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)|[\u{1F3FB}-\u{1F3FF}])*/gu;
			break;
		default:
			regex = /\bmatch\b/g;
	}

	const results = highlightMatches(content, regex, matchType);
	jsResultDisplay.innerHTML = results.js.result;
	aeDefaultResultDisplay.innerHTML = results.aeDefault.result;
	aeFixedResultDisplay.innerHTML = results.aeFixed.result;

	jsInfoDisplay.innerHTML = results.js.info;
	jsArrayDisplay.innerHTML = results.js.array;
	aeDefaultArrayDisplay.innerHTML = results.aeDefault.array;
	aeFixedInfoDisplay.innerHTML = results.aeFixed.info;
	aeFixedArrayDisplay.innerHTML = results.aeFixed.array;
}

// Initialize with the first preset
contentInput.value = presets[Object.keys(presets)[0]];
matchTypeRadios.forEach((radio) => {
	radio.addEventListener("change", applyMatch);
});
applyMatch();

