/* ============================================================
 * scripts.js — Sophie Bluel Portfolio (Main Page)
 * 
 * Architecture:
 *   1. State & Constants          — Single source of truth
 *   2. Authentication UI          — Login/logout/banner logic
 *   3. Gallery Rendering           — Pure render function
 *   4. Filters                     — Category buttons + filtering
 *   5. Modal Management            — Open/close/view switching
 *   6. Delete Logic                — API call + DOM sync
 *   7. Upload Form & Creation      — Dynamic form + FormData POST
 *   8. Initialization              — Sequential boot sequence
 * ============================================================ */

// ---------------------------------------------------------------
// 1. STATE & CONSTANTS — Single source of truth for all data
// ---------------------------------------------------------------

/** @type {Array<Object>} Central array holding all works. 
 *  Every render, filter, add, or delete mutates THIS array first,
 *  then re-renders. No scattered DOM-only updates. */
let allWorks = [];

/** @type {Array<Object>} Cached categories from API. 
 *  Prevents re-fetching when opening the upload form later. */
let categories = [];

/** DOM references — queried once, reused everywhere. 
 *  Avoids repeated document.querySelectorAll calls during renders. */
const DOM = {
    gallery: document.querySelector(".gallery"),
    filtresContainer: document.querySelector(".filtres"),
    editionBanner: document.getElementById("edition-banner"),
    modifyBtn: document.getElementById("modify-projects"),
    loginLink: document.querySelector('nav ul li:nth-child(3)'),

    // Modal elements
    modalContainer: document.getElementById("modal-container"),
    modalGallery: document.querySelector(".modal-gallery"),
    galleryView: document.getElementById("modal-gallery-view"),
    dynamicContainer: document.getElementById("modal-dynamic-content"),
    btnAddPhoto: document.querySelector(".btn-add-photo"),
    closeBtn: document.querySelector(".js-modal-close"),
};

// ---------------------------------------------------------------
// 2. AUTHENTICATION UI — Token-based conditional rendering
// ---------------------------------------------------------------

/**
 * Reads token from localStorage and updates the entire UI:
 * - Shows/hides edition banner
 * - Shows/hides modify button  
 * - Sets login link text + behavior (login redirect vs logout)
 * 
 * Called on page load AND after any auth state change.
 */
function updateAuthUI() {
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token; // Coerce to boolean

    // --- Edition banner: visible only when logged in ---
    if (DOM.editionBanner) {
        DOM.editionBanner.classList.toggle("hidden", !isLoggedIn);
    }

    // --- Modify button: visible only when logged in ---
    if (DOM.modifyBtn) {
        DOM.modifyBtn.classList.toggle("hidden", !isLoggedIn);
    }

    // --- NEW: Filters container: hidden when logged in ---
    if (DOM.filtresContainer) {
        DOM.filtresContainer.classList.toggle("hidden", isLoggedIn);
    }

    // --- Login/Logout link ---
    if (DOM.loginLink) {
        if (isLoggedIn) {
            DOM.loginLink.textContent = "logout";
            DOM.loginLink.classList.add("cursor-pointer");

            // Remove any existing listeners by cloning (avoids duplicates)
            const newLink = DOM.loginLink.cloneNode(true);
            DOM.loginLink.parentNode.replaceChild(newLink, DOM.loginLink);
                                                // new.     old.  

            newLink.addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.reload(); // Full reload resets all state cleanly
            });

            // Update our cached reference after replacement
            Object.defineProperty(DOM, "loginLink", { value: newLink });

        } else {
            DOM.loginLink.textContent = "login";
            DOM.loginLink.classList.remove("cursor-pointer");

            // Remove existing listeners via clone trick
            const newLink = DOM.loginLink.cloneNode(true);
            DOM.loginLink.parentNode.replaceChild(newLink, DOM.loginLink);

            newLink.addEventListener("click", () => {
                window.location.href = "login.html";
            });

            Object.defineProperty(DOM, "loginLink", { value: newLink });
        }
    }
}

// ---------------------------------------------------------------
// 3. GALLERY RENDERING — Pure function: data → DOM
// ---------------------------------------------------------------

/**
 * Renders works into the main gallery.
 * 
 * WHY a pure function:
 * - Takes data as input, produces DOM output. No side effects.
 * - Can be called from: initial load, filter click, add success, delete success.
 * - Clears gallery first to prevent duplicates on re-render.
 * 
 * @param {Array<Object>} works - Array of work objects to display
 */
