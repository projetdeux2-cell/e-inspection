<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'name',
        'path',
        'type',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }
}
