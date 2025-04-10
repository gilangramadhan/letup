/**************************************************
 * 0. Lazy-load Supabase script on:
 *    - Scroll beyond 200px, or
 *    - 2 seconds timeout
 **************************************************/
let supabaseLoaded = false;
let scrollHandler;
let supabase;            // Will hold our Supabase client
let realtimeSubscription;
let rotatorData = [];
let isRotatorRunning = false;
let rotatorTimeout = null;

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
    // 2) Provide your own Supabase project credentials
    const SUPABASE_URL = 'https://tsaaphhxqbsknszartza.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYWFwaGh4cWJza25zemFydHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MjEyNzAsImV4cCI6MjA1Njk5NzI3MH0.yQZgidrNuzheZ8oKgpWkl4n0Ha9WoJNbnIuu8IuhLaU';

    // 3) Create the client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Then initialize the rest
    initRealtimeNotifications();
    initRotatorNotifications();
}

/************************************************
* 2. Realtime Notifications System
************************************************/
function initRealtimeNotifications() {
    // Subscribe to realtime notifications
    realtimeSubscription = supabase
        .channel('notifications-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
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
        .from('notifications')
        .update({ 
          displayed: true,
          last_updated_at: new Date().toISOString() // Update the last_updated_at field
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
        // Example: fetch old notifications from 'notifications' table
        // only those that are payment confirmations in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('event_type', 'order.updated')
            .eq('payment_status', 'paid')
            .gte('created_at', sevenDaysAgo.toISOString())
            .limit(10);

        if (error) throw error;

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

function showNextRotatorNotification() {
    if (rotatorData.length === 0) {
        // No data => stop
        isRotatorRunning = false;
        return;
    }

    // Take the first item, push it to the end (to rotate through them)
    const item = rotatorData.shift();
    rotatorData.push(item);

    // Example: showPaymentConfirmationToast or showToast
    const buyer = item.buyer_name || 'Seseorang';
    const productName = item.product_name || 'produk ini';
    const createdAt = item.created_at;
    showPaymentConfirmationToast(buyer, productName, createdAt);

    // Show next one after 5 seconds
    rotatorTimeout = setTimeout(showNextRotatorNotification, 5000);
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
    // Limit to max 3 toast elements
    const container = document.getElementById("toast-container");
    if (container.children.length >= 3) {
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

    // Close button
    // const closeBtn = document.createElement("button");
    // closeBtn.className = "toast-close";
    // closeBtn.innerText = "x";
    // closeBtn.addEventListener("click", () => {
    //  hideToast(toastEl);
    // });
    // toastEl.appendChild(closeBtn);

    // Append to container
    container.appendChild(toastEl);

    // Animate slide-down
    requestAnimationFrame(() => {
        toastEl.classList.add("show");
    });

    return toastEl;

    // Optionally auto-remove
     setTimeout(() => hideToast(toastEl), 5000);
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

    // Close button
    // const closeBtn = document.createElement("button");
    // closeBtn.className = "toast-close";
    // closeBtn.innerText = "x";
    // closeBtn.addEventListener("click", () => {
    //  hideToast(toastEl);
    // });
    // toastEl.appendChild(closeBtn);

    // Append to container
    container.appendChild(toastEl);

    // Animate slide-down
    requestAnimationFrame(() => {
        toastEl.classList.add("show");
    });

    // IMPORTANT: Return the element instead of auto-removing it
    return toastEl;

    // Optionally auto-remove
    // setTimeout(() => hideToast(toastEl), 5000);
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
