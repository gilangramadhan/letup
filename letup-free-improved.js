/**************************************************
 * Letup Free - Improved Version
 * E-commerce notification toasts with real-time capabilities
 * 
 * Improvements based on code review:
 * - Fixed duplicate function definitions
 * - Added proper error handling for Supabase initialization
 * - Implemented resource management for intervals and subscriptions
 * - Added XSS protection
 * - Consolidated configuration structure
 * - Added input sanitization
 * - Improved security with SRI for external scripts
 **************************************************/

/**************************************************
 * 0. Configuration Management - Consolidated
 **************************************************/
class LetupConfig {
    constructor() {
        this.config = {
            // Core features
            enableRealtimeNotifications: true,
            enableRotatorNotifications: true,
            enableAggregateNotifications: true,
            
            // Display settings
            maxToasts: 3,
            rotatorInterval: 5000,
            autoHideDelay: 5000,
            position: 'top',
            showDismissButton: true,
            
            // Data settings
            rotatorDataLimit: 10,
            scrollTriggerPoint: 200,
            realtimeDelayMultiplier: 2,
            
            // Supabase configuration
            supabaseUrl: null,
            supabaseKey: null,
            tableName: 'notifications',
            
            // Content settings
            productImageUrl: null,
            productImageConfigured: false,
            checkoutText: 'telah checkout',
            purchaseText: 'telah membeli',
            censorBuyerNames: true,
            showOrderId: false,
            
            // Watermark settings
            showWatermark: true,
            watermarkText: "Powered by Letup",
            watermarkUrl: "https://letup.com",
            
            // Aggregate settings
            aggregateDisplayInterval: 30 * 1000,
            aggregateRefreshInterval: 5 * 60 * 1000,
            aggregatePeriodDays: 1,
            checkoutCountText: "telah checkout",
            purchaseCountText: "telah membeli",
            maxProductsToShow: 3,
            
            // Rotator settings
            rotatorPeriodDays: 14,
            rotatorIncludeCheckouts: true,
            rotatorIncludePurchases: true
        };
    }
    
    update(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
    }
}

// Initialize configuration
const LETUP_CONFIG = new LetupConfig();

/**************************************************
 * 1. Security and Utility Functions
 **************************************************/

