<?php

namespace Database\Seeders;

use App\Models\Commune;
use App\Models\Department;
use Illuminate\Database\Seeder;

class CommuneSeeder extends Seeder
{
    public function run(): void
    {
        Commune::query()->delete();

        $communes = [
            'ALI' => ['Kandi', 'Banikoara', 'Gogounou', 'Malanville', 'Karimama', 'Segbana'],
            'ATA' => ['Natitingou', 'Boukoumbe', 'Cobly', 'Kerou', 'Materi', 'Pehunco', 'Tanguieta', 'Toucountouna'],
            'ATL' => ['Abomey-Calavi', 'Allada', 'Kpomasse', 'Ouidah', 'So-Ava', 'Toffo', 'Tori-Bossito', 'Ze'],
            'BOR' => ['Bembereke', 'Kalale', 'Nikki', 'Ndali', 'Parakou', 'Perere', 'Sinende', 'Tchaourou'],
            'COL' => ['Bante', 'Dassa-Zoume', 'Glazoue', 'Ouesse', 'Savalou', 'Save'],
            'COU' => ['Aplahoue', 'Djakotomey', 'Dogbo', 'Klouekanme', 'Lalo', 'Toviklin'],
            'DON' => ['Bassila', 'Copargo', 'Djougou', 'Ouake'],
            'LIT' => ['Cotonou'],
            'MON' => ['Athieme', 'Bopa', 'Come', 'Grand-Popo', 'Houeyogbe', 'Lokossa'],
            'OUE' => ['Adjohoun', 'Adjarra', 'Agueregues', 'Akpro-Misserete', 'Avrankou', 'Bonou', 'Dangbo', 'Porto-Novo', 'Seme-Kpodji'],
            'PLA' => ['Adja-Ouere', 'Ifangni', 'Idigny', 'Ketou', 'Pobe', 'Sakete'],
            'ZOU' => ['Abomey', 'Agbangnizoun', 'Bohicon', 'Cove', 'Djidja', 'Ouinhi', 'Za-Kpota', 'Zagnanado', 'Zogbodomey'],
        ];

        foreach ($communes as $departmentCode => $names) {
            $department = Department::where('code', $departmentCode)->first();

            if (! $department) {
                continue;
            }

            foreach ($names as $index => $name) {
                Commune::query()->create([
                    'department_id' => $department->id,
                    'name' => $name,
                    'code' => $departmentCode.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                ]);
            }
        }
    }
}
