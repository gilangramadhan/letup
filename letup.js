/**************************************************
 * 0. Lazy-load Supabase script on:
 *    - Scroll beyond 200px, or
 *    - 2 seconds timeout
 **************************************************/
let supabaseLoaded = false;
let scrollHandler;
let supabase; // Will hold our Supabase client
let realtimeSubscription; // Will hold our subscription
let rotatorData = [];
let isRotatorRunning = false;
let rotatorTimeout = null;

function lazyLoadSupabase() {
  if (supabaseLoaded) return; // Already loaded? do nothing
  supabaseLoaded = true;

  // Remove scroll listener
  window.removeEventListener("scroll", scrollHandler);

  // Dynamically load Supabase script
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = () => {
    // Now Supabase is loaded, we can initialize & subscribe
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

// 2) Time-based load (1 seconds)
setTimeout(lazyLoadSupabase, 1000);

/************************************************
 * 1. initSupabase() - Called once Supabase is loaded
 ************************************************/
function initSupabase() {
  // Initialize Supabase client
  const SUPABASE_URL = 'https://tsaaphhxqbsknszartza.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYWFwaGh4cWJza25zemFydHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MjEyNzAsImV4cCI6MjA1Njk5NzI3MH0.yQZgidrNuzheZ8oKgpWkl4n0Ha9WoJNbnIuu8IuhLaU';

  supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Initialize both notification systems
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

  // Update the displayed flag to prevent showing this notification again
  updateNotificationDisplayed(notification.id);

  // Determine notification type based on event_type and payment_status
  const isPaymentConfirmation =
    notification.event_type === 'order.updated' &&
    notification.payment_status === 'paid';

  if (isPaymentConfirmation) {
    // Payment confirmation notification
    showPaymentConfirmationToast(buyer, product, createdAt);
  } else {
    // Standard order notification
    const hhmm = createdAt ? formatHoursMinutes(createdAt) : "";
    showToast(buyer, product, hhmm);
  }
}

/************************************************
 * 3. Rotator Notifications System
 ************************************************/
async function fetchRotatorData() {
  try {
    // Fetch old notifications (7 days) that are payment confirmations
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
    
    rotatorData = data;
    
    // Randomize the order
    rotatorData.sort(() => Math.random() - 0.5);
    
    console.log(`Fetched ${rotatorData.length} entries for rotator notifications`);
    
    // Start the rotator if it's not already running and we have data
    if (!isRotatorRunning && rotatorData.length > 0) {
      isRotatorRunning = true;
      showNextRotatorNotification();
    }
  } catch (error) {
    console.error("Error fetching rotator data:", error);
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
 * 6. showToast() - Creates & displays a new toast
 ************************************************/
function showToast(buyer, product, hhmm) {
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
    const subtextEl = document.createElement("div");
    subtextEl.className = "toast-subtext";
    subtextEl.innerHTML = `
    <div class="toast-left"><span>Baru saja</span></div><div class="toast-right"><span>${hhmm}</span> 
    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" style=\"color:#2ebbef\" fill=\"currentColor\" class=\"bi bi-check-all\" viewBox=\"0 0 16 16\">
      <path d=\"M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z\"/>
    </svg></div>
  `;
    contentEl.appendChild(subtextEl);
  }

  toastEl.appendChild(contentEl);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.innerText = "x";
  closeBtn.addEventListener("click", () => {
    hideToast(toastEl);
  });
  toastEl.appendChild(closeBtn);

  // Append to container
  container.appendChild(toastEl);

  // Animate slide-down
  requestAnimationFrame(() => {
    toastEl.classList.add("show");
  });

  // Optionally auto-remove
  // setTimeout(() => hideToast(toastEl), 5000);
}

/************************************************
 * 7. showPaymentConfirmationToast() - For payment notifications
 ************************************************/
function showPaymentConfirmationToast(buyer, product, timestamp) {
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
  lottieEl.setAttribute("src", "https://lottie.host/64cf470d-6e24-4d37-9f19-7ea11b9e3bff/upEhnuCBXw.lottie");
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

  // Heading with payment confirmation message
  const headingEl = document.createElement("div");
  headingEl.className = "toast-heading";
  headingEl.innerHTML = `${buyer} telah transfer pembayaran untuk <strong>${product}</strong>!`;
  contentEl.appendChild(headingEl);

  // Subtext with relative time
  const subtextEl = document.createElement("div");
  subtextEl.className = "toast-subtext";

  // Get human-readable relative time
  const relativeTime = formatRelativeTime(timestamp);

  subtextEl.innerHTML = `
    <div class="toast-left"><span>${relativeTime}</span></div>
    <div class="toast-right">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="color:#2ebbef" fill="currentColor" class="bi bi-check-all" viewBox="0 0 16 16">
        <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/>
      </svg>
    </div>
  `;
  contentEl.appendChild(subtextEl);

  toastEl.appendChild(contentEl);

  /************************************************
   * Missing Function: Update Notification Status
   ************************************************/
  async function updateNotificationDisplayed(id) {
    try {
      await supabase
        .from('notifications')
        .update({ displayed: true })
        .eq('id', id);
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  }

  /************************************************
   * Missing Function: Initialize Rotator
   ************************************************/
  function initRotatorNotifications() {
    // Fetch initial data
    fetchRotatorData().then(() => {
      if (!isRotatorRunning && rotatorData.length > 0) {
        isRotatorRunning = true;
        showNextRotatorNotification();
      }
    });

    // Set up periodic refresh of data (e.g., every 5 minutes)
    setInterval(fetchRotatorData, 5 * 60 * 1000);
  }

  /************************************************
   * Missing Function: Show Next Rotator Notification
   ************************************************/
  function showNextRotatorNotification() {
    if (rotatorData.length === 0) {
      isRotatorRunning = false;
      return;
    }

    // Get the next item (or loop back to beginning)
    const item = rotatorData.shift();
    rotatorData.push(item); // Move to end of array to cycle through

    // Display the notification
    const buyer = item.buyer_name || "Seseorang";
    const productName = item.product_name || "produk ini";
    const createdAt = item.created_at;

    showPaymentConfirmationToast(buyer, productName, createdAt);

    // Schedule the next notification
    rotatorTimeout = setTimeout(showNextRotatorNotification, 5000);
  }

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.innerText = "x";
  closeBtn.addEventListener("click", () => {
    hideToast(toastEl);
  });
  toastEl.appendChild(closeBtn);

  // Append to container
  container.appendChild(toastEl);

  // Animate slide-down
  requestAnimationFrame(() => {
    toastEl.classList.add("show");
  });

  // Auto-remove after 5 seconds for rotator notifications
  setTimeout(() => hideToast(toastEl), 5000);
}

function hideToast(el) {
  el.classList.remove("show");
  el.classList.add("hide");
  setTimeout(() => {
    el.remove();
  }, 300);
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