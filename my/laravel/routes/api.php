<?php

use App\Http\Controllers\TaskController;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

// Тестовий ендпоінт
Route::get('/ping', function () {
    return response()->json([
        'message' => 'pong',
        'timestamp' => now()->toISOString(),
    ]);
});

// apiResource -- один рядок замість п'яти
Route::apiResource('tasks', TaskController::class);
Route::apiResource('categories', CategoryController::class);

// Група з версією API
Route::prefix('v1')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);
});