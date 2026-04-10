<?php

/**
 * Local PHP code executor for the learning platform.
 * Run: php -S localhost:8088 app/server/executor.php
 *
 * Security: executes user code in a child process with restricted functions,
 * time limit and memory cap. NOT suitable for production — local dev only.
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
    echo json_encode(["error" => "Language '$language' is not supported by local executor"]);
    exit;
}

// --- Security: build a wrapper that restricts the child process ---
$disabledFunctions = implode(',', [
    'exec', 'shell_exec', 'system', 'passthru', 'popen', 'proc_open',
    'pcntl_exec', 'dl',
    'curl_init', 'curl_exec', 'curl_multi_exec',
    'fsockopen', 'pfsockopen', 'stream_socket_client', 'stream_socket_server',
    'mail', 'putenv', 'apache_setenv',
]);

$memoryLimit = '64M';
$timeLimit   = 5; // seconds

// Write code to temp file
$tmpFile = tempnam(sys_get_temp_dir(), 'php_exec_');
file_put_contents($tmpFile, $code);

$startTime = microtime(true);

// Build the php command with security flags
$phpBinary = PHP_BINARY;
$cmd = [
    $phpBinary,
    '-d', "disable_functions=$disabledFunctions",
    '-d', "memory_limit=$memoryLimit",
    '-d', "max_execution_time=$timeLimit",
    '-d', 'allow_url_fopen=0',
    '-d', 'allow_url_include=0',
    '-d', 'open_basedir=' . sys_get_temp_dir(),
    $tmpFile,
];

$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open($cmd, $descriptors, $pipes, null, null);

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

// Read stdout and stderr with timeout
stream_set_blocking($pipes[1], false);
stream_set_blocking($pipes[2], false);

$stdout = '';
$stderr = '';
$timedOut = false;

while (true) {
    $status = proc_get_status($process);
    if (!$status['running']) {
        // Process finished — drain remaining output
        $stdout .= stream_get_contents($pipes[1]);
        $stderr .= stream_get_contents($pipes[2]);
        break;
    }

    $elapsed = microtime(true) - $startTime;
    if ($elapsed > $timeLimit + 1) {
        // Kill the process if it exceeds the time limit
        proc_terminate($process, 9);
        $timedOut = true;
        break;
    }

    $stdout .= fread($pipes[1], 8192);
    $stderr .= fread($pipes[2], 8192);
    usleep(10000); // 10ms
}

fclose($pipes[1]);
fclose($pipes[2]);

$exitCode = proc_close($process);
$elapsedFinal = round(microtime(true) - $startTime, 3);

unlink($tmpFile);

if ($timedOut) {
    echo json_encode([
        'stdout' => $stdout,
        'stderr' => "Execution timed out after {$timeLimit} seconds",
        'exitCode' => 1,
        'time' => (string) $elapsedFinal,
        'memory' => 0,
        'status' => 'error',
    ]);
    exit;
}

$status = $exitCode === 0 ? 'success' : 'error';

echo json_encode([
    'stdout' => $stdout,
    'stderr' => $stderr,
    'exitCode' => $exitCode,
    'time' => (string) $elapsedFinal,
    'memory' => 0,
    'status' => $status,
]);
