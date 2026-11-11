<?php
declare(strict_types=1);

// Copy to /home/CPANEL_USERNAME/private/ecogrocer-config.php.
// Keep real credentials outside public_html and out of GitHub.
return [
    'dsn' => 'mysql:host=localhost;dbname=YOUR_DATABASE_NAME;charset=utf8mb4',
    'username' => 'YOUR_DATABASE_USER',
    'password' => 'YOUR_DATABASE_PASSWORD',
    'timezone' => 'Asia/Dhaka',
    'allowed_origins' => [
        'https://ecogrocerbd.netlify.app',
        // Add the exact custom website origin here too.
    ],
];
