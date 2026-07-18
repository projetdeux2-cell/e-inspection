<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'criterion_id',
        'score',
        'comment',
    ];

    protected $casts = [
        'score' => 'decimal:2',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function criterion()
    {
        return $this->belongsTo(Criterion::class);
    }
}
