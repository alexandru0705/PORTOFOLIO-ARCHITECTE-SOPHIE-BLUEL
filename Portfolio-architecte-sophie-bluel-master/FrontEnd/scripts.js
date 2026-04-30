const token = localStorage.getItem("token");

if (token) {
    //**Affiche le bandeau noir */
    const banner = document.getElementById("edition-banner");
    if (banner) banner.style.display = "block";
    //**Affiche le bouton modifier */
    const modifyBtn = document.getElementById("modify-projects");
    if (modifyBtn) modifyBtn.style.display = "inline-block";
}

const loginLink = document.querySelector('nav ul li:nth-child(3)');

if (localStorage.getItem("token")) {
    loginLink.textContent = "logout";
    loginLink.style.cursor = "pointer";
    loginLink.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.reload();
    });
}
//**maGallery */
let allWorks = [];
const maGallery = document.querySelector(".gallery")
maGallery.innerHTML = "";

function displayWorks(projets) {
    maGallery.innerHTML = ""
    projets.forEach(projet => {
        //HTML Création
        const figure = document.createElement("figure");
        const image = document.createElement("img");
        image.src = projet.imageUrl; image.alt = projet.title;
        const figcaption = document.createElement("figcaption");
        figcaption.innerText = projet.title;
        //DOM Agencement
        maGallery.appendChild(figure)
        figure.appendChild(image)
        figure.appendChild(figcaption)
    })
}
fetch("http://localhost:5678/api/works")
    .then(reponse => reponse.json())
    .then(projets => {
        allWorks = projets;
        displayWorks(allWorks)
    });

//**function .active */
function updateActiveBtn(clickedBtn) {
    document.querySelectorAll(".btn-filtres").forEach(btn => btn.classList.remove("active"));
    clickedBtn.classList.add("active");
}

//**mesFiltres */   
const mesFiltres = document.querySelector(".filtres")
console.log(mesFiltres);

fetch("http://localhost:5678/api/categories")
    .then(response => response.json())
    .then(category => {
        const btnAll = document.createElement("button")
        btnAll.innerText = "Tous";
        btnAll.classList.add("btn-filtres");
        mesFiltres.appendChild(btnAll);
        btnAll.addEventListener("click", () => { updateActiveBtn(btnAll); displayWorks(allWorks) });

        category.forEach(category => {
            const btn = document.createElement("button")
            btn.innerText = category.name;
            btn.classList.add("btn-filtres");
            mesFiltres.appendChild(btn);

            btn.addEventListener("click", () => {
                updateActiveBtn(btn);
                document.querySelectorAll(".btn-filtres").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const filtered = allWorks.filter(work => work.categoryId === category.id);
                displayWorks(filtered);
            })
        })
    });

// --- GESTION DE LA MODALE ---

const modalContainer = document.getElementById("modal-container");
const modalGallery = document.querySelector(".modal-gallery");

// Fonction pour ouvrir la modale
const openModal = function (e) {
    e.preventDefault();
    modalContainer.style.display = "flex";
    modalContainer.removeAttribute('aria-hidden');
    modalContainer.setAttribute('aria-modal', 'true');

    // On remplit la galerie de la modale dès l'ouverture
    displayWorksInModal();
};

// Fonction pour fermer la modale
const closeModal = function (e) {
    if (modalContainer.style.display === "none") return;
    e.preventDefault();
    modalContainer.style.display = "none";
    modalContainer.setAttribute('aria-hidden', 'true');
    modalContainer.removeAttribute('aria-modal');
};

// Ecouteur d'événement sur le bouton "modifier"
// (On s'assure que le bouton existe avant d'ajouter l'écouteur)
const modifyBtn = document.getElementById("modify-projects");
if (modifyBtn) {
    modifyBtn.addEventListener("click", openModal);
}

// Ecouteurs pour fermer la modale
const closeBtn = document.querySelector(".js-modal-close");
if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
}

// Fermer en cliquant sur le fond sombre
modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) {
        closeModal(e);
    }
});

function displayWorksInModal() {
    if (!modalGallery) return;
    modalGallery.innerHTML = "";

    allWorks.forEach(work => {
        const figure = document.createElement("figure");
        figure.classList.add("modal-figure");

        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        const trash = document.createElement("span");
        trash.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        trash.classList.add("modal-trash");

        figure.appendChild(img);
        figure.appendChild(trash);
        modalGallery.appendChild(figure);
    });
}

// --- DYNAMIC MODAL LOGIC ---
const galleryView = document.getElementById("modal-gallery-view");
const dynamicContainer = document.getElementById("modal-dynamic-content");
const btnAddPhoto = document.querySelector(".btn-add-photo");

