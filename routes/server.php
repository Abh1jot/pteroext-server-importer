<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use ServerImporter\Http\Controllers\ServerImporterController;

Route::post('/test-connection', [ServerImporterController::class, 'testConnection']);
Route::post('/list-remote', [ServerImporterController::class, 'listRemote']);
Route::post('/start', [ServerImporterController::class, 'startImport']);
Route::get('/status', [ServerImporterController::class, 'getStatus']);
Route::post('/cancel', [ServerImporterController::class, 'cancelImport']);
