//**maGallery */
const maGallery = document.querySelector(".gallery")
maGallery.innerHTML = "";

fetch("http://localhost:5678/api/works")
    .then(reponse => reponse.json())
    .then(projets => {
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

    });

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

        category.forEach(category => {
            const btn = document.createElement("button")
            btn.innerText = category.name;
            btn.classList.add("btn-filtres");
            mesFiltres.appendChild(btn);
        })    
});