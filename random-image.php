<?php
    // Définir les répertoires pour les photos
    $rootDirectories = [
        "D:/Angelo/Photos/2025-05-31/202505__",
        "D:/Angelo/Photos/2025-05-31/202504__",
        "D:/Angelo/Photos/2025-05-31/202502__",
        "D:/Angelo/Photos/2025-05-31/202412__"
    ];

    // Fonction pour récupérer toutes les images dans un répertoire et ses sous-répertoires
    function getImagesFromDirectory($directory) {
        $images = [];

        if (!is_dir($directory)) {
            return $images;
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if ($file->isFile() && preg_match('/\.(jpg|jpeg|png|gif)$/i', $file->getFilename())) {
                $images[] = $file->getPathname();
            }
        }

        return $images;
    }

    $allImages = [];

    foreach ($rootDirectories as $rootDirectory) {
        $allImages = array_merge($allImages, getImagesFromDirectory($rootDirectory));
    }

    // Choisir une image au hasard
    if (!empty($allImages)) {
        $randomImage = $allImages[array_rand($allImages)];

        // Déterminer le bon type MIME
        $extension = strtolower(pathinfo($randomImage, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif'
        ];

        header('Content-Type: ' . ($mimeTypes[$extension] ?? 'image/jpeg'));
        readfile($randomImage);
    } else {
        header('Content-Type: text/plain');
        echo "Aucune image trouvée.";
    }
?>