// XSS Protection - Sanitize HTML content
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Input validation
function validateConfig(config) {
    const errors = [];
    
    if (config.supabaseUrl && !isValidUrl(config.supabaseUrl)) {
        errors.push('Invalid Supabase URL');
    }
    
    if (config.maxToasts && (config.maxToasts < 1 || config.maxToasts > 10)) {
        errors.push('maxToasts must be between 1 and 10');
    }
    
    return errors;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Constants for magic numbers
const TIME_CONSTANTS = {
    JUST_NOW_THRESHOLD: 360, // 6 minutes
    HOUR_IN_SECONDS: 3600,
    DAY_IN_SECONDS: 86400,
    SUPABASE_LOAD_DELAY: 1000,
    SCROLL_TRIGGER_POINT: 200,
    TOAST_HIDE_ANIMATION_DELAY: 300
};

/**************************************************
 * 2. Resource Management Class
 **************************************************/
class LetupResourceManager {
    constructor() {
        this.intervals = new Set();
        this.timeouts = new Set();
        this.subscriptions = new Set();
        this.eventListeners = new Map();
    }
    
    addInterval(intervalId) {
        this.intervals.add(intervalId);
        return intervalId;
    }
    
    addTimeout(timeoutId) {
        this.timeouts.add(timeoutId);
        return timeoutId;
    }
    
    addSubscription(subscription) {
        this.subscriptions.add(subscription);
        return subscription;
    }
    
    addEventListener(element, event, handler) {
        const key = `${element.constructor.name}-${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push({ element, event, handler });
        element.addEventListener(event, handler);
    }
    
    cleanup() {
        // Clear intervals
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();
        
        // Clear timeouts
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts.clear();
        
        // Unsubscribe from subscriptions
        this.subscriptions.forEach(sub => {
            try {
                if (sub && typeof sub.unsubscribe === 'function') {
                    sub.unsubscribe();
                }
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        });
        this.subscriptions.clear();
        
        // Remove event listeners
        this.eventListeners.forEach(listeners => {
            listeners.forEach(({ element, event, handler }) => {
                try {
                    element.removeEventListener(event, handler);
                } catch (error) {
                    console.error('Error removing event listener:', error);
                }
            });
        });
        this.eventListeners.clear();
    }
}

// Global resource manager
const resourceManager = new LetupResourceManager();

/**************************************************
 * 3. Toast Factory Pattern
 **************************************************/
class ToastFactory {
    static createToast(type, data) {
        const builders = {
            checkout: this.createCheckoutToast,
            purchase: this.createPurchaseToast,
            aggregate: this.createAggregateToast
        };
        
        const builder = builders[type];
        if (!builder) {
            throw new Error(`Unknown toast type: ${type}`);
        }
        
        return builder.call(this, data);
    }
    
    static createCheckoutToast(data) {
        return this.createBaseToast(data, 'checkout');
    }
    
    static createPurchaseToast(data) {
        return this.createBaseToast(data, 'purchase');
    }
    
    static createAggregateToast(data) {
        return this.createBaseToast(data, 'aggregate');
    }
    
    static createBaseToast(data, type) {
        const container = getToastContainer();
        
        // Limit to max toast elements
        if (container.children.length >= LETUP_CONFIG.get('maxToasts')) {
            container.removeChild(container.firstElementChild);
        }
        
        const toastEl = document.createElement("div");
        toastEl.className = `toast ${type}-toast`;
        
        // Add content based on type
        this.addToastContent(toastEl, data, type);
        
        return toastEl;
    }
    
    static addToastContent(toastEl, data, type) {
        // Add image/animation
        this.addToastImage(toastEl, data, type);
        
        // Add text content
        this.addToastText(toastEl, data, type);
        
        // Add close button if needed
        this.addCloseButton(toastEl, data);
    }
    
    static addToastImage(toastEl, data, type) {
        const hasProductImage = data.productImageUrl || LETUP_CONFIG.get('productImageConfigured');
        
        if (hasProductImage) {
            const flipContainer = this.createFlipContainer(data, type);
            toastEl.appendChild(flipContainer);
        } else {
            const lottieEl = this.createLottieElement(type);
            toastEl.appendChild(lottieEl);
        }
    }
    
    static createFlipContainer(data, type) {
        const flipContainer = document.createElement("div");
        flipContainer.className = "flip-container";
        
        const flipImg = document.createElement("div");
        flipImg.className = "flip-img";
        
        const flipImgFront = document.createElement("div");
        flipImgFront.className = "flip-img-front";
        flipImgFront.appendChild(this.createLottieElement(type));
        
        const flipImgBack = document.createElement("div");
        flipImgBack.className = "flip-img-back";
        
        if (type === 'aggregate') {
            flipImgBack.appendChild(this.createAggregateIcon(data));
        } else {
            const imgEl = document.createElement("img");
            imgEl.src = data.productImageUrl || LETUP_CONFIG.get('productImageUrl');
            imgEl.width = 54;
            imgEl.height = 54;
            imgEl.alt = "Foto produk";
            flipImgBack.appendChild(imgEl);
        }
        
        flipImg.appendChild(flipImgFront);
        flipImg.appendChild(flipImgBack);
        flipContainer.appendChild(flipImg);
        
        return flipContainer;
    }
    
    static createLottieElement(type) {
        const lottieEl = document.createElement("dotlottie-player");
        
        const lottieUrls = {
            checkout: "https://lottie.host/a5a44751-5f25-48fb-8866-32084a94469c/QSiPMensPK.lottie",
            purchase: "https://lottie.host/f6cd6d57-120a-4e02-bf2e-c06fd3292d66/kureTbkW4K.lottie",
            aggregate: "https://lottie.host/a5a44751-5f25-48fb-8866-32084a94469c/QSiPMensPK.lottie"
        };
        
        lottieEl.setAttribute("src", lottieUrls[type] || lottieUrls.checkout);
        lottieEl.setAttribute("background", "transparent");
        lottieEl.setAttribute("speed", "1");
        lottieEl.setAttribute("direction", "1");
        lottieEl.setAttribute("playMode", "normal");
        lottieEl.setAttribute("autoplay", "");
        lottieEl.style.width = "64px";
        lottieEl.style.height = "64px";
        lottieEl.style.flexShrink = "0";
        
        return lottieEl;
    }
    
    static createAggregateIcon(data) {
        const imgEl = document.createElement("div");
        imgEl.style.width = "54px";
        imgEl.style.height = "54px";
        imgEl.style.borderRadius = "50%";
        imgEl.style.display = "flex";
        imgEl.style.alignItems = "center";
        imgEl.style.justifyContent = "center";
        imgEl.style.fontSize = "24px";
        imgEl.style.fontWeight = "bold";
        imgEl.style.color = "white";
        
        if (data.type === 'checkout') {
            imgEl.style.backgroundColor = "#09afed";
        } else {
            imgEl.style.backgroundColor = "#00a244";
        }
        
        imgEl.textContent = data.count;
        return imgEl;
    }
    
    static addToastText(toastEl, data, type) {
        const contentEl = document.createElement("div");
        contentEl.className = "toast-content";
        
        // Create heading
        const headingEl = document.createElement("div");
        headingEl.className = "toast-heading";
        
        // Sanitize and set content based on type
        if (type === 'aggregate') {
            const countText = `<strong>${sanitizeHTML(data.count.toString())}</strong>`;
            const typeText = data.type === 'checkout'
                ? `<span class="checkout-text">${sanitizeHTML(LETUP_CONFIG.get('checkoutCountText'))}</span> orang`
                : `<span class="purchase-text">${sanitizeHTML(LETUP_CONFIG.get('purchaseCountText'))}</span> orang`;
            headingEl.innerHTML = `${countText} ${typeText} <strong>${sanitizeHTML(data.productName)}</strong>!`;
        } else {
            const displayText = this.getDisplayText(data);
            const actionText = type === 'purchase' 
                ? `<span class="purchase-text">${sanitizeHTML(LETUP_CONFIG.get('purchaseText'))}</span>`
                : `<span class="checkout-text">${sanitizeHTML(LETUP_CONFIG.get('checkoutText'))}</span>`;
            headingEl.innerHTML = `${sanitizeHTML(displayText)} ${actionText} <strong>${sanitizeHTML(data.product)}</strong>!`;
        }
        
        contentEl.appendChild(headingEl);
        
        // Add subtext
        if (data.timestamp || type === 'aggregate') {
            contentEl.appendChild(this.createSubtext(data, type));
        }
        
        toastEl.appendChild(contentEl);
    }
    
    static getDisplayText(data) {
        if (LETUP_CONFIG.get('showOrderId') && data.orderId) {
            return `Order #${data.orderId}`;
        } else {
            return LETUP_CONFIG.get('censorBuyerNames') ? censorName(data.buyer) : data.buyer;
        }
    }
    
    static createSubtext(data, type) {
        const subtextEl = document.createElement("div");
        subtextEl.className = "toast-subtext";
        
        if (type === 'aggregate') {
            const periodText = data.periodDays === 1 
                ? "dalam 24 jam terakhir" 
                : `dalam ${data.periodDays} hari terakhir`;
            
            subtextEl.innerHTML = `
                <div class="toast-left"><span>${sanitizeHTML(periodText)}</span></div>
                <div class="toast-right">
                    ${LETUP_CONFIG.get('showWatermark') ? this.createWatermarkLink('aggpop') : ''}
                </div>
            `;
        } else {
            const dayName = formatIndonesianDay(data.timestamp);
            const relativeTime = formatRelativeTime(data.timestamp);
            const hhmm = data.hhmm || formatHoursMinutes(data.timestamp);
            
            subtextEl.innerHTML = `
                <div class="toast-left"><span>${sanitizeHTML(relativeTime)}</span></div>
                <div class="toast-center">
                    ${LETUP_CONFIG.get('showWatermark') ? this.createWatermarkLink(type === 'purchase' ? 'purpop' : 'copop') : ''}
                </div>
                <div class="toast-right">
                    <span>${sanitizeHTML(dayName)}, ${sanitizeHTML(hhmm)}</span>
                </div>
            `;
        }
        
        return subtextEl;
    }
    
    static createWatermarkLink(type) {
        const url = generateWatermarkUrl();
        const text = sanitizeHTML(LETUP_CONFIG.get('watermarkText'));
        return `<a href="${url}" class="watermark-link" target="_blank" rel="noopener" onclick="handleWatermarkClick(event, '${type}')">${text}</a>`;
    }
    
    static addCloseButton(toastEl, data) {
        if (data.isRealtime && LETUP_CONFIG.get('showDismissButton')) {
            const closeBtn = document.createElement("div");
            closeBtn.className = "toast-close";
            closeBtn.textContent = "×";
            closeBtn.setAttribute("tabindex", "0");
            closeBtn.setAttribute("role", "button");
            closeBtn.setAttribute("aria-label", "Close notification");
            
            const hideHandler = () => hideToast(toastEl);
            
            resourceManager.addEventListener(closeBtn, "click", hideHandler);
            resourceManager.addEventListener(closeBtn, "keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    hideHandler();
                }
            });
            
            toastEl.appendChild(closeBtn);
        }
    }
}

