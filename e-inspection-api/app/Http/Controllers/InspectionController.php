<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;

class InspectionController extends Controller
{
    public function index()
    {
        return Inspection::query()
            ->with('mission.school', 'evaluations.criterion', 'recommendations')
            ->join('missions', 'missions.id', '=', 'inspections.mission_id')
            ->join('schools', 'schools.id', '=', 'missions.school_id')
            ->orderBy('schools.name')
            ->select('inspections.*')
            ->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mission_id' => ['required', 'exists:missions,id'],
            'inspection_date' => ['required', 'date'],
            'status' => ['sometimes', 'nullable', 'string'],
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
            'status' => ['sometimes', 'nullable', 'string'],
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

    public function exportPdf(Request $request)
    {
        $data = $request->validate([
            'reference' => ['required', 'string'],
            'school' => ['nullable', 'string'],
            'teacher' => ['nullable', 'string'],
            'date' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'preparation' => ['nullable', 'numeric'],
            'pedagogie' => ['nullable', 'numeric'],
            'gestion' => ['nullable', 'numeric'],
            'documents' => ['nullable', 'numeric'],
            'observations' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'global_score' => ['nullable', 'numeric'],
            'signature_path' => ['nullable', 'string'],
        ]);

        $score = (float) ($data['global_score'] ?? 0);
        $evalClass = $score >= 80 ? 'excellent' : ($score >= 60 ? 'bien' : ($score >= 40 ? 'moyen' : 'insuffisant'));
        $evalLabel = $score >= 80 ? 'Excellent' : ($score >= 60 ? 'Bien' : ($score >= 40 ? 'Moyen' : 'Insuffisant'));

        $recommendations = array_values(array_filter(array_map('trim', explode("\n", (string) ($data['recommendations'] ?? ''))), fn ($r) => $r !== ''));
        $signature = $this->resolveSignatureSrc($data['signature_path'] ?? null);

        $html = view('reports.report-pdf', [
            'report' => $data,
            'score' => $score,
            'evalClass' => $evalClass,
            'evalLabel' => $evalLabel,
            'recommendations' => $recommendations,
            'signature' => $signature,
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        $filename = 'rapport-' . preg_replace('/[^a-zA-Z0-9-_]/', '-', $data['reference'] ?? 'rapport') . '.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function resolveSignatureSrc(?string $src): ?string
    {
        if (!$src) {
            return null;
        }

        if (str_starts_with($src, 'data:')) {
            return $src;
        }

        if (preg_match('#^https?://#', $src)) {
            $host = parse_url($src, PHP_URL_HOST) ?? '';
            if (in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
                $path = parse_url($src, PHP_URL_PATH) ?? '';
                $local = public_path(ltrim($path, '/'));
                if (is_file($local)) {
                    return 'file:///' . str_replace('\\', '/', $local);
                }
            }
        }

        return $src;
    }
}
