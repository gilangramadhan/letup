      /**************************************************
       * 0. Lazy-load Ably script on:
       *    - Scroll beyond 200px, or
       *    - 2 seconds timeout
       **************************************************/
      let ablyLoaded = false;
      let scrollHandler;

      function lazyLoadAbly() {
        if (ablyLoaded) return; // Already loaded? do nothing
        ablyLoaded = true;

        // Remove scroll listener
        window.removeEventListener("scroll", scrollHandler);

        // Dynamically load Ably script
        const script = document.createElement("script");
        script.src = "https://cdn.ably.com/lib/ably.min-1.js";
        script.onload = () => {
          // Now Ably is loaded, we can initialize & subscribe
          initAbly();
        };
        document.head.appendChild(script);
      }

      // 1) Scroll-based load
      scrollHandler = () => {
        if (window.scrollY > 200) {
          lazyLoadAbly();
        }
      };
      window.addEventListener("scroll", scrollHandler);

      // 2) Time-based load (2 seconds)
      setTimeout(lazyLoadAbly, 2000);

      /************************************************
       * 1. initAbly() - Called once Ably is loaded
       ************************************************/
      function initAbly() {
        const ably = new Ably.Realtime("diWh6A.KolcJg:A50xWiEf3-7heAWVYWGgFT4RPpzwOZi-1BuTXhj3_Go");
        const channel = ably.channels.get("scalev");

        channel.subscribe((message) => {
          const buyer = message.data?.data?.destination_address?.name || "Seseorang";
          const productName = message.data?.data?.orderlines?.[0]?.product_name || "produk ini";
          const createdAt = message.data?.data?.created_at; // e.g. "2025-03-06T02:58:01Z"

          // Extract hh:mm from the timestamp
          const hhmm = createdAt ? formatHoursMinutes(createdAt) : "";

          showToast(buyer, productName, hhmm);
        });
      }

      /************************************************
       * 2. formatHoursMinutes(): extracts hh:mm (24h)
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
       * 3. showToast() - Creates & displays a new toast
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
        headingEl.innerHTML = `${buyer} sudah checkout <strong>${product}</strong>!`;
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

      function hideToast(el) {
        el.classList.remove("show");
        el.classList.add("hide");
        setTimeout(() => {
          el.remove();
        }, 300);
      }
