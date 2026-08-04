<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function pdf(Request $request, Inspection $inspection)
    {
        $inspection->loadMissing('mission.school', 'evaluations.criterion', 'recommendations', 'mission.inspector.user');

        $reportPath = $inspection->report_path;
        if ($reportPath && Storage::disk('public')->exists($reportPath)) {
            $download = $request->boolean('download');
            $filename = basename($reportPath);
            $headers = [
                'Content-Type' => 'application/pdf',
                'Cache-Control' => 'no-store',
            ];

            if ($download) {
                return Storage::disk('public')->download($reportPath, $filename, $headers);
            }

            return response()->file(Storage::disk('public')->path($reportPath), [
                ...$headers,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
            ]);
        }

        return $this->renderInspectionPdf(
            $this->buildInspectionPdfData($inspection),
            $request->boolean('download')
        );
    }

    private function buildInspectionPdfData(Inspection $inspection): array
    {
        $schoolName = $inspection->mission?->school?->name ?? '';
        $teacherName = $inspection->mission?->inspector?->user?->name ?? $inspection->mission?->objective ?? '';
        $recommendations = $inspection->recommendations
            ? $inspection->recommendations->pluck('description')->filter()->values()->all()
            : [];

        return [
            'reference' => $inspection->report_path ? basename($inspection->report_path, '.pdf') : ('RIP-' . $inspection->id),
            'school' => $schoolName,
            'teacher' => $teacherName,
            'date' => optional($inspection->inspection_date)->format('Y-m-d'),
            'status' => $inspection->status ?? 'En cours',
            'preparation' => 0,
            'pedagogie' => 0,
            'gestion' => 0,
            'documents' => 0,
            'observations' => $inspection->summary ?? '',
            'recommendations' => implode("\n", $recommendations),
            'notes' => $inspection->summary ?? '',
            'global_score' => $inspection->global_score ?? 0,
            'signature_path' => $inspection->signature_path,
        ];
    }

    private function renderInspectionPdf(array $data, bool $download = false)
    {
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
        $disposition = $download ? 'attachment' : 'inline';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="' . $filename . '"',
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