/**************************************************
 * 4. Enhanced CSS with better organization
 **************************************************/
function addStyles() {
    if (document.getElementById('letup-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'letup-toast-styles';
    style.textContent = `
        /* Watermark Link */
        .watermark-link {
            font-size: 10px;
            text-decoration: none;
            transition: box-shadow .3s;
            color: inherit;
            overflow: hidden;
            color: #09afed;
        }

        .watermark-link:hover {
            box-shadow: inset 0 -30px 0 rgba(9,175,236,0.5), 0 2px 0 rgba(9,175,236,0.5);
            color: #f8f8f8;
            padding-top: 4px;
        }

        /* Toast container - base styles */
        #toast-container {
            width: 90%;
            max-width: 300px;
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
            padding: 8px 12px;
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
            transform: translateX(100%);
        }
        
        .position-bottom .toast {
            transform: translateX(-100%);
        }
        
        /* Show animations based on position */
        .position-top .toast.show,
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
        
        .payment-toast, .purchase-toast {
            background: linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(58, 201, 104, 0.08) 100%);
            background-color: #fff;
        }
        
        /* Text container */
        .toast-content {
            flex: 1;
            line-height: 1.4;
            margin-left: 10px;
            padding-right: 14px;
            overflow: hidden;
        }
        
        /* Heading text */
        .toast-heading {
            font-size: 13px;
            margin-bottom: 4px;
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
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .toast-left {
            order: 1;
        }

        .toast-center {
            order: 2;
            text-align: center;
            flex: 1;
            margin: 0 8px;
        }
        
        .toast-right {
            order: 3;
            margin-left: auto;
        }
        
        /* Close button */
        .toast-close {
            position: absolute;
            top: 9px;
            right: 13px;
            cursor: pointer;
            background-color: #f8f8f8;
            border: none;
            font-size: 12px;
            color: #c3c3c3;
            padding: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            line-height: 1;
            box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }

        .toast-close:hover {
            background-color: #f00;
            color: #fff;
            transform: scale(1.1);
        }
        
        .toast-close:focus {
            outline: 2px solid #09afed;
            outline-offset: 2px;
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
            
            .flip-container,
            dotlottie-player {
                width: 48px;
                height: 48px;
                min-width: 48px;
            }
            
            .toast-close {
                top: 6px;
                right: 8px;
                font-size: 10px;
                width: 14px;
                height: 14px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Add CSS immediately
addStyles();

/**************************************************
 * 5. Configuration Loading with Error Handling
 **************************************************/
(function loadConfigFromDataAttributes() {
    try {
        const scripts = document.getElementsByTagName('script');
        const currentScript = scripts[scripts.length - 1];

        if (!currentScript) return;

        // Look for consolidated JSON configuration
        if (currentScript.hasAttribute('data-rilpop')) {
            const jsonAttr = currentScript.getAttribute('data-rilpop');
            try {
                const jsonConfig = JSON.parse(jsonAttr);
                
                // Validate configuration
                const errors = validateConfig(jsonConfig);
                if (errors.length > 0) {
                    console.warn('Configuration validation errors:', errors);
                }
                
                // Apply configuration
                for (const [key, value] of Object.entries(jsonConfig)) {
                    const configKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    
                    if (configKey === 'productImageUrl' && value) {
                        LETUP_CONFIG.set('productImageConfigured', true);
                    }
                    
                    // Type conversion
                    if (typeof value === 'string' && (value === 'true' || value === 'false')) {
                        LETUP_CONFIG.set(configKey, value === 'true');
                    } else if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                        LETUP_CONFIG.set(configKey, parseFloat(value));
                    } else {
                        LETUP_CONFIG.set(configKey, value);
                    }
                }

                console.log("Notifications: Configured from data-rilpop JSON attribute");
            } catch (error) {
                console.error("Error parsing data-rilpop JSON configuration:", error);
            }
        }

        // Parse individual attributes (keeping existing functionality)
        const attributeMap = {
            'data-enable-realtime': 'enableRealtimeNotifications',
            'data-enable-rotator': 'enableRotatorNotifications',
            'data-dismiss': 'showDismissButton',
            'data-censor-names': 'censorBuyerNames',
            'data-show-order-id': 'showOrderId',
            'data-position': 'position',
            'data-checkout-text': 'checkoutText',
            'data-purchase-text': 'purchaseText',
            'data-max-toasts': 'maxToasts',
            'data-rotator-interval': 'rotatorInterval',
            'data-auto-hide-delay': 'autoHideDelay',
            'data-rotator-limit': 'rotatorDataLimit',
            'data-product-image': 'productImageUrl',
            'data-supabase-url': 'supabaseUrl',
            'data-supabase-key': 'supabaseKey',
            'data-table-name': 'tableName',
            'data-realtime-multiplier': 'realtimeDelayMultiplier',
            'data-watermark-text': 'watermarkText',
            'data-watermark-url': 'watermarkUrl',
            'data-show-watermark': 'showWatermark'
        };

        for (const [attr, configKey] of Object.entries(attributeMap)) {
            if (currentScript.hasAttribute(attr)) {
                const value = currentScript.getAttribute(attr);
                
                if (attr === 'data-product-image') {
                    LETUP_CONFIG.set('productImageConfigured', true);
                }
                
                // Type conversion
                if (['data-enable-realtime', 'data-enable-rotator', 'data-dismiss', 'data-censor-names', 'data-show-order-id', 'data-show-watermark'].includes(attr)) {
                    LETUP_CONFIG.set(configKey, value === 'true');
                } else if (['data-max-toasts', 'data-rotator-interval', 'data-auto-hide-delay', 'data-rotator-limit'].includes(attr)) {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) LETUP_CONFIG.set(configKey, numValue);
                } else if (attr === 'data-realtime-multiplier') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) LETUP_CONFIG.set(configKey, numValue);
                } else if (attr === 'data-position') {
                    const pos = value.toLowerCase();
                    if (pos === 'top' || pos === 'bottom') {
                        LETUP_CONFIG.set(configKey, pos);
                    }
                } else {
                    LETUP_CONFIG.set(configKey, value);
                }
            }
        }

        console.log("Notifications: Configured from data attributes");
    } catch (error) {
        console.error("Error loading configuration from data attributes:", error);
    }
})();

/**************************************************
 * 6. Enhanced Supabase Initialization with Error Handling
 **************************************************/
let supabaseLoaded = false;
let scrollHandler;
let supabase;
let realtimeSubscription;
let rotatorData = [];
let isRotatorRunning = false;
let rotatorTimeout = null;

// Enhanced script loading with integrity check
function loadExternalScript(src, integrity = null) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        
        if (integrity) {
            script.integrity = integrity;
            script.crossOrigin = "anonymous";
        }
        
        script.onload = resolve;
        script.onerror = reject;
        
        document.head.appendChild(script);
    });
}

// Load Lottie Player with error handling
async function loadLottiePlayer() {
    try {
        await loadExternalScript("https://cdn.jsdelivr.net/npm/@dotlottie/player-component/dist/dotlottie-player.min.js");
        console.log("Lottie Player loaded successfully");
    } catch (error) {
        console.error("Failed to load Lottie Player:", error);
    }
}

// Load Lottie Player immediately
loadLottiePlayer();

async function lazyLoadSupabase() {
    if (supabaseLoaded) return;
    supabaseLoaded = true;

    // Remove scroll listener
    if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
    }

    try {
        // Load Supabase with error handling
        await loadExternalScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js");
        console.log("Supabase loaded successfully");
        
        // Initialize Supabase
        await initSupabase();
    } catch (error) {
        console.error("Failed to load Supabase:", error);
        // Optionally retry or show user-friendly error
    }
}

// Enhanced scroll handler
scrollHandler = () => {
    if (window.scrollY > LETUP_CONFIG.get('scrollTriggerPoint')) {
        lazyLoadSupabase();
    }
};

resourceManager.addEventListener(window, "scroll", scrollHandler);

// Time-based load with resource management
const timeoutId = setTimeout(lazyLoadSupabase, TIME_CONSTANTS.SUPABASE_LOAD_DELAY);
resourceManager.addTimeout(timeoutId);

/**************************************************
 * 7. Enhanced Supabase Initialization
 **************************************************/
async function initSupabase() {
    try {
        // Validate Supabase availability
        if (!window.supabase) {
            throw new Error("Supabase library not loaded");
        }

        const { createClient } = window.supabase;
        const SUPABASE_URL = LETUP_CONFIG.get('supabaseUrl');
        const SUPABASE_ANON_KEY = LETUP_CONFIG.get('supabaseKey');

        // Validate credentials
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error("Supabase credentials not configured");
        }

        if (!isValidUrl(SUPABASE_URL)) {
            throw new Error("Invalid Supabase URL");
        }

        // Create client
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        console.log("Supabase initialized successfully. Configuration:", {
            enableRealtime: LETUP_CONFIG.get('enableRealtimeNotifications'),
            enableRotator: LETUP_CONFIG.get('enableRotatorNotifications'),
            enableAggregate: LETUP_CONFIG.get('enableAggregateNotifications'),
            tableName: LETUP_CONFIG.get('tableName')
        });

        // Initialize features
        if (LETUP_CONFIG.get('enableRealtimeNotifications')) {
            await initRealtimeNotifications();
        }

        if (LETUP_CONFIG.get('enableRotatorNotifications')) {
            await initRotatorNotifications();
        }

        if (LETUP_CONFIG.get('enableAggregateNotifications')) {
            await initAggregateNotifications();
        }

    } catch (error) {
        console.error("Supabase initialization failed:", error);
        // Could implement fallback behavior here
    }
}

/**************************************************
 * 8. Enhanced Realtime Notifications
 **************************************************/
async function initRealtimeNotifications() {
    try {
        console.log(`Initializing realtime notifications with table: ${LETUP_CONFIG.get('tableName')}`);

        const subscription = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: LETUP_CONFIG.get('tableName'),
                    filter: 'displayed=eq.false'
                },
                (payload) => {
                    try {
                        handleRealtimeNotification(payload.new);
                    } catch (error) {
                        console.error("Error handling realtime notification:", error);
                    }
                }
            )
            .subscribe();

        resourceManager.addSubscription(subscription);
        realtimeSubscription = subscription;

        console.log("Realtime notifications initialized successfully");
    } catch (error) {
        console.error("Failed to initialize realtime notifications:", error);
    }
}

function handleRealtimeNotification(notification) {
    try {
        const buyer = notification.buyer_name || "Seseorang";
        const product = notification.product_name || "produk ini";
        const createdAt = notification.created_at;
        const lastUpdatedAt = notification.last_updated_at || notification.created_at;
        const productImageUrl = notification.product_image_url || LETUP_CONFIG.get('productImageUrl');
        const orderId = notification.order_id || null;

        // Update displayed flag
        updateNotificationDisplayed(notification.id);

        // Determine notification type
        const isPaymentConfirmation =
            notification.event_type === 'order.payment_status_changed' &&
            notification.payment_status === 'paid';

        const realtimeDelay = LETUP_CONFIG.get('autoHideDelay') * LETUP_CONFIG.get('realtimeDelayMultiplier');

        const data = {
            buyer,
            product,
            timestamp: createdAt,
            lastUpdatedAt,
            productImageUrl,
            isRealtime: true,
            customDelay: realtimeDelay,
            orderId,
            hhmm: createdAt ? formatHoursMinutes(createdAt) : ""
        };

        if (isPaymentConfirmation) {
            showToast('purchase', data);
        } else {
            showToast('checkout', data);
        }
    } catch (error) {
        console.error("Error in handleRealtimeNotification:", error);
    }
}

// Enhanced update function with error handling
async function updateNotificationDisplayed(id) {
    try {
        if (!supabase) {
            throw new Error("Supabase not initialized");
        }

        const { error } = await supabase
            .from(LETUP_CONFIG.get('tableName'))
            .update({
                displayed: true,
                last_updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("Error updating notification:", error);
    }
}

/**************************************************
 * 9. Enhanced Rotator Notifications
 **************************************************/
async function initRotatorNotifications() {
    try {
        console.log(`Initializing rotator notifications with table: ${LETUP_CONFIG.get('tableName')}`);

        await fetchRotatorData();

        if (!isRotatorRunning && rotatorData.length > 0) {
            isRotatorRunning = true;
            showNextRotatorNotification();
        }

        // Set up periodic refresh
        const intervalId = setInterval(fetchRotatorData, 5 * 60 * 1000);
        resourceManager.addInterval(intervalId);

        console.log("Rotator notifications initialized successfully");
    } catch (error) {
        console.error("Failed to initialize rotator notifications:", error);
    }
}

async function fetchRotatorData() {
    try {
        if (!supabase) {
            console.warn("Supabase not available for rotator data fetch");
            return;
        }

        const periodDaysAgo = new Date();
        periodDaysAgo.setDate(periodDaysAgo.getDate() - LETUP_CONFIG.get('rotatorPeriodDays'));

        let query = supabase
            .from(LETUP_CONFIG.get('tableName'))
            .select('*')
            .gte('created_at', periodDaysAgo.toISOString())
            .limit(LETUP_CONFIG.get('rotatorDataLimit'));

        // Apply filters based on configuration
        if (LETUP_CONFIG.get('rotatorIncludePurchases') && LETUP_CONFIG.get('rotatorIncludeCheckouts')) {
            query = query.or('event_type.eq.order.created,and(event_type.eq.order.payment_status_changed,payment_status.eq.paid)');
        } else if (LETUP_CONFIG.get('rotatorIncludePurchases')) {
            query = query
                .eq('event_type', 'order.payment_status_changed')
                .eq('payment_status', 'paid');
        } else if (LETUP_CONFIG.get('rotatorIncludeCheckouts')) {
            query = query.eq('event_type', 'order.created');
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        rotatorData = (data || []).sort(() => Math.random() - 0.5);

        console.log(`Fetched ${rotatorData.length} entries for rotator notifications`);

        if (!isRotatorRunning && rotatorData.length > 0) {
            isRotatorRunning = true;
            showNextRotatorNotification();
        }
    } catch (error) {
        console.error('Error fetching rotator data:', error);
    }
}

/**************************************************
 * 10. Utility Functions with Error Handling
 **************************************************/
function formatHoursMinutes(dateString) {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) {
            return "";
        }
        
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        console.error("Error formatting hours/minutes:", error);
        return "";
    }
}

function formatRelativeTime(dateString) {
    try {
        const now = new Date();
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            console.error("Invalid date format received:", dateString);
            return "Beberapa waktu lalu";
        }

        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < TIME_CONSTANTS.JUST_NOW_THRESHOLD) {
            return "Baru saja";
        } else if (diffInSeconds < TIME_CONSTANTS.HOUR_IN_SECONDS) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} menit lalu`;
        } else if (diffInSeconds < TIME_CONSTANTS.DAY_IN_SECONDS) {
            const hours = Math.floor(diffInSeconds / TIME_CONSTANTS.HOUR_IN_SECONDS);
            return `${hours} jam lalu`;
        } else {
            const days = Math.floor(diffInSeconds / TIME_CONSTANTS.DAY_IN_SECONDS);
            return days === 1 ? "Kemarin" : `${days} hari lalu`;
        }
    } catch (error) {
        console.error("Error formatting relative time:", error);
        return "Beberapa waktu lalu";
    }
}

