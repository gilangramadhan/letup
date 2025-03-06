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

          // Extract mm:ss from the timestamp
          const mmss = createdAt ? formatMinutesSeconds(createdAt) : "";

          showToast(buyer, productName, mmss);
        });
      }

      /************************************************
       * 2. formatMinutesSeconds(): extracts mm:ss (24h)
       ************************************************/
      function formatMinutesSeconds(dateString) {
        const d = new Date(dateString);
        let minutes = d.getMinutes();
        let seconds = d.getSeconds();

        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;

        return `${minutes}:${seconds}`; // e.g. "09:07"
      }

      /************************************************
       * 3. showToast() - Creates & displays a new toast
       ************************************************/
      function showToast(buyer, product, mmss) {
        // Limit to max 3 toast elements
        const container = document.getElementById("toast-container");
        if (container.children.length >= 3) {
          // Remove the oldest toast
          container.removeChild(container.firstElementChild);
        }

        // Main toast element
        const toastEl = document.createElement("div");
        toastEl.className = "toast";

        // Logo (replace with your actual image URL)
        const logoImg = document.createElement("img");
        logoImg.src = "https://placehold.co/48x48/png";
        logoImg.alt = "User Logo";
        logoImg.className = "toast-logo";
        toastEl.appendChild(logoImg);

        // Content wrapper
        const contentEl = document.createElement("div");
        contentEl.className = "toast-content";

        // Heading
        // e.g. "Test Gilang baru saja membeli Testing Profis!"
        const headingEl = document.createElement("div");
        headingEl.className = "toast-heading";
        headingEl.innerHTML = `${buyer} baru saja checkout ${product}!`;
        contentEl.appendChild(headingEl);

        // If we have mm:ss, show subtext with inline image, right-aligned
        if (mmss) {
          const subtextEl = document.createElement("div");
          subtextEl.className = "toast-subtext";
          /* For example: "12:58 <img ...>" in grey, right-aligned */
          subtextEl.innerHTML = `
            <small style="color: #cccccc;">
              ${mmss}
            </small>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="color:#2ebbef" fill="currentColor" class="bi bi-check-all" viewBox="0 0 16 16">
  <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/>
</svg>
          `;
          contentEl.appendChild(subtextEl);
        }

        toastEl.appendChild(contentEl);

        // Close button with 'x'
        const closeBtn = document.createElement("button");
        closeBtn.className = "toast-close";
        closeBtn.innerText = "x";
        closeBtn.addEventListener("click", () => {
          hideToast(toastEl);
        });
        toastEl.appendChild(closeBtn);

        // Append to #toast-container
        container.appendChild(toastEl);

        // Trigger slide-down animation
        requestAnimationFrame(() => {
          toastEl.classList.add("show");
        });

        // OPTIONAL: auto-remove after 5 seconds
        // setTimeout(() => hideToast(toastEl), 5000);
      }

      // Slide up & remove
      function hideToast(el) {
        el.classList.remove("show");
        el.classList.add("hide");
        setTimeout(() => {
          el.remove();
        }, 300);
      }