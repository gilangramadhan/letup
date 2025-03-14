/**************************************************
 * 0. Configuration options - Default settings
 **************************************************/
const LETUP_CONFIG = {
    enableRealtimeNotifications: true,  // Set to false to disable real-time notifications
    enableRotatorNotifications: true,   // Set to false to disable rotator notifications
    maxToasts: 3,                       // Maximum number of toasts to show at once
    rotatorInterval: 5000,              // Time between rotator notifications (milliseconds)
    autoHideDelay: 5000,                // Time before auto-hiding toasts (milliseconds)
    scrollTriggerPoint: 200,            // Scroll distance to trigger loading (pixels - fixed)
    supabaseUrl: 'https://tsaaphhxqbsknszartza.supabase.co', // Default Supabase URL
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYWFwaGh4cWJza25zemFydHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MjEyNzAsImV4cCI6MjA1Njk5NzI3MH0.yQZgidrNuzheZ8oKgpWkl4n0Ha9WoJNbnIuu8IuhLaU', // Default Supabase anon key
    tableName: 'notifications',         // Default table name
    showDismissButton: false            // Show close button on toasts (default: false)
};

/**************************************************
 * Add built-in CSS styles
 **************************************************/
function addStyles() {
    if (document.getElementById('letup-toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'letup-toast-styles';
    style.textContent = `
        /* Toast container */
        #toast-container {
            max-width: 432px;
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
        }
        
        /* Each toast bubble (default: hidden/off-screen) */
        .toast {
            display: flex;
            align-items: center;
            background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(9,175,237,0.08) 100%);
            background-color: #fff;
            border-radius: 24px;
            margin-bottom: 12px;
            padding: 8px 4px;
            box-shadow: 0 0 0 1px #0e3f7e0f, 0 1px 1px -0.5px #2a334608,
                0 2px 2px -1px #2a33460a, 0 3px 3px -1.5px #2a33460a,
                0 5px 5px -2.5px #2a334608, 0 10px 10px -5px #2a334608,
                0 24px 24px -8px #2a334608, rgb(23 43 99 / 3%) 0 0 28px;
            min-width: 300px;
            max-width: 90vw;
            font-family: sans-serif;
            color: rgba(14, 21, 25, 0.8);
            transition: all 0.3s ease;
        }
        
        .payment-toast {
            padding: 8px 8px;
            background: linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(58, 201, 104, 0.08) 100%);
            background-color: #fff;
        }
        
        /* Slide down (show) */
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Slide up (hide) */
        .toast.hide {
            opacity: 0;
            transform: translateY(-20px);
        }
        
        /* Rounded logo on the left */
        .toast-logo {
            width: 64px;
            height: 64px;
            object-fit: cover;
            margin-right: 14px;
            background: #eee;
            flex-shrink: 0;
        }
        
        /* Text container inside the toast */
        .toast-content {
            flex: 1;
            max-width: 300px;
            line-height: 1.4;
            margin-right: 15px;
        }
        
        /* Main heading text: smaller but readable */
        .toast-heading {
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        /* Subtext right-aligned */
        .toast-subtext span {
            color: #5b6e74;
            font-size: 12px;
        }
        .toast-subtext {
            display: flex;
            width: 320px;
            justify-content: flex-start;
            align-items: flex-end;
        }
        .toast-left {
            order: -1;
        }
        .toast-right {
            display: flex;
            margin-left: auto;
            padding-right: 20px;
        }
        
        /* Close button on the right */
        .toast-close {
            position: relative;
            top: -20px;
            left: 11px;
            margin-left: 8px;
            cursor: pointer;
            background: none;
            border: none;
            font-size: 14px;
            color: #b4b4b4;
            flex-shrink: 0;
            align-self: flex-start;
        }
        .toast-close:hover {
            color: #000;
        }
    `;
    document.head.appendChild(style);
}

// Add CSS to the document immediately
addStyles();

/**************************************************
 * Parse data attributes from script tag
 **************************************************/
(function loadConfigFromDataAttributes() {
    // Try to find the current script
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1]; // Usually the last script is the current one
    
    // Check for script data attributes
    if (currentScript) {
        // Parse boolean attributes
        if (currentScript.hasAttribute('data-enable-realtime')) {
            LETUP_CONFIG.enableRealtimeNotifications = 
                currentScript.getAttribute('data-enable-realtime') === 'true';
        }
        
        if (currentScript.hasAttribute('data-enable-rotator')) {
            LETUP_CONFIG.enableRotatorNotifications = 
                currentScript.getAttribute('data-enable-rotator') === 'true';
        }
        
        if (currentScript.hasAttribute('data-dismiss')) {
            LETUP_CONFIG.showDismissButton = 
                currentScript.getAttribute('data-dismiss') === 'true';
        }
        
        // Parse numeric attributes
        if (currentScript.hasAttribute('data-max-toasts')) {
            const value = parseInt(currentScript.getAttribute('data-max-toasts'));
            if (!isNaN(value)) LETUP_CONFIG.maxToasts = value;
        }
        
        if (currentScript.hasAttribute('data-rotator-interval')) {
            const value = parseInt(currentScript.getAttribute('data-rotator-interval'));
            if (!isNaN(value)) LETUP_CONFIG.rotatorInterval = value;
        }
        
        if (currentScript.hasAttribute('data-auto-hide-delay')) {
            const value = parseInt(currentScript.getAttribute('data-auto-hide-delay'));
            if (!isNaN(value)) LETUP_CONFIG.autoHideDelay = value;
        }
        
        // Parse Supabase credentials
        if (currentScript.hasAttribute('data-supabase-url')) {
            LETUP_CONFIG.supabaseUrl = currentScript.getAttribute('data-supabase-url');
        }
        
        if (currentScript.hasAttribute('data-supabase-key')) {
            LETUP_CONFIG.supabaseKey = currentScript.getAttribute('data-supabase-key');
        }
        
        // Parse table name
        if (currentScript.hasAttribute('data-table-name')) {
            LETUP_CONFIG.tableName = currentScript.getAttribute('data-table-name');
        }
        
        console.log("Notifications: Configured from data attributes", LETUP_CONFIG);
    }
})();

/**************************************************
 * Also look for a container with data attributes
 **************************************************/
(function loadConfigFromContainer() {
    const container = document.getElementById('toast-container');
    if (!container) return; // Container not found
    
    // Parse boolean attributes
    if (container.hasAttribute('data-enable-realtime')) {
        LETUP_CONFIG.enableRealtimeNotifications = 
            container.getAttribute('data-enable-realtime') === 'true';
    }
    
    if (container.hasAttribute('data-enable-rotator')) {
        LETUP_CONFIG.enableRotatorNotifications = 
            container.getAttribute('data-enable-rotator') === 'true';
    }
    
    if (container.hasAttribute('data-dismiss')) {
        LETUP_CONFIG.showDismissButton = 
            container.getAttribute('data-dismiss') === 'true';
    }
    
    // Parse numeric attributes
    if (container.hasAttribute('data-max-toasts')) {
        const value = parseInt(container.getAttribute('data-max-toasts'));
        if (!isNaN(value)) LETUP_CONFIG.maxToasts = value;
    }
    
    if (container.hasAttribute('data-rotator-interval')) {
        const value = parseInt(container.getAttribute('data-rotator-interval'));
        if (!isNaN(value)) LETUP_CONFIG.rotatorInterval = value;
    }
    
    if (container.hasAttribute('data-auto-hide-delay')) {
        const value = parseInt(container.getAttribute('data-auto-hide-delay'));
        if (!isNaN(value)) LETUP_CONFIG.autoHideDelay = value;
    }
    
    // Parse Supabase credentials
    if (container.hasAttribute('data-supabase-url')) {
        LETUP_CONFIG.supabaseUrl = container.getAttribute('data-supabase-url');
    }
    
    if (container.hasAttribute('data-supabase-key')) {
        LETUP_CONFIG.supabaseKey = container.getAttribute('data-supabase-key');
    }
    
    // Parse table name
    if (container.hasAttribute('data-table-name')) {
        LETUP_CONFIG.tableName = container.getAttribute('data-table-name');
    }
    
    console.log("Notifications: Configured from container attributes", LETUP_CONFIG);
})();

/**************************************************
 Load Lottie Player Component and Setup Supabase
 **************************************************/
let supabaseLoaded = false;
let scrollHandler;
let supabase;            // Will hold our Supabase client
let realtimeSubscription;
let rotatorData = [];
let isRotatorRunning = false;
let rotatorTimeout = null;

// First, load the Lottie Player script
function loadLottiePlayer() {
    if (document.querySelector('script[src*="dotlottie-player"]')) {
        return; // Script already exists
    }
    
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@dotlottie/player-component/dist/dotlottie-player.min.js";
    document.head.appendChild(script);
}

// Load Lottie Player immediately
loadLottiePlayer();

function lazyLoadSupabase() {
    if (supabaseLoaded) return; // Already loaded? do nothing
    supabaseLoaded = true;

    // Remove scroll listener
    window.removeEventListener("scroll", scrollHandler);

    // Dynamically load Supabase script (UMD version)
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    script.onload = () => {
        // Now Supabase is loaded, we can initialize
        initSupabase();
    };
    document.head.appendChild(script);
}

// 1) Scroll-based load
scrollHandler = () => {
    if (window.scrollY > 200) {
        lazyLoadSupabase();
    }
};
window.addEventListener("scroll", scrollHandler);

// 2) Time-based load (1 second)
setTimeout(lazyLoadSupabase, 1000);

/************************************************
 * 1. initSupabase() - Called once Supabase is loaded
 ************************************************/
function initSupabase() {
    // 1) Access the UMD global
    const { createClient } = window.supabase;
    
    // 2) Use Supabase credentials from configuration
    const SUPABASE_URL = LETUP_CONFIG.supabaseUrl;
    const SUPABASE_ANON_KEY = LETUP_CONFIG.supabaseKey;

    // 3) Create the client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log("Supabase initialized. Configuration:", {
        enableRealtime: LETUP_CONFIG.enableRealtimeNotifications,
        enableRotator: LETUP_CONFIG.enableRotatorNotifications,
        tableName: LETUP_CONFIG.tableName
    });

    // Then initialize the features based on configuration
    if (LETUP_CONFIG.enableRealtimeNotifications) {
        initRealtimeNotifications();
    }
    
    if (LETUP_CONFIG.enableRotatorNotifications) {
        initRotatorNotifications();
    }
}

