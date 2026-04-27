<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $tasks = Task::query()->latest('id')->get();

        return response()->json($tasks);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,in_progress,done'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:5'],
            'deadline' => ['nullable', 'date'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $task = Task::query()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'priority' => $validated['priority'] ?? 0,
            'deadline' => $validated['deadline'] ?? null,
            'user_id' => User::query()->value('id'),
            'category_id' => $validated['category_id'] ?? null,
        ]);

        return response()->json($task, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $task = Task::query()->find($id);

        if (! $task) {
            return response()->json(
                ['message' => 'Task not found.'],
                Response::HTTP_NOT_FOUND
            );
        }

        return response()->json($task);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $task = Task::query()->find($id);

        if (! $task) {
            return response()->json(
                ['message' => 'Task not found.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'in:pending,in_progress,done'],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:5'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
        ]);

        $task->update($validated);

        return response()->json($task->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): Response
    {
        $task = Task::query()->find($id);

        if (! $task) {
            return response()->json(
                ['message' => 'Task not found.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $task->delete();

        return response()->noContent();
    }
}
