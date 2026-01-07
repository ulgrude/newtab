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

// Fonction pour récupérer la date de la dernière remise à zéro
function getLastResetDate() {
    return localStorage.getItem('lastResetDate');
}

// Fonction pour sauvegarder la date de la dernière remise à zéro
function saveLastResetDate(date) {
    localStorage.setItem('lastResetDate', date);
}

// Fonction pour calculer le nombre de jours depuis la dernière remise à zéro
function calculateDaysSinceLastReset() {
    const lastResetDate = getLastResetDate();
    if (lastResetDate) {
        const lastDate = new Date(lastResetDate);
        const today = new Date();
        const timeDifference = today.getTime() - lastDate.getTime();
        return Math.floor(timeDifference / (1000 * 3600 * 24));
    } else {
        console.log('Aucune date');
        return 0;
    }
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('daysCounter') != null) {
        const daysSinceLastReset = calculateDaysSinceLastReset();
        document.getElementById('daysCounter').textContent = daysSinceLastReset;

        document.getElementById('resetButton').addEventListener('click', function() {
            const today = new Date().toISOString().split('T')[0];
            saveLastResetDate(today);
            document.getElementById('daysCounter').textContent = '0';
        });
    }

    updateTime();
});

window.addEventListener('load', function() {
    const randomImageElement = document.getElementById('randomImage');
    randomImageElement.src = 'random-image.php';
    randomImageElement.style.display = 'block';
});