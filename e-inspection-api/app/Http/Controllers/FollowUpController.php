<?php

namespace App\Http\Controllers;

use App\Models\FollowUp;
use Illuminate\Http\Request;

class FollowUpController extends Controller
{
    public function index()
    {
        return FollowUp::with('recommendation')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recommendation_id' => ['required', 'exists:recommendations,id'],
            'visit_date' => ['required', 'date'],
            'finding' => ['nullable', 'string'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'comment' => ['nullable', 'string'],
        ]);

        return response()->json(FollowUp::create($data), 201);
    }

    public function show(FollowUp $followUp)
    {
        return $followUp->load('recommendation');
    }

    public function update(Request $request, FollowUp $followUp)
    {
        $data = $request->validate([
            'recommendation_id' => ['sometimes', 'required', 'exists:recommendations,id'],
            'visit_date' => ['sometimes', 'required', 'date'],
            'finding' => ['nullable', 'string'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'comment' => ['nullable', 'string'],
        ]);

        $followUp->update($data);

        return $followUp->fresh('recommendation');
    }

    public function destroy(FollowUp $followUp)
    {
        $followUp->delete();

        return response()->noContent();
    }
}
