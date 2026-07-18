<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@e-inspection.local'],
            [
                'name' => 'Administrateur',
                'password' => 'password',
            ]
        );

        $admin->assignRole('admin');
    }
}