/************************************************
* 2. Realtime Notifications System
************************************************/
function initRealtimeNotifications() {
    console.log(`Initializing realtime notifications with table: ${LETUP_CONFIG.tableName}`);
    
    // Subscribe to realtime notifications
    realtimeSubscription = supabase
        .channel('notifications-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: LETUP_CONFIG.tableName, // Use configurable table name
                filter: 'displayed=eq.false'
            },
            (payload) => {
                handleRealtimeNotification(payload.new);
            }
        )
        .subscribe();
}

function handleRealtimeNotification(notification) {
    const buyer = notification.buyer_name || "Seseorang";
    const product = notification.product_name || "produk ini";
    const createdAt = notification.created_at;
    const lastUpdatedAt = notification.last_updated_at || notification.created_at; // Fallback to created_at if not available

    // Update the displayed flag to prevent showing this notification again
    updateNotificationDisplayed(notification.id);

    // Determine notification type based on event_type and payment_status
    const isPaymentConfirmation =
        notification.event_type === 'order.updated' &&
        notification.payment_status === 'paid';

    if (isPaymentConfirmation) {
        // Payment confirmation notification - now passing the lastUpdatedAt
        showPaymentConfirmationToast(buyer, product, createdAt, lastUpdatedAt);
    } else {
        // Standard order notification - pass the createdAt timestamp for the day
        const hhmm = createdAt ? formatHoursMinutes(createdAt) : "";
        showToast(buyer, product, hhmm, createdAt);
    }
}

