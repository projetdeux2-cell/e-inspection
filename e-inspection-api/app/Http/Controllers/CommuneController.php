<?php

namespace App\Http\Controllers;

use App\Models\Commune;
use Illuminate\Http\Request;

class CommuneController extends Controller
{
    public function index()
    {
        return Commune::with('department')->latest()->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', 'unique:communes,code'],
        ]);

        return response()->json(Commune::create($data), 201);
    }

    public function show(Commune $commune)
    {
        return $commune->load('department');
    }

    public function update(Request $request, Commune $commune)
    {
        $data = $request->validate([
            'department_id' => ['sometimes', 'required', 'exists:departments,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:10', 'unique:communes,code,'.$commune->id],
        ]);

        $commune->update($data);

        return $commune->fresh('department');
    }

    public function destroy(Commune $commune)
    {
        $commune->delete();

        return response()->noContent();
    }
}
