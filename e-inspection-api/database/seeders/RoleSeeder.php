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
            'admin.dashboard',
            'users.manage',
            'departments.manage',
            'communes.manage',
            'schools.manage',
            'teachers.manage',
            'inspectors.manage',

            'direction.dashboard',
            'direction.statistics.view',
            'direction.reports.validate',
            'direction.recommendations.supervise',

            'inspector.dashboard',
            'inspector.missions.view',
            'inspector.inspections.create',
            'inspector.reports.create',
            'inspector.recommendations.create',

            'school.dashboard',
            'school.reports.view',
            'school.action_plan.manage',
            'school.observations.view',

            'teacher.dashboard',
            'teacher.observations.view',
            'teacher.actions.follow',
            'teacher.reports.view',
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
            'admin.dashboard',
            'users.manage',
            'departments.manage',
            'communes.manage',
            'schools.manage',
            'teachers.manage',
            'inspectors.manage',
        ]);

        $departmentDirector->syncPermissions([
            'direction.dashboard',
            'direction.statistics.view',
            'direction.reports.validate',
            'direction.recommendations.supervise',
        ]);
        $inspector->syncPermissions([
            'inspector.dashboard',
            'inspector.missions.view',
            'inspector.inspections.create',
            'inspector.reports.create',
            'inspector.recommendations.create',
        ]);
        $schoolDirector->syncPermissions([
            'school.dashboard',
            'school.reports.view',
            'school.action_plan.manage',
            'school.observations.view',
        ]);
        $teacher->syncPermissions([
            'teacher.dashboard',
            'teacher.observations.view',
            'teacher.actions.follow',
            'teacher.reports.view',
        ]);
    }
}
