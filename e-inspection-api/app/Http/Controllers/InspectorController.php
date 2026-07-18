<?php

namespace App\Http\Controllers;

use App\Models\Inspector;
use Illuminate\Http\Request;

class InspectorController extends Controller
{
    public function index()
    {
        return Inspector::with('user')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'registration_number' => ['required', 'string', 'max:50', 'unique:inspectors,registration_number'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        return response()->json(Inspector::create($data), 201);
    }

    public function show(Inspector $inspector)
    {
        return $inspector->load('user', 'missions');
    }

    public function update(Request $request, Inspector $inspector)
    {
        $data = $request->validate([
            'user_id' => ['sometimes', 'required', 'exists:users,id'],
            'registration_number' => ['sometimes', 'required', 'string', 'max:50', 'unique:inspectors,registration_number,'.$inspector->id],
            'specialty' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $inspector->update($data);

        return $inspector->fresh('user');
    }

    public function destroy(Inspector $inspector)
    {
        $inspector->delete();

        return response()->noContent();
    }
}