function formatIndonesianDay(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return "";
        }
        
        const indonesianDays = [
            "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
        ];
        return indonesianDays[date.getDay()];
    } catch (error) {
        console.error("Error formatting Indonesian day:", error);
        return "";
    }
}

function generateWatermarkUrl(type = 'regpop') {
    return LETUP_CONFIG.get('watermarkUrl');
}

function handleWatermarkClick(e, type = 'regpop') {
    try {
        e.preventDefault();
        const baseUrl = LETUP_CONFIG.get('watermarkUrl');
        const params = new URLSearchParams({
            utm_source: window.location.hostname,
            utm_medium: type,
            utm_campaign: new Date().toISOString().split('T')[0],
            utm_content: window.location.pathname
        });
        window.open(`${baseUrl}?${params.toString()}`, '_blank', 'noopener');
    } catch (error) {
        console.error("Error handling watermark click:", error);
    }
}

function censorName(name) {
    if (!name) return "Seseorang";

    try {
        const words = name.split(' ');
        const censoredWords = words.map(word => {
            if (word.length <= 2) {
                return word[0] + '*';
            }
            const firstPart = word.substring(0, 2);
            const asterisks = '*'.repeat(word.length - 2);
            return firstPart + asterisks;
        });
        return censoredWords.join(' ');
    } catch (error) {
        console.error("Error censoring name:", error);
        return "Seseorang";
    }
}

