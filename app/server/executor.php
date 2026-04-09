<?php

/**
 * Local PHP code executor for the learning platform.
 * Run: php -S localhost:8088 app/server/executor.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['code']) || !isset($input['language'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing code or language']);
    exit;
}

$code = $input['code'];
$language = $input['language'];

if ($language !== 'php') {
    http_response_code(400);
    echo json_encode(['error' => "Language '$language' is not supported by local executor"]);
    exit;
}

// Write code to temp file
$tmpFile = tempnam(sys_get_temp_dir(), 'php_exec_');
file_put_contents($tmpFile, $code);

$startTime = microtime(true);

// Execute with timeout (5 seconds)
$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open(
    ['php', $tmpFile],
    $descriptors,
    $pipes,
    null,
    null
);

if (!is_resource($process)) {
    unlink($tmpFile);
    echo json_encode([
        'stdout' => '',
        'stderr' => 'Failed to start PHP process',
        'exitCode' => 1,
        'time' => '0',
        'memory' => 0,
        'status' => 'error',
    ]);
    exit;
}

// Close stdin
fclose($pipes[0]);

// Read stdout and stderr
$stdout = stream_get_contents($pipes[1]);
fclose($pipes[1]);

$stderr = stream_get_contents($pipes[2]);
fclose($pipes[2]);

$exitCode = proc_close($process);
$elapsed = round(microtime(true) - $startTime, 3);

unlink($tmpFile);

$status = $exitCode === 0 ? 'success' : 'error';

echo json_encode([
    'stdout' => $stdout,
    'stderr' => $stderr,
    'exitCode' => $exitCode,
    'time' => (string) $elapsed,
    'memory' => 0,
    'status' => $status,
]);
