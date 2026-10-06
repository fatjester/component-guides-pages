document.addEventListener("DOMContentLoaded", () => {
  console.log("Sticky nav block script loaded.");

  const getScrollTopFor = (el, offset = 40) =>
    window.scrollY + el.getBoundingClientRect().top - offset;

  function generateStickyNavs() {
    document.querySelectorAll(".wp-block-stalwart-blocks-sticky-nav-group").forEach((navBlock) => {
      const navContainer = navBlock.querySelector("nav");
      const sections = navBlock.querySelectorAll(".sticky-nav-item");
      if (!navContainer || sections.length === 0) return;

      const ul = document.createElement("ul");
      ul.className = "sticky-nav-list";

      sections.forEach((section) => {
        const heading = section.querySelector(
          ".sticky-nav-section-heading h2, " +
          ".sticky-nav-section-heading h3, " +
          ".sticky-nav-section-heading h4, " +
          ".sticky-nav-section-heading h5, " +
          ".sticky-nav-section-heading h6"
        );
        const sectionId = section.getAttribute("id");
        if (!heading || !sectionId) return;

        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "sticky-nav-link";
        a.href = `#${sectionId}`;
        a.textContent = heading.textContent.trim();
        li.appendChild(a);
        ul.appendChild(li);
      });

      navContainer.innerHTML = "";
      navContainer.appendChild(ul);

      navContainer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const id = link.getAttribute("href").slice(1);
          const target = document.getElementById(id);
          if (!target) return;
          window.scrollTo({ top: getScrollTopFor(target, 40), behavior: "smooth" });
          history.pushState(null, "", `#${id}`);
        });
      });
    });
  }

  function primeBlocks() {
    document.querySelectorAll(".wp-block-stalwart-blocks-sticky-nav-group").forEach((block) => {
      if (!block.dataset.gridColumns) {
        block.dataset.gridColumns =
          block.style.gridTemplateColumns || "27% 1fr"; // matches your PHP fallback
      }
      // Mark current aside (if present) as desktop element so your CSS can target it
      const aside = block.querySelector(":scope > aside");
      if (aside) aside.classList.add("desktop-sticky-nav");
    });
  }

  function applyResponsive() {
    const isMobile = window.innerWidth <= (window.stickyNavBreakpoint ?? 992);

    document.querySelectorAll(".wp-block-stalwart-blocks-sticky-nav-group").forEach((block) => {
      const aside = block.querySelector(":scope > aside");
      const details = block.querySelector(":scope > details");

      if (isMobile) {
        // Container becomes flex via your CSS; no grid columns needed on mobile.
        block.style.removeProperty("grid-template-columns");

        // Convert to <details> if needed
        if (!details && aside) {
          const title = aside.querySelector(".sticky-nav-title");
          if (!title) return;

          const d = document.createElement("details");
          d.className = aside.className.replace("desktop-sticky-nav", "").trim();
          d.classList.add("mobile-sticky-nav");

          const summary = document.createElement("summary");
          summary.className = title.className;
          summary.textContent = title.textContent;

          const children = Array.from(aside.childNodes);
          children.forEach((n) => {
            if (n !== title) d.appendChild(n);
          });

          d.prepend(summary);
          block.replaceChild(d, aside);
        }
      } else {
        // Restore Grid columns exactly as set by PHP
        block.style.gridTemplateColumns = block.dataset.gridColumns;

        // Convert back to <aside>
        if (!aside && details) {
          const summary = details.querySelector("summary");
          const a = document.createElement("aside");
          a.className = details.className.replace("mobile-sticky-nav", "").trim();
          a.classList.add("desktop-sticky-nav");

          if (summary) {
            const p = document.createElement("p");
            p.className = summary.className;
            p.textContent = summary.textContent;
            a.appendChild(p);
          }
          const nav = details.querySelector("nav");
          if (nav) a.appendChild(nav);

          block.replaceChild(a, details);
        }
      }
    });
  }

  function scrollToHashOnLoad() {
    const id = location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    setTimeout(() => {
      window.scrollTo({ top: getScrollTopFor(target, 40), behavior: "smooth" });
    }, 100);
  }

  generateStickyNavs();
  primeBlocks();
  applyResponsive();
  scrollToHashOnLoad();
  window.addEventListener("resize", applyResponsive);
});