<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // short_code optional; if provided, validate
        return [
            'original_url' => ['required', 'url', 'max:2000'],
            'short_code' => ['nullable', 'string', 'max:6', 'regex:/^[A-Za-z0-9]+$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'short_code.regex' => 'Short URL can only contain letters and digits.',
        ];
    }
}
