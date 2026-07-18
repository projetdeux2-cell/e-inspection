<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return Department::with('communes')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'code' => ['required', 'string', 'max:10', 'unique:departments,code'],
            'capital' => ['required', 'string', 'max:255'],
        ]);

        return response()->json(Department::create($data), 201);
    }

    public function show(Department $department)
    {
        return $department->load('communes');
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:departments,name,'.$department->id],
            'code' => ['sometimes', 'required', 'string', 'max:10', 'unique:departments,code,'.$department->id],
            'capital' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $department->update($data);

        return $department->fresh('communes');
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return response()->noContent();
    }
}
