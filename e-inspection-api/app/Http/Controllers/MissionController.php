<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    public function index()
    {
        return Mission::with('inspector.user', 'school.commune')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'inspector_id' => ['required', 'exists:inspectors,id'],
            'school_id' => ['required', 'exists:schools,id'],
            'planned_date' => ['required', 'date'],
            'effective_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:planned,in_progress,completed,cancelled'],
            'objective' => ['nullable', 'string'],
        ]);

        return response()->json(Mission::create($data), 201);
    }

    public function show(Mission $mission)
    {
        return $mission->load('inspector.user', 'school.commune', 'inspection');
    }

    public function update(Request $request, Mission $mission)
    {
        $data = $request->validate([
            'inspector_id' => ['sometimes', 'required', 'exists:inspectors,id'],
            'school_id' => ['sometimes', 'required', 'exists:schools,id'],
            'planned_date' => ['sometimes', 'required', 'date'],
            'effective_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:planned,in_progress,completed,cancelled'],
            'objective' => ['nullable', 'string'],
        ]);

        $mission->update($data);

        return $mission->fresh('inspector.user', 'school.commune');
    }

    public function destroy(Mission $mission)
    {
        $mission->delete();

        return response()->noContent();
    }
}
