<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Models\School;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Mission::with('inspector.user', 'school.commune')->latest();

        if ($request->filled('inspector_id')) {
            $query->where('inspector_id', $request->query('inspector_id'));
        }

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $user = $request->user();
        if ($user && $user->hasRole('inspecteur')) {
            $inspector = $user->inspector;
            if ($inspector) {
                $query->where('inspector_id', $inspector->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user && $user->hasRole('directeur_ecole')) {
            $school = School::where('user_id', $user->id)->first();
            if ($school) {
                $query->where('school_id', $school->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return $query
            ->join('schools', 'schools.id', '=', 'missions.school_id')
            ->orderBy('schools.name')
            ->select('missions.*')
            ->paginate(20);
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

        $activeMission = Mission::where('inspector_id', $data['inspector_id'])
            ->whereIn('status', ['planned', 'in_progress'])
            ->exists();

        if ($activeMission) {
            return response()->json([
                'message' => 'Cet inspecteur a deja une mission planifiee ou en cours. Il faut attendre l execution avant d en assigner une nouvelle.'
            ], 422);
        }

        $data['status'] = $data['status'] ?? 'planned';

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
