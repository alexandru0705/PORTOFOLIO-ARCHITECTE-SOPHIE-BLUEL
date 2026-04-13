const token = localStorage.getItem("token");

if (token) {
    //**Affiche le bandeau noir */
    const banner = document.getElementById("edition-banner");
    if (banner) banner.style.display = "flex";
    //**Affiche le bouton modifier */
    const modifyBtn = document.getElementById("modify-projects");
    if (modifyBtn) modifyBtn.style.display = "inline-block";
}

const loginLink = document.querySelector('nav ul li:nth-child(3)');

if(localStorage.getItem("token")) {
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
            btnAll.addEventListener("click", () => {updateActiveBtn(btnAll); displayWorks(allWorks)});

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
    displayWorksInModal()  ;
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