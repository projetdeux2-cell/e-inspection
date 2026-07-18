<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commune extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'name',
        'code',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function schools()
    {
        return $this->hasMany(School::class);
    }
}
