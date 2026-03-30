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