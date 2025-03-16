/**************************************************
 * 0. Configuration options - Default settings
 **************************************************/
const LETUP_CONFIG = {
    enableRealtimeNotifications: true,  // Set to false to disable real-time notifications
    enableRotatorNotifications: true,   // Set to false to disable rotator notifications
    maxToasts: 3,                       // Maximum number of toasts to show at once
    rotatorInterval: 5000,              // Time between rotator notifications (milliseconds)
    autoHideDelay: 5000,                // Time before auto-hiding toasts (milliseconds)
    rotatorDataLimit: 10,               // Maximum number of notifications to fetch for rotator (default: 10)
    scrollTriggerPoint: 200,            // Scroll distance to trigger loading (pixels - fixed)
    supabaseUrl: 'https://tsaaphhxqbsknszartza.supabase.co', // Default Supabase URL
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYWFwaGh4cWJza25zemFydHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MjEyNzAsImV4cCI6MjA1Njk5NzI3MH0.yQZgidrNuzheZ8oKgpWkl4n0Ha9WoJNbnIuu8IuhLaU', // Default Supabase anon key
    tableName: 'notifications',         // Default table name
    showDismissButton: false,            // Show close button on toasts (default: false)
    productImageUrl: null,              // Default to null to indicate no image is configured
    productImageConfigured: false,      // Flag to track if user explicitly configured an image
    checkoutText: 'telah checkout',     // Default text for checkout notifications
    purchaseText: 'telah membeli',       // Default text for purchase notifications
    position: 'top',                    // Position of toast notifications: 'top' or 'bottom'
    censorBuyerNames: true              // Whether to censor buyer names in notifications (default: true)
};

/**************************************************
 * Add built-in CSS styles
 **************************************************/
