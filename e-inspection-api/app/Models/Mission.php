<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspector_id',
        'school_id',
        'planned_date',
        'effective_date',
        'status',
        'objective',
    ];

    protected $casts = [
        'planned_date' => 'date',
        'effective_date' => 'date',
    ];

    public function inspector()
    {
        return $this->belongsTo(Inspector::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function inspection()
    {
        return $this->hasOne(Inspection::class);
    }
}
