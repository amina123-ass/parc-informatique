<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifySetupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'questions'             => 'required|array|size:3',
            'questions.*.question'  => 'required|string|max:255',
            'questions.*.answer'    => 'required|string|max:255',
        ];
    }
}