function renderGallery(works) {
    // Clear existing content — prevents duplicate figures on re-render
    DOM.gallery.innerHTML = "";

    works.forEach(work => {
        // Create figure wrapper with data-id for later DOM targeting
        const figure = document.createElement("figure");
        figure.setAttribute("data-id", work.id);

        // Create image element
        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        // Create caption element
        const figcaption = document.createElement("figcaption");
        figcaption.textContent = work.title;

        // Assemble: figure → img + figcaption → gallery
        figure.appendChild(img);
        figure.appendChild(figcaption);
        DOM.gallery.appendChild(figure);
    });
}

// ---------------------------------------------------------------
// 4. FILTERS — Dynamic category buttons + filtering logic
// ---------------------------------------------------------------

/**
 * Updates which filter button has the "active" class.
 * Only ONE button should be active at a time.
 * 
 * @param {HTMLElement} clickedBtn - The button that was just clicked
 */
function setActiveFilter(clickedBtn) {
    document.querySelectorAll(".btn-filtres").forEach(btn => {
        btn.classList.remove("active");
    });
    clickedBtn.classList.add("active");
}

/**
 * Builds filter buttons from the cached categories array.
 * 
 * Logic:
 * 1. Create a "Tous" (All) button that shows all works
 * 2. For each category, create a button that filters by categoryId
 * 3. "Tous" is active by default
 * 
 * WHY we cache categories:
 * - The upload form also needs the category dropdown.
 * - Fetching twice wastes bandwidth and introduces race conditions.
 */
function renderFilters() {
    if (!DOM.filtresContainer) return; // Safety: element might not exist

    DOM.filtresContainer.innerHTML = "";

    // --- "Tous" button (show everything) ---
    const btnAll = document.createElement("button");
    btnAll.textContent = "Tous";
    btnAll.classList.add("btn-filtres", "active"); // Active by default

    btnAll.addEventListener("click", () => {
        setActiveFilter(btnAll);
        renderGallery(allWorks); // Re-render with full array
    });

    DOM.filtresContainer.appendChild(btnAll);

    // --- Category buttons ---
    categories.forEach(category => {
        const btn = document.createElement("button");
        btn.textContent = category.name;
        btn.classList.add("btn-filtres");

        btn.addEventListener("click", () => {
            setActiveFilter(btn); // Single source of active-state logic

            // Filter the central array by matching categoryId
            const filtered = allWorks.filter(
                work => work.categoryId === category.id
            );

            renderGallery(filtered); // Re-render with filtered subset
        });

        DOM.filtresContainer.appendChild(btn);
    });
}

// ---------------------------------------------------------------
// 5. MODAL MANAGEMENT — Open, close, view switching
// ---------------------------------------------------------------

/**
 * Opens the modal: removes hidden class, sets ARIA attributes.
 * Also renders the modal gallery content on first open.
 */
function openModal() {
    DOM.modalContainer.classList.remove("hidden");
    DOM.modalContainer.removeAttribute("aria-hidden");
    DOM.modalContainer.setAttribute("aria-modal", "true");

    // Render modal gallery with current data
    renderModalGallery();

    // Ensure we're showing the gallery view, not the form
    DOM.galleryView.classList.remove("hidden");
    DOM.dynamicContainer.innerHTML = "";
}

/**
 * Closes the modal: adds hidden class, resets ARIA attributes.
 * 
 * @param {Event} e - Click event (may be from overlay or close button)
 */
function closeModal(e) {
    if (e) e.preventDefault();

    // Early return if already hidden — prevents double-close bugs
    if (DOM.modalContainer.classList.contains("hidden")) return;

    DOM.modalContainer.classList.add("hidden");
    DOM.modalContainer.setAttribute("aria-hidden", "true");
    DOM.modalContainer.removeAttribute("aria-modal");

    // Clean up dynamic content to prevent stale form state
    DOM.dynamicContainer.innerHTML = "";
}

/**
 * Renders works inside the modal gallery with delete buttons.
 * 
 * KEY DIFFERENCE from main gallery:
 * - Each figure has a trash icon for deletion
 * - Uses data-id attribute to correlate DOM → API resource
 */
