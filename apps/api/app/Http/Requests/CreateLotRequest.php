<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->attributes->get('organization')->role, ['owner', 'manager', 'trader', 'farmer']);
    }

    public function rules(): array
    {
        return [
            'product' => ['required', 'string', 'max:160'], 'origin_country' => ['required', 'regex:/^[A-Z]{2}$/'],
            'on_hand_kg' => ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,3})?$/', 'gt:0'],
            'minimum_order_kg' => ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,3})?$/', 'gt:0', 'lte:on_hand_kg'],
        ];
    }
}