// Add this missing function
async function updateNotificationDisplayed(id) {
    try {
        await supabase
            .from(LETUP_CONFIG.tableName) // Use configurable table name
            .update({ 
                displayed: true,
                last_updated_at: new Date().toISOString()
            })
            .eq('id', id);
    } catch (error) {
        console.error("Error updating notification:", error);
    }
}

/************************************************
 * 3. Rotator Notifications System
 ************************************************/
function initRotatorNotifications() {
    // Immediately fetch initial data
    fetchRotatorData().then(() => {
        // Start if we have data and not running yet
        if (!isRotatorRunning && rotatorData.length > 0) {
            isRotatorRunning = true;
            showNextRotatorNotification();
        }
    });

    // Refresh data periodically (e.g., every 5 min)
    setInterval(fetchRotatorData, 5 * 60 * 1000);
}

async function fetchRotatorData() {
    try {
        // Example: fetch old notifications from table
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from(LETUP_CONFIG.tableName) // Use the configurable table name
            .select('*')
            .eq('event_type', 'order.updated')
            .eq('payment_status', 'paid')
            .gte('created_at', sevenDaysAgo.toISOString())
            .limit(10);

        if (error) {
            console.error("Error fetching rotator data:", error);
            return;
        }
        
        rotatorData = data || [];

        // Randomize order if desired
        rotatorData.sort(() => Math.random() - 0.5);

        console.log(`Fetched ${rotatorData.length} entries for rotator notifications`);

        // If we got new data & rotator not running, start it
        if (!isRotatorRunning && rotatorData.length > 0) {
            isRotatorRunning = true;
            showNextRotatorNotification();
        }
    } catch (err) {
        console.error('Error fetching rotator data:', err);
    }
}

