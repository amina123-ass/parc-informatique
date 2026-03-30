<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class VerifySetupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token'                          => 'required|string',
            'password'                       => 'required|string|min:8|confirmed',
            'questions'                      => 'required|array|size:3',
            'questions.*.question_id'        => 'required|integer|exists:security_question_options,id',
            'questions.*.answer'             => 'required|string|min:2|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'token.required'                   => 'Le token est manquant.',
            'password.required'                => 'Le mot de passe est obligatoire.',
            'password.min'                     => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed'               => 'Les mots de passe ne correspondent pas.',
            'questions.required'               => 'Les questions de sécurité sont obligatoires.',
            'questions.size'                   => 'Vous devez choisir exactement 3 questions.',
            'questions.*.question_id.required' => 'Veuillez sélectionner une question.',
            'questions.*.question_id.integer'  => 'Identifiant de question invalide.',
            'questions.*.question_id.exists'   => 'Cette question n\'existe pas.',
            'questions.*.answer.required'      => 'La réponse est obligatoire.',
            'questions.*.answer.min'           => 'La réponse doit contenir au moins 2 caractères.',
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Données invalides.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