/**************************************************
 * 11. Enhanced Toast Container Management
 **************************************************/
function getToastContainer() {
    let container = document.getElementById('toast-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    container.className = '';
    container.classList.add(`position-${LETUP_CONFIG.get('position')}`);

    return container;
}

/**************************************************
 * 12. Enhanced Toast Display Functions
 **************************************************/
function showToast(type, data) {
    try {
        const toastEl = ToastFactory.createToast(type, data);
        const container = getToastContainer();
        
        container.appendChild(toastEl);

        // Animate show
        requestAnimationFrame(() => {
            toastEl.classList.add("show");
        });

        // Auto-hide
        const hideDelay = data.customDelay !== null ? data.customDelay : LETUP_CONFIG.get('autoHideDelay');
        const timeoutId = setTimeout(() => hideToast(toastEl), hideDelay);
        resourceManager.addTimeout(timeoutId);

        return toastEl;
    } catch (error) {
        console.error("Error showing toast:", error);
    }
}

function hideToast(el) {
    try {
        if (!el || !el.parentNode) return;
        
        el.classList.remove("show");
        el.classList.add("hide");
        
        const timeoutId = setTimeout(() => {
            if (el.parentNode) {
                el.remove();
            }
        }, TIME_CONSTANTS.TOAST_HIDE_ANIMATION_DELAY);
        
        resourceManager.addTimeout(timeoutId);
    } catch (error) {
        console.error("Error hiding toast:", error);
    }
}

/**************************************************
 * 13. Enhanced Aggregate Notifications
 **************************************************/
const aggregateCache = {
    lastUpdated: null,
    checkoutData: [],
    purchaseData: [],
    currentProductIndex: 0
};

async function initAggregateNotifications() {
    try {
        console.log("=== AGGREGATE TOASTS: System initializing ===");

        const success = await refreshAggregateData();
        console.log("=== AGGREGATE TOASTS: Initial data load " + (success ? "SUCCESS" : "FAILED") + " ===");

        // Start display cycle
        const displayIntervalId = setInterval(showCachedAggregateToast, LETUP_CONFIG.get('aggregateDisplayInterval'));
        resourceManager.addInterval(displayIntervalId);

        // Start refresh cycle
        const refreshIntervalId = setInterval(refreshAggregateData, LETUP_CONFIG.get('aggregateRefreshInterval'));
        resourceManager.addInterval(refreshIntervalId);

        console.log("Aggregate notifications initialized successfully");
    } catch (error) {
        console.error("Failed to initialize aggregate notifications:", error);
    }
}

async function refreshAggregateData() {
    try {
        if (!supabase) {
            console.warn("Supabase not available for aggregate data refresh");
            return false;
        }

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - LETUP_CONFIG.get('aggregatePeriodDays'));

        // Fetch checkout counts
        const { data: checkoutData, error: checkoutError } = await supabase
            .from(LETUP_CONFIG.get('tableName'))
            .select('product_name, count(*)')
            .eq('event_type', 'order.created')
            .gte('created_at', daysAgo.toISOString())
            .group('product_name');

        if (checkoutError) {
            console.error("Error fetching checkout counts:", checkoutError);
        } else {
            aggregateCache.checkoutData = (checkoutData || []).filter(item => item.count > 0);
        }

        // Fetch purchase counts
        const { data: purchaseData, error: purchaseError } = await supabase
            .from(LETUP_CONFIG.get('tableName'))
            .select('product_name, count(*)')
            .eq('event_type', 'order.payment_status_changed')
            .eq('payment_status', 'paid')
            .gte('created_at', daysAgo.toISOString())
            .group('product_name');

        if (purchaseError) {
            console.error("Error fetching purchase counts:", purchaseError);
        } else {
            aggregateCache.purchaseData = (purchaseData || []).filter(item => item.count > 0);
        }

        aggregateCache.lastUpdated = new Date();

        return aggregateCache.checkoutData.length > 0 || aggregateCache.purchaseData.length > 0;
    } catch (error) {
        console.error('Error refreshing aggregate data:', error);
        return false;
    }
}