async function updateNotificationDisplayed(id) {
    try {
        await supabase
            .from(LETUP_CONFIG.tableName) // Use the configurable table name
            .update({ 
                displayed: true,
                last_updated_at: new Date().toISOString()
            })
            .eq('id', id);
    } catch (error) {
        console.error("Error updating notification:", error);
    }
}

// FIX THIS FUNCTION - Update to use configuration values
function showNextRotatorNotification() {
    if (rotatorData.length === 0) {
        isRotatorRunning = false;
        return;
    }

    // Take the first item, push it to the end (to rotate through them)
    const item = rotatorData.shift();
    rotatorData.push(item);

    // Get values from the data item
    const buyer = item.buyer_name || 'Seseorang';
    const productName = item.product_name || 'produk ini';
    const createdAt = item.created_at;
    const lastUpdatedAt = item.last_updated_at || item.created_at; // Fallback to created_at

    // Display the notification and get reference to the element
    const toastEl = showPaymentConfirmationToast(buyer, productName, createdAt, lastUpdatedAt);

    // First timeout: Hide the toast after displaying it for configured delay
    setTimeout(() => {
        hideToast(toastEl);

        // Second timeout: Wait for configured interval before showing next notification
        rotatorTimeout = setTimeout(showNextRotatorNotification, LETUP_CONFIG.rotatorInterval);
    }, LETUP_CONFIG.autoHideDelay);
}

/************************************************
 * 4. formatHoursMinutes(): extracts hh:mm (24h)
 ************************************************/
function formatHoursMinutes(dateString) {
    const d = new Date(dateString);
    let hours = d.getHours();
    let minutes = d.getMinutes();

    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;

    // Format as hh:mm (24-hour)
    return `${hours}:${minutes}`; // e.g. "09:07"
}

/************************************************
 * 5. formatRelativeTime(): human readable time
 ************************************************/
function formatRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return "Baru saja";
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} menit lalu`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} jam lalu`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} hari lalu`;
    }
}

/************************************************
 * New Function: formatIndonesianDay(): gets day name in Indonesian
 ************************************************/
function formatIndonesianDay(dateString) {
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    
    // Array of Indonesian day names
    const indonesianDays = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
    ];
    
    return indonesianDays[dayIndex];
}

/************************************************
 * 6. showToast() - Creates & displays a new toast
 ************************************************/
function showToast(buyer, product, hhmm, timestamp) {
    // Limit to max toast elements based on config
    const container = document.getElementById("toast-container");
    if (container.children.length >= LETUP_CONFIG.maxToasts) {
        // Remove the oldest toast
        container.removeChild(container.firstElementChild);
    }

    // Main toast element
    const toastEl = document.createElement("div");
    toastEl.className = "toast";

    // Lottie Player
    const lottieEl = document.createElement("dotlottie-player");
    lottieEl.setAttribute("src", "https://lottie.host/ed05c047-00d3-4505-ba24-edc225e0f9b9/eLlGabWFgq.lottie");
    lottieEl.setAttribute("background", "transparent");
    lottieEl.setAttribute("speed", "1");
    lottieEl.setAttribute("direction", "1");
    lottieEl.setAttribute("playMode", "normal");
    lottieEl.setAttribute("autoplay", "");
    lottieEl.style.width = "64px";
    lottieEl.style.height = "64px";
    lottieEl.style.marginRight = "4px";
    lottieEl.style.flexShrink = "0";
    toastEl.appendChild(lottieEl);

    // Content wrapper
    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    // Heading
    const headingEl = document.createElement("div");
    headingEl.className = "toast-heading";
    headingEl.innerHTML = `${buyer} telah checkout <strong>${product}</strong>!`;
    contentEl.appendChild(headingEl);

    // Subtext with inline image (hh:mm)
    if (hhmm) {
        // Get the Indonesian day name
        const dayName = formatIndonesianDay(timestamp);
        const subtextEl = document.createElement("div");
        subtextEl.className = "toast-subtext";
        subtextEl.innerHTML = `
    <div class="toast-left"><span>Baru saja</span></div><div class="toast-right"><span>${dayName}, ${hhmm}</span> 
    </div>
  `;
        contentEl.appendChild(subtextEl);
    }

    toastEl.appendChild(contentEl);

    // Close button - only add if showDismissButton is true
    if (LETUP_CONFIG.showDismissButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "toast-close";
        closeBtn.innerText = "x";
        closeBtn.addEventListener("click", () => {
            hideToast(toastEl);
        });
        toastEl.appendChild(closeBtn);
    }

    // Append to container
    container.appendChild(toastEl);

    // Animate slide-down
    requestAnimationFrame(() => {
        toastEl.classList.add("show");
    });
  
    // Auto-remove after configured delay
    setTimeout(() => hideToast(toastEl), LETUP_CONFIG.autoHideDelay);
  
  return toastEl;
}
/************************************************
 * 7. Modified showPaymentConfirmationToast() - now includes hh:mm time
 ************************************************/
function showPaymentConfirmationToast(buyer, product, timestamp, lastUpdatedAt) {
    // Limit to max 3 toast elements
    const container = document.getElementById("toast-container");
    if (container.children.length >= 3) {
        // Remove the oldest toast
        container.removeChild(container.firstElementChild);
    }

    // Main toast element
    const toastEl = document.createElement("div");
    toastEl.className = "toast payment-toast"; // Add a distinguishing class

    // Lottie Player (can use a different animation for payment)
    const lottieEl = document.createElement("dotlottie-player");
    lottieEl.setAttribute("src", "https://lottie.host/5c984d88-4011-4916-9921-6c38eff7654e/iR7fvY00YL.lottie");
    lottieEl.setAttribute("background", "transparent");
    lottieEl.setAttribute("speed", "1");
    lottieEl.setAttribute("direction", "1");
    lottieEl.setAttribute("playMode", "normal");
    lottieEl.setAttribute("autoplay", "");
    lottieEl.style.width = "59px";
    lottieEl.style.height = "59px";
    lottieEl.style.marginRight = "4px";
    lottieEl.style.flexShrink = "0";
    toastEl.appendChild(lottieEl);

    // Content wrapper
    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    // Heading with payment confirmation message
    const headingEl = document.createElement("div");
    headingEl.className = "toast-heading";
    headingEl.innerHTML = `${buyer} telah membeli <strong>${product}</strong>!`;
    contentEl.appendChild(headingEl);

    // Subtext with both relative time AND hh:mm format
    // Get the Indonesian day name
    const dayName = lastUpdatedAt ? formatIndonesianDay(lastUpdatedAt) : ""; 
    const subtextEl = document.createElement("div");
    subtextEl.className = "toast-subtext";

    // Get human-readable relative time
    const relativeTime = formatRelativeTime(timestamp);

    // Format the lastUpdatedAt as hh:mm
    const hhmm = lastUpdatedAt ? formatHoursMinutes(lastUpdatedAt) : "";

    subtextEl.innerHTML = `
      <div class="toast-left"><span>${relativeTime}</span></div>
      <div class="toast-right"><span>${dayName}, ${hhmm}</span> 
      </div>
    `;
    contentEl.appendChild(subtextEl);

    toastEl.appendChild(contentEl);

    // Close button - only add if showDismissButton is true
    if (LETUP_CONFIG.showDismissButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "toast-close";
        closeBtn.innerText = "x";
        closeBtn.addEventListener("click", () => {
            hideToast(toastEl);
        });
        toastEl.appendChild(closeBtn);
    }

    // Append to container
    container.appendChild(toastEl);

    // Animate slide-down
    requestAnimationFrame(() => {
        toastEl.classList.add("show");
    });
  
      // Optionally auto-remove
    setTimeout(() => hideToast(toastEl), 5000);

    // IMPORTANT: Return the element instead of auto-removing it
    return toastEl;
}

/************************************************
 * Modified: Show Next Rotator Notification with Delay
 ************************************************/
function hideToast(el) {
    el.classList.remove("show");
    el.classList.add("hide");
    setTimeout(() => {
        el.remove();
    }, 300);
}

function showNextRotatorNotification() {
    if (rotatorData.length === 0) {
        isRotatorRunning = false;
        return;
    }

    // Take the first item, push it to the end (to rotate through them)
    const item = rotatorData.shift();
    rotatorData.push(item);

    // Get values from the data item
    const buyer = item.buyer_name || 'Seseorang';
    const productName = item.product_name || 'produk ini';
    const createdAt = item.created_at;
    const lastUpdatedAt = item.last_updated_at || item.created_at; // Fallback to created_at

    // Display the notification and get reference to the element
    const toastEl = showPaymentConfirmationToast(buyer, productName, createdAt, lastUpdatedAt);

    // First timeout: Hide the toast after displaying it for 5 seconds
    setTimeout(() => {
        hideToast(toastEl);

        // Second timeout: Wait another 5 seconds before showing next notification
        rotatorTimeout = setTimeout(showNextRotatorNotification, 5000);
    }, 5000);
}

// Cleanup function when page unloads
window.addEventListener('beforeunload', () => {
    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
    }

    if (rotatorTimeout) {
        clearTimeout(rotatorTimeout);
    }
});