function addStyles() {
    if (document.getElementById('letup-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'letup-toast-styles';
    style.textContent = `
        /* Toast container - base styles */
        #toast-container {
            width: 90%;
            max-width: 432px;
            position: fixed;
            z-index: 9999;
        }
        
        /* Position-specific container styles */
        #toast-container.position-top {
            top: 20px;
            right: 20px;
            left: auto;
            transform: none;
        }
        
        #toast-container.position-bottom {
            bottom: 20px;
            left: 20px;
            right: auto;
            transform: none;
        }
        
        /* Each toast bubble */
        .toast {
            display: flex;
            align-items: center;
            background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(9,175,237,0.08) 100%);
            background-color: #fff;
            border-radius: 24px;
            margin-bottom: 12px;
            padding: 6px 12px;
            box-shadow: 0 0 0 1px #0e3f7e0f, 0 1px 1px -0.5px #2a334608,
                0 2px 2px -1px #2a33460a, 0 3px 3px -1.5px #2a33460a,
                0 5px 5px -2.5px #2a334608, 0 10px 10px -5px #2a334608,
                0 24px 24px -8px #2a334608, rgb(23 43 99 / 3%) 0 0 28px;
            width: 100%;
            max-width: 100%;
            font-family: sans-serif;
            color: rgba(14, 21, 25, 0.8);
            transition: all 0.3s ease;
            position: relative;
            opacity: 0;
        }
        
        /* Position-specific initial states and animations */
        .position-top .toast {
            transform: translateX(100%);  /* Start off-screen to the right */
        }
        
        .position-bottom .toast {
            transform: translateX(-100%);  /* Start off-screen to the left */
        }
        
        /* Show animations based on position */
        .position-top .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .position-bottom .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        /* Hide animations based on position */
        .position-top .toast.hide {
            opacity: 0;
            transform: translateX(100%);
        }
        
        .position-bottom .toast.hide {
            opacity: 0;
            transform: translateX(-100%);
        }
        
        .payment-toast {
            background: linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(58, 201, 104, 0.08) 100%);
            background-color: #fff;
        }
        
        /* Slide animations based on position */
        .position-top .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .position-bottom .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        /* Hide animations based on position */
        .position-top .toast.hide {
            opacity: 0;
            transform: translateX(100%);
        }
        
        .position-bottom .toast.hide {
            opacity: 0;
            transform: translateX(-100%);
        }
        
        /* Text container */
        .toast-content {
            flex: 1;
            line-height: 1.4;
            margin-left: 10px;
            overflow: hidden;
        }
        
        /* Heading text */
        .toast-heading {
            font-size: 14px;
            margin-bottom: 4px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .toast-heading span {
            padding-bottom: 2px;
        }
        
        /* Subtext styling */
        .toast-subtext span {
            color: #5b6e74;
            font-size: 12px;
        }
        
        .toast-subtext {
            display: flex;
            justify-content: flex-start;
            align-items: flex-end;
            flex-wrap: wrap;
        }
        
        .toast-left {
            order: -1;
        }
        
        .toast-right {
            display: flex;
            margin-left: auto;
        }
        
        /* Close button */
        .toast-close {
            position: absolute;
            top: 0;
            right: 7px;
            cursor: pointer;
            background: none;
            border: none;
            font-size: 11px;
            color: #b4b4b4;
            padding: 5px;
        }
        
        .toast-close:hover {
            color: #000;
        }
        
        /* Flip container */
        .flip-container {
            perspective: 1000px;
            min-width: 64px;
            width: 64px;
            height: 64px;
            flex-shrink: 0;
        }
        
        .flip-img {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            animation: flip 0.5s ease-in-out 1 forwards;
            animation-delay: 1.5s;
        }
        
        .flip-img-front, .flip-img-back {
            width: 100%;
            height: 100%;
            position: absolute;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
            border-radius: 50%;
        }
        
        .flip-img-back {
            transform: rotateY(180deg);
        }
        
        .flip-img-back img {
            border-radius: 30%;
            width: 54px;
            height: 54px;
            object-fit: cover;
        }
        
        @keyframes flip {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(180deg); }
        }
        
        /* Text styling */
        .purchase-text {
            text-decoration: none;
            box-shadow: inset 0 -1px 0 rgba(0,162,68,0.5), 0 1px 0 rgba(0,162,68,0.5);
            transition: box-shadow .3s;
            overflow: hidden;
            color: #00a244;
        }
        
        .purchase-text:hover {
            box-shadow: inset 0 -30px 0 rgba(0,162,68), 0 2px 0 rgba(0,162,68);
            color: #f8f8f8;
            padding-top: 4px;
        }
        
        .checkout-text {
            text-decoration: none;
            box-shadow: inset 0 -1px 0 rgba(9,175,236), 0 1px 0 rgba(9,175,236);
            transition: box-shadow .3s;
            color: inherit;
            overflow: hidden;
            color: #09afed;
        }
        
        .checkout-text:hover {
            box-shadow: inset 0 -30px 0 rgba(9,175,236,0.5), 0 2px 0 rgba(9,175,236,0.5);
            color: #f8f8f8;
            padding-top: 4px;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
            #toast-container.position-top,
            #toast-container.position-bottom {
                left: 50%;
                right: auto;
                transform: translateX(-50%);
            }
            
            #toast-container.position-top {
                top: 10px;
            }
            
            #toast-container.position-bottom {
                bottom: 10px;
            }
            
            /* On mobile, always slide from top/bottom */
            .position-top .toast {
                transform: translateY(-100%);
            }
            
            .position-bottom .toast {
                transform: translateY(100%);
            }
            
            .position-top .toast.show,
            .position-bottom .toast.show {
                transform: translateY(0);
            }
            
            .position-top .toast.hide {
                transform: translateY(-100%);
            }
            
            .position-bottom .toast.hide {
                transform: translateY(100%);
            }
        }
        
        @media (max-width: 360px) {
            .toast {
                padding: 8px 10px;
            }
            
            .toast-heading {
                font-size: 12px;
            }
            
            .flip-container,
            dotlottie-player {
                width: 48px;
                height: 48px;
                min-width: 48px;
            }
            
            .toast-close {
                top: 6px;
                right: 8px;
                font-size: 12px;
            }
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
        // NEW: Look for consolidated JSON configuration with data-rilpop
        if (currentScript.hasAttribute('data-rilpop')) {
            const jsonAttr = currentScript.getAttribute('data-rilpop');
            try {
                // Parse the JSON configuration
                const jsonConfig = JSON.parse(jsonAttr);
                
                // Apply all properties from the JSON config to LETUP_CONFIG
                for (const [key, value] of Object.entries(jsonConfig)) {
                    // Convert kebab-case to camelCase if needed
                    const configKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    
                    // For productImageUrl, set the configured flag too
                    if (configKey === 'productImageUrl' && value) {
                        LETUP_CONFIG.productImageConfigured = true;
                    }
                    
                    // Special handling for boolean values that might be strings
                    if (typeof value === 'string' && (value === 'true' || value === 'false')) {
                        LETUP_CONFIG[configKey] = value === 'true';
                    } 
                    // Special handling for numeric values that might be strings
                    else if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                        LETUP_CONFIG[configKey] = parseFloat(value);
                    }
                    // Handle normal values
                    else {
                        LETUP_CONFIG[configKey] = value;
                    }
                }
                
                console.log("Notifications: Configured from data-rilpop JSON attribute", LETUP_CONFIG);
            } catch (error) {
                console.error("Error parsing data-rilpop JSON configuration:", error);
            }
        }

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
        // Parse boolean attributes for name censoring
        if (currentScript.hasAttribute('data-censor-names')) {
            LETUP_CONFIG.censorBuyerNames = 
                currentScript.getAttribute('data-censor-names') === 'true';
        }

        // Parse position attribute
        if (currentScript.hasAttribute('data-position')) {
            const pos = currentScript.getAttribute('data-position').toLowerCase();
            if (pos === 'top' || pos === 'bottom') {
            LETUP_CONFIG.position = pos;
            }
        }

        // Parse string attributes for notification text
        if (currentScript.hasAttribute('data-checkout-text')) {
            LETUP_CONFIG.checkoutText = currentScript.getAttribute('data-checkout-text');
        }

        if (currentScript.hasAttribute('data-purchase-text')) {
            LETUP_CONFIG.purchaseText = currentScript.getAttribute('data-purchase-text');
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

        if (currentScript.hasAttribute('data-rotator-limit')) {
            const value = parseInt(currentScript.getAttribute('data-rotator-limit'));
            if (!isNaN(value)) LETUP_CONFIG.rotatorDataLimit = value;
        }

        if (currentScript.hasAttribute('data-product-image')) {
            LETUP_CONFIG.productImageUrl = currentScript.getAttribute('data-product-image');
            LETUP_CONFIG.productImageConfigured = true; // Mark as explicitly configured
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

    // NEW: Look for consolidated JSON configuration
    if (container.hasAttribute('data-setup') || container.hasAttribute('data-rilpop')) {
        const jsonAttr = container.getAttribute('data-setup') || container.getAttribute('data-rilpop');
        try {
            // Parse the JSON configuration
            const jsonConfig = JSON.parse(jsonAttr);
            
            // Apply all properties from the JSON config to LETUP_CONFIG
            for (const [key, value] of Object.entries(jsonConfig)) {
                // Convert kebab-case to camelCase if needed
                const configKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                
                // Special handling for boolean values that might be strings
                if (typeof value === 'string' && (value === 'true' || value === 'false')) {
                    LETUP_CONFIG[configKey] = value === 'true';
                } 
                // Special handling for numeric values that might be strings
                else if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                    LETUP_CONFIG[configKey] = parseFloat(value);
                }
                // Handle normal values
                else {
                    LETUP_CONFIG[configKey] = value;
                }
            }
            
            console.log("Notifications: Configured from container JSON attribute", LETUP_CONFIG);
        } catch (error) {
            console.error("Error parsing JSON configuration:", error);
        }
    }

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
    
    if (container.hasAttribute('data-censor-names')) {
        LETUP_CONFIG.censorBuyerNames =
            container.getAttribute('data-censor-names') === 'true';
    }

    // Parse position attribute
    if (container.hasAttribute('data-position')) {
        const pos = container.getAttribute('data-position').toLowerCase();
        if (pos === 'top' || pos === 'bottom') {
            LETUP_CONFIG.position = pos;
        }
    }

    // Parse string attributes for notification text
    if (container.hasAttribute('data-checkout-text')) {
        LETUP_CONFIG.checkoutText = container.getAttribute('data-checkout-text');
    }

    if (container.hasAttribute('data-purchase-text')) {
        LETUP_CONFIG.purchaseText = container.getAttribute('data-purchase-text');
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

    if (container.hasAttribute('data-rotator-limit')) {
        const value = parseInt(container.getAttribute('data-rotator-limit'));
        if (!isNaN(value)) LETUP_CONFIG.rotatorDataLimit = value;
    }

    if (container.hasAttribute('data-product-image')) {
        LETUP_CONFIG.productImageUrl = container.getAttribute('data-product-image');
        LETUP_CONFIG.productImageConfigured = true; // Mark as explicitly configured
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
    // Extract product image URL from notification data
    const productImageUrl = notification.product_image_url || LETUP_CONFIG.productImageUrl;

    // Update the displayed flag to prevent showing this notification again
    updateNotificationDisplayed(notification.id);

    // Determine notification type based on event_type and payment_status
    const isPaymentConfirmation =
        notification.event_type === 'order.updated' &&
        notification.payment_status === 'paid';

    if (isPaymentConfirmation) {
        // Payment confirmation notification - now passing the lastUpdatedAt and productImageUrl
        showPaymentConfirmationToast(buyer, product, createdAt, lastUpdatedAt, productImageUrl);
    } else {
        // Standard order notification - pass the createdAt timestamp for the day and productImageUrl
        const hhmm = createdAt ? formatHoursMinutes(createdAt) : "";
        showToast(buyer, product, hhmm, createdAt, productImageUrl);
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
            .limit(LETUP_CONFIG.rotatorDataLimit); // Use the configurable limit

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
    try {
        const now = new Date();
        let date;
        
        // Better date parsing with validation
        if (typeof dateString === 'string') {
            // Handle ISO string format from Supabase
            date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error("Invalid date format received:", dateString);
                return "Beberapa waktu lalu"; // Fallback for invalid dates
            }
        } else {
            console.error("Invalid date input type:", typeof dateString);
            return "Beberapa waktu lalu"; // Fallback
        }
        
        // Calculate difference in seconds
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        // Log for debugging
        console.log("Date difference calculation:", {
            now: now.toISOString(),
            inputDate: date.toISOString(),
            diffInSeconds,
            diffInDays: Math.floor(diffInSeconds / 86400)
        });
        
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
            // Cap at 7 days to prevent extreme values
            return days > 7 ? "Seminggu lalu" : `${days} hari lalu`;
        }
    } catch (error) {
        console.error("Error formatting relative time:", error);
        return "Beberapa waktu lalu"; // Fallback in case of any errors
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
 * New Function: censorName(): masks buyer names for privacy
 ************************************************/
function censorName(name) {
    if (!name) return "Seseorang";
    
    // Split the name into words
    const words = name.split(' ');
    
    // Process each word individually
    const censoredWords = words.map(word => {
        // Handle short words (keep first letter only)
        if (word.length <= 2) {
            return word[0] + '*';
        }
        
        // For longer words, keep first 2 chars and censor the rest
        const firstPart = word.substring(0, 2);
        const remainingLength = word.length - 2;
        const asterisks = '*'.repeat(remainingLength);
        
        return firstPart + asterisks;
    });
    
    // Join the censored words back together
    return censoredWords.join(' ');
}

/**************************************************
 * Create or get the toast container with position class
 **************************************************/
function getToastContainer() {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Apply position class based on configuration
    container.className = ''; // Clear existing classes
    container.classList.add(`position-${LETUP_CONFIG.position}`);
    
    return container;
}

/************************************************
 * 6. showToast() - Creates & displays a new toast
 ************************************************/
function showToast(buyer, product, hhmm, timestamp, productImageUrl) {
    // Get container with proper position class
    const container = getToastContainer();
    
    // Limit to max toast elements based on config
    if (container.children.length >= LETUP_CONFIG.maxToasts) {
        // Remove the oldest toast
        container.removeChild(container.firstElementChild);
    }

    // Main toast element
    const toastEl = document.createElement("div");
    toastEl.className = "toast";

    // Create flip container if product image URL is available or if configured globally
    const hasProductImage = productImageUrl || LETUP_CONFIG.productImageConfigured;
    
    if (hasProductImage) {
        // Create flip container structure
        const flipContainer = document.createElement("div");
        flipContainer.className = "flip-container";

        const flipImg = document.createElement("div");
        flipImg.className = "flip-img";

        const flipImgFront = document.createElement("div");
        flipImgFront.className = "flip-img-front";

        const flipImgBack = document.createElement("div");
        flipImgBack.className = "flip-img-back";

        // Lottie Player (for front)
        const lottieEl = document.createElement("dotlottie-player");
        lottieEl.setAttribute("src", "https://lottie.host/a5a44751-5f25-48fb-8866-32084a94469c/QSiPMensPK.lottie");
        lottieEl.setAttribute("background", "transparent");
        lottieEl.setAttribute("speed", "1");
        lottieEl.setAttribute("direction", "1");
        lottieEl.setAttribute("playMode", "normal");
        lottieEl.setAttribute("autoplay", "");
        lottieEl.style.width = "64px";
        lottieEl.style.height = "64px";
        flipImgFront.appendChild(lottieEl);

        // Back side - use product-specific image URL if available, fall back to global config
        const imgEl = document.createElement("img");
        imgEl.src = productImageUrl || LETUP_CONFIG.productImageUrl;
        imgEl.width = 54;
        imgEl.height = 54;
        imgEl.alt = "Foto produk";
        flipImgBack.appendChild(imgEl);

        // Assemble the flip container
        flipImg.appendChild(flipImgFront);
        flipImg.appendChild(flipImgBack);
        flipContainer.appendChild(flipImg);

        // Add to toast
        toastEl.appendChild(flipContainer);
    } else {
        // Original behavior - just the Lottie player with no flip effect
        const lottieEl = document.createElement("dotlottie-player");
        lottieEl.setAttribute("src", "https://lottie.host/a5a44751-5f25-48fb-8866-32084a94469c/QSiPMensPK.lottie");
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
    }

    // Content wrapper
    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    // Apply name censoring based on configuration setting
    const displayName = LETUP_CONFIG.censorBuyerNames ? censorName(buyer) : buyer;

    // Heading with payment confirmation message - use configurable purchase text
    const headingEl = document.createElement("div");
    headingEl.className = "toast-heading";
    headingEl.innerHTML = `${displayName} <span class="purchase-text">${LETUP_CONFIG.purchaseText}</span> <strong>${product}</strong>!`;
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
function showPaymentConfirmationToast(buyer, product, timestamp, lastUpdatedAt, productImageUrl) {
    // Get container with proper position class
    const container = getToastContainer();
    
    // Limit to max toast elements based on config
    if (container.children.length >= LETUP_CONFIG.maxToasts) {
        // Remove the oldest toast
        container.removeChild(container.firstElementChild);
    }

    // Main toast element
    const toastEl = document.createElement("div");
    toastEl.className = "toast payment-toast"; // Add a distinguishing class

    // Create flip container if product image URL is available or if configured globally
    const hasProductImage = productImageUrl || LETUP_CONFIG.productImageConfigured;
    
    if (hasProductImage) {
        // Create flip container structure
        const flipContainer = document.createElement("div");
        flipContainer.className = "flip-container";

        const flipImg = document.createElement("div");
        flipImg.className = "flip-img";

        const flipImgFront = document.createElement("div");
        flipImgFront.className = "flip-img-front";

        const flipImgBack = document.createElement("div");
        flipImgBack.className = "flip-img-back";

        // Lottie Player (for front)
        const lottieEl = document.createElement("dotlottie-player");
        lottieEl.setAttribute("src", "https://lottie.host/f6cd6d57-120a-4e02-bf2e-c06fd3292d66/kureTbkW4K.lottie");
        lottieEl.setAttribute("background", "transparent");
        lottieEl.setAttribute("speed", "1");
        lottieEl.setAttribute("direction", "1");
        lottieEl.setAttribute("playMode", "normal");
        lottieEl.setAttribute("autoplay", "");
        lottieEl.style.width = "64px";
        lottieEl.style.height = "64px";
        flipImgFront.appendChild(lottieEl);

        // Back side - use product-specific image URL if available, fall back to global config
        const imgEl = document.createElement("img");
        imgEl.src = productImageUrl || LETUP_CONFIG.productImageUrl;
        imgEl.width = 64;
        imgEl.height = 64;
        imgEl.alt = "Foto produk";
        flipImgBack.appendChild(imgEl);

        // Assemble the flip container
        flipImg.appendChild(flipImgFront);
        flipImg.appendChild(flipImgBack);
        flipContainer.appendChild(flipImg);

        // Add to toast
        toastEl.appendChild(flipContainer);
    } else {
        // Original behavior - just the Lottie player with no flip effect
        const lottieEl = document.createElement("dotlottie-player");
        lottieEl.setAttribute("src", "https://lottie.host/f6cd6d57-120a-4e02-bf2e-c06fd3292d66/kureTbkW4K.lottie");
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
    }

    // Content wrapper
    const contentEl = document.createElement("div");
    contentEl.className = "toast-content";

    // Conditionally censor the buyer name based on configuration
    const displayName = LETUP_CONFIG.censorBuyerNames ? censorName(buyer) : buyer;

    // Heading with payment confirmation message - use configurable purchase text
    const headingEl = document.createElement("div");
    headingEl.className = "toast-heading";
    headingEl.innerHTML = `${displayName} <span class="purchase-text">${LETUP_CONFIG.purchaseText}</span> <strong>${product}</strong>!`;
    
    // CRUCIAL FIX: Add the heading to the content element
    contentEl.appendChild(headingEl);
    
    // Subtext with both relative time AND hh:mm format
    // Get the Indonesian day name
    const dayName = lastUpdatedAt ? formatIndonesianDay(lastUpdatedAt) : "";
    const subtextEl = document.createElement("div");
    subtextEl.className = "toast-subtext";

    // Get human-readable relative time
    const relativeTime = formatRelativeTime(timestamp); // timestamp is createdAt

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

    // Use the configured auto-hide delay instead of hardcoded 5000
    setTimeout(() => hideToast(toastEl), LETUP_CONFIG.autoHideDelay);

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
    const lastUpdatedAt = item.last_updated_at || item.created_at;
    const localFetchTime = item.local_fetch_time; // Use the local fetch time
    const productImageUrl = item.product_image_url || LETUP_CONFIG.productImageUrl;

    // Log for debugging
    console.log("Showing notification with dates:", {
        createdAt,
        lastUpdatedAt,
        localFetchTime,
        productImageUrl
    });

    // Display the notification and get reference to the element
    const toastEl = showPaymentConfirmationToast(
        buyer, 
        productName, 
        createdAt, 
        lastUpdatedAt,
        productImageUrl
    );

    // First timeout: Hide the toast after displaying it for configured delay
    setTimeout(() => {
        hideToast(toastEl);

        // Second timeout: Wait for configured interval before showing next notification
        rotatorTimeout = setTimeout(showNextRotatorNotification, LETUP_CONFIG.rotatorInterval);
    }, LETUP_CONFIG.autoHideDelay);
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
