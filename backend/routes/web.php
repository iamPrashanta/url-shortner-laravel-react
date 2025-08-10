<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LinkController;

// Public redirect route
Route::get('/{short}', [LinkController::class, 'redirectShort'])
    ->where('short', '[A-Za-z0-9]{1,6}');

Route::get('/', function () {
    return 'Laravel is working!';
});