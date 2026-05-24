<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$linksFile = __DIR__ . '/links.json';
$uploadDir = __DIR__ . '/img/uploads/';

if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

function loadLinks($file) {
    if (!file_exists($file)) return ['categories' => [[], [], []]];
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) return ['categories' => [[], [], []]];
    return $data;
}

function saveLinks($file, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $tmp = $file . '.tmp.' . getmypid();
    file_put_contents($tmp, $json, LOCK_EX);
    rename($tmp, $file);
}

function generateId() { return bin2hex(random_bytes(5)); }

function handleImageUpload($file, $uploadDir) {
    $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp'];
    if (!in_array($ext, $allowed)) return null;
    $filename = generateId() . '.' . $ext;
    $dest     = $uploadDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) return null;
    return 'img/uploads/' . $filename;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET: load all links
if ($method === 'GET' && $action === 'get') {
    echo json_encode(loadLinks($linksFile));
    exit;
}

// POST: add a link
if ($method === 'POST' && $action === 'add') {
    $data     = loadLinks($linksFile);
    $category = (int)($_POST['category'] ?? 0);
    $url      = trim($_POST['url'] ?? '');
    $alt      = trim($_POST['alt'] ?? 'Lien');

    if ($category < 0 || $category > 2 || empty($url)) {
        http_response_code(400); echo json_encode(['error' => 'Parametres invalides']); exit;
    }

    $imgPath = '';
    if (!empty($_FILES['image']['tmp_name'])) {
        $imgPath = handleImageUpload($_FILES['image'], $uploadDir);
        if ($imgPath === null) {
            http_response_code(400); echo json_encode(['error' => 'Fichier invalide']); exit;
        }
    }

    $entry = ['id' => generateId(), 'url' => $url, 'img' => $imgPath, 'alt' => $alt];
    $data['categories'][$category][] = $entry;
    saveLinks($linksFile, $data);
    echo json_encode(['success' => true, 'entry' => $entry]);
    exit;
}

// POST: edit a link
if ($method === 'POST' && $action === 'edit') {
    $data     = loadLinks($linksFile);
    $id       = $_POST['id'] ?? '';
    $category = (int)($_POST['category'] ?? -1);
    $url      = trim($_POST['url'] ?? '');
    $alt      = trim($_POST['alt'] ?? 'Lien');

    if (empty($id) || $category < 0 || $category > 2 || empty($url)) {
        http_response_code(400); echo json_encode(['error' => 'Parametres invalides']); exit;
    }

    foreach ($data['categories'][$category] as &$entry) {
        if ($entry['id'] === $id) {
            if (!empty($_FILES['image']['tmp_name'])) {
                if (!empty($entry['img']) && strpos($entry['img'], 'img/uploads/') === 0) {
                    $old = __DIR__ . '/' . $entry['img'];
                    if (file_exists($old)) unlink($old);
                }
                $imgPath = handleImageUpload($_FILES['image'], $uploadDir);
                if ($imgPath !== null) $entry['img'] = $imgPath;
            }
            $entry['url'] = $url;
            $entry['alt'] = $alt;
            saveLinks($linksFile, $data);
            echo json_encode(['success' => true, 'entry' => $entry]);
            exit;
        }
    }

    http_response_code(404); echo json_encode(['error' => 'Lien introuvable']); exit;
}

// POST: remove a link
if ($method === 'POST' && $action === 'delete') {
    $body     = json_decode(file_get_contents('php://input'), true);
    $id       = $body['id'] ?? '';
    $category = (int)($body['category'] ?? -1);

    if (empty($id) || $category < 0 || $category > 2) {
        http_response_code(400); echo json_encode(['error' => 'Parametres invalides']); exit;
    }

    $data = loadLinks($linksFile);
    foreach ($data['categories'][$category] as $i => $entry) {
        if ($entry['id'] === $id) {
            if (!empty($entry['img']) && strpos($entry['img'], 'img/uploads/') === 0) {
                $imgFile = __DIR__ . '/' . $entry['img'];
                if (file_exists($imgFile)) unlink($imgFile);
            }
            array_splice($data['categories'][$category], $i, 1);
            saveLinks($linksFile, $data);
            echo json_encode(['success' => true]); exit;
        }
    }

    http_response_code(404); echo json_encode(['error' => 'Lien introuvable']); exit;
}

