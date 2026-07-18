<?php

namespace App\Http\Controllers;

use App\Models\Criterion;
use Illuminate\Http\Request;

class CriterionController extends Controller
{
    public function index()
    {
        return Criterion::orderBy('name')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:criteria,name'],
            'description' => ['nullable', 'string'],
            'max_score' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json(Criterion::create($data), 201);
    }

    public function show(Criterion $criterion)
    {
        return $criterion;
    }

    public function update(Request $request, Criterion $criterion)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:criteria,name,'.$criterion->id],
            'description' => ['nullable', 'string'],
            'max_score' => ['nullable', 'integer', 'min:1'],
        ]);

        $criterion->update($data);

        return $criterion->fresh();
    }

    public function destroy(Criterion $criterion)
    {
        $criterion->delete();

        return response()->noContent();
    }
}
