<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function index()
    {
        return User::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->paginate(50);
    }

    public function store(Request $request)
    {
        $roleNames = Role::query()->pluck('name')->all();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in($roleNames)],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->syncRoles([$data['role']]);

        return response()->json($user->load('roles:id,name'), 201);
    }

    public function update(Request $request, User $user)
    {
        $roleNames = Role::query()->pluck('name')->all();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'required', 'string', Rule::in($roleNames)],
        ]);

        $user->fill(collect($data)->only(['name', 'email'])->all());

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        if (! empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return response()->json($user->fresh('roles:id,name'));
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(null, 204);
    }
}
