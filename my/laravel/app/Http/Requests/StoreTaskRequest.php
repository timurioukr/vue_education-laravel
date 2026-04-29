<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    /**
     * Чи авторизований користувач для цього запиту.
     */
    public function authorize(): bool
    {
        return true; // Дозволяємо всім (авторизацію додамо пізніше)
    }

    /**
     * Правила валідації.
     */
    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status'      => ['required', 'in:pending,in_progress,done'],
            'priority'    => ['required', 'in:low,medium,high'],
            'deadline'    => ['nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tag_ids'     => ['nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * Кастомні повідомлення про помилки.
     */
    public function messages(): array
    {
        return [
            'title.required'          => 'Назва задачі обов\'язкова.',
            'title.min'               => 'Назва задачі мінімум :min символи.',
            'title.max'               => 'Назва задачі максимум :max символів.',
            'status.in'               => 'Статус: pending, in_progress або done.',
            'priority.in'             => 'Пріоритет: low, medium або high.',
            'deadline.after_or_equal' => 'Дедлайн не може бути в минулому.',
            'category_id.exists'      => 'Обрана категорія не існує.',
            'tag_ids.*.exists'        => 'Один з тегів не існує.',
        ];
    }
}