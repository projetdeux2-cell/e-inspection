<?php

namespace Database\Seeders;

use App\Models\Commune;
use App\Models\Department;
use Illuminate\Database\Seeder;

class CommuneSeeder extends Seeder
{
    public function run(): void
    {
        $communes = [
            'ALI' => ['Kandi', 'Malanville', 'Banikoara'],
            'ATA' => ['Natitingou', 'Tanguieta', 'Boukoumbe'],
            'ATL' => ['Allada', 'Abomey-Calavi', 'Ouidah'],
            'BOR' => ['Parakou', 'Nikki', 'Bembereke'],
            'COL' => ['Dassa-Zoume', 'Savalou', 'Bante'],
            'COU' => ['Aplahoue', 'Dogbo', 'Klouekanme'],
            'DON' => ['Djougou', 'Bassila', 'Copargo'],
            'LIT' => ['Cotonou'],
            'MON' => ['Lokossa', 'Come', 'Grand-Popo'],
            'OUE' => ['Porto-Novo', 'Adjohoun', 'Avrankou'],
            'PLA' => ['Pobe', 'Sakete', 'Ketou'],
            'ZOU' => ['Abomey', 'Bohicon', 'Zagnanado'],
        ];

        foreach ($communes as $departmentCode => $names) {
            $department = Department::where('code', $departmentCode)->first();

            if (! $department) {
                continue;
            }

            foreach ($names as $index => $name) {
                Commune::firstOrCreate(
                    ['code' => $departmentCode.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT)],
                    ['department_id' => $department->id, 'name' => $name]
                );
            }
        }
    }
}
