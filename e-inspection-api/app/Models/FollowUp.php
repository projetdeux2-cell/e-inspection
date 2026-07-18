<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FollowUp extends Model
{
    use HasFactory;

    protected $fillable = [
        'recommendation_id',
        'visit_date',
        'finding',
        'progress',
        'comment',
    ];

    protected $casts = [
        'visit_date' => 'date',
    ];

    public function recommendation()
    {
        return $this->belongsTo(Recommendation::class);
    }
}
