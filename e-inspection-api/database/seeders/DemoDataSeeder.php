<?php

namespace Database\Seeders;

use App\Models\Commune;
use App\Models\Inspection;
use App\Models\Inspector;
use App\Models\Mission;
use App\Models\Recommendation;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        collect([
            ['name' => 'Directeur Departemental', 'email' => 'direction@e-inspection.local', 'role' => 'directeur_departemental'],
            ['name' => 'Directeur Ecole', 'email' => 'ecole@e-inspection.local', 'role' => 'directeur_ecole'],
            ['name' => 'Enseignant Demo', 'email' => 'enseignant@e-inspection.local', 'role' => 'enseignant'],
        ])->each(function (array $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => 'password']
            );

            $user->assignRole($data['role']);
        });

        $inspectors = collect([
            ['name' => 'Koffi A. Mensah', 'email' => 'koffi.mensah@educinspect.bj', 'registration_number' => 'IP-2026-001', 'phone' => '+229 01 30 10 20'],
            ['name' => 'Aline Tossa', 'email' => 'aline.tossa@educinspect.bj', 'registration_number' => 'IP-2026-002', 'phone' => '+229 01 31 20 30'],
            ['name' => 'Nadine Soglo', 'email' => 'nadine.soglo@educinspect.bj', 'registration_number' => 'IP-2026-003', 'phone' => '+229 01 32 30 40'],
        ])->map(function (array $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => 'password']
            );

            $user->assignRole('inspecteur');

            return Inspector::updateOrCreate(
                ['registration_number' => $data['registration_number']],
                [
                    'user_id' => $user->id,
                    'specialty' => 'Inspection pedagogique primaire',
                    'phone' => $data['phone'],
                ]
            );
        });

        $schools = collect([
            ['commune' => 'Abomey', 'name' => 'Ecole Primaire Houeyiho 1', 'code' => 'EP-HOU-001', 'director_name' => 'Adjanohoun Samuel', 'student_count' => 215],
            ['commune' => 'Cove', 'name' => 'Ecole Primaire Djarra', 'code' => 'EP-DJA-002', 'director_name' => 'Mariam Dossou', 'student_count' => 184],
            ['commune' => 'Porto-Novo', 'name' => 'Ecole Primaire Ketonou', 'code' => 'EP-KET-003', 'director_name' => 'Emmanuel Hounkpe', 'student_count' => 238],
            ['commune' => 'Cotonou', 'name' => 'Ecole Primaire Wologuede', 'code' => 'EP-WOL-004', 'director_name' => 'Flore Agossou', 'student_count' => 302],
            ['commune' => 'Cotonou', 'name' => 'Ecole Primaire Tokpa', 'code' => 'EP-TOK-005', 'director_name' => 'Jean Zannou', 'student_count' => 196],
            ['commune' => 'Abomey-Calavi', 'name' => 'Ecole Primaire Zogbo', 'code' => 'EP-ZOG-006', 'director_name' => 'Clarisse Tchibozo', 'student_count' => 256],
        ])->map(function (array $data) {
            $commune = Commune::where('name', $data['commune'])->first() ?? Commune::first();

            return School::updateOrCreate(
                ['code' => $data['code']],
                [
                    'commune_id' => $commune->id,
                    'name' => $data['name'],
                    'type' => 'public',
                    'address' => $data['commune'],
                    'director_name' => $data['director_name'],
                    'phone' => '+229 01 45 67 89',
                    'email' => strtolower(str_replace(' ', '.', $data['code'])).'@educinspect.bj',
                    'student_count' => $data['student_count'],
                ]
            );
        });

        $missionRows = [
            ['school' => 'EP-HOU-001', 'inspector' => 0, 'planned_date' => '2026-05-15', 'effective_date' => null, 'status' => 'planned'],
            ['school' => 'EP-DJA-002', 'inspector' => 1, 'planned_date' => '2026-05-16', 'effective_date' => null, 'status' => 'planned'],
            ['school' => 'EP-KET-003', 'inspector' => 0, 'planned_date' => '2026-05-20', 'effective_date' => null, 'status' => 'in_progress'],
            ['school' => 'EP-WOL-004', 'inspector' => 2, 'planned_date' => '2026-05-12', 'effective_date' => '2026-05-12', 'status' => 'completed', 'score' => 82],
            ['school' => 'EP-TOK-005', 'inspector' => 1, 'planned_date' => '2026-05-10', 'effective_date' => '2026-05-10', 'status' => 'completed', 'score' => 65],
            ['school' => 'EP-ZOG-006', 'inspector' => 2, 'planned_date' => '2026-05-08', 'effective_date' => '2026-05-08', 'status' => 'completed', 'score' => 78],
        ];

        foreach ($missionRows as $index => $row) {
            $mission = Mission::updateOrCreate(
                [
                    'school_id' => $schools->firstWhere('code', $row['school'])->id,
                    'planned_date' => $row['planned_date'],
                ],
                [
                    'inspector_id' => $inspectors[$row['inspector']]->id,
                    'effective_date' => $row['effective_date'],
                    'status' => $row['status'],
                    'objective' => 'Evaluer la qualite des pratiques pedagogiques et le suivi des recommandations.',
                ]
            );

            if ($row['status'] === 'completed') {
                $inspection = Inspection::updateOrCreate(
                    ['mission_id' => $mission->id],
                    [
                        'inspection_date' => $row['effective_date'],
                        'summary' => 'Inspection realisee avec observation des classes, verification des documents et entretien avec la direction.',
                        'global_score' => $row['score'],
                        'report_path' => 'reports/rip-2026-00'.$index.'.pdf',
                    ]
                );

                foreach ([
                    'Renforcer la formation pedagogique des enseignants.',
                    'Mettre a jour les fiches de suivi des eleves.',
                    'Assurer un suivi regulier des recommandations.',
                ] as $description) {
                    Recommendation::firstOrCreate(
                        ['inspection_id' => $inspection->id, 'description' => $description],
                        ['priority' => 'medium', 'due_date' => '2026-06-30', 'status' => $index % 2 === 0 ? 'todo' : 'in_progress']
                    );
                }
            }
        }
    }
}
