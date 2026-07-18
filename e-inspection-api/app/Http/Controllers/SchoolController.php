<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function index()
    {
        return School::with('commune.department')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'commune_id' => ['required', 'exists:communes,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:30', 'unique:schools,code'],
            'type' => ['nullable', 'in:public,private'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'director_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'student_count' => ['nullable', 'integer', 'min:0'],
        ]);

        return response()->json(School::create($data), 201);
    }

    public function show(School $school)
    {
        return $school->load('commune.department', 'teachers', 'missions');
    }

    public function update(Request $request, School $school)
    {
        $data = $request->validate([
            'commune_id' => ['sometimes', 'required', 'exists:communes,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:30', 'unique:schools,code,'.$school->id],
            'type' => ['nullable', 'in:public,private'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'director_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'student_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $school->update($data);

        return $school->fresh('commune.department');
    }

    public function destroy(School $school)
    {
        $school->delete();

        return response()->noContent();
    }
}
