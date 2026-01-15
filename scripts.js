// Fonction pour afficher l'heure actuelle
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    document.getElementById('currentTime').textContent = currentTime;
}

// Mise à jour de l'heure toutes les secondes
setInterval(updateTime, 1000);

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
});

window.addEventListener('load', function() {
    const randomImageElement = document.getElementById('randomImage');
    randomImageElement.src = 'random-image.php';
    randomImageElement.style.display = 'block';

});