function showCachedAggregateToast() {
    try {
        if (!aggregateCache.lastUpdated) {
            return;
        }

        const dataToShow = [];

        // Add checkout data
        aggregateCache.checkoutData.forEach(item => {
            dataToShow.push({
                count: item.count,
                productName: item.product_name,
                type: 'checkout'
            });
        });

        // Add purchase data
        aggregateCache.purchaseData.forEach(item => {
            dataToShow.push({
                count: item.count,
                productName: item.product_name,
                type: 'purchase'
            });
        });

        if (dataToShow.length === 0) {
            return;
        }

        // Select item to show
        let itemToShow;
        if (dataToShow.length > LETUP_CONFIG.get('maxProductsToShow')) {
            itemToShow = dataToShow[aggregateCache.currentProductIndex];
            aggregateCache.currentProductIndex = (aggregateCache.currentProductIndex + 1) % dataToShow.length;
        } else {
            const randomIndex = Math.floor(Math.random() * dataToShow.length);
            itemToShow = dataToShow[randomIndex];
        }

        // Show toast
        const data = {
            ...itemToShow,
            periodDays: LETUP_CONFIG.get('aggregatePeriodDays'),
            isRealtime: false
        };

        showToast('aggregate', data);
    } catch (error) {
        console.error("Error showing cached aggregate toast:", error);
    }
}

