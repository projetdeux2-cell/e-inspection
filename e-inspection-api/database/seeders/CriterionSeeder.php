<?php

namespace Database\Seeders;

use App\Models\Criterion;
use Illuminate\Database\Seeder;

class CriterionSeeder extends Seeder
{
    public function run(): void
    {
        $criteria = [
            'Preparation des cours',
            'Methodes pedagogiques',
            'Gestion de classe',
            'Evaluation des eleves',
            'Ponctualite',
            'Utilisation du materiel didactique',
        ];

        foreach ($criteria as $criterion) {
            Criterion::firstOrCreate(
                ['name' => $criterion],
                ['max_score' => 20]
            );
        }
    }
}
