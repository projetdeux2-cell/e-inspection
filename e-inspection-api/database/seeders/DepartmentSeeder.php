<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Alibori', 'code' => 'ALI', 'capital' => 'Kandi'],
            ['name' => 'Atacora', 'code' => 'ATA', 'capital' => 'Natitingou'],
            ['name' => 'Atlantique', 'code' => 'ATL', 'capital' => 'Allada'],
            ['name' => 'Borgou', 'code' => 'BOR', 'capital' => 'Parakou'],
            ['name' => 'Collines', 'code' => 'COL', 'capital' => 'Dassa-Zoume'],
            ['name' => 'Couffo', 'code' => 'COU', 'capital' => 'Aplahoue'],
            ['name' => 'Donga', 'code' => 'DON', 'capital' => 'Djougou'],
            ['name' => 'Littoral', 'code' => 'LIT', 'capital' => 'Cotonou'],
            ['name' => 'Mono', 'code' => 'MON', 'capital' => 'Lokossa'],
            ['name' => 'Oueme', 'code' => 'OUE', 'capital' => 'Porto-Novo'],
            ['name' => 'Plateau', 'code' => 'PLA', 'capital' => 'Pobe'],
            ['name' => 'Zou', 'code' => 'ZOU', 'capital' => 'Abomey'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}
