<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        return Evaluation::with('inspection', 'criterion')->latest()->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'inspection_id' => ['required', 'exists:inspections,id'],
            'criterion_id' => ['required', 'exists:criteria,id'],
            'score' => ['required', 'numeric', 'min:0'],
            'comment' => ['nullable', 'string'],
        ]);

        return response()->json(Evaluation::create($data), 201);
    }

    public function show(Evaluation $evaluation)
    {
        return $evaluation->load('inspection', 'criterion');
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $data = $request->validate([
            'inspection_id' => ['sometimes', 'required', 'exists:inspections,id'],
            'criterion_id' => ['sometimes', 'required', 'exists:criteria,id'],
            'score' => ['sometimes', 'required', 'numeric', 'min:0'],
            'comment' => ['nullable', 'string'],
        ]);

        $evaluation->update($data);

        return $evaluation->fresh('inspection', 'criterion');
    }

    public function destroy(Evaluation $evaluation)
    {
        $evaluation->delete();

        return response()->noContent();
    }
}
