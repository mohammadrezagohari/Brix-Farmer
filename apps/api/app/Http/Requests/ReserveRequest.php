<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReserveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->attributes->get('organization')->role, ['owner', 'manager', 'buyer', 'trader']);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
    }

    public function rules(): array
    {
        return ['quantity_kg' => ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,3})?$/', 'gt:0'], 'idempotency_key' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/']];
    }
}
