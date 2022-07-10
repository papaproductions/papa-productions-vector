let titulo = document.getElementById("titulo");
let txtSize = document.getElementById("txt-size");
let txtBackground = document.getElementById("txt-background");
let background = document.getElementById("background");
let create = document.getElementById("create");
let width = document.getElementById("width");
let height = document.getElementById("height");
let form = document.getElementById("form");
let ratio = width.value / height.value;
vector.obtenerLocale().then(locale => {
    document.title = locale.proyectConfigurationTitle.replace(/{appname}/, locale.appname);
    txtSize.innerHTML = locale.size;
    txtBackground.innerHTML = locale.includeBackground;
    create.innerHTML = locale.createNewProject;
});

form.addEventListener("submit", ev => {
    ev.preventDefault();
    vector.nuevoProyecto(parseInt(width.value), parseInt(height.value), background.checked).then(() => window.close());
});
