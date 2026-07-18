<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'commune_id',
        'name',
        'code',
        'type',
        'address',
        'latitude',
        'longitude',
        'director_name',
        'phone',
        'email',
        'student_count',
    ];

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function teachers()
    {
        return $this->hasMany(Teacher::class);
    }

    public function missions()
    {
        return $this->hasMany(Mission::class);
    }
}
