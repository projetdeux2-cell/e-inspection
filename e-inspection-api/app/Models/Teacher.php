<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'name',
        'subject',
        'grade',
        'phone',
        'email',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
