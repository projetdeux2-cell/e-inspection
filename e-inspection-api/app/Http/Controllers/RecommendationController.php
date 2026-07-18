<?php

namespace App\Http\Controllers;

use App\Models\Recommendation;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index()
    {
        return Recommendation::with('inspection.mission.school', 'followUps')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'inspection_id' => ['required', 'exists:inspections,id'],
            'description' => ['required', 'string'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:todo,in_progress,done'],
        ]);

        return response()->json(Recommendation::create($data), 201);
    }

    public function show(Recommendation $recommendation)
    {
        return $recommendation->load('inspection.mission.school', 'followUps');
    }

    public function update(Request $request, Recommendation $recommendation)
    {
        $data = $request->validate([
            'inspection_id' => ['sometimes', 'required', 'exists:inspections,id'],
            'description' => ['sometimes', 'required', 'string'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:todo,in_progress,done'],
        ]);

        $recommendation->update($data);

        return $recommendation->fresh('inspection.mission.school', 'followUps');
    }

    public function destroy(Recommendation $recommendation)
    {
        $recommendation->delete();

        return response()->noContent();
    }
}