// POST: reorder a category
if ($method === 'POST' && $action === 'reorder') {
    $body     = json_decode(file_get_contents('php://input'), true);
    $category = (int)($body['category'] ?? -1);
    $order    = $body['order'] ?? [];

    if ($category < 0 || $category > 2 || !is_array($order) || empty($order)) {
        http_response_code(400); echo json_encode(['error' => 'Parametres invalides']); exit;
    }

    $data  = loadLinks($linksFile);
    $items = $data['categories'][$category];

    $indexed = [];
    foreach ($items as $item) $indexed[$item['id']] = $item;

    $reordered = [];
    foreach ($order as $id) {
        if (isset($indexed[$id])) $reordered[] = $indexed[$id];
    }

    // Check that no elements are lost
    if (count($reordered) !== count($items)) {
        http_response_code(400); echo json_encode(['error' => 'Ordre incomplet']); exit;
    }

    $data['categories'][$category] = $reordered;
    saveLinks($linksFile, $data);
    echo json_encode(['success' => true]); exit;
}

// POST: Move a card between categories (or within the same category) using reorder.
if ($method === 'POST' && $action === 'move') {
    $body     = json_decode(file_get_contents('php://input'), true);
    $id       = $body['id']      ?? '';
    $srcCat   = (int)($body['srcCat'] ?? -1);
    $dstCat   = (int)($body['dstCat'] ?? -1);
    $dstOrder = $body['dstOrder'] ?? [];   // final order of the destination category
    $srcOrder = $body['srcOrder'] ?? [];   // final order of the source category (may be empty)

    if (empty($id) || $srcCat < 0 || $srcCat > 2 || $dstCat < 0 || $dstCat > 2) {
        http_response_code(400); echo json_encode(['error' => 'Parametres invalides']); exit;
    }

    $data = loadLinks($linksFile);

    // Find and extract the entry from the source
    $entry = null;
    foreach ($data['categories'][$srcCat] as $i => $e) {
        if ($e['id'] === $id) { $entry = $e; array_splice($data['categories'][$srcCat], $i, 1); break; }
    }
    if ($entry === null) {
        http_response_code(404); echo json_encode(['error' => 'Lien introuvable']); exit;
    }

    // Add to destination
    $data['categories'][$dstCat][] = $entry;

    // Reorder the destination according to dstOrder
    if (!empty($dstOrder)) {
        $indexed = [];
        foreach ($data['categories'][$dstCat] as $e) $indexed[$e['id']] = $e;
        $reordered = [];
        foreach ($dstOrder as $eid) { if (isset($indexed[$eid])) $reordered[] = $indexed[$eid]; }
        if (count($reordered) === count($data['categories'][$dstCat])) {
            $data['categories'][$dstCat] = $reordered;
        }
    }

    // Reorder the source according to srcOrder (if it is not empty)
    if ($srcCat !== $dstCat && !empty($srcOrder)) {
        $indexed = [];
        foreach ($data['categories'][$srcCat] as $e) $indexed[$e['id']] = $e;
        $reordered = [];
        foreach ($srcOrder as $eid) { if (isset($indexed[$eid])) $reordered[] = $indexed[$eid]; }
        if (count($reordered) === count($data['categories'][$srcCat])) {
            $data['categories'][$srcCat] = $reordered;
        }
    }

    saveLinks($linksFile, $data);
    echo json_encode(['success' => true]); exit;
}

http_response_code(400);
echo json_encode(['error' => 'Action inconnue']);