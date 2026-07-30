<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $query = Teacher::with(['school', 'user'])->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'grade' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (! empty($data['email']) && ! empty($data['password'])) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => Hash::make($data['password'])]
            );

            if (! $user->hasRole('enseignant')) {
                $user->assignRole('enseignant');
            }

            $data['user_id'] = $user->id;
            unset($data['password']);
        } elseif (! empty($data['password'])) {
            unset($data['password']);
        }

        $teacher = Teacher::create($data);

        return response()->json($teacher->load(['school', 'user']), 201);
    }

    public function show(Teacher $teacher)
    {
        return $teacher->load(['school', 'user']);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $data = $request->validate([
            'school_id' => ['sometimes', 'required', 'exists:schools,id'],
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'grade' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (! empty($data['email']) && ! empty($data['password'])) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'] ?? $teacher->name, 'password' => Hash::make($data['password'])]
            );

            if (! $user->hasRole('enseignant')) {
                $user->assignRole('enseignant');
            }

            $data['user_id'] = $user->id;
            unset($data['password']);
        } elseif (array_key_exists('password', $data)) {
            unset($data['password']);
        }

        $teacher->update($data);

        return $teacher->fresh(['school', 'user']);
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->delete();

        return response()->noContent();
    }
}
