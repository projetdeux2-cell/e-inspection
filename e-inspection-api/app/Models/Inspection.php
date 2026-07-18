<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'mission_id',
        'inspection_date',
        'summary',
        'global_score',
        'signature_path',
        'report_path',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'global_score' => 'decimal:2',
    ];

    public function mission()
    {
        return $this->belongsTo(Mission::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class);
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
}
