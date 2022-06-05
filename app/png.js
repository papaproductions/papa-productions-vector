let titulo = document.getElementById("titulo");
let txtSize = document.getElementById("txtSize");
let width = document.getElementById("width");
let height = document.getElementById("height");
let form = document.getElementById("form");
let ratio = width.value / height.value;
vector.obtenerLocale().then(locale => {
    document.title = locale.pngConfigurationTitle.replace(/{appname}/, locale.appname);
    txtSize.innerHTML = locale.size;
});

width.addEventListener("keyup", () => {
    height.value = width.value / ratio;
});

height.addEventListener("keyup", () => {
    width.value = height.value * ratio;
});

form.addEventListener("submit", ev => {
    ev.preventDefault();
    vector.guardarImagen(parseInt(width.value), parseInt(height.value)).then(() => window.close());
});