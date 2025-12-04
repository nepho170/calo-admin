/**
 * Date Utilities for Consistent Timezone Handling
 * All date functions use local timezone to match UI display
 */

/**
 * UAE timezone constant
 */
export const UAE_TIMEZONE = 'Asia/Dubai';

/**
 * Get current date and time in UAE timezone
 * @returns {Date} Date object adjusted to UAE timezone
 */
export const getUAEDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: UAE_TIMEZONE }));
};

/**
 * Convert any date to UAE timezone
 * @param {Date} date - Date object to convert
 * @returns {Date} Date object adjusted to UAE timezone
 */
export const toUAEDate = (date) => {
    return new Date(date.toLocaleString('en-US', { timeZone: UAE_TIMEZONE }));
};

/**
 * Format date to YYYY-MM-DD string using UAE timezone
 * @param {Date} date - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateToUAE = (date) => {
    const uaeDate = toUAEDate(date);
    const year = uaeDate.getFullYear();
    const month = String(uaeDate.getMonth() + 1).padStart(2, '0');
    const day = String(uaeDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format (UAE timezone)
 * @returns {string} Today's date string in UAE timezone
 */
export const getTodayUAEDate = () => {
    return formatDateToUAE(new Date());
};

/**
 * Format date to YYYY-MM-DD string using local timezone
 * @param {Date} date - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateToLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns {string} Today's date string
 */
export const getTodayLocalDate = () => {
    return formatDateToLocal(new Date());
};

/**
 * Get tomorrow's date in YYYY-MM-DD format (local timezone)
 * @returns {string} Tomorrow's date string
 */
export const getTomorrowLocalDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToLocal(tomorrow);
};

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone)
 * @returns {string} Yesterday's date string
 */
export const getYesterdayLocalDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateToLocal(yesterday);
};

/**
 * Get day name for a date (local timezone)
 * @param {Date} date - Date object
 * @returns {string} Day name (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
 */
export const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};

/**
 * Get today's day name (local timezone)
 * @returns {string} Today's day name
 */
export const getTodayDayName = () => {
    return getDayName(new Date());
};

/**
 * Get tomorrow's day name (local timezone)
 * @returns {string} Tomorrow's day name
 */
export const getTomorrowDayName = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getDayName(tomorrow);
};

/**
 * Get both today and tomorrow dates for operational use
 * @returns {Object} Object with today and tomorrow date strings
 */
export const getTodayTomorrowLocalDates = () => {
    return {
        today: getTodayLocalDate(),
        tomorrow: getTomorrowLocalDate()
    };
};

/**
 * Parse date string and check if it matches today (local timezone)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date matches today
 */
export const isToday = (dateString) => {
    return dateString === getTodayLocalDate();
};

/**
 * Parse date string and check if it matches tomorrow (local timezone)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date matches tomorrow
 */
export const isTomorrow = (dateString) => {
    return dateString === getTomorrowLocalDate();
};

/**
 * Get formatted display date for UI (local timezone)
 * @param {Date} date - Date object (defaults to today)
 * @returns {string} Formatted date string like "Friday, July 25, 2025"
 */
export const getDisplayDate = (date = new Date()) => {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

/**
 * Get current date and time info for debugging
 * @returns {Object} Object with various date representations
 */
export const getDateDebugInfo = () => {
    const now = new Date();
    const uaeDate = getUAEDate();
    return {
        iso: now.toISOString(),
        local: formatDateToLocal(now),
        uae: formatDateToUAE(now),
        display: getDisplayDate(now),
        dayName: getDayName(now),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
        uaeTime: uaeDate.toISOString()
    };
};
