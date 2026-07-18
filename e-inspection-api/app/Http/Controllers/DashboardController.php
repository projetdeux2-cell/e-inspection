<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\Inspector;
use App\Models\Mission;
use App\Models\Recommendation;
use App\Models\School;

class DashboardController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'schools' => School::count(),
            'inspectors' => Inspector::count(),
            'missions' => Mission::count(),
            'inspections' => Inspection::count(),
            'average_score' => round((float) Inspection::avg('global_score'), 2),
            'recommendations_todo' => Recommendation::where('status', 'todo')->count(),
            'recommendations_done' => Recommendation::where('status', 'done')->count(),
            'missions_by_status' => Mission::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }
}
