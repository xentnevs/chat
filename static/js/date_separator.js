// Function to handle date separators for messages
document.addEventListener('DOMContentLoaded', function() {
    // Utility functions for date handling
    function formatDate(date) {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }
    
    function formatDisplayDate(dateString) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);
        
        if (dateString === todayStr) {
            return 'Сегодня';
        } else if (dateString === yesterdayStr) {
            return 'Вчера';
        } else {
            // Format as DD.MM.YYYY
            const parts = dateString.split('-');
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
    }
    
    // Function to check if there's a date separator for a specific date
    function hasDateSeparator(dateStr) {
        return document.querySelector(`.date-separator[data-date="${dateStr}"]`) !== null;
    }
    
    // Function to add a date separator if one doesn't exist for the current date
    window.addDateSeparatorIfNeeded = function(messageElement, messageDate) {
        const chatbox = document.getElementById('chatbox');
        if (!chatbox || !messageElement) return;
        
        // Get today's date in YYYY-MM-DD format
        const now = new Date();
        const today = formatDate(now);
        
        // Format the message date
        const messageDateStr = messageDate || today;
        
        // Check if a separator for this date already exists
        if (!hasDateSeparator(messageDateStr)) {
            // Create new date separator
            const separator = document.createElement('div');
            separator.className = `date-separator${messageDateStr === today ? ' today' : ''}`;
            separator.setAttribute('data-date', messageDateStr);
            
            separator.innerHTML = `
                <hr>
                <span class="date-text">${formatDisplayDate(messageDateStr)}</span>
            `;
            
            // Find where to insert the separator
            let insertBeforeElement = null;
            
            // If we're adding today's date and there are other date separators,
            // we need to insert it at the appropriate position
            const allSeparators = Array.from(document.querySelectorAll('.date-separator'));
            if (allSeparators.length > 0) {
                // Sort all separators by date
                const sortedSeparators = allSeparators.sort((a, b) => {
                    return b.getAttribute('data-date').localeCompare(a.getAttribute('data-date'));
                });
                
                // Find the first separator with a date smaller than our message date
                for (let sep of sortedSeparators) {
                    const sepDate = sep.getAttribute('data-date');
                    if (sepDate < messageDateStr) {
                        insertBeforeElement = sep;
                        break;
                    }
                }
                
                // If no separator has a smaller date, insert before the first message after the last separator
                if (!insertBeforeElement && sortedSeparators.length > 0) {
                    const lastSeparator = sortedSeparators[sortedSeparators.length - 1];
                    const nextElement = lastSeparator.nextElementSibling;
                    if (nextElement) {
                        insertBeforeElement = nextElement;
                    }
                }
            }
            
            // Insert the separator at the correct position
            if (insertBeforeElement) {
                chatbox.insertBefore(separator, insertBeforeElement);
            } else {
                // If we can't find a good position, insert before the message
                chatbox.insertBefore(separator, messageElement);
            }
        }
    };
});
