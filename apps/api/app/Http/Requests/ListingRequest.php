<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->attributes->get('organization')->role, ['owner', 'manager', 'farmer']);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:160', 'product_category_id' => 'nullable|integer|exists:product_categories,id',
            'details' => 'required|array', 'details.variety' => 'nullable|string|max:120', 'details.description' => 'nullable|string|max:3000',
            'details.quantity' => 'nullable|string|regex:/^\d{1,12}(\.\d{1,3})?$/|gt:0', 'details.minimum' => 'nullable|string|regex:/^\d{1,12}(\.\d{1,3})?$/|gt:0|lte:details.quantity',
            'details.unit' => 'required|in:kg,tonne', 'details.grade' => 'nullable|string|max:80', 'details.harvest_date' => 'nullable|date',
            'details.country' => 'nullable|regex:/^[A-Z]{2}$/', 'details.province' => 'nullable|string|max:100', 'details.city' => 'nullable|string|max:100',
            'details.warehouse' => 'nullable|string|max:200', 'details.packaging' => 'nullable|string|max:200', 'details.ready_days' => 'nullable|integer|min:0|max:365',
            'details.price' => 'nullable|string|regex:/^\d{1,12}(\.\d{1,2})?$/', 'details.currency' => 'required|in:USD,EUR,CNY,INR,AED,IRR,RUB,BRL,ZAR',
        ];
    }
}