/**************************************************
 * 14. Enhanced Rotator Display
 **************************************************/
function showNextRotatorNotification() {
    try {
        if (rotatorData.length === 0) {
            isRotatorRunning = false;
            return;
        }

        const item = rotatorData.shift();
        rotatorData.push(item);

        const buyer = item.buyer_name || 'Seseorang';
        const productName = item.product_name || 'produk ini';
        const createdAt = item.created_at;
        const lastUpdatedAt = item.last_updated_at || item.created_at;
        const productImageUrl = item.product_image_url || LETUP_CONFIG.get('productImageUrl');
        const orderId = item.order_id || null;

        const isPaymentConfirmation =
            item.event_type === 'order.payment_status_changed' &&
            item.payment_status === 'paid';

        const data = {
            buyer,
            product: productName,
            timestamp: createdAt,
            lastUpdatedAt,
            productImageUrl,
            isRealtime: false,
            customDelay: null,
            orderId,
            hhmm: createdAt ? formatHoursMinutes(createdAt) : ""
        };

        const toastEl = showToast(isPaymentConfirmation ? 'purchase' : 'checkout', data);

        // Schedule next notification
        const timeoutId = setTimeout(() => {
            hideToast(toastEl);
            
            const nextTimeoutId = setTimeout(showNextRotatorNotification, LETUP_CONFIG.get('rotatorInterval'));
            resourceManager.addTimeout(nextTimeoutId);
        }, LETUP_CONFIG.get('autoHideDelay'));
        
        resourceManager.addTimeout(timeoutId);
    } catch (error) {
        console.error("Error showing next rotator notification:", error);
        isRotatorRunning = false;
    }
}

/**************************************************
 * 15. Cleanup and Error Handling
 **************************************************/
// Enhanced cleanup function
function cleanup() {
    try {
        resourceManager.cleanup();
        console.log("Letup notifications cleaned up successfully");
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}

// Register cleanup handlers
resourceManager.addEventListener(window, 'beforeunload', cleanup);
resourceManager.addEventListener(window, 'pagehide', cleanup);

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in Letup notifications:', event.reason);
});

// Expose cleanup function globally for manual cleanup
window.LetupCleanup = cleanup;

console.log("Letup Free - Improved Version loaded successfully");