// Function to dynamically generate the Upload Form
function createUploadForm() {
    const formView = document.createElement("div");
    formView.id = "modal-form-view";

    const btnBack = document.createElement("button");
    btnBack.classList.add("btn-back");
    btnBack.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    btnBack.onclick = () => {
        dynamicContainer.innerHTML = "";
        galleryView.style.display = "block";
    };

    const title = document.createElement("h3");
    title.innerText = "Ajout photo";

    const form = document.createElement("form");
    form.id = "upload-form";

    // --- THE CUSTOM UPLOAD BOX (Figma Style) ---
    const uploadContainer = document.createElement("div");
    uploadContainer.classList.add("upload-container");

    const imagePreview = document.createElement("div");
    imagePreview.id = "image-preview";

    const icon = document.createElement("i");
    icon.classList.add("fa-regular", "fa-image");

    const labelBtn = document.createElement("label");
    labelBtn.classList.add("upload-btn-label");
    labelBtn.innerText = "+ Ajouter photo";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "work-image";
    fileInput.name = "image";
    fileInput.accept = "image/*";

    uploadContainer.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="preview">`;
                icon.style.display = "none";
                labelBtn.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    };

    uploadContainer.appendChild(imagePreview);
    uploadContainer.appendChild(icon);
    uploadContainer.appendChild(labelBtn);
    uploadContainer.appendChild(fileInput);

    // --- TITLE AND CATEGORY FIELDS ---
    const createField = (labelText, id, type = "text", isSelect = false) => {
        const group = document.createElement("div");
        group.classList.add("form-group");

        const label = document.createElement("label");
        label.innerText = labelText;

        const input = isSelect ? document.createElement("select") : document.createElement("input");
        input.id = id;
        input.name = id === "work-category" ? "category" : id;
        if (!isSelect) input.type = type;
        input.required = true;

        group.appendChild(label);
        group.appendChild(input);
        // CRITICAL: We return the input so we can use it later!
        return { group, input };
    };
    const titleField = createField("Titre", "work-title");
    const catField = createField("Catégorie", "work-category", "", true);

    const submitBtn = document.createElement("input");
    submitBtn.type = "submit";
    submitBtn.value = "Valider";

    form.appendChild(uploadContainer);
    form.appendChild(titleField.group); // Use .group here
    form.appendChild(catField.group);   // Use .group here
    form.appendChild(submitBtn);  // Appeler le Backend pour la creation d'un travail


    formView.appendChild(btnBack);
    formView.appendChild(title);
    formView.appendChild(form);
//.   ....
    const dataForm = new FormData();
    dataForm.append(FormData, )
//**** */
    // --- POPULATE THE CATEGORY DROPDOWN using the VARIABLE catField.input ---
    const categorySelect = catField.input; // No more document.getElementById!

    fetch("http://localhost:5678/api/categories")
        .then(response => response.json())
        .then(categories => {
            categorySelect.innerHTML = '<option value="" disabled selected>Choisissez une catégorie</option>';
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.innerText = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading categories for form:", error));

    return formView;
}



// Event listener to trigger the dynamic generation
btnAddPhoto.addEventListener("click", () => {
    galleryView.style.display = "none"; // Hide gallery
    dynamicContainer.innerHTML = ""; // Clear container
    const formElement = createUploadForm();
    dynamicContainer.appendChild(formElement); // Inject dynamic form
});

function displayWorksInModal() {
    if (!modalGallery) return;
    modalGallery.innerHTML = "";

    allWorks.forEach(work => {
        const figure = document.createElement("figure");
        figure.classList.add("modal-figure");
        // We add a data attribute to the figure so we can find it easily later for removal
        figure.setAttribute("data-id", work.id);

        const img = document.createElement("img");
        img.src = work.imageUrl;
        img.alt = work.title;

        const trash = document.createElement("span");
        trash.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        trash.classList.add("modal-trash");

        // --- DELETE LOGIC START ---
        trash.addEventListener("click", async () => {
            const confirmed = confirm(`Voulez-vous vraiment supprimer le projet "${work.title}" ?`);
            if (!confirmed) return;

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5678/api/works/${work.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}` // Crucial for API permission
                    }
                });

                if (response.ok) {
                    // 1. Update the local data array so filters still work
                    allWorks = allWorks.filter(item => item.id !== work.id);

                    // 2. Remove from Modal Gallery
                    figure.remove();

                    // 3. Remove from Main Homepage Gallery
                    // We look for the figure in maGallery that matches this ID
                    const mainPageFigure = document.querySelector(`.gallery figure:nth-child(${allWorks.indexOf(work) + 1})`);
                    // Since indices change after filtering, the safest way is to re-render 
                    // or search for a specific identifier. Let's trigger a fresh render:
                    displayWorks(allWorks);

                    alert("Projet supprimé avec succès !");
                } else {
                    alert("Erreur lors de la suppression. Vérifiez votre connexion.");
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert("Une erreur réseau est survenue.");
            }
        });
        // --- DELETE LOGIC END ---

        figure.appendChild(img);
        figure.appendChild(trash);
        modalGallery.appendChild(figure);
    });
}