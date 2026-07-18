<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommuneController;
use App\Http\Controllers\CriterionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FollowUpController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\InspectorController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', DashboardController::class);

    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('communes', CommuneController::class);
    Route::apiResource('schools', SchoolController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('inspectors', InspectorController::class);
    Route::apiResource('missions', MissionController::class);
    Route::apiResource('criteria', CriterionController::class);
    Route::apiResource('inspections', InspectionController::class);
    Route::apiResource('evaluations', EvaluationController::class);
    Route::apiResource('recommendations', RecommendationController::class);
    Route::apiResource('follow-ups', FollowUpController::class);
    Route::apiResource('attachments', AttachmentController::class);
});
