<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Illuminate\Http\Request;

class InspectionController extends Controller
{
    public function index()
    {
        return Inspection::with('mission.school', 'evaluations.criterion', 'recommendations')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mission_id' => ['required', 'exists:missions,id'],
            'inspection_date' => ['required', 'date'],
            'summary' => ['nullable', 'string'],
            'global_score' => ['nullable', 'numeric', 'min:0'],
            'signature_path' => ['nullable', 'string', 'max:255'],
            'report_path' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(Inspection::create($data), 201);
    }

    public function show(Inspection $inspection)
    {
        return $inspection->load('mission.school', 'evaluations.criterion', 'recommendations.followUps', 'attachments');
    }

    public function update(Request $request, Inspection $inspection)
    {
        $data = $request->validate([
            'mission_id' => ['sometimes', 'required', 'exists:missions,id'],
            'inspection_date' => ['sometimes', 'required', 'date'],
            'summary' => ['nullable', 'string'],
            'global_score' => ['nullable', 'numeric', 'min:0'],
            'signature_path' => ['nullable', 'string', 'max:255'],
            'report_path' => ['nullable', 'string', 'max:255'],
        ]);

        $inspection->update($data);

        return $inspection->fresh('mission.school', 'evaluations.criterion', 'recommendations');
    }

    public function destroy(Inspection $inspection)
    {
        $inspection->delete();

        return response()->noContent();
    }
}
