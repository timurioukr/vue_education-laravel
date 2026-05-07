<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Task::query()->latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $task = Task::query()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'pending',
            'priority' => $validated['priority'] ?? 0,
            'user_id' => auth()->id() ?? User::query()->value('id'),
        ]);

        return response()->json($task, Response::HTTP_CREATED);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json($task);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $task->update($request->validate($this->rules(sometimes: true)));

        return response()->json($task->fresh());
    }

    public function destroy(Task $task): Response
    {
        $task->delete();

        return response()->noContent();
    }

    private function rules(bool $sometimes = false): array
    {
        $req = $sometimes ? 'sometimes' : 'required';
        $opt = $sometimes ? 'sometimes' : 'nullable';

        return [
            'title' => [$req, 'string', 'max:255'],
            'description' => [$opt, 'string'],
            'status' => [$opt, 'in:pending,in_progress,done'],
            'priority' => [$opt, 'integer', 'min:0', 'max:5'],
            'deadline' => [$opt, 'date'],
            'category_id' => [$opt, 'integer', 'exists:categories,id'],
        ];
    }
}
