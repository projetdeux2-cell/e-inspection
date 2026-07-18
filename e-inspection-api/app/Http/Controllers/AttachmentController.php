<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\Request;

class AttachmentController extends Controller
{
    public function index()
    {
        return Attachment::with('inspection')->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'inspection_id' => ['required', 'exists:inspections,id'],
            'name' => ['required', 'string', 'max:255'],
            'path' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:100'],
        ]);

        return response()->json(Attachment::create($data), 201);
    }

    public function show(Attachment $attachment)
    {
        return $attachment->load('inspection');
    }

    public function update(Request $request, Attachment $attachment)
    {
        $data = $request->validate([
            'inspection_id' => ['sometimes', 'required', 'exists:inspections,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'path' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:100'],
        ]);

        $attachment->update($data);

        return $attachment->fresh('inspection');
    }

    public function destroy(Attachment $attachment)
    {
        $attachment->delete();

        return response()->noContent();
    }
}