function renderModalGallery() {
    if (!DOM.modalGallery) return;

    DOM.modalGallery.innerHTML = "";

    allWorks.forEach(work => {
        const figure = document.createElement("figure");
        figure.classList.add("modal-figure");
        figure.setAttribute("data-id", work.id);

        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        const trash = document.createElement("span");
        trash.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        trash.classList.add("modal-trash");

        // Attach delete handler (see Section 6)
        trash.addEventListener("click", () => handleDelete(work, figure));

        figure.appendChild(img);
        figure.appendChild(trash);
        DOM.modalGallery.appendChild(figure);
    });
}

// ---------------------------------------------------------------
// 6. DELETE LOGIC — API call + synchronized DOM update
// ---------------------------------------------------------------

/**
 * Handles work deletion: confirmation → API DELETE → state + DOM sync.
 * 
 * @param {Object} work - The work object to delete (contains .id and .title)
 * @param {HTMLElement} figureEl - The DOM element to remove from modal
 */
async function handleDelete(work, figureEl) {
    const confirmed = confirm(
        `Voulez-vous vraiment supprimer le projet "${work.title}" ?`
    );
    if (!confirmed) return; // User cancelled — do nothing

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `http://localhost:5678/api/works/${work.id}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        // --- State update: remove from central array ---
        allWorks = allWorks.filter(item => item.id !== work.id);

        // --- DOM update: remove from modal gallery ---
        figureEl.remove();

        // --- DOM update: re-render main gallery (respects active filter) ---
        renderGallery(allWorks);

    } catch (error) {
        console.error("Delete error:", error);
        alert("Erreur lors de la suppression. Vérifiez votre connexion.");
    }
}

// ---------------------------------------------------------------
// 7. UPLOAD FORM & CREATION — Dynamic form + FormData POST
// ---------------------------------------------------------------

/**
 * Dynamically creates the upload form and returns it as a DOM element.
 * 
 * WHY dynamic creation instead of static HTML:
 * - Form only exists when needed (saves DOM nodes)
 * - No stale state between modal opens/closes
 * - Category dropdown is populated from cached API data, not re-fetched
 * 
 * @returns {HTMLElement} The complete form view container
 */
function createUploadForm() {
    // --- Container for the entire form view ---
    const formView = document.createElement("div");
    formView.id = "modal-form-view";

    // --- Back button: returns to gallery view ---
    const btnBack = document.createElement("button");
    btnBack.classList.add("btn-back");
    btnBack.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';

    btnBack.addEventListener("click", () => {
        DOM.dynamicContainer.innerHTML = ""; // Remove form from DOM
        DOM.galleryView.classList.remove("hidden"); // Show gallery again
    });

    // --- Title for the form ---
    const title = document.createElement("h3");
    title.textContent = "Ajout photo";

    // --- The form element itself ---
    const form = document.createElement("form");
    form.id = "upload-form";

    // --- Image upload area (clickable container) ---
    const uploadContainer = document.createElement("div");
    uploadContainer.classList.add("upload-container");

    const imagePreview = document.createElement("div");
    imagePreview.id = "image-preview";

    const icon = document.createElement("i");
    icon.classList.add("fa-regular", "fa-image");

    const labelBtn = document.createElement("label");
    labelBtn.classList.add("upload-btn-label");
    labelBtn.textContent = "+ Ajouter photo";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "work-image";
    fileInput.name = "image";
    fileInput.accept = "image/jpg image/png";
    fileInput.style.display = "none"; // Hidden; container click triggers it
    // Clicking the container opens the file chooser
    uploadContainer.addEventListener("click", () => fileInput.click());

    // File selected → show preview using FileReader (native, no deps)
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.innerHTML = `<img src="${event.target.result}" alt="preview">`;
            uploadContainer.classList.add("has-preview");
        };
        reader.readAsDataURL(file); // Reads file as base64 data URL for preview
    });

    uploadContainer.appendChild(imagePreview);
    uploadContainer.appendChild(icon);
    uploadContainer.appendChild(labelBtn);
    uploadContainer.appendChild(fileInput);

    // --- Title input field ---
    const titleGroup = document.createElement("div");
    titleGroup.classList.add("form-group");

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Titre";

    const titleInput = document.createElement("input");
    titleInput.id = "work-title";
    titleInput.name = "title";
    titleInput.type = "text";
    titleInput.required = true;

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    // --- Category select dropdown ---
    const catGroup = document.createElement("div");
    catGroup.classList.add("form-group");

    const catLabel = document.createElement("label");
    catLabel.textContent = "Catégorie";

    const catSelect = document.createElement("select");
    catSelect.id = "work-category";
    catSelect.name = "category";
    catSelect.required = true;

    // Default placeholder option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choisissez une catégorie";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    catSelect.appendChild(defaultOption);

    // Populate from cached categories (no second API call needed)
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        catSelect.appendChild(option);
    });

    catGroup.appendChild(catLabel);
    catGroup.appendChild(catSelect);

    // --- Submit button ---
    const submitBtn = document.createElement("input");
    submitBtn.type = "submit";
    submitBtn.value = "Valider";

    // --- Assemble form children ---
    form.appendChild(uploadContainer);
    form.appendChild(titleGroup);
    form.appendChild(catGroup);
    form.appendChild(submitBtn);

    // --- FORM SUBMISSION HANDLER ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent page reload

        // Validate: ensure a file was actually selected
        if (!fileInput.files[0]) {
            alert("Veuillez sélectionner une image.");
            return;
        }

        // Build FormData — browser auto-sets multipart/form-data header
        const formData = new FormData();
        formData.append("image", fileInput.files[0]);
        formData.append("title", titleInput.value);
        formData.append("category", catSelect.value);

        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5678/api/works", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData // Content-Type set automatically by browser
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const newWork = await response.json();

            // --- State update: add to central array ---
            allWorks.push(newWork);

            // --- DOM updates: re-render both galleries ---
            renderGallery(allWorks);       // Main page gallery
            renderModalGallery();          // Modal gallery (now includes new work)

            // --- Reset form and return to gallery view ---
            DOM.dynamicContainer.innerHTML = "";
            DOM.galleryView.classList.remove("hidden");

        } catch (error) {
            console.error("Upload error:", error);
            alert("Erreur lors de l'ajout du projet.");
        }
    });

    // --- Assemble form view container ---
    formView.appendChild(btnBack);
    formView.appendChild(title);
    formView.appendChild(form);

    return formView;
}

// ---------------------------------------------------------------
// 8. INITIALIZATION — Sequential boot with proper ordering
// ---------------------------------------------------------------

/**
 * Main initialization function.
 * 
 * ORDER MATTERS:
 * 1. Update auth UI (runs synchronously, no API needed)
 * 2. Fetch works AND categories in parallel (independent calls)
 * 3. After BOTH resolve: render gallery + filters
 * 
 * WHY Promise.all:
 * - Works and categories are independent — no need to wait for one.
 * - Prevents race condition where filters render before works load.
 */
async function init() {
    // Step 1: Auth UI (synchronous, no wait needed)
    updateAuthUI();

    // Step 2: Fetch data in parallel
    try {
        const [worksResponse, categoriesResponse] = await Promise.all([
            fetch("http://localhost:5678/api/works"),
            fetch("http://localhost:5678/api/categories")
        ]);

        if (!worksResponse.ok || !categoriesResponse.ok) {
            throw new Error("Failed to fetch initial data");
        }

        allWorks = await worksResponse.json();
        categories = await categoriesResponse.json();

        // Step 3: Render everything now that data is ready
        renderGallery(allWorks);
        renderFilters();

    } catch (error) {
        console.error("Initialization error:", error);
    }

    // Step 4: Attach event listeners (runs regardless of fetch success)

    // Modify button → open modal
    if (DOM.modifyBtn) {
        DOM.modifyBtn.addEventListener("click", openModal);
    }

    // Close button → close modal
    if (DOM.closeBtn) {
        DOM.closeBtn.addEventListener("click", closeModal);
    }

    // Click on overlay (backdrop) → close modal
    DOM.modalContainer.addEventListener("click", (e) => {
        if (e.target === DOM.modalContainer) {
            closeModal(e);
        }
    });

    // "Add photo" button → show upload form inside modal
    if (DOM.btnAddPhoto) {
        DOM.btnAddPhoto.addEventListener("click", () => {
            DOM.galleryView.classList.add("hidden"); // Hide gallery view
            DOM.dynamicContainer.innerHTML = "";     // Clear any previous form
            const formElement = createUploadForm();  // Build fresh form
            DOM.dynamicContainer.appendChild(formElement);
        });
    }

    // Escape key → close modal (accessibility best practice)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !DOM.modalContainer.classList.contains("hidden")) {
            closeModal();
        }
    });
}

// Boot the application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
