<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'users.manage',
            'departments.manage',
            'communes.manage',
            'schools.manage',
            'teachers.manage',
            'inspectors.manage',
            'missions.manage',
            'inspections.manage',
            'recommendations.manage',
            'reports.view',
            'dashboard.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $departmentDirector = Role::firstOrCreate(['name' => 'directeur_departemental', 'guard_name' => 'web']);
        $inspector = Role::firstOrCreate(['name' => 'inspecteur', 'guard_name' => 'web']);
        $schoolDirector = Role::firstOrCreate(['name' => 'directeur_ecole', 'guard_name' => 'web']);
        $teacher = Role::firstOrCreate(['name' => 'enseignant', 'guard_name' => 'web']);

        $admin->syncPermissions([
            'users.manage',
            'departments.manage',
            'communes.manage',
            'schools.manage',
            'teachers.manage',
            'inspectors.manage',
            'dashboard.view',
        ]);

        $departmentDirector->syncPermissions([
            'departments.manage',
            'communes.manage',
            'schools.manage',
            'missions.manage',
            'reports.view',
            'dashboard.view',
        ]);
        $inspector->syncPermissions([
            'schools.manage',
            'teachers.manage',
            'missions.manage',
            'inspections.manage',
            'recommendations.manage',
            'reports.view',
            'dashboard.view',
        ]);
        $schoolDirector->syncPermissions([
            'recommendations.manage',
            'reports.view',
            'dashboard.view',
        ]);
        $teacher->syncPermissions(['reports.view']);
    }
}
