<?php
    $config = json_decode(file_get_contents(__DIR__ . '/config.json'), true);
    $rootDirectories = $config['photo_directories'] ?? [];

    // Function to retrieve all images in a directory and its subdirectories
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

    // Choose a random image
    if (!empty($allImages)) {
        $randomImage = $allImages[array_rand($allImages)];

        // Determine the correct MIME type
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
        echo "No image found.";
    }
?>
