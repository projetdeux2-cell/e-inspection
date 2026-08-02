<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class SchoolController extends Controller
{
    public function index(Request $request)
    {
        $query = School::with(['commune.department', 'user'])->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'commune_id' => ['required', 'exists:communes,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:30', 'unique:schools,code'],
            'type' => ['nullable', 'in:public,private'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'director_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'student_count' => ['nullable', 'integer', 'min:0'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        return DB::transaction(function () use ($data) {
            $school = School::create($data);

            if (empty($data['user_id']) && !empty($data['director_name']) && !empty($data['email'])) {
                $role = Role::firstOrCreate(['name' => 'directeur_ecole', 'guard_name' => 'web']);

                $user = User::create([
                    'name' => $data['director_name'],
                    'email' => $data['email'],
                    'password' => Hash::make('password123'),
                ]);

                $user->assignRole($role);
                $school->update(['user_id' => $user->id]);
            }

            return response()->json($school->load(['commune.department', 'user']), 201);
        });
    }

    public function show(School $school)
    {
        return $school->load('commune.department', 'teachers', 'missions', 'user');
    }

    public function update(Request $request, School $school)
    {
        $data = $request->validate([
            'commune_id' => ['sometimes', 'required', 'exists:communes,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:30', 'unique:schools,code,'.$school->id],
            'type' => ['nullable', 'in:public,private'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'director_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'student_count' => ['nullable', 'integer', 'min:0'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $school->update($data);

        return $school->fresh(['commune.department', 'user']);
    }

    public function destroy(School $school)
    {
        $school->delete();

        return response()->noContent();
    }
}
