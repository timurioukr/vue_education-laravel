<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json([
    'message' => 'pong',
    'timestamp' => now()->toISOString(),
]));

Route::apiResource('tasks', TaskController::class);
Route::apiResource('categories', CategoryController::class);
