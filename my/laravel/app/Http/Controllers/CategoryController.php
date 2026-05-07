<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Category::query()->latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $category = Category::query()->create([
            ...$validated,
            'user_id' => auth()->id() ?? User::query()->value('id'),
        ]);

        return response()->json($category, Response::HTTP_CREATED);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $category->update($request->validate($this->rules(sometimes: true)));

        return response()->json($category->fresh());
    }

    public function destroy(Category $category): Response
    {
        $category->delete();

        return response()->noContent();
    }

    private function rules(bool $sometimes = false): array
    {
        $req = $sometimes ? 'sometimes' : 'required';
        $opt = $sometimes ? 'sometimes' : 'nullable';

        return [
            'name' => [$req, 'string', 'max:255'],
            'color' => [$opt, 'string', 'max:32'],
        ];
    }
}
