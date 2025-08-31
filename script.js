import { markdownTable } from 'https://esm.sh/markdown-table@3?bundle';

const input = document.getElementById('input');
const output = document.getElementById('output');
const tablePreview = document.getElementById('table-preview');
const submitBtn = document.getElementById('submit');
const copyBtn = document.getElementById('copy');
const clearBtn = document.getElementById('clear');

// Detect and log special characters for debugging
function detectSpecialCharacters(text) {
    const specialChars = [];
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        
        // Detect common problematic characters
        if (code === 8211) specialChars.push(`En-dash (–) at position ${i}`);
        if (code === 8212) specialChars.push(`Em-dash (—) at position ${i}`);
        if (code === 8216 || code === 8217) specialChars.push(`Smart quote (${char}) at position ${i}`);
        if (code === 8220 || code === 8221) specialChars.push(`Smart quote (${char}) at position ${i}`);
        if (code === 160) specialChars.push(`Non-breaking space at position ${i}`);
        if (code === 8230) specialChars.push(`Ellipsis (…) at position ${i}`);
    }
    
    if (specialChars.length > 0) {
        console.log('Special characters detected:', specialChars);
    }
    
    return specialChars;
}

// Parse input data to array with special character support
function parseInputData(inputText) {
    if (!inputText.trim()) return [];
    
    // Detect special characters for debugging
    detectSpecialCharacters(inputText);
    
    // Normalize special characters that Excel commonly uses
    const normalizedText = inputText
        .replace(/–/g, '-')  // Replace en-dash with regular hyphen
        .replace(/—/g, '-')  // Replace em-dash with regular hyphen
        .replace(/'/g, "'")  // Replace smart quote with regular quote
        .replace(/'/g, "'")  // Replace smart quote with regular quote
        .replace(/"/g, '"')  // Replace smart quote with regular quote
        .replace(/"/g, '"')  // Replace smart quote with regular quote
        .replace(/…/g, '...')  // Replace ellipsis with three dots
        .replace(/\u00A0/g, ' ');  // Replace non-breaking space with regular space
    
    // Split by lines and then by tabs, preserving special characters and emojis
    const lines = normalizedText.split('\n').filter(line => line.trim());
    return lines.map(line => {
        // Split by tab while preserving special characters
        return line.split('\t').map(cell => {
            // Trim whitespace but preserve special characters and emojis
            return cell.trim();
        });
    });
}

// Create HTML table preview
function createTablePreview(data) {
    if (!data || data.length === 0) {
        tablePreview.innerHTML = '';
        return;
    }
    
    // Create table element
    const table = document.createElement('table');
    
    // Create header if we have data
    if (data.length > 0) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        data[0].forEach((cell, index) => {
            const th = document.createElement('th');
            th.textContent = cell || `Column ${index + 1}`;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
    }
    
    // Create body with remaining rows
    if (data.length > 1) {
        const tbody = document.createElement('tbody');
        
        for (let i = 1; i < data.length; i++) {
            const row = document.createElement('tr');
            const maxCols = Math.max(...data.map(r => r.length));
            
            for (let j = 0; j < maxCols; j++) {
                const td = document.createElement('td');
                const cellValue = data[i][j] || '';
                
                // Handle special characters and emojis properly
                td.textContent = cellValue;
                
                // Add special styling for numeric values
                if (!isNaN(cellValue) && cellValue !== '') {
                    td.style.textAlign = 'right';
                }
                
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
    }
    
    // Clear previous content and add new table
    tablePreview.innerHTML = '';
    tablePreview.appendChild(table);
}

// Update preview when input changes
function updatePreview() {
    const inputText = input.value;
    const data = parseInputData(inputText);
    createTablePreview(data);
}

// Convert function with special character support
function convertToMarkdown() {
    const inputText = input.value.trim();
    
    if (!inputText) {
        output.value = 'Please paste some table data first.';
        return;
    }
    
    try {
        const data = parseInputData(inputText);
        
        // Check if we have valid data
        if (data.length === 0 || data[0].length === 0) {
            output.value = 'Please paste valid table data with tabs as separators.';
            return;
        }
        
        // Ensure all rows have the same number of columns
        const maxCols = Math.max(...data.map(row => row.length));
        const normalizedData = data.map(row => {
            const newRow = [...row];
            while (newRow.length < maxCols) {
                newRow.push('');
            }
            return newRow;
        });
        
        // Generate markdown table with proper encoding for special characters
        const table = markdownTable(normalizedData, {
            // Ensure special characters and emojis are preserved
            stringLength: (str) => {
                // Use a more accurate length calculation for Unicode characters
                return [...str].length;
            }
        });
        
        output.value = table;
        
        // Update button text temporarily
        const originalText = submitBtn.querySelector('span').textContent;
        submitBtn.querySelector('span').textContent = 'Converted!';
        setTimeout(() => {
            submitBtn.querySelector('span').textContent = originalText;
        }, 1500);
        
    } catch (error) {
        output.value = 'Error converting table. Please check your data format.';
        console.error('Conversion error:', error);
    }
}

// Copy function
function copyToClipboard() {
    const outputText = output.value.trim();
    
    if (!outputText || outputText === 'Your converted markdown table will appear here...' || outputText.startsWith('Please paste') || outputText.startsWith('Error')) {
        // Show feedback for empty or invalid content
        const originalText = copyBtn.querySelector('span').textContent;
        copyBtn.querySelector('span').textContent = 'Nothing to copy';
        setTimeout(() => {
            copyBtn.querySelector('span').textContent = originalText;
        }, 1500);
        return;
    }
    
    navigator.clipboard.writeText(outputText).then(() => {
        // Show success feedback
        const originalText = copyBtn.querySelector('span').textContent;
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.querySelector('span').textContent = originalText;
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const originalText = copyBtn.querySelector('span').textContent;
        copyBtn.querySelector('span').textContent = 'Copy failed';
        setTimeout(() => {
            copyBtn.querySelector('span').textContent = originalText;
        }, 1500);
    });
}

// Clear function
function clearAll() {
    input.value = '';
    output.value = '';
    tablePreview.innerHTML = '';
    
    // Show feedback
    const originalText = clearBtn.querySelector('span').textContent;
    clearBtn.querySelector('span').textContent = 'Cleared!';
    setTimeout(() => {
        clearBtn.querySelector('span').textContent = originalText;
    }, 1500);
    
    // Focus back to input
    input.focus();
}

// Event listeners
submitBtn.addEventListener('click', convertToMarkdown);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);

// Live preview updates
input.addEventListener('input', updatePreview);
input.addEventListener('paste', () => {
    // Small delay to allow paste content to be processed
    setTimeout(updatePreview, 10);
});

// Auto-convert on Ctrl/Cmd + Enter
input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        convertToMarkdown();
    }
});

// Auto-focus input on page load
window.addEventListener('load', () => {
    input.focus();
});

// Initial preview setup
updatePreview();