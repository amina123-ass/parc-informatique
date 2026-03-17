<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS – Cross-Origin Resource Sharing
    |--------------------------------------------------------------------------
    | Autorise le frontend React (192.168.1.45:5173) à communiquer
    | avec l'API Laravel (192.168.1.45:8002).
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        // Ajout explicite de l'IP de production
        'http://192.168.1.45:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,
];