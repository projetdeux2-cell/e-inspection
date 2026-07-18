<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'description',
        'priority',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function followUps()
    {
        return $this->hasMany(FollowUp::class);
    }
}
