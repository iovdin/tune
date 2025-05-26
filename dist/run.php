<?php
// run.php

// Redirect PHP errors to STDERR
ini_set('display_errors', 'stderr');
error_reporting(E_ALL);

// Ensure the MessagePack extension is loaded
if (!extension_loaded('msgpack')) {
    fwrite(STDERR, "MessagePack extension is not loaded.\n```bash\n pecl install msgpack\n ```\n\n Then, enable it in your `php.ini`:\n\n ```ini\n extension=msgpack.so\n ```\n ");
    exit(1);
}

// Read JSON input from STDIN
$stdin = file_get_contents('php://stdin');
if ($stdin === false) {
    fwrite(STDERR, "Failed to read input.\n");
    exit(1);
}

$data = json_decode($stdin, true);
if ($data === null) {
    fwrite(STDERR, "Invalid JSON input.\n");
    exit(1);
}

// Extract required fields
$filename = isset($data['filename']) ? $data['filename'] : null;
$arguments = isset($data['arguments']) ? $data['arguments'] : [];
$ctx = isset($data['ctx']) ? $data['ctx'] : null;

// Validate filename
if ($filename === null) {
    fwrite(STDERR, "Filename not provided.\n");
    exit(1);
}

if (!file_exists($filename)) {
    fwrite(STDERR, "File '$filename' does not exist.\n");
    exit(1);
}

if (!is_readable($filename)) {
    fwrite(STDERR, "File '$filename' is not readable.\n");
    exit(1);
}

// Include the specified PHP file
// To prevent variable scope issues, use an isolated scope
$result = null;
try {
    // Define a unique namespace or use a temporary scope
    $includedFile = function($args) use ($filename) {
        // Assuming the included file defines a function `main`
        require_once $filename;
        if (!function_exists('main')) {
            throw new Exception("The file '$filename' does not define a 'main' function.");
        }
        return main($args);
    };

    // Execute the included file's main function
    $result = $includedFile($arguments);
} catch (Exception $e) {
    fwrite(STDERR, "Error executing '$filename': " . $e->getMessage() . "\n");
    exit(1);
}

// Encode the result using MessagePack
try {
    $packed = msgpack_pack($result);
    $hex = bin2hex($packed);
    fwrite(STDOUT, $hex);
} catch (Exception $e) {
    fwrite(STDERR, "Error encoding result with MessagePack: " . $e->getMessage() . "\n");
    exit(1);
}
?>
