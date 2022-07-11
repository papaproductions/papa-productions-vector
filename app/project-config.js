let titulo = document.getElementById("titulo");
let txtSize = document.getElementById("txt-size");
let txtBackground = document.getElementById("txt-background");
let txtColor = document.getElementById("txt-color");
let background = document.getElementById("background");
let color = document.getElementById("color");
let create = document.getElementById("create");
let width = document.getElementById("width");
let height = document.getElementById("height");
let form = document.getElementById("form");
let ratio = width.value / height.value;
vector.obtenerLocale().then(locale => {
    document.title = locale.proyectConfigurationTitle.replace(/{appname}/, locale.appname);
    txtSize.innerHTML = locale.size;
    txtBackground.innerHTML = locale.includeBackground;
    txtColor.innerHTML = locale.backgroundColor;
    create.innerHTML = locale.createNewProject;
});

background.addEventListener("change", ev => {
    color.disabled = !background.checked;
});

form.addEventListener("submit", ev => {
    ev.preventDefault();
    vector.nuevoProyecto(parseInt(width.value), parseInt(height.value), background.checked ? color.value : undefined).then(() => window.close());
});
